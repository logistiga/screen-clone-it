<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * FormRequest pour les requêtes de liste avec pagination, tri et filtres
 * Sécurise les paramètres de requête contre les injections
 */
class ListRequest extends FormRequest
{
    /**
     * Colonnes de tri autorisées par défaut
     * Les contrôleurs peuvent surcharger via withAllowedSorts()
     */
    protected static array $allowedSorts = ['id', 'created_at', 'updated_at'];

    /**
     * Filtres autorisés par défaut
     */
    protected static array $allowedFilters = [];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Pagination
            'page' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            
            // Tri
            'sort_by' => ['nullable', 'string', 'max:50'],
            'order_by' => ['nullable', 'string', 'max:50'],
            'sort_direction' => ['nullable', 'string', 'in:asc,desc,ASC,DESC'],
            'order' => ['nullable', 'string', 'in:asc,desc,ASC,DESC'],
            
            // Recherche
            'search' => ['nullable', 'string', 'max:255'],
            'q' => ['nullable', 'string', 'max:255'],
            
            // Dates
            'date_debut' => ['nullable', 'date', 'date_format:Y-m-d'],
            'date_fin' => ['nullable', 'date', 'date_format:Y-m-d', 'after_or_equal:date_debut'],
            'start_date' => ['nullable', 'date', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date', 'date_format:Y-m-d', 'after_or_equal:start_date'],
        ];
    }

    /**
     * Prépare les données avant validation
     */
    protected function prepareForValidation(): void
    {
        $data = [];

        // Trim les strings
        foreach (['search', 'q', 'sort_by', 'order_by', 'sort_direction', 'order'] as $field) {
            if ($this->has($field) && is_string($this->input($field))) {
                $data[$field] = trim($this->input($field));
            }
        }

        // Normaliser la direction de tri
        if ($this->has('sort_direction')) {
            $data['sort_direction'] = strtolower($this->input('sort_direction'));
        }
        if ($this->has('order')) {
            $data['order'] = strtolower($this->input('order'));
        }

        if (!empty($data)) {
            $this->merge($data);
        }
    }

    /**
     * Obtient les paramètres de tri validés et sécurisés
     */
    public function getSortParameters(array $allowedColumns = [], string $default = 'created_at', string $defaultDirection = 'desc'): array
    {
        $columns = !empty($allowedColumns) ? $allowedColumns : static::$allowedSorts;
        
        $column = $this->input('sort_by', $this->input('order_by', $default));
        $direction = strtolower($this->input('sort_direction', $this->input('order', $defaultDirection)));

        // Valider la colonne contre la whitelist
        if (!in_array($column, $columns, true)) {
            $column = $default;
        }

        // Valider la direction
        if (!in_array($direction, ['asc', 'desc'], true)) {
            $direction = $defaultDirection;
        }

        return [
            'column' => $column,
            'direction' => $direction,
        ];
    }

    /**
     * Obtient le paramètre de recherche sanitizé
     */
    public function getSearch(): ?string
    {
        $search = $this->input('search', $this->input('q'));
        
        if (empty($search)) {
            return null;
        }

        // Sanitize
        $search = trim((string) $search);
        $search = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $search);
        
        return $search ?: null;
    }

    /**
     * Obtient les paramètres de pagination validés
     */
    public function getPaginationParameters(int $defaultPerPage = 15): array
    {
        return [
            'page' => max(1, (int) $this->input('page', 1)),
            'per_page' => min(100, max(1, (int) $this->input('per_page', $defaultPerPage))),
        ];
    }

    /**
     * Obtient la plage de dates validée
     */
    public function getDateRange(string $startKey = 'date_debut', string $endKey = 'date_fin'): array
    {
        $start = $this->input($startKey, $this->input('start_date'));
        $end = $this->input($endKey, $this->input('end_date'));

        return [
            'start' => $this->validateDate($start),
            'end' => $this->validateDate($end),
        ];
    }

    /**
     * Valide et retourne une date ou null
     */
    protected function validateDate($date): ?string
    {
        if (empty($date)) {
            return null;
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return $date;
        }

        return null;
    }

    public function messages(): array
    {
        return [
            'page.min' => 'Le numéro de page doit être positif.',
            'page.max' => 'Le numéro de page est trop grand.',
            'per_page.min' => 'Le nombre d\'éléments par page doit être positif.',
            'per_page.max' => 'Maximum 100 éléments par page.',
            'search.max' => 'La recherche ne peut pas dépasser 255 caractères.',
            'date_debut.date_format' => 'La date de début doit être au format AAAA-MM-JJ.',
            'date_fin.date_format' => 'La date de fin doit être au format AAAA-MM-JJ.',
            'date_fin.after_or_equal' => 'La date de fin doit être après la date de début.',
        ];
    }
}
