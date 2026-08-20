<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

// Models
use App\Models\TypeInspection;
use App\Models\TypeIntervenant;
use App\Models\Checklist;

/**
 * ============================================================
 * InterventionsReferentielsController
 * ============================================================
 *
 * Gère les 4 référentiels de la page "Interventions" du frontend :
 *   1. Types Intervention  → table `regles_maintenance`
 *   2. Types Inspection    → table `types_inspection`
 *   3. Types Intervenant   → table `types_intervenant`
 *   4. Checklists          → table `checklists`
 *
 * Chaque ressource expose les actions : index, store, update, destroy, toggleStatut
 */
class InterventionsReferentielsController extends Controller
{
    // ================================================================
    //  HELPERS PRIVÉS
    // ================================================================

    private function success($data, string $message = 'OK', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], $status);
    }

    private function error(string $message, int $status = 400, array $errors = []): JsonResponse
    {
        $payload = ['success' => false, 'message' => $message];
        if ($errors) {
            $payload['errors'] = $errors;
        }
        return response()->json($payload, $status);
    }

    private function paginate(Request $request, $query): array
    {
        $perPage = (int) $request->input('per_page', 50);
        $search  = $request->input('search', '');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('libelle', 'like', "%{$search}%")
                  ->orWhere('code',    'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $paginated = $query->paginate($perPage);

        return [
            'items'       => $paginated->items(),
            'total'       => $paginated->total(),
            'per_page'    => $paginated->perPage(),
            'current_page'=> $paginated->currentPage(),
            'last_page'   => $paginated->lastPage(),
        ];
    }

    // ================================================================
    //  1. TYPES INTERVENTION  (regles_maintenance)
    // ================================================================

    /**
     * GET /admin/interventions/referentiels/types-intervention
     */
    public function indexTypesIntervention(Request $request): JsonResponse
    {
        $query = DB::table('regles_maintenance')
            ->where('est_supprime', false)
            ->select([
                'id',
                'type_maintenance   as code',
                'type_maintenance   as libelle',        // même valeur — pas de colonne libelle en DB
                'description',
                'valeur_km          as frequence_km',
                'valeur_mois        as frequence_mois',
                'type_declencheur',
                'duree_estimee_heures',
                'cout_estime',
                'est_actif',
                'est_supprime',
                'date_creation',
                'date_modification',
            ])
            ->orderBy('id');

        // filtre recherche manuel (pas d'Eloquent ici, DB::table)
        $search = $request->input('search', '');
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('type_maintenance', 'like', "%{$search}%")
                  ->orWhere('description',    'like', "%{$search}%");
            });
        }

        $perPage   = (int) $request->input('per_page', 50);
        $paginated = $query->paginate($perPage);

        // Stats
        $all = DB::table('regles_maintenance')->where('est_supprime', false);
        $stats = [
            'total'    => (clone $all)->count(),
            'actifs'   => (clone $all)->where('est_actif', true)->count(),
            'inactifs' => (clone $all)->where('est_actif', false)->count(),
        ];

        return $this->success([
            'items'        => $paginated->items(),
            'total'        => $paginated->total(),
            'per_page'     => $paginated->perPage(),
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
            'stats'        => $stats,
        ]);
    }

    /**
     * POST /admin/interventions/referentiels/types-intervention
     */
    public function storeTypeIntervention(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'libelle'              => 'required|string|max:150',
            'code'                 => 'required|string|max:150',
            'description'          => 'nullable|string',
            'frequence_km'         => 'nullable|integer|min:0',
            'frequence_mois'       => 'nullable|integer|min:0',
            'type_declencheur'     => ['nullable', Rule::in(['km', 'date', 'mixte'])],
            'duree_estimee_heures' => 'nullable|integer|min:0',
            'cout_estime'          => 'nullable|numeric|min:0',
            'est_actif'            => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('Données invalides', 422, $validator->errors()->toArray());
        }

        // Unicité du type_maintenance (code)
        $exists = DB::table('regles_maintenance')
            ->where('type_maintenance', $request->code)
            ->where('est_supprime', false)
            ->exists();

        if ($exists) {
            return $this->error('Ce code est déjà utilisé.', 422, [
                'code' => ['Ce code est déjà utilisé.'],
            ]);
        }

        $id = DB::table('regles_maintenance')->insertGetId([
            'type_maintenance'     => $request->code,
            'description'          => $request->description,
            'type_declencheur'     => $request->type_declencheur ?? 'km',
            'valeur_km'            => $request->frequence_km,
            'valeur_mois'          => $request->frequence_mois,
            'duree_estimee_heures' => $request->duree_estimee_heures,
            'cout_estime'          => $request->cout_estime,
            'est_actif'            => $request->boolean('est_actif', true),
            'est_supprime'         => false,
            'date_creation'        => now(),
            'date_modification'    => now(),
        ]);

        $item = DB::table('regles_maintenance')->find($id);

        return $this->success($this->formatTypeIntervention($item), 'Type d\'intervention créé.', 201);
    }

    /**
     * PUT /admin/interventions/referentiels/types-intervention/{id}
     */
    public function updateTypeIntervention(Request $request, int $id): JsonResponse
    {
        $item = DB::table('regles_maintenance')
            ->where('id', $id)
            ->where('est_supprime', false)
            ->first();

        if (! $item) {
            return $this->error('Type d\'intervention introuvable.', 404);
        }

        $validator = Validator::make($request->all(), [
            'libelle'              => 'required|string|max:150',
            'code'                 => 'required|string|max:150',
            'description'          => 'nullable|string',
            'frequence_km'         => 'nullable|integer|min:0',
            'frequence_mois'       => 'nullable|integer|min:0',
            'type_declencheur'     => ['nullable', Rule::in(['km', 'date', 'mixte'])],
            'duree_estimee_heures' => 'nullable|integer|min:0',
            'cout_estime'          => 'nullable|numeric|min:0',
            'est_actif'            => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('Données invalides', 422, $validator->errors()->toArray());
        }

        // Unicité du code (hors soi-même)
        $exists = DB::table('regles_maintenance')
            ->where('type_maintenance', $request->code)
            ->where('id', '!=', $id)
            ->where('est_supprime', false)
            ->exists();

        if ($exists) {
            return $this->error('Ce code est déjà utilisé.', 422, [
                'code' => ['Ce code est déjà utilisé.'],
            ]);
        }

        DB::table('regles_maintenance')->where('id', $id)->update([
            'type_maintenance'     => $request->code,
            'description'          => $request->description,
            'type_declencheur'     => $request->type_declencheur ?? $item->type_declencheur,
            'valeur_km'            => $request->frequence_km,
            'valeur_mois'          => $request->frequence_mois,
            'duree_estimee_heures' => $request->duree_estimee_heures,
            'cout_estime'          => $request->cout_estime,
            'est_actif'            => $request->boolean('est_actif', (bool) $item->est_actif),
            'date_modification'    => now(),
        ]);

        $updated = DB::table('regles_maintenance')->find($id);

        return $this->success($this->formatTypeIntervention($updated), 'Type d\'intervention mis à jour.');
    }

    /**
     * DELETE /admin/interventions/referentiels/types-intervention/{id}
     */
    public function destroyTypeIntervention(int $id): JsonResponse
    {
        $item = DB::table('regles_maintenance')
            ->where('id', $id)
            ->where('est_supprime', false)
            ->first();

        if (! $item) {
            return $this->error('Type d\'intervention introuvable.', 404);
        }

        // Soft delete
        DB::table('regles_maintenance')->where('id', $id)->update([
            'est_supprime'      => true,
            'est_actif'         => false,
            'date_suppression'  => now(),
            'date_modification' => now(),
        ]);

        return $this->success(null, 'Type d\'intervention supprimé.');
    }

    /**
     * PATCH /admin/interventions/referentiels/types-intervention/{id}/statut
     */
    public function toggleStatutTypeIntervention(int $id): JsonResponse
    {
        $item = DB::table('regles_maintenance')
            ->where('id', $id)
            ->where('est_supprime', false)
            ->first();

        if (! $item) {
            return $this->error('Type d\'intervention introuvable.', 404);
        }

        DB::table('regles_maintenance')->where('id', $id)->update([
            'est_actif'         => ! $item->est_actif,
            'date_modification' => now(),
        ]);

        $updated = DB::table('regles_maintenance')->find($id);

        return $this->success($this->formatTypeIntervention($updated), 'Statut mis à jour.');
    }

    /** Formate une ligne regles_maintenance pour le frontend */
    private function formatTypeIntervention(object $row): array
    {
        return [
            'id'                   => $row->id,
            'code'                 => $row->type_maintenance,
            'libelle'              => $row->type_maintenance,
            'description'          => $row->description,
            'frequence_km'         => $row->valeur_km,
            'frequence_mois'       => $row->valeur_mois,
            'type_declencheur'     => $row->type_declencheur,
            'duree_estimee_heures' => $row->duree_estimee_heures,
            'cout_estime'          => $row->cout_estime,
            'est_actif'            => (bool) $row->est_actif,
            'est_supprime'         => (bool) $row->est_supprime,
            'date_creation'        => $row->date_creation,
            'date_modification'    => $row->date_modification,
        ];
    }

    // ================================================================
    //  2. TYPES INSPECTION
    // ================================================================

    /**
     * GET /admin/interventions/referentiels/types-inspection
     */
    public function indexTypesInspection(Request $request): JsonResponse
    {
        $query = TypeInspection::where('est_supprime', false)
            ->orderBy('ordre_affichage')
            ->orderBy('id');

        $search = $request->input('search', '');
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('libelle', 'like', "%{$search}%")
                  ->orWhere('code',    'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $perPage   = (int) $request->input('per_page', 50);
        $paginated = $query->paginate($perPage);

        $all = TypeInspection::where('est_supprime', false);
        $stats = [
            'total'        => (clone $all)->count(),
            'actifs'       => (clone $all)->where('est_actif', true)->count(),
            'inactifs'     => (clone $all)->where('est_actif', false)->count(),
            'obligatoires' => (clone $all)->where('est_obligatoire', true)->count(),
        ];

        return $this->success([
            'items'        => $paginated->items(),
            'total'        => $paginated->total(),
            'per_page'     => $paginated->perPage(),
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
            'stats'        => $stats,
        ]);
    }

    /**
     * POST /admin/interventions/referentiels/types-inspection
     */
    public function storeTypeInspection(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'libelle'          => 'required|string|max:150',
            'code'             => 'required|string|max:50|unique:types_inspection,code',
            'description'      => 'nullable|string',
            'frequence_jours'  => 'nullable|integer|min:0',
            'est_obligatoire'  => 'boolean',
            'ordre_affichage'  => 'nullable|integer|min:0',
            'est_actif'        => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('Données invalides', 422, $validator->errors()->toArray());
        }

        $item = TypeInspection::create([
            'code'            => $request->code,
            'libelle'         => $request->libelle,
            'description'     => $request->description,
            'frequence_jours' => $request->frequence_jours,
            'est_obligatoire' => $request->boolean('est_obligatoire', false),
            'ordre_affichage' => $request->input('ordre_affichage', 0),
            'est_actif'       => $request->boolean('est_actif', true),
            'est_supprime'    => false,
        ]);

        return $this->success($item, 'Type d\'inspection créé.', 201);
    }

    /**
     * PUT /admin/interventions/referentiels/types-inspection/{id}
     */
    public function updateTypeInspection(Request $request, int $id): JsonResponse
    {
        $item = TypeInspection::where('id', $id)->where('est_supprime', false)->first();

        if (! $item) {
            return $this->error('Type d\'inspection introuvable.', 404);
        }

        $validator = Validator::make($request->all(), [
            'libelle'         => 'required|string|max:150',
            'code'            => ['required', 'string', 'max:50', Rule::unique('types_inspection', 'code')->ignore($id)],
            'description'     => 'nullable|string',
            'frequence_jours' => 'nullable|integer|min:0',
            'est_obligatoire' => 'boolean',
            'ordre_affichage' => 'nullable|integer|min:0',
            'est_actif'       => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('Données invalides', 422, $validator->errors()->toArray());
        }

        $item->update([
            'code'            => $request->code,
            'libelle'         => $request->libelle,
            'description'     => $request->description,
            'frequence_jours' => $request->frequence_jours,
            'est_obligatoire' => $request->boolean('est_obligatoire', $item->est_obligatoire),
            'ordre_affichage' => $request->input('ordre_affichage', $item->ordre_affichage),
            'est_actif'       => $request->boolean('est_actif', $item->est_actif),
        ]);

        return $this->success($item->fresh(), 'Type d\'inspection mis à jour.');
    }

    /**
     * DELETE /admin/interventions/referentiels/types-inspection/{id}
     */
    public function destroyTypeInspection(int $id): JsonResponse
    {
        $item = TypeInspection::where('id', $id)->where('est_supprime', false)->first();

        if (! $item) {
            return $this->error('Type d\'inspection introuvable.', 404);
        }

        // Vérifier si des checklists y sont liées (soft delete seulement)
        $linkedChecklists = Checklist::where('type_inspection_id', $id)
            ->where('est_supprime', false)
            ->count();

        if ($linkedChecklists > 0) {
            return $this->error(
                "Impossible de supprimer : {$linkedChecklists} checklist(s) sont liées à ce type.",
                409
            );
        }

        $item->update([
            'est_supprime'    => true,
            'est_actif'       => false,
            'date_suppression'=> now(),
        ]);

        return $this->success(null, 'Type d\'inspection supprimé.');
    }

    /**
     * PATCH /admin/interventions/referentiels/types-inspection/{id}/statut
     */
    public function toggleStatutTypeInspection(int $id): JsonResponse
    {
        $item = TypeInspection::where('id', $id)->where('est_supprime', false)->first();

        if (! $item) {
            return $this->error('Type d\'inspection introuvable.', 404);
        }

        $item->update(['est_actif' => ! $item->est_actif]);

        return $this->success($item->fresh(), 'Statut mis à jour.');
    }

    // ================================================================
    //  3. TYPES INTERVENANT
    // ================================================================

    /**
     * GET /admin/interventions/referentiels/types-intervenant
     */
    public function indexTypesIntervenant(Request $request): JsonResponse
    {
        $query = TypeIntervenant::where('est_supprime', false)
            ->orderBy('ordre_affichage')
            ->orderBy('id');

        $search = $request->input('search', '');
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('libelle', 'like', "%{$search}%")
                  ->orWhere('code',    'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('competences_requises', 'like', "%{$search}%");
            });
        }

        $perPage   = (int) $request->input('per_page', 50);
        $paginated = $query->paginate($perPage);

        $all = TypeIntervenant::where('est_supprime', false);
        $stats = [
            'total'    => (clone $all)->count(),
            'actifs'   => (clone $all)->where('est_actif', true)->count(),
            'inactifs' => (clone $all)->where('est_actif', false)->count(),
        ];

        return $this->success([
            'items'        => $paginated->items(),
            'total'        => $paginated->total(),
            'per_page'     => $paginated->perPage(),
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
            'stats'        => $stats,
        ]);
    }

    /**
     * POST /admin/interventions/referentiels/types-intervenant
     */
    public function storeTypeIntervenant(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'libelle'              => 'required|string|max:150',
            'code'                 => 'required|string|max:50|unique:types_intervenant,code',
            'description'          => 'nullable|string',
            'competences_requises' => 'nullable|string',
            'ordre_affichage'      => 'nullable|integer|min:0',
            'est_actif'            => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('Données invalides', 422, $validator->errors()->toArray());
        }

        $item = TypeIntervenant::create([
            'code'                 => $request->code,
            'libelle'              => $request->libelle,
            'description'          => $request->description,
            'competences_requises' => $request->competences_requises,
            'ordre_affichage'      => $request->input('ordre_affichage', 0),
            'est_actif'            => $request->boolean('est_actif', true),
            'est_supprime'         => false,
        ]);

        return $this->success($item, 'Type d\'intervenant créé.', 201);
    }

    /**
     * PUT /admin/interventions/referentiels/types-intervenant/{id}
     */
    public function updateTypeIntervenant(Request $request, int $id): JsonResponse
    {
        $item = TypeIntervenant::where('id', $id)->where('est_supprime', false)->first();

        if (! $item) {
            return $this->error('Type d\'intervenant introuvable.', 404);
        }

        $validator = Validator::make($request->all(), [
            'libelle'              => 'required|string|max:150',
            'code'                 => ['required', 'string', 'max:50', Rule::unique('types_intervenant', 'code')->ignore($id)],
            'description'          => 'nullable|string',
            'competences_requises' => 'nullable|string',
            'ordre_affichage'      => 'nullable|integer|min:0',
            'est_actif'            => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('Données invalides', 422, $validator->errors()->toArray());
        }

        $item->update([
            'code'                 => $request->code,
            'libelle'              => $request->libelle,
            'description'          => $request->description,
            'competences_requises' => $request->competences_requises,
            'ordre_affichage'      => $request->input('ordre_affichage', $item->ordre_affichage),
            'est_actif'            => $request->boolean('est_actif', $item->est_actif),
        ]);

        return $this->success($item->fresh(), 'Type d\'intervenant mis à jour.');
    }

    /**
     * DELETE /admin/interventions/referentiels/types-intervenant/{id}
     */
    public function destroyTypeIntervenant(int $id): JsonResponse
    {
        $item = TypeIntervenant::where('id', $id)->where('est_supprime', false)->first();

        if (! $item) {
            return $this->error('Type d\'intervenant introuvable.', 404);
        }

        // Vérifier si des intervenants y sont liés
        $linked = DB::table('intervenants')
            ->where('type_intervenant_id', $id)
            ->where('est_supprime', false)
            ->count();

        if ($linked > 0) {
            return $this->error(
                "Impossible de supprimer : {$linked} intervenant(s) sont liés à ce type.",
                409
            );
        }

        $item->update([
            'est_supprime'    => true,
            'est_actif'       => false,
            'date_suppression'=> now(),
        ]);

        return $this->success(null, 'Type d\'intervenant supprimé.');
    }

    /**
     * PATCH /admin/interventions/referentiels/types-intervenant/{id}/statut
     */
    public function toggleStatutTypeIntervenant(int $id): JsonResponse
    {
        $item = TypeIntervenant::where('id', $id)->where('est_supprime', false)->first();

        if (! $item) {
            return $this->error('Type d\'intervenant introuvable.', 404);
        }

        $item->update(['est_actif' => ! $item->est_actif]);

        return $this->success($item->fresh(), 'Statut mis à jour.');
    }

    // ================================================================
    //  4. CHECKLISTS
    // ================================================================

    /**
     * GET /admin/interventions/referentiels/checklists
     */
    public function indexChecklists(Request $request): JsonResponse
    {
        $query = Checklist::where('est_supprime', false)
            ->with('typeInspection:id,libelle,code')
            ->orderBy('ordre_affichage')
            ->orderBy('id');

        $search = $request->input('search', '');
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('libelle', 'like', "%{$search}%")
                  ->orWhere('code',    'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('categorie', 'like', "%{$search}%");
            });
        }

        // Filtre par catégorie
        if ($request->filled('categorie')) {
            $query->where('categorie', $request->categorie);
        }

        // Filtre par type_inspection_id
        if ($request->filled('type_inspection_id')) {
            $query->where('type_inspection_id', $request->type_inspection_id);
        }

        $perPage   = (int) $request->input('per_page', 50);
        $paginated = $query->paginate($perPage);

        $all = Checklist::where('est_supprime', false);
        $stats = [
            'total'      => (clone $all)->count(),
            'actifs'     => (clone $all)->where('est_actif', true)->count(),
            'inactifs'   => (clone $all)->where('est_actif', false)->count(),
            'categories' => (clone $all)->distinct()->count('categorie'),
        ];

        return $this->success([
            'items'        => $paginated->items(),
            'total'        => $paginated->total(),
            'per_page'     => $paginated->perPage(),
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
            'stats'        => $stats,
        ]);
    }

    /**
     * POST /admin/interventions/referentiels/checklists
     */
    public function storeChecklist(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'libelle'             => 'required|string|max:150',
            'code'                => 'required|string|max:50|unique:checklists,code',
            'description'         => 'nullable|string',
            'type_inspection_id'  => 'nullable|exists:types_inspection,id',
            'categorie'           => ['nullable', 'string', Rule::in([
                'accessoires', 'niveaux_fluides', 'pneumatiques',
                'carrosserie', 'freinage', 'direction',
                'electricite', 'equipements_securite',
            ])],
            'elements_a_verifier' => 'nullable|array',
            'ordre_affichage'     => 'nullable|integer|min:0',
            'est_actif'           => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('Données invalides', 422, $validator->errors()->toArray());
        }

        $item = Checklist::create([
            'code'                => $request->code,
            'libelle'             => $request->libelle,
            'description'         => $request->description,
            'type_inspection_id'  => $request->type_inspection_id,
            'categorie'           => $request->categorie,
            'elements_a_verifier' => $request->input('elements_a_verifier', []),
            'ordre_affichage'     => $request->input('ordre_affichage', 0),
            'est_actif'           => $request->boolean('est_actif', true),
            'est_supprime'        => false,
        ]);

        return $this->success(
            $item->load('typeInspection:id,libelle,code'),
            'Checklist créée.',
            201
        );
    }

    /**
     * PUT /admin/interventions/referentiels/checklists/{id}
     */
    public function updateChecklist(Request $request, int $id): JsonResponse
    {
        $item = Checklist::where('id', $id)->where('est_supprime', false)->first();

        if (! $item) {
            return $this->error('Checklist introuvable.', 404);
        }

        $validator = Validator::make($request->all(), [
            'libelle'             => 'required|string|max:150',
            'code'                => ['required', 'string', 'max:50', Rule::unique('checklists', 'code')->ignore($id)],
            'description'         => 'nullable|string',
            'type_inspection_id'  => 'nullable|exists:types_inspection,id',
            'categorie'           => ['nullable', 'string', Rule::in([
                'accessoires', 'niveaux_fluides', 'pneumatiques',
                'carrosserie', 'freinage', 'direction',
                'electricite', 'equipements_securite',
            ])],
            'elements_a_verifier' => 'nullable|array',
            'ordre_affichage'     => 'nullable|integer|min:0',
            'est_actif'           => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('Données invalides', 422, $validator->errors()->toArray());
        }

        $item->update([
            'code'                => $request->code,
            'libelle'             => $request->libelle,
            'description'         => $request->description,
            'type_inspection_id'  => $request->type_inspection_id,
            'categorie'           => $request->categorie,
            'elements_a_verifier' => $request->input('elements_a_verifier', $item->elements_a_verifier),
            'ordre_affichage'     => $request->input('ordre_affichage', $item->ordre_affichage),
            'est_actif'           => $request->boolean('est_actif', $item->est_actif),
        ]);

        return $this->success(
            $item->fresh()->load('typeInspection:id,libelle,code'),
            'Checklist mise à jour.'
        );
    }

    /**
     * DELETE /admin/interventions/referentiels/checklists/{id}
     */
    public function destroyChecklist(int $id): JsonResponse
    {
        $item = Checklist::where('id', $id)->where('est_supprime', false)->first();

        if (! $item) {
            return $this->error('Checklist introuvable.', 404);
        }

        $item->update([
            'est_supprime'    => true,
            'est_actif'       => false,
            'date_suppression'=> now(),
        ]);

        return $this->success(null, 'Checklist supprimée.');
    }

    /**
     * PATCH /admin/interventions/referentiels/checklists/{id}/statut
     */
    public function toggleStatutChecklist(int $id): JsonResponse
    {
        $item = Checklist::where('id', $id)->where('est_supprime', false)->first();

        if (! $item) {
            return $this->error('Checklist introuvable.', 404);
        }

        $item->update(['est_actif' => ! $item->est_actif]);

        return $this->success(
            $item->fresh()->load('typeInspection:id,libelle,code'),
            'Statut mis à jour.'
        );
    }

    // ================================================================
    //  ENDPOINT GLOBAL : toutes les données pour le frontend (init)
    // ================================================================

    /**
     * GET /admin/interventions/referentiels
     *
     * Retourne les 4 listes en un seul appel pour l'initialisation du frontend.
     * Utile pour peupler les selects (ex: type_inspection pour les checklists).
     */
    public function allReferentiels(): JsonResponse
    {
        $typesIntervention = DB::table('regles_maintenance')
            ->where('est_supprime', false)
            ->orderBy('id')
            ->get()
            ->map(fn ($r) => $this->formatTypeIntervention($r));

        $typesInspection = TypeInspection::where('est_supprime', false)
            ->orderBy('ordre_affichage')
            ->get();

        $typesIntervenant = TypeIntervenant::where('est_supprime', false)
            ->orderBy('ordre_affichage')
            ->get();

        $checklists = Checklist::where('est_supprime', false)
            ->with('typeInspection:id,libelle,code')
            ->orderBy('ordre_affichage')
            ->get();

        return $this->success([
            'types_intervention' => $typesIntervention,
            'types_inspection'   => $typesInspection,
            'types_intervenant'  => $typesIntervenant,
            'checklists'         => $checklists,
        ]);
    }
}