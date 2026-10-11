<?php

namespace App\Http\Controllers\Api\Automation;

use App\Http\Controllers\Api\Automation\Concerns\AutomationResponses;
use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Facture;
use App\Support\Creances;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Lecture seule : factures, relevé client, factures en retard (Mora / n8n). */
class AutomationFactureController extends Controller
{
    use AutomationResponses;

    private const COLS = ['id', 'numero', 'client_id', 'ordre_id', 'date_creation', 'date_echeance', 'statut', 'montant_ht', 'tva', 'css', 'montant_ttc', 'montant_paye'];

    public function show(string $numero): JsonResponse
    {
        $f = Facture::where('numero', $numero)
            ->with(['client:id,nom', 'lignes', 'conteneurs', 'lots', 'ordreTravail:id,numero'])->first(self::COLS);
        if (!$f) {
            return $this->fail('NOT_FOUND', 'Facture introuvable.', 404);
        }
        $lien = AutomationFacturePdfController::lienSigne($f);
        return $this->ok($this->ligne($f) + [
            'client' => $f->client?->nom,
            'ordre_numero' => $f->ordreTravail?->numero,
            'montant_ht' => $this->money($f->montant_ht),
            'tva' => $this->money($f->tva),
            'css' => $this->money($f->css),
            'lignes' => $this->clean($f->lignes),
            'conteneurs' => $this->clean($f->conteneurs),
            'lots' => $this->clean($f->lots),
            'url_pdf' => $lien['url'],
            'url_pdf_expire_le' => $lien['expire_le'],
        ]);
    }

    public function parClient(Request $r, int $id): JsonResponse
    {
        if (!Client::whereKey($id)->exists()) {
            return $this->fail('NOT_FOUND', 'Client introuvable.', 404);
        }
        if (($d = $this->dates($r)) === null) {
            return $this->fail('VALIDATION', 'Période invalide (format AAAA-MM-JJ, début ≤ fin).', 422);
        }
        $q = Facture::where('client_id', $id);
        if ($r->filled('statut')) {
            $q->where('statut', (string) $r->query('statut'));
        }
        if ($d[0]) $q->whereDate('date_creation', '>=', $d[0]);
        if ($d[1]) $q->whereDate('date_creation', '<=', $d[1]);
        $total = (clone $q)->count();
        $rows = $q->orderByDesc('date_creation')->orderByDesc('id')->limit($this->limit($r))->get(self::COLS);
        return $this->ok($rows->map(fn ($f) => $this->ligne($f))->all(), ['total' => $total]);
    }

    public function releve(Request $r, int $id): JsonResponse
    {
        $client = Client::find($id, ['id', 'nom']);
        if (!$client) {
            return $this->fail('NOT_FOUND', 'Client introuvable.', 404);
        }
        if (($d = $this->dates($r)) === null) {
            return $this->fail('VALIDATION', 'Période invalide (format AAAA-MM-JJ, début ≤ fin).', 422);
        }
        $exclus = array_merge(\App\Support\FactureStatut::ALIAS_ANNULEE, [\App\Support\FactureStatut::BROUILLON]);
        $q = Facture::where('client_id', $id)->whereNotIn('statut', $exclus);
        if ($d[0]) $q->whereDate('date_creation', '>=', $d[0]);
        if ($d[1]) $q->whereDate('date_creation', '<=', $d[1]);
        $rows = $q->orderBy('date_echeance')->get(self::COLS);

        $emis = $rows->sum(fn ($f) => $this->money($f->montant_ttc));
        $paye = $rows->sum(fn ($f) => min($this->money($f->montant_paye), $this->money($f->montant_ttc)));
        $echues = $rows->filter(fn ($f) => !in_array($f->statut, $this->statutsNonDus(), true)
            && $this->resteDu($f->montant_ttc, $f->montant_paye) > 0
            && Creances::joursRetard($f->date_echeance) > 0)->take(50);

        return $this->ok([
            'client' => ['id' => $client->id, 'nom' => $client->nom],
            'periode' => ['date_debut' => $d[0], 'date_fin' => $d[1]],
            'nb_factures' => $rows->count(),
            'total_emis' => $emis,
            'total_paye' => $paye,
            'reste_a_payer' => $rows->filter(fn ($f) => !in_array($f->statut, $this->statutsNonDus(), true))
                ->sum(fn ($f) => $this->resteDu($f->montant_ttc, $f->montant_paye)),
            'factures_echues' => $echues->map(fn ($f) => $this->ligne($f))->values()->all(),
        ]);
    }

    public function enRetard(Request $r): JsonResponse
    {
        $q = Facture::query()->whereNotIn('statut', $this->statutsNonDus())
            ->whereColumn('montant_paye', '<', 'montant_ttc')
            ->whereDate('date_echeance', '<', now()->toDateString());
        if ($r->filled('client_id')) {
            $q->where('client_id', (int) $r->query('client_id'));
        }
        $rows = $q->with('client:id,nom')->orderBy('date_echeance')->get(self::COLS);
        $data = $rows->map(fn ($f) => $this->ligne($f) + ['client' => $f->client?->nom])
            ->filter(fn ($l) => $l['reste_du'] > 0)->values();

        return $this->ok($data->take($this->limit($r))->all(), [
            'total' => $data->count(),
            'total_reste_du' => $data->sum('reste_du'),
        ]);
    }

    private function ligne(Facture $f): array
    {
        return [
            'id' => $f->id,
            'numero' => $f->numero,
            'client_id' => $f->client_id,
            'date_creation' => $f->date_creation,
            'date_echeance' => $f->date_echeance,
            'statut' => $f->statut,
            'montant_ttc' => $this->money($f->montant_ttc),
            'montant_paye' => $this->money($f->montant_paye),
            'reste_du' => $this->resteDu($f->montant_ttc, $f->montant_paye),
            'jours_retard' => Creances::joursRetard($f->date_echeance),
        ];
    }

    private function clean($items): array
    {
        return collect($items)->map(fn ($m) => collect($m->toArray())->except(['deleted_at', 'created_at', 'updated_at'])->all())->all();
    }
}
