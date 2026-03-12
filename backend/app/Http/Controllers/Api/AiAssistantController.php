<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Facture;
use App\Models\Paiement;
use App\Models\MouvementCaisse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiAssistantController extends Controller
{
    /**
     * Chat avec l'assistant IA
     */
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'messages' => 'required|array|min:1',
            'messages.*.role' => 'required|in:user,assistant,system',
            'messages.*.content' => 'required|string',
        ]);

        $apiKey = config('services.openai.key');
        if (!$apiKey) {
            return response()->json([
                'error' => 'La clé API IA n\'est pas configurée. Contactez l\'administrateur.'
            ], 500);
        }

        try {
            // Collecter le contexte métier
            $context = $this->getBusinessContext();
            
            $systemPrompt = $this->buildSystemPrompt($context);
            
            $messages = array_merge(
                [['role' => 'system', 'content' => $systemPrompt]],
                $request->input('messages')
            );

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(60)->post(config('services.openai.endpoint', 'https://api.openai.com/v1/chat/completions'), [
                'model' => config('services.openai.model', 'gpt-4o-mini'),
                'messages' => $messages,
                'temperature' => 0.7,
                'max_tokens' => 2000,
            ]);

            if (!$response->successful()) {
                Log::error('AI API Error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return response()->json([
                    'error' => 'Erreur de communication avec l\'IA. Réessayez plus tard.'
                ], 502);
            }

            $data = $response->json();
            $content = $data['choices'][0]['message']['content'] ?? 'Désolé, je n\'ai pas pu générer de réponse.';

            return response()->json([
                'message' => $content,
                'usage' => $data['usage'] ?? null,
            ]);

        } catch (\Exception $e) {
            Log::error('AI Assistant Error', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Erreur interne du service IA.'
            ], 500);
        }
    }

    /**
     * Retourne le contexte métier pour pré-alimenter l'assistant
     */
    public function context(): JsonResponse
    {
        try {
            $context = $this->getBusinessContext();
            return response()->json($context);
        } catch (\Exception $e) {
            Log::error('AI Context Error', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Impossible de charger le contexte.'], 500);
        }
    }

    /**
     * Collecte les données métier pertinentes
     */
    protected function getBusinessContext(): array
    {
        $context = [];

        try {
            // Stats clients
            $context['clients'] = [
                'total' => Client::count(),
                'nouveaux_ce_mois' => Client::whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)->count(),
            ];
        } catch (\Exception $e) {
            $context['clients'] = ['error' => 'Non disponible'];
        }

        try {
            // Stats factures
            $context['factures'] = [
                'total' => Facture::count(),
                'impayees' => Facture::whereIn('statut', ['envoyee', 'en_retard'])->count(),
                'montant_impaye' => round((float) Facture::whereIn('statut', ['envoyee', 'en_retard'])->sum('montant_ttc'), 2),
                'ce_mois' => Facture::whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)->count(),
            ];
        } catch (\Exception $e) {
            $context['factures'] = ['error' => 'Non disponible'];
        }

        try {
            // Stats paiements du mois
            $context['paiements'] = [
                'total_mois' => round((float) Paiement::whereMonth('date_paiement', now()->month)
                    ->whereYear('date_paiement', now()->year)->sum('montant'), 2),
            ];
        } catch (\Exception $e) {
            $context['paiements'] = ['error' => 'Non disponible'];
        }

        try {
            // Solde caisse
            $entrees = MouvementCaisse::where('type', 'entree')->sum('montant');
            $sorties = MouvementCaisse::where('type', 'sortie')->sum('montant');
            $context['caisse'] = [
                'solde' => round((float) ($entrees - $sorties), 2),
                'entrees_mois' => round((float) MouvementCaisse::where('type', 'entree')
                    ->whereMonth('date_mouvement', now()->month)
                    ->whereYear('date_mouvement', now()->year)->sum('montant'), 2),
                'sorties_mois' => round((float) MouvementCaisse::where('type', 'sortie')
                    ->whereMonth('date_mouvement', now()->month)
                    ->whereYear('date_mouvement', now()->year)->sum('montant'), 2),
            ];
        } catch (\Exception $e) {
            $context['caisse'] = ['error' => 'Non disponible'];
        }

        try {
            // Top 5 clients par CA
            $context['top_clients'] = Facture::select('client_id', DB::raw('SUM(montant_ttc) as total_ca'))
                ->groupBy('client_id')
                ->orderByDesc('total_ca')
                ->limit(5)
                ->with('client:id,nom')
                ->get()
                ->map(fn($f) => [
                    'nom' => $f->client->nom ?? 'Inconnu',
                    'ca' => round((float) $f->total_ca, 2),
                ])
                ->toArray();
        } catch (\Exception $e) {
            $context['top_clients'] = [];
        }

        $context['date_contexte'] = now()->format('d/m/Y H:i');

        return $context;
    }

    /**
     * Construit le prompt système avec le contexte métier
     */
    protected function buildSystemPrompt(array $context): string
    {
        $contextJson = json_encode($context, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        return <<<PROMPT
Tu es l'assistant IA de **Logistiga**, une application de gestion de facturation et logistique pour le transport maritime et le transit.

## Ton rôle
- Analyser les données financières et commerciales de l'entreprise
- Fournir des recommandations stratégiques et opérationnelles
- Prédire les tendances et identifier les risques
- Résumer les performances et produire des rapports clairs
- Répondre en français, de manière professionnelle et concise

## Contexte métier actuel (données en temps réel)
```json
{$contextJson}
```

## Règles
- Utilise les données ci-dessus pour contextualiser tes réponses
- Les montants sont en FCFA
- Sois précis avec les chiffres, ne les invente pas
- Si une donnée n'est pas disponible, dis-le clairement
- Propose des actions concrètes quand c'est pertinent
- Utilise du markdown pour structurer tes réponses (titres, listes, tableaux)
PROMPT;
    }
}
