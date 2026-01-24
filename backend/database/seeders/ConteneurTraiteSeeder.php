<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ConteneurTraite;
use Carbon\Carbon;

class ConteneurTraiteSeeder extends Seeder
{
    /**
     * Seed the conteneurs_traites table with test data.
     * Run: php artisan db:seed --class=ConteneurTraiteSeeder
     */
    public function run(): void
    {
        $this->command->info('Création des conteneurs de test...');

        $conteneurs = [
            [
                'sortie_id_externe' => 1001,
                'numero_conteneur' => 'MSKU1234567',
                'numero_bl' => 'BL-2024-001',
                'client_nom' => 'SOCIETE ABC IMPORT',
                'client_adresse' => 'Zone Industrielle, Pointe-Noire',
                'armateur_code' => 'MSK',
                'armateur_nom' => 'MAERSK',
                'transitaire_nom' => 'TRANSIT EXPRESS',
                'date_sortie' => Carbon::now()->subDays(3),
                'date_retour' => null,
                'camion_plaque' => 'ABC-1234-CG',
                'chauffeur_nom' => 'Jean MAKAYA',
                'destination_type' => 'livraison',
                'destination_adresse' => 'Magasin Client, Zone Industrielle',
                'statut' => 'en_attente',
                'source_system' => 'logistiga_ops',
                'synced_at' => Carbon::now()->subDays(3),
            ],
            [
                'sortie_id_externe' => 1002,
                'numero_conteneur' => 'CMAU9876543',
                'numero_bl' => 'BL-2024-002',
                'client_nom' => 'ENTREPRISE XYZ SARL',
                'client_adresse' => 'Avenue de la Libération, Brazzaville',
                'armateur_code' => 'CMA',
                'armateur_nom' => 'CMA CGM',
                'transitaire_nom' => 'GLOBAL TRANSIT',
                'date_sortie' => Carbon::now()->subDays(2),
                'date_retour' => null,
                'camion_plaque' => 'DEF-5678-CG',
                'chauffeur_nom' => 'Pierre MOUKALA',
                'destination_type' => 'depot',
                'destination_adresse' => 'Dépôt Central',
                'statut' => 'en_attente',
                'source_system' => 'logistiga_ops',
                'synced_at' => Carbon::now()->subDays(2),
            ],
            [
                'sortie_id_externe' => 1003,
                'numero_conteneur' => 'HLCU5555555',
                'numero_bl' => 'BL-2024-003',
                'client_nom' => 'COMMERCE GENERAL SA',
                'client_adresse' => 'Boulevard Denis Sassou Nguesso',
                'armateur_code' => 'HLC',
                'armateur_nom' => 'HAPAG LLOYD',
                'transitaire_nom' => null,
                'date_sortie' => Carbon::now()->subDay(),
                'date_retour' => null,
                'camion_plaque' => 'GHI-9012-CG',
                'chauffeur_nom' => 'André MBEMBA',
                'destination_type' => 'livraison',
                'destination_adresse' => 'Entrepôt Client',
                'statut' => 'en_attente',
                'source_system' => 'logistiga_ops',
                'synced_at' => Carbon::now()->subDay(),
            ],
            [
                'sortie_id_externe' => 1004,
                'numero_conteneur' => 'OOLU3333333',
                'numero_bl' => 'BL-2024-004',
                'client_nom' => 'IMPORT EXPORT CONGO',
                'client_adresse' => 'Port de Pointe-Noire',
                'armateur_code' => 'OOL',
                'armateur_nom' => 'OOCL',
                'transitaire_nom' => 'AGENCE MARITIME',
                'date_sortie' => Carbon::now()->subDays(5),
                'date_retour' => Carbon::now()->subDays(4),
                'camion_plaque' => 'JKL-3456-CG',
                'chauffeur_nom' => 'Michel NGOMA',
                'destination_type' => 'livraison',
                'destination_adresse' => 'Usine Client',
                'statut' => 'affecte',
                'ordre_travail_id' => null, // À lier manuellement si besoin
                'source_system' => 'logistiga_ops',
                'synced_at' => Carbon::now()->subDays(5),
            ],
            [
                'sortie_id_externe' => 1005,
                'numero_conteneur' => 'EISU7777777',
                'numero_bl' => 'BL-2024-005',
                'client_nom' => 'NEGOCE INTERNATIONAL',
                'client_adresse' => 'Centre-Ville, Pointe-Noire',
                'armateur_code' => 'EVG',
                'armateur_nom' => 'EVERGREEN',
                'transitaire_nom' => 'SWIFT TRANSIT',
                'date_sortie' => Carbon::now()->subWeek(),
                'date_retour' => Carbon::now()->subDays(6),
                'camion_plaque' => 'MNO-7890-CG',
                'chauffeur_nom' => 'Paul NSONDE',
                'destination_type' => 'depot',
                'destination_adresse' => 'Dépôt Externe',
                'statut' => 'facture',
                'ordre_travail_id' => null,
                'source_system' => 'logistiga_ops',
                'synced_at' => Carbon::now()->subWeek(),
            ],
        ];

        foreach ($conteneurs as $data) {
            ConteneurTraite::updateOrCreate(
                ['sortie_id_externe' => $data['sortie_id_externe']],
                $data
            );
        }

        $this->command->info('✓ ' . count($conteneurs) . ' conteneurs de test créés !');
        $this->command->info('');
        $this->command->info('Résumé:');
        $this->command->info('  - En attente: ' . ConteneurTraite::where('statut', 'en_attente')->count());
        $this->command->info('  - Affectés: ' . ConteneurTraite::where('statut', 'affecte')->count());
        $this->command->info('  - Facturés: ' . ConteneurTraite::where('statut', 'facture')->count());
    }
}
