<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ExportService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    protected ExportService $exportService;

    public function __construct(ExportService $exportService)
    {
        $this->exportService = $exportService;
    }

    public function factures(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'statut', 'client_id']);
        $csv = $this->exportService->exportFacturesCSV($filters);
        
        return $this->streamCSV($csv, 'factures');
    }

    public function devis(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'statut']);
        $csv = $this->exportService->exportDevisCSV($filters);
        
        return $this->streamCSV($csv, 'devis');
    }

    public function ordres(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'statut', 'client_id', 'categorie']);
        $csv = $this->exportService->exportOrdresCSV($filters);
        
        return $this->streamCSV($csv, 'ordres-travail');
    }

    public function primes(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'statut', 'representant_id']);
        $csv = $this->exportService->exportPrimesCSV($filters);
        
        return $this->streamCSV($csv, 'primes');
    }

    public function activiteGlobale(Request $request): StreamedResponse
    {
        $dateDebut = $request->get('date_debut', now()->startOfYear()->toDateString());
        $dateFin = $request->get('date_fin', now()->endOfYear()->toDateString());
        $csv = $this->exportService->exportActiviteGlobaleCSV($dateDebut, $dateFin);
        
        return $this->streamCSV($csv, 'activite-globale');
    }

    public function paiements(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'mode_paiement']);
        $csv = $this->exportService->exportPaiementsCSV($filters);
        
        return $this->streamCSV($csv, 'paiements');
    }

    public function caisse(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'type', 'categorie']);
        $csv = $this->exportService->exportCaisseCSV($filters);
        
        return $this->streamCSV($csv, 'caisse');
    }

    /**
     * Export caisse espèces uniquement (pour la caisse journalière)
     */
    public function caisseEspeces(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'type']);
        $filters['source'] = 'caisse'; // Forcer source = caisse (espèces uniquement)
        $csv = $this->exportService->exportCaisseEspecesCSV($filters);
        
        return $this->streamCSV($csv, 'caisse-especes');
    }

    public function clients(Request $request): StreamedResponse
    {
        $filters = $request->only(['type', 'actif']);
        $csv = $this->exportService->exportClientsCSV($filters);
        
        return $this->streamCSV($csv, 'clients');
    }

    public function chiffreAffaires(Request $request): StreamedResponse
    {
        $annee = (int) $request->get('annee', date('Y'));
        $csv = $this->exportService->exportChiffreAffairesCSV($annee);
        
        return $this->streamCSV($csv, "chiffre-affaires-{$annee}");
    }

    public function creances(Request $request): StreamedResponse
    {
        $csv = $this->exportService->exportCreancesCSV();
        
        return $this->streamCSV($csv, 'creances');
    }

    public function tresorerie(Request $request): StreamedResponse
    {
        $dateDebut = $request->get('date_debut', now()->startOfMonth()->toDateString());
        $dateFin = $request->get('date_fin', now()->endOfMonth()->toDateString());
        $csv = $this->exportService->exportTresorerieCSV($dateDebut, $dateFin);
        
        return $this->streamCSV($csv, 'tresorerie');
    }

    public function credits(Request $request): StreamedResponse
    {
        $filters = $request->only(['statut', 'banque_id']);
        $csv = $this->exportService->exportCreditsCSV($filters);
        
        return $this->streamCSV($csv, 'credits');
    }

    public function annulations(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'type']);
        $csv = $this->exportService->exportAnnulationsCSV($filters);
        
        return $this->streamCSV($csv, 'annulations');
    }

    public function tableauDeBord(Request $request): StreamedResponse
    {
        $annee = (int) $request->get('annee', date('Y'));
        $csv = $this->exportService->exportTableauDeBordCSV($annee);
        
        return $this->streamCSV($csv, "tableau-de-bord-{$annee}");
    }

    /**
     * Génère une réponse CSV streamée
     */
    protected function streamCSV(string $content, string $filename): StreamedResponse
    {
        $date = now()->format('Y-m-d');
        
        return new StreamedResponse(function () use ($content) {
            echo "\xEF\xBB\xBF"; // BOM UTF-8 pour Excel
            echo $content;
        }, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}_{$date}.csv\"",
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }
}
