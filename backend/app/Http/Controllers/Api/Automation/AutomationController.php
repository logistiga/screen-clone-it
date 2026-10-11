<?php

namespace App\Http\Controllers\Api\Automation;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDevisRequest;
use App\Models\Audit;
use App\Models\Client;
use App\Models\Devis;
use App\Models\Facture;
use App\Services\Devis\DevisServiceFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

/**
 * API machine n8n / Mora. Seule écriture : devis BROUILLON.
 * Aucun envoi client, conversion, facturation, paiement ou suppression.
 */
class AutomationController extends Controller
{
    public function __construct(private DevisServiceFactory $devisFactory) {}

    public function clients(Request $request): JsonResponse
    {
        $s = trim((string) $request->query('search', ''));
        if (mb_strlen($s) < 2) {
            return $this->fail('VALIDATION', 'Paramètre search requis (2 caractères min).', 422);
        }
        $rows = Client::query()
            ->where(fn ($q) => $q->where('nom', 'like', "%{$s}%")->orWhere('telephone', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%"))
            ->orderBy('nom')->limit(10)->get(['id', 'nom', 'telephone', 'email']);

        return $this->ok($rows->toArray());
    }

    public function historiquePrix(int $id): JsonResponse
    {
        if (!Client::whereKey($id)->exists()) {
            return $this->fail('NOT_FOUND', 'Client introuvable.', 404);
        }
        $devis = Devis::where('client_id', $id)->latest('id')->limit(10)
            ->with(['lignes:id,devis_id,type_operation,description,lieu_depart,lieu_arrivee,quantite,prix_unitaire',
                'conteneurs:id,devis_id,numero,taille,description,prix_unitaire',
                'lots:id,devis_id,numero_lot,description,quantite,prix_unitaire,prix_total'])
            ->get(['id', 'numero', 'categorie', 'date_creation', 'statut', 'montant_ht', 'montant_ttc']);

        return $this->ok($devis->toArray());
    }

    public function creerDevis(Request $request): JsonResponse
    {
        $idem = trim((string) $request->header('X-Idempotency-Key', ''));
        if ($idem === '' || mb_strlen($idem) > 100) {
            return $this->fail('VALIDATION', 'En-tête X-Idempotency-Key requis.', 422);
        }
        $client = (string) $request->attributes->get('automation_client');
        $cacheKey = 'automation:idem:' . hash('sha256', $client . '|' . $idem);

        if ($existingId = Cache::get($cacheKey)) {
            $devis = Devis::find($existingId);
            if ($devis) {
                return $this->ok($this->devisPayload($devis), ['replay' => true]);
            }
        }

        $payload = $request->except(['statut', 'id', 'numero']);
        $v = Validator::make($payload, (new StoreDevisRequest())->rules());
        if ($v->fails()) {
            return $this->fail('VALIDATION', 'Données invalides.', 422, $v->errors()->toArray());
        }

        $lock = Cache::lock($cacheKey . ':lock', 30);
        if (!$lock->get()) {
            return $this->fail('IN_PROGRESS', 'Requête identique déjà en cours.', 409);
        }
        try {
            $data = $v->validated();
            $data['statut'] = 'brouillon';
            $data['observation_interne'] = trim(($data['observation_interne'] ?? '') . "\n[Créé par automatisation : {$client}]");
            $devis = $this->devisFactory->creer($data);
            Cache::put($cacheKey, $devis->id, now()->addHours((int) config('automation.idempotency_ttl_hours', 24)));
            Audit::log('create', 'devis', "Devis brouillon créé par automatisation ({$client}) : {$devis->numero}", $devis);

            return $this->ok($this->devisPayload($devis->fresh()), [], 201);
        } catch (\Throwable $e) {
            Log::error('automation_devis', ['client' => $client, 'message' => $e->getMessage()]);
            return $this->fail('ERROR', 'Création du devis impossible.', 422);
        } finally {
            $lock->release();
        }
    }

    public function devis(int $id): JsonResponse
    {
        $devis = Devis::find($id);
        return $devis ? $this->ok($this->devisPayload($devis)) : $this->fail('NOT_FOUND', 'Devis introuvable.', 404);
    }

    public function facturesImpayees(Request $request): JsonResponse
    {
        $exclus = array_merge(\App\Support\FactureStatut::ALIAS_ANNULEE, [\App\Support\FactureStatut::PAYEE, 'Payée', 'payée']);
        $q = Facture::query()->whereNotIn('statut', $exclus)->whereColumn('montant_paye', '<', 'montant_ttc');
        if ($request->filled('client_id')) {
            $q->where('client_id', (int) $request->query('client_id'));
        }
        $rows = $q->with('client:id,nom')->orderBy('date_echeance')->limit(50)
            ->get(['id', 'numero', 'client_id', 'date_creation', 'date_echeance', 'montant_ttc', 'montant_paye', 'statut']);

        $data = $rows->map(function ($f) {
            $arr = $f->toArray();
            $arr['reste_du'] = max(0, (int) round((float) $f->montant_ttc - (float) $f->montant_paye));
            return $arr;
        })->values()->all();

        return $this->ok($data);
    }

    private function devisPayload(Devis $d): array
    {
        $front = rtrim((string) config('automation.frontend_url'), '/');
        return [
            'id' => $d->id,
            'numero' => $d->numero,
            'statut' => $d->statut,
            'client_id' => $d->client_id,
            'montant_ht' => round((float) $d->montant_ht),
            'tva' => round((float) $d->tva),
            'css' => round((float) $d->css),
            'montant_ttc' => round((float) $d->montant_ttc),
            'url_validation' => "{$front}/devis/{$d->id}",
            'url_pdf' => ($lien = AutomationPdfController::lienSigne($d))['url'],
            'url_pdf_expire_le' => $lien['expire_le'],
        ];
    }

    private function ok(array $data, array $meta = [], int $status = 200): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $data, 'meta' => (object) $meta], $status, [], JSON_INVALID_UTF8_SUBSTITUTE);
    }

    private function fail(string $code, string $msg, int $status, array $details = []): JsonResponse
    {
        return response()->json(['success' => false, 'error' => array_filter(['code' => $code, 'message' => $msg, 'details' => $details])], $status);
    }
}
