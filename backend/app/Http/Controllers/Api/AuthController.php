<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Models\User;
use App\Models\Audit;
use App\Services\SessionManager;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Durée du cookie en minutes (7 jours)
     */
    private const TOKEN_EXPIRATION_MINUTES = 60 * 24 * 7;

    /**
     * Nom du cookie pour le token
     */
    private const TOKEN_COOKIE_NAME = 'auth_token';

    public function __construct(
        private SessionManager $sessionManager
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants sont incorrects.'],
            ]);
        }

        if (!$user->actif) {
            throw ValidationException::withMessages([
                'email' => ['Ce compte a été désactivé.'],
            ]);
        }

        $user->updateDerniereConnexion();

        Audit::log('login', 'auth', 'Connexion réussie');

        // Créer la session avec métadonnées
        $sessionData = $this->sessionManager->createSession($user, $request);
        $token = $sessionData['plainTextToken'];

        // Créer le cookie HttpOnly sécurisé
        $cookie = $this->createAuthCookie($token);

        // Obtenir les stats de session pour informer l'utilisateur
        $sessionStats = $this->sessionManager->getSessionStats($user);

        return response()->json([
            'user' => $user->load('roles', 'permissions'),
            'message' => 'Connexion réussie',
            'session' => [
                'active_sessions' => $sessionStats['total_sessions'],
                'max_sessions' => $sessionStats['max_sessions'],
            ],
        ])->withCookie($cookie);
    }

    public function logout(Request $request): JsonResponse
    {
        Audit::log('logout', 'auth', 'Déconnexion');
        
        // Supprimer le token actuel si l'utilisateur est authentifié
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }

        // Supprimer le cookie
        $cookie = Cookie::forget(self::TOKEN_COOKIE_NAME);

        return response()->json(['message' => 'Déconnexion réussie'])->withCookie($cookie);
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

        // Créer le nouveau cookie
        $cookie = $this->createAuthCookie($token);

        return response()->json([
            'message' => 'Token rafraîchi',
        ])->withCookie($cookie);
    }

    /**
     * Créer le cookie d'authentification
     */
    private function createAuthCookie(string $token): \Symfony\Component\HttpFoundation\Cookie
    {
        return Cookie::make(
            self::TOKEN_COOKIE_NAME,
            $token,
            self::TOKEN_EXPIRATION_MINUTES,
            '/',
            null,
            true,  // secure
            true,  // httpOnly
            false, // raw
            'Strict' // sameSite
        );
    }
}
