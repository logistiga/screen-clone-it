<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Passe conteneurs_traites en InnoDB : verrous ligne par ligne au lieu de bloquer
 * toute la table pendant la synchro OPS. Structure seulement, aucune donnée modifiée.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') { return; }
        $row = DB::selectOne("SELECT ENGINE AS e FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'conteneurs_traites'");
        if ($row && strtoupper((string) $row->e) !== 'INNODB') {
            DB::statement('ALTER TABLE conteneurs_traites ENGINE=InnoDB');
        }
    }

    public function down(): void
    {
        // Pas de retour à MyISAM (perte des transactions/verrous)
    }
};
