<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiMemory;
use App\Models\AiSetting;
use App\Models\Client;
use App\Models\ConteneurAnomalie;
use App\Models\ConteneurTraite;
use App\Models\CreditBancaire;
use App\Models\Facture;
use App\Models\MouvementCaisse;
use App\Models\Notification;
use App\Models\OrdreTravail;
use App\Models\Paiement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Chat IA, historique, settings - Providers déléguées à AiProviderController
 */
class AiAssistantController extends Controller
{
    public function chat(Request $request): JsonResponse
    {
        $request->validate(['message' => 'required|string|max:5000', 'session_id' => 'nullable|string|max:100']);

        $setting = AiSetting::active();
        if (!$setting) return response()->json(['error' => 'Aucun provider IA configuré.'], 500);

        $userId = $request->user()?->id;
        $sessionId = $request->input('session_id', Str::uuid()->toString());
        $userMessage = $request->input('message');

        try {
            AiMemory::saveMessage($sessionId, $userId, 'user', $userMessage);
            $history = AiMemory::getHistory($sessionId, $setting->max_context_length);
            $businessContext = $this->getBusinessContext();
            $systemPrompt = $this->buildSystemPrompt($setting, $businessContext);

            $providerController = app(AiProviderController::class);
            $response = $providerController->callProvider($setting, $systemPrompt, $history);

            AiMemory::saveMessage($sessionId, $userId, 'assistant', $response, ['provider' => $setting->provider, 'model' => $setting->model]);

            return response()->json(['message' => $response, 'session_id' => $sessionId]);
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            return response()->json(['error' => 'Le serveur IA est injoignable.', 'details' => $e->getMessage()], 503);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Erreur de communication avec l\'IA: ' . $e->getMessage()], 500);
        }
    }

    public function history(Request $request): JsonResponse
    {
        $sessionId = $request->query('session_id');
        if (!$sessionId) {
            $sessions = AiMemory::select('session_id', DB::raw('MIN(created_at) as started_at'), DB::raw('MAX(created_at) as last_message_at'), DB::raw('COUNT(*) as message_count'))
                ->where('user_id', $request->user()?->id)->groupBy('session_id')->orderByDesc('last_message_at')->limit(50)->get();
            return response()->json($sessions);
        }
        return response()->json(AiMemory::where('session_id', $sessionId)->orderBy('created_at')->get(['role', 'content', 'metadata', 'created_at']));
    }

    public function context(): JsonResponse
    {
        try { return response()->json($this->getBusinessContext()); }
        catch (\Exception $e) { return response()->json(['error' => 'Impossible de charger le contexte.'], 500); }
    }

    public function getSettings(): JsonResponse
    {
        return response()->json(['setting' => AiSetting::active(), 'providers' => AiSetting::getProviders()]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $request->validate(['provider' => 'required|in:ollama,deepseek,openai,anthropic,google', 'api_url' => 'nullable|string|max:500', 'api_key' => 'nullable|string|max:500', 'model' => 'required|string|max:100', 'max_context_length' => 'integer|min:1|max:100', 'system_prompt' => 'nullable|string|max:5000', 'extra_config' => 'nullable|array']);

        $setting = AiSetting::active() ?? new AiSetting();
        $data = $request->only(['provider', 'api_url', 'model', 'max_context_length', 'system_prompt', 'extra_config']);
        if ($request->filled('api_key')) $data['api_key'] = $request->input('api_key');
        $data['is_active'] = true;
        $setting->fill($data);
        $setting->save();

        return response()->json(['message' => 'Paramètres IA mis à jour.', 'setting' => $setting]);
    }

    public function testConnection(Request $request): JsonResponse
    {
        $setting = AiSetting::active();
        if (!$setting) return response()->json(['success' => false, 'error' => 'Aucun provider configuré.']);
        try {
            $providerController = app(AiProviderController::class);
            $response = $providerController->callProvider($setting, 'Réponds juste "OK" en un mot.', [['role' => 'user', 'content' => 'Test de connexion. Réponds OK.']]);
            return response()->json(['success' => true, 'response' => $response]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    protected function getBusinessContext(): array
    {
        $context = [];
        try { $context['clients'] = ['total' => Client::count(), 'nouveaux_ce_mois' => Client::whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->count()]; } catch (\Exception $e) { $context['clients'] = ['error' => 'Non disponible']; }
        try {
            $facturesImpayeesQuery = Facture::query()
                ->whereNotIn('statut', ['payee', 'annulee', 'Payée', 'Annulée']);

            $context['factures'] = [
                'total' => Facture::count(),
                'impayees' => (clone $facturesImpayeesQuery)->count(),
                'montant_impaye' => round((float) ((clone $facturesImpayeesQuery)
                    ->selectRaw('SUM(montant_ttc - COALESCE(montant_paye, 0)) as total')
                    ->value('total') ?? 0), 2),
                'ce_mois' => Facture::whereMonth('date_creation', now()->month)->whereYear('date_creation', now()->year)->count(),
                'montant_ce_mois' => round((float) Facture::whereMonth('date_creation', now()->month)->whereYear('date_creation', now()->year)->sum('montant_ttc'), 2),
            ];
        } catch (\Exception $e) { $context['factures'] = ['error' => 'Non disponible']; }
        try {
            $ordresNonPayesQuery = OrdreTravail::query()
                ->where('statut', '!=', 'annule')
                ->whereRaw('COALESCE(montant_ttc, 0) > COALESCE(montant_paye, 0)');

            $context['ordres_travail'] = [
                'total' => OrdreTravail::count(),
                'ce_mois' => OrdreTravail::whereMonth('date_creation', now()->month)->whereYear('date_creation', now()->year)->count(),
                'montant_ce_mois' => round((float) OrdreTravail::whereMonth('date_creation', now()->month)->whereYear('date_creation', now()->year)->sum('montant_ttc'), 2),
                'non_payes' => [
                    'nombre' => (clone $ordresNonPayesQuery)->count(),
                    'montant_restant' => round((float) ((clone $ordresNonPayesQuery)
                        ->selectRaw('SUM(montant_ttc - COALESCE(montant_paye, 0)) as total')
                        ->value('total') ?? 0), 2),
                ],
                'payes_ce_mois' => [
                    'nombre' => OrdreTravail::where('statut', '!=', 'annule')
                        ->whereRaw('COALESCE(montant_paye, 0) >= COALESCE(montant_ttc, 0)')
                        ->whereMonth('updated_at', now()->month)
                        ->whereYear('updated_at', now()->year)
                        ->count(),
                    'montant' => round((float) OrdreTravail::where('statut', '!=', 'annule')
                        ->whereRaw('COALESCE(montant_paye, 0) >= COALESCE(montant_ttc, 0)')
                        ->whereMonth('updated_at', now()->month)
                        ->whereYear('updated_at', now()->year)
                        ->sum('montant_ttc'), 2),
                ],
            ];
        } catch (\Exception $e) { $context['ordres_travail'] = ['error' => 'Non disponible']; }
        try { $context['paiements'] = ['total_mois' => round((float) Paiement::whereMonth('date', now()->month)->whereYear('date', now()->year)->sum('montant'), 2)]; } catch (\Exception $e) { $context['paiements'] = ['error' => 'Non disponible']; }
        try { $entrees = MouvementCaisse::where('type', 'entree')->sum('montant'); $sorties = MouvementCaisse::where('type', 'sortie')->sum('montant'); $context['caisse'] = ['solde' => round((float) ($entrees - $sorties), 2)]; } catch (\Exception $e) { $context['caisse'] = ['error' => 'Non disponible']; }
        try { $context['top_clients'] = Facture::select('client_id', DB::raw('SUM(montant_ttc) as total_ca'))->groupBy('client_id')->orderByDesc('total_ca')->limit(5)->with('client:id,nom')->get()->map(fn($f) => ['nom' => $f->client->nom ?? 'Inconnu', 'ca' => round((float) $f->total_ca, 2)])->toArray(); } catch (\Exception $e) { $context['top_clients'] = []; }
        try { $context['notifications_recentes'] = Notification::orderByDesc('created_at')->limit(10)->get(['type', 'title', 'message', 'created_at'])->toArray(); } catch (\Exception $e) { $context['notifications_recentes'] = []; }
        try { $context['conteneurs_flotte'] = ConteneurTraite::orderByDesc('created_at')->limit(15)->get(['numero_conteneur', 'camion_plaque', 'chauffeur_nom', 'statut', 'destination_adresse', 'date_sortie'])->toArray(); } catch (\Exception $e) { $context['conteneurs_flotte'] = []; }
        try { $context['anomalies_en_cours'] = ConteneurAnomalie::where('resolved', false)->limit(10)->get(['numero_conteneur', 'type_anomalie', 'description', 'created_at'])->toArray(); } catch (\Exception $e) { $context['anomalies_en_cours'] = []; }
        try { $context['credits_bancaires'] = CreditBancaire::where('statut', 'actif')->get(['banque_id', 'montant_total', 'montant_restant', 'date_echeance'])->toArray(); } catch (\Exception $e) { $context['credits_bancaires'] = []; }
        $context['date_contexte'] = now()->format('d/m/Y H:i');
        return $context;
    }

    protected function buildSystemPrompt(AiSetting $setting, array $context): string
    {
        $contextJson = json_encode($context, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        $basePrompt = $setting->system_prompt ?: "Tu es l'assistant de Omar, directeur de Logistiga au Gabon. Flotte de 40 camions. Port d'Owendo. Équipe: Mustapha, Georgia, Mohamed, Evans. Réponds en français, de manière professionnelle et concise.";
        return "{$basePrompt}\n\n## Contexte métier actuel (données en temps réel)\n```json\n{$contextJson}\n```\n\n## Règles\n- Utilise STRICTEMENT les données ci-dessus pour répondre\n- Pour les OT non payés, utilise `ordres_travail.non_payes.nombre` et `ordres_travail.non_payes.montant_restant`\n- Pour les OT payés ce mois, utilise `ordres_travail.payes_ce_mois`\n- Pour les factures de ce mois, utilise `factures.ce_mois` et `factures.montant_ce_mois`\n- Les montants sont en FCFA\n- Sois précis avec les chiffres, ne les invente pas\n- Si une donnée n'est pas disponible, dis-le clairement\n- N'affirme jamais 0 si le contexte contient une autre valeur\n- Propose des actions concrètes quand c'est pertinent\n- Utilise du markdown pour structurer tes réponses";
    }
}
