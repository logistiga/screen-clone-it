<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Controller pour le diagnostic et déclenchement manuel de la synchronisation OPS
 */
class SyncDiagnosticController extends Controller
{
    /**
     * Rafraîchit dynamiquement la config OPS depuis les variables d'environnement.
     * Utile si la config est en cache côté Laravel (config:cache) alors que .env a été mis à jour.
     */
    private function refreshOpsConfigFromEnv(): void
    {
        $host = env('OPS_DB_HOST');
        $database = env('OPS_DB_DATABASE');

        // Si l'env n'est pas configuré, on ne touche à rien.
        if (empty($host) || empty($database)) {
            return;
        }

        config([
            'database.connections.ops.host' => $host,
            'database.connections.ops.port' => env('OPS_DB_PORT', '3306'),
            'database.connections.ops.database' => $database,
            'database.connections.ops.username' => env('OPS_DB_USERNAME'),
            'database.connections.ops.password' => env('OPS_DB_PASSWORD'),
            'database.connections.ops.unix_socket' => env('OPS_DB_SOCKET', ''),
        ]);

        // Forcer Laravel à recréer la connexion avec la config à jour
        DB::purge('ops');
    }

    /**
     * Teste la connexion à la base de données OPS
     */
    public function healthOps()
    {
        try {
            $this->refreshOpsConfigFromEnv();

            // Vérifier si la connexion OPS est configurée
            $opsConfig = config('database.connections.ops');
            
            if (empty($opsConfig['host']) || empty($opsConfig['database'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Connexion OPS non configurée',
                    'debug' => [
                        'host_configured' => !empty($opsConfig['host']),
                        'database_configured' => !empty($opsConfig['database']),
                    ]
                ], 503);
            }

            // Tester la connexion
            $result = DB::connection('ops')->select('SELECT 1 as test');
            
            if (!empty($result)) {
                // Compter les tables disponibles
                $tables = DB::connection('ops')->select('SHOW TABLES');
                
                return response()->json([
                    'success' => true,
                    'message' => 'Connexion OPS réussie',
                    'debug' => [
                        'host' => $opsConfig['host'],
                        'database' => $opsConfig['database'],
                        'tables_count' => count($tables),
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Connexion OPS échouée - pas de réponse',
            ], 503);

        } catch (\Exception $e) {
            Log::error('[SyncDiagnostic] Erreur connexion OPS', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur de connexion OPS',
                'debug' => [
                    'error' => $e->getMessage(),
                ]
            ], 503);
        }
    }

    /**
     * Déclenche la synchronisation des conteneurs depuis OPS
     */
    public function syncConteneurs()
    {
        try {
            $this->refreshOpsConfigFromEnv();
            Log::info('[SyncDiagnostic] Déclenchement manuel sync conteneurs');

            // Vérifier d'abord la connexion OPS
            try {
                DB::connection('ops')->getPdo();
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de se connecter à la base OPS',
                    'debug' => [
                        'error' => $e->getMessage(),
                    ]
                ], 503);
            }

            // Exécuter la synchronisation directement sans passer par Artisan
            // pour éviter les problèmes de cache de commandes
            $result = $this->executeSyncConteneurs();

            return response()->json([
                'success' => true,
                'message' => 'Synchronisation des conteneurs réussie',
                'data' => $result,
            ]);

        } catch (\Exception $e) {
            Log::error('[SyncDiagnostic] Erreur sync conteneurs', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la synchronisation',
                'debug' => [
                    'error' => $e->getMessage(),
                ]
            ], 500);
        }
    }

    /**
     * Exécute la synchronisation des conteneurs directement
     */
    private function executeSyncConteneurs(): array
    {
        $imported = 0;
        $skipped = 0;
        $errors = [];

        // Lecture depuis sortie_conteneurs (base logiwkuh_tc)
        // Jointures pour résoudre les FK client_id, armateur_id, transitaire_id
        $opsConteneurs = DB::connection('ops')
            ->table('sortie_conteneurs as sc')
            ->leftJoin('clients as c', 'sc.client_id', '=', 'c.id')
            ->leftJoin('armateurs as a', 'sc.armateur_id', '=', 'a.id')
            ->leftJoin('transitaires as t', 'sc.transitaire_id', '=', 't.id')
            ->select([
                'sc.id as sortie_id_externe',
                'sc.numero_conteneur',
                'sc.numero_bl',
                'sc.type_conteneur',
                'c.nom as nom_client',
                'a.code as code_armateur',
                'a.nom as armateur_nom',
                't.nom as nom_transitaire',
                'sc.camion_id',
                'sc.remorque_id',
                'sc.type_transport',
                'sc.type_detention',
                'sc.jours_gratuits',
            ])
            ->get();

        Log::info('[SyncDiagnostic] Conteneurs trouvés dans OPS', ['count' => $opsConteneurs->count()]);

        foreach ($opsConteneurs as $opsConteneur) {
            // Vérifier si déjà synchronisé
            $existeDejaSync = \App\Models\ConteneurTraite::where('sortie_id_externe', $opsConteneur->sortie_id_externe)->exists();

            if ($existeDejaSync) {
                $skipped++;
                continue;
            }

            try {
                // Insérer dans conteneurs_traites
                \App\Models\ConteneurTraite::create([
                    'sortie_id_externe' => $opsConteneur->sortie_id_externe,
                    'numero_conteneur' => $opsConteneur->numero_conteneur,
                    'numero_bl' => $opsConteneur->numero_bl,
                    'type_conteneur' => $opsConteneur->type_conteneur,
                    'armateur_code' => $opsConteneur->code_armateur,
                    'armateur_nom' => $opsConteneur->armateur_nom,
                    'client_nom' => $opsConteneur->nom_client,
                    'client_adresse' => null,
                    'transitaire_nom' => $opsConteneur->nom_transitaire,
                    'date_sortie' => null,
                    'date_retour' => null,
                    'camion_id_externe' => $opsConteneur->camion_id,
                    'remorque_id_externe' => $opsConteneur->remorque_id,
                    'prime_chauffeur' => null,
                    'destination_type' => $opsConteneur->type_detention,
                    'destination_adresse' => null,
                    'statut_ops' => null,
                    'statut' => 'en_attente',
                    'source_system' => 'logistiga_ops',
                    'synced_at' => now(),
                ]);

                // Enrichir les types de conteneurs par armateur
                if (!empty($opsConteneur->type_conteneur) && !empty($opsConteneur->code_armateur)) {
                    $armateur = \App\Models\Armateur::where('code', $opsConteneur->code_armateur)->first();
                    if ($armateur && !empty($opsConteneur->type_conteneur)) {
                        $armateur->update(['type_conteneur' => $opsConteneur->type_conteneur]);
                    }
                }

                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Conteneur {$opsConteneur->numero_conteneur}: {$e->getMessage()}";
                Log::error('[SyncDiagnostic] Erreur insertion conteneur', [
                    'conteneur' => $opsConteneur->numero_conteneur,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Auto-ignorer les conteneurs qui existent déjà dans un OT avec même client + BL + numéro conteneur
        $autoIgnored = $this->autoIgnorerConteneursExistants();

        Log::info('[SyncDiagnostic] Sync conteneurs terminée', [
            'total_ops' => $opsConteneurs->count(),
            'imported' => $imported,
            'skipped' => $skipped,
            'auto_ignored' => $autoIgnored,
            'errors' => count($errors),
        ]);

        return [
            'conteneurs_trouves_ops' => $opsConteneurs->count(),
            'conteneurs_importes' => $imported,
            'conteneurs_ignores' => $skipped,
            'auto_ignored' => $autoIgnored,
            'erreurs' => $errors,
        ];
    }

    /**
     * Auto-marquer comme affectés les conteneurs en_attente qui existent déjà dans un OT
     * avec même numéro conteneur + même BL + même client
     */
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
                                    $nullQ->whereNull('ot.numero_bl')
                                          ->whereNull('conteneurs_traites.numero_bl');
                                });
                        })
                        ->whereRaw('UPPER(TRIM(c.nom)) = UPPER(TRIM(conteneurs_traites.client_nom))');
                })
                ->get();

            $count = 0;
            foreach ($conteneursAIgnorer as $conteneur) {
                $conteneur->update([
                    'statut' => 'affecte',
                    'processed_at' => now(),
                ]);
                $count++;
            }

            if ($count > 0) {
                Log::info('[SyncDiagnostic] Conteneurs auto-marqués comme affectés', ['count' => $count]);
            }

            return $count;
        } catch (\Exception $e) {
            Log::warning('[SyncDiagnostic] Erreur auto-ignore conteneurs (non bloquant)', [
                'error' => $e->getMessage(),
            ]);
            return 0;
        }
    }

    /**
      * Déclenche la synchronisation des armateurs depuis OPS
      */
    public function syncArmateurs()
    {
        try {
            $this->refreshOpsConfigFromEnv();
            Log::info('[SyncDiagnostic] Déclenchement manuel sync armateurs');

            // Vérifier d'abord la connexion OPS
            try {
                DB::connection('ops')->getPdo();
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de se connecter à la base OPS',
                    'debug' => [
                        'error' => $e->getMessage(),
                    ]
                ], 503);
            }

            // Lire les armateurs depuis logiwkuh_tc
            // Tenter avec type_conteneur, sinon sans
            try {
                $opsArmateurs = DB::connection('ops')
                    ->table('armateurs')
                    ->select(['id', 'nom', 'code', 'type_conteneur'])
                    ->get();
            } catch (\Exception $e) {
                Log::warning('[SyncDiagnostic] Colonne type_conteneur absente dans OPS armateurs, lecture sans', [
                    'error' => $e->getMessage(),
                ]);
                $opsArmateurs = DB::connection('ops')
                    ->table('armateurs')
                    ->select(['id', 'nom', 'code'])
                    ->get();
                foreach ($opsArmateurs as $arm) {
                    $arm->type_conteneur = null;
                }
            }

            Log::info('[SyncDiagnostic] Armateurs OPS bruts', [
                'armateurs' => $opsArmateurs->map(fn($a) => ['code' => $a->code, 'nom' => $a->nom, 'type' => $a->type_conteneur ?? null])->toArray(),
            ]);

            $imported = 0;
            $updated = 0;
            $errors = [];

            foreach ($opsArmateurs as $opsArm) {
                try {
                    $existing = \App\Models\Armateur::withTrashed()
                        ->where('code', $opsArm->code)
                        ->first();

                    if ($existing) {
                        // Restaurer si supprimé
                        if ($existing->trashed()) {
                            $existing->restore();
                        }
                        $updateData = [
                            'nom' => $opsArm->nom,
                            'code' => $opsArm->code,
                            'actif' => true,
                        ];
                        // Ne pas écraser type_conteneur avec NULL
                        if (!empty($opsArm->type_conteneur)) {
                            $updateData['type_conteneur'] = $opsArm->type_conteneur;
                        }
                        $existing->update($updateData);
                        $updated++;
                    } else {
                        \App\Models\Armateur::create([
                            'nom' => $opsArm->nom,
                            'code' => $opsArm->code,
                            'type_conteneur' => $opsArm->type_conteneur,
                            'actif' => true,
                        ]);
                        $imported++;
                    }
                } catch (\Exception $e) {
                    $errors[] = "Armateur {$opsArm->code}: {$e->getMessage()}";
                }
            }

            // Supprimer les armateurs locaux dont le code n'existe plus dans OPS
            $opsCodes = $opsArmateurs->pluck('code')->filter()->map(fn($c) => trim($c))->toArray();
            $deleted = 0;

            $localArmateurs = \App\Models\Armateur::whereNotNull('code')->get();
            foreach ($localArmateurs as $local) {
                if (!in_array(trim($local->code), $opsCodes)) {
                    $local->delete(); // soft-delete
                    $deleted++;
                }
            }

            Log::info('[SyncDiagnostic] Sync armateurs terminée', [
                'total_ops' => $opsArmateurs->count(),
                'imported' => $imported,
                'updated' => $updated,
                'deleted' => $deleted,
            ]);

            return response()->json([
                'success' => true,
                'message' => "Synchronisation réussie: {$imported} ajoutés, {$updated} mis à jour, {$deleted} supprimés",
                'data' => [
                    'armateurs_trouves_ops' => $opsArmateurs->count(),
                    'armateurs_importes' => $imported,
                    'armateurs_mis_a_jour' => $updated,
                    'armateurs_supprimes' => $deleted,
                    'erreurs' => $errors,
                    'debug_ops_brut' => $opsArmateurs->map(fn($a) => [
                        'code' => $a->code,
                        'nom' => $a->nom,
                        'type_conteneur' => $a->type_conteneur ?? '(NULL)',
                    ])->toArray(),
                ],
                'created' => $imported,
                'nouveaux' => $imported,
            ]);

        } catch (\Exception $e) {
            Log::error('[SyncDiagnostic] Erreur sync armateurs', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la synchronisation des armateurs',
                'debug' => [
                    'error' => $e->getMessage(),
                ]
            ], 500);
        }
    }

    /**
     * Synchronisation complète (conteneurs + armateurs)
     */
    public function syncAll()
    {
        try {
            $this->refreshOpsConfigFromEnv();
            Log::info('[SyncDiagnostic] Déclenchement manuel sync complète');

            // Vérifier d'abord la connexion OPS
            try {
                DB::connection('ops')->getPdo();
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de se connecter à la base OPS',
                    'debug' => [
                        'error' => $e->getMessage(),
                    ]
                ], 503);
            }

            // Exécuter la commande Artisan sans options (sync tout)
            $exitCode = Artisan::call('sync:from-ops');
            $output = Artisan::output();

            if ($exitCode === 0) {
                return response()->json([
                    'success' => true,
                    'message' => 'Synchronisation complète réussie',
                    'debug' => [
                        'output' => $output,
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Échec de la synchronisation complète',
                'debug' => [
                    'exit_code' => $exitCode,
                    'output' => $output,
                ]
            ], 500);

        } catch (\Exception $e) {
            Log::error('[SyncDiagnostic] Erreur sync complète', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la synchronisation',
                'debug' => [
                    'error' => $e->getMessage(),
                ]
            ], 500);
        }
    }
}
