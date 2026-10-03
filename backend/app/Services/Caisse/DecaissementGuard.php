<?php

namespace App\Services\Caisse;

use App\Models\Banque;
use App\Services\CaisseService;
use Illuminate\Support\Facades\DB;

/**
 * Garde commune aux décaissements de primes / achats (OPS, CNV, garage, hors Libreville, primes locales).
 * À appeler juste après DB::beginTransaction(), puis liberer() après commit/rollBack.
 * - Une seule opération de caisse à la fois (verrou nommé partagé avec CaisseMouvementService).
 * - Re-vérifie le doublon de référence sous verrou.
 * - Refuse un paiement complet si des avances existent déjà.
 * - Vérifie le solde (caisse ou banque) et débite la banque (le solde bancaire est stocké).
 */
class DecaissementGuard
{
    private const LOCK = 'logistiga_caisse_solde';
    private static bool $verrouille = false;

    public static function avant(?string $modePaiement, ?int $banqueId, float $montant, string $reference): void
    {
        self::verrouiller();

        if (DB::table('mouvements_caisse')->where('reference', $reference)->exists()) {
            throw new SoldeInsuffisantException('Ce décaissement a déjà été enregistré');
        }
        if (!preg_match('/-T\d+$/', $reference)
            && DB::table('mouvements_caisse')->where('reference', 'like', $reference . '-T%')->exists()) {
            throw new SoldeInsuffisantException('Des avances existent déjà : utilisez le paiement partiel pour régler le reste');
        }

        $isCaisse = in_array($modePaiement, ['Espèces', 'Mobile Money'], true);
        if ($isCaisse) {
            $solde = app(CaisseService::class)->getSoldeCaisse();
            if ($montant > $solde) {
                throw new SoldeInsuffisantException('Solde caisse insuffisant', $solde);
            }
            return;
        }

        if (!$banqueId) {
            throw new SoldeInsuffisantException('Choisissez la banque pour un paiement par chèque ou virement');
        }
        {
            $banque = Banque::whereKey($banqueId)->lockForUpdate()->first();
            if (!$banque) {
                throw new SoldeInsuffisantException('Banque introuvable');
            }
            if ($montant > (float) $banque->solde) {
                throw new SoldeInsuffisantException('Solde bancaire insuffisant', (float) $banque->solde);
            }
            $banque->decrement('solde', $montant); // annulé par le rollBack en cas d'échec
        }
    }

    public static function liberer(): void
    {
        if (self::$verrouille && DB::getDriverName() === 'mysql') {
            DB::selectOne('SELECT RELEASE_LOCK(?) AS r', [self::LOCK]);
        }
        self::$verrouille = false;
    }

    private static function verrouiller(): void
    {
        if (self::$verrouille || DB::getDriverName() !== 'mysql') {
            return;
        }
        $ok = DB::selectOne('SELECT GET_LOCK(?, 10) AS l', [self::LOCK]);
        if (!$ok || (int) $ok->l !== 1) {
            throw new SoldeInsuffisantException('Caisse occupée, réessayez dans un instant', null, 409);
        }
        self::$verrouille = true;
    }
}
