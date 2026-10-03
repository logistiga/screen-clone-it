<?php

namespace App\Services\ChatGpt;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Moteur de requêtes structurées : uniquement des éléments de la liste blanche,
 * valeurs toujours liées (bindings), jamais de SQL fourni par le client.
 */
class QueryEngine
{
    public const OPERATORS = ['eq' => '=', 'neq' => '!=', 'gt' => '>', 'gte' => '>=', 'lt' => '<', 'lte' => '<=',
        'like' => 'like', 'in' => 'in', 'between' => 'between', 'null' => 'null', 'not_null' => 'not_null'];
    public const AGGREGATES = ['count', 'sum', 'avg', 'min', 'max'];
    public const PERIODS = ['day' => '%Y-%m-%d', 'month' => '%Y-%m', 'year' => '%Y'];

    public function run(array $def, array $input): array
    {
        $query = $def['model']::query();
        $this->applyFilters($query, $def, (array) ($input['filters'] ?? []));

        if (!empty($input['aggregations'])) {
            return $this->aggregate($query, $def, $input);
        }

        $fields = $this->pickFields($def, (array) ($input['fields'] ?? []));
        $query->select($fields);
        $this->applyRelations($query, $def, (array) ($input['relations'] ?? []), $fields);

        foreach ((array) ($input['sort'] ?? []) as $sort) {
            $field = is_array($sort) ? ($sort['field'] ?? '') : ltrim((string) $sort, '-');
            $dir = is_array($sort) ? (($sort['direction'] ?? 'asc') === 'desc' ? 'desc' : 'asc')
                : (str_starts_with((string) $sort, '-') ? 'desc' : 'asc');
            $this->assertField($def, $field);
            $query->orderBy($field, $dir);
        }
        if (empty($input['sort'])) {
            $query->orderByDesc('id');
        }

        [$limit, $page] = $this->paging($input);
        $total = (clone $query)->toBase()->getCountForPagination();
        $rows = $query->forPage($page, $limit)->get();

        return ['data' => $rows->toArray(), 'meta' => ['page' => $page, 'limit' => $limit, 'total' => $total]];
    }

    public function applyFilters(Builder $query, array $def, array $filters): void
    {
        foreach ($filters as $i => $filter) {
            if (!is_array($filter)) {
                throw new QueryException('INVALID_FILTER', "Filtre #$i invalide.");
            }
            $field = (string) ($filter['field'] ?? '');
            $op = (string) ($filter['op'] ?? 'eq');
            $value = $filter['value'] ?? null;
            $this->assertField($def, $field);
            if (!isset(self::OPERATORS[$op])) {
                throw new QueryException('INVALID_FILTER', "Opérateur '$op' non autorisé.");
            }
            match ($op) {
                'in' => $query->whereIn($field, array_slice((array) $value, 0, 200)),
                'between' => (is_array($value) && count($value) === 2)
                    ? $query->whereBetween($field, array_values($value))
                    : throw new QueryException('INVALID_FILTER', "'between' attend [min, max]."),
                'null' => $query->whereNull($field),
                'not_null' => $query->whereNotNull($field),
                'like' => $query->where($field, 'like', '%' . addcslashes((string) $value, '%_\\') . '%'),
                default => is_scalar($value) || $value === null
                    ? $query->where($field, self::OPERATORS[$op], $value)
                    : throw new QueryException('INVALID_FILTER', "Valeur invalide pour '$field'."),
            };
        }
    }

    private function aggregate(Builder $query, array $def, array $input): array
    {
        $selects = [];
        $bindings = [];
        $groupCols = [];

        foreach ((array) ($input['group_by'] ?? []) as $g) {
            $this->assertField($def, (string) $g);
            $selects[] = "`$g`";
            $groupCols[] = "`$g`";
        }
        if (!empty($input['period'])) {
            $period = (string) $input['period'];
            if (!isset(self::PERIODS[$period])) {
                throw new QueryException('INVALID_PERIOD', 'Période autorisée : day, month, year.');
            }
            $dateField = $def['date'];
            $selects[] = "DATE_FORMAT(`$dateField`, ?) as periode";
            $bindings[] = self::PERIODS[$period];
            $groupCols[] = 'periode';
        }

        foreach ((array) $input['aggregations'] as $agg) {
            $fn = strtolower((string) ($agg['fn'] ?? ''));
            $field = (string) ($agg['field'] ?? 'id');
            if (!in_array($fn, self::AGGREGATES, true)) {
                throw new QueryException('INVALID_AGGREGATION', "Fonction '$fn' non autorisée.");
            }
            $this->assertField($def, $field);
            $selects[] = strtoupper($fn) . "(`$field`) as {$fn}_{$field}";
        }

        $query->selectRaw(implode(', ', $selects), $bindings);
        if ($groupCols) {
            $query->groupByRaw(implode(', ', $groupCols))->orderByRaw(implode(', ', $groupCols))->limit(500);
        }
        $rows = $query->toBase()->get()->map(function ($r) {
            return array_map(fn ($v) => is_numeric($v) ? round((float) $v) : $v, (array) $r);
        });

        return ['data' => $rows->all(), 'meta' => ['groups' => $rows->count()]];
    }

    private function applyRelations(Builder $query, array $def, array $relations, array &$fields): void
    {
        foreach ($relations as $rel) {
            if (!isset($def['relations'][$rel])) {
                throw new QueryException('INVALID_RELATION', "Relation '$rel' non autorisée.");
            }
            $cols = implode(',', $def['relations'][$rel]);
            $query->with("$rel:$cols");
            $fk = $rel . '_id';
            if (in_array($fk, $def['fields'], true) && !in_array($fk, $fields, true)) {
                $query->addSelect($fk);
            }
        }
    }

    private function pickFields(array $def, array $fields): array
    {
        if (!$fields) {
            return $def['fields'];
        }
        foreach ($fields as $f) {
            $this->assertField($def, (string) $f);
        }
        return array_values(array_unique(array_merge(['id'], $fields)));
    }

    public function assertField(array $def, string $field): void
    {
        if (!in_array($field, $def['fields'], true)) {
            throw new QueryException('INVALID_FIELD', "Champ '$field' non autorisé pour cette ressource.");
        }
    }

    public function paging(array $input): array
    {
        $max = (int) config('chatgpt.max_limit', 200);
        $limit = max(1, min($max, (int) ($input['limit'] ?? config('chatgpt.default_limit', 50))));
        $page = max(1, (int) ($input['page'] ?? 1));
        return [$limit, $page];
    }
}
