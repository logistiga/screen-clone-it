<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ExportService;
use App\Services\ReportingService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Façade - délègue aux sous-contrôleurs ExportCsvController, ExportPdfController, ExportRolesController
 */
class ExportController extends Controller
{
    protected ExportCsvController $csvController;
    protected ExportPdfController $pdfController;
    protected ExportRolesController $rolesController;

    public function __construct(ExportService $exportService, ReportingService $reportingService)
    {
        $this->csvController = new ExportCsvController();
        // Inject via constructor manually
        $this->csvController = app(ExportCsvController::class);
        $this->pdfController = app(ExportPdfController::class);
        $this->rolesController = app(ExportRolesController::class);
    }

    // === CSV ===
    public function factures(Request $r): StreamedResponse { return $this->csvController->factures($r); }
    public function devis(Request $r): StreamedResponse { return $this->csvController->devis($r); }
    public function ordres(Request $r): StreamedResponse { return $this->csvController->ordres($r); }
    public function primes(Request $r): StreamedResponse { return $this->csvController->primes($r); }
    public function activiteGlobale(Request $r): StreamedResponse { return $this->csvController->activiteGlobale($r); }
    public function paiements(Request $r): StreamedResponse { return $this->csvController->paiements($r); }
    public function caisse(Request $r): StreamedResponse { return $this->csvController->caisse($r); }
    public function caisseEspeces(Request $r): StreamedResponse { return $this->csvController->caisseEspeces($r); }
    public function clients(Request $r): StreamedResponse { return $this->csvController->clients($r); }
    public function chiffreAffaires(Request $r): StreamedResponse { return $this->csvController->chiffreAffaires($r); }
    public function creances(Request $r): StreamedResponse { return $this->csvController->creances($r); }
    public function tresorerie(Request $r): StreamedResponse { return $this->csvController->tresorerie($r); }
    public function credits(Request $r): StreamedResponse { return $this->csvController->credits($r); }
    public function annulations(Request $r): StreamedResponse { return $this->csvController->annulations($r); }
    public function tableauDeBord(Request $r): StreamedResponse { return $this->csvController->tableauDeBord($r); }
    public function caisseGlobale(Request $r) { return $this->csvController->caisseGlobale($r); }

    // === PDF ===
    public function facturesPdf(Request $r) { return $this->pdfController->facturesPdf($r); }
    public function ordresPdf(Request $r) { return $this->pdfController->ordresPdf($r); }
    public function devisPdf(Request $r) { return $this->pdfController->devisPdf($r); }
    public function paiementsPdf(Request $r) { return $this->pdfController->paiementsPdf($r); }
    public function clientsPdf(Request $r) { return $this->pdfController->clientsPdf($r); }
    public function primesPdf(Request $r) { return $this->pdfController->primesPdf($r); }
    public function caissePdf(Request $r) { return $this->pdfController->caissePdf($r); }
    public function creancesPdf(Request $r) { return $this->pdfController->creancesPdf($r); }
    public function annulationsPdf(Request $r) { return $this->pdfController->annulationsPdf($r); }
    public function creditsPdf(Request $r) { return $this->pdfController->creditsPdf($r); }
    public function activiteGlobalePdf(Request $r) { return $this->pdfController->activiteGlobalePdf($r); }

    // === Roles ===
    public function roles(Request $r) { return $this->rolesController->roles($r); }

    // === Helper ===
    protected function streamCSV(string $content, string $filename): StreamedResponse
    {
        return $this->csvController->streamCSV($content, $filename);
    }
}
