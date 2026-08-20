<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\VehiculesController;
use App\Http\Controllers\Admin\CarnetCarburantController;
use App\Http\Controllers\Admin\DocumentExpirationController;
use App\Http\Controllers\Admin\NotificationsController;
use App\Http\Controllers\Admin\UtilisateursController;
use App\Http\Controllers\Admin\ChauffeurController;
use App\Http\Controllers\Admin\InterventionsReferentielsController;
use App\Http\Controllers\Admin\InspectionsVehiculesController;
use App\Http\Controllers\Admin\ParametresSystemeController;
use App\Http\Controllers\Admin\HistoriqueAffectationController;
use App\Http\Controllers\Admin\HistoriqueVehiculeController;
use App\Http\Controllers\Admin\AccidentController;

/*
|--------------------------------------------------------------------------
| API Routes — Fleetify SGS
|--------------------------------------------------------------------------
*/

// ──────────────────────────────────────────────────────────────────────
// 🔓 ROUTES PUBLIQUES
// ──────────────────────────────────────────────────────────────────────
Route::post('/login',    [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// ──────────────────────────────────────────────────────────────────────
// 🔒 ROUTES PROTÉGÉES
// ──────────────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // ──────────────────────────────────────────────────────────────────
    // 👤 AUTH
    // ──────────────────────────────────────────────────────────────────
    Route::get ('/user',             [AuthController::class, 'user']);
    Route::post('/logout',           [AuthController::class, 'logout']);
    Route::post('/refresh',          [AuthController::class, 'refresh']);
    Route::post('/check-permission', [AuthController::class, 'checkPermission']);

    // ──────────────────────────────────────────────────────────────────
    // 👤 PROFIL UTILISATEUR (tous les rôles)
    // ──────────────────────────────────────────────────────────────────
    Route::prefix('profile')->name('profile.')->group(function () {
        Route::get ('/profile',                 [ProfileController::class, 'show'])->name('show');
        Route::put ('/profile',                 [ProfileController::class, 'update'])->name('update');
        Route::post('/change-password', [ProfileController::class, 'changePassword'])->name('change-password');
    });

    // ──────────────────────────────────────────────────────────────────
    // 🎨 THÈME — lecture accessible par TOUS les rôles connectés
    // ──────────────────────────────────────────────────────────────────
    Route::get('/parametres/theme', [ParametresSystemeController::class, 'getTheme']);

    // ──────────────────────────────────────────────────────────────────
    // 🎯 ADMIN
    // ──────────────────────────────────────────────────────────────────
    Route::prefix('admin')->name('admin.')->group(function () {

        /*
        |----------------------------------------------------------------------
        | 📊 DASHBOARD
        |----------------------------------------------------------------------
        */
        Route::get('/dashboard',                  [DashboardController::class, 'index'])->name('dashboard');
        Route::get('/dashboard/kpi-vehicules',    [DashboardController::class, 'getKpiVehiculesDetail'])->name('dashboard.kpi-vehicules');
        Route::get('/documents/check-expiration', [DocumentExpirationController::class, 'checkExpiration'])->name('documents.check-expiration');

        /*
        |----------------------------------------------------------------------
        | 🔔 NOTIFICATIONS
        |
        | RÈGLE CRITIQUE : les routes fixes (unread/count, read-all) doivent
        | être déclarées AVANT les routes paramétriques ({id}/read).
        | Sinon Laravel interprète "unread" comme un id → 404.
        |----------------------------------------------------------------------
        */
        Route::prefix('notifications')->name('notifications.')->group(function () {
            // ── Routes fixes AVANT {id} ──────────────────────────────────
            Route::get ('/unread/count',        [NotificationsController::class, 'getUnreadCount'])->name('unreadCount');
            Route::post('/read-all',            [NotificationsController::class, 'markAllAsRead'])->name('readAll');
            Route::post('/sync',                [NotificationsController::class, 'syncNotifications'])->name('sync');

            // ── Routes paramétriques ─────────────────────────────────────
            Route::get ('/',                    [NotificationsController::class, 'index'])->name('index');
            Route::post('/{id}/read',           [NotificationsController::class, 'markAsRead'])->name('read');
        });

        /*
        |----------------------------------------------------------------------
        | 👥 UTILISATEURS
        |----------------------------------------------------------------------
        */
        Route::prefix('utilisateurs')->name('utilisateurs.')->group(function () {
            Route::get   ('/',                    [UtilisateursController::class, 'index'])->name('index');
            Route::post  ('/generate-password',   [UtilisateursController::class, 'generatePassword'])->name('generate-password');
            Route::post  ('/',                    [UtilisateursController::class, 'store'])->name('store');
            Route::get   ('/{id}',                [UtilisateursController::class, 'show'])->name('show');
            Route::put   ('/{id}',                [UtilisateursController::class, 'update'])->name('update');
            Route::delete('/{id}',                [UtilisateursController::class, 'destroy'])->name('destroy');
            Route::patch ('/{id}/statut',         [UtilisateursController::class, 'toggleStatut'])->name('statut');
            Route::post  ('/{id}/reset-password', [UtilisateursController::class, 'resetPassword'])->name('reset-password');
        });

        /*
        |----------------------------------------------------------------------
        | 🔐 RÔLES
        |----------------------------------------------------------------------
        */
        Route::prefix('roles')->name('roles.')->group(function () {
            Route::get   ('/',            [UtilisateursController::class, 'indexRoles'])->name('index');
            Route::post  ('/',            [UtilisateursController::class, 'storeRole'])->name('store');
            Route::put   ('/{id}',        [UtilisateursController::class, 'updateRole'])->name('update');
            Route::delete('/{id}',        [UtilisateursController::class, 'destroyRole'])->name('destroy');
            Route::patch ('/{id}/statut', [UtilisateursController::class, 'toggleRoleStatut'])->name('statut');
        });

        /*
        |----------------------------------------------------------------------
        | 🏢 DIRECTIONS
        |----------------------------------------------------------------------
        */
        Route::prefix('directions')->name('directions.')->group(function () {
            Route::get   ('/',            [UtilisateursController::class, 'indexDirections'])->name('index');
            Route::post  ('/',            [UtilisateursController::class, 'storeDirection'])->name('store');
            Route::put   ('/{id}',        [UtilisateursController::class, 'updateDirection'])->name('update');
            Route::delete('/{id}',        [UtilisateursController::class, 'destroyDirection'])->name('destroy');
            Route::patch ('/{id}/statut', [UtilisateursController::class, 'toggleDirectionStatut'])->name('statut');
        });

        /*
        |----------------------------------------------------------------------
        | ⛽ CARBURANT GLOBAL
        |----------------------------------------------------------------------
        */
        Route::prefix('carburant')->name('carburant.global.')->group(function () {
            Route::get('/vehicules',                   [CarnetCarburantController::class, 'listeVehicules'])->name('vehicules');
            Route::get('/vehicules/{immatriculation}', [CarnetCarburantController::class, 'vehiculeDetail'])->name('vehicule.detail');
        });

        /*
        |----------------------------------------------------------------------
        | 🎨 PARAMÈTRES THÈME — admin seulement
        |----------------------------------------------------------------------
        */
        Route::prefix('parametres/theme')->name('parametres.theme.')->group(function () {
            Route::post  ('/',               [ParametresSystemeController::class, 'storeTheme'])->name('store');
            Route::put   ('/{id}/appliquer', [ParametresSystemeController::class, 'appliquerTheme'])->name('appliquer');
            Route::delete('/{id}',           [ParametresSystemeController::class, 'destroyTheme'])->name('destroy');
        });

        /*
        |----------------------------------------------------------------------
        | 🔧 INTERVENTIONS — RÉFÉRENTIELS
        |----------------------------------------------------------------------
        */
        Route::prefix('interventions/referentiels')->name('interventions.referentiels.')->group(function () {

            Route::get('/', [InterventionsReferentielsController::class, 'allReferentiels'])->name('all');

            Route::prefix('types-intervention')->name('types-intervention.')->group(function () {
                Route::get   ('/',            [InterventionsReferentielsController::class, 'indexTypesIntervention'])->name('index');
                Route::post  ('/',            [InterventionsReferentielsController::class, 'storeTypeIntervention'])->name('store');
                Route::put   ('/{id}',        [InterventionsReferentielsController::class, 'updateTypeIntervention'])->name('update');
                Route::delete('/{id}',        [InterventionsReferentielsController::class, 'destroyTypeIntervention'])->name('destroy');
                Route::patch ('/{id}/statut', [InterventionsReferentielsController::class, 'toggleStatutTypeIntervention'])->name('statut');
            });

            Route::prefix('types-inspection')->name('types-inspection.')->group(function () {
                Route::get   ('/',            [InterventionsReferentielsController::class, 'indexTypesInspection'])->name('index');
                Route::post  ('/',            [InterventionsReferentielsController::class, 'storeTypeInspection'])->name('store');
                Route::put   ('/{id}',        [InterventionsReferentielsController::class, 'updateTypeInspection'])->name('update');
                Route::delete('/{id}',        [InterventionsReferentielsController::class, 'destroyTypeInspection'])->name('destroy');
                Route::patch ('/{id}/statut', [InterventionsReferentielsController::class, 'toggleStatutTypeInspection'])->name('statut');
            });

            Route::prefix('types-intervenant')->name('types-intervenant.')->group(function () {
                Route::get   ('/',            [InterventionsReferentielsController::class, 'indexTypesIntervenant'])->name('index');
                Route::post  ('/',            [InterventionsReferentielsController::class, 'storeTypeIntervenant'])->name('store');
                Route::put   ('/{id}',        [InterventionsReferentielsController::class, 'updateTypeIntervenant'])->name('update');
                Route::delete('/{id}',        [InterventionsReferentielsController::class, 'destroyTypeIntervenant'])->name('destroy');
                Route::patch ('/{id}/statut', [InterventionsReferentielsController::class, 'toggleStatutTypeIntervenant'])->name('statut');
            });

            Route::prefix('checklists')->name('checklists.')->group(function () {
                Route::get   ('/',            [InterventionsReferentielsController::class, 'indexChecklists'])->name('index');
                Route::post  ('/',            [InterventionsReferentielsController::class, 'storeChecklist'])->name('store');
                Route::put   ('/{id}',        [InterventionsReferentielsController::class, 'updateChecklist'])->name('update');
                Route::delete('/{id}',        [InterventionsReferentielsController::class, 'destroyChecklist'])->name('destroy');
                Route::patch ('/{id}/statut', [InterventionsReferentielsController::class, 'toggleStatutChecklist'])->name('statut');
            });
        });

        /*
        |----------------------------------------------------------------------
        | 🚗 VÉHICULES
        |----------------------------------------------------------------------
        */
        Route::prefix('vehicules')->name('vehicules.')->group(function () {

            // Références globales
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

            // Références affectations
            Route::get   ('/references/affectations',      [VehiculesController::class, 'indexAffectations'])->name('affectations.index');
            Route::post  ('/references/affectations',      [VehiculesController::class, 'storeAffectation'])->name('affectations.store');
            Route::put   ('/references/affectations/{id}', [VehiculesController::class, 'updateAffectation'])->name('affectations.update');
            Route::delete('/references/affectations/{id}', [VehiculesController::class, 'destroyAffectation'])->name('affectations.destroy');

            // CRUD véhicules
            Route::get   ('/',                  [VehiculesController::class, 'index'])->name('index');
            Route::post  ('/',                  [VehiculesController::class, 'store'])->name('store');
            Route::get   ('/{immatriculation}', [VehiculesController::class, 'show'])->name('show');
            Route::put   ('/{immatriculation}', [VehiculesController::class, 'update'])->name('update');
            Route::post  ('/{immatriculation}', [VehiculesController::class, 'update'])->name('update.post');
            Route::delete('/{immatriculation}', [VehiculesController::class, 'destroy'])->name('destroy');
            Route::patch ('/{immatriculation}/statut', [VehiculesController::class, 'updateStatut'])->name('statut');

            // Documents véhicules
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

            // Carburant par véhicule
            Route::get('/{immatriculation}/carburant/missions-disponibles', [CarnetCarburantController::class, 'missionsDisponibles'])->name('carburant.missions-disponibles');
            Route::get('/{immatriculation}/carburant/export/pdf',           [CarnetCarburantController::class, 'exportPdf'])->name('carburant.export.pdf');
            Route::get('/{immatriculation}/carburant/export/excel',         [CarnetCarburantController::class, 'exportExcel'])->name('carburant.export.excel');
            Route::get('/{immatriculation}/carburant/{id}/detail',          [CarnetCarburantController::class, 'showDetail'])->name('carburant.detail');

            Route::get   ('/{immatriculation}/carburant',      [CarnetCarburantController::class, 'index'])->name('carburant.index');
            Route::post  ('/{immatriculation}/carburant',      [CarnetCarburantController::class, 'store'])->name('carburant.store');
            Route::get   ('/{immatriculation}/carburant/{id}', [CarnetCarburantController::class, 'show'])->name('carburant.show');
            Route::put   ('/{immatriculation}/carburant/{id}', [CarnetCarburantController::class, 'update'])->name('carburant.update');
            Route::delete('/{immatriculation}/carburant/{id}', [CarnetCarburantController::class, 'destroy'])->name('carburant.destroy');
        });

        /*
        |----------------------------------------------------------------------
        | 📜 HISTORIQUE VÉHICULES — CONFORMITÉ DES DOCUMENTS
        |
        | RÈGLE CRITIQUE : la route fixe /types-documents doit être déclarée
        | AVANT la route racine "/" pour rester cohérent avec le reste du
        | fichier (même si ici il n'y a pas de conflit direct, on garde
        | la convention du projet).
        |----------------------------------------------------------------------
        */
        Route::prefix('historique-vehicules')->name('historique-vehicules.')->group(function () {
            Route::get('/types-documents', [HistoriqueVehiculeController::class, 'typesDocuments'])->name('types-documents');
            Route::get('/',                [HistoriqueVehiculeController::class, 'index'])->name('index');
        });

        /*
        |----------------------------------------------------------------------
        | 🔄 HISTORIQUE DES AFFECTATIONS
        |
        | RÈGLE CRITIQUE : les routes à segments fixes (references, statistiques)
        | doivent être déclarées AVANT les routes paramétriques ({id}).
        | Laravel résout les routes dans l'ordre de déclaration. Si /{id} était
        | déclaré en premier, "references" serait traité comme un id=0 / 404.
        |----------------------------------------------------------------------
        */
        Route::prefix('historique-affectations')->name('historique-affectations.')->group(function () {

            // ── 1. Routes fixes AVANT {id} ──────────────────────────────────
            Route::get('/references',   [HistoriqueAffectationController::class, 'references'])->name('references');
            Route::get('/statistiques', [HistoriqueAffectationController::class, 'statistiques'])->name('statistiques');

            // ── 2. CRUD principal ───────────────────────────────────────────
            Route::get   ('/',      [HistoriqueAffectationController::class, 'index'])->name('index');
            Route::post  ('/',      [HistoriqueAffectationController::class, 'store'])->name('store');
            Route::get   ('/{id}',  [HistoriqueAffectationController::class, 'show'])->name('show');
            Route::put   ('/{id}',  [HistoriqueAffectationController::class, 'update'])->name('update');
            Route::delete('/{id}',  [HistoriqueAffectationController::class, 'destroy'])->name('destroy');

            // ── 3. Action clôture — toujours après le GET /{id} ────────────
            Route::post('/{id}/cloturer', [HistoriqueAffectationController::class, 'cloturer'])->name('cloturer');
        });

        /*
        |----------------------------------------------------------------------
        | 🚖 CHAUFFEURS
        |----------------------------------------------------------------------
        */
        Route::prefix('chauffeurs')->name('chauffeurs.')->group(function () {

            Route::get('/kpi/global', [ChauffeurController::class, 'kpiGlobal'])->name('kpi.global');

            Route::get   ('/documents/liste',   [ChauffeurController::class, 'indexDocuments'])->name('documents.liste');
            Route::post  ('/documents/{docId}', [ChauffeurController::class, 'updateDocument'])->name('documents.update');
            Route::delete('/documents/{docId}', [ChauffeurController::class, 'destroyDocument'])->name('documents.destroy');

            Route::get('/',     [ChauffeurController::class, 'index'])->name('index');
            Route::get('/{id}', [ChauffeurController::class, 'show'])->name('show');
            Route::put('/{id}', [ChauffeurController::class, 'update'])->name('update');

            Route::get ('/{id}/kpi', [ChauffeurController::class, 'kpi'])->name('kpi');

            Route::get ('/{id}/documents', [ChauffeurController::class, 'documents'])->name('documents.index');
            Route::post('/{id}/documents', [ChauffeurController::class, 'storeDocument'])->name('documents.store');
        });

        /*
        |----------------------------------------------------------------------
        | 🔍 INSPECTIONS VÉHICULES
        |----------------------------------------------------------------------
        */
        Route::prefix('inspections-vehicules')->name('inspections-vehicules.')->group(function () {

            Route::get('/referentiels', [InspectionsVehiculesController::class, 'referentiels'])->name('referentiels');

            Route::prefix('accessoires')->name('accessoires.')->group(function () {
                Route::get   ('/',            [InspectionsVehiculesController::class, 'indexAccessoires'])->name('index');
                Route::post  ('/',            [InspectionsVehiculesController::class, 'storeAccessoire'])->name('store');
                Route::put   ('/{id}',        [InspectionsVehiculesController::class, 'updateAccessoire'])->name('update');
                Route::patch ('/{id}/statut', [InspectionsVehiculesController::class, 'toggleStatutAccessoire'])->name('statut');
                Route::delete('/{id}',        [InspectionsVehiculesController::class, 'destroyAccessoire'])->name('destroy');
            });

            Route::get   ('/',     [InspectionsVehiculesController::class, 'index'])->name('index');
            Route::post  ('/',     [InspectionsVehiculesController::class, 'store'])->name('store');
            Route::get   ('/{id}', [InspectionsVehiculesController::class, 'show'])->name('show');
            Route::put   ('/{id}', [InspectionsVehiculesController::class, 'update'])->name('update');
            Route::delete('/{id}', [InspectionsVehiculesController::class, 'destroy'])->name('destroy');
        });

        /*
        |----------------------------------------------------------------------
        | 🚨 ACCIDENTS
        |
        | RÈGLE CRITIQUE : statistiques et form-data (routes fixes) déclarées
        | AVANT /{id} pour éviter que Laravel les interprète comme un id.
        |----------------------------------------------------------------------
        */
        Route::prefix('accidents')->name('accidents.')->group(function () {

            // ── Routes fixes AVANT {id} ──────────────────────────────────────
            Route::get('/statistiques', [AccidentController::class, 'statistiques'])->name('statistiques');
            Route::get('/form-data',    [AccidentController::class, 'formData'])->name('form-data');

            // ── CRUD principal ───────────────────────────────────────────────
            Route::get   ('/',      [AccidentController::class, 'index'])->name('index');
            Route::post  ('/',      [AccidentController::class, 'store'])->name('store');
            Route::get   ('/{id}',  [AccidentController::class, 'show'])->name('show');
            Route::put   ('/{id}',  [AccidentController::class, 'update'])->name('update');
            Route::delete('/{id}',  [AccidentController::class, 'destroy'])->name('destroy');

            // ── Changement de statut uniquement ─────────────────────────────
            Route::patch('/{id}/statut', [AccidentController::class, 'updateStatut'])->name('statut');
        });

    }); // fin prefix admin

}); // fin auth:sanctum