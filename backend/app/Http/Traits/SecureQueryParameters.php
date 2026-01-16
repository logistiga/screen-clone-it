<?php

namespace App\Http\Traits;

use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Trait pour sécuriser les paramètres de tri et filtrage
 * Prévient les injections SQL via orderBy et filter
 */
trait SecureQueryParameters
{
    /**
     * Colonnes autorisées pour le tri par défaut
     * Les contrôleurs peuvent surcharger cette propriété
     */
    protected array $defaultAllowedSortColumns = [
        'id', 'created_at', 'updated_at'
    ];

    /**
     * Directions de tri autorisées
     */
    protected array $allowedSortDirections = ['asc', 'desc'];

    /**
     * Opérateurs de filtre autorisés
     */
    protected array $allowedFilterOperators = [
        '=', '!=', '<', '>', '<=', '>=', 'like', 'in', 'not_in', 'between', 'is_null', 'is_not_null'
    ];

    /**
     * Longueur maximale des valeurs de recherche
     */
    protected int $maxSearchLength = 255;

    /**
     * Longueur maximale d'un paramètre de filtre
     */
    protected int $maxFilterValueLength = 500;

    /**
     * Valide et sanitize les paramètres de tri
     * 
     * @param Request $request
     * @param array $allowedColumns Colonnes autorisées pour ce contrôleur
     * @param string $defaultColumn Colonne par défaut
     * @param string $defaultDirection Direction par défaut
     * @return array ['column' => string, 'direction' => string]
     */
    protected function validateSortParameters(
        Request $request,
        array $allowedColumns = [],
        string $defaultColumn = 'created_at',
        string $defaultDirection = 'desc'
    ): array {
        $columns = !empty($allowedColumns) ? $allowedColumns : $this->defaultAllowedSortColumns;
        
        $sortColumn = $request->input('sort_by', $request->input('order_by', $defaultColumn));
        $sortDirection = strtolower($request->input('sort_direction', $request->input('order', $defaultDirection)));

        // Validation stricte de la colonne
        if (!in_array($sortColumn, $columns, true)) {
            $sortColumn = $defaultColumn;
        }

        // Validation stricte de la direction
        if (!in_array($sortDirection, $this->allowedSortDirections, true)) {
            $sortDirection = $defaultDirection;
        }

        return [
            'column' => $sortColumn,
            'direction' => $sortDirection,
        ];
    }

    /**
     * Valide les paramètres de recherche
     * 
     * @param Request $request
     * @param string $paramName Nom du paramètre de recherche
     * @return string|null
     */
    protected function validateSearchParameter(Request $request, string $paramName = 'search'): ?string
    {
        $search = $request->input($paramName);

        if ($search === null) {
            return null;
        }

        // Convertir en string et trim
        $search = trim((string) $search);

        // Vérifier la longueur
        if (strlen($search) > $this->maxSearchLength) {
            $search = substr($search, 0, $this->maxSearchLength);
        }

        // Sanitize - supprimer les caractères dangereux
        $search = $this->sanitizeString($search);

        return $search ?: null;
    }

    /**
     * Valide les paramètres de filtrage
     * 
     * @param Request $request
     * @param array $allowedFilters Filtres autorisés ['column' => ['operators']]
     * @return array
     */
    protected function validateFilterParameters(Request $request, array $allowedFilters): array
    {
        $filters = [];
        
        foreach ($allowedFilters as $column => $config) {
            $value = $request->input($column);
            
            if ($value === null) {
                continue;
            }

            // Si c'est un tableau simple, ce sont les opérateurs autorisés
            $allowedOps = is_array($config) && isset($config['operators']) 
                ? $config['operators'] 
                : (is_array($config) ? $config : ['=']);

            // Obtenir le type attendu
            $type = is_array($config) && isset($config['type']) ? $config['type'] : 'string';

            // Valider et convertir la valeur selon le type
            $validatedValue = $this->validateFilterValue($value, $type, $column);
            
            if ($validatedValue !== null) {
                $filters[$column] = $validatedValue;
            }
        }

        return $filters;
    }

    /**
     * Valide une valeur de filtre selon son type
     */
    protected function validateFilterValue($value, string $type, string $column)
    {
        // Vérifier la longueur pour les strings
        if (is_string($value) && strlen($value) > $this->maxFilterValueLength) {
            return null;
        }

        switch ($type) {
            case 'integer':
            case 'int':
                if (!is_numeric($value)) {
                    return null;
                }
                return (int) $value;

            case 'float':
            case 'decimal':
            case 'numeric':
                if (!is_numeric($value)) {
                    return null;
                }
                return (float) $value;

            case 'boolean':
            case 'bool':
                if (is_string($value)) {
                    $value = strtolower($value);
                    if (in_array($value, ['true', '1', 'yes', 'on'], true)) {
                        return true;
                    }
                    if (in_array($value, ['false', '0', 'no', 'off'], true)) {
                        return false;
                    }
                    return null;
                }
                return (bool) $value;

            case 'date':
                if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
                    return null;
                }
                return $value;

            case 'datetime':
                if (!strtotime($value)) {
                    return null;
                }
                return $value;

            case 'enum':
            case 'in':
                // La validation des valeurs enum doit être faite par l'appelant
                return $this->sanitizeString((string) $value);

            case 'array':
                if (is_string($value)) {
                    $value = explode(',', $value);
                }
                if (!is_array($value)) {
                    return null;
                }
                return array_map(fn($v) => $this->sanitizeString(trim($v)), $value);

            case 'string':
            default:
                return $this->sanitizeString((string) $value);
        }
    }

    /**
     * Sanitize une chaîne pour éviter les injections
     */
    protected function sanitizeString(string $value): string
    {
        // Supprimer les caractères de contrôle
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value);

        // Supprimer les séquences SQL dangereuses communes
        $dangerousPatterns = [
            '/--/',           // Commentaires SQL
            '/;/',            // Fin de requête
            '/\/\*/',         // Début commentaire bloc
            '/\*\//',         // Fin commentaire bloc
            '/\bUNION\b/i',   // UNION
            '/\bSELECT\b/i',  // SELECT (dans un contexte de filtre)
            '/\bINSERT\b/i',  // INSERT
            '/\bUPDATE\b/i',  // UPDATE
            '/\bDELETE\b/i',  // DELETE
            '/\bDROP\b/i',    // DROP
            '/\bEXEC\b/i',    // EXEC
        ];

        foreach ($dangerousPatterns as $pattern) {
            $value = preg_replace($pattern, '', $value);
        }

        return trim($value);
    }

    /**
     * Valide les paramètres de pagination
     */
    protected function validatePaginationParameters(Request $request, int $defaultPerPage = 15, int $maxPerPage = 100): array
    {
        $page = max(1, (int) $request->input('page', 1));
        $perPage = (int) $request->input('per_page', $defaultPerPage);

        // Limiter per_page
        $perPage = max(1, min($perPage, $maxPerPage));

        return [
            'page' => $page,
            'per_page' => $perPage,
        ];
    }

    /**
     * Valide un ID numérique
     */
    protected function validateId($id): ?int
    {
        if ($id === null) {
            return null;
        }

        if (!is_numeric($id) || (int) $id <= 0) {
            return null;
        }

        return (int) $id;
    }

    /**
     * Valide un montant (décimal positif)
     */
    protected function validateAmount($amount): ?float
    {
        if ($amount === null) {
            return null;
        }

        if (!is_numeric($amount)) {
            return null;
        }

        $amount = (float) $amount;

        // Montants négatifs non autorisés par défaut
        if ($amount < 0) {
            return null;
        }

        // Limiter à 2 décimales et à un maximum raisonnable
        if ($amount > 999999999999.99) {
            return null;
        }

        return round($amount, 2);
    }

    /**
     * Valide une plage de dates
     */
    protected function validateDateRange(Request $request, string $startParam = 'date_debut', string $endParam = 'date_fin'): array
    {
        $dateDebut = $request->input($startParam);
        $dateFin = $request->input($endParam);

        $result = [
            'start' => null,
            'end' => null,
        ];

        if ($dateDebut && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateDebut)) {
            $result['start'] = $dateDebut;
        }

        if ($dateFin && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFin)) {
            $result['end'] = $dateFin;
        }

        // Vérifier que la date de fin est après la date de début
        if ($result['start'] && $result['end'] && $result['start'] > $result['end']) {
            // Inverser si dans le mauvais ordre
            [$result['start'], $result['end']] = [$result['end'], $result['start']];
        }

        return $result;
    }
}
