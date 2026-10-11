<?php

namespace App\Http\Controllers\Api\Automation;

use App\Http\Controllers\Controller;
use App\Models\Devis;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

/**
 * PDF officiel de devis via lien signé temporaire (lecture seule, aucune écriture).
 */
class AutomationPdfController extends Controller
{
    public static function lienSigne(Devis $d): array
    {
        $heures = (int) config('automation.pdf_link_ttl_hours', 24);
        $expire = now()->addHours($heures);
        return [
            'url' => URL::temporarySignedRoute('automation.devis.pdf', $expire, ['id' => $d->id]),
            'expire_le' => $expire->toIso8601String(),
        ];
    }

    public function lien(int $id): JsonResponse
    {
        $devis = Devis::find($id);
        if (!$devis) {
            return response()->json(['success' => false, 'error' => ['code' => 'NOT_FOUND', 'message' => 'Devis introuvable.']], 404);
        }
        return response()->json(['success' => true, 'data' => self::lienSigne($devis), 'meta' => (object) []]);
    }

    public function telecharger(Request $request, int $id)
    {
        if (!$request->hasValidSignature()) {
            return response()->json(['success' => false, 'error' => ['code' => 'LIEN_INVALIDE', 'message' => 'Lien invalide ou expiré.']], 403);
        }
        $devis = Devis::with(['client', 'lignes', 'conteneurs.operations', 'lots'])->find($id);
        if (!$devis) {
            abort(404);
        }
        try {
            $pdf = Pdf::loadView('pdf.devis', ['devis' => $devis, 'client' => $devis->client])->setPaper('A4', 'portrait');
            return response($pdf->output(), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="Devis_' . $devis->numero . '.pdf"',
                'Cache-Control' => 'private, no-store',
                'X-Robots-Tag' => 'noindex',
            ]);
        } catch (\Throwable $e) {
            Log::error('automation_pdf', ['devis_id' => $id, 'message' => $e->getMessage()]);
            return response()->json(['success' => false, 'error' => ['code' => 'ERROR', 'message' => 'Génération PDF impossible.']], 422);
        }
    }
}
