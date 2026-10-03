<?php

namespace App\Services\ChatGpt;

use App\Models\Annulation;
use App\Models\Armateur;
use App\Models\Banque;
use App\Models\Client;
use App\Models\ConteneurOrdre;
use App\Models\Devis;
use App\Models\Facture;
use App\Models\MouvementCaisse;
use App\Models\NoteDebut;
use App\Models\OrdreTravail;
use App\Models\Paiement;
use App\Models\Representant;
use App\Models\Transitaire;
use Illuminate\Support\Facades\Schema;

/**
 * Liste blanche des ressources exposées à ChatGPT.
 * Aucun champ sensible (mots de passe, tokens, IBAN/RIB, notes internes).
 * Les champs absents de la table réelle sont retirés automatiquement.
 */
class ResourceRegistry
{
    private const DOC = ['id', 'numero', 'client_id', 'date_creation', 'categorie', 'type_operation',
        'navire', 'numero_bl', 'montant_ht', 'tva', 'css', 'montant_ttc', 'statut', 'created_at'];

    private static array $columnCache = [];

    public static function definitions(): array
    {
        return [
            'clients' => [
                'model' => Client::class, 'label' => 'Clients',
                'fields' => ['id', 'nom', 'email', 'telephone', 'adresse', 'ville', 'pays', 'type', 'rccm', 'nif', 'solde', 'limite_credit', 'created_at'],
                'search' => ['nom', 'email', 'telephone', 'nif'], 'date' => 'created_at',
                'relations' => [],
            ],
            'factures' => [
                'model' => Facture::class, 'label' => 'Factures',
                'fields' => array_merge(self::DOC, ['ordre_id', 'devis_id', 'date_echeance', 'montant_paye', 'exonere_tva', 'exonere_css']),
                'search' => ['numero', 'numero_bl', 'navire'], 'date' => 'date_creation',
                'relations' => ['client' => ['id', 'nom'], 'ordre' => ['id', 'numero']],
            ],
            'ordres' => [
                'model' => OrdreTravail::class, 'label' => 'Ordres de travail',
                'fields' => array_merge(self::DOC, ['devis_id', 'montant_paye']),
                'search' => ['numero', 'numero_bl', 'navire'], 'date' => 'date_creation',
                'relations' => ['client' => ['id', 'nom']],
            ],
            'devis' => [
                'model' => Devis::class, 'label' => 'Devis',
                'fields' => array_merge(self::DOC, ['date_validite']),
                'search' => ['numero', 'numero_bl', 'navire'], 'date' => 'date_creation',
                'relations' => ['client' => ['id', 'nom']],
            ],
            'paiements' => [
                'model' => Paiement::class, 'label' => 'Paiements clients',
                'fields' => ['id', 'facture_id', 'ordre_id', 'note_debut_id', 'client_id', 'montant', 'date', 'mode_paiement', 'reference', 'banque_id', 'created_at'],
                'search' => ['reference'], 'date' => 'date',
                'relations' => ['client' => ['id', 'nom'], 'facture' => ['id', 'numero']],
            ],
            'caisse' => [
                'model' => MouvementCaisse::class, 'label' => 'Mouvements de caisse et banque',
                'fields' => ['id', 'type', 'montant', 'date', 'description', 'source', 'banque_id', 'categorie', 'beneficiaire', 'mode_paiement', 'reference', 'client_id', 'created_at'],
                'search' => ['description', 'beneficiaire', 'reference', 'categorie'], 'date' => 'date',
                'relations' => [],
            ],
            'notes_debut' => [
                'model' => NoteDebut::class, 'label' => 'Notes de début',
                'fields' => ['id', 'numero', 'type', 'client_id', 'ordre_id', 'facture_id', 'date_creation', 'conteneur_numero', 'navire', 'numero_bl', 'montant_ht', 'montant_ttc', 'statut', 'created_at'],
                'search' => ['numero', 'conteneur_numero', 'numero_bl'], 'date' => 'date_creation',
                'relations' => ['client' => ['id', 'nom']],
            ],
            'conteneurs' => [
                'model' => ConteneurOrdre::class, 'label' => 'Conteneurs des ordres de travail',
                'fields' => ['id', 'ordre_id', 'numero', 'taille', 'description', 'prix_unitaire', 'created_at'],
                'search' => ['numero'], 'date' => 'created_at',
                'relations' => ['ordre' => ['id', 'numero', 'client_id']],
            ],
            'annulations' => [
                'model' => Annulation::class, 'label' => 'Annulations et avoirs',
                'fields' => ['id', 'numero', 'type', 'client_id', 'facture_id', 'ordre_id', 'montant', 'motif', 'statut', 'date', 'created_at'],
                'search' => ['numero', 'motif'], 'date' => 'created_at',
                'relations' => [],
            ],
            'banques' => [
                'model' => Banque::class, 'label' => 'Banques (sans IBAN/RIB)',
                'fields' => ['id', 'nom', 'solde', 'actif', 'created_at'],
                'search' => ['nom'], 'date' => 'created_at', 'relations' => [],
            ],
            'transitaires' => self::partner(Transitaire::class, 'Transitaires'),
            'representants' => self::partner(Representant::class, 'Représentants'),
            'armateurs' => self::partner(Armateur::class, 'Armateurs'),
        ];
    }

    private static function partner(string $model, string $label): array
    {
        return [
            'model' => $model, 'label' => $label,
            'fields' => ['id', 'nom', 'code', 'email', 'telephone', 'adresse', 'created_at'],
            'search' => ['nom', 'email'], 'date' => 'created_at', 'relations' => [],
        ];
    }

    public static function get(string $resource): ?array
    {
        $defs = self::definitions();
        if (!isset($defs[$resource])) {
            return null;
        }
        $def = $defs[$resource];
        $table = (new $def['model']())->getTable();
        $existing = self::columns($table);
        $def['table'] = $table;
        $def['fields'] = array_values(array_intersect($def['fields'], $existing));
        $def['search'] = array_values(array_intersect($def['search'], $existing));
        return $def;
    }

    public static function names(): array
    {
        return array_keys(self::definitions());
    }

    private static function columns(string $table): array
    {
        if (!isset(self::$columnCache[$table])) {
            try {
                self::$columnCache[$table] = Schema::hasTable($table) ? Schema::getColumnListing($table) : [];
            } catch (\Throwable $e) {
                self::$columnCache[$table] = [];
            }
        }
        return self::$columnCache[$table];
    }
}
