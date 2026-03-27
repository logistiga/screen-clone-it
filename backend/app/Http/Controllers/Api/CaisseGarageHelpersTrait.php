<?php

namespace App\Http\Controllers\Api;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Trait partagé entre CaisseGarageAchatsController et CaisseGaragePrimesController
 */
trait CaisseGarageHelpersTrait
{
    private const PISTON_GABON = 'piston gabon';

    public function isAvailable(): bool
    {
        try {
            $connection = DB::connection('garage');
            $connection->getPdo();
            return $connection->getSchemaBuilder()->hasTable('bon_commandes');
        } catch (\Throwable $e) {
            return false;
        }
    }

    protected function applyFournisseurFilter($query, string $filter, bool $hasFournisseursTable)
    {
        if (!$hasFournisseursTable) return $query;

        if ($filter === 'piston') {
            $query->whereRaw('LOWER(fournisseurs.raison_sociale) LIKE ?', ['%' . self::PISTON_GABON . '%']);
        } elseif ($filter === 'autres') {
            $query->where(function ($q) {
                $q->whereNull('fournisseurs.raison_sociale')
                  ->orWhereRaw('LOWER(fournisseurs.raison_sociale) NOT LIKE ?', ['%' . self::PISTON_GABON . '%']);
            });
        }
        return $query;
    }
}
