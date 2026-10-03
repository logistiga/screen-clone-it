<?php

namespace App\Services\Caisse;

use App\Models\Banque;
use App\Models\MouvementCaisse;
use App\Services\CaisseService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Écritures de caisse protégées contre la concurrence.
 * - Caisse : verrou nommé MySQL (GET_LOCK) autour de "lire le solde + écrire".
 * - Banque : verrou de ligne (lockForUpdate) sur la banque.
 * Lève SoldeInsuffisantException si le solde ne suffit pas.
 */
class CaisseMouvementService
{
    private const LOCK_CAISSE = 'logistiga_caisse_solde';

    public function __construct(private CaisseService $caisseService) {}

    public function creer(string $type, array $data): MouvementCaisse
    {
        return $this->avecVerrouCaisse($data['source'] === 'caisse', function () use ($type, $data) {
            return DB::transaction(function () use ($type, $data) {
                if ($type === 'sortie') {
                    $this->verifierSolde($data['source'], $data['banque_id'] ?? null, (float) $data['montant']);
                }
                $data['type'] = $type;
                $mouvement = MouvementCaisse::create($data);
                if (!empty($data['banque_id'])) {
                    $this->ajusterBanque((int) $data['banque_id'], (float) $data['montant'], $type === 'entree');
                }
                return $mouvement->fresh(['banque']);
            });
        });
    }

    public function modifier(MouvementCaisse $mouvement, array $validated): MouvementCaisse
    {
        return $this->avecVerrouCaisse($mouvement->source === 'caisse', function () use ($mouvement, $validated) {
            return DB::transaction(function () use ($mouvement, $validated) {
                $ancien = (float) $mouvement->montant;
                $difference = isset($validated['montant']) ? (float) $validated['montant'] - $ancien : 0.0;

                if ($difference > 0 && $mouvement->type === 'sortie') {
                    $this->verifierSolde($mouvement->source, $mouvement->banque_id, $difference);
                }

                $mouvement->update($validated);

                if ($difference != 0 && $mouvement->banque_id) {
                    $this->ajusterBanque((int) $mouvement->banque_id, $difference, $mouvement->type === 'entree');
                }
                return $mouvement->fresh();
            });
        });
    }

    public function supprimer(MouvementCaisse $mouvement, ?int $userId): void
    {
        DB::transaction(function () use ($mouvement, $userId) {
            $this->archiver($mouvement, $userId);
            if ($mouvement->banque_id) {
                // Inverse du mouvement d'origine
                $this->ajusterBanque((int) $mouvement->banque_id, (float) $mouvement->montant, $mouvement->type !== 'entree');
            }
            $mouvement->delete();
        });
    }

    /** Copie intégrale du mouvement avant suppression (trace comptable). */
    private function archiver(MouvementCaisse $mouvement, ?int $userId): void
    {
        if (!Schema::hasTable('mouvements_caisse_supprimes')) {
            Log::warning('Archive des suppressions de caisse absente (migration non lancée)', ['id' => $mouvement->id]);
            return;
        }
        DB::table('mouvements_caisse_supprimes')->insert([
            'mouvement_id' => $mouvement->id,
            'type' => $mouvement->type,
            'source' => $mouvement->source,
            'montant' => $mouvement->montant,
            'date_mouvement' => $mouvement->date,
            'banque_id' => $mouvement->banque_id,
            'donnees' => json_encode($mouvement->getAttributes(), JSON_INVALID_UTF8_SUBSTITUTE),
            'supprime_par' => $userId,
            'supprime_le' => now(),
        ]);
    }

    private function verifierSolde(string $source, $banqueId, float $montant): void
    {
        if ($source === 'caisse') {
            $solde = $this->caisseService->getSoldeCaisse();
            if ($montant > $solde) {
                throw new SoldeInsuffisantException('Solde caisse insuffisant', $solde);
            }
            return;
        }
        if ($source === 'banque' && $banqueId) {
            $banque = Banque::whereKey($banqueId)->lockForUpdate()->first();
            if ($banque && $montant > (float) $banque->solde) {
                throw new SoldeInsuffisantException('Solde bancaire insuffisant', (float) $banque->solde);
            }
        }
    }

    private function ajusterBanque(int $banqueId, float $montant, bool $credit): void
    {
        $banque = Banque::whereKey($banqueId)->lockForUpdate()->first();
        if (!$banque) return;
        $credit ? $banque->increment('solde', $montant) : $banque->decrement('solde', $montant);
    }

    /** Sérialise les écritures caisse : une seule à la fois. */
    private function avecVerrouCaisse(bool $actif, callable $fn)
    {
        if (!$actif || DB::getDriverName() !== 'mysql') {
            return $fn();
        }
        $ok = DB::selectOne('SELECT GET_LOCK(?, 10) AS l', [self::LOCK_CAISSE]);
        if (!$ok || (int) $ok->l !== 1) {
            throw new SoldeInsuffisantException('Caisse occupée, réessayez dans un instant', null, 409);
        }
        try {
            return $fn();
        } finally {
            DB::selectOne('SELECT RELEASE_LOCK(?) AS r', [self::LOCK_CAISSE]);
        }
    }
}
