<?php

namespace App\Http\Controllers\Api\Automation\Concerns;

use App\Support\FactureStatut;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Enveloppe JSON, pagination bornée et filtres de dates communs à l'API Mora (lecture seule). */
trait AutomationResponses
{
    protected function ok(array $data, array $meta = []): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $data, 'meta' => (object) $meta], 200, [], JSON_INVALID_UTF8_SUBSTITUTE);
    }

    protected function fail(string $code, string $msg, int $status): JsonResponse
    {
        return response()->json(['success' => false, 'error' => ['code' => $code, 'message' => $msg]], $status);
    }

    /** limit : défaut 20, max 50. */
    protected function limit(Request $r): int
    {
        return max(1, min(50, (int) $r->query('limit', 20) ?: 20));
    }

    /** Retourne [debut, fin] (Y-m-d|null) ou null si une date est invalide. */
    protected function dates(Request $r): ?array
    {
        $out = [];
        foreach (['date_debut', 'date_fin'] as $k) {
            $v = $r->query($k);
            if ($v === null || $v === '') {
                $out[] = null;
                continue;
            }
            try {
                $out[] = Carbon::createFromFormat('Y-m-d', (string) $v)->toDateString();
            } catch (\Throwable $e) {
                return null;
            }
        }
        if ($out[0] && $out[1] && $out[0] > $out[1]) {
            return null;
        }
        return $out;
    }

    /** Statuts qui ne constituent pas une somme due : annulée, payée, brouillon. */
    protected function statutsNonDus(): array
    {
        return array_merge(FactureStatut::ALIAS_ANNULEE, [FactureStatut::PAYEE, 'Payée', 'payée', FactureStatut::BROUILLON]);
    }

    protected function money($v): int
    {
        return (int) round((float) $v);
    }

    protected function resteDu($ttc, $paye): int
    {
        return max(0, $this->money($ttc) - $this->money($paye));
    }
}
