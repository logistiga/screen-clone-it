<?php

namespace App\Support;

/**
 * Statuts de facture : valeurs réelles en base, centralisées pour éviter
 * les variantes de chaîne ('Annulée' vs 'annulee').
 */
final class FactureStatut
{
    public const BROUILLON = 'brouillon';
    public const EMISE = 'emise';
    public const VALIDEE = 'validee';
    public const PARTIELLEMENT_PAYEE = 'partiellement_payee';
    public const PAYEE = 'payee';
    public const ANNULEE = 'annulee';

    /** Variantes historiques acceptées en lecture uniquement. */
    public const ALIAS_ANNULEE = ['annulee', 'Annulée', 'annulée'];

    public static function estAnnulee(?string $statut): bool
    {
        return in_array($statut, self::ALIAS_ANNULEE, true);
    }

    /** Montants figés : payée, partiellement payée ou annulée. */
    public static function montantsFiges(?string $statut, float $montantPaye = 0): bool
    {
        return $montantPaye > 0
            || self::estAnnulee($statut)
            || in_array($statut, [self::PAYEE, self::PARTIELLEMENT_PAYEE, 'partielle'], true);
    }

    /** Statut cohérent avec le montant payé (arrondi FCFA). */
    public static function pourMontants(float $paye, float $ttc, ?string $actuel): string
    {
        if (self::estAnnulee($actuel)) {
            return self::ANNULEE;
        }
        $paye = round($paye);
        $ttc = round($ttc);
        if ($ttc > 0 && $paye >= $ttc) {
            return self::PAYEE;
        }
        if ($paye > 0) {
            return self::PARTIELLEMENT_PAYEE;
        }
        return in_array($actuel, [self::PAYEE, self::PARTIELLEMENT_PAYEE, 'partielle'], true)
            ? self::EMISE
            : ($actuel ?: self::EMISE);
    }

    public static function resteAPayer(float $paye, float $ttc): float
    {
        return max(0, round($ttc) - round($paye));
    }
}
