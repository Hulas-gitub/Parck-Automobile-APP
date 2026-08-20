<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

/**
 * HistoriqueAffectationController
 *
 * CRUD complet de la table `historique_affectations`.
 * Vérifié contre le dump SQL fleetify_db :
 *
 *  - historique_affectations : id, vehicule_immatriculation,
 *      direction_origine_id (int UNSIGNED NOT NULL),
 *      affectation_origine_id (bigint UNSIGNED NULL),
 *      direction_origine_nom (varchar 150 NOT NULL),
 *      affectation_origine_nom (varchar 150 NULL),
 *      direction_emprunt_id (int UNSIGNED NOT NULL),
 *      affectation_emprunt_id (bigint UNSIGNED NULL),
 *      direction_emprunt_nom (varchar 150 NOT NULL),
 *      affectation_emprunt_nom (varchar 150 NULL),
 *      date_debut (datetime NOT NULL),
 *      date_fin_prevue (datetime NULL),
 *      date_fin_reelle (datetime NULL),
 *      duree_emprunt_minutes (int UNSIGNED NULL),
 *      demande_par_user_id (bigint NULL),
 *      valide_par_user_id (bigint NULL),
 *      cloture_par_user_id (bigint NULL),
 *      statut (varchar 50 DEFAULT 'en_cours'),
 *      motif (varchar 255 NULL),
 *      notes (text NULL),
 *      km_depart (bigint UNSIGNED NULL),
 *      km_retour (bigint UNSIGNED NULL),
 *      est_supprime (tinyint DEFAULT 0),
 *      date_suppression (timestamp NULL),
 *      created_at (timestamp NULL),
 *      updated_at (timestamp NULL)
 *
 *  - directions : id (int UNSIGNED), nom, reference, est_supprime, affectation
 *  - affectations : id (bigint UNSIGNED), nom, code, est_actif, deleted_at
 *  - utilisateurs : id (bigint UNSIGNED), nom, email, est_actif, est_supprime
 *  - vehicules : immatriculation (varchar 30 PK), marque_id, modele_id,
 *                direction_id (int), affectation_id (bigint NULL),
 *                affectation (varchar — cache dénormalisé), kilometrage, photo
 *
 * Routes :
 *   GET    /admin/historique-affectations/references    → references
 *   GET    /admin/historique-affectations/statistiques  → statistiques
 *   GET    /admin/historique-affectations               → index
 *   POST   /admin/historique-affectations               → store
 *   GET    /admin/historique-affectations/{id}          → show
 *   PUT    /admin/historique-affectations/{id}          → update
 *   DELETE /admin/historique-affectations/{id}          → destroy
 *   POST   /admin/historique-affectations/{id}/cloturer → cloturer
 */
class HistoriqueAffectationController extends Controller
{
    // =========================================================================
    // HELPER — requête de base avec toutes les jointures
    // =========================================================================

    private function baseQuery()
    {
        return DB::table('historique_affectations as ha')
            // Véhicule
            ->leftJoin('vehicules as v',        'v.immatriculation', '=', 'ha.vehicule_immatriculation')
            ->leftJoin('marques as ma',          'ma.id',             '=', 'v.marque_id')
            ->leftJoin('modeles as mo',          'mo.id',             '=', 'v.modele_id')
            // Direction d'origine (directions.id est int UNSIGNED)
            ->leftJoin('directions as dor',      'dor.id',            '=', 'ha.direction_origine_id')
            // Direction d'emprunt
            ->leftJoin('directions as dem',      'dem.id',            '=', 'ha.direction_emprunt_id')
            // Affectation d'origine (affectations.id est bigint UNSIGNED)
            ->leftJoin('affectations as aor',    'aor.id',            '=', 'ha.affectation_origine_id')
            // Affectation d'emprunt
            ->leftJoin('affectations as aem',    'aem.id',            '=', 'ha.affectation_emprunt_id')
            // Acteurs (utilisateurs)
            ->leftJoin('utilisateurs as u_dem',  'u_dem.id',          '=', 'ha.demande_par_user_id')
            ->leftJoin('utilisateurs as u_val',  'u_val.id',          '=', 'ha.valide_par_user_id')
            ->leftJoin('utilisateurs as u_clo',  'u_clo.id',          '=', 'ha.cloture_par_user_id')
            ->where('ha.est_supprime', 0)
            ->select(
                // Emprunt
                'ha.id',
                'ha.vehicule_immatriculation',
                'ha.direction_origine_id',
                'ha.direction_origine_nom',
                'ha.affectation_origine_id',
                'ha.affectation_origine_nom',
                'ha.direction_emprunt_id',
                'ha.direction_emprunt_nom',
                'ha.affectation_emprunt_id',
                'ha.affectation_emprunt_nom',
                'ha.date_debut',
                'ha.date_fin_prevue',
                'ha.date_fin_reelle',
                'ha.duree_emprunt_minutes',
                'ha.demande_par_user_id',
                'ha.valide_par_user_id',
                'ha.cloture_par_user_id',
                'ha.statut',
                'ha.motif',
                'ha.notes',
                'ha.km_depart',
                'ha.km_retour',
                'ha.created_at',
                'ha.updated_at',
                // Véhicule
                'v.photo              as vehicule_photo',
                'v.couleur            as vehicule_couleur',
                'v.kilometrage        as vehicule_km_actuel',
                'ma.nom               as vehicule_marque',
                'mo.nom               as vehicule_modele',
                // Noms live depuis jointures (fallback si snapshot null)
                'dor.nom              as direction_origine_nom_live',
                'dem.nom              as direction_emprunt_nom_live',
                'aor.nom              as affectation_origine_nom_live',
                'aem.nom              as affectation_emprunt_nom_live',
                // Acteurs
                'u_dem.nom            as demande_par_nom',
                'u_val.nom            as valide_par_nom',
                'u_clo.nom            as cloture_par_nom'
            );
    }

    // ── Formateur ─────────────────────────────────────────────────────────────
    private function format(object $row): array
    {
        $duree = null;
        if (!empty($row->duree_emprunt_minutes) && $row->duree_emprunt_minutes > 0) {
            $h    = intdiv((int) $row->duree_emprunt_minutes, 60);
            $m    = (int) $row->duree_emprunt_minutes % 60;
            $duree = ($h > 0 ? "{$h}h " : '') . "{$m}min";
        }

        return [
            'id'                       => $row->id,
            'vehicule_immatriculation' => $row->vehicule_immatriculation,
            'vehicule_marque'          => $row->vehicule_marque          ?? null,
            'vehicule_modele'          => $row->vehicule_modele          ?? null,
            'vehicule_photo'           => $row->vehicule_photo           ?? null,
            'vehicule_couleur'         => $row->vehicule_couleur         ?? null,
            'vehicule_km_actuel'       => $row->vehicule_km_actuel       ?? null,
            // Origine — snapshot en priorité, jointure en fallback
            'direction_origine_id'     => $row->direction_origine_id,
            'direction_origine_nom'    => $row->direction_origine_nom    ?? $row->direction_origine_nom_live  ?? null,
            'affectation_origine_id'   => $row->affectation_origine_id  ?? null,
            'affectation_origine_nom'  => $row->affectation_origine_nom ?? $row->affectation_origine_nom_live ?? null,
            // Emprunt
            'direction_emprunt_id'     => $row->direction_emprunt_id,
            'direction_emprunt_nom'    => $row->direction_emprunt_nom    ?? $row->direction_emprunt_nom_live  ?? null,
            'affectation_emprunt_id'   => $row->affectation_emprunt_id  ?? null,
            'affectation_emprunt_nom'  => $row->affectation_emprunt_nom ?? $row->affectation_emprunt_nom_live ?? null,
            // Période
            'date_debut'               => $row->date_debut,
            'date_fin_prevue'          => $row->date_fin_prevue          ?? null,
            'date_fin_reelle'          => $row->date_fin_reelle          ?? null,
            'duree_emprunt_minutes'    => $row->duree_emprunt_minutes    ?? null,
            'duree_lisible'            => $duree,
            // Acteurs
            'demande_par_user_id'      => $row->demande_par_user_id      ?? null,
            'demande_par_nom'          => $row->demande_par_nom          ?? null,
            'valide_par_user_id'       => $row->valide_par_user_id       ?? null,
            'valide_par_nom'           => $row->valide_par_nom           ?? null,
            'cloture_par_user_id'      => $row->cloture_par_user_id      ?? null,
            'cloture_par_nom'          => $row->cloture_par_nom          ?? null,
            // Divers
            'statut'                   => $row->statut,
            'motif'                    => $row->motif                    ?? null,
            'notes'                    => $row->notes                    ?? null,
            'km_depart'                => $row->km_depart                ?? null,
            'km_retour'                => $row->km_retour                ?? null,
            'created_at'               => $row->created_at,
            'updated_at'               => $row->updated_at,
        ];
    }

    // =========================================================================
    // 1. LISTE (paginée + filtres)
    // =========================================================================
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = min(max((int) $request->get('per_page', 10), 1), 100);
            $query   = $this->baseQuery();

            if ($search = $request->get('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('ha.vehicule_immatriculation', 'LIKE', "%{$search}%")
                      ->orWhere('ha.direction_origine_nom',  'LIKE', "%{$search}%")
                      ->orWhere('ha.direction_emprunt_nom',  'LIKE', "%{$search}%")
                      ->orWhere('ha.motif',                  'LIKE', "%{$search}%")
                      ->orWhere('ma.nom',                    'LIKE', "%{$search}%")
                      ->orWhere('mo.nom',                    'LIKE', "%{$search}%");
                });
            }

            if ($statut = $request->get('statut')) {
                $query->where('ha.statut', $statut);
            }
            if ($vehicule = $request->get('vehicule')) {
                $query->where('ha.vehicule_immatriculation', $vehicule);
            }
            if ($dirOrigine = $request->get('direction_origine_id')) {
                $query->where('ha.direction_origine_id', (int) $dirOrigine);
            }
            if ($dirEmprunt = $request->get('direction_emprunt_id')) {
                $query->where('ha.direction_emprunt_id', (int) $dirEmprunt);
            }
            if ($dateFrom = $request->get('date_debut_from')) {
                $query->where('ha.date_debut', '>=', $dateFrom);
            }
            if ($dateTo = $request->get('date_debut_to')) {
                $query->where('ha.date_debut', '<=', $dateTo);
            }

            $total    = $query->count();
            $paginate = $query->orderBy('ha.created_at', 'desc')->paginate($perPage);
            $data     = collect($paginate->items())->map(fn($r) => $this->format($r))->values();

            return response()->json([
                'data'         => $data,
                'total'        => $total,
                'current_page' => $paginate->currentPage(),
                'last_page'    => $paginate->lastPage(),
                'per_page'     => $perPage,
            ]);

        } catch (\Exception $e) {
            Log::error('HistoriqueAffectation::index — ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Erreur serveur : ' . $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // 2. DÉTAIL
    // =========================================================================
    public function show(int $id): JsonResponse
    {
        try {
            $row = $this->baseQuery()->where('ha.id', $id)->first();
            if (!$row) {
                return response()->json(['message' => 'Enregistrement introuvable.'], 404);
            }
            return response()->json($this->format($row));

        } catch (\Exception $e) {
            Log::error('HistoriqueAffectation::show — ' . $e->getMessage());
            return response()->json(['message' => 'Erreur serveur : ' . $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // 3. CRÉER UN EMPRUNT
    // =========================================================================
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'vehicule_immatriculation' => 'required|string|max:30|exists:vehicules,immatriculation',
            'direction_emprunt_id'     => 'required|integer|exists:directions,id',
            'affectation_emprunt_id'   => 'nullable|integer|exists:affectations,id',
            'date_debut'               => 'required|date',
            'date_fin_prevue'          => 'nullable|date|after_or_equal:date_debut',
            'motif'                    => 'nullable|string|max:255',
            'notes'                    => 'nullable|string',
            'km_depart'                => 'nullable|integer|min:0',
            'demande_par_user_id'      => 'nullable|integer|exists:utilisateurs,id',
            'valide_par_user_id'       => 'nullable|integer|exists:utilisateurs,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            // ── Snapshot situation actuelle du véhicule ───────────────────────
            $vehicule = DB::table('vehicules as v')
                ->leftJoin('affectations as af', 'af.id', '=', 'v.affectation_id')
                ->leftJoin('directions as di',   'di.id', '=', 'v.direction_id')
                ->where('v.immatriculation', $request->vehicule_immatriculation)
                ->where('v.est_supprime', 0)
                ->select(
                    'v.direction_id',
                    'v.affectation_id',
                    'v.affectation            as affectation_cache',
                    'di.nom                   as direction_nom',
                    'af.nom                   as affectation_nom'
                )->first();

            if (!$vehicule) {
                return response()->json(['message' => 'Véhicule introuvable ou supprimé.'], 404);
            }

            // ── Vérifier absence d'emprunt en cours pour ce véhicule ─────────
            $enCours = DB::table('historique_affectations')
                ->where('vehicule_immatriculation', $request->vehicule_immatriculation)
                ->where('statut', 'en_cours')
                ->where('est_supprime', 0)
                ->count();

            if ($enCours > 0) {
                return response()->json([
                    'message' => 'Ce véhicule a déjà un emprunt en cours. Clôturez-le avant d\'en créer un nouveau.',
                ], 422);
            }

            // ── Résolution noms direction/affectation d'emprunt ───────────────
            $dirEmprunt = DB::table('directions')
                ->where('id', $request->direction_emprunt_id)
                ->where('est_supprime', 0)
                ->first();

            if (!$dirEmprunt) {
                return response()->json(['message' => 'Direction d\'emprunt introuvable.'], 422);
            }

            $affEmprunt = null;
            if ($request->filled('affectation_emprunt_id')) {
                $affEmprunt = DB::table('affectations')
                    ->where('id', $request->affectation_emprunt_id)
                    ->whereNull('deleted_at')
                    ->first();
            }

            // ── Insertion ─────────────────────────────────────────────────────
            $id = DB::table('historique_affectations')->insertGetId([
                'vehicule_immatriculation' => $request->vehicule_immatriculation,
                // Origine — snapshot depuis vehicules
                'direction_origine_id'     => $vehicule->direction_id,
                'direction_origine_nom'    => $vehicule->direction_nom     ?? 'N/A',
                'affectation_origine_id'   => $vehicule->affectation_id,
                'affectation_origine_nom'  => $vehicule->affectation_nom   ?? $vehicule->affectation_cache,
                // Emprunt
                'direction_emprunt_id'     => $request->direction_emprunt_id,
                'direction_emprunt_nom'    => $dirEmprunt->nom,
                'affectation_emprunt_id'   => $request->affectation_emprunt_id ?? null,
                'affectation_emprunt_nom'  => $affEmprunt?->nom,
                // Période
                'date_debut'               => $request->date_debut,
                'date_fin_prevue'          => $request->date_fin_prevue ?? null,
                // Acteurs
                'demande_par_user_id'      => $request->demande_par_user_id ?? null,
                'valide_par_user_id'       => $request->valide_par_user_id  ?? null,
                // Divers
                'statut'                   => 'en_cours',
                'motif'                    => $request->motif     ?? null,
                'notes'                    => $request->notes     ?? null,
                'km_depart'                => $request->km_depart ?? null,
                'est_supprime'             => 0,
                'created_at'               => now(),
                'updated_at'               => now(),
            ]);

            $row = $this->baseQuery()->where('ha.id', $id)->first();
            return response()->json($this->format($row), 201);

        } catch (\Exception $e) {
            Log::error('HistoriqueAffectation::store — ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Erreur serveur : ' . $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // 4. MODIFIER UN EMPRUNT
    // =========================================================================
    public function update(Request $request, int $id): JsonResponse
    {
        $row = DB::table('historique_affectations')
            ->where('id', $id)->where('est_supprime', 0)->first();

        if (!$row) {
            return response()->json(['message' => 'Enregistrement introuvable.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'direction_emprunt_id'   => 'nullable|integer|exists:directions,id',
            'affectation_emprunt_id' => 'nullable|integer|exists:affectations,id',
            'date_debut'             => 'nullable|date',
            'date_fin_prevue'        => 'nullable|date',
            'date_fin_reelle'        => 'nullable|date',
            'motif'                  => 'nullable|string|max:255',
            'notes'                  => 'nullable|string',
            'km_depart'              => 'nullable|integer|min:0',
            'km_retour'              => 'nullable|integer|min:0',
            'statut'                 => 'nullable|string|in:en_cours,termine,annule',
            'valide_par_user_id'     => 'nullable|integer|exists:utilisateurs,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $data = ['updated_at' => now()];

            if ($request->filled('direction_emprunt_id')) {
                $dir = DB::table('directions')->where('id', $request->direction_emprunt_id)->first();
                $data['direction_emprunt_id']  = $request->direction_emprunt_id;
                $data['direction_emprunt_nom'] = $dir?->nom ?? 'N/A';
            }

            if ($request->has('affectation_emprunt_id')) {
                $aff = $request->filled('affectation_emprunt_id')
                    ? DB::table('affectations')
                        ->where('id', $request->affectation_emprunt_id)
                        ->whereNull('deleted_at')
                        ->first()
                    : null;
                $data['affectation_emprunt_id']  = $request->affectation_emprunt_id ?? null;
                $data['affectation_emprunt_nom'] = $aff?->nom;
            }

            if ($request->has('date_debut'))         $data['date_debut']         = $request->date_debut        ?: null;
            if ($request->has('date_fin_prevue'))     $data['date_fin_prevue']    = $request->date_fin_prevue   ?: null;
            if ($request->has('date_fin_reelle'))     $data['date_fin_reelle']    = $request->date_fin_reelle   ?: null;
            if ($request->has('motif'))               $data['motif']              = $request->motif             ?: null;
            if ($request->has('notes'))               $data['notes']              = $request->notes             ?: null;
            if ($request->has('km_depart'))           $data['km_depart']          = $request->km_depart         ?: null;
            if ($request->has('km_retour'))           $data['km_retour']          = $request->km_retour         ?: null;
            if ($request->has('statut'))              $data['statut']             = $request->statut;
            if ($request->has('valide_par_user_id'))  $data['valide_par_user_id'] = $request->valide_par_user_id ?: null;

            DB::table('historique_affectations')->where('id', $id)->update($data);
            $updated = $this->baseQuery()->where('ha.id', $id)->first();
            return response()->json($this->format($updated));

        } catch (\Exception $e) {
            Log::error('HistoriqueAffectation::update — ' . $e->getMessage());
            return response()->json(['message' => 'Erreur serveur : ' . $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // 5. CLÔTURER UN EMPRUNT (retour du véhicule)
    // =========================================================================
    public function cloturer(Request $request, int $id): JsonResponse
    {
        $row = DB::table('historique_affectations')
            ->where('id', $id)
            ->where('statut', 'en_cours')
            ->where('est_supprime', 0)
            ->first();

        if (!$row) {
            return response()->json(['message' => 'Emprunt introuvable ou déjà clôturé.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'km_retour'           => 'nullable|integer|min:0',
            'notes'               => 'nullable|string',
            'cloture_par_user_id' => 'nullable|integer|exists:utilisateurs,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $finReelle = now();

            // ── Calcul durée en minutes (différence directe en secondes) ──────
            $debut      = new \DateTime($row->date_debut);
            $dureeMin   = (int) round(($finReelle->getTimestamp() - $debut->getTimestamp()) / 60);
            $dureeMin   = max($dureeMin, 0);

            // ── Fusion notes ──────────────────────────────────────────────────
            $notesFinales = $row->notes;
            if (!empty($request->notes)) {
                $notesFinales = $notesFinales
                    ? $notesFinales . "\n" . $request->notes
                    : $request->notes;
            }

            DB::table('historique_affectations')->where('id', $id)->update([
                'statut'                => 'termine',
                'date_fin_reelle'       => $finReelle,
                'duree_emprunt_minutes' => $dureeMin,
                'km_retour'             => $request->km_retour            ?? null,
                'cloture_par_user_id'   => $request->cloture_par_user_id  ?? null,
                'notes'                 => $notesFinales,
                'updated_at'            => now(),
            ]);

            $updated = $this->baseQuery()->where('ha.id', $id)->first();
            return response()->json($this->format($updated));

        } catch (\Exception $e) {
            Log::error('HistoriqueAffectation::cloturer — ' . $e->getMessage());
            return response()->json(['message' => 'Erreur serveur : ' . $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // 6. SUPPRIMER (soft delete)
    // =========================================================================
    public function destroy(int $id): JsonResponse
    {
        try {
            $rows = DB::table('historique_affectations')
                ->where('id', $id)
                ->where('est_supprime', 0)
                ->update([
                    'est_supprime'     => 1,
                    'date_suppression' => now(),
                    'updated_at'       => now(),
                ]);

            if (!$rows) {
                return response()->json(['message' => 'Enregistrement introuvable.'], 404);
            }

            return response()->json(['message' => 'Emprunt supprimé.']);

        } catch (\Exception $e) {
            Log::error('HistoriqueAffectation::destroy — ' . $e->getMessage());
            return response()->json(['message' => 'Erreur serveur : ' . $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // 7. DONNÉES DE RÉFÉRENCE pour les formulaires
    // =========================================================================
    public function references(): JsonResponse
    {
        try {
            // Véhicules actifs (avec marque + modèle)
            $vehicules = DB::table('vehicules as v')
                ->leftJoin('marques as ma', 'ma.id', '=', 'v.marque_id')
                ->leftJoin('modeles as mo', 'mo.id', '=', 'v.modele_id')
                ->where('v.est_supprime', 0)
                ->where('v.est_actif',    1)
                ->orderBy('v.immatriculation')
                ->select(
                    'v.immatriculation',
                    'v.direction_id',
                    'v.affectation_id',
                    'v.affectation',       // cache varchar dénormalisé
                    'v.kilometrage',
                    'v.photo',
                    'ma.nom as marque',
                    'mo.nom as modele'
                )->get();

            // Directions actives (est_supprime = 0)
            $directions = DB::table('directions')
                ->where('est_supprime', 0)
                ->orderBy('nom')
                ->select('id', 'nom', 'reference')
                ->get();

            // Affectations actives
            $affectations = DB::table('affectations')
                ->where('est_actif', 1)
                ->whereNull('deleted_at')
                ->orderBy('nom')
                ->select('id', 'nom', 'code')
                ->get();

            // Utilisateurs actifs (pour demande_par / valide_par / cloture_par)
            $utilisateurs = DB::table('utilisateurs')
                ->where('est_actif',    1)
                ->where('est_supprime', 0)
                ->orderBy('nom')
                ->select('id', 'nom', 'email')
                ->get();

            return response()->json([
                'vehicules'    => $vehicules,
                'directions'   => $directions,
                'affectations' => $affectations,
                'utilisateurs' => $utilisateurs,
            ]);

        } catch (\Exception $e) {
            Log::error('HistoriqueAffectation::references — ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Impossible de charger les références : ' . $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // 8. STATISTIQUES
    // =========================================================================
    public function statistiques(): JsonResponse
    {
        try {
            $base = DB::table('historique_affectations')->where('est_supprime', 0);

            $total    = (clone $base)->count();
            $enCours  = (clone $base)->where('statut', 'en_cours')->count();
            $termines = (clone $base)->where('statut', 'termine')->count();
            $annules  = (clone $base)->where('statut', 'annule')->count();

            $dureeMoy = (clone $base)
                ->where('statut', 'termine')
                ->whereNotNull('duree_emprunt_minutes')
                ->avg('duree_emprunt_minutes') ?? 0;

            // Top 10 directions d'emprunt
            $parDirection = DB::table('historique_affectations as ha')
                ->leftJoin('directions as d', 'd.id', '=', 'ha.direction_emprunt_id')
                ->where('ha.est_supprime', 0)
                ->groupBy('ha.direction_emprunt_id', 'ha.direction_emprunt_nom', 'd.nom')
                ->select(
                    DB::raw('COALESCE(ha.direction_emprunt_nom, d.nom, "Inconnue") as direction'),
                    DB::raw('COUNT(*) as total')
                )
                ->orderByDesc('total')
                ->limit(10)
                ->get();

            // Top 10 véhicules
            $parVehicule = DB::table('historique_affectations')
                ->where('est_supprime', 0)
                ->groupBy('vehicule_immatriculation')
                ->select('vehicule_immatriculation', DB::raw('COUNT(*) as total'))
                ->orderByDesc('total')
                ->limit(10)
                ->get();

            return response()->json([
                'total'                 => $total,
                'en_cours'              => $enCours,
                'termines'              => $termines,
                'annules'               => $annules,
                'duree_moyenne_minutes' => (int) round($dureeMoy),
                'par_direction'         => $parDirection,
                'par_vehicule'          => $parVehicule,
            ]);

        } catch (\Exception $e) {
            Log::error('HistoriqueAffectation::statistiques — ' . $e->getMessage());
            return response()->json(['message' => 'Erreur serveur : ' . $e->getMessage()], 500);
        }
    }
}