<?php

namespace App\Services\Export;

use App\Models\MouvementCaisse;
use App\Models\Annulation;
use App\Models\CreditBancaire;
use App\Services\ReportingService;
use Illuminate\Support\Collection;

/**
 * Export CSV des données financières : caisse, crédits, trésorerie, créances, annulations, CA, tableau de bord
 */
class ExportFinanceService
{
    use ExportHelpersTrait;

    protected ReportingService $reportingService;

    public function __construct(ReportingService $reportingService)
    {
        $this->reportingService = $reportingService;
    }

    public function exportCaisseCSV(array $filters = []): string
    {
        $query = MouvementCaisse::query();
        if (!empty($filters['date_debut'])) $query->where('date', '>=', $filters['date_debut']);
        if (!empty($filters['date_fin'])) $query->where('date', '<=', $filters['date_fin']);
        if (!empty($filters['type'])) $query->where('type', $filters['type']);
        if (!empty($filters['categorie'])) $query->where('categorie', $filters['categorie']);

        $mouvements = $query->orderBy('date', 'desc')->get();

        $headers = ['Date', 'Type', 'Catégorie', 'Description', 'Montant', 'Solde Après'];

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

    public function exportCaisseEspecesCSV(array $filters = []): string
    {
        $query = MouvementCaisse::with(['client', 'paiement'])->where('source', 'caisse');
        if (!empty($filters['date_debut'])) $query->where('date', '>=', $filters['date_debut']);
        if (!empty($filters['date_fin'])) $query->where('date', '<=', $filters['date_fin']);
        if (!empty($filters['type'])) $query->where('type', $filters['type']);

        $mouvements = $query->orderBy('date', 'asc')->get();

        $headers = ['Date', 'Heure', 'Type', 'Catégorie', 'Description', 'Client/Bénéficiaire', 'N° Document', 'Entrée', 'Sortie', 'Solde'];

        $solde = 0;
        $rows = $mouvements->map(function ($mouvement) use (&$solde) {
            $entree = $mouvement->type === 'entree' ? $mouvement->montant : 0;
            $sortie = $mouvement->type === 'sortie' ? $mouvement->montant : 0;
            $solde += ($entree - $sortie);
            $clientNom = $mouvement->client 
                ? ($mouvement->client->raison_sociale ?? $mouvement->client->nom_complet ?? '-')
                : ($mouvement->beneficiaire ?? '-');
            return [
                $mouvement->date ? $mouvement->date->format('d/m/Y') : '-',
                $mouvement->created_at ? $mouvement->created_at->format('H:i') : '-',
                $mouvement->type === 'entree' ? 'Entrée' : 'Sortie',
                $mouvement->categorie ?? 'Paiement',
                $mouvement->description ?? '-',
                $clientNom,
                $mouvement->paiement->facture->numero ?? ($mouvement->paiement->ordre->numero ?? '-'),
                $entree > 0 ? number_format($entree, 0, ',', ' ') : '',
                $sortie > 0 ? number_format($sortie, 0, ',', ' ') : '',
                number_format($solde, 0, ',', ' '),
            ];
        });

        $totalEntrees = $mouvements->where('type', 'entree')->sum('montant');
        $totalSorties = $mouvements->where('type', 'sortie')->sum('montant');
        $rows->push([
            '', '', '', '', '', '', 'TOTAUX:',
            number_format($totalEntrees, 0, ',', ' '),
            number_format($totalSorties, 0, ',', ' '),
            number_format($totalEntrees - $totalSorties, 0, ',', ' '),
        ]);

        return $this->generateCSV($headers, $rows);
    }

    public function exportChiffreAffairesCSV(int $annee): string
    {
        $data = $this->reportingService->getChiffreAffaires($annee);
        $headers = ['Mois', 'CA Facturé', 'CA Encaissé', 'Nb Factures'];

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

        $rows->push([
            'TOTAL',
            number_format($data['total_facture'], 2, ',', ' '),
            number_format($data['total_encaisse'], 2, ',', ' '),
            $data['nb_factures'],
        ]);

        return $this->generateCSV($headers, $rows);
    }

    public function exportCreancesCSV(): string
    {
        $data = $this->reportingService->getCreances();
        $headers = ['Client', 'Total Dû', 'Non Échu', '0-30 jours', '31-60 jours', '61-90 jours', '+90 jours', 'Nb Factures'];

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

    public function exportTresorerieCSV(string $dateDebut, string $dateFin): string
    {
        $data = $this->reportingService->getTresorerie($dateDebut, $dateFin);
        $headers = ['Date', 'Entrées', 'Sorties', 'Solde'];

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

    public function exportCreditsCSV(array $filters = []): string
    {
        $query = CreditBancaire::with(['banque', 'remboursements']);
        if (!empty($filters['statut'])) $query->where('statut', $filters['statut']);
        if (!empty($filters['banque_id'])) $query->where('banque_id', $filters['banque_id']);

        $credits = $query->orderBy('date_obtention', 'desc')->get();

        $headers = ['Référence', 'Banque', 'Type', 'Montant', 'Taux', 'Durée (mois)', 'Date Obtention', 'Montant Remboursé', 'Reste à Rembourser', 'Statut'];

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

    public function exportAnnulationsCSV(array $filters = []): string
    {
        $query = Annulation::with(['client']);
        if (!empty($filters['date_debut'])) $query->where('date', '>=', $filters['date_debut']);
        if (!empty($filters['date_fin'])) $query->where('date', '<=', $filters['date_fin']);
        if (!empty($filters['type'])) $query->where('type', $filters['type']);

        $annulations = $query->orderBy('date', 'desc')->get();

        $headers = ['Date', 'Type Document', 'Numéro Document', 'Montant', 'Motif', 'Client'];

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

    public function exportTableauDeBordCSV(int $annee): string
    {
        $data = $this->reportingService->getTableauDeBord($annee);

        $content = "TABLEAU DE BORD - ANNÉE {$annee}\n\n";
        $content .= "INDICATEURS CLÉS\n";
        $content .= "Métrique;Valeur\n";
        $content .= "Chiffre d'affaires TTC;" . number_format($data['rentabilite']['chiffre_affaires_ttc'] ?? 0, 2, ',', ' ') . " FCFA\n";
        $content .= "Résultat net;" . number_format($data['rentabilite']['resultat_net'] ?? 0, 2, ',', ' ') . " FCFA\n";
        $content .= "Créances totales;" . number_format($data['creances']['total_creances'] ?? 0, 2, ',', ' ') . " FCFA\n";
        $content .= "Marge nette;" . ($data['rentabilite']['marge_nette_pct'] ?? 0) . "%\n\n";

        $content .= "STATISTIQUES DOCUMENTS\n";
        $content .= "Type;Total;Taux Conversion\n";
        $content .= "Devis;" . ($data['documents']['devis']['total'] ?? 0) . ";" . ($data['documents']['devis']['taux_conversion'] ?? 0) . "%\n";
        $content .= "Ordres;" . ($data['documents']['ordres']['total'] ?? 0) . ";" . ($data['documents']['ordres']['taux_conversion'] ?? 0) . "%\n";
        $content .= "Factures;" . ($data['documents']['factures']['total'] ?? 0) . ";-\n\n";

        if (!empty($data['alertes'])) {
            $content .= "ALERTES\n";
            $content .= "Niveau;Message\n";
            foreach ($data['alertes'] as $alerte) {
                $content .= ($alerte['type'] ?? 'info') . ";" . ($alerte['message'] ?? '') . "\n";
            }
        }

        return $content;
    }
}
