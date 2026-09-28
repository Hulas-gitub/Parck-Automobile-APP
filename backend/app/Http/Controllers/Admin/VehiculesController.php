<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JournalAudit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * VehiculesController
 *
 * Gère tout le CRUD du module Véhicules côté admin.
 *
 * Nouveauté v2 : `affectation` est maintenant une FK vers la table `affectations`.
 *   - vehicules.affectation_id  → clé étrangère
 *   - vehicules.affectation     → cache dénormalisé (mis à jour automatiquement)
 *
 * Routes référentiel affectations :
 *   GET    /admin/vehicules/references/affectations          → indexAffectations
 *   POST   /admin/vehicules/references/affectations          → storeAffectation
 *   PUT    /admin/vehicules/references/affectations/{id}     → updateAffectation
 *   DELETE /admin/vehicules/references/affectations/{id}     → destroyAffectation
 *
 * Audit : toutes les actions d'écriture (créer/modifier/supprimer un véhicule,
 * un document, une maintenance ou une affectation) tracent une ligne dans
 * journaux_audit via JournalAudit::tracer(), avec un libellé lisible.
 * Ce controller utilise DB::table() (Query Builder) et non Eloquent, donc le
 * trait Auditable (basé sur les events Eloquent) ne se déclenche jamais ici —
 * d'où ces appels explicites.
 */
class VehiculesController extends Controller
{
    // =========================================================================
    // CONSTANTES
    // =========================================================================
    private const MAX_FILE_SIZE       = 10 * 1024;
    private const ALLOWED_DOC_MIMES   = 'pdf,doc,docx,xls,xlsx,png,jpg,jpeg,webp';
    private const ALLOWED_IMAGE_MIMES = 'jpg,jpeg,png,webp';
    private const IMAGE_DISK_PATH     = 'upload/admin/images/vehicules';
    private const DOC_DISK_PATH       = 'upload/admin/document/vehicules';

    private const STATUTS_MAP = [
        'Disponible'            => 'disponible',
        'En Mission'            => 'en_mission',
        'Maintenance'           => 'en_maintenance',
        'Immobilisé'            => 'immobilise',
        'Immobilisation courte' => 'immobilisation courte',
        'Immobilisation longue' => 'immobilisation longue',
        'Vendu'                 => 'vendu',
        'Retiré'                => 'retire',
        'Hors Service'          => 'hors_service',
        // variantes snake_case déjà présentes en base
        'disponible'            => 'disponible',
        'en_mission'            => 'en_mission',
        'en_maintenance'        => 'en_maintenance',
        'immobilise'            => 'immobilise',
    ];

    // =========================================================================
    // HELPERS PRIVÉS
    // =========================================================================

    /** Correspondance clé technique (FK) → libellé lisible pour l'audit */
    private const CHAMPS_AUDIT_LIBELLES = [
        'marque_id'      => 'marque',
        'modele_id'      => 'modele',
        'categorie_id'   => 'categorie',
        'annee_id'       => 'annee',
        'direction_id'   => 'direction',
        'affectation_id' => 'affectation',
    ];

    private function getAuthUserId(): ?int
    {
        $user = auth()->user();
        if (!$user) return null;
        foreach (['id', 'user_id', 'utilisateur_id'] as $prop) {
            if (isset($user->{$prop})) return (int) $user->{$prop};
        }
        return null;
    }

    /**
     * Instantané d'un véhicule pour l'audit, avec les FK déjà résolues
     * en libellés lisibles (marque, modele... au lieu de marque_id, modele_id...).
     */
    private function snapshotAuditVehicule(string $immatriculation): array
    {
        $v = $this->baseQuery()->where('v.immatriculation', $immatriculation)->first();
        if (!$v) return [];

        return [
            'immatriculation'                  => $v->immatriculation,
            'numero_chassis'                   => $v->numero_chassis,
            'marque'                           => $v->marque_nom,
            'modele'                           => $v->modele_nom,
            'categorie'                        => $v->categorie_nom,
            'annee'                            => $v->annee_val,
            'direction'                        => $v->direction_nom,
            'ville'                            => $v->ville,
            'affectation'                      => $v->affectation_nom ?? $v->affectation,
            'responsable_du_vehicule'          => $v->responsable_du_vehicule,
            'nb_places'                        => $v->nb_places,
            'kilometrage'                      => $v->kilometrage,
            'statut'                           => $v->statut,
            'couleur'                          => $v->couleur,
            'cout_acquisition'                 => $v->cout_acquisition,
            'valeur_residuelle'                => $v->valeur_residuelle,
            'date_acquisition'                 => $v->date_acquisition,
            'date_expiration_assurance'        => $v->date_expiration_assurance,
            'date_expiration_visite_technique' => $v->date_expiration_visite_technique,
        ];
    }

    /**
     * Libellé d'audit intelligent selon ce qui a réellement changé
     * lors d'une modification de véhicule.
     */
    private function libelleAuditVehicule(string $immat, array $champs, array $avant): string
    {
        if (array_key_exists('statut', $champs)) {
            return "Changement de statut du véhicule {$immat} : {$avant['statut']} → {$champs['statut']}";
        }
        if (array_key_exists('affectation', $champs)) {
            return "Nouvelle affectation du véhicule {$immat} : " . ($champs['affectation'] ?? 'aucune');
        }
        if (array_key_exists('kilometrage', $champs)) {
            return "Mise à jour du kilométrage du véhicule {$immat} : {$avant['kilometrage']} km → {$champs['kilometrage']} km";
        }
        if (array_key_exists('photo', $champs)) {
            return "Mise à jour de la photo du véhicule {$immat}";
        }
        return "Modification du véhicule {$immat}";
    }

    /**
     * Formate un enregistrement brut en tableau API.
     * Inclut désormais affectation_id + affectation (libellé).
     */
    private function formatVehicule(object $v): array
    {
        $statutLabel = [
            'disponible'            => 'Disponible',
            'en_mission'            => 'En Mission',
            'en_maintenance'        => 'Maintenance',
            'immobilisation courte' => 'Immobilisation courte',
            'immobilisation longue' => 'Immobilisation longue',
        ][$v->statut] ?? ucfirst($v->statut);

        return [
            'immatriculation'         => $v->immatriculation,
            'numero_chassis'          => $v->numero_chassis          ?? null,
            'marque'                  => $v->marque_nom               ?? null,
            'marque_id'               => $v->marque_id                ?? null,
            'modele'                  => $v->modele_nom               ?? null,
            'modele_id'               => $v->modele_id                ?? null,
            'categorie'               => $v->categorie_nom            ?? null,
            'categorie_id'            => $v->categorie_id             ?? null,
            'annee'                   => $v->annee_val                ?? null,
            'annee_id'                => $v->annee_id                 ?? null,
            'direction'               => $v->direction_nom            ?? null,
            'direction_id'            => $v->direction_id             ?? null,
            'ville'                   => $v->ville                    ?? null,
            // ── Affectation (FK) ─────────────────────────────────────────────
            'affectation'             => $v->affectation_nom          ?? $v->affectation ?? null,
            'affectation_id'          => $v->affectation_id           ?? null,
            'affectation_code'        => $v->affectation_code         ?? null,
            // ─────────────────────────────────────────────────────────────────
            'responsable_du_vehicule' => $v->responsable_du_vehicule  ?? null,
            'chauffeur'               => $v->chauffeur_nom            ?? null,
            'nb_places'               => (int)($v->nb_places          ?? 5),
            'couleur'                 => $v->couleur                  ?? null,
            'carburant'               => $v->type_carburant_defaut    ?? 'Diesel',
            'type_carburant_defaut'   => $v->type_carburant_defaut    ?? null,
            'capacite_reservoir'      => $v->capacite_reservoir_defaut ?? null,
            'kilometrage'             => (int)($v->kilometrage        ?? 0),
            'date_maj_km'             => $v->date_maj_km              ?? null,
            'km_prochaine_vidange'    => $v->km_prochaine_vidange    !== null ? (int)$v->km_prochaine_vidange    : null,
            'km_prochaine_revision'   => $v->km_prochaine_revision   !== null ? (int)$v->km_prochaine_revision   : null,
            'consommation_moyenne'    => $v->consommation_moyenne    !== null ? (float)$v->consommation_moyenne  : null,
            'cout_acquisition'        => (float)($v->cout_acquisition ?? 0),
            'valeur_residuelle'       => $v->valeur_residuelle       !== null ? (float)$v->valeur_residuelle     : null,
            'dateAchat'               => $v->date_acquisition        ?? null,
            'assuranceExpire'         => $v->date_expiration_assurance         ?? null,
            'visiteExpire'            => $v->date_expiration_visite_technique  ?? null,
            'date_immobilisation'     => $v->date_immobilisation               ?? null,
            'image'                   => $v->photo
                                            ? (filter_var($v->photo, FILTER_VALIDATE_URL)
                                                ? $v->photo
                                                : Storage::url($v->photo))
                                            : null,
            'statut'                  => $statutLabel,
            'est_actif'               => (bool)$v->est_actif,
        ];
    }

    /**
     * Requête de base avec toutes les jointures, y compris affectations.
     */
    private function baseQuery()
    {
        return DB::table('vehicules as v')
            ->leftJoin('marques as ma',             'ma.id', '=', 'v.marque_id')
            ->leftJoin('modeles as mo',             'mo.id', '=', 'v.modele_id')
            ->leftJoin('categories_vehicules as ca','ca.id', '=', 'v.categorie_id')
            ->leftJoin('annees as an',              'an.id', '=', 'v.annee_id')
            ->leftJoin('directions as di',          'di.id', '=', 'v.direction_id')
            // ── Jointure affectations ─────────────────────────────────────────
            ->leftJoin('affectations as af',        'af.id', '=', 'v.affectation_id')
            // ─────────────────────────────────────────────────────────────────
            ->leftJoin(DB::raw('(
                SELECT m.vehicule_immatriculation, u.nom AS chauffeur_nom
                FROM missions m
                JOIN utilisateurs u ON u.id = m.chauffeur_user_id
                WHERE m.statut IN (\'en_cours\', \'planifiee\') AND m.est_supprime = 0
                ORDER BY m.date_depart_prevue DESC
            ) AS ch'), 'ch.vehicule_immatriculation', '=', 'v.immatriculation')
            ->where('v.est_supprime', 0)
            ->select(
                'v.immatriculation',
                'v.numero_chassis',
                'v.marque_id',
                'v.modele_id',
                'v.categorie_id',
                'v.annee_id',
                'v.direction_id',
                'v.ville',
                // ── Affectation ───────────────────────────────────────────────
                'v.affectation_id',
                'v.affectation',                 // cache varchar (fallback)
                'af.nom  as affectation_nom',    // libellé depuis la table
                'af.code as affectation_code',   // code court
                // ─────────────────────────────────────────────────────────────
                'v.responsable_du_vehicule',
                'v.nb_places',
                'v.kilometrage',
                'v.date_maj_km',
                'v.km_prochaine_vidange',
                'v.km_prochaine_revision',
                'v.statut',
                'v.date_immobilisation',
                'v.consommation_moyenne',
                'v.date_acquisition',
                'v.date_expiration_assurance',
                'v.date_expiration_visite_technique',
                'v.cout_acquisition',
                'v.valeur_residuelle',
                'v.photo',
                'v.couleur',
                'v.est_actif',
                'ma.nom as marque_nom',
                'mo.nom as modele_nom',
                'mo.type_carburant_defaut',
                'mo.capacite_reservoir_defaut',
                'mo.consommation_moyenne_defaut',
                'ca.nom as categorie_nom',
                'an.annee as annee_val',
                'di.nom as direction_nom',
                'ch.chauffeur_nom'
            );
    }

    // =========================================================================
    // 1. LISTE VÉHICULES (paginée + filtres)
    // =========================================================================

    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int)$request->get('per_page', 9), 1), 100);
        $query   = $this->baseQuery();

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('v.immatriculation',  'LIKE', "%{$search}%")
                  ->orWhere('ma.nom',            'LIKE', "%{$search}%")
                  ->orWhere('mo.nom',            'LIKE', "%{$search}%")
                  ->orWhere('di.nom',            'LIKE', "%{$search}%")
                  ->orWhere('v.ville',           'LIKE', "%{$search}%")
                  ->orWhere('af.nom',            'LIKE', "%{$search}%");  // ← nouveau
            });
        }

        if ($cat  = $request->get('categorie'))    $query->where('ca.nom',    $cat);
        if ($mrq  = $request->get('marque'))       $query->where('ma.nom',    $mrq);
        if ($mod  = $request->get('modele'))       $query->where('mo.nom',    $mod);
        if ($vil  = $request->get('ville'))        $query->where('v.ville',   $vil);
        if ($dir  = $request->get('direction'))    $query->where('di.nom',    $dir);

        // ── Filtre affectation ────────────────────────────────────────────────
        if ($affId = $request->get('affectation_id')) {
            $query->where('v.affectation_id', (int)$affId);
        } elseif ($affNom = $request->get('affectation')) {
            // Compatibilité : le front peut envoyer le libellé ou l'id
            $query->where('af.nom', $affNom);
        }
        // ─────────────────────────────────────────────────────────────────────

        if ($sta = $request->get('statut')) {
            $query->where('v.statut', self::STATUTS_MAP[$sta] ?? strtolower($sta));
        }

        $total    = $query->count();

        // ── TRI ALPHABÉTIQUE (A→Z) appliqué AVANT pagination ──────────────────
        $vehicles = $query
    ->orderBy('v.immatriculation')
    ->paginate($perPage);
        // ─────────────────────────────────────────────────────────────────────

        $data     = collect($vehicles->items())->map(fn($v) => $this->formatVehicule($v))->values();

        return response()->json([
            'data'         => $data,
            'total'        => $total,
            'current_page' => $vehicles->currentPage(),
            'last_page'    => $vehicles->lastPage(),
            'per_page'     => $perPage,
        ]);
    }

    // =========================================================================
    // 2. DÉTAIL D'UN VÉHICULE
    // =========================================================================

    public function show(string $immatriculation): JsonResponse
    {
        $v = $this->baseQuery()->where('v.immatriculation', $immatriculation)->first();
        if (!$v) return response()->json(['message' => 'Véhicule introuvable.'], 404);
        return response()->json($this->formatVehicule($v));
    }

    // =========================================================================
    // 3. CRÉER UN VÉHICULE
    // =========================================================================

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'immatriculation'         => 'required|string|max:30|unique:vehicules,immatriculation',
            'marque'                  => 'required|string|max:100',
            'modele'                  => 'required|string|max:100',
            'categorie'               => 'required|string|max:100',
            'direction'               => 'required|string|max:150',
            'annee'                   => 'nullable|integer|min:1900|max:2100',
            'numero_chassis'          => 'nullable|string|max:100|unique:vehicules,numero_chassis',
            'kilometrage'             => 'nullable|integer|min:0',
            'nb_places'               => 'nullable|integer|min:1|max:100',
            'statut'                  => 'nullable|string',
            'couleur'                 => 'nullable|string|max:100',
            'ville'                   => 'nullable|string|max:100',
            // ── Affectation ───────────────────────────────────────────────────
            'affectation_id'          => 'nullable|integer|exists:affectations,id',
            // ─────────────────────────────────────────────────────────────────
            'responsable_du_vehicule' => 'nullable|string|max:200',
            'dateAchat'               => 'nullable|date',
            'cout_acquisition'        => 'nullable|numeric|min:0',
            'valeur_residuelle'       => 'nullable|numeric|min:0',
            'consommation_moyenne'    => 'nullable|numeric|min:0',
            'km_prochaine_vidange'    => 'nullable|integer|min:0',
            'km_prochaine_revision'   => 'nullable|integer|min:0',
            'assuranceExpire'         => 'nullable|date',
            'visiteExpire'            => 'nullable|date',
            'image'                   => 'nullable|file|mimes:' . self::ALLOWED_IMAGE_MIMES . '|max:' . self::MAX_FILE_SIZE,
        ]);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $marqueId    = $this->resolveMarqueId($request->marque);
        $modeleId    = $this->resolveModeleId($request->modele, $marqueId);
        $categorieId = $this->resolveCategorieId($request->categorie);
        $directionId = $this->resolveDirectionId($request->direction);
        $anneeId     = $this->resolveAnneeId($request->annee);
        $statutDB    = self::STATUTS_MAP[$request->get('statut', 'Disponible')] ?? 'disponible';

        // ── Résolution affectation ────────────────────────────────────────────
        $affectationId  = $request->filled('affectation_id') ? (int)$request->affectation_id : null;
        $affectationNom = $affectationId
            ? DB::table('affectations')->where('id', $affectationId)->value('nom')
            : null;
        // ─────────────────────────────────────────────────────────────────────

        $photoPath = null;
        if ($request->hasFile('image')) $photoPath = $this->uploadImage($request->file('image'));

        DB::table('vehicules')->insert([
            'immatriculation'                  => strtoupper(trim($request->immatriculation)),
            'numero_chassis'                   => $request->numero_chassis ?: null,
            'marque_id'                        => $marqueId,
            'modele_id'                        => $modeleId,
            'categorie_id'                     => $categorieId,
            'direction_id'                     => $directionId,
            'ville'                            => $request->ville ?: null,
            // ── Affectation ───────────────────────────────────────────────────
            'affectation_id'                   => $affectationId,
            'affectation'                      => $affectationNom,   // cache dénormalisé
            // ─────────────────────────────────────────────────────────────────
            'responsable_du_vehicule'          => $request->responsable_du_vehicule ?: null,
            'annee_id'                         => $anneeId,
            'nb_places'                        => (int)($request->nb_places ?? 5),
            'kilometrage'                      => (int)($request->kilometrage ?? 0),
            'statut'                           => $statutDB,
            'cout_acquisition'                 => (float)($request->cout_acquisition ?? 0),
            'valeur_residuelle'                => $request->filled('valeur_residuelle')     ? (float)$request->valeur_residuelle    : null,
            'consommation_moyenne'             => $request->filled('consommation_moyenne')  ? (float)$request->consommation_moyenne  : null,
            'km_prochaine_vidange'             => $request->filled('km_prochaine_vidange')  ? (int)$request->km_prochaine_vidange    : null,
            'km_prochaine_revision'            => $request->filled('km_prochaine_revision') ? (int)$request->km_prochaine_revision   : null,
            'date_acquisition'                 => $request->dateAchat       ?: null,
            'date_expiration_assurance'        => $request->assuranceExpire ?: null,
            'date_expiration_visite_technique' => $request->visiteExpire    ?: null,
            'couleur'                          => $request->couleur         ?: null,
            'photo'                            => $photoPath,
            'est_actif'                        => 1,
            'est_supprime'                     => 0,
            'date_creation'                    => now(),
            'date_modification'                => now(),
        ]);

        $vehicule = $this->baseQuery()
            ->where('v.immatriculation', strtoupper(trim($request->immatriculation)))
            ->first();

        // ── AUDIT : ajout d'un véhicule ─────────────────────────────────────
        JournalAudit::tracer(
            $this->getAuthUserId(),
            'CREATE',
            'vehicules',
            $vehicule->immatriculation,
            null,
            $this->snapshotAuditVehicule($vehicule->immatriculation),
            "Ajout du véhicule {$vehicule->immatriculation} ({$request->marque} {$request->modele})"
        );
        // ─────────────────────────────────────────────────────────────────────

        return response()->json($this->formatVehicule($vehicule), 201);
    }

    // =========================================================================
    // 4. MODIFIER UN VÉHICULE
    // =========================================================================

    public function update(Request $request, string $immatriculation): JsonResponse
    {
        $exists = DB::table('vehicules')
            ->where('immatriculation', $immatriculation)->where('est_supprime', 0)->exists();
        if (!$exists) return response()->json(['message' => 'Véhicule introuvable.'], 404);

        // ── AUDIT : capture de l'état "avant" (brut + snapshot avec noms résolus) ──
        $avantComplet  = DB::table('vehicules')->where('immatriculation', $immatriculation)->first();
        $avantSnapshot = $this->snapshotAuditVehicule($immatriculation);
        // ─────────────────────────────────────────────────────────────────────

        $validator = Validator::make($request->all(), [
            'marque'                  => 'nullable|string|max:100',
            'modele'                  => 'nullable|string|max:100',
            'categorie'               => 'nullable|string|max:100',
            'direction'               => 'nullable|string|max:150',
            'annee'                   => 'nullable|integer|min:1900|max:2100',
            'numero_chassis'          => 'nullable|string|max:100|unique:vehicules,numero_chassis,' . $immatriculation . ',immatriculation',
            'kilometrage'             => 'nullable|integer|min:0',
            'nb_places'               => 'nullable|integer|min:1|max:100',
            'statut'                  => 'nullable|string',
            'couleur'                 => 'nullable|string|max:100',
            'ville'                   => 'nullable|string|max:100',
            // ── Affectation ───────────────────────────────────────────────────
            'affectation_id'          => 'nullable|integer|exists:affectations,id',
            // ─────────────────────────────────────────────────────────────────
            'responsable_du_vehicule' => 'nullable|string|max:200',
            'dateAchat'               => 'nullable|date',
            'cout_acquisition'        => 'nullable|numeric|min:0',
            'valeur_residuelle'       => 'nullable|numeric|min:0',
            'consommation_moyenne'    => 'nullable|numeric|min:0',
            'km_prochaine_vidange'    => 'nullable|integer|min:0',
            'km_prochaine_revision'   => 'nullable|integer|min:0',
            'assuranceExpire'         => 'nullable|date',
            'visiteExpire'            => 'nullable|date',
            'image'                   => 'nullable|file|mimes:' . self::ALLOWED_IMAGE_MIMES . '|max:' . self::MAX_FILE_SIZE,
        ]);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $updateData = ['date_modification' => now()];

        if ($request->filled('marque')) {
            $marqueId = $this->resolveMarqueId($request->marque);
            $updateData['marque_id'] = $marqueId;
            if ($request->filled('modele')) {
                $updateData['modele_id'] = $this->resolveModeleId($request->modele, $marqueId);
            }
        }
        if ($request->filled('categorie'))   $updateData['categorie_id']  = $this->resolveCategorieId($request->categorie);
        if ($request->filled('direction'))   $updateData['direction_id']  = $this->resolveDirectionId($request->direction);
        if ($request->filled('annee'))       $updateData['annee_id']      = $this->resolveAnneeId($request->annee);
        if ($request->has('numero_chassis')) $updateData['numero_chassis'] = $request->numero_chassis ?: null;
        if ($request->has('nb_places'))      $updateData['nb_places']      = (int)($request->nb_places ?? 5);
        if ($request->has('ville'))          $updateData['ville']          = $request->ville ?: null;

        // ── Affectation ───────────────────────────────────────────────────────
        if ($request->has('affectation_id')) {
            $affectationId = $request->filled('affectation_id') ? (int)$request->affectation_id : null;
            $affectationNom = $affectationId
                ? DB::table('affectations')->where('id', $affectationId)->value('nom')
                : null;
            $updateData['affectation_id'] = $affectationId;
            $updateData['affectation']    = $affectationNom;  // mise à jour du cache
        }
        // ─────────────────────────────────────────────────────────────────────

        if ($request->has('responsable_du_vehicule')) $updateData['responsable_du_vehicule'] = $request->responsable_du_vehicule ?: null;

        if ($request->has('kilometrage')) {
            $updateData['kilometrage'] = (int)$request->kilometrage;
            $updateData['date_maj_km'] = now()->toDateString();
        }
        if ($request->filled('statut'))             $updateData['statut']                             = self::STATUTS_MAP[$request->statut] ?? 'disponible';
        if ($request->has('couleur'))               $updateData['couleur']                            = $request->couleur ?: null;
        if ($request->has('dateAchat'))             $updateData['date_acquisition']                   = $request->dateAchat ?: null;
        if ($request->has('cout_acquisition'))      $updateData['cout_acquisition']                   = (float)$request->cout_acquisition;
        if ($request->has('valeur_residuelle'))     $updateData['valeur_residuelle']                  = $request->filled('valeur_residuelle') ? (float)$request->valeur_residuelle : null;
        if ($request->has('consommation_moyenne'))  $updateData['consommation_moyenne']               = $request->filled('consommation_moyenne') ? (float)$request->consommation_moyenne : null;
        if ($request->has('km_prochaine_vidange'))  $updateData['km_prochaine_vidange']               = $request->filled('km_prochaine_vidange') ? (int)$request->km_prochaine_vidange : null;
        if ($request->has('km_prochaine_revision')) $updateData['km_prochaine_revision']              = $request->filled('km_prochaine_revision') ? (int)$request->km_prochaine_revision : null;
        if ($request->has('assuranceExpire'))       $updateData['date_expiration_assurance']          = $request->assuranceExpire ?: null;
        if ($request->has('visiteExpire'))          $updateData['date_expiration_visite_technique']   = $request->visiteExpire ?: null;

        if ($request->hasFile('image')) {
            $old = DB::table('vehicules')->where('immatriculation', $immatriculation)->value('photo');
            if ($old && !filter_var($old, FILTER_VALIDATE_URL) && Storage::disk('public')->exists($old)) {
                Storage::disk('public')->delete($old);
            }
            $updateData['photo'] = $this->uploadImage($request->file('image'));
        }

        DB::table('vehicules')->where('immatriculation', $immatriculation)->update($updateData);

        // ── AUDIT : modification d'un véhicule (noms résolus, pas les ids FK) ──
        $apresSnapshot  = $this->snapshotAuditVehicule($immatriculation);
        $champsModifies = collect($updateData)->except(['date_modification', 'affectation'])->keys()->all();

        $champsAudit      = [];
        $anciennesValeurs = [];

        foreach ($champsModifies as $champ) {
            $cle = self::CHAMPS_AUDIT_LIBELLES[$champ] ?? $champ;
            $champsAudit[$cle]      = $apresSnapshot[$cle]  ?? ($updateData[$champ] ?? null);
            $anciennesValeurs[$cle] = $avantSnapshot[$cle] ?? ($avantComplet->{$champ} ?? null);
        }

        if (!empty($champsAudit)) {
            JournalAudit::tracer(
                $this->getAuthUserId(),
                'UPDATE',
                'vehicules',
                $immatriculation,
                $anciennesValeurs,
                $champsAudit,
                $this->libelleAuditVehicule($immatriculation, $champsAudit, $anciennesValeurs)
            );
        }
        // ─────────────────────────────────────────────────────────────────────

        $vehicule = $this->baseQuery()->where('v.immatriculation', $immatriculation)->first();
        return response()->json($this->formatVehicule($vehicule));
    }

    // =========================================================================
    // 5. SUPPRIMER UN VÉHICULE (soft delete)
    // =========================================================================

    public function destroy(string $immatriculation): JsonResponse
    {
        $avant = DB::table('vehicules')
            ->where('immatriculation', $immatriculation)->where('est_supprime', 0)->first();
        if (!$avant) return response()->json(['message' => 'Véhicule introuvable.'], 404);

        // ── AUDIT : snapshot avec noms résolus avant suppression ────────────
        $avantSnapshot = $this->snapshotAuditVehicule($immatriculation);
        // ─────────────────────────────────────────────────────────────────────

        DB::table('vehicules')
            ->where('immatriculation', $immatriculation)->where('est_supprime', 0)
            ->update(['est_supprime' => 1, 'date_suppression' => now(), 'date_modification' => now()]);

        // ── AUDIT : suppression d'un véhicule ───────────────────────────────
        JournalAudit::tracer(
            $this->getAuthUserId(),
            'DELETE',
            'vehicules',
            $immatriculation,
            $avantSnapshot,
            null,
            "Suppression du véhicule {$immatriculation}"
        );
        // ─────────────────────────────────────────────────────────────────────

        return response()->json(['message' => 'Véhicule supprimé avec succès.']);
    }

    // =========================================================================
    // 6. CHANGER LE STATUT
    // =========================================================================

    public function updateStatut(Request $request, string $immatriculation): JsonResponse
    {
        $validator = Validator::make($request->all(), ['statut' => 'required|string']);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $statutDB = self::STATUTS_MAP[$request->statut] ?? null;
        if (!$statutDB) return response()->json(['message' => 'Statut invalide.'], 422);

        $ancienStatut = DB::table('vehicules')
            ->where('immatriculation', $immatriculation)->where('est_supprime', 0)
            ->value('statut');
        if ($ancienStatut === null) return response()->json(['message' => 'Véhicule introuvable.'], 404);

        DB::table('vehicules')
            ->where('immatriculation', $immatriculation)->where('est_supprime', 0)
            ->update(['statut' => $statutDB, 'date_modification' => now()]);

        // ── AUDIT : changement de statut ────────────────────────────────────
        JournalAudit::tracer(
            $this->getAuthUserId(),
            'UPDATE',
            'vehicules',
            $immatriculation,
            ['statut' => $ancienStatut],
            ['statut' => $statutDB],
            "Changement de statut du véhicule {$immatriculation} : {$ancienStatut} → {$statutDB}"
        );
        // ─────────────────────────────────────────────────────────────────────

        return response()->json(['message' => 'Statut mis à jour.', 'statut' => $request->statut]);
    }

    // =========================================================================
    // 7. DOCUMENTS D'UN VÉHICULE
    // =========================================================================

    public function documents(string $immatriculation): JsonResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $docs = DB::table('documents_vehicules')
            ->where('vehicule_immatriculation', $immatriculation)
            ->where('est_supprime', 0)
            ->orderBy('date_creation', 'desc')
            ->get()
            ->map(function ($doc) {
                $statut = 'valide';
                if ($doc->date_expiration) {
                    $diff = now()->diffInDays($doc->date_expiration, false);
                    if ($diff < 0)       $statut = 'expire';
                    elseif ($diff <= 30) $statut = 'expire_bientot';
                }
                return [
                    'id'                       => $doc->id,
                    'vehicule_immatriculation' => $doc->vehicule_immatriculation,
                    'type_document'            => $doc->type_document,
                    'nom_document'             => $doc->nom_document,
                    'chemin_fichier'           => $doc->chemin_fichier,
                    'url_fichier'              => $this->buildFileUrl($doc->chemin_fichier),
                    'compagnie_assurance'      => $doc->compagnie_assurance,
                    'numero_contrat'           => $doc->numero_contrat,
                    'type_couverture'          => $doc->type_couverture,
                    'montant_prime'            => $doc->montant_prime,
                    'date_emission'            => $doc->date_emission,
                    'date_expiration'          => $doc->date_expiration,
                    'statut'                   => $statut,
                    'notes'                    => $doc->notes,
                    'date_creation'            => $doc->date_creation,
                    'date_modification'        => $doc->date_modification,
                ];
            });

        return response()->json($docs);
    }

    public function storeDocument(Request $request, string $immatriculation): JsonResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $validator = Validator::make($request->all(), [
            'fichier'             => 'required|file|mimes:' . self::ALLOWED_DOC_MIMES . '|max:' . self::MAX_FILE_SIZE,
            'type_document'       => 'required|string|max:100',
            'nom_document'        => 'nullable|string|max:255',
            'compagnie_assurance' => 'nullable|string|max:200',
            'numero_contrat'      => 'nullable|string|max:100',
            'type_couverture'     => 'nullable|string|max:100',
            'montant_prime'       => 'nullable|numeric|min:0',
            'date_emission'       => 'nullable|date',
            'date_expiration'     => 'nullable|date',
            'notes'               => 'nullable|string',
        ]);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $file        = $request->file('fichier');
        $filename    = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path        = $file->storeAs(self::DOC_DISK_PATH, $filename, 'public');
        $nomDocument = $request->get('nom_document') ?: ($request->type_document . ' — ' . $immatriculation);

        $id = DB::table('documents_vehicules')->insertGetId([
            'vehicule_immatriculation' => $immatriculation,
            'type_document'            => $request->type_document,
            'nom_document'             => $nomDocument,
            'chemin_fichier'           => $path,
            'compagnie_assurance'      => $request->compagnie_assurance,
            'numero_contrat'           => $request->numero_contrat,
            'type_couverture'          => $request->type_couverture,
            'montant_prime'            => $request->montant_prime,
            'date_emission'            => $request->date_emission  ?: null,
            'date_expiration'          => $request->date_expiration ?: null,
            'telecharge_par_user_id'   => $this->getAuthUserId(),
            'notes'                    => $request->notes,
            'est_supprime'             => 0,
            'date_creation'            => now(),
            'date_modification'        => now(),
        ]);

        $doc = DB::table('documents_vehicules')->find($id);

        // ── AUDIT : ajout d'un document véhicule ────────────────────────────
        JournalAudit::tracer(
            $this->getAuthUserId(),
            'CREATE',
            'documents_vehicules',
            (string) $doc->id,
            null,
            (array) $doc,
            "Ajout du document \"{$doc->nom_document}\" ({$doc->type_document}) pour le véhicule {$immatriculation}"
        );
        // ─────────────────────────────────────────────────────────────────────

        return response()->json([
            'id'              => $doc->id,
            'nom_document'    => $doc->nom_document,
            'type_document'   => $doc->type_document,
            'url_fichier'     => $this->buildFileUrl($doc->chemin_fichier),
            'date_expiration' => $doc->date_expiration,
            'statut'          => 'valide',
        ], 201);
    }

    public function updateDocument(Request $request, string $immatriculation, int $documentId): JsonResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $doc = DB::table('documents_vehicules')
            ->where('id', $documentId)->where('vehicule_immatriculation', $immatriculation)
            ->where('est_supprime', 0)->first();
        if (!$doc) return response()->json(['message' => 'Document introuvable.'], 404);

        $validator = Validator::make($request->all(), [
            'fichier'             => 'nullable|file|mimes:' . self::ALLOWED_DOC_MIMES . '|max:' . self::MAX_FILE_SIZE,
            'type_document'       => 'nullable|string|max:100',
            'nom_document'        => 'nullable|string|max:255',
            'compagnie_assurance' => 'nullable|string|max:200',
            'numero_contrat'      => 'nullable|string|max:100',
            'type_couverture'     => 'nullable|string|max:100',
            'montant_prime'       => 'nullable|numeric|min:0',
            'date_emission'       => 'nullable|date',
            'date_expiration'     => 'nullable|date',
            'notes'               => 'nullable|string',
        ]);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $updateData = ['date_modification' => now()];
        if ($request->filled('type_document'))    $updateData['type_document']       = $request->type_document;
        if ($request->filled('nom_document'))     $updateData['nom_document']        = $request->nom_document;
        if ($request->has('compagnie_assurance')) $updateData['compagnie_assurance'] = $request->compagnie_assurance;
        if ($request->has('numero_contrat'))      $updateData['numero_contrat']      = $request->numero_contrat;
        if ($request->has('type_couverture'))     $updateData['type_couverture']     = $request->type_couverture;
        if ($request->has('montant_prime'))       $updateData['montant_prime']       = $request->montant_prime;
        if ($request->has('date_emission'))       $updateData['date_emission']       = $request->date_emission  ?: null;
        if ($request->has('date_expiration'))     $updateData['date_expiration']     = $request->date_expiration ?: null;
        if ($request->has('notes'))               $updateData['notes']               = $request->notes;

        if ($request->hasFile('fichier')) {
            if ($doc->chemin_fichier && !filter_var($doc->chemin_fichier, FILTER_VALIDATE_URL)
                && Storage::disk('public')->exists($doc->chemin_fichier)) {
                Storage::disk('public')->delete($doc->chemin_fichier);
            }
            $file = $request->file('fichier');
            $updateData['chemin_fichier'] = $file->storeAs(
                self::DOC_DISK_PATH,
                Str::uuid() . '.' . $file->getClientOriginalExtension(),
                'public'
            );
        }

        DB::table('documents_vehicules')->where('id', $documentId)->update($updateData);

        $updated = DB::table('documents_vehicules')->find($documentId);
        $statut  = 'valide';
        if ($updated->date_expiration) {
            $diff = now()->diffInDays($updated->date_expiration, false);
            if ($diff < 0)       $statut = 'expire';
            elseif ($diff <= 30) $statut = 'expire_bientot';
        }

        // ── AUDIT : modification d'un document véhicule ─────────────────────
        JournalAudit::tracer(
            $this->getAuthUserId(),
            'UPDATE',
            'documents_vehicules',
            (string) $documentId,
            (array) $doc,
            collect($updateData)->except(['date_modification'])->all(),
            "Modification du document \"{$updated->nom_document}\" du véhicule {$immatriculation}"
        );
        // ─────────────────────────────────────────────────────────────────────

        return response()->json([
            'id'                       => $updated->id,
            'vehicule_immatriculation' => $updated->vehicule_immatriculation,
            'type_document'            => $updated->type_document,
            'nom_document'             => $updated->nom_document,
            'chemin_fichier'           => $updated->chemin_fichier,
            'url_fichier'              => $this->buildFileUrl($updated->chemin_fichier),
            'compagnie_assurance'      => $updated->compagnie_assurance,
            'numero_contrat'           => $updated->numero_contrat,
            'type_couverture'          => $updated->type_couverture,
            'montant_prime'            => $updated->montant_prime,
            'date_emission'            => $updated->date_emission,
            'date_expiration'          => $updated->date_expiration,
            'statut'                   => $statut,
            'notes'                    => $updated->notes,
            'date_creation'            => $updated->date_creation,
            'date_modification'        => $updated->date_modification,
        ]);
    }

    public function destroyDocument(string $immatriculation, int $documentId): JsonResponse
    {
        $doc = DB::table('documents_vehicules')
            ->where('id', $documentId)->where('vehicule_immatriculation', $immatriculation)
            ->where('est_supprime', 0)->first();
        if (!$doc) return response()->json(['message' => 'Document introuvable.'], 404);

        if ($doc->chemin_fichier && Storage::disk('public')->exists($doc->chemin_fichier)) {
            Storage::disk('public')->delete($doc->chemin_fichier);
        }
        DB::table('documents_vehicules')->where('id', $documentId)
            ->update(['est_supprime' => 1, 'date_suppression' => now(), 'date_modification' => now()]);

        // ── AUDIT : suppression d'un document véhicule ──────────────────────
        JournalAudit::tracer(
            $this->getAuthUserId(),
            'DELETE',
            'documents_vehicules',
            (string) $documentId,
            (array) $doc,
            null,
            "Suppression du document \"{$doc->nom_document}\" du véhicule {$immatriculation}"
        );
        // ─────────────────────────────────────────────────────────────────────

        return response()->json(['message' => 'Document supprimé.']);
    }

    public function openDocument(string $immatriculation, int $documentId): JsonResponse
    {
        $doc = DB::table('documents_vehicules')
            ->where('id', $documentId)->where('vehicule_immatriculation', $immatriculation)
            ->where('est_supprime', 0)->first();
        if (!$doc) return response()->json(['message' => 'Document introuvable.'], 404);
        return response()->json(['url' => $this->buildFileUrl($doc->chemin_fichier), 'nom' => $doc->nom_document]);
    }

    // =========================================================================
    // 8. MAINTENANCES D'UN VÉHICULE
    // =========================================================================

    public function maintenances(string $immatriculation): JsonResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $items = DB::table('interventions as i')
            ->leftJoin('intervenants as in2', 'in2.id', '=', 'i.intervenant_id')
            ->where('i.vehicule_immatriculation', $immatriculation)->where('i.est_supprime', 0)
            ->orderBy('i.date_debut', 'desc')
            ->select(
                'i.id', 'i.type_intervention', 'i.severite', 'i.date_debut', 'i.date_fin',
                'i.km_au_moment_intervention', 'i.diagnostic', 'i.resultat',
                'i.cout_main_oeuvre', 'i.cout_pieces', 'i.statut', 'i.notes',
                'in2.nom_externe as intervenant_nom'
            )->get();

        return response()->json($items);
    }

    public function storeMaintenance(Request $request, string $immatriculation): JsonResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $validator = Validator::make($request->all(), [
            'type_intervention'         => 'required|string|max:100',
            'intervenant_id'            => 'required|integer|exists:intervenants,id',
            'severite'                  => 'nullable|string|in:faible,normale,haute,critique',
            'date_debut'                => 'nullable|date',
            'date_fin'                  => 'nullable|date|after_or_equal:date_debut',
            'km_au_moment_intervention' => 'nullable|integer|min:0',
            'diagnostic'                => 'nullable|string',
            'cout_main_oeuvre'          => 'nullable|numeric|min:0',
            'statut'                    => 'nullable|string|in:planifiee,en_cours,terminee,annulee',
            'notes'                     => 'nullable|string',
        ]);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $id = DB::table('interventions')->insertGetId([
            'vehicule_immatriculation'  => $immatriculation,
            'intervenant_id'            => $request->intervenant_id,
            'type_intervention'         => $request->type_intervention,
            'severite'                  => $request->get('severite', 'normale'),
            'date_debut'                => $request->date_debut ?: null,
            'date_fin'                  => $request->date_fin   ?: null,
            'km_au_moment_intervention' => $request->km_au_moment_intervention,
            'diagnostic'                => $request->diagnostic,
            'cout_main_oeuvre'          => (float)($request->cout_main_oeuvre ?? 0),
            'cout_pieces'               => 0,
            'resultat'                  => 'en_attente',
            'statut'                    => $request->get('statut', 'planifiee'),
            'notes'                     => $request->notes,
            'est_supprime'              => 0,
            'date_creation'             => now(),
            'date_modification'         => now(),
        ]);

        $intervention = DB::table('interventions')->find($id);

        // ── AUDIT : ajout d'une intervention / maintenance ──────────────────
        JournalAudit::tracer(
            $this->getAuthUserId(),
            'CREATE',
            'interventions',
            (string) $id,
            null,
            (array) $intervention,
            "Ajout d'une intervention \"{$request->type_intervention}\" sur le véhicule {$immatriculation}"
        );
        // ─────────────────────────────────────────────────────────────────────

        return response()->json($intervention, 201);
    }

    // =========================================================================
    // 9. MISSIONS D'UN VÉHICULE
    // =========================================================================

    public function missions(string $immatriculation): JsonResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $items = DB::table('missions as m')
            ->leftJoin('utilisateurs as u', 'u.id', '=', 'm.chauffeur_user_id')
            ->leftJoin('directions as d',   'd.id', '=', 'm.direction_id')
            ->where('m.vehicule_immatriculation', $immatriculation)->where('m.est_supprime', 0)
            ->orderBy('m.date_depart_prevue', 'desc')
            ->select(
                'm.id', 'm.type_mission', 'm.destination',
                'm.date_depart_prevue', 'm.date_depart_reelle', 'm.date_retour_reelle',
                'm.km_depart', 'm.km_retour', 'm.carburant_consomme', 'm.cout_carburant',
                'm.statut', 'm.reference_mission', 'm.observations',
                'u.nom as chauffeur_nom', 'd.nom as direction_nom'
            )->get();

        return response()->json($items);
    }

    // =========================================================================
    // 10. STATISTIQUES D'UN VÉHICULE
    // =========================================================================

    public function stats(string $immatriculation): JsonResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $missions = DB::table('missions')
            ->where('vehicule_immatriculation', $immatriculation)->where('est_supprime', 0)
            ->selectRaw('COUNT(*) as total_missions, COALESCE(SUM(km_retour - km_depart), 0) as total_km')
            ->first();

        $carburant = DB::table('carnets_carburant')
            ->where('vehicule_immatriculation', $immatriculation)->where('est_supprime', 0)
            ->selectRaw('COALESCE(SUM(litres), 0) as total_litres')
            ->first();

        $totalKm      = (float)($missions->total_km    ?? 0);
        $totalLitres  = (float)($carburant->total_litres ?? 0);
        $consoMoyenne = ($totalKm > 0) ? round($totalLitres / $totalKm * 100, 2) : 0;

        $maintenance = DB::table('interventions')
            ->where('vehicule_immatriculation', $immatriculation)->where('est_supprime', 0)
            ->selectRaw('COALESCE(SUM(cout_main_oeuvre + cout_pieces), 0) as cout_maintenance')
            ->first();

        $coutCarburant = DB::table('carnets_carburant')
            ->where('vehicule_immatriculation', $immatriculation)->where('est_supprime', 0)
            ->selectRaw('COALESCE(SUM(litres * prix_unitaire), 0) as total')
            ->value('total') ?? 0;

        return response()->json([
            'total_missions'       => (int)($missions->total_missions ?? 0),
            'total_km'             => (int)$totalKm,
            'total_litres'         => round($totalLitres, 2),
            'consommation_moyenne' => $consoMoyenne,
            'cout_maintenance'     => round((float)($maintenance->cout_maintenance ?? 0), 2),
            'cout_total'           => round((float)($maintenance->cout_maintenance ?? 0) + (float)$coutCarburant, 2),
        ]);
    }

    // =========================================================================
    // 11. DONNÉES DE RÉFÉRENCE — y compris CRUD affectations
    // =========================================================================

    public function references(): JsonResponse
    {
        $categories = DB::table('categories_vehicules')
            ->where('est_actif', 1)->whereNull('deleted_at')->orderBy('nom')
            ->select('id', 'nom', 'description')->get();

        $marques = DB::table('marques')
            ->where('est_actif', 1)->whereNull('deleted_at')->orderBy('nom')
            ->select('id', 'nom', 'pays_origine')->get();

        $modeles = DB::table('modeles as mo')
            ->join('marques as ma', 'ma.id', '=', 'mo.marque_id')
            ->where('mo.est_actif', 1)->whereNull('mo.deleted_at')
            ->orderBy('ma.nom')->orderBy('mo.nom')
            ->select(
                'mo.id', 'mo.nom', 'mo.marque_id',
                'ma.nom as marque_nom',
                'mo.type_carburant_defaut',
                'mo.nb_places_defaut',
                'mo.capacite_reservoir_defaut',
                'mo.consommation_moyenne_defaut'
            )->get();

        $directions = DB::table('directions')
            ->where('est_supprime', 0)->orderBy('nom')
            ->select('id', 'nom')->get();

        $annees = DB::table('annees')
            ->where('est_actif', 1)->orderBy('annee', 'desc')
            ->select('id', 'annee')->get();

        // ── Affectations ──────────────────────────────────────────────────────
        $affectations = DB::table('affectations')
            ->where('est_actif', 1)
            ->whereNull('deleted_at')
            ->orderBy('nom')
            ->select('id', 'nom', 'code', 'description')
            ->get();
        // ─────────────────────────────────────────────────────────────────────

        $chauffeurs = DB::table('utilisateurs as u')
            ->join('roles as r', 'r.id', '=', 'u.role_id')
            ->where('r.code', 'chauffeur')
            ->where('r.est_supprime', 0)
            ->where('u.est_actif', 1)
            ->where('u.est_supprime', 0)
            ->orderBy('u.nom')
            ->select('u.id', 'u.nom', 'u.email')
            ->get();

        return response()->json([
            'categories'   => $categories,
            'marques'      => $marques,
            'modeles'      => $modeles,
            'directions'   => $directions,
            'annees'       => $annees,
            'affectations' => $affectations,  // ← nouveau
            'chauffeurs'   => $chauffeurs,
        ]);
    }

    // =========================================================================
    // 12. CRUD AFFECTATIONS (référentiel)
    // =========================================================================

    /** GET  /admin/vehicules/references/affectations */
    public function indexAffectations(): JsonResponse
    {
        $items = DB::table('affectations')
            ->whereNull('deleted_at')
            ->orderBy('nom')
            ->select('id', 'nom', 'code', 'description', 'est_actif', 'created_at', 'updated_at')
            ->get();

        return response()->json($items);
    }

    /** POST /admin/vehicules/references/affectations */
    public function storeAffectation(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom'         => 'required|string|max:150|unique:affectations,nom',
            'code'        => 'nullable|string|max:30|unique:affectations,code',
            'description' => 'nullable|string|max:500',
        ]);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $id = DB::table('affectations')->insertGetId([
            'nom'         => trim($request->nom),
            'code'        => $request->filled('code') ? strtoupper(trim($request->code)) : null,
            'description' => $request->description ?: null,
            'est_actif'   => 1,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        $affectation = DB::table('affectations')->find($id);

        // ── AUDIT : ajout d'une affectation (référentiel) ───────────────────
        JournalAudit::tracer(
            $this->getAuthUserId(),
            'CREATE',
            'affectations',
            (string) $id,
            null,
            (array) $affectation,
            "Ajout de l'affectation \"{$affectation->nom}\""
        );
        // ─────────────────────────────────────────────────────────────────────

        return response()->json($affectation, 201);
    }

    /** PUT /admin/vehicules/references/affectations/{id} */
    public function updateAffectation(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom'         => 'required|string|max:150|unique:affectations,nom,' . $id,
            'code'        => 'nullable|string|max:30|unique:affectations,code,' . $id,
            'description' => 'nullable|string|max:500',
            'est_actif'   => 'nullable|boolean',
        ]);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $avant = DB::table('affectations')->where('id', $id)->whereNull('deleted_at')->first();
        if (!$avant) return response()->json(['message' => 'Affectation introuvable.'], 404);

        $updatedNom = trim($request->nom);

        DB::table('affectations')
            ->where('id', $id)->whereNull('deleted_at')
            ->update([
                'nom'         => $updatedNom,
                'code'        => $request->filled('code') ? strtoupper(trim($request->code)) : null,
                'description' => $request->description ?: null,
                'est_actif'   => $request->has('est_actif') ? (int)(bool)$request->est_actif : 1,
                'updated_at'  => now(),
            ]);

        // ── Mettre à jour le cache vehicules.affectation pour cette affectation ──
        DB::table('vehicules')
            ->where('affectation_id', $id)
            ->where('est_supprime', 0)
            ->update(['affectation' => $updatedNom, 'date_modification' => now()]);

        $affectation = DB::table('affectations')->find($id);

        // ── AUDIT : modification d'une affectation (référentiel) ────────────
        JournalAudit::tracer(
            $this->getAuthUserId(),
            'UPDATE',
            'affectations',
            (string) $id,
            (array) $avant,
            (array) $affectation,
            "Modification de l'affectation \"{$avant->nom}\"" . ($avant->nom !== $updatedNom ? " → \"{$updatedNom}\"" : '')
        );
        // ─────────────────────────────────────────────────────────────────────

        return response()->json($affectation);
    }

    /** DELETE /admin/vehicules/references/affectations/{id} */
    public function destroyAffectation(int $id): JsonResponse
    {
        $avant = DB::table('affectations')->where('id', $id)->whereNull('deleted_at')->first();
        if (!$avant) return response()->json(['message' => 'Affectation introuvable.'], 404);

        DB::table('affectations')
            ->where('id', $id)->whereNull('deleted_at')
            ->update(['deleted_at' => now(), 'est_actif' => 0, 'updated_at' => now()]);

        // Détacher tous les véhicules liés
        DB::table('vehicules')
            ->where('affectation_id', $id)
            ->where('est_supprime', 0)
            ->update(['affectation_id' => null, 'affectation' => null, 'date_modification' => now()]);

        // ── AUDIT : suppression d'une affectation (référentiel) ─────────────
        JournalAudit::tracer(
            $this->getAuthUserId(),
            'DELETE',
            'affectations',
            (string) $id,
            (array) $avant,
            null,
            "Suppression de l'affectation \"{$avant->nom}\""
        );
        // ─────────────────────────────────────────────────────────────────────

        return response()->json(['message' => 'Affectation supprimée et véhicules détachés.']);
    }

    // =========================================================================
    // 13. CRUD AUTRES RÉFÉRENCES (inchangé — non auditées volontairement,
    //     voir note en bas de réponse)
    // =========================================================================

    public function storeCategorie(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom'         => 'required|string|max:100|unique:categories_vehicules,nom',
            'description' => 'nullable|string|max:500',
        ]);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $id = DB::table('categories_vehicules')->insertGetId([
            'nom'         => $request->nom,
            'description' => $request->description ?: null,
            'est_actif'   => 1,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        return response()->json(['id' => $id, 'nom' => $request->nom, 'description' => $request->description], 201);
    }

    public function updateCategorie(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom'         => 'required|string|max:100|unique:categories_vehicules,nom,' . $id,
            'description' => 'nullable|string|max:500',
        ]);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $rows = DB::table('categories_vehicules')->where('id', $id)->whereNull('deleted_at')
            ->update(['nom' => $request->nom, 'description' => $request->description ?: null, 'updated_at' => now()]);

        if (!$rows) return response()->json(['message' => 'Catégorie introuvable.'], 404);
        return response()->json(['id' => $id, 'nom' => $request->nom]);
    }

    public function destroyCategorie(int $id): JsonResponse
    {
        $rows = DB::table('categories_vehicules')->where('id', $id)->whereNull('deleted_at')
            ->update(['deleted_at' => now(), 'est_actif' => 0, 'updated_at' => now()]);

        if (!$rows) return response()->json(['message' => 'Catégorie introuvable.'], 404);
        return response()->json(['message' => 'Catégorie supprimée.']);
    }

    public function storeMarque(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom'          => 'required|string|max:100|unique:marques,nom',
            'pays_origine' => 'nullable|string|max:100',
        ]);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $id = DB::table('marques')->insertGetId([
            'nom'          => $request->nom,
            'pays_origine' => $request->pays_origine ?: null,
            'est_actif'    => 1,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        return response()->json(['id' => $id, 'nom' => $request->nom, 'pays_origine' => $request->pays_origine], 201);
    }

    public function updateMarque(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom'          => 'required|string|max:100|unique:marques,nom,' . $id,
            'pays_origine' => 'nullable|string|max:100',
        ]);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $rows = DB::table('marques')->where('id', $id)->whereNull('deleted_at')
            ->update(['nom' => $request->nom, 'pays_origine' => $request->pays_origine ?: null, 'updated_at' => now()]);

        if (!$rows) return response()->json(['message' => 'Marque introuvable.'], 404);
        return response()->json(['id' => $id, 'nom' => $request->nom]);
    }

    public function destroyMarque(int $id): JsonResponse
    {
        $rows = DB::table('marques')->where('id', $id)->whereNull('deleted_at')
            ->update(['deleted_at' => now(), 'est_actif' => 0, 'updated_at' => now()]);

        if (!$rows) return response()->json(['message' => 'Marque introuvable.'], 404);
        return response()->json(['message' => 'Marque supprimée.']);
    }

    public function storeModele(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'marque_id'                   => 'required|integer|exists:marques,id',
            'categorie_id'                => 'required|integer|exists:categories_vehicules,id',
            'nom'                         => 'required|string|max:100',
            'nb_places_defaut'            => 'nullable|integer|min:1|max:100',
            'type_carburant_defaut'       => 'nullable|string|in:diesel,essence,hybride,electrique',
            'capacite_reservoir_defaut'   => 'nullable|integer|min:0',
            'consommation_moyenne_defaut' => 'nullable|numeric|min:0',
        ]);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $exists = DB::table('modeles')
            ->where('marque_id', $request->marque_id)->where('nom', $request->nom)
            ->whereNull('deleted_at')->exists();
        if ($exists) return response()->json(['errors' => ['nom' => ['Ce modèle existe déjà pour cette marque.']]], 422);

        $id = DB::table('modeles')->insertGetId([
            'marque_id'                   => $request->marque_id,
            'categorie_id'                => $request->categorie_id,
            'nom'                         => $request->nom,
            'nb_places_defaut'            => $request->nb_places_defaut ?? 5,
            'type_carburant_defaut'       => $request->type_carburant_defaut       ?: null,
            'capacite_reservoir_defaut'   => $request->capacite_reservoir_defaut   ?: null,
            'consommation_moyenne_defaut' => $request->consommation_moyenne_defaut ?: null,
            'est_actif'                   => 1,
            'created_at'                  => now(),
            'updated_at'                  => now(),
        ]);

        $modele = DB::table('modeles as mo')
            ->join('marques as ma', 'ma.id', '=', 'mo.marque_id')
            ->where('mo.id', $id)
            ->select(
                'mo.id', 'mo.nom', 'mo.marque_id', 'ma.nom as marque_nom',
                'mo.type_carburant_defaut', 'mo.nb_places_defaut',
                'mo.capacite_reservoir_defaut', 'mo.consommation_moyenne_defaut'
            )->first();

        return response()->json($modele, 201);
    }

    public function updateModele(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom'                         => 'required|string|max:100',
            'categorie_id'                => 'nullable|integer|exists:categories_vehicules,id',
            'nb_places_defaut'            => 'nullable|integer|min:1|max:100',
            'type_carburant_defaut'       => 'nullable|string|in:diesel,essence,hybride,electrique',
            'capacite_reservoir_defaut'   => 'nullable|integer|min:0',
            'consommation_moyenne_defaut' => 'nullable|numeric|min:0',
        ]);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $data = ['nom' => $request->nom, 'updated_at' => now()];
        if ($request->has('categorie_id'))                $data['categorie_id']               = $request->categorie_id;
        if ($request->has('nb_places_defaut'))            $data['nb_places_defaut']           = $request->nb_places_defaut ?? 5;
        if ($request->has('type_carburant_defaut'))       $data['type_carburant_defaut']      = $request->type_carburant_defaut      ?: null;
        if ($request->has('capacite_reservoir_defaut'))   $data['capacite_reservoir_defaut']  = $request->capacite_reservoir_defaut  ?: null;
        if ($request->has('consommation_moyenne_defaut')) $data['consommation_moyenne_defaut']= $request->consommation_moyenne_defaut ?: null;

        $rows = DB::table('modeles')->where('id', $id)->whereNull('deleted_at')->update($data);
        if (!$rows) return response()->json(['message' => 'Modèle introuvable.'], 404);
        return response()->json(['id' => $id, 'nom' => $request->nom]);
    }

    public function destroyModele(int $id): JsonResponse
    {
        $rows = DB::table('modeles')->where('id', $id)->whereNull('deleted_at')
            ->update(['deleted_at' => now(), 'est_actif' => 0, 'updated_at' => now()]);

        if (!$rows) return response()->json(['message' => 'Modèle introuvable.'], 404);
        return response()->json(['message' => 'Modèle supprimé.']);
    }

    public function storeAnnee(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'annee' => 'required|integer|min:1900|max:2100|unique:annees,annee',
        ]);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $id = DB::table('annees')->insertGetId([
            'annee'      => $request->annee,
            'est_actif'  => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['id' => $id, 'annee' => $request->annee], 201);
    }

    public function destroyAnnee(int $id): JsonResponse
    {
        $rows = DB::table('annees')->where('id', $id)
            ->update(['est_actif' => 0, 'updated_at' => now()]);

        if (!$rows) return response()->json(['message' => 'Année introuvable.'], 404);
        return response()->json(['message' => 'Année désactivée.']);
    }

    // =========================================================================
    // HELPERS PRIVÉS
    // =========================================================================

    private function assertVehiculeExists(string $immatriculation): void
    {
        if (!DB::table('vehicules')
            ->where('immatriculation', $immatriculation)->where('est_supprime', 0)->exists()) {
            abort(404, 'Véhicule introuvable.');
        }
    }

    private function uploadImage($file): string
    {
        return $file->storeAs(
            self::IMAGE_DISK_PATH,
            Str::uuid() . '.' . $file->getClientOriginalExtension(),
            'public'
        );
    }

    private function buildFileUrl(string $chemin): string
    {
        if (!$chemin) return '';
        if (filter_var($chemin, FILTER_VALIDATE_URL)) return $chemin;
        return config('app.url') . '/storage/' . ltrim($chemin, '/');
    }

    private function resolveMarqueId(?string $nom): ?int
    {
        if (!$nom) return null;
        return DB::table('marques')->where('nom', $nom)->whereNull('deleted_at')->value('id');
    }

    private function resolveModeleId(?string $nom, ?int $marqueId): ?int
    {
        if (!$nom) return null;
        $q = DB::table('modeles')->where('nom', $nom)->whereNull('deleted_at');
        if ($marqueId) $q->where('marque_id', $marqueId);
        return $q->value('id');
    }

    private function resolveCategorieId(?string $nom): ?int
    {
        if (!$nom) return null;
        return DB::table('categories_vehicules')->where('nom', $nom)->whereNull('deleted_at')->value('id');
    }

    private function resolveDirectionId(?string $nom): ?int
    {
        if (!$nom) return null;
        return DB::table('directions')->where('nom', $nom)->where('est_supprime', 0)->value('id');
    }

    private function resolveAnneeId(?int $annee): ?int
    {
        if (!$annee) return null;
        $id = DB::table('annees')->where('annee', $annee)->value('id');
        if (!$id) {
            $id = DB::table('annees')->insertGetId([
                'annee'      => $annee,
                'est_actif'  => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        return $id;
    }
}