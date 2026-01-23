<?php

use Illuminate\Support\Facades\Route;

// Controllers
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SessionController;
use App\Http\Controllers\Api\SuspiciousLoginController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\DevisController;
use App\Http\Controllers\Api\OrdreTravailController;
use App\Http\Controllers\Api\FactureController;
use App\Http\Controllers\Api\PaiementController;
use App\Http\Controllers\Api\BanqueController;
use App\Http\Controllers\Api\CaisseController;
use App\Http\Controllers\Api\TransitaireController;
use App\Http\Controllers\Api\RepresentantController;
use App\Http\Controllers\Api\ArmateurController;
use App\Http\Controllers\Api\CreditBancaireController;
use App\Http\Controllers\Api\PrevisionController;
use App\Http\Controllers\Api\AnnulationController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\ConfigurationController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ReportingController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PrimeController;
use App\Http\Controllers\Api\NoteDebutController;
use App\Http\Controllers\Api\CategorieDepenseController;
use App\Http\Controllers\Api\EmailTemplateController;
use App\Http\Controllers\Api\EmailAutomationController;
use App\Http\Controllers\Api\EmailConfigController;
use App\Http\Controllers\Api\TaxesMensuellesController;
use App\Http\Controllers\Api\TaxeController;
use App\Http\Controllers\Api\LogistigaSyncController;


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Ping endpoint pour vérifier la connectivité (public)
Route::get('ping', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()->toIso8601String()]);
});

// Routes publiques avec rate limiting anti brute-force
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

// Routes publiques pour les actions de sécurité (depuis email ou polling frontend)
Route::prefix('security')->group(function () {
    Route::get('suspicious-login/{token}/approve', [SuspiciousLoginController::class, 'approve'])
        ->name('security.suspicious-login.approve');
    Route::get('suspicious-login/{token}/block', [SuspiciousLoginController::class, 'block'])
        ->name('security.suspicious-login.block');
    // Endpoint pour vérifier le statut (polling depuis frontend)
    Route::get('suspicious-login/{id}/status', [SuspiciousLoginController::class, 'checkStatus'])
        ->name('security.suspicious-login.status');
});

// Routes protégées par authentification
Route::middleware(['auth:sanctum', 'user.active'])->group(function () {
    
    // ============================================
    // AUTH & PROFIL
    // ============================================
    Route::prefix('auth')->group(function () {
        Route::get('user', [AuthController::class, 'user']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refreshToken']);
        Route::put('profile', [AuthController::class, 'updateProfile']);
        Route::put('password', [AuthController::class, 'updatePassword']);
    });

    // ============================================
    // SESSIONS (gestion des sessions actives)
    // ============================================
    Route::prefix('sessions')->group(function () {
        Route::get('/', [SessionController::class, 'index']);
        Route::get('current', [SessionController::class, 'current']);
        Route::delete('{sessionId}', [SessionController::class, 'destroy']);
        Route::post('revoke-others', [SessionController::class, 'revokeOthers']);
        Route::post('revoke-all', [SessionController::class, 'revokeAll']);
    });

    // ============================================
    // DASHBOARD (accessible à tous les utilisateurs connectés)
    // ============================================
    Route::prefix('dashboard')->middleware('throttle:dashboard')->group(function () {
        Route::get('/', [DashboardController::class, 'index']);
        Route::get('graphiques', [DashboardController::class, 'graphiques']);
        Route::get('alertes', [DashboardController::class, 'alertes']);
        Route::get('activite-recente', [DashboardController::class, 'activiteRecente']);
        Route::post('invalidate-cache', [DashboardController::class, 'invalidateCache'])
            ->middleware('permission:configuration.modifier');
    });

    // ============================================
    // CLIENTS
    // ============================================
    Route::prefix('clients')->middleware('audit')->group(function () {
        Route::get('/', [ClientController::class, 'index'])
            ->middleware('permission:clients.voir');
        Route::get('stats', [ClientController::class, 'globalStats'])
            ->middleware(['permission:clients.voir', 'throttle:stats']);
        Route::post('/', [ClientController::class, 'store'])
            ->middleware('permission:clients.creer');
        Route::get('{client}', [ClientController::class, 'show'])
            ->middleware('permission:clients.voir');
        Route::put('{client}', [ClientController::class, 'update'])
            ->middleware('permission:clients.modifier');
        Route::delete('{client}', [ClientController::class, 'destroy'])
            ->middleware('permission:clients.supprimer');
        Route::get('{client}/stats', [ClientController::class, 'stats'])
            ->middleware(['permission:clients.voir', 'throttle:stats']);
    });

    // ============================================
    // DEVIS
    // ============================================
    Route::prefix('devis')->middleware('audit')->group(function () {
        Route::get('/', [DevisController::class, 'index'])
            ->middleware('permission:devis.voir');
        Route::post('/', [DevisController::class, 'store'])
            ->middleware('permission:devis.creer');
        Route::get('{devis}', [DevisController::class, 'show'])
            ->middleware('permission:devis.voir');
        Route::put('{devis}', [DevisController::class, 'update'])
            ->middleware('permission:devis.modifier');
        Route::delete('{devis}', [DevisController::class, 'destroy'])
            ->middleware('permission:devis.supprimer');
        Route::post('{devis}/convert-ordre', [DevisController::class, 'convertToOrdre'])
            ->middleware('permission:ordres.creer');
        Route::post('{devis}/convert-facture', [DevisController::class, 'convertToFacture'])
            ->middleware('permission:factures.creer');
        Route::post('{devis}/duplicate', [DevisController::class, 'duplicate'])
            ->middleware('permission:devis.creer');
    });

    // ============================================
    // ORDRES DE TRAVAIL
    // ============================================
    Route::prefix('ordres-travail')->middleware('audit')->group(function () {
        Route::get('/', [OrdreTravailController::class, 'index'])
            ->middleware('permission:ordres.voir');
        Route::get('stats', [OrdreTravailController::class, 'stats'])
            ->middleware(['permission:ordres.voir', 'throttle:stats']);
        Route::get('check-conteneur', [OrdreTravailController::class, 'checkConteneur'])
            ->middleware('permission:ordres.voir');
        Route::post('/', [OrdreTravailController::class, 'store'])
            ->middleware('permission:ordres.creer');
        Route::get('{ordreTravail}', [OrdreTravailController::class, 'show'])
            ->middleware('permission:ordres.voir');
        Route::put('{ordreTravail}', [OrdreTravailController::class, 'update'])
            ->middleware('permission:ordres.modifier');
        Route::delete('{ordreTravail}', [OrdreTravailController::class, 'destroy'])
            ->middleware('permission:ordres.supprimer');
        Route::post('{ordreTravail}/convert-facture', [OrdreTravailController::class, 'convertToFacture'])
            ->middleware('permission:factures.creer');
        Route::post('{ordreTravail}/send-logistiga', [LogistigaSyncController::class, 'sendOrdreById'])
            ->middleware('permission:ordres.modifier');
    });

    // ============================================
    // SYNC LOGISTIGA (envoi manuel si nécessaire)
    // ============================================
    Route::prefix('sync')->middleware('audit')->group(function () {
        Route::post('logistiga', [LogistigaSyncController::class, 'sendToLogistiga'])
            ->middleware('permission:ordres.creer');
    });

    // ============================================
    // FACTURES
    // ============================================
    Route::prefix('factures')->middleware('audit')->group(function () {
        Route::get('/', [FactureController::class, 'index'])
            ->middleware('permission:factures.voir');
        Route::post('/', [FactureController::class, 'store'])
            ->middleware('permission:factures.creer');
        Route::get('impayes', [FactureController::class, 'impayes'])
            ->middleware('permission:factures.voir');
        Route::get('{facture}', [FactureController::class, 'show'])
            ->middleware('permission:factures.voir');
        Route::put('{facture}', [FactureController::class, 'update'])
            ->middleware('permission:factures.modifier');
        Route::delete('{facture}', [FactureController::class, 'destroy'])
            ->middleware('permission:factures.supprimer');
        Route::post('{facture}/annuler', [FactureController::class, 'annuler'])
            ->middleware('permission:factures.modifier');
        Route::post('{facture}/duplicate', [FactureController::class, 'duplicate'])
            ->middleware('permission:factures.creer');
    });

    // ============================================
    // PAIEMENTS
    // ============================================
    Route::prefix('paiements')->middleware('audit')->group(function () {
        Route::get('/', [PaiementController::class, 'index'])
            ->middleware('permission:paiements.voir');
        Route::post('/', [PaiementController::class, 'store'])
            ->middleware('permission:paiements.creer');
        Route::get('stats', [PaiementController::class, 'stats'])
            ->middleware(['permission:paiements.voir', 'throttle:stats']);
        Route::get('{paiement}', [PaiementController::class, 'show'])
            ->middleware('permission:paiements.voir');
        Route::delete('{paiement}', [PaiementController::class, 'destroy'])
            ->middleware('permission:paiements.supprimer');
        Route::post('global', [PaiementController::class, 'paiementGlobal'])
            ->middleware('permission:paiements.creer');
    });

    // ============================================
    // BANQUES
    // ============================================
    Route::prefix('banques')->middleware('audit')->group(function () {
        Route::get('/', [BanqueController::class, 'index'])
            ->middleware('permission:banques.voir');
        Route::get('mouvements', [BanqueController::class, 'mouvements'])
            ->middleware('permission:banques.voir');
        Route::post('/', [BanqueController::class, 'store'])
            ->middleware('permission:banques.creer');
        Route::get('{banque}', [BanqueController::class, 'show'])
            ->middleware('permission:banques.voir');
        Route::put('{banque}', [BanqueController::class, 'update'])
            ->middleware('permission:banques.modifier');
        Route::delete('{banque}', [BanqueController::class, 'destroy'])
            ->middleware('permission:banques.supprimer');
        Route::get('{banque}/stats', [BanqueController::class, 'stats'])
            ->middleware(['permission:banques.voir', 'throttle:stats']);
    });

    // ============================================
    // CAISSE
    // ============================================
    Route::prefix('caisse')->middleware('audit')->group(function () {
        Route::get('/', [CaisseController::class, 'index'])
            ->middleware('permission:caisse.voir');
        Route::post('/', [CaisseController::class, 'store'])
            ->middleware('permission:caisse.creer');
        Route::get('solde', [CaisseController::class, 'solde'])
            ->middleware('permission:caisse.voir');
        Route::get('stats', [CaisseController::class, 'stats'])
            ->middleware(['permission:caisse.voir', 'throttle:stats']);
        Route::get('categories', [CaisseController::class, 'categories'])
            ->middleware('permission:caisse.voir');
        Route::get('{mouvement}', [CaisseController::class, 'show'])
            ->middleware('permission:caisse.voir');
        Route::delete('{mouvement}', [CaisseController::class, 'destroy'])
            ->middleware('permission:caisse.supprimer');
    });

    // ============================================
    // CREDITS BANCAIRES
    // ============================================
    Route::prefix('credits')->middleware('audit')->group(function () {
        Route::get('/', [CreditBancaireController::class, 'index'])
            ->middleware('permission:credits.voir');
        Route::post('/', [CreditBancaireController::class, 'store'])
            ->middleware('permission:credits.creer');
        Route::get('stats', [CreditBancaireController::class, 'stats'])
            ->middleware('permission:credits.voir');
        Route::get('dashboard', [CreditBancaireController::class, 'dashboard'])
            ->middleware('permission:credits.voir');
        Route::get('comparaison', [CreditBancaireController::class, 'comparaison'])
            ->middleware('permission:credits.voir');
        Route::get('{creditBancaire}', [CreditBancaireController::class, 'show'])
            ->middleware('permission:credits.voir');
        Route::put('{creditBancaire}', [CreditBancaireController::class, 'update'])
            ->middleware('permission:credits.modifier');
        Route::delete('{creditBancaire}', [CreditBancaireController::class, 'destroy'])
            ->middleware('permission:credits.supprimer');
        Route::post('{creditBancaire}/rembourser', [CreditBancaireController::class, 'rembourser'])
            ->middleware('permission:credits.modifier');
        Route::get('{creditBancaire}/echeances', [CreditBancaireController::class, 'echeances'])
            ->middleware('permission:credits.voir');
        Route::post('{creditBancaire}/documents', [CreditBancaireController::class, 'uploadDocument'])
            ->middleware('permission:credits.modifier');
    });

    // ============================================
    // PARTENAIRES - TRANSITAIRES
    // ============================================
    Route::prefix('transitaires')->middleware('audit')->group(function () {
        Route::get('/', [TransitaireController::class, 'index'])
            ->middleware('permission:partenaires.voir');
        Route::post('/', [TransitaireController::class, 'store'])
            ->middleware('permission:partenaires.creer');
        Route::get('{transitaire}', [TransitaireController::class, 'show'])
            ->middleware('permission:partenaires.voir');
        Route::put('{transitaire}', [TransitaireController::class, 'update'])
            ->middleware('permission:partenaires.modifier');
        Route::delete('{transitaire}', [TransitaireController::class, 'destroy'])
            ->middleware('permission:partenaires.supprimer');
    });

    // ============================================
    // PARTENAIRES - REPRESENTANTS
    // ============================================
    Route::prefix('representants')->middleware('audit')->group(function () {
        Route::get('/', [RepresentantController::class, 'index'])
            ->middleware('permission:partenaires.voir');
        Route::post('/', [RepresentantController::class, 'store'])
            ->middleware('permission:partenaires.creer');
        Route::get('{representant}', [RepresentantController::class, 'show'])
            ->middleware('permission:partenaires.voir');
        Route::put('{representant}', [RepresentantController::class, 'update'])
            ->middleware('permission:partenaires.modifier');
        Route::delete('{representant}', [RepresentantController::class, 'destroy'])
            ->middleware('permission:partenaires.supprimer');
        Route::get('{representant}/primes', [RepresentantController::class, 'primes'])
            ->middleware('permission:partenaires.voir');
    });

    // ============================================
    // PARTENAIRES - ARMATEURS
    // ============================================
    Route::prefix('armateurs')->middleware('audit')->group(function () {
        Route::get('/', [ArmateurController::class, 'index'])
            ->middleware('permission:partenaires.voir');
        Route::get('stats', [ArmateurController::class, 'globalStats'])
            ->middleware('permission:partenaires.voir');
        Route::post('/', [ArmateurController::class, 'store'])
            ->middleware('permission:partenaires.creer');
        Route::get('{armateur}', [ArmateurController::class, 'show'])
            ->middleware('permission:partenaires.voir');
        Route::put('{armateur}', [ArmateurController::class, 'update'])
            ->middleware('permission:partenaires.modifier');
        Route::delete('{armateur}', [ArmateurController::class, 'destroy'])
            ->middleware('permission:partenaires.supprimer');
        Route::get('{armateur}/stats', [ArmateurController::class, 'stats'])
            ->middleware('permission:partenaires.voir');
    });

    // ============================================
    // PRIMES
    // ============================================
    Route::prefix('primes')->middleware('audit')->group(function () {
        Route::get('/', [PrimeController::class, 'index'])
            ->middleware('permission:partenaires.voir');
        Route::post('/', [PrimeController::class, 'store'])
            ->middleware('permission:partenaires.creer');
        Route::get('stats', [PrimeController::class, 'stats'])
            ->middleware('permission:partenaires.voir');
        Route::get('{prime}', [PrimeController::class, 'show'])
            ->middleware('permission:partenaires.voir');
        Route::put('{prime}', [PrimeController::class, 'update'])
            ->middleware('permission:partenaires.modifier');
        Route::delete('{prime}', [PrimeController::class, 'destroy'])
            ->middleware('permission:partenaires.supprimer');
        Route::post('{prime}/payer', [PrimeController::class, 'payer'])
            ->middleware('permission:caisse.creer');
    });

    // ============================================
    // PREVISIONS BUDGETAIRES
    // ============================================
    Route::prefix('previsions')->middleware('audit')->group(function () {
        Route::get('/', [PrevisionController::class, 'index'])
            ->middleware('permission:reporting.voir');
        Route::post('/', [PrevisionController::class, 'store'])
            ->middleware('permission:reporting.creer');
        
        // Stats mensuelles détaillées (nouvel endpoint principal)
        Route::get('stats-mensuelles', [PrevisionController::class, 'statsMensuelles'])
            ->middleware('permission:reporting.voir');
        Route::get('historique', [PrevisionController::class, 'historique'])
            ->middleware('permission:reporting.voir');
        Route::get('export-mois', [PrevisionController::class, 'exportMois'])
            ->middleware('permission:reporting.voir');
        
        // Legacy stats endpoint
        Route::get('stats', [PrevisionController::class, 'stats'])
            ->middleware('permission:reporting.voir');
        Route::get('categories', [PrevisionController::class, 'categories'])
            ->middleware('permission:reporting.voir');
        Route::post('sync-realise', [PrevisionController::class, 'syncRealise'])
            ->middleware('permission:reporting.modifier');
        Route::get('{prevision}', [PrevisionController::class, 'show'])
            ->middleware('permission:reporting.voir');
        Route::put('{prevision}', [PrevisionController::class, 'update'])
            ->middleware('permission:reporting.modifier');
        Route::delete('{prevision}', [PrevisionController::class, 'destroy'])
            ->middleware('permission:reporting.supprimer');
    });

    // ============================================
    // NOTES DE DEBIT
    // ============================================
    Route::prefix('notes-debut')->middleware('audit')->group(function () {
        Route::get('/', [NoteDebutController::class, 'index'])
            ->middleware('permission:notes.voir');
        Route::get('stats', [NoteDebutController::class, 'stats'])
            ->middleware(['permission:notes.voir', 'throttle:stats']);
        Route::post('/', [NoteDebutController::class, 'store'])
            ->middleware('permission:notes.creer');
        Route::get('{noteDebut}', [NoteDebutController::class, 'show'])
            ->middleware('permission:notes.voir');
        Route::put('{noteDebut}', [NoteDebutController::class, 'update'])
            ->middleware('permission:notes.modifier');
        Route::delete('{noteDebut}', [NoteDebutController::class, 'destroy'])
            ->middleware('permission:notes.supprimer');
        Route::post('{noteDebut}/duplicate', [NoteDebutController::class, 'duplicate'])
            ->middleware('permission:notes.creer');
        Route::post('{noteDebut}/send-email', [NoteDebutController::class, 'sendEmail'])
            ->middleware('permission:notes.voir');
        Route::get('{noteDebut}/pdf', [NoteDebutController::class, 'downloadPdf'])
            ->middleware('permission:notes.voir');
    });

    // ============================================
    // ANNULATIONS
    // ============================================
    Route::prefix('annulations')->middleware('audit')->group(function () {
        Route::get('/', [AnnulationController::class, 'index'])
            ->middleware('permission:factures.voir');
        Route::get('stats', [AnnulationController::class, 'stats'])
            ->middleware(['permission:factures.voir', 'throttle:stats']);
        Route::get('client/{clientId}', [AnnulationController::class, 'historiqueClient'])
            ->middleware('permission:clients.voir');
        
        // Routes d'annulation de documents
        Route::post('facture/{facture}', [AnnulationController::class, 'annulerFacture'])
            ->middleware('permission:factures.modifier');
        Route::post('ordre/{ordre}', [AnnulationController::class, 'annulerOrdre'])
            ->middleware('permission:ordres.modifier');
        Route::post('devis/{devis}', [AnnulationController::class, 'annulerDevis'])
            ->middleware('permission:devis.modifier');
        
        // Actions sur les annulations existantes (AVANT la route générique {annulation})
        // Utiliser whereNumber pour s'assurer que {id} est un entier
        Route::post('{id}/generer-avoir', [AnnulationController::class, 'genererAvoir'])
            ->whereNumber('id')
            ->middleware('permission:factures.modifier');
        Route::post('{id}/rembourser', [AnnulationController::class, 'rembourser'])
            ->whereNumber('id')
            ->middleware('permission:caisse.creer');
        Route::post('{id}/utiliser-avoir', [AnnulationController::class, 'utiliserAvoir'])
            ->whereNumber('id')
            ->middleware('permission:paiements.creer');
        
        // Avoirs d'un client
        Route::get('avoirs/client/{clientId}', [AnnulationController::class, 'avoirsClient'])
            ->middleware('permission:clients.voir');
        
        // Route générique en DERNIER
        Route::get('{annulation}', [AnnulationController::class, 'show'])
            ->middleware('permission:factures.voir');
    });

    // ============================================
    // UTILISATEURS (Admin uniquement)
    // ============================================
    Route::prefix('utilisateurs')->middleware(['audit', 'role:administrateur,directeur'])->group(function () {
        Route::get('/', [UserController::class, 'index'])
            ->middleware('permission:utilisateurs.voir');
        Route::post('/', [UserController::class, 'store'])
            ->middleware('permission:utilisateurs.creer');
        Route::get('roles', [UserController::class, 'roles'])
            ->middleware('permission:utilisateurs.voir');
        Route::get('{user}', [UserController::class, 'show'])
            ->middleware('permission:utilisateurs.voir');
        Route::put('{user}', [UserController::class, 'update'])
            ->middleware('permission:utilisateurs.modifier');
        Route::delete('{user}', [UserController::class, 'destroy'])
            ->middleware(['permission:utilisateurs.supprimer', 'role:administrateur']);
        Route::patch('{user}/toggle-actif', [UserController::class, 'toggleActif'])
            ->middleware(['permission:utilisateurs.modifier', 'role:administrateur']);
    });

    // Profil utilisateur (accessible par tous)
    Route::get('profile', [UserController::class, 'profile']);
    Route::put('profile', [UserController::class, 'updateProfile']);
    Route::put('password', [UserController::class, 'updatePassword']);

    // ============================================
    // ROLES & PERMISSIONS (Admin uniquement)
    // ============================================
    Route::prefix('roles')->middleware(['audit', 'role:administrateur'])->group(function () {
        Route::get('/', [RoleController::class, 'index']);
        Route::get('stats', [RoleController::class, 'stats'])
            ->middleware('throttle:stats');
        Route::get('permissions', [RoleController::class, 'permissions']);
        Route::post('/', [RoleController::class, 'store']);
        Route::get('{role}', [RoleController::class, 'show']);
        Route::put('{role}', [RoleController::class, 'update']);
        Route::delete('{role}', [RoleController::class, 'destroy']);
        Route::post('{role}/duplicate', [RoleController::class, 'duplicate']);
        
        // Gestion des utilisateurs du rôle
        Route::get('{role}/available-users', [RoleController::class, 'availableUsers']);
        Route::post('{role}/assign-users', [RoleController::class, 'assignUsers']);
        Route::delete('{role}/users/{user}', [RoleController::class, 'unassignUser']);
    });

    // ============================================
    // ACCOUNT LOCKOUTS (Admin - Sécurité)
    // ============================================
    Route::prefix('lockouts')->middleware(['role:administrateur'])->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\Admin\LockoutController::class, 'index']);
        Route::get('stats', [\App\Http\Controllers\Api\Admin\LockoutController::class, 'stats']);
        Route::post('attempts', [\App\Http\Controllers\Api\Admin\LockoutController::class, 'attempts']);
        Route::post('unlock', [\App\Http\Controllers\Api\Admin\LockoutController::class, 'unlock']);
        Route::post('cleanup', [\App\Http\Controllers\Api\Admin\LockoutController::class, 'cleanup']);
    });

    // ============================================
    // SUSPICIOUS LOGINS (Admin - Sécurité)
    // ============================================
    Route::prefix('suspicious-logins')->middleware(['role:administrateur'])->group(function () {
        Route::get('/', [SuspiciousLoginController::class, 'index']);
        Route::get('stats', [SuspiciousLoginController::class, 'stats']);
    });

    // ============================================
    // AUDIT & TRACABILITE
    // ============================================
    Route::prefix('audit')->middleware(['role:administrateur'])->group(function () {
        Route::get('/', [AuditController::class, 'index']);
        Route::get('actions', [AuditController::class, 'actions']);
        Route::get('tables', [AuditController::class, 'tables']);
        Route::get('stats', [AuditController::class, 'stats'])
            ->middleware('throttle:stats');
        Route::get('export', [AuditController::class, 'export'])
            ->middleware('throttle:exports');
        Route::get('{audit}', [AuditController::class, 'show']);
    });

    // ============================================
    // CONFIGURATION (Admin uniquement)
    // ============================================
    Route::prefix('configuration')->middleware(['role:administrateur,directeur'])->group(function () {
        Route::get('/', [ConfigurationController::class, 'index'])
            ->middleware('permission:configuration.voir');
        Route::put('/', [ConfigurationController::class, 'update'])
            ->middleware(['permission:configuration.modifier', 'role:administrateur']);
        
        Route::get('taxes', [ConfigurationController::class, 'taxes'])
            ->middleware('permission:configuration.voir');
        Route::put('taxes', [ConfigurationController::class, 'updateTaxes'])
            ->middleware(['permission:configuration.modifier', 'role:administrateur']);
        
        Route::get('numerotation', [ConfigurationController::class, 'numerotation']);
        Route::put('numerotation', [ConfigurationController::class, 'updateNumerotation'])
            ->middleware('permission:configuration.modifier');
        Route::post('numerotation/sync', [ConfigurationController::class, 'syncCompteurs'])
            ->middleware('permission:configuration.modifier');
        
        Route::get('entreprise', [ConfigurationController::class, 'entreprise']);
        Route::put('entreprise', [ConfigurationController::class, 'updateEntreprise'])
            ->middleware('permission:configuration.modifier');
    });

    // ============================================
    // TAXES (CRUD dynamique)
    // ============================================
    Route::prefix('taxes')->middleware('audit')->group(function () {
        // Liste et consultation pour tous les utilisateurs
        Route::get('/', [TaxeController::class, 'index']);
        Route::get('actives', [TaxeController::class, 'actives']); // Pour les formulaires
        Route::get('{taxe}', [TaxeController::class, 'show']);
        
        // CRUD admin
        Route::post('/', [TaxeController::class, 'store'])
            ->middleware('permission:configuration.modifier');
        Route::put('{taxe}', [TaxeController::class, 'update'])
            ->middleware('permission:configuration.modifier');
        Route::delete('{taxe}', [TaxeController::class, 'destroy'])
            ->middleware('permission:configuration.modifier');
        Route::post('reorder', [TaxeController::class, 'reorder'])
            ->middleware('permission:configuration.modifier');
        Route::post('{taxe}/toggle-active', [TaxeController::class, 'toggleActive'])
            ->middleware('permission:configuration.modifier');
    });

    // ============================================
    // TAXES MENSUELLES (Angles de taxes - agrégation)
    // ============================================
    Route::prefix('taxes-mensuelles')->middleware('audit')->group(function () {
        // Accès lecture pour les commerciaux
        Route::get('mois-courant', [TaxesMensuellesController::class, 'getMoisCourant']);
        Route::get('historique', [TaxesMensuellesController::class, 'getHistorique']);
        
        // Actions admin
        Route::post('recalculer', [TaxesMensuellesController::class, 'recalculer'])
            ->middleware('permission:configuration.modifier');
        Route::post('cloturer-mois', [TaxesMensuellesController::class, 'cloturerMois'])
            ->middleware('permission:configuration.modifier');
    });

    // ============================================
    // CATEGORIES DE DEPENSES
    // ============================================
    Route::prefix('categories-depenses')->middleware('audit')->group(function () {
        Route::get('/', [CategorieDepenseController::class, 'index'])
            ->middleware('permission:configuration.voir');
        Route::post('/', [CategorieDepenseController::class, 'store'])
            ->middleware('permission:configuration.modifier');
        Route::get('stats', [CategorieDepenseController::class, 'stats'])
            ->middleware('permission:configuration.voir');
        Route::get('{categoriesDepense}', [CategorieDepenseController::class, 'show'])
            ->middleware('permission:configuration.voir');
        Route::put('{categoriesDepense}', [CategorieDepenseController::class, 'update'])
            ->middleware('permission:configuration.modifier');
        Route::delete('{categoriesDepense}', [CategorieDepenseController::class, 'destroy'])
            ->middleware('permission:configuration.supprimer');
        Route::get('{categoriesDepense}/mouvements', [CategorieDepenseController::class, 'mouvements'])
            ->middleware('permission:caisse.voir');
    });

    // ============================================
    // REPORTING
    // ============================================
    Route::prefix('reporting')->middleware(['permission:reporting.voir', 'throttle:reporting'])->group(function () {
        Route::get('/', [ReportingController::class, 'dashboard']);
        Route::get('chiffre-affaires', [ReportingController::class, 'chiffreAffaires']);
        Route::get('creances', [ReportingController::class, 'creances']);
        Route::get('tresorerie', [ReportingController::class, 'tresorerie']);
        Route::get('rentabilite', [ReportingController::class, 'rentabilite']);
        Route::get('activite-clients', [ReportingController::class, 'activiteClients']);
        Route::get('comparatif', [ReportingController::class, 'comparatif']);
        Route::get('statistiques-documents', [ReportingController::class, 'statistiquesDocuments']);
    });

    // ============================================
    // EXPORTS
    // ============================================
    Route::prefix('exports')->middleware(['permission:reporting.voir', 'throttle:exports'])->group(function () {
        Route::get('factures', [ExportController::class, 'factures']);
        Route::get('devis', [ExportController::class, 'devis']);
        Route::get('ordres-travail', [ExportController::class, 'ordres']);
        Route::get('paiements', [ExportController::class, 'paiements']);
        Route::get('caisse', [ExportController::class, 'caisse']);
        Route::get('caisse-especes', [ExportController::class, 'caisseEspeces']);
        Route::get('caisse-globale', [ExportController::class, 'caisseGlobale']);
        Route::get('clients', [ExportController::class, 'clients']);
        Route::get('primes', [ExportController::class, 'primes']);
        Route::get('chiffre-affaires', [ExportController::class, 'chiffreAffaires']);
        Route::get('creances', [ExportController::class, 'creances']);
        Route::get('tresorerie', [ExportController::class, 'tresorerie']);
        Route::get('credits', [ExportController::class, 'credits']);
        Route::get('annulations', [ExportController::class, 'annulations']);
        Route::get('activite-globale', [ExportController::class, 'activiteGlobale']);
        Route::get('tableau-de-bord', [ExportController::class, 'tableauDeBord']);
        Route::get('roles', [ExportController::class, 'roles'])
            ->middleware('permission:utilisateurs.voir');
    });

    // ============================================
    // NOTIFICATIONS EMAIL
    // ============================================
    Route::prefix('notifications')->middleware('audit')->group(function () {
        Route::post('facture/{facture}/envoyer', [NotificationController::class, 'envoyerFacture'])
            ->middleware('permission:factures.modifier');
        Route::post('devis/{devis}/envoyer', [NotificationController::class, 'envoyerDevis'])
            ->middleware('permission:devis.modifier');
        Route::post('ordre/{ordre}/envoyer', [NotificationController::class, 'envoyerOrdre'])
            ->middleware('permission:ordres.modifier');
        Route::post('paiement/{paiement}/confirmation', [NotificationController::class, 'envoyerConfirmationPaiement'])
            ->middleware('permission:paiements.voir');
        Route::post('facture/{facture}/rappel', [NotificationController::class, 'envoyerRappel'])
            ->middleware('permission:factures.modifier');
        Route::post('rappels-automatiques', [NotificationController::class, 'rappelsAutomatiques'])
            ->middleware('permission:factures.modifier');
        Route::post('recapitulatif-quotidien', [NotificationController::class, 'recapitulatifQuotidien'])
            ->middleware('permission:reporting.voir');
        Route::post('email-personnalise', [NotificationController::class, 'envoyerEmailPersonnalise'])
            ->middleware('permission:factures.modifier');
    });

    // ============================================
    // EMAIL TEMPLATES & AUTOMATIONS
    // ============================================
    Route::prefix('email-templates')->middleware('audit')->group(function () {
        Route::get('/', [EmailTemplateController::class, 'index'])
            ->middleware('permission:configuration.voir');
        Route::post('/', [EmailTemplateController::class, 'store'])
            ->middleware('permission:configuration.modifier');
        Route::get('types', [EmailTemplateController::class, 'types']);
        Route::get('{template}', [EmailTemplateController::class, 'show'])
            ->middleware('permission:configuration.voir');
        Route::put('{template}', [EmailTemplateController::class, 'update'])
            ->middleware('permission:configuration.modifier');
        Route::delete('{template}', [EmailTemplateController::class, 'destroy'])
            ->middleware('permission:configuration.modifier');
        Route::post('{template}/duplicate', [EmailTemplateController::class, 'duplicate'])
            ->middleware('permission:configuration.modifier');
        Route::post('{template}/toggle', [EmailTemplateController::class, 'toggleActif'])
            ->middleware('permission:configuration.modifier');
        Route::post('{template}/preview', [EmailTemplateController::class, 'preview'])
            ->middleware('permission:configuration.voir');
    });

    Route::prefix('email-automations')->middleware('audit')->group(function () {
        Route::get('/', [EmailAutomationController::class, 'index'])
            ->middleware('permission:configuration.voir');
        Route::post('/', [EmailAutomationController::class, 'store'])
            ->middleware('permission:configuration.modifier');
        Route::get('declencheurs', [EmailAutomationController::class, 'declencheurs']);
        Route::get('delai-unites', [EmailAutomationController::class, 'delaiUnites']);
        Route::get('for-declencheur/{declencheur}', [EmailAutomationController::class, 'forDeclencheur']);
        Route::get('{automation}', [EmailAutomationController::class, 'show'])
            ->middleware('permission:configuration.voir');
        Route::put('{automation}', [EmailAutomationController::class, 'update'])
            ->middleware('permission:configuration.modifier');
        Route::delete('{automation}', [EmailAutomationController::class, 'destroy'])
            ->middleware('permission:configuration.modifier');
        Route::post('{automation}/toggle', [EmailAutomationController::class, 'toggleActif'])
            ->middleware('permission:configuration.modifier');
    });

    Route::prefix('email-config')->middleware('audit')->group(function () {
        Route::get('/', [EmailConfigController::class, 'index'])
            ->middleware('permission:configuration.voir');
        Route::put('/', [EmailConfigController::class, 'update'])
            ->middleware('permission:configuration.modifier');
        Route::post('test', [EmailConfigController::class, 'sendTest'])
            ->middleware('permission:configuration.modifier');
    });

    // ============================================
    // NOTIFICATIONS IN-APP (ALERTS)
    // ============================================
    require __DIR__.'/api_notifications.php';
});
