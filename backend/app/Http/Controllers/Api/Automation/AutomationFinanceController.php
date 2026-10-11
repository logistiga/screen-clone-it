<?php

namespace App\Http\Controllers\Api\Automation;

use App\Http\Controllers\Api\Automation\Concerns\AutomationResponses;
use App\Http\Controllers\Controller;
use App\Models\Banque;
use App\Models\Facture;
use App\Models\MouvementCaisse;
use App\Models\Paiement;
use App\Services\CaisseService;
use App\Support\Creances;
use App\Support\FactureStatut;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Lecture seule : soldes caisse/banques, mouvements, statistiques (Mora / n8n). */
class AutomationFinanceController extends Controller
{
    use AutomationResponses;

    private const PERIODES = ['jour', 'semaine', 'mois', '6mois', 'annee'];

    public function __construct(private CaisseService $caisse) {}

    public function solde(): JsonResponse
    {
        $caisse = $this->money($this->caisse->getSoldeCaisse());
        $banques = Banque::orderBy('nom')->get(['id', 'nom', 'numero_compte', 'solde', 'actif'])
            ->map(fn ($b) => ['id' => $b->id, 'nom' => $b->nom, 'numero_compte' => $b->numero_compte,
                'actif' => (bool) $b->actif, 'solde' => $this->money($b->solde)]);
        $totalBanques = $banques->sum('solde');

        return $this->ok([
            'solde_caisse' => $caisse,
            'solde_banques' => $banques->values()->all(),
            'total_banques' => $totalBanques,
            'solde_global' => $caisse + $totalBanques,
            'date_calcul' => now()->toIso8601String(),
        ]);
    }

    public function mouvements(Request $r): JsonResponse
    {
        if (($d = $this->dates($r)) === null) {
            return $this->fail('VALIDATION', 'Période invalide (format AAAA-MM-JJ, début ≤ fin).', 422);
        }
        $type = $r->query('type');
        if ($type !== null && !in_array($type, ['entree', 'sortie'], true)) {
            return $this->fail('VALIDATION', 'type doit valoir entree ou sortie.', 422);
        }
        $q = MouvementCaisse::query();
        if ($type) $q->where('type', $type);
        if ($d[0]) $q->whereDate('date', '>=', $d[0]);
        if ($d[1]) $q->whereDate('date', '<=', $d[1]);

        $entrees = $this->money((clone $q)->where('type', 'entree')->sum('montant'));
        $sorties = $this->money((clone $q)->where('type', 'sortie')->sum('montant'));
        $total = (clone $q)->count();
        $rows = $q->with('banque:id,nom')->orderByDesc('date')->orderByDesc('id')->limit($this->limit($r))
            ->get(['id', 'type', 'montant', 'date', 'description', 'source', 'banque_id', 'categorie', 'beneficiaire', 'mode_paiement', 'reference'])
            ->map(fn ($m) => [
                'id' => $m->id, 'date' => $m->date?->toDateString(), 'type' => $m->type,
                'montant' => $this->money($m->montant), 'source' => $m->source, 'banque' => $m->banque?->nom,
                'categorie' => $m->categorie, 'description' => $m->description, 'beneficiaire' => $m->beneficiaire,
                'mode_paiement' => $m->mode_paiement, 'reference' => $m->reference,
            ]);

        return $this->ok($rows->all(), ['total' => $total, 'total_entrees' => $entrees, 'total_sorties' => $sorties]);
    }

    public function stats(Request $r): JsonResponse
    {
        $p = (string) $r->query('periode', 'mois');
        if (!in_array($p, self::PERIODES, true)) {
            return $this->fail('VALIDATION', 'periode doit valoir jour, semaine, mois, 6mois ou annee.', 422);
        }
        $fin = now()->endOfDay();
        $debut = match ($p) {
            'jour' => now()->startOfDay(),
            'semaine' => now()->startOfWeek(),
            'mois' => now()->startOfMonth(),
            '6mois' => now()->subMonths(6)->startOfDay(),
            'annee' => now()->startOfYear(),
        };
        $range = [$debut->toDateString(), $fin->toDateString()];
        $fact = Facture::whereNotIn('statut', array_merge(FactureStatut::ALIAS_ANNULEE, [FactureStatut::BROUILLON]))
            ->whereBetween('date_creation', $range);
        $encaissements = $this->money(Paiement::whereBetween('date', $range)->sum('montant'));
        $depenses = $this->money(MouvementCaisse::where('type', 'sortie')->whereBetween('date', $range)->sum('montant'));

        return $this->ok([
            'periode' => $p,
            'date_debut' => $range[0],
            'date_fin' => $range[1],
            'nb_factures' => (clone $fact)->count(),
            'chiffre_affaires_ht' => $this->money((clone $fact)->sum('montant_ht')),
            'chiffre_affaires_ttc' => $this->money((clone $fact)->sum('montant_ttc')),
            'encaissements' => $encaissements,
            'reste_a_encaisser' => $this->money(Creances::total()),
            'depenses' => $depenses,
            'solde_net' => $encaissements - $depenses,
        ]);
    }
}
