<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SuspiciousLogin;
use App\Models\Audit;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SuspiciousLoginController extends Controller
{
    /**
     * Approuver une connexion suspecte via le token
     * Route publique (accessible depuis l'email)
     */
    public function approve(Request $request, string $token): JsonResponse
    {
        $suspiciousLogin = SuspiciousLogin::where('action_token', $token)->first();

        if (!$suspiciousLogin) {
            return response()->json([
                'success' => false,
                'message' => 'Lien invalide ou expiré.',
            ], 404);
        }

        if (!$suspiciousLogin->isTokenValid()) {
            return response()->json([
                'success' => false,
                'message' => $suspiciousLogin->status !== 'pending' 
                    ? "Cette connexion a déjà été {$suspiciousLogin->status_label}."
                    : 'Ce lien a expiré.',
            ], 400);
        }

        $suspiciousLogin->approve();

        Audit::log('approve_suspicious_login', 'security', 
            "Connexion suspecte approuvée pour {$suspiciousLogin->user->email}", 
            null, [
                'suspicious_login_id' => $suspiciousLogin->id,
                'user_id' => $suspiciousLogin->user_id,
                'ip_address' => $suspiciousLogin->ip_address,
            ]
        );

        // Envoyer une notification à l'utilisateur que sa connexion a été validée
        $this->notifyUserApproved($suspiciousLogin);

        Log::info('Connexion suspecte approuvée', [
            'suspicious_login_id' => $suspiciousLogin->id,
            'user_email' => $suspiciousLogin->user->email,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Connexion approuvée avec succès.',
            'data' => [
                'user' => $suspiciousLogin->user->nom,
                'ip_address' => $suspiciousLogin->ip_address,
                'location' => $this->formatLocation($suspiciousLogin),
            ],
        ]);
    }

    /**
     * Bloquer une connexion suspecte et révoquer la session
     * Route publique (accessible depuis l'email)
     */
    public function block(Request $request, string $token): JsonResponse
    {
        $suspiciousLogin = SuspiciousLogin::where('action_token', $token)->first();

        if (!$suspiciousLogin) {
            return response()->json([
                'success' => false,
                'message' => 'Lien invalide ou expiré.',
            ], 404);
        }

        if (!$suspiciousLogin->isTokenValid()) {
            return response()->json([
                'success' => false,
                'message' => $suspiciousLogin->status !== 'pending' 
                    ? "Cette connexion a déjà été {$suspiciousLogin->status_label}."
                    : 'Ce lien a expiré.',
            ], 400);
        }

        $suspiciousLogin->block();

        Audit::log('block_suspicious_login', 'security', 
            "Connexion suspecte bloquée pour {$suspiciousLogin->user->email}", 
            null, [
                'suspicious_login_id' => $suspiciousLogin->id,
                'user_id' => $suspiciousLogin->user_id,
                'ip_address' => $suspiciousLogin->ip_address,
                'session_revoked' => (bool) $suspiciousLogin->session_token_id,
            ]
        );

        // Envoyer une notification à l'utilisateur que sa session a été révoquée
        $this->notifyUserBlocked($suspiciousLogin);

        Log::warning('Connexion suspecte bloquée - session révoquée', [
            'suspicious_login_id' => $suspiciousLogin->id,
            'user_email' => $suspiciousLogin->user->email,
            'ip_address' => $suspiciousLogin->ip_address,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Connexion bloquée et session révoquée.',
            'data' => [
                'user' => $suspiciousLogin->user->nom,
                'ip_address' => $suspiciousLogin->ip_address,
                'location' => $this->formatLocation($suspiciousLogin),
                'session_revoked' => true,
            ],
        ]);
    }

    /**
     * Liste des connexions suspectes (pour le dashboard admin)
     */
    public function index(Request $request): JsonResponse
    {
        $query = SuspiciousLogin::with(['user:id,nom,email', 'reviewer:id,nom'])
            ->orderBy('created_at', 'desc');

        // Filtres
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $perPage = $request->get('per_page', 20);
        $suspiciousLogins = $query->paginate($perPage);

        return response()->json($suspiciousLogins);
    }

    /**
     * Statistiques des connexions suspectes
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total' => SuspiciousLogin::count(),
            'pending' => SuspiciousLogin::where('status', 'pending')
                ->where('token_expires_at', '>', now())
                ->count(),
            'approved' => SuspiciousLogin::where('status', 'approved')->count(),
            'blocked' => SuspiciousLogin::where('status', 'blocked')->count(),
            'last_24h' => SuspiciousLogin::where('created_at', '>=', now()->subDay())->count(),
            'last_7d' => SuspiciousLogin::where('created_at', '>=', now()->subDays(7))->count(),
            'by_country' => SuspiciousLogin::selectRaw('country_name, count(*) as count')
                ->whereNotNull('country_name')
                ->groupBy('country_name')
                ->orderByDesc('count')
                ->limit(10)
                ->get(),
        ];

        return response()->json($stats);
    }

    /**
     * Notifier l'utilisateur que sa connexion a été approuvée
     */
    private function notifyUserApproved(SuspiciousLogin $suspiciousLogin): void
    {
        try {
            $user = $suspiciousLogin->user;
            
            $htmlContent = "
            <html>
            <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <div style='background: #16a34a; color: white; padding: 15px 20px; border-radius: 8px 8px 0 0;'>
                        <h2 style='margin: 0;'>✅ Connexion validée</h2>
                    </div>
                    
                    <div style='background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 0 0 8px 8px;'>
                        <p>Bonjour {$user->nom},</p>
                        
                        <p>Votre connexion depuis une nouvelle adresse IP a été vérifiée et approuvée par l'administrateur.</p>
                        
                        <table style='width: 100%; border-collapse: collapse; margin: 15px 0;'>
                            <tr>
                                <td style='padding: 8px 0; font-weight: bold; width: 140px;'>Adresse IP :</td>
                                <td style='padding: 8px 0;'>{$suspiciousLogin->ip_address}</td>
                            </tr>
                            <tr>
                                <td style='padding: 8px 0; font-weight: bold;'>Localisation :</td>
                                <td style='padding: 8px 0;'>{$this->formatLocation($suspiciousLogin)}</td>
                            </tr>
                        </table>
                        
                        <p>Vous pouvez continuer à utiliser l'application normalement.</p>
                    </div>
                </div>
            </body>
            </html>";

            Mail::send([], [], function ($mail) use ($user, $htmlContent) {
                $mail->to($user->email)
                    ->subject('✅ Votre connexion a été validée')
                    ->html($htmlContent)
                    ->from(config('mail.from.address'), config('mail.from.name'));
            });
        } catch (\Exception $e) {
            Log::error('Erreur envoi notification utilisateur (approuvé)', [
                'error' => $e->getMessage(),
                'user_id' => $suspiciousLogin->user_id,
            ]);
        }
    }

    /**
     * Notifier l'utilisateur que sa session a été bloquée
     */
    private function notifyUserBlocked(SuspiciousLogin $suspiciousLogin): void
    {
        try {
            $user = $suspiciousLogin->user;
            
            $htmlContent = "
            <html>
            <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <div style='background: #dc2626; color: white; padding: 15px 20px; border-radius: 8px 8px 0 0;'>
                        <h2 style='margin: 0;'>🚫 Connexion bloquée</h2>
                    </div>
                    
                    <div style='background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 0 0 8px 8px;'>
                        <p>Bonjour {$user->nom},</p>
                        
                        <p><strong>Une connexion suspecte à votre compte a été détectée et bloquée par l'administrateur.</strong></p>
                        
                        <table style='width: 100%; border-collapse: collapse; margin: 15px 0;'>
                            <tr>
                                <td style='padding: 8px 0; font-weight: bold; width: 140px;'>Adresse IP :</td>
                                <td style='padding: 8px 0;'>{$suspiciousLogin->ip_address}</td>
                            </tr>
                            <tr>
                                <td style='padding: 8px 0; font-weight: bold;'>Localisation :</td>
                                <td style='padding: 8px 0;'>{$this->formatLocation($suspiciousLogin)}</td>
                            </tr>
                        </table>
                        
                        <div style='background: #fee2e2; padding: 15px; border-radius: 6px; margin-top: 15px;'>
                            <strong>⚠️ Votre session a été révoquée.</strong>
                            <p style='margin-bottom: 0;'>Si cette connexion était légitime, veuillez contacter l'administrateur pour débloquer votre accès.</p>
                        </div>
                        
                        <p style='margin-top: 20px;'>Si vous n'êtes pas à l'origine de cette connexion, nous vous recommandons de changer votre mot de passe dès que possible.</p>
                    </div>
                </div>
            </body>
            </html>";

            Mail::send([], [], function ($mail) use ($user, $htmlContent) {
                $mail->to($user->email)
                    ->subject('🚫 Connexion suspecte bloquée sur votre compte')
                    ->html($htmlContent)
                    ->from(config('mail.from.address'), config('mail.from.name'));
            });
        } catch (\Exception $e) {
            Log::error('Erreur envoi notification utilisateur (bloqué)', [
                'error' => $e->getMessage(),
                'user_id' => $suspiciousLogin->user_id,
            ]);
        }
    }

    /**
     * Formater la localisation pour l'affichage
     */
    private function formatLocation(SuspiciousLogin $suspiciousLogin): string
    {
        $parts = array_filter([
            $suspiciousLogin->city,
            $suspiciousLogin->region,
            $suspiciousLogin->country_name,
        ]);

        return !empty($parts) ? implode(', ', $parts) : 'Localisation inconnue';
    }
}
