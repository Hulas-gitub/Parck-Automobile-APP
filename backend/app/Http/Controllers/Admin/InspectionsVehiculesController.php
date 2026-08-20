<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class InspectionsVehiculesController extends Controller
{
    // ═══════════════════════════════════════════════════════════════
    // DONNÉES INITIALES — chargées au montage du frontend
    // GET /api/admin/inspections-vehicules/referentiels
    // Retourne : vehicules + types_inspection + accessoires actifs
    // ═══════════════════════════════════════════════════════════════
    public function referentiels()
    {
        // Véhicules actifs non supprimés
        $vehicules = DB::table('vehicules as v')
            ->leftJoin('marques as ma', 'v.marque_id', '=', 'ma.id')
            ->leftJoin('modeles as mo', 'v.modele_id', '=', 'mo.id')
            ->where('v.est_supprime', 0)
            ->where('v.est_actif', 1)
            ->orderBy('v.immatriculation')
            ->get([
                'v.immatriculation',
                'v.statut',
                'v.kilometrage',
                'ma.nom as marque',
                'mo.nom as modele',
            ]);

        // Types d'inspection actifs
        $typesInspection = DB::table('types_inspection')
            ->where('est_supprime', 0)
            ->where('est_actif', 1)
            ->orderBy('ordre_affichage')
            ->get(['id', 'code', 'libelle', 'description', 'est_obligatoire']);

        // Accessoires actifs groupés par catégorie
        $accessoires = DB::table('accessoires')
            ->where('est_actif', 1)
            ->orderBy('categorie')
            ->orderBy('nom')
            ->get(['id', 'nom', 'categorie']);

        return response()->json([
            'vehicules'        => $vehicules,
            'types_inspection' => $typesInspection,
            'accessoires'      => $accessoires,
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    // LISTE DES INSPECTIONS
    // GET /api/admin/inspections-vehicules
    // ═══════════════════════════════════════════════════════════════
    public function index(Request $request)
    {
        $query = DB::table('inspections_vehicules as iv')
            ->join('inspections as i',         'iv.inspection_id',           '=', 'i.id')
            ->join('types_inspection as ti',   'i.type_inspection_id',       '=', 'ti.id')
            ->join('vehicules as v',           'iv.vehicule_immatriculation', '=', 'v.immatriculation')
            ->leftJoin('marques as ma',        'v.marque_id',                '=', 'ma.id')
            ->leftJoin('modeles as mo',        'v.modele_id',                '=', 'mo.id')
            ->leftJoin('utilisateurs as u',    'i.inspecteur_user_id',       '=', 'u.id')
            ->where('i.est_supprime', 0)
            ->select([
                'iv.id',
                'iv.inspection_id',
                'iv.vehicule_immatriculation',
                'iv.statut_global',
                'iv.anomalies_detectees',
                'iv.anomalie_creee_id',
                'iv.observations_vehicule',
                'iv.created_at',
                'i.date_inspection',
                'i.km_au_moment_inspection',
                'i.nom_verificateurs',
                'i.autres_constats',
                'i.notes',
                'ti.id as type_inspection_id',
                'ti.libelle as type_inspection',
                'v.immatriculation',
                'ma.nom as marque',
                'mo.nom as modele',
                'u.nom as inspecteur_nom',
            ]);

        // Filtre recherche
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('iv.vehicule_immatriculation', 'like', "%$s%")
                  ->orWhere('ti.libelle', 'like', "%$s%")
                  ->orWhere('iv.statut_global', 'like', "%$s%")
                  ->orWhere('u.nom', 'like', "%$s%");
            });
        }

        // Filtre par statut
        if ($request->filled('statut_global')) {
            $query->where('iv.statut_global', $request->statut_global);
        }

        // Filtre par véhicule
        if ($request->filled('vehicule_immatriculation')) {
            $query->where('iv.vehicule_immatriculation', $request->vehicule_immatriculation);
        }

        $inspections = $query->orderByDesc('i.date_inspection')->get();

        // Pour chaque inspection, on charge ses éléments inspectés
        $inspections = $inspections->map(function ($insp) {
            $insp->elements = DB::table('inspection_elements as ie')
                ->join('accessoires as a', 'ie.accessoire_id', '=', 'a.id')
                ->where('ie.inspection_vehicule_id', $insp->id)
                ->get([
                    'ie.id',
                    'ie.accessoire_id',
                    'a.nom as accessoire_nom',
                    'a.categorie',
                    'ie.statut',
                    'ie.valeur_relevee',
                    'ie.commentaire',
                    'ie.photos',
                ]);
            return $insp;
        });

        // Stats globales
        $stats = [
            'total'         => $inspections->count(),
            'conformes'     => $inspections->where('statut_global', 'conforme')->count(),
            'non_conformes' => $inspections->where('statut_global', 'non_conforme')->count(),
            'danger'        => $inspections->where('statut_global', 'danger_immediat')->count(),
        ];

        return response()->json([
            'data'  => $inspections,
            'stats' => $stats,
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    // CRÉER UNE INSPECTION
    // POST /api/admin/inspections-vehicules
    //
    // Payload attendu :
    // {
    //   "vehicule_immatriculation": "LBV-001-A",
    //   "type_inspection_id": 1,
    //   "date_inspection": "2026-05-13 08:30:00",
    //   "km_au_moment_inspection": 45230,
    //   "nom_verificateurs": "Jean Dupont",
    //   "statut_global": "conforme",          // conforme | non_conforme | danger_immediat
    //   "observations_vehicule": "...",
    //   "autres_constats": "...",
    //   "notes": "...",
    //   "elements": [
    //     { "accessoire_id": 1, "statut": "OK", "valeur_relevee": null, "commentaire": null },
    //     { "accessoire_id": 3, "statut": "NOK", "valeur_relevee": "0.5L", "commentaire": "À refaire" }
    //   ]
    // }
    // ═══════════════════════════════════════════════════════════════
    public function store(Request $request)
    {
        $request->validate([
            'vehicule_immatriculation'  => 'required|string|exists:vehicules,immatriculation',
            'type_inspection_id'        => 'required|integer|exists:types_inspection,id',
            'date_inspection'           => 'required|date',
            'km_au_moment_inspection'   => 'nullable|integer|min:0',
            'nom_verificateurs'         => 'nullable|string|max:255',
            'statut_global'             => 'required|in:conforme,non_conforme,danger_immediat',
            'observations_vehicule'     => 'nullable|string',
            'autres_constats'           => 'nullable|string',
            'notes'                     => 'nullable|string',
            'elements'                  => 'required|array|min:1',
            'elements.*.accessoire_id'  => 'required|integer|exists:accessoires,id',
            'elements.*.statut'         => 'required|in:OK,NOK,manquant,use,defectueux',
            'elements.*.valeur_relevee' => 'nullable|string|max:100',
            'elements.*.commentaire'    => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            $user = Auth::user();

            // ── 1. Créer la ligne dans inspections ───────────────────────
            $inspectionId = DB::table('inspections')->insertGetId([
                'type_inspection_id'       => $request->type_inspection_id,
                'inspecteur_user_id'       => $user?->id,
                'vehicule_immatriculation' => $request->vehicule_immatriculation, // colonne ajoutée par migration 3
                'km_au_moment_inspection'  => $request->km_au_moment_inspection,
                'date_inspection'          => $request->date_inspection,
                'nom_verificateurs'        => $request->nom_verificateurs,
                'autres_constats'          => $request->autres_constats,
                'notes'                    => $request->notes,
                'est_supprime'             => 0,
                'date_creation'            => now(),
                'date_modification'        => now(),
            ]);

            // ── 2. Créer la ligne dans inspections_vehicules (AUTO) ──────
            // C'est ici que le Controller fait le lien vehicule ↔ inspection
            $anomaliesDetectees = collect($request->elements)
                ->whereIn('statut', ['NOK', 'manquant', 'use', 'defectueux'])
                ->isNotEmpty();

            $inspVehId = DB::table('inspections_vehicules')->insertGetId([
                'inspection_id'            => $inspectionId,
                'vehicule_immatriculation' => $request->vehicule_immatriculation,
                'statut_global'            => $request->statut_global,
                'anomalies_detectees'      => $anomaliesDetectees ? 1 : 0,
                'anomalie_creee_id'        => null, // rempli après si besoin
                'observations_vehicule'    => $request->observations_vehicule,
                'created_at'               => now(),
                'updated_at'               => now(),
            ]);

            // ── 3. Insérer les éléments inspectés (inspection_elements) ──
            $now = now();
            $elementsData = collect($request->elements)->map(fn($el) => [
                'inspection_vehicule_id' => $inspVehId,
                'accessoire_id'          => $el['accessoire_id'],
                'statut'                 => $el['statut'],
                'valeur_relevee'         => $el['valeur_relevee'] ?? null,
                'commentaire'            => $el['commentaire'] ?? null,
                'photos'                 => null,
                'created_at'             => $now,
                'updated_at'             => $now,
            ])->toArray();

            DB::table('inspection_elements')->insert($elementsData);

            // ── 4. Créer une anomalie si statut NOK ou danger_immediat ───
            // (AUTO — le frontend ne gère pas ça)
            $anomalieId = null;
            if ($anomaliesDetectees || $request->statut_global !== 'conforme') {

                // Construire la description depuis les éléments problématiques
                $elementsNok = collect($request->elements)
                    ->whereIn('statut', ['NOK', 'manquant', 'use', 'defectueux'])
                    ->pluck('accessoire_id');

                $nomsAccessoires = DB::table('accessoires')
                    ->whereIn('id', $elementsNok)
                    ->pluck('nom')
                    ->join(', ');

                $severite = match($request->statut_global) {
                    'danger_immediat' => 'critique',
                    'non_conforme'    => 'haute',
                    default           => 'moyenne',
                };

                $anomalieId = DB::table('anomalies')->insertGetId([
                    'vehicule_immatriculation' => $request->vehicule_immatriculation,
                    'signalee_par_user_id'     => $user?->id,
                    'inspection_vehicule_id'   => $inspVehId,
                    'date_signalement'         => now(),
                    'description'              => "Inspection : éléments NOK — " . ($nomsAccessoires ?: 'Voir observations'),
                    'partie_vehicule'          => $nomsAccessoires ?: null,
                    'severite'                 => $severite,
                    'km_au_signalement'        => $request->km_au_moment_inspection,
                    'statut'                   => 'ouverte',
                    'est_supprime'             => 0,
                    'date_creation'            => now(),
                    'date_modification'        => now(),
                ]);

                // Mettre à jour inspections_vehicules avec l'id de l'anomalie
                DB::table('inspections_vehicules')
                    ->where('id', $inspVehId)
                    ->update(['anomalie_creee_id' => $anomalieId]);
            }

            // ── 5. Mettre à jour le kilométrage du véhicule si > actuel ──
            if ($request->km_au_moment_inspection) {
                DB::table('vehicules')
                    ->where('immatriculation', $request->vehicule_immatriculation)
                    ->where('kilometrage', '<', $request->km_au_moment_inspection)
                    ->update([
                        'kilometrage'      => $request->km_au_moment_inspection,
                        'date_maj_km'      => now()->toDateString(),
                        'date_modification'=> now(),
                    ]);
            }

            DB::commit();

            return response()->json([
                'message'           => 'Inspection créée avec succès.',
                'inspection_id'     => $inspectionId,
                'inspection_veh_id' => $inspVehId,
                'anomalie_id'       => $anomalieId,
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors de la création de l\'inspection.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // DÉTAIL D'UNE INSPECTION
    // GET /api/admin/inspections-vehicules/{id}
    // ═══════════════════════════════════════════════════════════════
    public function show($id)
    {
        $insp = DB::table('inspections_vehicules as iv')
            ->join('inspections as i',       'iv.inspection_id',            '=', 'i.id')
            ->join('types_inspection as ti', 'i.type_inspection_id',        '=', 'ti.id')
            ->join('vehicules as v',         'iv.vehicule_immatriculation',  '=', 'v.immatriculation')
            ->leftJoin('marques as ma',      'v.marque_id',                  '=', 'ma.id')
            ->leftJoin('modeles as mo',      'v.modele_id',                  '=', 'mo.id')
            ->leftJoin('utilisateurs as u',  'i.inspecteur_user_id',         '=', 'u.id')
            ->where('iv.id', $id)
            ->where('i.est_supprime', 0)
            ->select([
                'iv.id', 'iv.inspection_id',
                'iv.vehicule_immatriculation', 'iv.statut_global',
                'iv.anomalies_detectees', 'iv.anomalie_creee_id',
                'iv.observations_vehicule', 'iv.created_at',
                'i.date_inspection', 'i.km_au_moment_inspection',
                'i.nom_verificateurs', 'i.autres_constats', 'i.notes',
                'ti.id as type_inspection_id', 'ti.libelle as type_inspection',
                'v.immatriculation', 'ma.nom as marque', 'mo.nom as modele',
                'u.nom as inspecteur_nom',
            ])
            ->first();

        if (!$insp) {
            return response()->json(['message' => 'Inspection introuvable.'], 404);
        }

        // Éléments inspectés
        $insp->elements = DB::table('inspection_elements as ie')
            ->join('accessoires as a', 'ie.accessoire_id', '=', 'a.id')
            ->where('ie.inspection_vehicule_id', $id)
            ->get([
                'ie.id', 'ie.accessoire_id',
                'a.nom as accessoire_nom', 'a.categorie',
                'ie.statut', 'ie.valeur_relevee',
                'ie.commentaire', 'ie.photos',
            ]);

        return response()->json($insp);
    }

    // ═══════════════════════════════════════════════════════════════
    // MODIFIER UNE INSPECTION
    // PUT /api/admin/inspections-vehicules/{id}
    // ═══════════════════════════════════════════════════════════════
    public function update(Request $request, $id)
    {
        $request->validate([
            'type_inspection_id'        => 'required|integer|exists:types_inspection,id',
            'date_inspection'           => 'required|date',
            'km_au_moment_inspection'   => 'nullable|integer|min:0',
            'nom_verificateurs'         => 'nullable|string|max:255',
            'statut_global'             => 'required|in:conforme,non_conforme,danger_immediat',
            'observations_vehicule'     => 'nullable|string',
            'autres_constats'           => 'nullable|string',
            'notes'                     => 'nullable|string',
            'elements'                  => 'required|array|min:1',
            'elements.*.accessoire_id'  => 'required|integer|exists:accessoires,id',
            'elements.*.statut'         => 'required|in:OK,NOK,manquant,use,defectueux',
            'elements.*.valeur_relevee' => 'nullable|string|max:100',
            'elements.*.commentaire'    => 'nullable|string',
        ]);

        // Récupérer l'inspection_vehicule
        $inspVeh = DB::table('inspections_vehicules')->where('id', $id)->first();
        if (!$inspVeh) {
            return response()->json(['message' => 'Inspection introuvable.'], 404);
        }

        DB::beginTransaction();
        try {
            // ── 1. Mettre à jour inspections ──────────────────────────────
            DB::table('inspections')
                ->where('id', $inspVeh->inspection_id)
                ->update([
                    'type_inspection_id'      => $request->type_inspection_id,
                    'km_au_moment_inspection' => $request->km_au_moment_inspection,
                    'date_inspection'         => $request->date_inspection,
                    'nom_verificateurs'       => $request->nom_verificateurs,
                    'autres_constats'         => $request->autres_constats,
                    'notes'                   => $request->notes,
                    'date_modification'       => now(),
                ]);

            // ── 2. Recalculer anomalies_detectees ────────────────────────
            $anomaliesDetectees = collect($request->elements)
                ->whereIn('statut', ['NOK', 'manquant', 'use', 'defectueux'])
                ->isNotEmpty();

            // ── 3. Mettre à jour inspections_vehicules ───────────────────
            DB::table('inspections_vehicules')->where('id', $id)->update([
                'statut_global'         => $request->statut_global,
                'anomalies_detectees'   => $anomaliesDetectees ? 1 : 0,
                'observations_vehicule' => $request->observations_vehicule,
                'updated_at'            => now(),
            ]);

            // ── 4. Supprimer les anciens éléments et réinsérer ───────────
            DB::table('inspection_elements')
                ->where('inspection_vehicule_id', $id)
                ->delete();

            $now = now();
            $elementsData = collect($request->elements)->map(fn($el) => [
                'inspection_vehicule_id' => $id,
                'accessoire_id'          => $el['accessoire_id'],
                'statut'                 => $el['statut'],
                'valeur_relevee'         => $el['valeur_relevee'] ?? null,
                'commentaire'            => $el['commentaire'] ?? null,
                'photos'                 => null,
                'created_at'             => $now,
                'updated_at'             => $now,
            ])->toArray();

            DB::table('inspection_elements')->insert($elementsData);

            // ── 5. Mettre à jour l'anomalie existante si elle existe ──────
            if ($inspVeh->anomalie_creee_id && $anomaliesDetectees) {
                $elementsNok = collect($request->elements)
                    ->whereIn('statut', ['NOK', 'manquant', 'use', 'defectueux'])
                    ->pluck('accessoire_id');

                $nomsAccessoires = DB::table('accessoires')
                    ->whereIn('id', $elementsNok)
                    ->pluck('nom')->join(', ');

                DB::table('anomalies')
                    ->where('id', $inspVeh->anomalie_creee_id)
                    ->update([
                        'description'       => "Inspection modifiée : éléments NOK — " . $nomsAccessoires,
                        'partie_vehicule'   => $nomsAccessoires,
                        'date_modification' => now(),
                    ]);
            }

            DB::commit();
            return response()->json(['message' => 'Inspection mise à jour avec succès.']);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors de la mise à jour.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // SUPPRIMER UNE INSPECTION (soft delete)
    // DELETE /api/admin/inspections-vehicules/{id}
    // Les cascades FK suppriment inspection_elements automatiquement
    // ═══════════════════════════════════════════════════════════════
    public function destroy($id)
    {
        $inspVeh = DB::table('inspections_vehicules')->where('id', $id)->first();
        if (!$inspVeh) {
            return response()->json(['message' => 'Inspection introuvable.'], 404);
        }

        DB::beginTransaction();
        try {
            // Soft delete de l'inspection principale
            DB::table('inspections')
                ->where('id', $inspVeh->inspection_id)
                ->update([
                    'est_supprime'      => 1,
                    'date_suppression'  => now(),
                    'date_modification' => now(),
                ]);

            // inspection_elements supprimés par CASCADE (FK onDelete cascade)
            // inspection_vehicule lui-même on le garde pour historique anomalie
            // mais on peut aussi le supprimer si besoin :
            // DB::table('inspections_vehicules')->where('id', $id)->delete();

            DB::commit();
            return response()->json(['message' => 'Inspection supprimée avec succès.']);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors de la suppression.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // ── ACCESSOIRES CRUD ──────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════

    // GET /api/admin/inspections-vehicules/accessoires
    public function indexAccessoires()
    {
        $accessoires = DB::table('accessoires')
            ->orderBy('categorie')
            ->orderBy('nom')
            ->get();

        $stats = [
            'total'      => $accessoires->count(),
            'actifs'     => $accessoires->where('est_actif', 1)->count(),
            'inactifs'   => $accessoires->where('est_actif', 0)->count(),
            'categories' => $accessoires->pluck('categorie')->unique()->values()->count(),
        ];

        return response()->json([
            'data'  => $accessoires,
            'stats' => $stats,
        ]);
    }

    // POST /api/admin/inspections-vehicules/accessoires
    public function storeAccessoire(Request $request)
    {
        $request->validate([
            'nom'       => 'required|string|max:150',
            'categorie' => 'required|string|max:100',
        ]);

        $id = DB::table('accessoires')->insertGetId([
            'nom'        => $request->nom,
            'categorie'  => $request->categorie,
            'est_actif'  => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Accessoire créé avec succès.',
            'data'    => DB::table('accessoires')->find($id),
        ], 201);
    }

    // PUT /api/admin/inspections-vehicules/accessoires/{id}
    public function updateAccessoire(Request $request, $id)
    {
        $request->validate([
            'nom'       => 'required|string|max:150',
            'categorie' => 'required|string|max:100',
        ]);

        $exists = DB::table('accessoires')->where('id', $id)->exists();
        if (!$exists) {
            return response()->json(['message' => 'Accessoire introuvable.'], 404);
        }

        DB::table('accessoires')->where('id', $id)->update([
            'nom'        => $request->nom,
            'categorie'  => $request->categorie,
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Accessoire mis à jour.',
            'data'    => DB::table('accessoires')->find($id),
        ]);
    }

    // PATCH /api/admin/inspections-vehicules/accessoires/{id}/statut
    public function toggleStatutAccessoire($id)
    {
        $acc = DB::table('accessoires')->where('id', $id)->first();
        if (!$acc) {
            return response()->json(['message' => 'Accessoire introuvable.'], 404);
        }

        DB::table('accessoires')->where('id', $id)->update([
            'est_actif'  => !$acc->est_actif,
            'updated_at' => now(),
        ]);

        return response()->json([
            'message'   => $acc->est_actif ? 'Accessoire désactivé.' : 'Accessoire activé.',
            'est_actif' => !$acc->est_actif,
        ]);
    }

    // DELETE /api/admin/inspections-vehicules/accessoires/{id}
    // Désactive seulement si utilisé, supprime physiquement sinon
    public function destroyAccessoire($id)
    {
        $acc = DB::table('accessoires')->where('id', $id)->first();
        if (!$acc) {
            return response()->json(['message' => 'Accessoire introuvable.'], 404);
        }

        $utiliseDans = DB::table('inspection_elements')
            ->where('accessoire_id', $id)
            ->count();

        if ($utiliseDans > 0) {
            // Désactivation douce — données historiques préservées
            DB::table('accessoires')->where('id', $id)->update([
                'est_actif'  => 0,
                'updated_at' => now(),
            ]);
            return response()->json([
                'message' => "Accessoire désactivé (utilisé dans {$utiliseDans} inspection(s)). Les données historiques sont préservées.",
            ]);
        }

        // Suppression physique si jamais utilisé
        DB::table('accessoires')->where('id', $id)->delete();
        return response()->json(['message' => 'Accessoire supprimé définitivement.']);
    }
}