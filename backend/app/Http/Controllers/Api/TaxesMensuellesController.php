<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Audit;
use App\Models\Configuration;
use App\Models\Facture;
use App\Models\TaxeMensuelle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class TaxesMensuellesController extends Controller
{
    /**
     * Récupérer les taux de taxes configurés avec détails
     */
    public function getTaxesConfig(): JsonResponse
    {
        $config = Configuration::getValue('taxes') ?? [];
        
        $taxes = [
            [
                'id' => '1',
                'code' => 'TVA',
                'nom' => 'Taxe sur la Valeur Ajoutée',
                'taux' => (float) ($config['tva_taux'] ?? 18),
                'description' => 'Taxe applicable sur toutes les prestations de services',
                'obligatoire' => true,
                'active' => (bool) ($config['tva_actif'] ?? true),
            ],
            [
                'id' => '2',
                'code' => 'CSS',
                'nom' => 'Contribution Spéciale de Solidarité',
                'taux' => (float) ($config['css_taux'] ?? 1),
                'description' => 'Contribution au titre de la solidarité nationale',
                'obligatoire' => true,
                'active' => (bool) ($config['css_actif'] ?? true),
            ],
        ];
        
        return response()->json([
            'data' => $taxes,
            'taux_tva' => (float) ($config['tva_taux'] ?? 18),
            'taux_css' => (float) ($config['css_taux'] ?? 1),
        ]);
    }

    /**
     * Mettre à jour les taux de taxes
     */
    public function updateTaxes(Request $request): JsonResponse
    {
        $request->validate([
            'taux_tva' => 'required|numeric|min:0|max:100',
            'taux_css' => 'required|numeric|min:0|max:100',
            'tva_actif' => 'boolean',
            'css_actif' => 'boolean',
        ]);

        Configuration::setValue('taxes', 'tva_taux', $request->taux_tva);
        Configuration::setValue('taxes', 'css_taux', $request->taux_css);
        
        if ($request->has('tva_actif')) {
            Configuration::setValue('taxes', 'tva_actif', $request->tva_actif);
        }
        if ($request->has('css_actif')) {
            Configuration::setValue('taxes', 'css_actif', $request->css_actif);
        }

        // Invalider le cache des taxes
        \Illuminate\Support\Facades\Cache::forget('taxes_config');

        Audit::log('update', 'taxes', 'Taux de taxes mis à jour', [
            'taux_tva' => $request->taux_tva,
            'taux_css' => $request->taux_css,
        ]);

        return response()->json(['message' => 'Taux de taxes mis à jour avec succès']);
    }

    /**
     * Récupérer les angles du mois courant
     */
    public function getMoisCourant(): JsonResponse
    {
        $annee = (int) date('Y');
        $mois = (int) date('n');

        $tva = TaxeMensuelle::getOrCreateForPeriod($annee, $mois, 'TVA');
        $css = TaxeMensuelle::getOrCreateForPeriod($annee, $mois, 'CSS');

        // Calculer la progression par rapport au mois précédent
        $moisPrec = $mois === 1 ? 12 : $mois - 1;
        $anneePrec = $mois === 1 ? $annee - 1 : $annee;

        $tvaPrecedent = TaxeMensuelle::where('annee', $anneePrec)
            ->where('mois', $moisPrec)
            ->where('type_taxe', 'TVA')
            ->first();

        $cssPrecedent = TaxeMensuelle::where('annee', $anneePrec)
            ->where('mois', $moisPrec)
            ->where('type_taxe', 'CSS')
            ->first();

        return response()->json([
            'annee' => $annee,
            'mois' => $mois,
            'nom_mois' => Carbon::create($annee, $mois, 1)->locale('fr')->translatedFormat('F Y'),
            'angles' => [
                'tva' => [
                    'type_taxe' => 'TVA',
                    'taux' => (float) $tva->taux_applique,
                    'montant_ht_total' => (float) $tva->montant_ht_total,
                    'montant_taxe_total' => (float) $tva->montant_taxe_total,
                    'montant_exonere' => (float) $tva->montant_exonere,
                    'nombre_documents' => $tva->nombre_documents,
                    'nombre_exonerations' => $tva->nombre_exonerations,
                    'cloture' => $tva->cloture,
                    'progression' => $tvaPrecedent 
                        ? $this->calculerProgression($tva->montant_taxe_total, $tvaPrecedent->montant_taxe_total)
                        : null,
                ],
                'css' => [
                    'type_taxe' => 'CSS',
                    'taux' => (float) $css->taux_applique,
                    'montant_ht_total' => (float) $css->montant_ht_total,
                    'montant_taxe_total' => (float) $css->montant_taxe_total,
                    'montant_exonere' => (float) $css->montant_exonere,
                    'nombre_documents' => $css->nombre_documents,
                    'nombre_exonerations' => $css->nombre_exonerations,
                    'cloture' => $css->cloture,
                    'progression' => $cssPrecedent 
                        ? $this->calculerProgression($css->montant_taxe_total, $cssPrecedent->montant_taxe_total)
                        : null,
                ],
            ],
            'total_taxes_mois' => (float) $tva->montant_taxe_total + (float) $css->montant_taxe_total,
        ]);
    }

    /**
     * Récupérer l'historique annuel
     */
    public function getHistorique(Request $request): JsonResponse
    {
        $annee = $request->get('annee', date('Y'));
        
        $historique = [];
        for ($mois = 1; $mois <= 12; $mois++) {
            $tva = TaxeMensuelle::where('annee', $annee)
                ->where('mois', $mois)
                ->where('type_taxe', 'TVA')
                ->first();
                
            $css = TaxeMensuelle::where('annee', $annee)
                ->where('mois', $mois)
                ->where('type_taxe', 'CSS')
                ->first();
                
            $historique[] = [
                'mois' => $mois,
                'nom_mois' => Carbon::create($annee, $mois, 1)->locale('fr')->translatedFormat('F'),
                'tva' => $tva ? [
                    'montant_ht' => (float) $tva->montant_ht_total,
                    'montant_taxe' => (float) $tva->montant_taxe_total,
                    'montant_exonere' => (float) $tva->montant_exonere,
                    'docs' => $tva->nombre_documents,
                    'cloture' => $tva->cloture,
                ] : null,
                'css' => $css ? [
                    'montant_ht' => (float) $css->montant_ht_total,
                    'montant_taxe' => (float) $css->montant_taxe_total,
                    'montant_exonere' => (float) $css->montant_exonere,
                    'docs' => $css->nombre_documents,
                    'cloture' => $css->cloture,
                ] : null,
                'total_taxes' => ($tva ? (float) $tva->montant_taxe_total : 0) + 
                                ($css ? (float) $css->montant_taxe_total : 0),
            ];
        }

        $cumul = TaxeMensuelle::getCumulAnnuel((int) $annee);

        return response()->json([
            'annee' => (int) $annee,
            'historique' => $historique,
            'cumul' => [
                'tva' => $cumul['TVA'] ?? null,
                'css' => $cumul['CSS'] ?? null,
                'total_taxes' => 
                    (float) ($cumul['TVA']['total_taxe'] ?? 0) + 
                    (float) ($cumul['CSS']['total_taxe'] ?? 0),
            ],
        ]);
    }

    /**
     * Recalculer les taxes d'un mois (admin)
     */
    public function recalculer(Request $request): JsonResponse
    {
        $request->validate([
            'annee' => 'required|integer|min:2020|max:2100',
            'mois' => 'required|integer|min:1|max:12',
        ]);

        TaxeMensuelle::recalculerMois($request->annee, $request->mois);

        Audit::log('recalcul', 'taxes', "Recalcul des taxes pour {$request->mois}/{$request->annee}");

        return response()->json([
            'message' => 'Taxes recalculées avec succès',
        ]);
    }

    /**
     * Clôturer un mois
     */
    public function cloturerMois(Request $request): JsonResponse
    {
        $request->validate([
            'annee' => 'required|integer|min:2020|max:2100',
            'mois' => 'required|integer|min:1|max:12',
        ]);

        $success = TaxeMensuelle::cloturerMois($request->annee, $request->mois);

        if ($success) {
            Audit::log('cloture', 'taxes', "Clôture des taxes pour {$request->mois}/{$request->annee}");
        }

        return response()->json([
            'message' => $success 
                ? 'Mois clôturé avec succès' 
                : 'Aucune taxe à clôturer pour cette période',
            'success' => $success,
        ]);
    }

    /**
     * Calculer le pourcentage de progression
     */
    private function calculerProgression(float $actuel, float $precedent): ?float
    {
        if ($precedent == 0) {
            return $actuel > 0 ? 100 : 0;
        }
        return round((($actuel - $precedent) / $precedent) * 100, 1);
    }
}
