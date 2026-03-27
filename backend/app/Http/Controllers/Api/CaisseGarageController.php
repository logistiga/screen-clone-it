<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Contrôleur façade pour les achats/primes Garage
 * Délègue à CaisseGarageAchatsController et CaisseGaragePrimesController
 */
class CaisseGarageController extends Controller
{
    use CaisseGarageHelpersTrait;

    protected CaisseGarageAchatsController $achats;
    protected CaisseGaragePrimesController $primes;

    public function __construct()
    {
        $this->achats = new CaisseGarageAchatsController();
        $this->primes = new CaisseGaragePrimesController();
    }

    // ── Refs & catégorie (static, utilisés partout) ──

    public static function buildRef(string $id): string
    {
        return 'GARAGE-ACHAT-' . $id;
    }

    public static function buildPrimeRef(string $id): string
    {
        return 'GARAGE-PRIME-' . $id;
    }

    public static function categorie(): string
    {
        return 'Achats Garage';
    }

    // ── Achats ──

    public function stats(Request $request): JsonResponse
    {
        return $this->achats->stats($request);
    }

    public function index(Request $request): JsonResponse
    {
        return $this->achats->index($request);
    }

    public function decaisser(Request $request, string $itemId): JsonResponse
    {
        return $this->achats->decaisser($request, $itemId);
    }

    public function refuser(Request $request, string $itemId): JsonResponse
    {
        return $this->achats->refuser($request, $itemId);
    }

    public function getPrimeForDecaissement(string $itemId): ?object
    {
        return $this->achats->getAchatForDecaissement($itemId);
    }

    public function fetchPrimes(?string $search): \Illuminate\Support\Collection
    {
        return $this->achats->getAchatForDecaissement($search) ? collect([$this->achats->getAchatForDecaissement($search)]) : collect();
    }

    // ── Primes ──

    public function primesStats(): JsonResponse
    {
        return $this->primes->primesStats();
    }

    public function primesIndex(Request $request): JsonResponse
    {
        return $this->primes->primesIndex($request);
    }

    public function decaisserPrime(Request $request, string $itemId): JsonResponse
    {
        return $this->primes->decaisserPrime($request, $itemId);
    }

    public function refuserPrime(Request $request, string $itemId): JsonResponse
    {
        return $this->primes->refuserPrime($request, $itemId);
    }

    public function fetchGaragePrimes(?string $search = null): \Illuminate\Support\Collection
    {
        return $this->primes->fetchGaragePrimes($search);
    }
}
