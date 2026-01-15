<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class NoteDebut extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'notes_debut';

    // Types de notes disponibles
    const TYPE_DETENTION = 'detention';
    const TYPE_OUVERTURE_PORT = 'ouverture_port';
    const TYPE_REPARATION = 'reparation';
    const TYPE_RELACHE = 'relache';

    // Préfixes par type
    const PREFIXES = [
        self::TYPE_DETENTION => 'ND',
        self::TYPE_OUVERTURE_PORT => 'NOP',
        self::TYPE_REPARATION => 'NR',
        self::TYPE_RELACHE => 'NRL',
    ];

    protected $fillable = [
        'numero',
        'type',
        'client_id',
        'ordre_id',
        'facture_id',
        'date_creation',
        'conteneur_numero',
        'conteneur_type',
        'conteneur_taille',
        'navire',
        'armateur_id',
        'transitaire_id',
        'numero_bl',
        'bl_numero',
        'date_arrivee',
        'date_debut',
        'date_fin',
        'date_debut_stockage',
        'date_fin_stockage',
        'jours_franchise',
        'jours_stockage',
        'nombre_jours',
        'tarif_journalier',
        'montant_ht',
        'montant_tva',
        'montant_css',
        'montant_ttc',
        'montant_stockage',
        'montant_manutention',
        'montant_total',
        'montant_paye',
        'montant_avance',
        'taux_tva',
        'taux_css',
        'description',
        'notes',
        'observations',
        'statut',
    ];

    protected $casts = [
        'date_creation' => 'date',
        'date_arrivee' => 'date',
        'date_debut' => 'date',
        'date_fin' => 'date',
        'date_debut_stockage' => 'date',
        'date_fin_stockage' => 'date',
        'montant_ht' => 'decimal:2',
        'montant_tva' => 'decimal:2',
        'montant_css' => 'decimal:2',
        'montant_ttc' => 'decimal:2',
        'montant_stockage' => 'decimal:2',
        'montant_manutention' => 'decimal:2',
        'montant_total' => 'decimal:2',
        'montant_paye' => 'decimal:2',
        'montant_avance' => 'decimal:2',
        'tarif_journalier' => 'decimal:2',
    ];

    // =========================================
    // RELATIONS
    // =========================================

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function ordre()
    {
        return $this->belongsTo(OrdreTravail::class, 'ordre_id');
    }

    public function facture()
    {
        return $this->belongsTo(Facture::class);
    }

    public function armateur()
    {
        return $this->belongsTo(Armateur::class);
    }

    public function transitaire()
    {
        return $this->belongsTo(Transitaire::class);
    }

    // =========================================
    // SCOPES
    // =========================================

    /**
     * Scope pour recherche textuelle
     */
    public function scopeSearch($query, ?string $term)
    {
        if (empty($term)) {
            return $query;
        }

        return $query->where(function ($q) use ($term) {
            $q->where('numero', 'like', "%{$term}%")
              ->orWhere('bl_numero', 'like', "%{$term}%")
              ->orWhere('conteneur_numero', 'like', "%{$term}%")
              ->orWhereHas('client', fn($q) => $q->where('nom', 'like', "%{$term}%"));
        });
    }

    /**
     * Scope pour filtrer par type
     */
    public function scopeOfType($query, ?string $type)
    {
        if (empty($type)) {
            return $query;
        }

        return $query->where('type', $type);
    }

    /**
     * Scope pour filtrer par client
     */
    public function scopeForClient($query, ?int $clientId)
    {
        if (empty($clientId)) {
            return $query;
        }

        return $query->where('client_id', $clientId);
    }

    /**
     * Scope pour filtrer par plage de dates
     */
    public function scopeDateRange($query, ?string $dateDebut, ?string $dateFin)
    {
        if ($dateDebut) {
            $query->whereDate('date_debut', '>=', $dateDebut);
        }

        if ($dateFin) {
            $query->whereDate('date_fin', '<=', $dateFin);
        }

        return $query;
    }

    /**
     * Scope pour chargement avec relations
     */
    public function scopeWithRelations($query)
    {
        return $query->with(['client', 'transitaire', 'armateur']);
    }

    // =========================================
    // MÉTHODES DE CALCUL
    // =========================================

    /**
     * Récupérer la configuration des taxes avec cache (5 minutes)
     */
    protected static function getTaxesConfig(): array
    {
        return Cache::remember('taxes_config', 300, function () {
            $config = Configuration::getOrCreate('taxes');
            
            return [
                'tva_taux' => $config->data['tva_taux'] ?? 18,
                'css_taux' => $config->data['css_taux'] ?? 1,
                'tva_actif' => $config->data['tva_actif'] ?? true,
                'css_actif' => $config->data['css_actif'] ?? true,
            ];
        });
    }

    /**
     * Calculer le montant HT basé sur jours et tarif
     */
    public function calculerMontantHT(): float
    {
        $nombreJours = (int) ($this->nombre_jours ?? 0);
        $tarifJournalier = (float) ($this->tarif_journalier ?? 0);
        
        return $nombreJours * $tarifJournalier;
    }

    /**
     * Calculer les jours de stockage (avec franchise)
     */
    public function calculerJoursStockage(): int
    {
        if (!$this->date_debut_stockage || !$this->date_fin_stockage) {
            return 0;
        }

        $debut = \Carbon\Carbon::parse($this->date_debut_stockage);
        $fin = \Carbon\Carbon::parse($this->date_fin_stockage);
        $jours = $fin->diffInDays($debut);
        
        return max(0, $jours - ($this->jours_franchise ?? 0));
    }

    /**
     * Calculer tous les montants et sauvegarder
     */
    public function calculerTotaux(): void
    {
        // Calculer jours stockage si dates présentes
        if ($this->date_debut_stockage && $this->date_fin_stockage) {
            $this->jours_stockage = $this->calculerJoursStockage();
            $this->montant_stockage = $this->jours_stockage * ($this->tarif_journalier ?? 0);
        }

        // Montant HT = jours * tarif (ou valeur manuelle)
        $montantHT = $this->montant_ht ?? $this->calculerMontantHT();

        // Récupérer config taxes (cache)
        $config = self::getTaxesConfig();

        // Calculer taxes
        $montantTVA = $config['tva_actif'] ? $montantHT * ($config['tva_taux'] / 100) : 0;
        $montantCSS = $config['css_actif'] ? $montantHT * ($config['css_taux'] / 100) : 0;
        $montantTTC = $montantHT + $montantTVA + $montantCSS;

        // Montant total = stockage + manutention
        $montantTotal = ($this->montant_stockage ?? 0) + ($this->montant_manutention ?? 0);

        $this->update([
            'montant_ht' => round($montantHT, 2),
            'montant_tva' => round($montantTVA, 2),
            'montant_css' => round($montantCSS, 2),
            'montant_ttc' => round($montantTTC, 2),
            'montant_total' => round($montantTotal, 2),
            'taux_tva' => $config['tva_taux'],
            'taux_css' => $config['css_taux'],
        ]);
    }

    /**
     * Méthode legacy - appelle calculerTotaux()
     * @deprecated Utiliser calculerTotaux() à la place
     */
    public function calculerMontants(): void
    {
        $this->calculerTotaux();
    }

    // =========================================
    // GÉNÉRATION NUMÉRO
    // =========================================

    /**
     * Normaliser le type pour usage interne
     */
    public static function normaliserType(string $type): string
    {
        $mapping = [
            'Detention' => self::TYPE_DETENTION,
            'Ouverture Port' => self::TYPE_OUVERTURE_PORT,
            'Reparation' => self::TYPE_REPARATION,
            'Relache' => self::TYPE_RELACHE,
            'detention' => self::TYPE_DETENTION,
            'ouverture_port' => self::TYPE_OUVERTURE_PORT,
            'reparation' => self::TYPE_REPARATION,
            'relache' => self::TYPE_RELACHE,
        ];

        return $mapping[$type] ?? self::TYPE_DETENTION;
    }

    /**
     * Générer un numéro unique avec verrouillage transactionnel
     */
    public static function genererNumero(string $type = 'detention'): string
    {
        $typeNormalise = self::normaliserType($type);
        $prefixe = self::PREFIXES[$typeNormalise] ?? 'N';
        $annee = date('Y');

        return DB::transaction(function () use ($typeNormalise, $prefixe, $annee) {
            // Trouver le max existant avec verrouillage
            $maxNumero = self::withTrashed()
                ->where('numero', 'like', "{$prefixe}-{$annee}-%")
                ->lockForUpdate()
                ->selectRaw("MAX(CAST(SUBSTRING_INDEX(numero, '-', -1) AS UNSIGNED)) as max_num")
                ->value('max_num');

            $prochainNumero = ($maxNumero ?? 0) + 1;
            $numero = sprintf('%s-%s-%04d', $prefixe, $annee, $prochainNumero);

            // Vérifier unicité (sécurité supplémentaire)
            while (self::withTrashed()->where('numero', $numero)->exists()) {
                $prochainNumero++;
                $numero = sprintf('%s-%s-%04d', $prefixe, $annee, $prochainNumero);
            }

            return $numero;
        });
    }
}
