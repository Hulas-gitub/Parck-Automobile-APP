<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Accident;
use App\Models\Vehicule;
use App\Models\Utilisateur;
use App\Models\Mission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Carbon\Carbon;

class AccidentController extends Controller
{
    // =========================================================================
    // CONSTANTES
    // =========================================================================

    const STATUTS_VEHICULE = [
        'disponible'            => 'Disponible',
        'en_mission'            => 'En Mission',
        'en_maintenance'        => 'Maintenance',
        'immobilise'            => 'Immobilisé',
        'immobilisation courte' => 'Immobilisation courte',
        'immobilisation longue' => 'Immobilisation longue',
        'vendu'                 => 'Vendu',
        'retire'                => 'Retiré',
        'hors_service'          => 'Hors Service',
    ];

    const NIVEAUX_DEGATS = ['leger', 'modere', 'grave', 'critique'];

    const TYPES_RESPONSABILITE = [
        'responsable',
        'tiers_responsable',
        'responsabilite_partagee',
        'indetermine',
        'force_majeure',
    ];

    const STATUTS_ACCIDENT = [
        'declare',
        'en_cours',
        'en_reparation',
        'assurance',
        'cloture',
        'litige',
    ];

    // =========================================================================
    // INDEX — liste paginée avec filtres
    // =========================================================================

    public function index(Request $request): JsonResponse
    {
        $query = Accident::with([
                'chauffeur:id,nom,direction_id',
                'chauffeur.direction:id,nom',
                'vehicule:immatriculation,statut',
                'mission:id,reference_mission',
            ])
            ->where('est_supprime', false);

        // -- Période --
        if ($request->filled('jours')) {
            $query->where('date_accident', '>=', now()->subDays((int) $request->jours));
        }
        if ($request->filled('date_debut')) {
            $query->where('date_accident', '>=', $request->date_debut);
        }
        if ($request->filled('date_fin')) {
            $query->where('date_accident', '<=', $request->date_fin . ' 23:59:59');
        }

        // -- Filtres métier --
        if ($request->filled('niveau_degats')) {
            $query->where('niveau_degats', $request->niveau_degats);
        }
        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }
        if ($request->filled('type_responsabilite')) {
            $query->where('type_responsabilite', $request->type_responsabilite);
        }
        if ($request->filled('chauffeur_user_id')) {
            $query->where('chauffeur_user_id', $request->chauffeur_user_id);
        }
        if ($request->filled('vehicule_immatriculation')) {
            $query->where('vehicule_immatriculation', $request->vehicule_immatriculation);
        }
        if ($request->filled('vehicule_immobilise')) {
            $query->where('vehicule_immobilise', filter_var($request->vehicule_immobilise, FILTER_VALIDATE_BOOLEAN));
        }

        // -- Recherche texte --
        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($sub) use ($q) {
                $sub->where('lieu', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%")
                    ->orWhere('vehicule_immatriculation', 'like', "%{$q}%")
                    ->orWhereHas('chauffeur', fn($u) => $u->where('nom', 'like', "%{$q}%"));
            });
        }

        // -- Tri --
        $sortBy  = in_array($request->sort_by, [
            'date_accident', 'niveau_degats', 'statut', 'cout_estime', 'date_creation',
        ]) ? $request->sort_by : 'date_accident';
        $sortDir = $request->sort_dir === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDir);

        // -- Pagination --
        $perPage = min((int) ($request->per_page ?? 10), 100);
        $accidents = $query->paginate($perPage);

        // -- Formater chaque accident --
        $accidents->getCollection()->transform(fn($a) => $this->formatAccident($a));

        return response()->json([
            'success' => true,
            'data'    => $accidents,
        ]);
    }

    // =========================================================================
    // SHOW — détail d'un accident
    // =========================================================================

    public function show(int $id): JsonResponse
    {
        $accident = Accident::with([
                'chauffeur:id,nom,direction_id',
                'chauffeur.direction:id,nom',
                'vehicule:immatriculation,statut',
                'mission:id,reference_mission',
            ])
            ->where('est_supprime', false)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $this->formatAccident($accident),
        ]);
    }

    // =========================================================================
    // STORE — créer un accident
    // =========================================================================

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateAccident($request);

        DB::beginTransaction();
        try {
            // -- Gestion chauffeur : registré ou libre --
            $chauffeurUserId    = null;
            $chauffeurNomLibre  = null;
            $directionNomLibre  = null;

            if ($request->chauffeur_type === 'autre') {
                $chauffeurNomLibre = $request->chauffeur_nom_libre;
                $directionNomLibre = $request->direction_nom_libre;
            } else {
                $chauffeurUserId = $request->chauffeur_user_id;
            }

            // -- Upload rapport de police (PDF/image) --
            $cheminRapportPolice = null;
            if ($request->hasFile('rapport_police_fichier')) {
                $cheminRapportPolice = $this->uploadRapportPolice($request->file('rapport_police_fichier'));
            }

            // -- Upload photos --
            $photos = [];
            if ($request->hasFile('photos')) {
                $photos = $this->uploadPhotos($request->file('photos'));
            }

            // -- Créer l'accident --
            $accident = Accident::create([
                'vehicule_immatriculation'  => $request->vehicule_immatriculation,
                'chauffeur_user_id'         => $chauffeurUserId,
                'mission_id'                => $request->mission_id ?: null,
                'date_accident'             => $request->date_accident,
                'lieu'                      => $request->lieu,
                'position_gps'              => $request->position_gps,
                'description'               => $request->description,
                'type_responsabilite'       => $request->type_responsabilite ?? 'indetermine',
                'niveau_degats'             => $request->niveau_degats ?? 'leger',
                'chemin_rapport_police'     => $cheminRapportPolice,
                'photos'                    => $photos,
                'vehicule_immobilise'       => (bool) $request->vehicule_immobilise,
                'jours_immobilisation'      => $request->vehicule_immobilise ? ($request->jours_immobilisation ?: null) : null,
                'km_au_moment_accident'     => $request->km_au_moment_accident,
                'assure'                    => (bool) $request->assure,
                'cout_estime'               => $request->cout_estime ?? 0,
                'cout_reparation_final'     => $request->cout_reparation_final,
                'montant_reclame_assurance' => $request->montant_reclame_assurance,
                'montant_verse_assurance'   => $request->montant_verse_assurance,
                'statut'                    => $request->statut ?? 'declare',
                'notes'                     => $request->notes,
                'est_supprime'              => false,
            ]);

            // -- Mettre à jour le statut du véhicule (si choix explicite) --
            if ($request->filled('nouveau_statut_vehicule')) {
                $this->updateStatutVehicule(
                    $request->vehicule_immatriculation,
                    $request->nouveau_statut_vehicule,
                    $accident->date_accident
                );
            }

            // -- Si chauffeur libre : on ajoute l'info dans les notes --
            if ($chauffeurNomLibre) {
                $notesChauffeur = "[Chauffeur externe] Nom : {$chauffeurNomLibre}";
                if ($directionNomLibre) {
                    $notesChauffeur .= " | Direction : {$directionNomLibre}";
                }
                $accident->notes = $notesChauffeur . ($accident->notes ? "\n" . $accident->notes : '');
                $accident->save();
            }

            DB::commit();

            // ── Resynchroniser les KPI du véhicule (recomptage exact) ──
            $this->syncKpiAccidents($accident->vehicule_immatriculation, $accident->date_accident);

            $accident->load([
                'chauffeur:id,nom,direction_id',
                'chauffeur.direction:id,nom',
                'vehicule:immatriculation,statut',
                'mission:id,reference_mission',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Accident déclaré avec succès.',
                'data'    => $this->formatAccident($accident),
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la déclaration : ' . $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // UPDATE — modifier un accident
    // =========================================================================

    public function update(Request $request, int $id): JsonResponse
    {
        $accident = Accident::where('est_supprime', false)->findOrFail($id);
        $this->validateAccident($request, isUpdate: true);

        // Ancien état mémorisé AVANT toute modification (pour resynchroniser les KPI)
        $ancienneImmat = $accident->vehicule_immatriculation;
        $ancienneDate  = $accident->date_accident;

        DB::beginTransaction();
        try {
            // -- Chauffeur --
            $chauffeurUserId   = $accident->chauffeur_user_id;
            $chauffeurNomLibre = null;
            $directionNomLibre = null;

            if ($request->chauffeur_type === 'autre') {
                $chauffeurUserId   = null;
                $chauffeurNomLibre = $request->chauffeur_nom_libre;
                $directionNomLibre = $request->direction_nom_libre;
            } elseif ($request->filled('chauffeur_user_id')) {
                $chauffeurUserId = $request->chauffeur_user_id;
            }

            // -- Rapport de police --
            $cheminRapportPolice = $accident->chemin_rapport_police;
            if ($request->hasFile('rapport_police_fichier')) {
                if ($cheminRapportPolice) {
                    Storage::disk('public')->delete($cheminRapportPolice);
                }
                $cheminRapportPolice = $this->uploadRapportPolice($request->file('rapport_police_fichier'));
            } elseif ($request->rapport_police_supprimer == 'true' || $request->rapport_police_supprimer === true) {
                if ($cheminRapportPolice) {
                    Storage::disk('public')->delete($cheminRapportPolice);
                }
                $cheminRapportPolice = null;
            }

            // -- Photos : fusionner existantes + nouvelles --
            $photosExistantes = $accident->photos ?? [];
            if ($request->filled('photos_supprimer')) {
                $toDelete = json_decode($request->photos_supprimer, true) ?? [];
                foreach ($photosExistantes as $key => $photo) {
                    if (in_array($photo['id'] ?? $photo, $toDelete)) {
                        Storage::disk('public')->delete($photo['chemin'] ?? '');
                        unset($photosExistantes[$key]);
                    }
                }
                $photosExistantes = array_values($photosExistantes);
            }

            $nouvellesPhotos = [];
            if ($request->hasFile('photos')) {
                $nouvellesPhotos = $this->uploadPhotos($request->file('photos'));
            }
            $photos = array_merge($photosExistantes, $nouvellesPhotos);

            // -- Mettre à jour --
            $accident->fill([
                'vehicule_immatriculation'  => $request->vehicule_immatriculation ?? $accident->vehicule_immatriculation,
                'chauffeur_user_id'         => $chauffeurUserId,
                'mission_id'                => $request->has('mission_id') ? ($request->mission_id ?: null) : $accident->mission_id,
                'date_accident'             => $request->date_accident ?? $accident->date_accident,
                'lieu'                      => $request->lieu ?? $accident->lieu,
                'position_gps'              => $request->position_gps ?? $accident->position_gps,
                'description'               => $request->description ?? $accident->description,
                'type_responsabilite'       => $request->type_responsabilite ?? $accident->type_responsabilite,
                'niveau_degats'             => $request->niveau_degats ?? $accident->niveau_degats,
                'chemin_rapport_police'     => $cheminRapportPolice,
                'photos'                    => $photos,
                'vehicule_immobilise'       => $request->has('vehicule_immobilise') ? (bool) $request->vehicule_immobilise : $accident->vehicule_immobilise,
                'jours_immobilisation'      => $request->jours_immobilisation ?? $accident->jours_immobilisation,
                'km_au_moment_accident'     => $request->km_au_moment_accident ?? $accident->km_au_moment_accident,
                'assure'                    => $request->has('assure') ? (bool) $request->assure : $accident->assure,
                'cout_estime'               => $request->cout_estime ?? $accident->cout_estime,
                'cout_reparation_final'     => $request->cout_reparation_final ?? $accident->cout_reparation_final,
                'montant_reclame_assurance' => $request->montant_reclame_assurance ?? $accident->montant_reclame_assurance,
                'montant_verse_assurance'   => $request->montant_verse_assurance ?? $accident->montant_verse_assurance,
                'statut'                    => $request->statut ?? $accident->statut,
                'notes'                     => $request->notes ?? $accident->notes,
            ]);

            // -- Chauffeur libre : injecter dans les notes --
            if ($chauffeurNomLibre) {
                $notesChauffeur = "[Chauffeur externe] Nom : {$chauffeurNomLibre}";
                if ($directionNomLibre) {
                    $notesChauffeur .= " | Direction : {$directionNomLibre}";
                }
                $notesBase = preg_replace('/^\[Chauffeur externe\].*\n?/m', '', $accident->notes ?? '');
                $accident->notes = $notesChauffeur . ($notesBase ? "\n" . $notesBase : '');
            }

            $accident->save();

            // -- Mise à jour statut véhicule si demandé --
            if ($request->filled('nouveau_statut_vehicule')) {
                $this->updateStatutVehicule(
                    $accident->vehicule_immatriculation,
                    $request->nouveau_statut_vehicule,
                    $accident->date_accident
                );
            }

            DB::commit();

            // ── Resynchroniser les KPI (ancien et nouveau véhicule / mois) ──
            $this->syncKpiAccidents($ancienneImmat, $ancienneDate);
            $this->syncKpiAccidents($accident->vehicule_immatriculation, $accident->date_accident);

            $accident->load([
                'chauffeur:id,nom,direction_id',
                'chauffeur.direction:id,nom',
                'vehicule:immatriculation,statut',
                'mission:id,reference_mission',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Accident mis à jour avec succès.',
                'data'    => $this->formatAccident($accident),
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour : ' . $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // UPDATE STATUT
    // =========================================================================

    public function updateStatut(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'statut' => 'required|in:' . implode(',', self::STATUTS_ACCIDENT),
        ]);

        $accident = Accident::where('est_supprime', false)->findOrFail($id);
        $accident->statut = $request->statut;
        $accident->save();

        return response()->json([
            'success' => true,
            'message' => 'Statut mis à jour : ' . $request->statut,
            'data'    => ['id' => $accident->id, 'statut' => $accident->statut],
        ]);
    }

    // =========================================================================
    // DESTROY — suppression logique
    // =========================================================================

    public function destroy(int $id): JsonResponse
    {
        $accident = Accident::where('est_supprime', false)->findOrFail($id);

        $immatriculation = $accident->vehicule_immatriculation;

        $accident->est_supprime     = true;
        $accident->date_suppression = now();
        $accident->save();

        // ── Resynchroniser nb_accidents dans les KPI du véhicule ──
        $this->syncKpiAccidents($immatriculation, $accident->date_accident);

        return response()->json([
            'success' => true,
            'message' => 'Accident supprimé avec succès.',
        ]);
    }

    // =========================================================================
    // FORM DATA — données pour les listes déroulantes
    // =========================================================================

    public function formData(): JsonResponse
    {
        // Chauffeurs actifs (role chauffeur)
        $chauffeurs = Utilisateur::select('id', 'nom', 'direction_id')
            ->with('direction:id,nom')
            ->whereHas('role', fn($q) => $q->where('code', 'chauffeur'))
            ->where('est_actif', true)
            ->where('est_supprime', false)
            ->orderBy('nom')
            ->get()
            ->map(fn($u) => [
                'id'           => $u->id,
                'nom'          => $u->nom,
                'direction'    => $u->direction?->nom,
                'direction_id' => $u->direction_id,
            ]);

        // Véhicules actifs non supprimés
        $vehicules = Vehicule::select('immatriculation', 'statut', 'marque_id', 'modele_id')
            ->with('marque:id,nom', 'modele:id,nom')
            ->where('est_actif', true)
            ->where('est_supprime', false)
            ->orderBy('immatriculation')
            ->get()
            ->map(fn($v) => [
                'immatriculation' => $v->immatriculation,
                'marque'          => $v->marque?->nom,
                'modele'          => $v->modele?->nom,
                'statut'          => $v->statut,
                'statut_libelle'  => self::STATUTS_VEHICULE[$v->statut] ?? $v->statut,
            ]);

        // Missions actives
        $missions = Mission::select('id', 'reference_mission', 'vehicule_immatriculation', 'chauffeur_user_id')
            ->whereIn('statut', ['planifiee', 'en_cours'])
            ->where('est_supprime', false)
            ->orderByDesc('date_depart_prevue')
            ->limit(200)
            ->get()
            ->map(fn($m) => [
                'id'        => $m->id,
                'reference' => $m->reference_mission,
                'vehicule'  => $m->vehicule_immatriculation,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'chauffeurs'           => $chauffeurs,
                'vehicules'            => $vehicules,
                'missions'             => $missions,
                'statuts_vehicule'     => self::STATUTS_VEHICULE,
                'niveaux_degats'       => self::NIVEAUX_DEGATS,
                'types_responsabilite' => self::TYPES_RESPONSABILITE,
                'statuts_accident'     => self::STATUTS_ACCIDENT,
            ],
        ]);
    }

    // =========================================================================
    // STATISTIQUES — KPIs + tendance mensuelle
    // =========================================================================

    public function statistiques(Request $request): JsonResponse
    {
        $jours        = (int) ($request->jours ?? 365);
        $anneeEnCours = now()->year;

        $moisLabels = [
            1 => 'Jan', 2 => 'Fév', 3 => 'Mar', 4 => 'Avr',
            5 => 'Mai', 6 => 'Jun', 7 => 'Jul', 8 => 'Aoû',
            9 => 'Sep', 10 => 'Oct', 11 => 'Nov', 12 => 'Déc',
        ];

        // Tendance vide par défaut — 12 mois à 0
        $tendanceVide = collect(range(1, 12))->map(fn($m) => [
            'mois'       => $m,
            'label'      => $moisLabels[$m],
            'full_label' => "{$anneeEnCours}-" . str_pad($m, 2, '0', STR_PAD_LEFT) . "-01",
            'value'      => 0,
        ])->values();

        try {
            $cutoff = now()->subDays($jours);

            $base = Accident::where('est_supprime', false)
                            ->where('date_accident', '>=', $cutoff);

            $total         = (clone $base)->count();
            $nbImmobilises = (clone $base)->where('vehicule_immobilise', true)->count();
            $coutTotal     = (clone $base)->sum('cout_estime');
            $nbCritiques   = (clone $base)->whereIn('niveau_degats', ['grave', 'critique'])->count();

            // Distribution par niveau
            $parNiveau = (clone $base)
                ->select('niveau_degats', DB::raw('count(*) as total'))
                ->groupBy('niveau_degats')
                ->pluck('total', 'niveau_degats');

            // Distribution par statut
            $parStatut = (clone $base)
                ->select('statut', DB::raw('count(*) as total'))
                ->groupBy('statut')
                ->pluck('total', 'statut');

            // Distribution par responsabilité
            $parResponsabilite = (clone $base)
                ->select('type_responsabilite', DB::raw('count(*) as total'))
                ->groupBy('type_responsabilite')
                ->pluck('total', 'type_responsabilite');

            // Top chauffeurs
            $topChauffeurs = (clone $base)
                ->whereNotNull('chauffeur_user_id')
                ->select('chauffeur_user_id', DB::raw('count(*) as nb_accidents'))
                ->groupBy('chauffeur_user_id')
                ->orderByDesc('nb_accidents')
                ->limit(8)
                ->with('chauffeur:id,nom,direction_id', 'chauffeur.direction:id,nom')
                ->get()
                ->map(fn($a) => [
                    'chauffeur_id' => $a->chauffeur_user_id,
                    'nom'          => $a->chauffeur?->nom,
                    'direction'    => $a->chauffeur?->direction?->nom,
                    'nb_accidents' => $a->nb_accidents,
                ]);

            // ── TENDANCE MENSUELLE — janvier à décembre de l'année en cours ──
            $accidentsParMois = Accident::where('est_supprime', false)
                ->whereYear('date_accident', $anneeEnCours)
                ->select(
                    DB::raw('MONTH(date_accident) as mois'),
                    DB::raw('count(*) as nb_accidents')
                )
                ->groupBy('mois')
                ->orderBy('mois')
                ->get()
                ->keyBy('mois');

            $tendance = collect(range(1, 12))->map(fn($mois) => [
                'mois'       => $mois,
                'label'      => $moisLabels[$mois],
                'full_label' => "{$anneeEnCours}-" . str_pad($mois, 2, '0', STR_PAD_LEFT) . "-01",
                'value'      => $accidentsParMois->get($mois)?->nb_accidents ?? 0,
            ])->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'total'              => $total,
                    'nb_immobilises'     => $nbImmobilises,
                    'nb_critiques'       => $nbCritiques,
                    'cout_total'         => (float) $coutTotal,
                    'par_niveau'         => $parNiveau,
                    'par_statut'         => $parStatut,
                    'par_responsabilite' => $parResponsabilite,
                    'top_chauffeurs'     => $topChauffeurs,
                    'periode_jours'      => $jours,
                    'tendance'           => $tendance,
                ],
            ]);

        } catch (\Throwable $e) {
            // En cas d'erreur (table vide, requête SQL...) → retourner des zéros
            // plutôt qu'un 500 qui déclenche une popup côté front
            return response()->json([
                'success' => true,
                'data' => [
                    'total'              => 0,
                    'nb_immobilises'     => 0,
                    'nb_critiques'       => 0,
                    'cout_total'         => 0,
                    'par_niveau'         => [],
                    'par_statut'         => [],
                    'par_responsabilite' => [],
                    'top_chauffeurs'     => [],
                    'periode_jours'      => $jours,
                    'tendance'           => $tendanceVide,
                ],
            ]);
        }
    }

    // =========================================================================
    // MÉTHODES PRIVÉES
    // =========================================================================

    private function validateAccident(Request $request, bool $isUpdate = false): array
    {
        $required = $isUpdate ? 'sometimes|required' : 'required';

        return $request->validate([
            'vehicule_immatriculation'   => "{$required}|string|max:30|exists:vehicules,immatriculation",
            'chauffeur_type'             => 'nullable|in:registre,autre',
            'chauffeur_user_id'          => 'nullable|exists:utilisateurs,id',
            'chauffeur_nom_libre'        => 'nullable|string|max:200',
            'direction_nom_libre'        => 'nullable|string|max:200',
            'mission_id'                 => 'nullable|exists:missions,id',
            'date_accident'              => "{$required}|date",
            'lieu'                       => 'nullable|string|max:255',
            'position_gps'               => 'nullable|string|max:100',
            'description'                => 'nullable|string',
            'type_responsabilite'        => 'nullable|in:' . implode(',', self::TYPES_RESPONSABILITE),
            'niveau_degats'              => 'nullable|in:' . implode(',', self::NIVEAUX_DEGATS),
            'rapport_police_fichier'     => 'nullable|file|mimes:pdf,jpg,jpeg,png,webp|max:10240',
            'rapport_police_supprimer'   => 'nullable',
            'photos.*'                   => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'photos_supprimer'           => 'nullable|string',
            'vehicule_immobilise'        => 'nullable|boolean',
            'jours_immobilisation'       => 'nullable|integer|min:1',
            'nouveau_statut_vehicule'    => 'nullable|in:' . implode(',', array_keys(self::STATUTS_VEHICULE)),
            'km_au_moment_accident'      => 'nullable|integer|min:0',
            'assure'                     => 'nullable|boolean',
            'cout_estime'                => 'nullable|numeric|min:0',
            'cout_reparation_final'      => 'nullable|numeric|min:0',
            'montant_reclame_assurance'  => 'nullable|numeric|min:0',
            'montant_verse_assurance'    => 'nullable|numeric|min:0',
            'statut'                     => 'nullable|in:' . implode(',', self::STATUTS_ACCIDENT),
            'notes'                      => 'nullable|string',
        ]);
    }

    private function uploadRapportPolice(\Illuminate\Http\UploadedFile $file): string
    {
        $nomFichier = Str::uuid() . '.' . $file->getClientOriginalExtension();
        return $file->storeAs('upload/accidents/documents', $nomFichier, 'public');
    }

    private function uploadPhotos(array $files): array
    {
        $photos = [];
        foreach ($files as $file) {
            $nomFichier = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $chemin = $file->storeAs('upload/accidents/images', $nomFichier, 'public');
            $photos[] = [
                'id'           => (string) Str::uuid(),
                'chemin'       => $chemin,
                'nom_original' => $file->getClientOriginalName(),
                'taille'       => $file->getSize(),
            ];
        }
        return $photos;
    }

    private function updateStatutVehicule(string $immatriculation, string $nouveauStatut, $dateAccident): void
    {
        $update = ['statut' => $nouveauStatut];

        if (in_array($nouveauStatut, ['immobilise', 'immobilisation courte', 'immobilisation longue'])) {
            $update['date_immobilisation'] = $dateAccident;
        } else {
            $update['date_immobilisation'] = null;
        }

        Vehicule::where('immatriculation', $immatriculation)
                ->where('est_supprime', false)
                ->update($update);
    }

    private function formatAccident(Accident $a): array
    {
        $photos = collect($a->photos ?? [])->map(function ($photo) {
            return [
                'id'     => $photo['id'] ?? Str::uuid(),
                'nom'    => $photo['nom_original'] ?? 'photo',
                'url'    => Storage::disk('public')->url($photo['chemin'] ?? ''),
                'chemin' => $photo['chemin'] ?? '',
            ];
        })->values()->all();

        $rapportPoliceUrl = null;
        if ($a->chemin_rapport_police) {
            $rapportPoliceUrl = Storage::disk('public')->url($a->chemin_rapport_police);
        }

        return [
            'id'                          => $a->id,
            'ref'                         => 'ACC-' . str_pad($a->id, 5, '0', STR_PAD_LEFT),
            'vehicule_immatriculation'    => $a->vehicule_immatriculation,
            'vehicule_statut'             => $a->vehicule?->statut,

            // Chauffeur
            'chauffeur_id'                => $a->chauffeur_user_id,
            'chauffeur_nom'               => $a->chauffeur?->nom ?? $this->extractChauffeurLibre($a->notes, 'nom'),
            'chauffeur_direction'         => $a->chauffeur?->direction?->nom ?? $this->extractChauffeurLibre($a->notes, 'direction'),
            'chauffeur_externe'           => $a->chauffeur_user_id === null,

            // Mission
            'mission_id'                  => $a->mission_id,
            'mission_reference'           => $a->mission?->reference_mission,

            // Accident
            'date_accident'               => $a->date_accident?->toISOString(),
            'lieu'                        => $a->lieu,
            'position_gps'                => $a->position_gps,
            'description'                 => $a->description,
            'type_responsabilite'         => $a->type_responsabilite,
            'niveau_degats'               => $a->niveau_degats,

            // Fichiers
            'rapport_police'              => (bool) $a->chemin_rapport_police,
            'rapport_police_url'          => $rapportPoliceUrl,
            'photos'                      => $photos,
            'photos_count'                => count($photos),

            // Véhicule immobilisé
            'vehicule_immobilise'         => (bool) $a->vehicule_immobilise,
            'jours_immobilisation'        => $a->jours_immobilisation,

            // KM
            'km_au_moment_accident'       => $a->km_au_moment_accident,

            // Assurance & Coûts
            'assure'                      => (bool) $a->assure,
            'cout_estime'                 => (float) $a->cout_estime,
            'cout_reparation_final'       => $a->cout_reparation_final       ? (float) $a->cout_reparation_final       : null,
            'montant_reclame_assurance'   => $a->montant_reclame_assurance   ? (float) $a->montant_reclame_assurance   : null,
            'montant_verse_assurance'     => $a->montant_verse_assurance     ? (float) $a->montant_verse_assurance     : null,
            'montant_perte'               => (float) ($a->montant_perte ?? 0),
            'taux_couverture_assurance'   => $a->taux_couverture_assurance ?? null,

            // Statut & meta
            'statut'                      => $a->statut,
            'notes'                       => $a->notes,
            'date_creation'               => $a->date_creation?->toISOString(),
            'date_modification'           => $a->date_modification?->toISOString(),
        ];
    }

    /**
     * Recompte les accidents non supprimés du véhicule pour le mois de l'accident
     * et écrit la valeur exacte dans kpi_vehicules (crée la ligne si absente).
     */
    private function syncKpiAccidents(string $immatriculation, $dateAccident): void
    {
        $d = Carbon::parse($dateAccident);

        $nb = Accident::where('est_supprime', false)
            ->where('vehicule_immatriculation', $immatriculation)
            ->whereYear('date_accident', $d->year)
            ->whereMonth('date_accident', $d->month)
            ->count();

        DB::table('kpi_vehicules')->updateOrInsert(
            [
                'vehicule_immatriculation' => $immatriculation,
                'annee_periode'            => $d->year,
                'mois_periode'             => $d->month,
            ],
            ['nb_accidents' => $nb]
        );
    }

    private function extractChauffeurLibre(?string $notes, string $champ): ?string
    {
        if (!$notes) return null;

        if ($champ === 'nom' && preg_match('/\[Chauffeur externe\] Nom : ([^|]+)/i', $notes, $m)) {
            return trim($m[1]);
        }
        if ($champ === 'direction' && preg_match('/Direction : (.+)/i', $notes, $m)) {
            return trim($m[1]);
        }
        return null;
    }
}