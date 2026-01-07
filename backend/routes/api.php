<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Controllers
use App\Http\Controllers\Api\AuthController;
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
use App\Http\Controllers\Api\UtilisateurController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\ConfigurationController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ReportingController;
use App\Http\Controllers\Api\PrimeController;
use App\Http\Controllers\Api\NoteDebutController;
use App\Http\Controllers\Api\DocumentController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Routes publiques
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
});

// Routes protégées par authentification
Route::middleware(['auth:sanctum'])->group(function () {
    
    // Auth
    Route::prefix('auth')->group(function () {
        Route::get('user', [AuthController::class, 'user']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::put('profile', [AuthController::class, 'updateProfile']);
        Route::put('password', [AuthController::class, 'updatePassword']);
    });

    // Dashboard
    Route::get('dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('dashboard/charts', [DashboardController::class, 'charts']);
    Route::get('dashboard/recent-activities', [DashboardController::class, 'recentActivities']);

    // Clients
    Route::apiResource('clients', ClientController::class);
    Route::get('clients/{client}/historique', [ClientController::class, 'historique']);
    Route::get('clients/{client}/solde', [ClientController::class, 'solde']);

    // Devis
    Route::apiResource('devis', DevisController::class);
    Route::post('devis/{devis}/dupliquer', [DevisController::class, 'dupliquer']);
    Route::post('devis/{devis}/convertir-ordre', [DevisController::class, 'convertirEnOrdre']);
    Route::post('devis/{devis}/envoyer-email', [DevisController::class, 'envoyerEmail']);
    Route::get('devis/{devis}/pdf', [DevisController::class, 'generatePdf']);

    // Ordres de travail
    Route::apiResource('ordres', OrdreTravailController::class);
    Route::post('ordres/{ordre}/convertir-facture', [OrdreTravailController::class, 'convertirEnFacture']);
    Route::post('ordres/{ordre}/terminer', [OrdreTravailController::class, 'terminer']);
    Route::get('ordres/{ordre}/pdf', [OrdreTravailController::class, 'generatePdf']);

    // Factures
    Route::apiResource('factures', FactureController::class);
    Route::post('factures/{facture}/envoyer-email', [FactureController::class, 'envoyerEmail']);
    Route::get('factures/{facture}/pdf', [FactureController::class, 'generatePdf']);

    // Paiements
    Route::apiResource('paiements', PaiementController::class);
    Route::post('paiements/global', [PaiementController::class, 'paiementGlobal']);

    // Banques
    Route::apiResource('banques', BanqueController::class);
    Route::get('banques/{banque}/mouvements', [BanqueController::class, 'mouvements']);
    Route::post('banques/{banque}/transfert', [BanqueController::class, 'transfert']);

    // Caisse
    Route::get('caisse/solde', [CaisseController::class, 'solde']);
    Route::get('caisse/mouvements', [CaisseController::class, 'mouvements']);
    Route::post('caisse/entree', [CaisseController::class, 'entree']);
    Route::post('caisse/sortie', [CaisseController::class, 'sortie']);
    Route::get('caisse/globale', [CaisseController::class, 'caisseGlobale']);

    // Partenaires
    Route::apiResource('transitaires', TransitaireController::class);
    Route::get('transitaires/{transitaire}/primes', [TransitaireController::class, 'primes']);

    Route::apiResource('representants', RepresentantController::class);
    Route::get('representants/{representant}/primes', [RepresentantController::class, 'primes']);

    Route::apiResource('armateurs', ArmateurController::class);

    // Primes partenaires
    Route::apiResource('primes', PrimeController::class);
    Route::post('primes/paiement', [PrimeController::class, 'payerPrimes']);

    // Crédits bancaires
    Route::apiResource('credits', CreditBancaireController::class);
    Route::get('credits/{credit}/echeances', [CreditBancaireController::class, 'echeances']);
    Route::post('credits/{credit}/remboursement', [CreditBancaireController::class, 'remboursement']);
    Route::get('credits/{credit}/documents', [CreditBancaireController::class, 'documents']);
    Route::post('credits/{credit}/documents', [CreditBancaireController::class, 'uploadDocument']);

    // Prévisions
    Route::apiResource('previsions', PrevisionController::class);

    // Annulations
    Route::apiResource('annulations', AnnulationController::class);
    Route::post('annulations/devis/{devis}', [AnnulationController::class, 'annulerDevis']);
    Route::post('annulations/ordres/{ordre}', [AnnulationController::class, 'annulerOrdre']);
    Route::post('annulations/factures/{facture}', [AnnulationController::class, 'annulerFacture']);

    // Notes de début
    Route::apiResource('notes-debut', NoteDebutController::class);
    Route::get('notes-debut/{note}/pdf', [NoteDebutController::class, 'generatePdf']);

    // Utilisateurs & Rôles
    Route::apiResource('utilisateurs', UtilisateurController::class);
    Route::put('utilisateurs/{utilisateur}/toggle-actif', [UtilisateurController::class, 'toggleActif']);
    
    Route::apiResource('roles', RoleController::class);
    Route::get('permissions', [RoleController::class, 'permissions']);

    // Audit & Traçabilité
    Route::get('audit', [AuditController::class, 'index']);
    Route::get('audit/export', [AuditController::class, 'export']);

    // Configuration
    Route::prefix('configuration')->group(function () {
        Route::get('numerotation', [ConfigurationController::class, 'numerotation']);
        Route::put('numerotation', [ConfigurationController::class, 'updateNumerotation']);
        Route::get('taxes', [ConfigurationController::class, 'taxes']);
        Route::put('taxes', [ConfigurationController::class, 'updateTaxes']);
        Route::get('entreprise', [ConfigurationController::class, 'entreprise']);
        Route::put('entreprise', [ConfigurationController::class, 'updateEntreprise']);
    });

    // Reporting
    Route::prefix('reporting')->group(function () {
        Route::get('chiffre-affaires', [ReportingController::class, 'chiffreAffaires']);
        Route::get('paiements', [ReportingController::class, 'paiements']);
        Route::get('clients', [ReportingController::class, 'clients']);
        Route::get('operations', [ReportingController::class, 'operations']);
        Route::get('export/{type}', [ReportingController::class, 'export']);
    });

    // Documents (upload, génération)
    Route::post('documents/upload', [DocumentController::class, 'upload']);
    Route::get('documents/{document}/download', [DocumentController::class, 'download']);
    Route::delete('documents/{document}', [DocumentController::class, 'destroy']);
});

// Route de vérification de document (publique avec token)
Route::get('verification/{token}', [DocumentController::class, 'verify']);
