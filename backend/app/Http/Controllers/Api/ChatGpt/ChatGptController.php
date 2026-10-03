<?php

namespace App\Http\Controllers\Api\ChatGpt;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Facture;
use App\Models\Paiement;
use App\Services\ChatGpt\QueryEngine;
use App\Services\ChatGpt\QueryException;
use App\Services\ChatGpt\ResourceRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** API de lecture pour ChatGPT. Aucune écriture métier. */
class ChatGptController extends Controller
{
    public function __construct(private QueryEngine $engine) {}

    public function schema(): JsonResponse
    {
        $resources = [];
        foreach (ResourceRegistry::names() as $name) {
            $def = ResourceRegistry::get($name);
            $resources[$name] = [
                'label' => $def['label'],
                'fields' => $def['fields'],
                'searchable' => $def['search'],
                'date_field' => $def['date'],
                'relations' => array_keys($def['relations']),
            ];
        }
        return $this->ok([
            'resources' => $resources,
            'operators' => array_keys(QueryEngine::OPERATORS),
            'aggregations' => QueryEngine::AGGREGATES,
            'periods' => array_keys(QueryEngine::PERIODS),
            'currency' => 'XAF (FCFA), montants arrondis à l\'entier',
            'limits' => ['max_limit' => config('chatgpt.max_limit'), 'default_limit' => config('chatgpt.default_limit')],
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));
        if (mb_strlen($q) < 2 || mb_strlen($q) > 100) {
            return $this->fail('INVALID_QUERY', 'Le paramètre q doit faire entre 2 et 100 caractères.');
        }
        $only = array_filter(explode(',', (string) $request->query('resources', '')));
        $per = (int) config('chatgpt.search_limit_per_resource', 10);
        $like = '%' . addcslashes($q, '%_\\') . '%';
        $results = [];

        foreach (ResourceRegistry::names() as $name) {
            if ($only && !in_array($name, $only, true)) {
                continue;
            }
            $def = ResourceRegistry::get($name);
            if (!$def['search']) {
                continue;
            }
            $rows = $def['model']::query()->select($def['fields'])
                ->where(function ($w) use ($def, $like) {
                    foreach ($def['search'] as $col) {
                        $w->orWhere($col, 'like', $like);
                    }
                })->orderByDesc('id')->limit($per)->get();
            if ($rows->isNotEmpty()) {
                $results[] = ['resource' => $name, 'count' => $rows->count(), 'items' => $rows->toArray()];
            }
        }
        return $this->ok($results, ['q' => $q]);
    }

    public function query(Request $request): JsonResponse
    {
        return $this->runQuery((string) $request->input('resource', ''), $request->all());
    }

    public function list(Request $request, string $resource): JsonResponse
    {
        $input = $request->query();
        $filters = [];
        foreach ((array) ($input['filter'] ?? []) as $field => $value) {
            $filters[] = ['field' => $field, 'op' => 'eq', 'value' => $value];
        }
        $def = ResourceRegistry::get($resource);
        if ($def && (!empty($input['date_from']) || !empty($input['date_to']))) {
            $filters[] = ['field' => $def['date'], 'op' => 'between',
                'value' => [$input['date_from'] ?? '1970-01-01', $input['date_to'] ?? '2999-12-31']];
        }
        return $this->runQuery($resource, [
            'filters' => $filters,
            'sort' => isset($input['sort']) ? [(string) $input['sort']] : [],
            'limit' => $input['limit'] ?? null,
            'page' => $input['page'] ?? null,
        ]);
    }

    public function clientSummary(int $id): JsonResponse
    {
        $client = Client::query()->select(['id', 'nom', 'email', 'telephone', 'ville', 'solde'])->find($id);
        if (!$client) {
            return $this->fail('NOT_FOUND', 'Client introuvable.', 404);
        }
        $f = Facture::query()->where('client_id', $id)->where('statut', '!=', 'annulee');
        $impayees = (clone $f)->whereColumn('montant_paye', '<', 'montant_ttc');

        return $this->ok([
            'client' => $client,
            'factures' => [
                'nombre' => (clone $f)->count(),
                'total_ttc' => round((float) (clone $f)->sum('montant_ttc')),
                'total_paye' => round((float) (clone $f)->sum('montant_paye')),
                'impayees_nombre' => (clone $impayees)->count(),
                'reste_a_payer' => round((float) (clone $impayees)->selectRaw('SUM(montant_ttc - montant_paye) as r')->value('r')),
                'derniere' => (clone $f)->orderByDesc('date_creation')->value('numero'),
            ],
            'paiements_total' => round((float) Paiement::query()->where('client_id', $id)->sum('montant')),
        ]);
    }

    public function unpaidInvoices(Request $request): JsonResponse
    {
        [$limit, $page] = $this->engine->paging($request->query());
        $q = Facture::query()->with('client:id,nom')
            ->select(['id', 'numero', 'client_id', 'date_creation', 'date_echeance', 'montant_ttc', 'montant_paye', 'statut'])
            ->where('statut', '!=', 'annulee')->whereColumn('montant_paye', '<', 'montant_ttc');
        if ($request->filled('client_id')) {
            $q->where('client_id', (int) $request->query('client_id'));
        }
        $total = (clone $q)->count();
        $reste = round((float) (clone $q)->toBase()->selectRaw('SUM(montant_ttc - montant_paye) as r')->value('r'));
        $rows = $q->orderBy('date_echeance')->forPage($page, $limit)->get();

        return $this->ok($rows->toArray(), ['page' => $page, 'limit' => $limit, 'total' => $total, 'reste_a_payer_total' => $reste]);
    }

    public function revenue(Request $request): JsonResponse
    {
        $from = (string) $request->query('date_from', now()->startOfMonth()->toDateString());
        $to = (string) $request->query('date_to', now()->toDateString());
        $period = (string) $request->query('period', 'month');

        return $this->runQuery('factures', [
            'filters' => array_filter([
                ['field' => 'date_creation', 'op' => 'between', 'value' => [$from, $to]],
                ['field' => 'statut', 'op' => 'neq', 'value' => 'annulee'],
                $request->filled('client_id') ? ['field' => 'client_id', 'op' => 'eq', 'value' => (int) $request->query('client_id')] : null,
            ]),
            'period' => $period,
            'aggregations' => [
                ['fn' => 'count', 'field' => 'id'], ['fn' => 'sum', 'field' => 'montant_ht'],
                ['fn' => 'sum', 'field' => 'montant_ttc'], ['fn' => 'sum', 'field' => 'montant_paye'],
            ],
        ], ['date_from' => $from, 'date_to' => $to]);
    }

    private function runQuery(string $resource, array $input, array $extraMeta = []): JsonResponse
    {
        $def = ResourceRegistry::get($resource);
        if (!$def) {
            return $this->fail('INVALID_RESOURCE', "Ressource '$resource' inconnue. Voir /schema.", 404);
        }
        try {
            $result = $this->engine->run($def, $input);
            return $this->ok($result['data'], array_merge($result['meta'], $extraMeta, ['resource' => $resource]));
        } catch (QueryException $e) {
            return $this->fail($e->errorCode, $e->getMessage());
        } catch (\Throwable $e) {
            report($e);
            return $this->fail('QUERY_FAILED', 'Requête impossible à exécuter.', 422);
        }
    }

    private function ok($data, array $meta = []): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $data, 'meta' => (object) $meta], 200, [], JSON_INVALID_UTF8_SUBSTITUTE);
    }

    private function fail(string $code, string $message, int $status = 422): JsonResponse
    {
        return response()->json(['success' => false, 'error' => ['code' => $code, 'message' => $message]], $status);
    }
}
