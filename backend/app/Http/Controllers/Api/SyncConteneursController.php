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

            $result = $this->executeSyncConteneurs();

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
        $imported = 0;
        $skipped = 0;
        $errors = [];

        $opsConteneurs = DB::connection('ops')
            ->table('sortie_conteneurs as sc')
            ->leftJoin('clients as c', 'sc.client_id', '=', 'c.id')
            ->leftJoin('armateurs as a', 'sc.armateur_id', '=', 'a.id')
            ->leftJoin('transitaires as t', 'sc.transitaire_id', '=', 't.id')
            ->select([
                'sc.id as sortie_id_externe', 'sc.numero_conteneur', 'sc.numero_bl', 'sc.type_conteneur',
                'c.nom as nom_client', 'a.code as code_armateur', 'a.nom as armateur_nom', 't.nom as nom_transitaire',
                'sc.camion_id', 'sc.remorque_id', 'sc.type_transport', 'sc.type_detention', 'sc.jours_gratuits',
            ])
            ->get();

        foreach ($opsConteneurs as $opsConteneur) {
            if (\App\Models\ConteneurTraite::where('sortie_id_externe', $opsConteneur->sortie_id_externe)->exists()) {
                $skipped++;
                continue;
            }

            try {
                \App\Models\ConteneurTraite::create([
                    'sortie_id_externe' => $opsConteneur->sortie_id_externe,
                    'numero_conteneur' => $opsConteneur->numero_conteneur,
                    'numero_bl' => $opsConteneur->numero_bl,
                    'type_conteneur' => $opsConteneur->type_conteneur,
                    'armateur_code' => $opsConteneur->code_armateur,
                    'armateur_nom' => $opsConteneur->armateur_nom,
                    'client_nom' => $opsConteneur->nom_client,
                    'client_adresse' => null, 'transitaire_nom' => $opsConteneur->nom_transitaire,
                    'date_sortie' => null, 'date_retour' => null,
                    'camion_id_externe' => $opsConteneur->camion_id,
                    'remorque_id_externe' => $opsConteneur->remorque_id,
                    'prime_chauffeur' => null,
                    'destination_type' => $opsConteneur->type_detention,
                    'destination_adresse' => null, 'statut_ops' => null,
                    'statut' => 'en_attente', 'source_system' => 'logistiga_ops', 'synced_at' => now(),
                ]);

                if (!empty($opsConteneur->type_conteneur) && !empty($opsConteneur->code_armateur)) {
                    $armateur = \App\Models\Armateur::where('code', $opsConteneur->code_armateur)->first();
                    if ($armateur) { $armateur->update(['type_conteneur' => $opsConteneur->type_conteneur]); }
                }

                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Conteneur {$opsConteneur->numero_conteneur}: {$e->getMessage()}";
            }
        }

        $autoIgnored = $this->autoIgnorerConteneursExistants();

        return [
            'conteneurs_trouves_ops' => $opsConteneurs->count(),
            'conteneurs_importes' => $imported,
            'conteneurs_ignores' => $skipped,
            'auto_ignored' => $autoIgnored,
            'erreurs' => $errors,
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
