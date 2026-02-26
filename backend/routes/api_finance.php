<?php

use App\Http\Controllers\Api\PaiementController;
use App\Http\Controllers\Api\BanqueController;
use App\Http\Controllers\Api\CaisseController;
use App\Http\Controllers\Api\CreditBancaireController;
use App\Http\Controllers\Api\PrevisionController;
use App\Http\Controllers\Api\PrimeController;
use App\Http\Controllers\Api\PrimeCamionController;
use App\Http\Controllers\Api\CategorieDepenseController;
use App\Http\Controllers\Api\CaisseEnAttenteController;
use App\Http\Controllers\Api\CaisseCnvController;
use App\Http\Controllers\Api\TaxesMensuellesController;
use App\Http\Controllers\Api\TaxeController;
use Illuminate\Support\Facades\Route;

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
    Route::post('{creditBancaire}/annuler', [CreditBancaireController::class, 'annuler'])
        ->middleware('permission:credits.supprimer');
    Route::get('{creditBancaire}/echeances', [CreditBancaireController::class, 'echeances'])
        ->middleware('permission:credits.voir');
    Route::post('{creditBancaire}/documents', [CreditBancaireController::class, 'uploadDocument'])
        ->middleware('permission:credits.modifier');
});

// ============================================
// PRÉVISIONS
// ============================================
Route::prefix('previsions')->middleware('audit')->group(function () {
    Route::get('stats-mensuelles', [PrevisionController::class, 'statsMensuelles'])
        ->middleware('permission:previsions.voir');
    Route::get('historique', [PrevisionController::class, 'historique'])
        ->middleware('permission:previsions.voir');
    Route::get('categories', [PrevisionController::class, 'categories'])
        ->middleware('permission:previsions.voir');
    Route::get('export-mois', [PrevisionController::class, 'exportMois'])
        ->middleware('permission:previsions.voir');
    Route::post('sync-realise', [PrevisionController::class, 'syncRealise'])
        ->middleware('permission:previsions.modifier');
    Route::get('/', [PrevisionController::class, 'index'])
        ->middleware('permission:previsions.voir');
    Route::post('/', [PrevisionController::class, 'store'])
        ->middleware('permission:previsions.creer');
    Route::get('{prevision}', [PrevisionController::class, 'show'])
        ->middleware('permission:previsions.voir');
    Route::put('{prevision}', [PrevisionController::class, 'update'])
        ->middleware('permission:previsions.modifier');
    Route::delete('{prevision}', [PrevisionController::class, 'destroy'])
        ->middleware('permission:previsions.supprimer');
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
// PRIMES CAMION (depuis OPS)
// ============================================
Route::prefix('primes-camion')->middleware('audit')->group(function () {
    Route::get('/stats', [PrimeCamionController::class, 'stats'])
        ->middleware('permission:caisse.voir');
    Route::get('/', [PrimeCamionController::class, 'index'])
        ->middleware('permission:caisse.voir');
    Route::post('/{primeId}/decaisser', [PrimeCamionController::class, 'decaisser'])
        ->middleware('permission:caisse.creer');
});

// ============================================
// CAISSE EN ATTENTE - OPS (primes OPS validées)
// ============================================
Route::prefix('caisse-en-attente')->middleware('audit')->group(function () {
    Route::get('/stats', [CaisseEnAttenteController::class, 'stats'])
        ->middleware('permission:caisse.voir');
    Route::get('/', [CaisseEnAttenteController::class, 'index'])
        ->middleware('permission:caisse.voir');
    Route::post('/{primeId}/decaisser', [CaisseEnAttenteController::class, 'decaisser'])
        ->middleware('permission:caisse.creer');
});

// ============================================
// CAISSE EN ATTENTE - CNV (primes conventionnel)
// ============================================
Route::prefix('caisse-cnv')->middleware('audit')->group(function () {
    Route::get('/stats', [CaisseCnvController::class, 'stats'])
        ->middleware('permission:caisse.voir');
    Route::get('/', [CaisseCnvController::class, 'index'])
        ->middleware('permission:caisse.voir');
    Route::post('/{primeId}/decaisser', [CaisseCnvController::class, 'decaisser'])
        ->middleware('permission:caisse.creer');
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
// CONFIGURATION TAXES (CRUD)
// ============================================
Route::prefix('taxes')->middleware('audit')->group(function () {
    Route::get('actives', [TaxeController::class, 'actives'])
        ->middleware('permission:ordres.voir');
    Route::post('reorder', [TaxeController::class, 'reorder'])
        ->middleware('permission:configuration.modifier');
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
