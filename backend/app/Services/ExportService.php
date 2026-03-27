<?php

namespace App\Services;

use App\Services\Export\ExportDocumentsService;
use App\Services\Export\ExportFinanceService;
use App\Services\Export\ExportCaisseGlobaleService;
use App\Services\Export\ExportHelpersTrait;
use Illuminate\Support\Collection;

/**
 * Façade ExportService — délègue à ExportDocumentsService, ExportFinanceService, ExportCaisseGlobaleService
 */
class ExportService
{
    use ExportHelpersTrait;

    protected ExportDocumentsService $documents;
    protected ExportFinanceService $finance;
    protected ExportCaisseGlobaleService $caisseGlobale;
    protected ReportingService $reportingService;

    public function __construct(ReportingService $reportingService)
    {
        $this->reportingService = $reportingService;
        $this->documents = new ExportDocumentsService();
        $this->finance = new ExportFinanceService($reportingService);
        $this->caisseGlobale = new ExportCaisseGlobaleService();
    }

    // === Documents ===
    public function exportFacturesCSV(array $filters = []): string { return $this->documents->exportFacturesCSV($filters); }
    public function exportOrdresCSV(array $filters = []): string { return $this->documents->exportOrdresCSV($filters); }
    public function exportPrimesCSV(array $filters = []): string { return $this->documents->exportPrimesCSV($filters); }
    public function exportDevisCSV(array $filters = []): string { return $this->documents->exportDevisCSV($filters); }
    public function exportPaiementsCSV(array $filters = []): string { return $this->documents->exportPaiementsCSV($filters); }
    public function exportClientsCSV(array $filters = []): string { return $this->documents->exportClientsCSV($filters); }
    public function exportActiviteGlobaleCSV(string $dateDebut, string $dateFin): string { return $this->documents->exportActiviteGlobaleCSV($dateDebut, $dateFin, $this->reportingService); }

    // === Finance ===
    public function exportCaisseCSV(array $filters = []): string { return $this->finance->exportCaisseCSV($filters); }
    public function exportCaisseEspecesCSV(array $filters = []): string { return $this->finance->exportCaisseEspecesCSV($filters); }
    public function exportChiffreAffairesCSV(int $annee): string { return $this->finance->exportChiffreAffairesCSV($annee); }
    public function exportCreancesCSV(): string { return $this->finance->exportCreancesCSV(); }
    public function exportTresorerieCSV(string $dateDebut, string $dateFin): string { return $this->finance->exportTresorerieCSV($dateDebut, $dateFin); }
    public function exportCreditsCSV(array $filters = []): string { return $this->finance->exportCreditsCSV($filters); }
    public function exportAnnulationsCSV(array $filters = []): string { return $this->finance->exportAnnulationsCSV($filters); }
    public function exportTableauDeBordCSV(int $annee): string { return $this->finance->exportTableauDeBordCSV($annee); }

    // === Caisse Globale ===
    public function exportCaisseGlobaleCSV(array $filters = []): string { return $this->caisseGlobale->exportCaisseGlobaleCSV($filters); }
    public function exportCaisseGlobalePDF(array $filters = []) { return $this->caisseGlobale->exportCaisseGlobalePDF($filters); }
}
