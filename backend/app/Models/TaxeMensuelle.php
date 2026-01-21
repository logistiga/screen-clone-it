<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class TaxeMensuelle extends Model
{
    use HasFactory;

    protected $table = 'taxes_mensuelles';

    protected $fillable = [
        'annee',
        'mois',
        'type_taxe',
        'taux_applique',
        'montant_ht_total',
        'montant_taxe_total',
        'montant_exonere',
        'nombre_documents',
        'nombre_exonerations',
        'cloture',
        'cloture_at',
    ];

    protected $casts = [
        'annee' => 'integer',
        'mois' => 'integer',
        'taux_applique' => 'decimal:2',
        'montant_ht_total' => 'decimal:2',
        'montant_taxe_total' => 'decimal:2',
        'montant_exonere' => 'decimal:2',
        'nombre_documents' => 'integer',
        'nombre_exonerations' => 'integer',
        'cloture' => 'boolean',
        'cloture_at' => 'datetime',
    ];

    /**
     * Récupérer ou créer un angle pour une période et type de taxe
     */
    public static function getOrCreateForPeriod(int $annee, int $mois, string $typeTaxe): self
    {
        // Récupérer le taux depuis la table taxes
        $taxe = Taxe::where('code', strtoupper($typeTaxe))->first();
        $taux = $taxe ? (float) $taxe->taux : 0;

        return self::firstOrCreate(
            [
                'annee' => $annee,
                'mois' => $mois,
                'type_taxe' => strtoupper($typeTaxe),
            ],
            [
                'taux_applique' => $taux,
                'montant_ht_total' => 0,
                'montant_taxe_total' => 0,
                'montant_exonere' => 0,
                'nombre_documents' => 0,
                'nombre_exonerations' => 0,
                'cloture' => false,
            ]
        );
    }

    /**
     * Ajouter un document à l'agrégation mensuelle
     */
    public static function ajouterDocument(
        int $annee, 
        int $mois, 
        string $typeTaxe, 
        float $montantHT, 
        float $montantTaxe,
        bool $estExonere = false
    ): void {
        $angle = self::getOrCreateForPeriod($annee, $mois, $typeTaxe);
        
        if ($angle->cloture) {
            return; // Ne pas modifier un mois clôturé
        }

        $angle->nombre_documents++;
        
        if ($estExonere) {
            $angle->montant_exonere += $montantHT;
            $angle->nombre_exonerations++;
        } else {
            $angle->montant_ht_total += $montantHT;
            $angle->montant_taxe_total += $montantTaxe;
        }
        
        $angle->save();
    }

    /**
     * Retirer un document de l'agrégation (annulation/suppression)
     */
    public static function retirerDocument(
        int $annee, 
        int $mois, 
        string $typeTaxe, 
        float $montantHT, 
        float $montantTaxe,
        bool $estExonere = false
    ): void {
        $angle = self::where('annee', $annee)
            ->where('mois', $mois)
            ->where('type_taxe', $typeTaxe)
            ->first();
            
        if (!$angle || $angle->cloture) {
            return;
        }

        $angle->nombre_documents = max(0, $angle->nombre_documents - 1);
        
        if ($estExonere) {
            $angle->montant_exonere = max(0, $angle->montant_exonere - $montantHT);
            $angle->nombre_exonerations = max(0, $angle->nombre_exonerations - 1);
        } else {
            $angle->montant_ht_total = max(0, $angle->montant_ht_total - $montantHT);
            $angle->montant_taxe_total = max(0, $angle->montant_taxe_total - $montantTaxe);
        }
        
        $angle->save();
    }

    /**
     * Recalculer l'agrégation pour un mois donné depuis les factures
     */
    public static function recalculerMois(int $annee, int $mois): void
    {
        $config = Configuration::getValue('taxes') ?? [];
        $tauxTVA = (float) ($config['tva_taux'] ?? 18);
        $tauxCSS = (float) ($config['css_taux'] ?? 1);

        // Supprimer les agrégations non clôturées
        self::where('annee', $annee)
            ->where('mois', $mois)
            ->where('cloture', false)
            ->delete();

        // Recalculer depuis les factures
        $factures = Facture::whereYear('date_creation', $annee)
            ->whereMonth('date_creation', $mois)
            ->where('statut', '!=', 'annulee')
            ->get();

        $statsTVA = [
            'montant_ht' => 0,
            'montant_taxe' => 0,
            'montant_exonere' => 0,
            'docs' => 0,
            'exonerations' => 0,
        ];
        
        $statsCSS = [
            'montant_ht' => 0,
            'montant_taxe' => 0,
            'montant_exonere' => 0,
            'docs' => 0,
            'exonerations' => 0,
        ];

        foreach ($factures as $facture) {
            $montantHT = (float) $facture->montant_ht - (float) ($facture->remise_montant ?? 0);
            
            // TVA
            $statsTVA['docs']++;
            if ($facture->exonere_tva) {
                $statsTVA['montant_exonere'] += $montantHT;
                $statsTVA['exonerations']++;
            } else {
                $statsTVA['montant_ht'] += $montantHT;
                $statsTVA['montant_taxe'] += (float) $facture->tva;
            }
            
            // CSS
            $statsCSS['docs']++;
            if ($facture->exonere_css) {
                $statsCSS['montant_exonere'] += $montantHT;
                $statsCSS['exonerations']++;
            } else {
                $statsCSS['montant_ht'] += $montantHT;
                $statsCSS['montant_taxe'] += (float) $facture->css;
            }
        }

        // Créer les enregistrements
        self::create([
            'annee' => $annee,
            'mois' => $mois,
            'type_taxe' => 'TVA',
            'taux_applique' => $tauxTVA,
            'montant_ht_total' => $statsTVA['montant_ht'],
            'montant_taxe_total' => $statsTVA['montant_taxe'],
            'montant_exonere' => $statsTVA['montant_exonere'],
            'nombre_documents' => $statsTVA['docs'],
            'nombre_exonerations' => $statsTVA['exonerations'],
        ]);

        self::create([
            'annee' => $annee,
            'mois' => $mois,
            'type_taxe' => 'CSS',
            'taux_applique' => $tauxCSS,
            'montant_ht_total' => $statsCSS['montant_ht'],
            'montant_taxe_total' => $statsCSS['montant_taxe'],
            'montant_exonere' => $statsCSS['montant_exonere'],
            'nombre_documents' => $statsCSS['docs'],
            'nombre_exonerations' => $statsCSS['exonerations'],
        ]);
    }

    /**
     * Clôturer un mois (archivage définitif)
     */
    public static function cloturerMois(int $annee, int $mois): bool
    {
        return self::where('annee', $annee)
            ->where('mois', $mois)
            ->where('cloture', false)
            ->update([
                'cloture' => true,
                'cloture_at' => now(),
            ]) > 0;
    }

    /**
     * Obtenir l'historique annuel
     */
    public static function getHistoriqueAnnuel(int $annee, string $typeTaxe = null): array
    {
        $query = self::where('annee', $annee)
            ->orderBy('mois');
            
        if ($typeTaxe) {
            $query->where('type_taxe', $typeTaxe);
        }
        
        return $query->get()->groupBy('mois')->toArray();
    }

    /**
     * Obtenir le cumul annuel
     */
    public static function getCumulAnnuel(int $annee): array
    {
        return self::where('annee', $annee)
            ->select('type_taxe')
            ->selectRaw('SUM(montant_ht_total) as total_ht')
            ->selectRaw('SUM(montant_taxe_total) as total_taxe')
            ->selectRaw('SUM(montant_exonere) as total_exonere')
            ->selectRaw('SUM(nombre_documents) as total_docs')
            ->selectRaw('SUM(nombre_exonerations) as total_exonerations')
            ->groupBy('type_taxe')
            ->get()
            ->keyBy('type_taxe')
            ->toArray();
    }
}
