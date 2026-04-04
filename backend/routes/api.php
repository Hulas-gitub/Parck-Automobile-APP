<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\VehiculesController;
use App\Http\Controllers\Admin\CarnetCarburantController;
use App\Http\Controllers\Admin\DocumentExpirationController;

/*
|--------------------------------------------------------------------------
| API Routes - Fleetify SGS
|--------------------------------------------------------------------------
*/

Route::post('/login',    [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {

    Route::get ('/user',             [AuthController::class, 'user']);
    Route::post('/logout',           [AuthController::class, 'logout']);
    Route::post('/refresh',          [AuthController::class, 'refresh']);
    Route::post('/check-permission', [AuthController::class, 'checkPermission']);

    Route::prefix('admin')->name('admin.')->group(function () {

        Route::get('/dashboard',               [DashboardController::class, 'index'])->name('dashboard');
        Route::get('/dashboard/kpi-vehicules', [DashboardController::class, 'getKpiVehiculesDetail'])->name('dashboard.kpi-vehicules');
        Route::get('/documents/check-expiration', [DocumentExpirationController::class, 'checkExpiration'])->name('documents.check-expiration');


           Route::prefix('carburant')->name('carburant.global.')->group(function () {
        Route::get('/vehicules',
            [CarnetCarburantController::class, 'listeVehicules'])
            ->name('vehicules');
 
        Route::get('/vehicules/{immatriculation}',
            [CarnetCarburantController::class, 'vehiculeDetail'])
            ->name('vehicule.detail');
    });
 
        // =====================================================================
        // VÉHICULES
        // =====================================================================
        Route::prefix('vehicules')->name('vehicules.')->group(function () {

            // Références
            Route::get('/references', [VehiculesController::class, 'references'])->name('references');
            Route::post  ('/references/categories',      [VehiculesController::class, 'storeCategorie'])->name('categories.store');
            Route::put   ('/references/categories/{id}', [VehiculesController::class, 'updateCategorie'])->name('categories.update');
            Route::delete('/references/categories/{id}', [VehiculesController::class, 'destroyCategorie'])->name('categories.destroy');
            Route::post  ('/references/marques',         [VehiculesController::class, 'storeMarque'])->name('marques.store');
            Route::put   ('/references/marques/{id}',    [VehiculesController::class, 'updateMarque'])->name('marques.update');
            Route::delete('/references/marques/{id}',    [VehiculesController::class, 'destroyMarque'])->name('marques.destroy');
            Route::post  ('/references/modeles',         [VehiculesController::class, 'storeModele'])->name('modeles.store');
            Route::put   ('/references/modeles/{id}',    [VehiculesController::class, 'updateModele'])->name('modeles.update');
            Route::delete('/references/modeles/{id}',    [VehiculesController::class, 'destroyModele'])->name('modeles.destroy');
            Route::post  ('/references/annees',          [VehiculesController::class, 'storeAnnee'])->name('annees.store');
            Route::delete('/references/annees/{id}',     [VehiculesController::class, 'destroyAnnee'])->name('annees.destroy');

            // CRUD véhicules
            Route::get   ('/',                  [VehiculesController::class, 'index'])->name('index');
            Route::post  ('/',                  [VehiculesController::class, 'store'])->name('store');
            Route::get   ('/{immatriculation}', [VehiculesController::class, 'show'])->name('show');
            Route::put   ('/{immatriculation}', [VehiculesController::class, 'update'])->name('update');
            Route::post  ('/{immatriculation}', [VehiculesController::class, 'update'])->name('update.post');
            Route::delete('/{immatriculation}', [VehiculesController::class, 'destroy'])->name('destroy');
            Route::patch ('/{immatriculation}/statut', [VehiculesController::class, 'updateStatut'])->name('statut');

            // Documents
            Route::get   ('/{immatriculation}/documents',                   [VehiculesController::class, 'documents'])->name('documents.index');
            Route::post  ('/{immatriculation}/documents',                   [VehiculesController::class, 'storeDocument'])->name('documents.store');
            Route::put   ('/{immatriculation}/documents/{documentId}',      [VehiculesController::class, 'updateDocument'])->name('documents.update');
            Route::post  ('/{immatriculation}/documents/{documentId}',      [VehiculesController::class, 'updateDocument'])->name('documents.update.post');
            Route::delete('/{immatriculation}/documents/{documentId}',      [VehiculesController::class, 'destroyDocument'])->name('documents.destroy');
            Route::get   ('/{immatriculation}/documents/{documentId}/open', [VehiculesController::class, 'openDocument'])->name('documents.open');

            // Maintenances
            Route::get ('/{immatriculation}/maintenances', [VehiculesController::class, 'maintenances'])->name('maintenances.index');
            Route::post('/{immatriculation}/maintenances', [VehiculesController::class, 'storeMaintenance'])->name('maintenances.store');

            // Missions
            Route::get('/{immatriculation}/missions', [VehiculesController::class, 'missions'])->name('missions.index');

            // Stats
            Route::get('/{immatriculation}/stats', [VehiculesController::class, 'stats'])->name('stats');


            
        // Routes CARBURANT PAR VÉHICULE (inchangées)
        Route::get('/{immatriculation}/carburant/missions-disponibles',
            [CarnetCarburantController::class, 'missionsDisponibles'])
            ->name('carburant.missions-disponibles');
 
        Route::get('/{immatriculation}/carburant/export/pdf',
            [CarnetCarburantController::class, 'exportPdf'])
            ->name('carburant.export.pdf');
 
        Route::get('/{immatriculation}/carburant/export/excel',
            [CarnetCarburantController::class, 'exportExcel'])
            ->name('carburant.export.excel');
 
        Route::get('/{immatriculation}/carburant/{id}/detail',
            [CarnetCarburantController::class, 'showDetail'])
            ->name('carburant.detail');
 
        Route::get   ('/{immatriculation}/carburant',      [CarnetCarburantController::class, 'index'])  ->name('carburant.index');
        Route::post  ('/{immatriculation}/carburant',      [CarnetCarburantController::class, 'store'])  ->name('carburant.store');
        Route::get   ('/{immatriculation}/carburant/{id}', [CarnetCarburantController::class, 'show'])   ->name('carburant.show');
        Route::put   ('/{immatriculation}/carburant/{id}', [CarnetCarburantController::class, 'update']) ->name('carburant.update');
        Route::delete('/{immatriculation}/carburant/{id}', [CarnetCarburantController::class, 'destroy'])->name('carburant.destroy');
 });
    });
});