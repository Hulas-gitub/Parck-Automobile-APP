<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\VehiculesController;
use App\Http\Controllers\Admin\DocumentExpirationController;

/*
|--------------------------------------------------------------------------
| API Routes - Fleetify SGS
|--------------------------------------------------------------------------
*/

// ==========================================
// Routes publiques (non authentifiées)
// ==========================================
Route::post('/login',    [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// ==========================================
// Routes protégées par Sanctum
// ==========================================
Route::middleware('auth:sanctum')->group(function () {

    // ── Auth ──
    Route::get('/user',               [AuthController::class, 'user']);
    Route::post('/logout',            [AuthController::class, 'logout']);
    Route::post('/refresh',           [AuthController::class, 'refresh']);
    Route::post('/check-permission',  [AuthController::class, 'checkPermission']);

    // ── Administration ──
    Route::prefix('admin')->name('admin.')->group(function () {

        // Dashboard principal
        Route::get('/dashboard',             [DashboardController::class, 'index'])->name('dashboard');
        Route::get('/dashboard/kpi-vehicules',[DashboardController::class, 'getKpiVehiculesDetail'])->name('dashboard.kpi-vehicules');

        // ── Vérification expiration documents ──
        Route::get('/documents/check-expiration', [DocumentExpirationController::class, 'checkExpiration'])->name('documents.check-expiration');

        // =====================================================================
        // MODULE VÉHICULES
        // =====================================================================
        Route::prefix('vehicules')->name('vehicules.')->group(function () {

            // ── Données de référence (AVANT la route {immatriculation}) ───────
            Route::get('/references', [VehiculesController::class, 'references'])->name('references');

            // CRUD Catégories
            Route::post  ('/references/categories',      [VehiculesController::class, 'storeCategorie'])->name('categories.store');
            Route::put   ('/references/categories/{id}', [VehiculesController::class, 'updateCategorie'])->name('categories.update');
            Route::delete('/references/categories/{id}', [VehiculesController::class, 'destroyCategorie'])->name('categories.destroy');

            // CRUD Marques
            Route::post  ('/references/marques',         [VehiculesController::class, 'storeMarque'])->name('marques.store');
            Route::put   ('/references/marques/{id}',    [VehiculesController::class, 'updateMarque'])->name('marques.update');
            Route::delete('/references/marques/{id}',    [VehiculesController::class, 'destroyMarque'])->name('marques.destroy');

            // CRUD Modèles
            Route::post  ('/references/modeles',         [VehiculesController::class, 'storeModele'])->name('modeles.store');
            Route::put   ('/references/modeles/{id}',    [VehiculesController::class, 'updateModele'])->name('modeles.update');
            Route::delete('/references/modeles/{id}',    [VehiculesController::class, 'destroyModele'])->name('modeles.destroy');

            // CRUD Années
            Route::post  ('/references/annees',          [VehiculesController::class, 'storeAnnee'])->name('annees.store');
            Route::delete('/references/annees/{id}',     [VehiculesController::class, 'destroyAnnee'])->name('annees.destroy');

            // ── CRUD principal véhicules ───────────────────────────────────────
            Route::get   ('/',                  [VehiculesController::class, 'index'])->name('index');
            Route::post  ('/',                  [VehiculesController::class, 'store'])->name('store');
            Route::get   ('/{immatriculation}', [VehiculesController::class, 'show'])->name('show');
            Route::put   ('/{immatriculation}', [VehiculesController::class, 'update'])->name('update');
            Route::post  ('/{immatriculation}', [VehiculesController::class, 'update'])->name('update.post'); // Pour multipart/form-data avec _method=PUT
            Route::delete('/{immatriculation}', [VehiculesController::class, 'destroy'])->name('destroy');

            // Changement de statut uniquement
            Route::patch('/{immatriculation}/statut', [VehiculesController::class, 'updateStatut'])->name('statut');

            // ── Documents d'un véhicule ───────────────────────────────────────
            Route::get   ('/{immatriculation}/documents',                   [VehiculesController::class, 'documents'])->name('documents.index');
            Route::post  ('/{immatriculation}/documents',                   [VehiculesController::class, 'storeDocument'])->name('documents.store');
            Route::put   ('/{immatriculation}/documents/{documentId}',      [VehiculesController::class, 'updateDocument'])->name('documents.update');
            Route::post  ('/{immatriculation}/documents/{documentId}',      [VehiculesController::class, 'updateDocument'])->name('documents.update.post'); // Pour multipart/form-data avec _method=PUT
            Route::delete('/{immatriculation}/documents/{documentId}',      [VehiculesController::class, 'destroyDocument'])->name('documents.destroy');
            Route::get   ('/{immatriculation}/documents/{documentId}/open', [VehiculesController::class, 'openDocument'])->name('documents.open');

            // ── Maintenances (= interventions) ────────────────────────────────
            Route::get ('/{immatriculation}/maintenances', [VehiculesController::class, 'maintenances'])->name('maintenances.index');
            Route::post('/{immatriculation}/maintenances', [VehiculesController::class, 'storeMaintenance'])->name('maintenances.store');

            // ── Missions ──────────────────────────────────────────────────────
            Route::get('/{immatriculation}/missions', [VehiculesController::class, 'missions'])->name('missions.index');

            // ── Carburant (CRUD complet) ───────────────────────────────────────
            Route::get   ('/{immatriculation}/carburant',      [VehiculesController::class, 'carburant'])->name('carburant.index');
            Route::post  ('/{immatriculation}/carburant',      [VehiculesController::class, 'storeCarburant'])->name('carburant.store');
            Route::get   ('/{immatriculation}/carburant/{id}', [VehiculesController::class, 'showCarburant'])->name('carburant.show');
            Route::put   ('/{immatriculation}/carburant/{id}', [VehiculesController::class, 'updateCarburant'])->name('carburant.update');
            Route::delete('/{immatriculation}/carburant/{id}', [VehiculesController::class, 'destroyCarburant'])->name('carburant.destroy');

            // ── Statistiques ──────────────────────────────────────────────────
            Route::get('/{immatriculation}/stats', [VehiculesController::class, 'stats'])->name('stats');
        });

    });

});