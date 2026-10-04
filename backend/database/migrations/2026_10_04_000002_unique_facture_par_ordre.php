<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Règle « 1 OT = 1 facture » garantie par la base.
 * Colonne générée = ordre_id pour les factures non supprimées, NULL sinon,
 * avec index unique (compatible suppression douce).
 *
 * Ne modifie AUCUNE donnée existante : si des doublons historiques existent,
 * la contrainte n'est pas posée (journal d'avertissement) et la migration
 * pourra être relancée après traitement manuel.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql' || !Schema::hasTable('factures')
            || Schema::hasColumn('factures', 'ordre_id_actif')) {
            return;
        }

        $softDeletes = Schema::hasColumn('factures', 'deleted_at');
        $doublons = DB::table('factures')
            ->whereNotNull('ordre_id')
            ->when($softDeletes, fn ($q) => $q->whereNull('deleted_at'))
            ->select('ordre_id')->groupBy('ordre_id')->havingRaw('COUNT(*) > 1')
            ->pluck('ordre_id');

        if ($doublons->isNotEmpty()) {
            Log::warning('Contrainte 1 OT = 1 facture NON posée : doublons historiques à traiter', [
                'ordre_ids' => $doublons->all(),
            ]);
            // Lever une exception bloquerait les autres mises à jour : on sort sans rien changer.
            // La migration reste "exécutée" ; voir la commande de relance dans le rapport.
            return;
        }

        $expr = $softDeletes ? 'IF(deleted_at IS NULL, ordre_id, NULL)' : 'ordre_id';
        DB::statement("ALTER TABLE factures ADD COLUMN ordre_id_actif BIGINT UNSIGNED GENERATED ALWAYS AS ($expr) STORED");
        DB::statement('ALTER TABLE factures ADD UNIQUE INDEX factures_ordre_id_actif_unique (ordre_id_actif)');
    }

    public function down(): void
    {
        if (Schema::hasColumn('factures', 'ordre_id_actif')) {
            DB::statement('ALTER TABLE factures DROP INDEX factures_ordre_id_actif_unique');
            DB::statement('ALTER TABLE factures DROP COLUMN ordre_id_actif');
        }
    }
};
