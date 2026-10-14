<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Synchronisation des conteneurs et armateurs depuis OPS
 */
class SyncConteneursController extends Controller
{
    use SyncDiagnosticHelpersTrait;

    public function syncConteneurs()
    {
        try {
            $this->refreshOpsConfigFromEnv();
            Log::info('[SyncDiagnostic] Déclenchement manuel sync conteneurs');

            try { DB::connection('ops')->getPdo(); } catch (\Exception $e) {
                return response()->json(['success' => false, 'message' => 'Impossible de se connecter à la base OPS', 'debug' => ['error' => $e->getMessage()]], 503);
            }

            $result = \App\Support\SyncConteneursLock::executer(fn () => $this->executeSyncConteneurs());
            if ($result === null) {
                return response()->json(['success' => false, 'code' => 'sync_en_cours', 'message' => 'Une synchronisation des conteneurs est déjà en cours. Réessayez dans un instant.'], 409);
            }

            // Broadcaster l'event si des conteneurs ont été importés
            if ($result['conteneurs_importes'] > 0) {
                event(new \App\Events\ConteneurSynced($result['conteneurs_importes'], 0, "{$result['conteneurs_importes']} conteneur(s) importé(s) depuis OPS"));
            }

            return response()->json(['success' => true, 'message' => 'Synchronisation des conteneurs réussie', 'data' => $result]);

        } catch (\Exception $e) {
            Log::error('[SyncDiagnostic] Erreur sync conteneurs', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['success' => false, 'message' => 'Erreur lors de la synchronisation', 'debug' => ['error' => $e->getMessage()]], 500);
        }
    }

    private function executeSyncConteneurs(): array
    {
        $s = app(\App\Services\Ops\ConteneursSyncService::class)->synchroniser((bool) request()->boolean('complet'));
        $autoIgnored = $this->autoIgnorerConteneursExistants();

        return [
            'conteneurs_trouves_ops' => $s['trouves'],
            'conteneurs_importes' => $s['importes'],
            'conteneurs_mis_a_jour' => $s['mis_a_jour'],
            'conteneurs_ignores' => $s['inchanges'],
            'incremental' => $s['incremental'],
            'auto_ignored' => $autoIgnored,
            'erreurs' => $s['erreurs'],
        ];
    }

    private function autoIgnorerConteneursExistants(): int
    {
        try {
            $conteneursAIgnorer = \App\Models\ConteneurTraite::where('statut', 'en_attente')
                ->whereExists(function ($q) {
                    $q->select(DB::raw(1))
                        ->from('ordres_travail as ot')
                        ->join('conteneurs_ordres as co', 'co.ordre_id', '=', 'ot.id')
                        ->join('clients as c', 'c.id', '=', 'ot.client_id')
                        ->whereColumn('co.numero', 'conteneurs_traites.numero_conteneur')
                        ->where(function ($blQ) {
                            $blQ->whereColumn('ot.numero_bl', 'conteneurs_traites.numero_bl')
                                ->orWhere(function ($nullQ) {
                                    $nullQ->whereNull('ot.numero_bl')->whereNull('conteneurs_traites.numero_bl');
                                });
                        })
                        ->whereRaw('UPPER(TRIM(c.nom)) = UPPER(TRIM(conteneurs_traites.client_nom))');
                })
                ->get();

            $count = 0;
            foreach ($conteneursAIgnorer as $conteneur) {
                $conteneur->update(['statut' => 'affecte', 'processed_at' => now()]);
                $count++;
            }
            return $count;
        } catch (\Exception $e) {
            return 0;
        }
    }

    public function syncArmateurs()
    {
        try {
            $this->refreshOpsConfigFromEnv();

            try { DB::connection('ops')->getPdo(); } catch (\Exception $e) {
                return response()->json(['success' => false, 'message' => 'Impossible de se connecter à la base OPS', 'debug' => ['error' => $e->getMessage()]], 503);
            }

            try {
                $opsArmateurs = DB::connection('ops')->table('armateurs')->select(['id', 'nom', 'code', 'type_conteneur'])->get();
            } catch (\Exception $e) {
                $opsArmateurs = DB::connection('ops')->table('armateurs')->select(['id', 'nom', 'code'])->get();
                foreach ($opsArmateurs as $arm) { $arm->type_conteneur = null; }
            }

            $imported = 0; $updated = 0; $errors = [];

            foreach ($opsArmateurs as $opsArm) {
                try {
                    $existing = \App\Models\Armateur::withTrashed()->where('code', $opsArm->code)->first();
                    if ($existing) {
                        if ($existing->trashed()) { $existing->restore(); }
                        $existing->update(['nom' => $opsArm->nom, 'code' => $opsArm->code, 'actif' => true]);
                        $updated++;
                    } else {
                        \App\Models\Armateur::create(['nom' => $opsArm->nom, 'code' => $opsArm->code, 'type_conteneur' => $opsArm->type_conteneur, 'actif' => true]);
                        $imported++;
                    }
                } catch (\Exception $e) { $errors[] = "Armateur {$opsArm->code}: {$e->getMessage()}"; }
            }

            $opsCodes = $opsArmateurs->pluck('code')->filter()->map(fn($c) => trim($c))->toArray();
            $deleted = 0;
            foreach (\App\Models\Armateur::whereNotNull('code')->get() as $local) {
                if (!in_array(trim($local->code), $opsCodes)) { $local->delete(); $deleted++; }
            }

            return response()->json([
                'success' => true,
                'message' => "Synchronisation réussie: {$imported} ajoutés, {$updated} mis à jour, {$deleted} supprimés",
                'data' => ['armateurs_trouves_ops' => $opsArmateurs->count(), 'armateurs_importes' => $imported, 'armateurs_mis_a_jour' => $updated, 'armateurs_supprimes' => $deleted, 'erreurs' => $errors],
                'created' => $imported, 'nouveaux' => $imported,
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Erreur lors de la synchronisation des armateurs', 'debug' => ['error' => $e->getMessage()]], 500);
        }
    }

    public function syncAll()
    {
        try {
            $this->refreshOpsConfigFromEnv();

            try { DB::connection('ops')->getPdo(); } catch (\Exception $e) {
                return response()->json(['success' => false, 'message' => 'Impossible de se connecter à la base OPS', 'debug' => ['error' => $e->getMessage()]], 503);
            }

            $exitCode = Artisan::call('sync:from-ops');
            $output = Artisan::output();

            if ($exitCode === 0) {
                return response()->json(['success' => true, 'message' => 'Synchronisation complète réussie', 'debug' => ['output' => $output]]);
            }

            return response()->json(['success' => false, 'message' => 'Échec de la synchronisation complète', 'debug' => ['exit_code' => $exitCode, 'output' => $output]], 500);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Erreur lors de la synchronisation', 'debug' => ['error' => $e->getMessage()]], 500);
        }
    }
}
