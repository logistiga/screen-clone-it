<?php

namespace App\Http\Controllers\Api\Automation;

use App\Http\Controllers\Api\Automation\Concerns\AutomationResponses;
use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Devis;
use App\Models\OrdreTravail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Lecture seule : OT, devis par numéro, listes par client, fiche client (Mora / n8n). */
class AutomationDocumentController extends Controller
{
    use AutomationResponses;

    public function ordre(string $numero): JsonResponse
    {
        $o = OrdreTravail::where('numero', $numero)->with(['client:id,nom', 'facture:id,ordre_id,numero,statut'])->first();
        return $o ? $this->ok($this->ot($o)) : $this->fail('NOT_FOUND', 'Ordre de travail introuvable.', 404);
    }

    public function ordresClient(Request $r, int $id): JsonResponse
    {
        if (!Client::whereKey($id)->exists()) {
            return $this->fail('NOT_FOUND', 'Client introuvable.', 404);
        }
        $q = OrdreTravail::where('client_id', $id);
        if ($r->filled('statut')) $q->where('statut', (string) $r->query('statut'));
        $total = (clone $q)->count();
        $rows = $q->with(['client:id,nom', 'facture:id,ordre_id,numero,statut'])
            ->orderByDesc('date_creation')->orderByDesc('id')->limit($this->limit($r))->get();
        return $this->ok($rows->map(fn ($o) => $this->ot($o))->all(), ['total' => $total]);
    }

    public function devis(string $numero): JsonResponse
    {
        $d = Devis::where('numero', $numero)->with(['client:id,nom', 'lignes', 'conteneurs', 'lots'])->first();
        if (!$d) {
            return $this->fail('NOT_FOUND', 'Devis introuvable.', 404);
        }
        $lien = AutomationPdfController::lienSigne($d);
        $clean = fn ($items) => collect($items)->map(fn ($m) => collect($m->toArray())->except(['deleted_at', 'created_at', 'updated_at'])->all())->all();
        return $this->ok($this->dv($d) + [
            'montant_ht' => $this->money($d->montant_ht),
            'tva' => $this->money($d->tva),
            'css' => $this->money($d->css),
            'lignes' => $clean($d->lignes),
            'conteneurs' => $clean($d->conteneurs),
            'lots' => $clean($d->lots),
            'url_pdf' => $lien['url'],
            'url_pdf_expire_le' => $lien['expire_le'],
        ]);
    }

    public function devisClient(Request $r, int $id): JsonResponse
    {
        if (!Client::whereKey($id)->exists()) {
            return $this->fail('NOT_FOUND', 'Client introuvable.', 404);
        }
        $q = Devis::where('client_id', $id);
        if ($r->filled('statut')) $q->where('statut', (string) $r->query('statut'));
        $total = (clone $q)->count();
        $rows = $q->with('client:id,nom')->orderByDesc('date_creation')->orderByDesc('id')->limit($this->limit($r))->get();
        return $this->ok($rows->map(fn ($d) => $this->dv($d))->all(), ['total' => $total]);
    }

    public function client(int $id): JsonResponse
    {
        $c = Client::find($id, ['id', 'nom', 'type', 'telephone', 'email', 'adresse', 'ville', 'pays', 'contact_principal', 'solde', 'limite_credit', 'nif', 'rccm']);
        if (!$c) {
            return $this->fail('NOT_FOUND', 'Client introuvable.', 404);
        }
        $data = $c->toArray();
        $data['solde'] = $this->money($c->solde);
        $data['limite_credit'] = $this->money($c->limite_credit);
        return $this->ok($data);
    }

    private function ot(OrdreTravail $o): array
    {
        return [
            'id' => $o->id,
            'numero' => $o->numero,
            'client_id' => $o->client_id,
            'client' => $o->client?->nom,
            'date_creation' => $o->date_creation,
            'categorie' => $o->categorie,
            'statut' => $o->statut,
            'montant_ttc' => $this->money($o->montant_ttc),
            'montant_paye' => $this->money($o->montant_paye),
            'reste_du' => $this->resteDu($o->montant_ttc, $o->montant_paye),
            'deja_facture' => $o->facture !== null,
            'facture_numero' => $o->facture?->numero,
        ];
    }

    private function dv(Devis $d): array
    {
        return [
            'id' => $d->id,
            'numero' => $d->numero,
            'client_id' => $d->client_id,
            'client' => $d->client?->nom,
            'date_creation' => $d->date_creation,
            'date_validite' => $d->date_validite,
            'categorie' => $d->categorie,
            'statut' => $d->statut,
            'montant_ttc' => $this->money($d->montant_ttc),
        ];
    }
}
