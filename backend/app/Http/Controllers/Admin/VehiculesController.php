<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
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
 * Gère tout le CRUD du module Véhicules côté admin :
 *  - Liste paginée + filtres
 *  - Détail complet (fiche véhicule)
 *  - Création / Modification / Suppression (soft delete)
 *  - Changement de statut
 *  - Documents (upload, liste, modification, suppression)
 *  - Maintenances (interventions)
 *  - Missions
 *  - Carburant (CRUD complet)
 *  - Statistiques
 *  - Données de référence (catégories, marques, modèles, directions)
 */
class VehiculesController extends Controller
{
    // =========================================================================
    // CONSTANTES
    // =========================================================================
    private const MAX_FILE_SIZE        = 10 * 1024;   // 10 Mo en Ko
    private const ALLOWED_DOC_MIMES    = 'pdf,doc,docx,xls,xlsx,png,jpg,jpeg,webp';
    private const ALLOWED_IMAGE_MIMES  = 'jpg,jpeg,png,webp';
    private const IMAGE_DISK_PATH      = 'upload/admin/images/vehicules';
    private const DOC_DISK_PATH        = 'upload/admin/document/vehicules';

    // Mapping statuts frontend → DB
    private const STATUTS_MAP = [
        'Disponible'    => 'disponible',
        'En Mission'    => 'en_mission',
        'Maintenance'   => 'en_maintenance',
        'Immobilisé'    => 'immobilise',
        'disponible'    => 'disponible',
        'en_mission'    => 'en_mission',
        'en_maintenance'=> 'en_maintenance',
        'immobilise'    => 'immobilise',
    ];

    // =========================================================================
    // HELPERS PRIVÉS
    // =========================================================================

    /**
     * Retourne l'ID de l'utilisateur authentifié de façon sécurisée.
     */
    private function getAuthUserId(): ?int
    {
        $user = auth()->user();
        if (!$user) return null;

        foreach (['id', 'user_id', 'utilisateur_id'] as $prop) {
            if (isset($user->{$prop})) {
                return (int) $user->{$prop};
            }
        }

        return null;
    }

    /**
     * Convertit un véhicule DB (avec joins) en format attendu par le frontend.
     */
    private function formatVehicule(object $v): array
    {
        $statutLabel = [
            'disponible'     => 'Disponible',
            'en_mission'     => 'En Mission',
            'en_maintenance' => 'Maintenance',
            'immobilise'     => 'Immobilisé',
        ][$v->statut] ?? ucfirst($v->statut);

        return [
            'immatriculation'  => $v->immatriculation,
            'marque'           => $v->marque_nom    ?? null,
            'modele'           => $v->modele_nom    ?? null,
            'categorie'        => $v->categorie_nom ?? null,
            'annee'            => $v->annee_val     ?? null,
            'direction'        => $v->direction_nom ?? null,
            'kilometrage'      => (int)($v->kilometrage ?? 0),
            'statut'           => $statutLabel,
            'chauffeur'        => $v->chauffeur_nom ?? null,
            'carburant'        => 'Diesel',
            'puissance'        => $v->nb_places ? $v->nb_places . ' places' : null,
            'couleur'          => $v->notes ?? null,
            'dateAchat'        => $v->date_acquisition ?? null,
            'prixAchat'        => (float)($v->cout_acquisition ?? 0),
            'assuranceExpire'  => $v->date_expiration_assurance ?? null,
            'visiteExpire'     => $v->date_expiration_visite_technique ?? null,
            'image'            => $v->photo
                                    ? (filter_var($v->photo, FILTER_VALIDATE_URL)
                                        ? $v->photo
                                        : Storage::url($v->photo))
                                    : null,
            'numero_chassis'   => $v->numero_chassis ?? null,
            'nb_places'        => (int)($v->nb_places ?? 5),
            'consommation_moyenne' => $v->consommation_moyenne,
            'valeur_residuelle'    => $v->valeur_residuelle,
            'est_actif'        => (bool)$v->est_actif,
        ];
    }

    /**
     * Requête de base véhicules avec tous les joins nécessaires.
     */
    private function baseQuery()
    {
        return DB::table('vehicules as v')
            ->leftJoin('marques as ma', 'ma.id', '=', 'v.marque_id')
            ->leftJoin('modeles as mo', 'mo.id', '=', 'v.modele_id')
            ->leftJoin('categories_vehicules as ca', 'ca.id', '=', 'v.categorie_id')
            ->leftJoin('annees as an', 'an.id', '=', 'v.annee_id')
            ->leftJoin('directions as di', 'di.id', '=', 'v.direction_id')
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
                'v.kilometrage',
                'v.statut',
                'v.nb_places',
                'v.consommation_moyenne',
                'v.date_acquisition',
                'v.date_expiration_assurance',
                'v.date_expiration_visite_technique',
                'v.cout_acquisition',
                'v.valeur_residuelle',
                'v.photo',
                'v.notes',
                'v.est_actif',
                'ma.nom as marque_nom',
                'mo.nom as modele_nom',
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
        $perPage = (int)$request->get('per_page', 6);
        $perPage = min(max($perPage, 1), 100);

        $query = $this->baseQuery();

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('v.immatriculation', 'LIKE', "%{$search}%")
                  ->orWhere('ma.nom', 'LIKE', "%{$search}%")
                  ->orWhere('mo.nom', 'LIKE', "%{$search}%")
                  ->orWhere('di.nom', 'LIKE', "%{$search}%");
            });
        }

        if ($categorie = $request->get('categorie')) {
            $query->where('ca.nom', $categorie);
        }

        if ($marque = $request->get('marque')) {
            $query->where('ma.nom', $marque);
        }

        if ($modele = $request->get('modele')) {
            $query->where('mo.nom', $modele);
        }

        if ($statutLabel = $request->get('statut')) {
            $statutDB = self::STATUTS_MAP[$statutLabel] ?? strtolower($statutLabel);
            $query->where('v.statut', $statutDB);
        }

        $total    = $query->count();
        $vehicles = $query
            ->orderBy('v.date_modification', 'desc')
            ->paginate($perPage);

        $data = collect($vehicles->items())->map(fn($v) => $this->formatVehicule($v))->values();

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
        $v = $this->baseQuery()
            ->where('v.immatriculation', $immatriculation)
            ->first();

        if (!$v) {
            return response()->json(['message' => 'Véhicule introuvable.'], 404);
        }

        return response()->json($this->formatVehicule($v));
    }

    // =========================================================================
    // 3. CRÉER UN VÉHICULE
    // =========================================================================

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'immatriculation' => 'required|string|max:30|unique:vehicules,immatriculation',
            'marque'          => 'required|string|max:100',
            'modele'          => 'required|string|max:100',
            'categorie'       => 'required|string|max:100',
            'direction'       => 'required|string|max:150',
            'annee'           => 'nullable|integer|min:1900|max:2100',
            'kilometrage'     => 'nullable|integer|min:0',
            'statut'          => 'nullable|string',
            'carburant'       => 'nullable|string|max:50',
            'puissance'       => 'nullable|string|max:50',
            'couleur'         => 'nullable|string|max:50',
            'dateAchat'       => 'nullable|date',
            'prixAchat'       => 'nullable|numeric|min:0',
            'assuranceExpire' => 'nullable|date',
            'visiteExpire'    => 'nullable|date',
            'image'           => 'nullable|file|mimes:' . self::ALLOWED_IMAGE_MIMES . '|max:' . self::MAX_FILE_SIZE,
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $marqueId    = $this->resolveMarqueId($request->marque);
        $modeleId    = $this->resolveModeleId($request->modele, $marqueId);
        $categorieId = $this->resolveCategorieId($request->categorie);
        $directionId = $this->resolveDirectionId($request->direction);
        $anneeId     = $this->resolveAnneeId($request->annee);

        $statutDB = self::STATUTS_MAP[$request->get('statut', 'Disponible')] ?? 'disponible';

        $photoPath = null;
        if ($request->hasFile('image')) {
            $photoPath = $this->uploadImage($request->file('image'));
        }

        DB::table('vehicules')->insert([
            'immatriculation'                   => strtoupper(trim($request->immatriculation)),
            'marque_id'                         => $marqueId,
            'modele_id'                         => $modeleId,
            'categorie_id'                      => $categorieId,
            'direction_id'                      => $directionId,
            'annee_id'                          => $anneeId,
            'kilometrage'                       => (int)($request->kilometrage ?? 0),
            'statut'                            => $statutDB,
            'cout_acquisition'                  => (float)($request->prixAchat ?? 0),
            'date_acquisition'                  => $request->dateAchat ?: null,
            'date_expiration_assurance'         => $request->assuranceExpire ?: null,
            'date_expiration_visite_technique'  => $request->visiteExpire ?: null,
            'notes'                             => $request->couleur,
            'photo'                             => $photoPath,
            'est_actif'                         => 1,
            'est_supprime'                      => 0,
            'date_creation'                     => now(),
            'date_modification'                 => now(),
        ]);

        $vehicule = $this->baseQuery()
            ->where('v.immatriculation', strtoupper(trim($request->immatriculation)))
            ->first();

        return response()->json($this->formatVehicule($vehicule), 201);
    }

    // =========================================================================
    // 4. MODIFIER UN VÉHICULE
    // =========================================================================

    public function update(Request $request, string $immatriculation): JsonResponse
    {
        $exists = DB::table('vehicules')
            ->where('immatriculation', $immatriculation)
            ->where('est_supprime', 0)
            ->exists();

        if (!$exists) {
            return response()->json(['message' => 'Véhicule introuvable.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'marque'          => 'nullable|string|max:100',
            'modele'          => 'nullable|string|max:100',
            'categorie'       => 'nullable|string|max:100',
            'direction'       => 'nullable|string|max:150',
            'annee'           => 'nullable|integer|min:1900|max:2100',
            'kilometrage'     => 'nullable|integer|min:0',
            'statut'          => 'nullable|string',
            'chauffeur'       => 'nullable|string|max:100',
            'couleur'         => 'nullable|string|max:50',
            'dateAchat'       => 'nullable|date',
            'prixAchat'       => 'nullable|numeric|min:0',
            'assuranceExpire' => 'nullable|date',
            'visiteExpire'    => 'nullable|date',
            'image'           => 'nullable|file|mimes:' . self::ALLOWED_IMAGE_MIMES . '|max:' . self::MAX_FILE_SIZE,
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $updateData = ['date_modification' => now()];

        if ($request->filled('marque')) {
            $marqueId = $this->resolveMarqueId($request->marque);
            $updateData['marque_id'] = $marqueId;

            if ($request->filled('modele')) {
                $updateData['modele_id'] = $this->resolveModeleId($request->modele, $marqueId);
            }
        }

        if ($request->filled('categorie')) {
            $updateData['categorie_id'] = $this->resolveCategorieId($request->categorie);
        }

        if ($request->filled('direction')) {
            $updateData['direction_id'] = $this->resolveDirectionId($request->direction);
        }

        if ($request->filled('annee')) {
            $updateData['annee_id'] = $this->resolveAnneeId($request->annee);
        }

        if ($request->has('kilometrage')) {
            $updateData['kilometrage'] = (int)$request->kilometrage;
            $updateData['date_maj_km'] = now()->toDateString();
        }

        if ($request->filled('statut')) {
            $updateData['statut'] = self::STATUTS_MAP[$request->statut] ?? 'disponible';
        }

        if ($request->has('couleur')) {
            $updateData['notes'] = $request->couleur;
        }

        if ($request->has('dateAchat')) {
            $updateData['date_acquisition'] = $request->dateAchat ?: null;
        }

        if ($request->has('prixAchat')) {
            $updateData['cout_acquisition'] = (float)$request->prixAchat;
        }

        if ($request->has('assuranceExpire')) {
            $updateData['date_expiration_assurance'] = $request->assuranceExpire ?: null;
        }

        if ($request->has('visiteExpire')) {
            $updateData['date_expiration_visite_technique'] = $request->visiteExpire ?: null;
        }

        if ($request->hasFile('image')) {
            $old = DB::table('vehicules')->where('immatriculation', $immatriculation)->value('photo');
            if ($old && !filter_var($old, FILTER_VALIDATE_URL) && Storage::disk('public')->exists($old)) {
                Storage::disk('public')->delete($old);
            }
            $updateData['photo'] = $this->uploadImage($request->file('image'));
        }

        DB::table('vehicules')
            ->where('immatriculation', $immatriculation)
            ->update($updateData);

        $vehicule = $this->baseQuery()->where('v.immatriculation', $immatriculation)->first();

        return response()->json($this->formatVehicule($vehicule));
    }

    // =========================================================================
    // 5. SUPPRIMER UN VÉHICULE (soft delete)
    // =========================================================================

    public function destroy(string $immatriculation): JsonResponse
    {
        $rows = DB::table('vehicules')
            ->where('immatriculation', $immatriculation)
            ->where('est_supprime', 0)
            ->update([
                'est_supprime'     => 1,
                'date_suppression' => now(),
                'date_modification'=> now(),
            ]);

        if (!$rows) {
            return response()->json(['message' => 'Véhicule introuvable.'], 404);
        }

        return response()->json(['message' => 'Véhicule supprimé avec succès.']);
    }

    // =========================================================================
    // 6. CHANGER LE STATUT D'UN VÉHICULE
    // =========================================================================

    public function updateStatut(Request $request, string $immatriculation): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'statut' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $statutDB = self::STATUTS_MAP[$request->statut] ?? null;
        if (!$statutDB) {
            return response()->json(['message' => 'Statut invalide.'], 422);
        }

        $rows = DB::table('vehicules')
            ->where('immatriculation', $immatriculation)
            ->where('est_supprime', 0)
            ->update([
                'statut'            => $statutDB,
                'date_modification' => now(),
            ]);

        if (!$rows) {
            return response()->json(['message' => 'Véhicule introuvable.'], 404);
        }

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
                    if ($diff < 0) {
                        $statut = 'expire';
                    } elseif ($diff <= 30) {
                        $statut = 'expire_bientot';
                    }
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

    /**
     * POST /api/admin/vehicules/{immatriculation}/documents
     */
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

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $file     = $request->file('fichier');
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path     = $file->storeAs(self::DOC_DISK_PATH, $filename, 'public');

        $nomDocument = $request->get('nom_document')
            ?: ($request->type_document . ' — ' . $immatriculation);

        $userId = $this->getAuthUserId();

        $id = DB::table('documents_vehicules')->insertGetId([
            'vehicule_immatriculation' => $immatriculation,
            'type_document'            => $request->type_document,
            'nom_document'             => $nomDocument,
            'chemin_fichier'           => $path,
            'compagnie_assurance'      => $request->compagnie_assurance,
            'numero_contrat'           => $request->numero_contrat,
            'type_couverture'          => $request->type_couverture,
            'montant_prime'            => $request->montant_prime,
            'date_emission'            => $request->date_emission ?: null,
            'date_expiration'          => $request->date_expiration ?: null,
            'telecharge_par_user_id'   => $userId,
            'notes'                    => $request->notes,
            'est_supprime'             => 0,
            'date_creation'            => now(),
            'date_modification'        => now(),
        ]);

        // ── NOTIFICATIONS AUTOMATIQUES ────────────────────────────────────────
        if ($request->filled('date_expiration')) {
            try {
                (new DocumentExpirationController())->notifierDocument($id);
            } catch (\Throwable $e) {
                Log::error(
                    "[storeDocument] Échec notification doc#{$id} véhicule {$immatriculation} | {$e->getMessage()}"
                );
            }
        }
        // ─────────────────────────────────────────────────────────────────────

        $doc = DB::table('documents_vehicules')->find($id);

        return response()->json([
            'id'             => $doc->id,
            'nom_document'   => $doc->nom_document,
            'type_document'  => $doc->type_document,
            'url_fichier'    => $this->buildFileUrl($doc->chemin_fichier),
            'date_expiration'=> $doc->date_expiration,
            'statut'         => 'valide',
        ], 201);
    }

    /**
     * PUT /api/admin/vehicules/{immatriculation}/documents/{documentId}
     *
     * Modifie les métadonnées d'un document (et optionnellement remplace le fichier).
     * Si un nouveau fichier est fourni, l'ancien est supprimé du disque.
     */
    public function updateDocument(Request $request, string $immatriculation, int $documentId): JsonResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $doc = DB::table('documents_vehicules')
            ->where('id', $documentId)
            ->where('vehicule_immatriculation', $immatriculation)
            ->where('est_supprime', 0)
            ->first();

        if (!$doc) {
            return response()->json(['message' => 'Document introuvable.'], 404);
        }

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

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $updateData = ['date_modification' => now()];

        if ($request->filled('type_document')) {
            $updateData['type_document'] = $request->type_document;
        }

        if ($request->filled('nom_document')) {
            $updateData['nom_document'] = $request->nom_document;
        }

        if ($request->has('compagnie_assurance')) {
            $updateData['compagnie_assurance'] = $request->compagnie_assurance;
        }

        if ($request->has('numero_contrat')) {
            $updateData['numero_contrat'] = $request->numero_contrat;
        }

        if ($request->has('type_couverture')) {
            $updateData['type_couverture'] = $request->type_couverture;
        }

        if ($request->has('montant_prime')) {
            $updateData['montant_prime'] = $request->montant_prime;
        }

        if ($request->has('date_emission')) {
            $updateData['date_emission'] = $request->date_emission ?: null;
        }

        if ($request->has('date_expiration')) {
            $updateData['date_expiration'] = $request->date_expiration ?: null;
        }

        if ($request->has('notes')) {
            $updateData['notes'] = $request->notes;
        }

        // Remplacement du fichier si un nouveau est envoyé
        if ($request->hasFile('fichier')) {
            // Suppression de l'ancien fichier du disque
            if ($doc->chemin_fichier && !filter_var($doc->chemin_fichier, FILTER_VALIDATE_URL)
                && Storage::disk('public')->exists($doc->chemin_fichier)) {
                Storage::disk('public')->delete($doc->chemin_fichier);
            }

            $file     = $request->file('fichier');
            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $updateData['chemin_fichier'] = $file->storeAs(self::DOC_DISK_PATH, $filename, 'public');
        }

        DB::table('documents_vehicules')
            ->where('id', $documentId)
            ->update($updateData);

        // Re-déclencher les notifications si la date d'expiration a changé
        if ($request->has('date_expiration') && $request->filled('date_expiration')) {
            try {
                (new DocumentExpirationController())->notifierDocument($documentId);
            } catch (\Throwable $e) {
                Log::error(
                    "[updateDocument] Échec notification doc#{$documentId} véhicule {$immatriculation} | {$e->getMessage()}"
                );
            }
        }

        $updated = DB::table('documents_vehicules')->find($documentId);

        $statut = 'valide';
        if ($updated->date_expiration) {
            $diff = now()->diffInDays($updated->date_expiration, false);
            if ($diff < 0) {
                $statut = 'expire';
            } elseif ($diff <= 30) {
                $statut = 'expire_bientot';
            }
        }

        return response()->json([
            'id'                  => $updated->id,
            'vehicule_immatriculation' => $updated->vehicule_immatriculation,
            'type_document'       => $updated->type_document,
            'nom_document'        => $updated->nom_document,
            'chemin_fichier'      => $updated->chemin_fichier,
            'url_fichier'         => $this->buildFileUrl($updated->chemin_fichier),
            'compagnie_assurance' => $updated->compagnie_assurance,
            'numero_contrat'      => $updated->numero_contrat,
            'type_couverture'     => $updated->type_couverture,
            'montant_prime'       => $updated->montant_prime,
            'date_emission'       => $updated->date_emission,
            'date_expiration'     => $updated->date_expiration,
            'statut'              => $statut,
            'notes'               => $updated->notes,
            'date_creation'       => $updated->date_creation,
            'date_modification'   => $updated->date_modification,
        ]);
    }

    public function destroyDocument(string $immatriculation, int $documentId): JsonResponse
    {
        $doc = DB::table('documents_vehicules')
            ->where('id', $documentId)
            ->where('vehicule_immatriculation', $immatriculation)
            ->where('est_supprime', 0)
            ->first();

        if (!$doc) {
            return response()->json(['message' => 'Document introuvable.'], 404);
        }

        if ($doc->chemin_fichier && Storage::disk('public')->exists($doc->chemin_fichier)) {
            Storage::disk('public')->delete($doc->chemin_fichier);
        }

        DB::table('documents_vehicules')
            ->where('id', $documentId)
            ->update([
                'est_supprime'     => 1,
                'date_suppression' => now(),
                'date_modification'=> now(),
            ]);

        return response()->json(['message' => 'Document supprimé.']);
    }

    public function openDocument(string $immatriculation, int $documentId): JsonResponse
    {
        $doc = DB::table('documents_vehicules')
            ->where('id', $documentId)
            ->where('vehicule_immatriculation', $immatriculation)
            ->where('est_supprime', 0)
            ->first();

        if (!$doc) {
            return response()->json(['message' => 'Document introuvable.'], 404);
        }

        return response()->json([
            'url' => $this->buildFileUrl($doc->chemin_fichier),
            'nom' => $doc->nom_document,
        ]);
    }

    // =========================================================================
    // 8. MAINTENANCES D'UN VÉHICULE
    // =========================================================================

    public function maintenances(string $immatriculation): JsonResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $items = DB::table('interventions as i')
            ->leftJoin('intervenants as in2', 'in2.id', '=', 'i.intervenant_id')
            ->where('i.vehicule_immatriculation', $immatriculation)
            ->where('i.est_supprime', 0)
            ->orderBy('i.date_debut', 'desc')
            ->select(
                'i.id',
                'i.type_intervention',
                'i.severite',
                'i.date_debut',
                'i.date_fin',
                'i.km_au_moment_intervention',
                'i.diagnostic',
                'i.resultat',
                'i.cout_main_oeuvre',
                'i.cout_pieces',
                'i.statut',
                'i.notes',
                'in2.nom_externe as intervenant_nom'
            )
            ->get();

        return response()->json($items);
    }

    public function storeMaintenance(Request $request, string $immatriculation): JsonResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $validator = Validator::make($request->all(), [
            'type_intervention'          => 'required|string|max:100',
            'intervenant_id'             => 'required|integer|exists:intervenants,id',
            'severite'                   => 'nullable|string|in:faible,normale,haute,critique',
            'date_debut'                 => 'nullable|date',
            'date_fin'                   => 'nullable|date|after_or_equal:date_debut',
            'km_au_moment_intervention'  => 'nullable|integer|min:0',
            'diagnostic'                 => 'nullable|string',
            'cout_main_oeuvre'           => 'nullable|numeric|min:0',
            'statut'                     => 'nullable|string|in:planifiee,en_cours,terminee,annulee',
            'notes'                      => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $id = DB::table('interventions')->insertGetId([
            'vehicule_immatriculation'    => $immatriculation,
            'intervenant_id'              => $request->intervenant_id,
            'type_intervention'           => $request->type_intervention,
            'severite'                    => $request->get('severite', 'normale'),
            'date_debut'                  => $request->date_debut ?: null,
            'date_fin'                    => $request->date_fin ?: null,
            'km_au_moment_intervention'   => $request->km_au_moment_intervention,
            'diagnostic'                  => $request->diagnostic,
            'cout_main_oeuvre'            => (float)($request->cout_main_oeuvre ?? 0),
            'cout_pieces'                 => 0,
            'resultat'                    => 'en_attente',
            'statut'                      => $request->get('statut', 'planifiee'),
            'notes'                       => $request->notes,
            'est_supprime'                => 0,
            'date_creation'               => now(),
            'date_modification'           => now(),
        ]);

        return response()->json(
            DB::table('interventions')->find($id),
            201
        );
    }

    // =========================================================================
    // 9. MISSIONS D'UN VÉHICULE
    // =========================================================================

    public function missions(string $immatriculation): JsonResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $items = DB::table('missions as m')
            ->leftJoin('utilisateurs as u', 'u.id', '=', 'm.chauffeur_user_id')
            ->leftJoin('directions as d', 'd.id', '=', 'm.direction_id')
            ->where('m.vehicule_immatriculation', $immatriculation)
            ->where('m.est_supprime', 0)
            ->orderBy('m.date_depart_prevue', 'desc')
            ->select(
                'm.id',
                'm.type_mission',
                'm.destination',
                'm.date_depart_prevue',
                'm.date_depart_reelle',
                'm.date_retour_reelle',
                'm.km_depart',
                'm.km_retour',
                'm.carburant_consomme',
                'm.cout_carburant',
                'm.statut',
                'm.reference_mission',
                'm.observations',
                'u.nom as chauffeur_nom',
                'd.nom as direction_nom'
            )
            ->get();

        return response()->json($items);
    }

    // =========================================================================
    // 10. CARBURANT D'UN VÉHICULE (CRUD COMPLET)
    // =========================================================================

    /**
     * GET /api/admin/vehicules/{immatriculation}/carburant
     *
     * Liste tous les pleins du véhicule, enrichis avec le nom de la mission si liée.
     */
    public function carburant(string $immatriculation): JsonResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $items = DB::table('carnets_carburant as cc')
            ->leftJoin('missions as m', 'm.id', '=', 'cc.mission_id')
            ->where('cc.vehicule_immatriculation', $immatriculation)
            ->where('cc.est_supprime', 0)
            ->orderBy('cc.date_plein', 'desc')
            ->select(
                'cc.id',
                'cc.vehicule_immatriculation',
                'cc.mission_id',
                'm.reference_mission as mission_reference',
                'm.destination     as mission_destination',
                'cc.date_plein',
                'cc.kilometrage',
                'cc.litres',
                'cc.prix_unitaire',
                'cc.station',
                'cc.chemin_recu',
                'cc.km_depuis_dernier_plein',
                'cc.consommation_calculee',
                'cc.notes',
                'cc.date_creation'
            )
            ->get()
            ->map(function ($item) {
                $item->cout_total = ($item->litres && $item->prix_unitaire)
                    ? round((float)$item->litres * (float)$item->prix_unitaire, 2)
                    : null;
                return $item;
            });

        return response()->json($items);
    }

    /**
     * POST /api/admin/vehicules/{immatriculation}/carburant
     *
     * Crée un nouveau plein. Le kilométrage est récupéré depuis la table véhicules
     * si non fourni. La consommation est calculée automatiquement.
     */
    public function storeCarburant(Request $request, string $immatriculation): JsonResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $validator = Validator::make($request->all(), [
            'date_plein'    => 'required|date',
            'litres'        => 'required|numeric|min:0.01',
            'prix_unitaire' => 'nullable|numeric|min:0',
            'station'       => 'nullable|string|max:200',
            'kilometrage'   => 'nullable|integer|min:0',
            'mission_id'    => 'nullable|integer|exists:missions,id',
            'notes'         => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Kilométrage : utiliser celui fourni ou récupérer depuis le véhicule
        $kilometrage = $request->filled('kilometrage')
            ? (int)$request->kilometrage
            : (int)DB::table('vehicules')->where('immatriculation', $immatriculation)->value('kilometrage');

        // Vérification cohérence mission/véhicule
        if ($request->filled('mission_id')) {
            $missionOk = DB::table('missions')
                ->where('id', $request->mission_id)
                ->where('vehicule_immatriculation', $immatriculation)
                ->where('est_supprime', 0)
                ->exists();

            if (!$missionOk) {
                return response()->json([
                    'message' => 'La mission spécifiée n\'appartient pas à ce véhicule.',
                ], 422);
            }
        }

        // Dernier plein pour calculer km_depuis_dernier_plein et consommation
        $dernierPlein = DB::table('carnets_carburant')
            ->where('vehicule_immatriculation', $immatriculation)
            ->where('est_supprime', 0)
            ->orderBy('date_plein', 'desc')
            ->orderBy('id', 'desc')
            ->first();

        $kmDepuisDernier  = null;
        $consommationCalc = null;

        if ($dernierPlein && $dernierPlein->kilometrage && $kilometrage > $dernierPlein->kilometrage) {
            $kmDepuisDernier = $kilometrage - (int)$dernierPlein->kilometrage;

            // Consommation en L/100km
            if ($kmDepuisDernier > 0) {
                $consommationCalc = round(((float)$request->litres / $kmDepuisDernier) * 100, 2);
            }
        }

        $id = DB::table('carnets_carburant')->insertGetId([
            'vehicule_immatriculation' => $immatriculation,
            'mission_id'               => $request->mission_id ?: null,
            'date_plein'               => $request->date_plein,
            'kilometrage'              => $kilometrage,
            'litres'                   => $request->litres,
            'prix_unitaire'            => $request->prix_unitaire ?: null,
            'station'                  => $request->station ?: null,
            'km_depuis_dernier_plein'  => $kmDepuisDernier,
            'consommation_calculee'    => $consommationCalc,
            'notes'                    => $request->notes ?: null,
            'est_supprime'             => 0,
            'date_creation'            => now(),
        ]);

        // Mise à jour du kilométrage du véhicule si le nouveau km est supérieur
        $kmActuel = (int)DB::table('vehicules')->where('immatriculation', $immatriculation)->value('kilometrage');
        if ($kilometrage > $kmActuel) {
            DB::table('vehicules')
                ->where('immatriculation', $immatriculation)
                ->update([
                    'kilometrage'      => $kilometrage,
                    'date_maj_km'      => now()->toDateString(),
                    'date_modification' => now(),
                ]);
        }

        $record = DB::table('carnets_carburant as cc')
            ->leftJoin('missions as m', 'm.id', '=', 'cc.mission_id')
            ->where('cc.id', $id)
            ->select(
                'cc.*',
                'm.reference_mission as mission_reference',
                'm.destination as mission_destination'
            )
            ->first();

        return response()->json($record, 201);
    }

    /**
     * PUT /api/admin/vehicules/{immatriculation}/carburant/{carburantId}
     *
     * Modifie un enregistrement de carburant existant et recalcule la consommation.
     */
    public function updateCarburant(Request $request, string $immatriculation, int $carburantId): JsonResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $record = DB::table('carnets_carburant')
            ->where('id', $carburantId)
            ->where('vehicule_immatriculation', $immatriculation)
            ->where('est_supprime', 0)
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Enregistrement carburant introuvable.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'date_plein'    => 'nullable|date',
            'litres'        => 'nullable|numeric|min:0.01',
            'prix_unitaire' => 'nullable|numeric|min:0',
            'station'       => 'nullable|string|max:200',
            'kilometrage'   => 'nullable|integer|min:0',
            'mission_id'    => 'nullable|integer|exists:missions,id',
            'notes'         => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Vérification cohérence mission/véhicule
        if ($request->filled('mission_id')) {
            $missionOk = DB::table('missions')
                ->where('id', $request->mission_id)
                ->where('vehicule_immatriculation', $immatriculation)
                ->where('est_supprime', 0)
                ->exists();

            if (!$missionOk) {
                return response()->json([
                    'message' => 'La mission spécifiée n\'appartient pas à ce véhicule.',
                ], 422);
            }
        }

        $updateData = [];

        if ($request->has('date_plein'))    $updateData['date_plein']    = $request->date_plein;
        if ($request->has('litres'))        $updateData['litres']        = $request->litres;
        if ($request->has('prix_unitaire')) $updateData['prix_unitaire'] = $request->prix_unitaire ?: null;
        if ($request->has('station'))       $updateData['station']       = $request->station ?: null;
        if ($request->has('mission_id'))    $updateData['mission_id']    = $request->mission_id ?: null;
        if ($request->has('notes'))         $updateData['notes']         = $request->notes ?: null;

        // Recalcul km_depuis_dernier_plein et consommation si kilometrage ou litres changent
        $newKm     = $request->filled('kilometrage') ? (int)$request->kilometrage : (int)$record->kilometrage;
        $newLitres = $request->filled('litres')      ? (float)$request->litres    : (float)$record->litres;

        if ($request->filled('kilometrage')) {
            $updateData['kilometrage'] = $newKm;
        }

        // Recalcul basé sur le plein précédent (hors enregistrement courant)
        $pleinPrecedent = DB::table('carnets_carburant')
            ->where('vehicule_immatriculation', $immatriculation)
            ->where('est_supprime', 0)
            ->where('id', '!=', $carburantId)
            ->where('kilometrage', '<', $newKm)
            ->orderBy('kilometrage', 'desc')
            ->value('kilometrage');

        if ($pleinPrecedent && $newKm > $pleinPrecedent) {
            $kmDepuis = $newKm - (int)$pleinPrecedent;
            $updateData['km_depuis_dernier_plein'] = $kmDepuis;
            $updateData['consommation_calculee']   = ($kmDepuis > 0)
                ? round(($newLitres / $kmDepuis) * 100, 2)
                : null;
        } else {
            $updateData['km_depuis_dernier_plein'] = null;
            $updateData['consommation_calculee']   = null;
        }

        DB::table('carnets_carburant')
            ->where('id', $carburantId)
            ->update($updateData);

        $updated = DB::table('carnets_carburant as cc')
            ->leftJoin('missions as m', 'm.id', '=', 'cc.mission_id')
            ->where('cc.id', $carburantId)
            ->select(
                'cc.*',
                'm.reference_mission as mission_reference',
                'm.destination as mission_destination'
            )
            ->first();

        return response()->json($updated);
    }

    /**
     * DELETE /api/admin/vehicules/{immatriculation}/carburant/{carburantId}
     *
     * Soft delete d'un enregistrement de carburant.
     */
    public function destroyCarburant(string $immatriculation, int $carburantId): JsonResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $rows = DB::table('carnets_carburant')
            ->where('id', $carburantId)
            ->where('vehicule_immatriculation', $immatriculation)
            ->where('est_supprime', 0)
            ->update([
                'est_supprime'     => 1,
                'date_suppression' => now(),
            ]);

        if (!$rows) {
            return response()->json(['message' => 'Enregistrement carburant introuvable.'], 404);
        }

        return response()->json(['message' => 'Enregistrement carburant supprimé.']);
    }

    /**
     * GET /api/admin/vehicules/{immatriculation}/carburant/{carburantId}
     *
     * Détail d'un seul enregistrement de carburant.
     */
    public function showCarburant(string $immatriculation, int $carburantId): JsonResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $record = DB::table('carnets_carburant as cc')
            ->leftJoin('missions as m', 'm.id', '=', 'cc.mission_id')
            ->where('cc.id', $carburantId)
            ->where('cc.vehicule_immatriculation', $immatriculation)
            ->where('cc.est_supprime', 0)
            ->select(
                'cc.*',
                'm.reference_mission as mission_reference',
                'm.destination as mission_destination'
            )
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Enregistrement carburant introuvable.'], 404);
        }

        $record->cout_total = ($record->litres && $record->prix_unitaire)
            ? round((float)$record->litres * (float)$record->prix_unitaire, 2)
            : null;

        return response()->json($record);
    }

    // =========================================================================
    // 11. STATISTIQUES D'UN VÉHICULE
    // =========================================================================

    public function stats(string $immatriculation): JsonResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $missions = DB::table('missions')
            ->where('vehicule_immatriculation', $immatriculation)
            ->where('est_supprime', 0)
            ->selectRaw('COUNT(*) as total_missions, COALESCE(SUM(km_retour - km_depart), 0) as total_km')
            ->first();

        $carburant = DB::table('carnets_carburant')
            ->where('vehicule_immatriculation', $immatriculation)
            ->where('est_supprime', 0)
            ->selectRaw('COALESCE(SUM(litres), 0) as total_litres')
            ->first();

        $totalKm      = (float)($missions->total_km ?? 0);
        $totalLitres  = (float)($carburant->total_litres ?? 0);
        $consoMoyenne = ($totalKm > 0) ? round($totalLitres / $totalKm * 100, 2) : 0;

        $maintenance = DB::table('interventions')
            ->where('vehicule_immatriculation', $immatriculation)
            ->where('est_supprime', 0)
            ->selectRaw('COALESCE(SUM(cout_main_oeuvre + cout_pieces), 0) as cout_maintenance')
            ->first();

        $coutMaintenance = (float)($maintenance->cout_maintenance ?? 0);
        $coutCarburant   = DB::table('carnets_carburant')
            ->where('vehicule_immatriculation', $immatriculation)
            ->where('est_supprime', 0)
            ->selectRaw('COALESCE(SUM(litres * prix_unitaire), 0) as total')
            ->value('total') ?? 0;

        return response()->json([
            'total_missions'       => (int)($missions->total_missions ?? 0),
            'total_km'             => (int)$totalKm,
            'total_litres'         => round($totalLitres, 2),
            'consommation_moyenne' => $consoMoyenne,
            'cout_maintenance'     => round($coutMaintenance, 2),
            'cout_total'           => round($coutMaintenance + (float)$coutCarburant, 2),
        ]);
    }

    // =========================================================================
    // 12. DONNÉES DE RÉFÉRENCE
    // =========================================================================

    public function references(): JsonResponse
    {
        $categories = DB::table('categories_vehicules')
            ->where('est_actif', 1)
            ->whereNull('deleted_at')
            ->orderBy('nom')
            ->select('id', 'nom')
            ->get();

        $marques = DB::table('marques')
            ->where('est_actif', 1)
            ->whereNull('deleted_at')
            ->orderBy('nom')
            ->select('id', 'nom')
            ->get();

        $modeles = DB::table('modeles as mo')
            ->join('marques as ma', 'ma.id', '=', 'mo.marque_id')
            ->where('mo.est_actif', 1)
            ->whereNull('mo.deleted_at')
            ->orderBy('ma.nom')
            ->orderBy('mo.nom')
            ->select('mo.id', 'mo.nom', 'ma.nom as marque_nom')
            ->get();

        $directions = DB::table('directions')
            ->where('est_supprime', 0)
            ->orderBy('nom')
            ->select('id', 'nom')
            ->get();

        return response()->json([
            'categories' => $categories,
            'marques'    => $marques,
            'modeles'    => $modeles,
            'directions' => $directions,
        ]);
    }

    // ─── CRUD Catégories ──────────────────────────────────────────────────────

    public function storeCategorie(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:100|unique:categories_vehicules,nom',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $id = DB::table('categories_vehicules')->insertGetId([
            'nom'        => $request->nom,
            'est_actif'  => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['id' => $id, 'nom' => $request->nom], 201);
    }

    public function destroyCategorie(int $id): JsonResponse
    {
        $rows = DB::table('categories_vehicules')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->update(['deleted_at' => now(), 'est_actif' => 0, 'updated_at' => now()]);

        if (!$rows) {
            return response()->json(['message' => 'Catégorie introuvable.'], 404);
        }

        return response()->json(['message' => 'Catégorie supprimée.']);
    }

    // ─── CRUD Marques ─────────────────────────────────────────────────────────

    public function storeMarque(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:100|unique:marques,nom',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $id = DB::table('marques')->insertGetId([
            'nom'        => $request->nom,
            'est_actif'  => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['id' => $id, 'nom' => $request->nom], 201);
    }

    public function destroyMarque(int $id): JsonResponse
    {
        $rows = DB::table('marques')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->update(['deleted_at' => now(), 'est_actif' => 0, 'updated_at' => now()]);

        if (!$rows) {
            return response()->json(['message' => 'Marque introuvable.'], 404);
        }

        return response()->json(['message' => 'Marque supprimée.']);
    }

    // ─── CRUD Modèles ─────────────────────────────────────────────────────────

    public function storeModele(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'marque_id'    => 'required|integer|exists:marques,id',
            'nom'          => 'required|string|max:100',
            'categorie_id' => 'nullable|integer|exists:categories_vehicules,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $exists = DB::table('modeles')
            ->where('marque_id', $request->marque_id)
            ->where('nom', $request->nom)
            ->whereNull('deleted_at')
            ->exists();

        if ($exists) {
            return response()->json(['errors' => ['nom' => ['Ce modèle existe déjà pour cette marque.']]], 422);
        }

        $categorieId = $request->categorie_id
            ?? DB::table('categories_vehicules')->where('est_actif', 1)->value('id');

        $id = DB::table('modeles')->insertGetId([
            'marque_id'        => $request->marque_id,
            'categorie_id'     => $categorieId,
            'nom'              => $request->nom,
            'nb_places_defaut' => 5,
            'est_actif'        => 1,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        return response()->json([
            'id'        => $id,
            'nom'       => $request->nom,
            'marque_id' => $request->marque_id,
        ], 201);
    }

    public function destroyModele(int $id): JsonResponse
    {
        $rows = DB::table('modeles')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->update(['deleted_at' => now(), 'est_actif' => 0, 'updated_at' => now()]);

        if (!$rows) {
            return response()->json(['message' => 'Modèle introuvable.'], 404);
        }

        return response()->json(['message' => 'Modèle supprimé.']);
    }

    // =========================================================================
    // HELPERS PRIVÉS
    // =========================================================================

    private function assertVehiculeExists(string $immatriculation): void
    {
        $exists = DB::table('vehicules')
            ->where('immatriculation', $immatriculation)
            ->where('est_supprime', 0)
            ->exists();

        if (!$exists) {
            abort(404, 'Véhicule introuvable.');
        }
    }

    private function uploadImage($file): string
    {
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        return $file->storeAs(self::IMAGE_DISK_PATH, $filename, 'public');
    }

    private function buildFileUrl(string $chemin): string
    {
        if (filter_var($chemin, FILTER_VALIDATE_URL)) {
            return $chemin;
        }
        return Storage::url($chemin);
    }

    private function resolveMarqueId(?string $nom): ?int
    {
        if (!$nom) return null;
        return DB::table('marques')->where('nom', $nom)->value('id');
    }

    private function resolveModeleId(?string $nom, ?int $marqueId): ?int
    {
        if (!$nom) return null;
        $q = DB::table('modeles')->where('nom', $nom);
        if ($marqueId) $q->where('marque_id', $marqueId);
        return $q->value('id');
    }

    private function resolveCategorieId(?string $nom): ?int
    {
        if (!$nom) return null;
        return DB::table('categories_vehicules')->where('nom', $nom)->value('id');
    }

    private function resolveDirectionId(?string $nom): ?int
    {
        if (!$nom) return null;
        return DB::table('directions')->where('nom', $nom)->value('id');
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