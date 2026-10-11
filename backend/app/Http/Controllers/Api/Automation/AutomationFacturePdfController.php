<?php

namespace App\Http\Controllers\Api\Automation;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Facture;
use App\Support\FactureStatut;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

/**
 * Lecture seule : dernière facture d'un client + PDF officiel via lien signé temporaire.
 */
class AutomationFacturePdfController extends Controller
{
    public static function lienSigne(Facture $f): array
    {
        $expire = now()->addHours((int) config('automation.pdf_link_ttl_hours', 24));
        return [
            'url' => URL::temporarySignedRoute('automation.factures.pdf', $expire, ['id' => $f->id]),
            'expire_le' => $expire->toIso8601String(),
        ];
    }

    public function derniere(int $id): JsonResponse
    {
        if (!Client::whereKey($id)->exists()) {
            return $this->fail('NOT_FOUND', 'Client introuvable.', 404);
        }
        $f = Facture::where('client_id', $id)->whereNotIn('statut', FactureStatut::ALIAS_ANNULEE)
            ->with('client:id,nom')->orderByDesc('date_creation')->orderByDesc('id')->first();
        if (!$f) {
            return $this->fail('NOT_FOUND', 'Aucune facture pour ce client.', 404);
        }
        return $this->ok($this->payload($f));
    }

    public function lien(int $id): JsonResponse
    {
        $f = Facture::with('client:id,nom')->find($id);
        return $f ? $this->ok($this->payload($f)) : $this->fail('NOT_FOUND', 'Facture introuvable.', 404);
    }

    public function telecharger(Request $request, int $id)
    {
        if (!$request->hasValidSignature()) {
            return $this->fail('LIEN_INVALIDE', 'Lien invalide ou expiré.', 403);
        }
        $f = Facture::with(['client', 'lignes', 'conteneurs', 'lots', 'ordreTravail'])->find($id);
        if (!$f) {
            abort(404);
        }
        try {
            $pdf = Pdf::loadView('pdf.facture', ['facture' => $f, 'client' => $f->client])->setPaper('A4', 'portrait');
            return response($pdf->output(), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="Facture_' . $f->numero . '.pdf"',
                'Cache-Control' => 'private, no-store',
                'X-Robots-Tag' => 'noindex',
            ]);
        } catch (\Throwable $e) {
            Log::error('automation_facture_pdf', ['facture_id' => $id, 'message' => $e->getMessage()]);
            return $this->fail('ERROR', 'Génération PDF impossible.', 422);
        }
    }

    private function payload(Facture $f): array
    {
        $lien = self::lienSigne($f);
        $ttc = (int) round((float) $f->montant_ttc);
        $paye = (int) round((float) $f->montant_paye);
        return [
            'id' => $f->id,
            'numero' => $f->numero,
            'client' => $f->client?->nom,
            'date_creation' => $f->date_creation,
            'date_echeance' => $f->date_echeance,
            'statut' => $f->statut,
            'montant_ttc' => $ttc,
            'montant_paye' => $paye,
            'reste_du' => max(0, $ttc - $paye),
            'url_pdf' => $lien['url'],
            'url_pdf_expire_le' => $lien['expire_le'],
        ];
    }

    private function ok(array $data): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $data, 'meta' => (object) []], 200, [], JSON_INVALID_UTF8_SUBSTITUTE);
    }

    private function fail(string $code, string $msg, int $status): JsonResponse
    {
        return response()->json(['success' => false, 'error' => ['code' => $code, 'message' => $msg]], $status);
    }
}
