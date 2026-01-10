<?php

namespace App\Console\Commands;

use App\Models\OrdreTravail;
use Illuminate\Console\Command;

class MigrerTypeOperationIndep extends Command
{
    protected $signature = 'ordres:migrer-type-indep {--dry-run : Afficher les modifications sans les appliquer}';

    protected $description = 'Migrer type_operation_indep pour les anciens OT indépendants depuis leurs lignes';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        
        $this->info('Recherche des OT indépendants sans type_operation_indep...');
        
        $ordres = OrdreTravail::where('categorie', 'operations_independantes')
            ->where(function ($q) {
                $q->whereNull('type_operation_indep')
                  ->orWhere('type_operation_indep', '');
            })
            ->with('lignes')
            ->get();
        
        $this->info("Trouvé {$ordres->count()} OT à mettre à jour.");
        
        $updated = 0;
        
        foreach ($ordres as $ordre) {
            $type = null;
            
            // Essayer de récupérer le type depuis les lignes
            if ($ordre->lignes && $ordre->lignes->count() > 0) {
                $firstLigne = $ordre->lignes->first();
                $type = $firstLigne->type_operation;
            }
            
            // Si pas trouvé dans les lignes, utiliser type_operation de l'ordre
            if (empty($type) && !empty($ordre->type_operation)) {
                $type = $ordre->type_operation;
            }
            
            if (!empty($type)) {
                $this->line("  {$ordre->numero}: {$type}");
                
                if (!$dryRun) {
                    $ordre->update(['type_operation_indep' => strtolower($type)]);
                }
                $updated++;
            } else {
                $this->warn("  {$ordre->numero}: Aucun type trouvé");
            }
        }
        
        if ($dryRun) {
            $this->info("Mode dry-run: {$updated} OT auraient été mis à jour.");
        } else {
            $this->info("{$updated} OT mis à jour avec succès.");
        }
        
        return Command::SUCCESS;
    }
}
