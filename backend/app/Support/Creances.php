<?php

namespace App\Support;

use App\Models\Facture;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

/**
 * Définition unique des créances clients (Tableau de bord, Reporting, exports).
 * Créance = facture non annulée dont le reste à payer (TTC - payé) est strictement positif.
 */
final class Creances
{
    public const SEUIL = 0.5;

    public static function query(): Builder
    {
        return Facture::query()
            ->whereNotIn('statut', FactureStatut::ALIAS_ANNULEE)
            ->whereRaw('(COALESCE(montant_ttc,0) - COALESCE(montant_paye,0)) > ?', [self::SEUIL]);
    }

    public static function total(): float
    {
        return round((float) self::query()->sum(\DB::raw('COALESCE(montant_ttc,0) - COALESCE(montant_paye,0)')));
    }

    /** Nombre entier de jours de retard (0 si non échue). */
    public static function joursRetard($dateEcheance): int
    {
        if (!$dateEcheance) {
            return 0;
        }
        $echeance = Carbon::parse($dateEcheance)->startOfDay();
        $today = now()->startOfDay();
        return $echeance->lt($today) ? (int) $echeance->diffInDays($today, true) : 0;
    }
}
