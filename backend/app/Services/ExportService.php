<?php

namespace App\Services;

use App\Models\Facture;
use App\Models\Devis;
use App\Models\OrdreTravail;
use App\Models\Client;
use App\Models\Paiement;
use App\Models\MouvementCaisse;
use App\Models\Annulation;
use App\Models\CreditBancaire;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

class ExportService
{
    protected ReportingService $reportingService;

    public function __construct(ReportingService $reportingService)
    {
        $this->reportingService = $reportingService;
    }

    /**
     * Export des factures en CSV
     */
    public function exportFacturesCSV(array $filters = []): string
    {
        $query = Facture::with(['client', 'paiements']);

        if (!empty($filters['date_debut'])) {
            $query->where('date_creation', '>=', $filters['date_debut']);
        }
        if (!empty($filters['date_fin'])) {
            $query->where('date_creation', '<=', $filters['date_fin']);
        }
        if (!empty($filters['statut'])) {
            $query->where('statut', $filters['statut']);
        }
        if (!empty($filters['client_id'])) {
            $query->where('client_id', $filters['client_id']);
        }

        $factures = $query->orderBy('date_creation', 'desc')->get();

        $headers = [
            'Numéro',
            'Date',
            'Client',
            'Montant HT',
            'TVA',
            'CSS',
            'Montant TTC',
            'Montant Payé',
            'Reste à Payer',
            'Statut',
        ];

        $rows = $factures->map(function ($facture) {
            return [
                $facture->numero,
                $facture->date_creation ? $facture->date_creation->format('d/m/Y') : '-',
                $facture->client->raison_sociale ?? $facture->client->nom_complet ?? '-',
                number_format($facture->montant_ht ?? 0, 2, ',', ' '),
                number_format($facture->tva ?? 0, 2, ',', ' '),
                number_format($facture->css ?? 0, 2, ',', ' '),
                number_format($facture->montant_ttc ?? 0, 2, ',', ' '),
                number_format($facture->montant_paye ?? 0, 2, ',', ' '),
                number_format(($facture->montant_ttc ?? 0) - ($facture->montant_paye ?? 0), 2, ',', ' '),
                $this->formatStatut($facture->statut),
            ];
        });

        return $this->generateCSV($headers, $rows);
    }

    /**
     * Export des ordres de travail en CSV
     */
    public function exportOrdresCSV(array $filters = []): string
    {
        $query = OrdreTravail::with(['client', 'transitaire', 'representant', 'armateur']);

        if (!empty($filters['date_debut'])) {
            $query->where('date_creation', '>=', $filters['date_debut']);
        }
        if (!empty($filters['date_fin'])) {
            $query->where('date_creation', '<=', $filters['date_fin']);
        }
        if (!empty($filters['statut'])) {
            $query->where('statut', $filters['statut']);
        }
        if (!empty($filters['client_id'])) {
            $query->where('client_id', $filters['client_id']);
        }
        if (!empty($filters['categorie'])) {
            $query->where('categorie', $filters['categorie']);
        }

        $ordres = $query->orderBy('date_creation', 'desc')->get();

        $headers = [
            'Numéro',
            'Date',
            'Client',
            'Catégorie',
            'Navire',
            'BL',
            'Transitaire',
            'Représentant',
            'Montant HT',
            'TVA',
            'Montant TTC',
            'Statut',
        ];

        $rows = $ordres->map(function ($ordre) {
            return [
                $ordre->numero,
                $ordre->date_creation ? $ordre->date_creation->format('d/m/Y') : '-',
                $ordre->client->raison_sociale ?? $ordre->client->nom_complet ?? '-',
                $this->formatCategorie($ordre->categorie),
                $ordre->navire ?? '-',
                $ordre->bl ?? '-',
                $ordre->transitaire->nom ?? '-',
                $ordre->representant->nom ?? '-',
                number_format($ordre->montant_ht ?? 0, 2, ',', ' '),
                number_format($ordre->montant_tva ?? 0, 2, ',', ' '),
                number_format($ordre->montant_ttc ?? 0, 2, ',', ' '),
                $this->formatStatut($ordre->statut),
            ];
        });

        return $this->generateCSV($headers, $rows);
    }

    /**
     * Export des primes en CSV
     */
    public function exportPrimesCSV(array $filters = []): string
    {
        $query = \App\Models\Prime::with(['representant', 'paiements']);

        if (!empty($filters['date_debut'])) {
            $query->where('date', '>=', $filters['date_debut']);
        }
        if (!empty($filters['date_fin'])) {
            $query->where('date', '<=', $filters['date_fin']);
        }
        if (!empty($filters['statut'])) {
            $query->where('statut', $filters['statut']);
        }
        if (!empty($filters['representant_id'])) {
            $query->where('representant_id', $filters['representant_id']);
        }

        $primes = $query->orderBy('date', 'desc')->get();

        $headers = [
            'Référence',
            'Date',
            'Représentant',
            'Source',
            'Montant Total',
            'Montant Payé',
            'Reste à Payer',
            'Statut',
        ];

        $rows = $primes->map(function ($prime) {
            $paye = $prime->paiements->sum('montant');
            return [
                $prime->reference ?? '-',
                $prime->date ? $prime->date->format('d/m/Y') : '-',
                $prime->representant->nom ?? '-',
                $prime->source ?? '-',
                number_format($prime->montant ?? 0, 2, ',', ' '),
                number_format($paye, 2, ',', ' '),
                number_format(($prime->montant ?? 0) - $paye, 2, ',', ' '),
                $this->formatStatut($prime->statut ?? 'en_attente'),
            ];
        });

        return $this->generateCSV($headers, $rows);
    }

    /**
     * Export du rapport d'activité globale en CSV
     */
    public function exportActiviteGlobaleCSV(string $dateDebut, string $dateFin): string
    {
        $data = $this->reportingService->getActiviteClients($dateDebut, $dateFin, 100);

        $headers = [
            'Client',
            'CA Total',
            'Nb Factures',
            'Paiements',
            'Solde Dû',
            'Taux Paiement (%)',
        ];

        $rows = collect($data['top_clients'])->map(function ($client) {
            $taux = ($client->factures_sum_montant_ttc ?? 0) > 0 
                ? round((($client->paiements_sum_montant ?? 0) / $client->factures_sum_montant_ttc) * 100, 2) 
                : 100;
            return [
                $client->raison_sociale ?? $client->nom ?? 'N/A',
                number_format($client->factures_sum_montant_ttc ?? 0, 2, ',', ' '),
                $client->factures_count ?? 0,
                number_format($client->paiements_sum_montant ?? 0, 2, ',', ' '),
                number_format($client->solde ?? 0, 2, ',', ' '),
                $taux . '%',
            ];
        });

        return $this->generateCSV($headers, $rows);
    }

    /**
     * Export des devis en CSV
     */
    public function exportDevisCSV(array $filters = []): string
    {
        $query = Devis::with(['client']);

        if (!empty($filters['date_debut'])) {
            $query->where('date_creation', '>=', $filters['date_debut']);
        }
        if (!empty($filters['date_fin'])) {
            $query->where('date_creation', '<=', $filters['date_fin']);
        }
        if (!empty($filters['statut'])) {
            $query->where('statut', $filters['statut']);
        }

        $devis = $query->orderBy('date_creation', 'desc')->get();

        $headers = [
            'Numéro',
            'Date',
            'Validité',
            'Client',
            'Montant HT',
            'TVA',
            'Montant TTC',
            'Statut',
        ];

        $rows = $devis->map(function ($d) {
            return [
                $d->numero,
                $d->date_creation ? $d->date_creation->format('d/m/Y') : '-',
                $d->date_validite ? $d->date_validite->format('d/m/Y') : '-',
                $d->client->raison_sociale ?? $d->client->nom_complet ?? '-',
                number_format($d->montant_ht ?? 0, 2, ',', ' '),
                number_format($d->tva ?? 0, 2, ',', ' '),
                number_format($d->montant_ttc ?? 0, 2, ',', ' '),
                $this->formatStatut($d->statut),
            ];
        });

        return $this->generateCSV($headers, $rows);
    }

    /**
     * Export des paiements en CSV
     */
    public function exportPaiementsCSV(array $filters = []): string
    {
        $query = Paiement::with(['facture.client']);

        if (!empty($filters['date_debut'])) {
            $query->where('date', '>=', $filters['date_debut']);
        }
        if (!empty($filters['date_fin'])) {
            $query->where('date', '<=', $filters['date_fin']);
        }
        if (!empty($filters['mode_paiement'])) {
            $query->where('mode_paiement', $filters['mode_paiement']);
        }

        $paiements = $query->orderBy('date', 'desc')->get();

        $headers = [
            'Référence',
            'Date',
            'Facture',
            'Client',
            'Montant',
            'Mode de Paiement',
            'Référence Paiement',
            'Observations',
        ];

        $rows = $paiements->map(function ($paiement) {
            return [
                $paiement->reference ?? '-',
                $paiement->date ? $paiement->date->format('d/m/Y') : '-',
                $paiement->facture->numero ?? '-',
                $paiement->facture->client->raison_sociale ?? $paiement->facture->client->nom_complet ?? '-',
                number_format($paiement->montant ?? 0, 2, ',', ' '),
                $this->formatModePaiement($paiement->mode_paiement ?? ''),
                $paiement->reference ?? '-',
                $paiement->notes ?? '-',
            ];
        });

        return $this->generateCSV($headers, $rows);
    }

    /**
     * Export des mouvements de caisse en CSV
     */
    public function exportCaisseCSV(array $filters = []): string
    {
        $query = MouvementCaisse::query();

        if (!empty($filters['date_debut'])) {
            $query->where('date', '>=', $filters['date_debut']);
        }
        if (!empty($filters['date_fin'])) {
            $query->where('date', '<=', $filters['date_fin']);
        }
        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }
        if (!empty($filters['categorie'])) {
            $query->where('categorie', $filters['categorie']);
        }

        $mouvements = $query->orderBy('date', 'desc')->get();

        $headers = [
            'Date',
            'Type',
            'Catégorie',
            'Description',
            'Montant',
            'Solde Après',
        ];

        $solde = 0;
        $rows = $mouvements->map(function ($mouvement) use (&$solde) {
            $montant = $mouvement->type === 'entree' ? $mouvement->montant : -$mouvement->montant;
            $solde += $montant;
            
            return [
                $mouvement->date ? $mouvement->date->format('d/m/Y') : '-',
                $mouvement->type === 'entree' ? 'Entrée' : 'Sortie',
                $mouvement->categorie ?? '-',
                $mouvement->description ?? '-',
                ($mouvement->type === 'entree' ? '+' : '-') . number_format($mouvement->montant ?? 0, 2, ',', ' '),
                number_format($solde, 2, ',', ' '),
            ];
        });

        return $this->generateCSV($headers, $rows);
    }

    /**
     * Export des clients en CSV
     */
    public function exportClientsCSV(array $filters = []): string
    {
        $query = Client::withCount(['factures', 'devis']);

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }
        if (!empty($filters['actif'])) {
            $query->where('actif', $filters['actif'] === 'true');
        }

        $clients = $query->orderBy('created_at', 'desc')->get();

        $headers = [
            'Code',
            'Type',
            'Raison Sociale / Nom',
            'Email',
            'Téléphone',
            'Adresse',
            'Ville',
            'Solde',
            'Nb Factures',
            'Nb Devis',
            'Actif',
        ];

        $rows = $clients->map(function ($client) {
            return [
                $client->code ?? '-',
                $client->type === 'entreprise' ? 'Entreprise' : 'Particulier',
                $client->raison_sociale ?? $client->nom_complet,
                $client->email ?? '-',
                $client->telephone ?? '-',
                $client->adresse ?? '-',
                $client->ville ?? '-',
                number_format($client->solde ?? 0, 2, ',', ' '),
                $client->factures_count,
                $client->devis_count,
                $client->actif ? 'Oui' : 'Non',
            ];
        });

        return $this->generateCSV($headers, $rows);
    }

    /**
     * Export du rapport de chiffre d'affaires en CSV
     */
    public function exportChiffreAffairesCSV(int $annee): string
    {
        $data = $this->reportingService->getChiffreAffaires($annee);

        $headers = [
            'Mois',
            'CA Facturé',
            'CA Encaissé',
            'Nb Factures',
        ];

        $moisNoms = [
            1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril',
            5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Août',
            9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre'
        ];

        $rows = collect($data['evolution_mensuelle'])->map(function ($item) use ($moisNoms) {
            return [
                $moisNoms[$item['mois']] ?? $item['mois'],
                number_format($item['ca_facture'], 2, ',', ' '),
                number_format($item['ca_encaisse'], 2, ',', ' '),
                $item['nb_factures'],
            ];
        });

        // Ajouter ligne de total
        $rows->push([
            'TOTAL',
            number_format($data['total_facture'], 2, ',', ' '),
            number_format($data['total_encaisse'], 2, ',', ' '),
            $data['nb_factures'],
        ]);

        return $this->generateCSV($headers, $rows);
    }

    /**
     * Export du rapport de créances en CSV
     */
    public function exportCreancesCSV(): string
    {
        $data = $this->reportingService->getCreances();

        $headers = [
            'Client',
            'Total Dû',
            'Non Échu',
            '0-30 jours',
            '31-60 jours',
            '61-90 jours',
            '+90 jours',
            'Nb Factures',
        ];

        $rows = collect($data['par_client'])->map(function ($item) {
            return [
                $item['client_nom'] ?? 'N/A',
                number_format($item['total_du'] ?? 0, 2, ',', ' '),
                number_format($item['non_echu'] ?? 0, 2, ',', ' '),
                number_format($item['0_30_jours'] ?? 0, 2, ',', ' '),
                number_format($item['31_60_jours'] ?? 0, 2, ',', ' '),
                number_format($item['61_90_jours'] ?? 0, 2, ',', ' '),
                number_format($item['plus_90_jours'] ?? 0, 2, ',', ' '),
                $item['nombre_factures'] ?? 0,
            ];
        });

        return $this->generateCSV($headers, $rows);
    }

    /**
     * Export du rapport de trésorerie en CSV
     */
    public function exportTresorerieCSV(string $dateDebut, string $dateFin): string
    {
        $data = $this->reportingService->getTresorerie($dateDebut, $dateFin);

        $headers = [
            'Date',
            'Entrées',
            'Sorties',
            'Solde',
        ];

        $rows = collect($data['mouvements_quotidiens'] ?? [])->map(function ($item) {
            return [
                $item->jour ?? '-',
                number_format($item->entrees ?? 0, 2, ',', ' '),
                number_format($item->sorties ?? 0, 2, ',', ' '),
                number_format($item->solde_cumule ?? 0, 2, ',', ' '),
            ];
        });

        return $this->generateCSV($headers, $rows);
    }

    /**
     * Export des crédits bancaires en CSV
     */
    public function exportCreditsCSV(array $filters = []): string
    {
        $query = CreditBancaire::with(['banque', 'remboursements']);

        if (!empty($filters['statut'])) {
            $query->where('statut', $filters['statut']);
        }
        if (!empty($filters['banque_id'])) {
            $query->where('banque_id', $filters['banque_id']);
        }

        $credits = $query->orderBy('date_obtention', 'desc')->get();

        $headers = [
            'Référence',
            'Banque',
            'Type',
            'Montant',
            'Taux',
            'Durée (mois)',
            'Date Obtention',
            'Montant Remboursé',
            'Reste à Rembourser',
            'Statut',
        ];

        $rows = $credits->map(function ($credit) {
            $montantRembourse = $credit->remboursements->sum('montant');
            return [
                $credit->reference,
                $credit->banque->nom ?? '-',
                $credit->type ?? '-',
                number_format($credit->montant, 2, ',', ' '),
                number_format($credit->taux_interet, 2) . '%',
                $credit->duree_mois,
                $credit->date_obtention->format('d/m/Y'),
                number_format($montantRembourse, 2, ',', ' '),
                number_format($credit->montant - $montantRembourse, 2, ',', ' '),
                $this->formatStatut($credit->statut),
            ];
        });

        return $this->generateCSV($headers, $rows);
    }

    /**
     * Export des annulations en CSV
     */
    public function exportAnnulationsCSV(array $filters = []): string
    {
        $query = Annulation::with(['client']);

        if (!empty($filters['date_debut'])) {
            $query->where('date', '>=', $filters['date_debut']);
        }
        if (!empty($filters['date_fin'])) {
            $query->where('date', '<=', $filters['date_fin']);
        }
        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        $annulations = $query->orderBy('date', 'desc')->get();

        $headers = [
            'Date',
            'Type Document',
            'Numéro Document',
            'Montant',
            'Motif',
            'Client',
        ];

        $rows = $annulations->map(function ($annulation) {
            return [
                $annulation->date ? $annulation->date->format('d/m/Y H:i') : '-',
                $this->formatTypeDocument($annulation->type ?? ''),
                $annulation->document_numero ?? '-',
                number_format($annulation->montant ?? 0, 2, ',', ' '),
                $annulation->motif ?? '-',
                $annulation->client->raison_sociale ?? $annulation->client->nom ?? '-',
            ];
        });

        return $this->generateCSV($headers, $rows);
    }

    /**
     * Export du tableau de bord exécutif en CSV
     */
    public function exportTableauDeBordCSV(int $annee): string
    {
        $data = $this->reportingService->getTableauDeBord($annee);

        $content = "TABLEAU DE BORD - ANNÉE {$annee}\n\n";
        
        // Indicateurs clés
        $content .= "INDICATEURS CLÉS\n";
        $content .= "Métrique;Valeur\n";
        $content .= "Chiffre d'affaires TTC;" . number_format($data['rentabilite']['chiffre_affaires_ttc'] ?? 0, 2, ',', ' ') . " FCFA\n";
        $content .= "Résultat net;" . number_format($data['rentabilite']['resultat_net'] ?? 0, 2, ',', ' ') . " FCFA\n";
        $content .= "Créances totales;" . number_format($data['creances']['total_creances'] ?? 0, 2, ',', ' ') . " FCFA\n";
        $content .= "Marge nette;" . ($data['rentabilite']['marge_nette_pct'] ?? 0) . "%\n";
        $content .= "\n";

        // Statistiques documents
        $content .= "STATISTIQUES DOCUMENTS\n";
        $content .= "Type;Total;Taux Conversion\n";
        $content .= "Devis;" . ($data['documents']['devis']['total'] ?? 0) . ";" . ($data['documents']['devis']['taux_conversion'] ?? 0) . "%\n";
        $content .= "Ordres;" . ($data['documents']['ordres']['total'] ?? 0) . ";" . ($data['documents']['ordres']['taux_conversion'] ?? 0) . "%\n";
        $content .= "Factures;" . ($data['documents']['factures']['total'] ?? 0) . ";-\n";
        $content .= "\n";

        // Alertes
        if (!empty($data['alertes'])) {
            $content .= "ALERTES\n";
            $content .= "Niveau;Message\n";
            foreach ($data['alertes'] as $alerte) {
                $content .= ($alerte['type'] ?? 'info') . ";" . ($alerte['message'] ?? '') . "\n";
            }
        }

        return $content;
    }

    /**
     * Génère un fichier CSV à partir des headers et des lignes
     */
    protected function generateCSV(array $headers, Collection|array $rows): string
    {
        $output = implode(';', $headers) . "\n";

        foreach ($rows as $row) {
            $output .= implode(';', array_map(function ($cell) {
                // Échapper les points-virgules et les guillemets
                $cell = str_replace('"', '""', (string) $cell);
                if (str_contains($cell, ';') || str_contains($cell, '"') || str_contains($cell, "\n")) {
                    return '"' . $cell . '"';
                }
                return $cell;
            }, $row)) . "\n";
        }

        return $output;
    }

    /**
     * Formate un statut pour l'affichage
     */
    protected function formatStatut(string $statut): string
    {
        return match ($statut) {
            'brouillon' => 'Brouillon',
            'en_attente' => 'En attente',
            'valide' => 'Validé',
            'envoye' => 'Envoyé',
            'accepte' => 'Accepté',
            'refuse' => 'Refusé',
            'expire' => 'Expiré',
            'partiel' => 'Partiellement payé',
            'paye' => 'Payé',
            'annule' => 'Annulé',
            'en_cours' => 'En cours',
            'termine' => 'Terminé',
            'actif' => 'Actif',
            'rembourse' => 'Remboursé',
            default => ucfirst($statut),
        };
    }

    /**
     * Formate un mode de paiement pour l'affichage
     */
    protected function formatModePaiement(string $mode): string
    {
        return match ($mode) {
            'especes' => 'Espèces',
            'cheque' => 'Chèque',
            'virement' => 'Virement',
            'carte' => 'Carte bancaire',
            'mobile' => 'Mobile Money',
            default => ucfirst($mode),
        };
    }

    /**
     * Formate un type de document pour l'affichage
     */
    protected function formatTypeDocument(string $type): string
    {
        return match ($type) {
            'facture' => 'Facture',
            'devis' => 'Devis',
            'ordre' => 'Ordre de travail',
            default => ucfirst($type),
        };
    }

    /**
     * Formate une catégorie pour l'affichage
     */
    protected function formatCategorie(string $categorie): string
    {
        return match ($categorie) {
            'conteneurs' => 'Conteneurs',
            'conventionnel' => 'Conventionnel',
            'independant' => 'Indépendant',
            default => ucfirst($categorie),
        };
    }
}
