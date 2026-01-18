<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Models\User;
use App\Models\Audit;
use App\Services\SessionManager;
use App\Services\AccountLockoutService;
use App\Services\SuspiciousLoginDetector;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{

    public function __construct(
        private SessionManager $sessionManager,
        private AccountLockoutService $lockoutService,
        private SuspiciousLoginDetector $suspiciousLoginDetector
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $email = strtolower($request->email);

        // Vérifier si le compte est verrouillé
        $lockoutInfo = $this->lockoutService->getLockoutInfo($email);
        if ($lockoutInfo) {
            Audit::log('login_blocked', 'security', 'Tentative de connexion sur compte verrouillé', null, [
                'email' => $email,
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'message' => "Compte temporairement verrouillé. Réessayez dans {$lockoutInfo['remaining_formatted']}.",
                'error' => 'account_locked',
                'lockout' => $lockoutInfo,
            ], 423); // 423 Locked
        }

        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            // Enregistrer l'échec
            $attemptResult = $this->lockoutService->recordFailedAttempt($email, $request);

            if ($attemptResult['locked']) {
                return response()->json([
                    'message' => "Compte verrouillé après trop de tentatives. Réessayez dans {$attemptResult['remaining_formatted']}.",
                    'error' => 'account_locked',
                    'lockout' => [
                        'locked' => true,
                        'remaining_seconds' => $attemptResult['remaining_seconds'],
                        'remaining_formatted' => $attemptResult['remaining_formatted'],
                    ],
                ], 423);
            }

            throw ValidationException::withMessages([
                'email' => ["Les identifiants sont incorrects. {$attemptResult['remaining_attempts']} tentative(s) restante(s)."],
            ])->status(422);
        }

        if (!$user->actif) {
            throw ValidationException::withMessages([
                'email' => ['Ce compte a été désactivé.'],
            ]);
        }

        // Connexion réussie - réinitialiser les tentatives
        $this->lockoutService->recordSuccessfulLogin($email, $request);

        $user->updateDerniereConnexion();

        Audit::log('login', 'auth', 'Connexion réussie');

        // Détecter les connexions suspectes (IP inhabituelle ou hors Gabon)
        $loginAnalysis = $this->suspiciousLoginDetector->analyzeLogin(
            $user,
            $request->ip(),
            $request->userAgent() ?? ''
        );

        // Envoyer alerte à l'admin si connexion suspecte
        if ($loginAnalysis['is_suspicious']) {
            $this->suspiciousLoginDetector->sendAlertIfSuspicious($user, $loginAnalysis);
            
            Audit::log('suspicious_login', 'security', 'Connexion suspecte détectée', null, [
                'ip_address' => $loginAnalysis['ip_address'],
                'country' => $loginAnalysis['country'] ?? 'inconnu',
                'reasons' => $loginAnalysis['reasons'],
            ]);
        }

        // Créer la session avec métadonnées
        $sessionData = $this->sessionManager->createSession($user, $request);
        $token = $sessionData['plainTextToken'];

        // Retourner le token au frontend (mode stateless / Bearer)
        // Obtenir les stats de session pour informer l'utilisateur
        $sessionStats = $this->sessionManager->getSessionStats($user);

        return response()->json([
            'user' => $user->load('roles', 'permissions'),
            'token' => $token,
            'token_type' => 'Bearer',
            'message' => 'Connexion réussie',
            'session' => [
                'active_sessions' => $sessionStats['total_sessions'],
                'max_sessions' => $sessionStats['max_sessions'],
            ],
            'security' => [
                'suspicious' => $loginAnalysis['is_suspicious'],
                'location' => $loginAnalysis['country_name'] ?? null,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Audit::log('logout', 'auth', 'Déconnexion');
        
        // Supprimer le token actuel si l'utilisateur est authentifié
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json(['message' => 'Déconnexion réussie']);
    }

    public function user(Request $request): JsonResponse
    {
        return response()->json($request->user()->load('roles', 'permissions'));
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $request->validate([
            'nom' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $request->user()->id,
            'telephone' => 'nullable|string|max:20',
        ]);

        $request->user()->update($request->only('nom', 'email', 'telephone'));

        Audit::log('update', 'profil', 'Profil mis à jour');

        return response()->json([
            'message' => 'Profil mis à jour avec succès',
            'user' => $request->user()->fresh()->load('roles', 'permissions'),
        ]);
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        if (!Hash::check($request->current_password, $request->user()->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Le mot de passe actuel est incorrect.'],
            ]);
        }

        $request->user()->update(['password' => Hash::make($request->password)]);

        Audit::log('update', 'password', 'Mot de passe modifié');

        // Optionnel: révoquer toutes les autres sessions après changement de mot de passe
        $this->sessionManager->revokeOtherSessions($request->user());

        return response()->json([
            'message' => 'Mot de passe modifié avec succès. Les autres sessions ont été déconnectées.',
        ]);
    }

    /**
     * Rafraîchir le token (prolonger la session)
     */
    public function refreshToken(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        // Supprimer l'ancien token
        $user->currentAccessToken()->delete();

        // Créer une nouvelle session avec les mêmes métadonnées
        $sessionData = $this->sessionManager->createSession($user, $request, 'auth-token-refreshed');
        $token = $sessionData['plainTextToken'];

        return response()->json([
            'message' => 'Token rafraîchi',
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Demander un email de déblocage
     */
    public function requestUnlock(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $email = strtolower($request->email);
        $token = $this->lockoutService->requestUnlockToken($email);

        // Toujours retourner le même message pour éviter l'énumération
        if ($token) {
            // TODO: Envoyer l'email avec le lien de déblocage
            // L'URL serait: /unlock-account?email={email}&token={token}
            Audit::log('unlock_requested', 'security', 'Demande de déblocage de compte', null, [
                'email' => $email,
            ]);
        }

        return response()->json([
            'message' => 'Si ce compte est verrouillé, un email de déblocage a été envoyé.',
        ]);
    }

    /**
     * Débloquer un compte avec un token
     */
    public function unlockAccount(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
        ]);

        $success = $this->lockoutService->unlockWithToken(
            strtolower($request->email),
            $request->token
        );

        if (!$success) {
            return response()->json([
                'message' => 'Lien de déblocage invalide ou expiré.',
                'error' => 'invalid_token',
            ], 400);
        }

        return response()->json([
            'message' => 'Compte débloqué avec succès. Vous pouvez maintenant vous connecter.',
        ]);
    }

    /**
     * Obtenir le statut de verrouillage (public)
     */
    public function lockoutStatus(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $lockoutInfo = $this->lockoutService->getLockoutInfo(strtolower($request->email));

        if (!$lockoutInfo) {
            return response()->json([
                'locked' => false,
            ]);
        }

        return response()->json($lockoutInfo);
    }

}
