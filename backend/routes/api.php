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
use App\Http\Controllers\Api\ConteneurTraiteController;
use App\Http\Controllers\Api\ConteneurAnomalieController;
use App\Http\Controllers\Api\SyncDiagnosticController;


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Ping endpoint pour vérifier la connectivité (public)
Route::get('ping', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()->toIso8601String()]);
});
Route::match(['HEAD'], 'ping', function () {
    return response()->noContent();
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
        Route::get('check-bl', [OrdreTravailController::class, 'checkBL'])
            ->middleware('permission:ordres.voir');
        Route::get('description-suggestions', [OrdreTravailController::class, 'descriptionSuggestions'])
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
    });

    // ============================================
    // CONTENEURS EN ATTENTE
    // ============================================
    Route::prefix('conteneurs-en-attente')->middleware('audit')->group(function () {
        Route::get('/', [ConteneurTraiteController::class, 'index'])
            ->middleware('permission:ordres.voir');
        Route::get('stats', [ConteneurTraiteController::class, 'stats'])
            ->middleware('permission:ordres.voir');
        Route::post('{conteneur}/affecter', [ConteneurTraiteController::class, 'affecterAOrdre'])
            ->middleware('permission:ordres.modifier');
        Route::post('{conteneur}/creer-ordre', [ConteneurTraiteController::class, 'creerOrdre'])
            ->middleware('permission:ordres.creer');
        Route::post('{conteneur}/ignorer', [ConteneurTraiteController::class, 'ignorer'])
            ->middleware('permission:ordres.modifier');
    });

    // ============================================
    // ANOMALIES CONTENEURS
    // ============================================
    Route::prefix('conteneurs-anomalies')->middleware('audit')->group(function () {
        Route::get('/', [ConteneurAnomalieController::class, 'index'])
            ->middleware('permission:ordres.voir');
        Route::get('stats', [ConteneurAnomalieController::class, 'stats'])
            ->middleware('permission:ordres.voir');
        Route::post('detecter', [ConteneurAnomalieController::class, 'detecter'])
            ->middleware('permission:ordres.modifier');
        Route::post('traiter-masse', [ConteneurAnomalieController::class, 'traiterEnMasse'])
            ->middleware('permission:ordres.modifier');
        Route::post('{anomalie}/ajouter', [ConteneurAnomalieController::class, 'ajouterAOrdre'])
            ->middleware('permission:ordres.modifier');
        Route::post('{anomalie}/ignorer', [ConteneurAnomalieController::class, 'ignorer'])
            ->middleware('permission:ordres.modifier');
    });

    // ============================================
    // SYNC DIAGNOSTIC (OPS)
    // ============================================
    Route::prefix('sync-diagnostic')->middleware('audit')->group(function () {
        Route::get('health-ops', [SyncDiagnosticController::class, 'healthOps'])
            ->middleware('permission:configuration.voir');
        Route::post('sync-conteneurs', [SyncDiagnosticController::class, 'syncConteneurs'])
            ->middleware('permission:configuration.modifier');
        Route::post('sync-armateurs', [SyncDiagnosticController::class, 'syncArmateurs'])
            ->middleware('permission:configuration.modifier');
        Route::post('sync-all', [SyncDiagnosticController::class, 'syncAll'])
            ->middleware('permission:configuration.modifier');
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
        Route::get('solde-jour', [CaisseController::class, 'soldeJour'])
            ->middleware('permission:caisse.voir');
        Route::get('stats', [CaisseController::class, 'stats'])
            ->middleware(['permission:caisse.voir', 'throttle:stats']);
        Route::get('categories', [CaisseController::class, 'categories'])
            ->middleware('permission:caisse.voir');
        Route::get('{mouvement}', [CaisseController::class, 'show'])
            ->middleware('permission:caisse.voir');
        Route::put('{mouvement}', [CaisseController::class, 'update'])
            ->middleware('permission:caisse.modifier');
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
            ->middleware('permission:transitaires.voir');
        Route::post('/', [TransitaireController::class, 'store'])
            ->middleware('permission:transitaires.creer');
        Route::get('{transitaire}', [TransitaireController::class, 'show'])
            ->middleware('permission:transitaires.voir');
        Route::put('{transitaire}', [TransitaireController::class, 'update'])
            ->middleware('permission:transitaires.modifier');
        Route::delete('{transitaire}', [TransitaireController::class, 'destroy'])
            ->middleware('permission:transitaires.supprimer');
    });

    // ============================================
    // PARTENAIRES - REPRESENTANTS
    // ============================================
    Route::prefix('representants')->middleware('audit')->group(function () {
        Route::get('/', [RepresentantController::class, 'index'])
            ->middleware('permission:representants.voir');
        Route::post('/', [RepresentantController::class, 'store'])
            ->middleware('permission:representants.creer');
        Route::get('{representant}', [RepresentantController::class, 'show'])
            ->middleware('permission:representants.voir');
        Route::put('{representant}', [RepresentantController::class, 'update'])
            ->middleware('permission:representants.modifier');
        Route::delete('{representant}', [RepresentantController::class, 'destroy'])
            ->middleware('permission:representants.supprimer');
    });

    // ============================================
    // ARMATEURS
    // ============================================
    Route::prefix('armateurs')->middleware('audit')->group(function () {
        Route::get('/', [ArmateurController::class, 'index'])
            ->middleware('permission:armateurs.voir');
        Route::post('/', [ArmateurController::class, 'store'])
            ->middleware('permission:armateurs.creer');
        Route::get('{armateur}', [ArmateurController::class, 'show'])
            ->middleware('permission:armateurs.voir');
        Route::put('{armateur}', [ArmateurController::class, 'update'])
            ->middleware('permission:armateurs.modifier');
        Route::delete('{armateur}', [ArmateurController::class, 'destroy'])
            ->middleware('permission:armateurs.supprimer');
    });

    // ============================================
    // PRIMES
    // ============================================
    Route::prefix('primes')->middleware('audit')->group(function () {
        Route::get('/', [PrimeController::class, 'index'])
            ->middleware('permission:primes.voir');
        Route::get('stats', [PrimeController::class, 'stats'])
            ->middleware(['permission:primes.voir', 'throttle:stats']);
        Route::get('{prime}', [PrimeController::class, 'show'])
            ->middleware('permission:primes.voir');
        Route::put('{prime}', [PrimeController::class, 'update'])
            ->middleware('permission:primes.modifier');
        Route::post('{prime}/payer', [PrimeController::class, 'payer'])
            ->middleware('permission:primes.payer');
        Route::delete('{prime}', [PrimeController::class, 'destroy'])
            ->middleware('permission:primes.supprimer');
    });

    // ============================================
    // NOTE DE DÉBIT
    // ============================================
    Route::prefix('notes-debit')->middleware('audit')->group(function () {
        Route::get('/', [NoteDebutController::class, 'index'])
            ->middleware('permission:notes_debit.voir');
        Route::post('/', [NoteDebutController::class, 'store'])
            ->middleware('permission:notes_debit.creer');
        Route::get('{noteDebit}', [NoteDebutController::class, 'show'])
            ->middleware('permission:notes_debit.voir');
        Route::put('{noteDebit}', [NoteDebutController::class, 'update'])
            ->middleware('permission:notes_debit.modifier');
        Route::delete('{noteDebit}', [NoteDebutController::class, 'destroy'])
            ->middleware('permission:notes_debit.supprimer');
        Route::post('{noteDebit}/valider', [NoteDebutController::class, 'valider'])
            ->middleware('permission:notes_debit.valider');
    });

    // ============================================
    // PRÉVISIONS
    // ============================================
    Route::prefix('previsions')->middleware('audit')->group(function () {
        Route::get('/', [PrevisionController::class, 'index'])
            ->middleware('permission:previsions.voir');
        Route::post('/', [PrevisionController::class, 'store'])
            ->middleware('permission:previsions.creer');
        Route::get('stats', [PrevisionController::class, 'stats'])
            ->middleware(['permission:previsions.voir', 'throttle:stats']);
        Route::get('dashboard', [PrevisionController::class, 'dashboard'])
            ->middleware(['permission:previsions.voir', 'throttle:stats']);
        Route::get('{prevision}', [PrevisionController::class, 'show'])
            ->middleware('permission:previsions.voir');
        Route::put('{prevision}', [PrevisionController::class, 'update'])
            ->middleware('permission:previsions.modifier');
        Route::delete('{prevision}', [PrevisionController::class, 'destroy'])
            ->middleware('permission:previsions.supprimer');
        Route::post('{prevision}/realiser', [PrevisionController::class, 'realiser'])
            ->middleware('permission:previsions.realiser');
    });

    // ============================================
    // ANNULATIONS
    // ============================================
    Route::prefix('annulations')->middleware('audit')->group(function () {
        Route::get('/', [AnnulationController::class, 'index'])
            ->middleware('permission:annulations.voir');
        Route::post('/', [AnnulationController::class, 'store'])
            ->middleware('permission:annulations.creer');
        Route::get('stats', [AnnulationController::class, 'stats'])
            ->middleware(['permission:annulations.voir', 'throttle:stats']);
        Route::get('{annulation}', [AnnulationController::class, 'show'])
            ->middleware('permission:annulations.voir');
        Route::put('{annulation}', [AnnulationController::class, 'update'])
            ->middleware('permission:annulations.modifier');
        Route::post('{annulation}/valider', [AnnulationController::class, 'valider'])
            ->middleware('permission:annulations.valider');
        Route::post('{annulation}/rejeter', [AnnulationController::class, 'rejeter'])
            ->middleware('permission:annulations.valider');
    });

    // ============================================
    // CATÉGORIES DE DÉPENSES
    // ============================================
    Route::prefix('categories-depenses')->middleware('audit')->group(function () {
        Route::get('/', [CategorieDepenseController::class, 'index'])
            ->middleware('permission:caisse.voir');
        Route::post('/', [CategorieDepenseController::class, 'store'])
            ->middleware('permission:configuration.modifier');
        Route::put('{categorieDepense}', [CategorieDepenseController::class, 'update'])
            ->middleware('permission:configuration.modifier');
        Route::delete('{categorieDepense}', [CategorieDepenseController::class, 'destroy'])
            ->middleware('permission:configuration.modifier');
    });

    // ============================================
    // TAXES MENSUELLES
    // ============================================
    Route::prefix('taxes-mensuelles')->middleware('audit')->group(function () {
        Route::get('/', [TaxesMensuellesController::class, 'index'])
            ->middleware('permission:taxes.voir');
        Route::get('stats', [TaxesMensuellesController::class, 'stats'])
            ->middleware(['permission:taxes.voir', 'throttle:stats']);
        Route::get('{taxeMensuelle}', [TaxesMensuellesController::class, 'show'])
            ->middleware('permission:taxes.voir');
        Route::put('{taxeMensuelle}', [TaxesMensuellesController::class, 'update'])
            ->middleware('permission:taxes.modifier');
        Route::post('{taxeMensuelle}/payer', [TaxesMensuellesController::class, 'payer'])
            ->middleware('permission:taxes.payer');
        Route::post('recalculer/{annee}/{mois}', [TaxesMensuellesController::class, 'recalculer'])
            ->middleware('permission:taxes.modifier');
    });

    // ============================================
    // CONFIGURATION TAXES (CRUD complet)
    // ============================================
    Route::prefix('taxes')->middleware('audit')->group(function () {
        // Routes spécifiques AVANT les routes paramétrées
        Route::get('actives', [TaxeController::class, 'actives'])
            ->middleware('permission:ordres.voir');
        Route::post('reorder', [TaxeController::class, 'reorder'])
            ->middleware('permission:configuration.modifier');
        
        // CRUD standard
        Route::get('/', [TaxeController::class, 'index'])
            ->middleware('permission:configuration.voir');
        Route::post('/', [TaxeController::class, 'store'])
            ->middleware('permission:configuration.modifier');
        Route::get('{taxe}', [TaxeController::class, 'show'])
            ->middleware('permission:configuration.voir');
        Route::put('{taxe}', [TaxeController::class, 'update'])
            ->middleware('permission:configuration.modifier');
        Route::delete('{taxe}', [TaxeController::class, 'destroy'])
            ->middleware('permission:configuration.modifier');
        Route::post('{taxe}/toggle-active', [TaxeController::class, 'toggleActive'])
            ->middleware('permission:configuration.modifier');
    });

    // ============================================
    // EMAIL & NOTIFICATIONS
    // ============================================
    Route::prefix('notifications')->middleware('audit')->group(function () {
        Route::post('factures/{facture}/send', [NotificationController::class, 'sendFacture'])
            ->middleware('permission:factures.modifier');
        Route::post('devis/{devis}/send', [NotificationController::class, 'sendDevis'])
            ->middleware('permission:devis.modifier');
        Route::post('ordres/{ordre}/send', [NotificationController::class, 'sendOrdreTravail'])
            ->middleware('permission:ordres.modifier');
    });

    Route::prefix('email-templates')->middleware('audit')->group(function () {
        Route::get('/', [EmailTemplateController::class, 'index'])
            ->middleware('permission:configuration.voir');
        Route::post('/', [EmailTemplateController::class, 'store'])
            ->middleware('permission:configuration.modifier');
        Route::get('{template}', [EmailTemplateController::class, 'show'])
            ->middleware('permission:configuration.voir');
        Route::put('{template}', [EmailTemplateController::class, 'update'])
            ->middleware('permission:configuration.modifier');
        Route::delete('{template}', [EmailTemplateController::class, 'destroy'])
            ->middleware('permission:configuration.modifier');
        Route::post('{template}/preview', [EmailTemplateController::class, 'preview'])
            ->middleware('permission:configuration.voir');
    });

    Route::prefix('email-automation')->middleware('audit')->group(function () {
        Route::get('/', [EmailAutomationController::class, 'index'])
            ->middleware('permission:configuration.voir');
        Route::put('/', [EmailAutomationController::class, 'update'])
            ->middleware('permission:configuration.modifier');
        Route::post('test/{type}', [EmailAutomationController::class, 'testSend'])
            ->middleware('permission:configuration.modifier');
    });

    Route::prefix('email-config')->middleware('audit')->group(function () {
        Route::get('/', [EmailConfigController::class, 'index'])
            ->middleware('permission:configuration.voir');
        Route::put('/', [EmailConfigController::class, 'update'])
            ->middleware('permission:configuration.modifier');
        Route::post('test', [EmailConfigController::class, 'testConnection'])
            ->middleware('permission:configuration.modifier');
    });

    // ============================================
    // REPORTING & EXPORT
    // ============================================
    Route::prefix('reporting')->middleware(['audit', 'throttle:reporting'])->group(function () {
        Route::get('chiffre-affaires', [ReportingController::class, 'chiffreAffaires'])
            ->middleware('permission:reporting.voir');
        Route::get('creances', [ReportingController::class, 'creances'])
            ->middleware('permission:reporting.voir');
        Route::get('rentabilite-clients', [ReportingController::class, 'rentabiliteClients'])
            ->middleware('permission:reporting.voir');
        Route::get('evolution-mensuelle', [ReportingController::class, 'evolutionMensuelle'])
            ->middleware('permission:reporting.voir');
        Route::get('comparaison-periodes', [ReportingController::class, 'comparaisonPeriodes'])
            ->middleware('permission:reporting.voir');
        Route::get('top-clients', [ReportingController::class, 'topClients'])
            ->middleware('permission:reporting.voir');
        Route::get('analyse-operations', [ReportingController::class, 'analyseOperations'])
            ->middleware('permission:reporting.voir');
        Route::get('tresorerie', [ReportingController::class, 'tresorerie'])
            ->middleware('permission:reporting.voir');
        Route::get('synthese', [ReportingController::class, 'synthese'])
            ->middleware('permission:reporting.voir');
    });

    Route::prefix('export')->middleware(['audit', 'throttle:exports'])->group(function () {
        Route::get('factures', [ExportController::class, 'factures'])
            ->middleware('permission:factures.voir');
        Route::get('paiements', [ExportController::class, 'paiements'])
            ->middleware('permission:paiements.voir');
        Route::get('clients', [ExportController::class, 'clients'])
            ->middleware('permission:clients.voir');
        Route::get('reporting/{type}', [ExportController::class, 'reporting'])
            ->middleware('permission:reporting.voir');
    });

    // ============================================
    // CONFIGURATION
    // ============================================
    Route::prefix('configuration')->middleware('audit')->group(function () {
        Route::get('/', [ConfigurationController::class, 'index'])
            ->middleware('permission:configuration.voir');
        Route::put('/', [ConfigurationController::class, 'update'])
            ->middleware('permission:configuration.modifier');
        Route::get('{key}', [ConfigurationController::class, 'show'])
            ->middleware('permission:configuration.voir');
        Route::put('{key}', [ConfigurationController::class, 'updateKey'])
            ->middleware('permission:configuration.modifier');
    });

    // ============================================
    // ADMINISTRATION - UTILISATEURS
    // ============================================
    Route::prefix('admin/users')->middleware(['audit', 'role:admin'])->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('{user}', [UserController::class, 'show']);
        Route::put('{user}', [UserController::class, 'update']);
        Route::delete('{user}', [UserController::class, 'destroy']);
        Route::post('{user}/toggle-active', [UserController::class, 'toggleActive']);
        Route::post('{user}/reset-password', [UserController::class, 'resetPassword']);
    });

    // ============================================
    // ADMINISTRATION - RÔLES & PERMISSIONS
    // ============================================
    Route::prefix('admin/roles')->middleware(['audit', 'role:admin'])->group(function () {
        Route::get('/', [RoleController::class, 'index']);
        Route::post('/', [RoleController::class, 'store']);
        Route::get('permissions', [RoleController::class, 'permissions']);
        Route::get('{role}', [RoleController::class, 'show']);
        Route::put('{role}', [RoleController::class, 'update']);
        Route::delete('{role}', [RoleController::class, 'destroy']);
    });

    // ============================================
    // AUDIT LOGS
    // ============================================
    Route::prefix('admin/audit')->middleware('role:admin')->group(function () {
        Route::get('/', [AuditController::class, 'index']);
        Route::get('stats', [AuditController::class, 'stats'])
            ->middleware('throttle:stats');
        Route::get('{auditLog}', [AuditController::class, 'show']);
    });

    // ============================================
    // NOTIFICATIONS IN-APP (ALERTES)
    // ============================================
    require __DIR__.'/api_notifications.php';
});
