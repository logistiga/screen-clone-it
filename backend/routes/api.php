<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SuspiciousLoginController;
use App\Http\Controllers\Api\DescriptionSuggestionController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Fichier principal - charge les sous-fichiers par module.
| Chaque module est isolé dans son propre fichier pour éviter
| qu'une modification n'impacte les autres.
|--------------------------------------------------------------------------
*/

// ============================================
// ROUTES PUBLIQUES
// ============================================

// Ping (healthcheck)
Route::get('ping', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()->toIso8601String()]);
});
Route::match(['HEAD'], 'ping', function () {
    return response()->noContent();
});

// Auth publique (login, mot de passe oublié, etc.)
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login'])
        ->middleware('throttle:login');
    Route::post('forgot-password', [AuthController::class, 'forgotPassword'])
        ->middleware('throttle:password-reset');
    Route::post('reset-password', [AuthController::class, 'resetPassword'])
        ->middleware('throttle:password-reset');

    // Account lockout self-service
    Route::post('lockout-status', [AuthController::class, 'lockoutStatus']);
    Route::post('request-unlock', [AuthController::class, 'requestUnlock'])
        ->middleware('throttle:password-reset');
    Route::post('unlock-account', [AuthController::class, 'unlockAccount'])
        ->middleware('throttle:password-reset');
});

// Sécurité publique (liens email connexion suspecte)
Route::prefix('security')->group(function () {
    Route::get('suspicious-login/{token}/approve', [SuspiciousLoginController::class, 'approve'])
        ->name('security.suspicious-login.approve');
    Route::get('suspicious-login/{token}/block', [SuspiciousLoginController::class, 'block'])
        ->name('security.suspicious-login.block');
    Route::get('suspicious-login/{id}/status', [SuspiciousLoginController::class, 'checkStatus'])
        ->name('security.suspicious-login.status');
});

// ============================================
// ROUTES PROTÉGÉES (auth:sanctum + user.active)
// ============================================
Route::middleware(['auth:sanctum', 'user.active'])->group(function () {

    // Suggestions descriptions (accessible à tous les connectés)
    Route::get('descriptions/suggestions', [DescriptionSuggestionController::class, 'search']);

    // --- Modules isolés par fichier ---
    require __DIR__.'/api_auth.php';          // Auth & Profil, Sessions
    require __DIR__.'/api_clients.php';       // Clients
    require __DIR__.'/api_documents.php';     // Devis, Ordres, Factures, Notes de débit, Annulations
    require __DIR__.'/api_finance.php';       // Paiements, Banques, Caisse, Crédits, Prévisions, Primes, Taxes
    require __DIR__.'/api_partenaires.php';   // Transitaires, Représentants, Armateurs
    require __DIR__.'/api_conteneurs.php';    // Conteneurs en attente, Anomalies, Sync OPS
    require __DIR__.'/api_email.php';         // Notifications email, Templates, Automation, Config
    require __DIR__.'/api_reporting.php';     // Dashboard, Reporting, Export
    require __DIR__.'/api_admin.php';         // Configuration, Users, Rôles, Audit, Connexions suspectes
    require __DIR__.'/api_notifications.php'; // Notifications in-app (alertes)
});
