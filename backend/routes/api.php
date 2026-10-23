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
use App\Http\Controllers\Admin\HistoriqueConnexionController;
use App\Http\Controllers\Admin\AccidentController;
use App\Http\Controllers\Admin\ActivitesSystemesController;
use App\Http\Controllers\Admin\FournisseurOutilController;
use App\Http\Controllers\Admin\DemandeInterventionController;
use App\Http\Controllers\Admin\InterventionController; // interventions + caisse (ex-CaisseController)
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
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']); 
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
    //
    // ⚠️ CORRECTION : le préfixe 'profile' est déjà appliqué par le groupe.
    // Les routes internes doivent donc utiliser '/' (racine du préfixe) et
    // non '/profile', sinon l'URL générée devient /api/profile/profile
    // au lieu de /api/profile → 404.
    // ──────────────────────────────────────────────────────────────────
    Route::prefix('profile')->name('profile.')->group(function () {
        Route::get ('/',                [ProfileController::class, 'show'])->name('show');
        Route::put ('/',                [ProfileController::class, 'update'])->name('update');
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
        Route::middleware('role:admin,chef_parc,daal')->group(function () {
            Route::get('/dashboard',                  [DashboardController::class, 'index'])->name('dashboard');
            Route::get('/dashboard/kpi-vehicules',    [DashboardController::class, 'getKpiVehiculesDetail'])->name('dashboard.kpi-vehicules');
            Route::get('/documents/check-expiration', [DocumentExpirationController::class, 'checkExpiration'])->name('documents.check-expiration');
        });

        /*
        |----------------------------------------------------------------------
        | 📋 ACTIVITÉS SYSTÈME — JOURNAL D'AUDIT
        |
        | RÈGLE CRITIQUE : les routes fixes (stats, utilisateurs, export)
        | doivent être déclarées AVANT la route paramétrique ({id}).
        | Sinon Laravel interprète "stats" / "utilisateurs" / "export"
        | comme une valeur de {id} → erreur de cast / 404.
        |----------------------------------------------------------------------
        */
        Route::prefix('activites-systeme')->name('activites-systeme.')->middleware('role:admin')->group(function () {
            // ── Routes fixes AVANT {id} ──────────────────────────────────
            Route::get('/stats',        [ActivitesSystemesController::class, 'stats'])->name('stats');
            Route::get('/utilisateurs', [ActivitesSystemesController::class, 'utilisateurs'])->name('utilisateurs');
            Route::get('/export',       [ActivitesSystemesController::class, 'export'])->name('export');

            // ── CRUD (lecture seule) ─────────────────────────────────────
            Route::get('/',     [ActivitesSystemesController::class, 'index'])->name('index');
            Route::get('/{id}', [ActivitesSystemesController::class, 'show'])->name('show');
        });

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
        Route::prefix('utilisateurs')->name('utilisateurs.')->middleware('role:admin')->group(function () {
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
        Route::prefix('roles')->name('roles.')->middleware('role:admin')->group(function () {
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
        Route::prefix('directions')->name('directions.')->middleware('role:admin')->group(function () {
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
        Route::prefix('carburant')->name('carburant.global.')->middleware('role:admin,chef_parc')->group(function () {
            Route::get('/vehicules',                   [CarnetCarburantController::class, 'listeVehicules'])->name('vehicules');
            Route::get('/vehicules/{immatriculation}', [CarnetCarburantController::class, 'vehiculeDetail'])->name('vehicule.detail');
        });

        /*
        |----------------------------------------------------------------------
        | 🎨 PARAMÈTRES THÈME — admin seulement
        |----------------------------------------------------------------------
        */
        Route::prefix('parametres/theme')->name('parametres.theme.')->middleware('role:admin')->group(function () {
            Route::post  ('/',               [ParametresSystemeController::class, 'storeTheme'])->name('store');
            Route::put   ('/{id}/appliquer', [ParametresSystemeController::class, 'appliquerTheme'])->name('appliquer');
            Route::delete('/{id}',           [ParametresSystemeController::class, 'destroyTheme'])->name('destroy');
        });

        /*
        |----------------------------------------------------------------------
        | 🔧 INTERVENTIONS — RÉFÉRENTIELS
        |----------------------------------------------------------------------
        */
        Route::prefix('interventions/referentiels')->name('interventions.referentiels.')->middleware('role:admin,chef_parc,mecanicien')->group(function () {

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
        Route::prefix('vehicules')->name('vehicules.')->middleware('role:admin,chef_parc,daal')->group(function () {

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
        |----------------------------------------------------------------------
        */
        Route::prefix('historique-vehicules')->name('historique-vehicules.')->middleware('role:admin,chef_parc,daal')->group(function () {
            Route::get('/types-documents', [HistoriqueVehiculeController::class, 'typesDocuments'])->name('types-documents');
            Route::get('/',                [HistoriqueVehiculeController::class, 'index'])->name('index');
        });

        /*
        |----------------------------------------------------------------------
        | 🔄 HISTORIQUE DES AFFECTATIONS
        |----------------------------------------------------------------------
        */
        Route::prefix('historique-affectations')->name('historique-affectations.')->middleware('role:admin,chef_parc')->group(function () {

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
        | 🕓 HISTORIQUE DES CONNEXIONS
        |----------------------------------------------------------------------
        */
        Route::prefix('historique-connexions')->name('historique-connexions.')->middleware('role:admin')->group(function () {
            Route::get ('/',                    [HistoriqueConnexionController::class, 'index'])->name('index');
            Route::get ('/{id}',                [HistoriqueConnexionController::class, 'show'])->name('show');
            Route::post('/{id}/force-logout',   [HistoriqueConnexionController::class, 'forceLogout'])->name('force-logout');
        });

        /*
        |----------------------------------------------------------------------
        | 🚖 CHAUFFEURS
        |----------------------------------------------------------------------
        */
        Route::prefix('chauffeurs')->name('chauffeurs.')->middleware('role:admin,chef_parc')->group(function () {

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
        Route::prefix('inspections-vehicules')->name('inspections-vehicules.')->middleware('role:admin,chef_parc,mecanicien,chauffeur')->group(function () {

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
        |----------------------------------------------------------------------
        */
        Route::prefix('accidents')->name('accidents.')->middleware('role:admin,chef_parc,chef_tf')->group(function () {

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

        /*
        |----------------------------------------------------------------------
        | 📦 INVENTAIRE & OUTILS
        |----------------------------------------------------------------------
        */
        Route::prefix('inventaire')->name('inventaire.')->middleware('role:admin,chef_parc,mecanicien')->group(function () {
            Route::get   ('/fournisseurs',             [FournisseurOutilController::class, 'fournisseurs']);
            Route::post  ('/fournisseurs',             [FournisseurOutilController::class, 'fournisseurStore']);
            Route::put   ('/fournisseurs/{id}',        [FournisseurOutilController::class, 'fournisseurUpdate']);
            Route::patch ('/fournisseurs/{id}/toggle', [FournisseurOutilController::class, 'fournisseurToggle']);
            Route::delete('/fournisseurs/{id}',        [FournisseurOutilController::class, 'fournisseurDestroy']);

            Route::get   ('/outils',        [FournisseurOutilController::class, 'outils']);
            Route::post  ('/outils',        [FournisseurOutilController::class, 'outilStore']);
            Route::put   ('/outils/{id}',   [FournisseurOutilController::class, 'outilUpdate']);
            Route::delete('/outils/{id}',   [FournisseurOutilController::class, 'outilDestroy']);

            Route::get   ('/pieces',                 [FournisseurOutilController::class, 'pieces']);
            Route::post  ('/pieces',                 [FournisseurOutilController::class, 'pieceStore']);
            Route::put   ('/pieces/{id}',            [FournisseurOutilController::class, 'pieceUpdate']);
            Route::patch ('/pieces/{id}/toggle',     [FournisseurOutilController::class, 'pieceToggle']);
            Route::post  ('/pieces/{id}/entree',     [FournisseurOutilController::class, 'pieceEntree']);
            Route::get   ('/pieces/{id}/mouvements', [FournisseurOutilController::class, 'pieceMouvements']);
            Route::delete('/pieces/{id}',            [FournisseurOutilController::class, 'pieceDestroy']);

            Route::get   ('/problemes',                [FournisseurOutilController::class, 'problemes']);
            Route::post  ('/problemes',                [FournisseurOutilController::class, 'problemeStore']);
            Route::put   ('/problemes/{id}',           [FournisseurOutilController::class, 'problemeUpdate']);
            Route::patch ('/problemes/{id}/en-cours',  [FournisseurOutilController::class, 'problemePrendreEnCharge']);
            Route::patch ('/problemes/{id}/resoudre',  [FournisseurOutilController::class, 'problemeResoudre']);
            Route::delete('/problemes/{id}',           [FournisseurOutilController::class, 'problemeDestroy']);

            Route::get('/stock/envoyer-alertes', [FournisseurOutilController::class, 'envoyerAlertesStock']);
        });

        /*
        |----------------------------------------------------------------------
        | 📝 DEMANDES D'INTERVENTION
        |----------------------------------------------------------------------
        */
        Route::prefix('demandes-intervention')->name('demandes-intervention.')->middleware('role:admin,chef_parc,daal,mecanicien,chauffeur')->group(function () {
            // ⚠️ "references" AVANT "{id}"
            Route::get('references',       [DemandeInterventionController::class, 'references'])->name('references');

            Route::get('/',                [DemandeInterventionController::class, 'index'])->name('index');
            Route::post('/',               [DemandeInterventionController::class, 'store'])->name('store');
            Route::get('{id}',             [DemandeInterventionController::class, 'show'])->whereNumber('id')->name('show');
            Route::put('{id}',             [DemandeInterventionController::class, 'update'])->whereNumber('id')->name('update');
            Route::delete('{id}',          [DemandeInterventionController::class, 'destroy'])->whereNumber('id')->name('destroy');

            // Traitement (demandes EXTERNES — DAAL uniquement)
            Route::post('{id}/valider',    [DemandeInterventionController::class, 'valider'])->whereNumber('id')->name('valider');
            Route::post('{id}/rejeter',    [DemandeInterventionController::class, 'rejeter'])->whereNumber('id')->name('rejeter');

            // Reprise après échec d'email (demandes EXTERNES en attente)
            Route::post('{id}/renvoyer-notification', [DemandeInterventionController::class, 'renvoyerNotification'])->whereNumber('id')->name('renvoyer-notification');
        });

        /*
        |----------------------------------------------------------------------
        | 🔧 INTERVENTIONS (Réalisées / Saisie)
        |----------------------------------------------------------------------
        */
        Route::prefix('interventions')->name('interventions.')->middleware('role:admin,chef_parc,daal,mecanicien,chauffeur')->group(function () {
            // ⚠️ Routes fixes AVANT {id} / {immat}
            // Référentiels pour formulaires (intervenants, outils, pièces, véhicules, statuts véhicule, caisse)
            Route::get('references',                [InterventionController::class, 'references'])->name('references');
            // Totaux globaux (panneau « Coût global réparations »)
            Route::get('statistiques',              [InterventionController::class, 'statistiques'])->name('statistiques');
            // Demandes ouvertes pour un véhicule donné (en_cours / en_attente)
            Route::get('{immat}/demandes-ouvertes', [InterventionController::class, 'demandesOuvertes'])->name('demandes-ouvertes');

            Route::get('/',                         [InterventionController::class, 'index'])->name('index');
            Route::post('/',                        [InterventionController::class, 'store'])->name('store'); // multipart/form-data (facture)
            Route::get('{id}',                      [InterventionController::class, 'show'])->whereNumber('id')->name('show');
            Route::put('{id}',                      [InterventionController::class, 'update'])->whereNumber('id')->name('update');
            // Modification AVEC upload de facture : POST + champ _method=PUT (multipart)
            Route::post('{id}',                     [InterventionController::class, 'update'])->whereNumber('id')->name('update.post');
            Route::delete('{id}',                   [InterventionController::class, 'destroy'])->whereNumber('id')->name('destroy');
            Route::patch('{id}/statut',             [InterventionController::class, 'updateStatut'])->whereNumber('id')->name('statut');
        });

        /*
        |----------------------------------------------------------------------
        | 💵 CAISSE (ex « Petite caisse »)
        |
        | Logique portée par InterventionController (méthodes caisse*).
        | Les dépenses sont enregistrées via l'ajout d'une intervention ;
        | la route `sortie` est conservée côté API mais n'est plus utilisée par le front
        | (l'onglet « Nouvelle dépense » est supprimé).
        |----------------------------------------------------------------------
        */
        Route::prefix('caisse')->name('caisse.')->middleware('role:admin,chef_parc,daal,mecanicien')->group(function () {
            Route::get('solde',                                   [InterventionController::class, 'caisseSolde'])->name('solde');
            Route::get('mouvements',                              [InterventionController::class, 'caisseMouvements'])->name('mouvements');
            Route::post('approvisionnement',                      [InterventionController::class, 'caisseApprovisionnement'])->name('approvisionnement');
            Route::post('sortie',                                 [InterventionController::class, 'caisseSortie'])->name('sortie');
            Route::post('mouvements/{id}/annuler',                [InterventionController::class, 'caisseAnnuler'])->whereNumber('id')->name('annuler');
            Route::get('periodes',                                [InterventionController::class, 'caissePeriodes'])->name('periodes');
            Route::post('periodes/{id}/cloturer',                 [InterventionController::class, 'caisseCloturerPeriode'])->whereNumber('id')->name('cloturer');
            Route::get('export',                                  [InterventionController::class, 'caisseExport'])->name('export');
        });

    }); // fin prefix admin

}); // fin auth:sanctum