<?php

namespace App\Support;

use Illuminate\Support\Str;

final class DocumentCategory
{
    public const CONTENEURS = 'conteneurs';
    public const CONVENTIONNEL = 'conventionnel';
    public const INDEPENDANT = 'operations_independantes';

    public static function normalize(?string $categorie = null, ?string $typeDocument = null): string
    {
        $rawValue = $categorie ?? $typeDocument;
        $key = self::key($rawValue);

        if ($key === '') {
            return self::CONTENEURS;
        }

        return match ($key) {
            'conteneur', 'conteneurs' => self::CONTENEURS,
            'lot', 'lots', 'conventionnel', 'conventionnels' => self::CONVENTIONNEL,
            'independant', 'independants', 'operations_independantes', 'operation_independante', 'divers', 'diverse', 'diverses' => self::INDEPENDANT,
            default => trim((string) $rawValue),
        };
    }

    public static function toTypeDocument(?string $categorie): string
    {
        return match (self::normalize($categorie)) {
            self::CONTENEURS => 'Conteneur',
            self::CONVENTIONNEL => 'Lot',
            self::INDEPENDANT => 'Independant',
            default => trim((string) $categorie),
        };
    }

    public static function isConteneurs(?string $categorie): bool
    {
        return self::normalize($categorie) === self::CONTENEURS;
    }

    public static function isConventionnel(?string $categorie): bool
    {
        return self::normalize($categorie) === self::CONVENTIONNEL;
    }

    public static function isIndependant(?string $categorie): bool
    {
        return self::normalize($categorie) === self::INDEPENDANT;
    }

    private static function key(?string $value): string
    {
        if ($value === null) {
            return '';
        }

        return (string) Str::of(trim($value))
            ->lower()
            ->ascii()
            ->replace(['-', ' '], '_');
    }
}
