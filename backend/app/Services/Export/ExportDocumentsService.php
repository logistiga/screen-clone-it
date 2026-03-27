<?php

namespace App\Services\Export;

use App\Models\Facture;
use App\Models\Devis;
use App\Models\OrdreTravail;
use App\Models\Client;
use App\Models\Paiement;
use Illuminate\Support\Collection;

/**
 * Export CSV des documents : factures, devis, ordres, primes, clients, paiements
 */
class ExportDocumentsService
{
    use ExportHelpersTrait;

    public function exportFacturesCSV(array $filters = []): string
    {
        $query = Facture::with(['client', 'paiements']);
        if (!empty($filters['date_debut'])) $query->where('date_creation', '>=', $filters['date_debut']);
        if (!empty($filters['date_fin'])) $query->where('date_creation', '<=', $filters['date_fin']);
        if (!empty($filters['statut'])) $query->where('statut', $filters['statut']);
        if (!empty($filters['client_id'])) $query->where('client_id', $filters['client_id']);

        $factures = $query->orderBy('date_creation', 'desc')->get();

        $headers = ['Numéro', 'Date', 'Client', 'Montant HT', 'TVA', 'CSS', 'Montant TTC', 'Montant Payé', 'Reste à Payer', 'Statut'];

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

    public function exportOrdresCSV(array $filters = []): string
    {
        $query = OrdreTravail::with(['client', 'transitaire', 'representant', 'armateur']);
        if (!empty($filters['date_debut'])) $query->where('date_creation', '>=', $filters['date_debut']);
        if (!empty($filters['date_fin'])) $query->where('date_creation', '<=', $filters['date_fin']);
        if (!empty($filters['statut'])) $query->where('statut', $filters['statut']);
        if (!empty($filters['client_id'])) $query->where('client_id', $filters['client_id']);
        if (!empty($filters['categorie'])) $query->where('categorie', $filters['categorie']);

        $ordres = $query->orderBy('date_creation', 'desc')->get();

        $headers = ['Numéro', 'Date', 'Client', 'Catégorie', 'Navire', 'BL', 'Transitaire', 'Représentant', 'Montant HT', 'TVA', 'Montant TTC', 'Statut'];

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

    public function exportPrimesCSV(array $filters = []): string
    {
        $query = \App\Models\Prime::with(['representant', 'paiements']);
        if (!empty($filters['date_debut'])) $query->where('date', '>=', $filters['date_debut']);
        if (!empty($filters['date_fin'])) $query->where('date', '<=', $filters['date_fin']);
        if (!empty($filters['statut'])) $query->where('statut', $filters['statut']);
        if (!empty($filters['representant_id'])) $query->where('representant_id', $filters['representant_id']);

        $primes = $query->orderBy('date', 'desc')->get();

        $headers = ['Référence', 'Date', 'Représentant', 'Source', 'Montant Total', 'Montant Payé', 'Reste à Payer', 'Statut'];

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

    public function exportDevisCSV(array $filters = []): string
    {
        $query = Devis::with(['client']);
        if (!empty($filters['date_debut'])) $query->where('date_creation', '>=', $filters['date_debut']);
        if (!empty($filters['date_fin'])) $query->where('date_creation', '<=', $filters['date_fin']);
        if (!empty($filters['statut'])) $query->where('statut', $filters['statut']);

        $devis = $query->orderBy('date_creation', 'desc')->get();

        $headers = ['Numéro', 'Date', 'Validité', 'Client', 'Montant HT', 'TVA', 'Montant TTC', 'Statut'];

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

    public function exportPaiementsCSV(array $filters = []): string
    {
        $query = Paiement::with(['facture.client']);
        if (!empty($filters['date_debut'])) $query->where('date', '>=', $filters['date_debut']);
        if (!empty($filters['date_fin'])) $query->where('date', '<=', $filters['date_fin']);
        if (!empty($filters['mode_paiement'])) $query->where('mode_paiement', $filters['mode_paiement']);

        $paiements = $query->orderBy('date', 'desc')->get();

        $headers = ['Référence', 'Date', 'Facture', 'Client', 'Montant', 'Mode de Paiement', 'Référence Paiement', 'Observations'];

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

    public function exportClientsCSV(array $filters = []): string
    {
        $query = Client::withCount(['factures', 'devis']);
        if (!empty($filters['type'])) $query->where('type', $filters['type']);
        if (!empty($filters['actif'])) $query->where('actif', $filters['actif'] === 'true');

        $clients = $query->orderBy('created_at', 'desc')->get();

        $headers = ['Code', 'Type', 'Raison Sociale / Nom', 'Email', 'Téléphone', 'Adresse', 'Ville', 'Solde', 'Nb Factures', 'Nb Devis', 'Actif'];

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

    public function exportActiviteGlobaleCSV(string $dateDebut, string $dateFin, $reportingService): string
    {
        $data = $reportingService->getActiviteClients($dateDebut, $dateFin, 100);

        $headers = ['Client', 'CA Total', 'Nb Factures', 'Paiements', 'Solde Dû', 'Taux Paiement (%)'];

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
}
