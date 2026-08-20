<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx as XlsxWriter;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use Barryvdh\DomPDF\Facade\Pdf;

/**
 * CarnetCarburantController
 *
 * CRUD du carnet de carburant.
 *
 * LOGIQUE DE SYNCHRONISATION MISSION :
 *   Chaque fois qu'un plein est ajouté, modifié ou supprimé pour une mission,
 *   on recalcule et on met à jour dans la table missions :
 *     - carburant_consomme = SUM(litres)  de tous les carnets de cette mission
 *     - cout_carburant     = SUM(litres * prix_unitaire) de ces mêmes carnets
 *
 *   Exemple : mission avec 2 pleins (20 L + 15 L) → carburant_consomme = 35 L
 *
 * DEUX MODES D'ACCÈS :
 *
 * MODE GLOBAL (page CarnetCarburant standalone) :
 *   GET  /admin/carburant/vehicules          → liste tous les véhicules actifs avec stats carburant
 *   GET  /admin/carburant/vehicules/{immat}  → détail d'un véhicule (pour le sélecteur)
 *
 * MODE PAR VÉHICULE (sous-ressource) :
 *   GET  /admin/vehicules/{immat}/carburant/missions-disponibles
 *   GET  /admin/vehicules/{immat}/carburant/export/pdf
 *   GET  /admin/vehicules/{immat}/carburant/export/excel
 *   GET  /admin/vehicules/{immat}/carburant/{id}/detail
 *   GET  /admin/vehicules/{immat}/carburant
 *   POST /admin/vehicules/{immat}/carburant
 *   GET  /admin/vehicules/{immat}/carburant/{id}
 *   PUT  /admin/vehicules/{immat}/carburant/{id}
 *   DEL  /admin/vehicules/{immat}/carburant/{id}
 */
class CarnetCarburantController extends Controller
{
    // =========================================================================
    // HELPERS PRIVÉS
    // =========================================================================

    /**
     * Vérifie que le véhicule existe et n'est pas supprimé.
     */
    private function assertVehiculeExists(string $immatriculation): void
    {
        if (!DB::table('vehicules')
            ->where('immatriculation', $immatriculation)
            ->where('est_supprime', 0)
            ->exists()) {
            abort(404, 'Véhicule introuvable.');
        }
    }

    /**
     * Requête de base pour la liste des carnets carburant d'un véhicule.
     */
    private function baseQuery(string $immatriculation)
    {
        return DB::table('carnets_carburant as cc')
            ->leftJoin('missions as m',     'm.id',  '=', 'cc.mission_id')
            ->leftJoin('utilisateurs as u', 'u.id',  '=', 'm.chauffeur_user_id')
            ->leftJoin('roles as r',        'r.id',  '=', 'u.role_id')
            ->where('cc.vehicule_immatriculation', $immatriculation)
            ->where('cc.est_supprime', 0)
            ->select(
                'cc.id',
                'cc.vehicule_immatriculation',
                'cc.mission_id',
                'cc.date_plein',
                'cc.kilometrage',
                'cc.litres',
                'cc.prix_unitaire',
                'cc.station',
                'cc.km_depuis_dernier_plein',
                'cc.consommation_calculee',
                'cc.notes',
                'cc.date_creation',
                'm.reference_mission',
                'm.destination       as mission_destination',
                'm.type_mission',
                'm.statut            as mission_statut',
                'm.carburant_consomme as mission_carburant_consomme',
                'm.cout_carburant     as mission_cout_carburant',
                'u.id    as chauffeur_id',
                'u.nom   as chauffeur_nom',
                'u.email as chauffeur_email'
            )
            ->selectRaw('ROUND(cc.litres * cc.prix_unitaire, 2) as cout_total');
    }

    /**
     * Requête complète pour le modal de détail.
     */
    private function detailQuery(string $immatriculation, int $id): ?object
    {
        return DB::table('carnets_carburant as cc')
            ->leftJoin('missions as m',             'm.id',              '=', 'cc.mission_id')
            ->leftJoin('utilisateurs as u',         'u.id',              '=', 'm.chauffeur_user_id')
            ->leftJoin('roles as r',                'r.id',              '=', 'u.role_id')
            ->leftJoin('vehicules as v',             'v.immatriculation', '=', 'cc.vehicule_immatriculation')
            ->leftJoin('marques as ma',              'ma.id',             '=', 'v.marque_id')
            ->leftJoin('modeles as mo',              'mo.id',             '=', 'v.modele_id')
            ->leftJoin('categories_vehicules as ca', 'ca.id',             '=', 'v.categorie_id')
            ->where('cc.id', $id)
            ->where('cc.vehicule_immatriculation', $immatriculation)
            ->where('cc.est_supprime', 0)
            ->select(
                'cc.id',
                'cc.vehicule_immatriculation',
                'cc.mission_id',
                'cc.date_plein',
                'cc.kilometrage       as kilometrage_au_plein',
                'cc.litres',
                'cc.prix_unitaire',
                'cc.station',
                'cc.km_depuis_dernier_plein',
                'cc.consommation_calculee',
                'cc.notes',
                'cc.chemin_recu',
                'cc.date_creation',
                'v.immatriculation    as vehicule_immatriculation_detail',
                'v.kilometrage        as vehicule_kilometrage_actuel',
                'ma.nom               as vehicule_marque',
                'mo.nom               as vehicule_modele',
                'ca.nom               as vehicule_categorie',
                'm.reference_mission',
                'm.destination        as mission_destination',
                'm.type_mission',
                'm.statut             as mission_statut',
                'm.date_depart_prevue',
                'm.date_depart_reelle',
                'm.date_retour_reelle',
                'm.km_depart          as mission_km_depart',
                'm.km_retour          as mission_km_retour',
                'm.carburant_consomme  as mission_carburant_consomme',
                'm.cout_carburant      as mission_cout_carburant',
                'u.id      as chauffeur_id',
                'u.nom     as chauffeur_nom',
                'u.email   as chauffeur_email',
                'r.libelle as chauffeur_role_libelle'
            )
            ->selectRaw('ROUND(cc.litres * cc.prix_unitaire, 2) as cout_total')
            ->first();
    }

    /**
     * Formate un enregistrement brut pour le modal de détail.
     */
    private function formatDetail(?object $r): ?array
    {
        if (!$r) return null;

        $avecMission = !is_null($r->mission_id);

        $result = [
            'id'  => $r->id,
            'cas' => $avecMission ? 'avec_mission' : 'sans_mission',

            'vehicule' => [
                'immatriculation' => $r->vehicule_immatriculation_detail,
                'kilometrage'     => (int) $r->vehicule_kilometrage_actuel,
                'marque'          => $r->vehicule_marque,
                'modele'          => $r->vehicule_modele,
                'categorie'       => $r->vehicule_categorie,
            ],

            'carburant' => [
                'date_plein'              => $r->date_plein,
                'station'                 => $r->station,
                'litres'                  => (float) $r->litres,
                'prix_unitaire'           => $r->prix_unitaire           ? (float) $r->prix_unitaire           : null,
                'cout_total'              => $r->cout_total              ? (float) $r->cout_total              : null,
                'kilometrage_au_plein'    => $r->kilometrage_au_plein    ? (int)   $r->kilometrage_au_plein    : null,
                'km_depuis_dernier_plein' => $r->km_depuis_dernier_plein ? (int)   $r->km_depuis_dernier_plein : null,
                'consommation_calculee'   => $r->consommation_calculee   ? (float) $r->consommation_calculee   : null,
                'notes'                   => $r->notes,
                'recu_url'                => $r->chemin_recu
                    ? (filter_var($r->chemin_recu, FILTER_VALIDATE_URL)
                        ? $r->chemin_recu
                        : Storage::url($r->chemin_recu))
                    : null,
                'date_creation' => $r->date_creation,
            ],
        ];

        if ($avecMission) {
            $result['mission'] = [
                'id'                 => $r->mission_id,
                'reference_mission'  => $r->reference_mission,
                'destination'        => $r->mission_destination,
                'type_mission'       => $r->type_mission,
                'statut'             => $r->mission_statut,
                'date_depart_prevue' => $r->date_depart_prevue,
                'date_depart_reelle' => $r->date_depart_reelle,
                'date_retour_reelle' => $r->date_retour_reelle,
                'km_depart'          => $r->mission_km_depart ? (int)   $r->mission_km_depart  : null,
                'km_retour'          => $r->mission_km_retour ? (int)   $r->mission_km_retour  : null,
                'carburant_consomme' => $r->mission_carburant_consomme ? (float) $r->mission_carburant_consomme : null,
                'cout_carburant'     => $r->mission_cout_carburant     ? (float) $r->mission_cout_carburant     : null,
            ];

            $result['chauffeur'] = $r->chauffeur_id ? [
                'id'    => (int) $r->chauffeur_id,
                'nom'   => $r->chauffeur_nom,
                'email' => $r->chauffeur_email,
                'role'  => $r->chauffeur_role_libelle,
            ] : null;
        }

        return $result;
    }

    /**
     * =========================================================================
     * SYNCHRONISATION MISSION ← carnets_carburant
     * =========================================================================
     *
     * Met à jour les agrégats carburant de la mission après chaque
     * ajout / modification / suppression d'un plein dans carnets_carburant.
     *
     *   carburant_consomme = SUM(litres)                  — total des litres de tous les pleins
     *   cout_carburant     = SUM(litres * prix_unitaire)  — coût total carburant de la mission
     *
     * Exemple :
     *   Plein 1 : 20 L  → carburant_consomme = 20 L
     *   Plein 2 : 15 L  → carburant_consomme = 35 L  (somme des deux pleins)
     *
     * NB : on ne touche PAS à ces champs si la mission n'existe plus.
     */
    private function syncMissionAggregats(int $missionId): void
    {
        // Vérifie que la mission existe et n'est pas supprimée
        if (!DB::table('missions')->where('id', $missionId)->where('est_supprime', 0)->exists()) {
            return;
        }

        // Calcule la somme des litres et du coût sur TOUS les carnets
        // non supprimés rattachés à cette mission
        $agg = DB::table('carnets_carburant')
            ->where('mission_id', $missionId)
            ->where('est_supprime', 0)
            ->selectRaw('
                COALESCE(SUM(litres), 0)                          AS total_litres,
                COALESCE(SUM(litres * prix_unitaire), 0)          AS total_cout
            ')
            ->first();

        // Met à jour la mission avec les nouvelles valeurs agrégées
        DB::table('missions')->where('id', $missionId)->update([
            'carburant_consomme' => round((float) $agg->total_litres, 2),
            'cout_carburant'     => round((float) $agg->total_cout,   2),
            'date_modification'  => now(),
        ]);
    }

    // =========================================================================
    // MODE GLOBAL — LISTE DES VÉHICULES AVEC STATS CARBURANT
    // GET /admin/carburant/vehicules
    // =========================================================================
    public function listeVehicules(Request $request): JsonResponse
    {
        $vehicules = DB::table('vehicules as v')
            ->leftJoin('marques as ma',              'ma.id', '=', 'v.marque_id')
            ->leftJoin('modeles as mo',              'mo.id', '=', 'v.modele_id')
            ->leftJoin('categories_vehicules as ca', 'ca.id', '=', 'v.categorie_id')
            ->leftJoinSub(
                DB::table('carnets_carburant')
                    ->where('est_supprime', 0)
                    ->groupBy('vehicule_immatriculation')
                    ->select(
                        'vehicule_immatriculation',
                        DB::raw('COUNT(*) as nb_pleins'),
                        DB::raw('COALESCE(SUM(litres), 0) as total_litres'),
                        DB::raw('COALESCE(SUM(litres * prix_unitaire), 0) as total_cout'),
                        DB::raw('MAX(date_plein) as dernier_plein_date')
                    ),
                'stats',
                'stats.vehicule_immatriculation',
                '=',
                'v.immatriculation'
            )
            ->leftJoinSub(
                DB::table('carnets_carburant as cc_last')
                    ->where('cc_last.est_supprime', 0)
                    ->whereRaw('cc_last.id = (
                        SELECT id FROM carnets_carburant
                        WHERE vehicule_immatriculation = cc_last.vehicule_immatriculation
                          AND est_supprime = 0
                        ORDER BY date_plein DESC, id DESC
                        LIMIT 1
                    )')
                    ->select(
                        'cc_last.vehicule_immatriculation',
                        'cc_last.litres      as dernier_litres',
                        'cc_last.station     as dernier_station',
                        'cc_last.prix_unitaire as dernier_prix_unitaire'
                    ),
                'dernier',
                'dernier.vehicule_immatriculation',
                '=',
                'v.immatriculation'
            )
            ->where('v.est_supprime', 0)
            ->orderBy('v.immatriculation')
            ->select(
                'v.immatriculation',
                'v.statut',
                'v.kilometrage',
                'v.consommation_moyenne',
                'v.photo',
                'ma.nom as marque',
                'mo.nom as modele',
                'ca.nom as categorie',
                DB::raw('COALESCE(stats.nb_pleins, 0)       as nb_pleins'),
                DB::raw('COALESCE(stats.total_litres, 0)    as total_litres'),
                DB::raw('COALESCE(stats.total_cout, 0)      as total_cout'),
                'stats.dernier_plein_date',
                'dernier.dernier_litres',
                'dernier.dernier_station',
                'dernier.dernier_prix_unitaire'
            )
            ->get()
            ->map(fn ($v) => [
                'immatriculation'       => $v->immatriculation,
                'statut'                => $v->statut,
                'kilometrage'           => (int) $v->kilometrage,
                'consommation_moyenne'  => $v->consommation_moyenne ? (float) $v->consommation_moyenne : null,
                'photo'                 => $v->photo
                    ? (filter_var($v->photo, FILTER_VALIDATE_URL) ? $v->photo : Storage::url($v->photo))
                    : null,
                'marque'                => $v->marque,
                'modele'                => $v->modele,
                'categorie'             => $v->categorie,
                'label'                 => trim(($v->marque ?? '') . ' ' . ($v->modele ?? '') . ' — ' . $v->immatriculation),
                'nb_pleins'             => (int) $v->nb_pleins,
                'total_litres'          => round((float) $v->total_litres, 2),
                'total_cout'            => round((float) $v->total_cout, 2),
                'dernier_plein_date'    => $v->dernier_plein_date,
                'dernier_litres'        => $v->dernier_litres        ? (float) $v->dernier_litres        : null,
                'dernier_station'       => $v->dernier_station,
                'dernier_prix_unitaire' => $v->dernier_prix_unitaire ? (float) $v->dernier_prix_unitaire : null,
            ]);

        return response()->json($vehicules);
    }

    // =========================================================================
    // MODE GLOBAL — DÉTAIL D'UN VÉHICULE
    // GET /admin/carburant/vehicules/{immatriculation}
    // =========================================================================
    public function vehiculeDetail(string $immatriculation): JsonResponse
    {
        $v = DB::table('vehicules as v')
            ->leftJoin('marques as ma',              'ma.id', '=', 'v.marque_id')
            ->leftJoin('modeles as mo',              'mo.id', '=', 'v.modele_id')
            ->leftJoin('categories_vehicules as ca', 'ca.id', '=', 'v.categorie_id')
            ->where('v.immatriculation', $immatriculation)
            ->where('v.est_supprime', 0)
            ->select(
                'v.immatriculation', 'v.statut', 'v.kilometrage',
                'v.consommation_moyenne', 'v.photo',
                'ma.nom as marque', 'mo.nom as modele', 'ca.nom as categorie'
            )
            ->first();

        if (!$v) {
            return response()->json(['message' => 'Véhicule introuvable.'], 404);
        }

        return response()->json([
            'immatriculation'      => $v->immatriculation,
            'statut'               => $v->statut,
            'kilometrage'          => (int) $v->kilometrage,
            'consommation_moyenne' => $v->consommation_moyenne ? (float) $v->consommation_moyenne : null,
            'photo'                => $v->photo
                ? (filter_var($v->photo, FILTER_VALIDATE_URL) ? $v->photo : Storage::url($v->photo))
                : null,
            'marque'               => $v->marque,
            'modele'               => $v->modele,
            'categorie'            => $v->categorie,
            'label'                => trim(($v->marque ?? '') . ' ' . ($v->modele ?? '') . ' — ' . $v->immatriculation),
        ]);
    }

    // =========================================================================
    // 1. MISSIONS DISPONIBLES POUR UN VÉHICULE
    // GET /admin/vehicules/{immatriculation}/carburant/missions-disponibles
    // =========================================================================
    public function missionsDisponibles(string $immatriculation): JsonResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $missions = DB::table('missions as m')
            ->leftJoin('utilisateurs as u', 'u.id', '=', 'm.chauffeur_user_id')
            ->where('m.vehicule_immatriculation', $immatriculation)
            ->where('m.est_supprime', 0)
            ->whereIn('m.statut', ['planifiee', 'en_cours', 'terminee'])
            ->orderBy('m.date_depart_prevue', 'desc')
            ->select(
                'm.id', 'm.reference_mission', 'm.destination', 'm.type_mission', 'm.statut',
                'm.date_depart_prevue', 'm.date_depart_reelle', 'm.date_retour_reelle',
                'm.km_depart', 'm.km_retour', 'm.carburant_consomme', 'm.cout_carburant',
                'u.id    as chauffeur_id',
                'u.nom   as chauffeur_nom',
                'u.email as chauffeur_email'
            )
            ->get()
            ->map(fn ($m) => [
                'id'                 => $m->id,
                'label'              => trim(($m->reference_mission ?? '') . ' — ' . ($m->destination ?? '')),
                'reference_mission'  => $m->reference_mission,
                'destination'        => $m->destination,
                'type_mission'       => $m->type_mission,
                'statut'             => $m->statut,
                'date_depart_prevue' => $m->date_depart_prevue,
                'date_depart_reelle' => $m->date_depart_reelle,
                'date_retour_reelle' => $m->date_retour_reelle,
                'km_depart'          => $m->km_depart ? (int) $m->km_depart : null,
                'km_retour'          => $m->km_retour ? (int) $m->km_retour : null,
                'distance_km'        => ($m->km_depart && $m->km_retour)
                                            ? (int) $m->km_retour - (int) $m->km_depart : null,
                'carburant_consomme' => $m->carburant_consomme ? (float) $m->carburant_consomme : null,
                'cout_carburant'     => $m->cout_carburant     ? (float) $m->cout_carburant     : null,
                'chauffeur'          => $m->chauffeur_id ? [
                    'id'    => (int) $m->chauffeur_id,
                    'nom'   => $m->chauffeur_nom,
                    'email' => $m->chauffeur_email,
                ] : null,
            ]);

        return response()->json($missions);
    }

    // =========================================================================
    // 2. LISTE DES CARNETS D'UN VÉHICULE
    // GET /admin/vehicules/{immatriculation}/carburant
    // =========================================================================
    public function index(string $immatriculation): JsonResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $items = $this->baseQuery($immatriculation)
            ->orderBy('cc.date_plein', 'desc')
            ->orderBy('cc.id', 'desc')
            ->get()
            ->map(fn ($c) => [
                'id'                         => $c->id,
                'vehicule_immatriculation'   => $c->vehicule_immatriculation,
                'cas'                        => $c->mission_id ? 'avec_mission' : 'sans_mission',
                'mission_id'                 => $c->mission_id,
                'reference_mission'          => $c->reference_mission,
                'mission_destination'        => $c->mission_destination,
                'type_mission'               => $c->type_mission,
                'mission_statut'             => $c->mission_statut,
                'mission_carburant_consomme' => $c->mission_carburant_consomme ? (float) $c->mission_carburant_consomme : null,
                'mission_cout_carburant'     => $c->mission_cout_carburant     ? (float) $c->mission_cout_carburant     : null,
                'chauffeur_id'               => $c->chauffeur_id,
                'chauffeur_nom'              => $c->chauffeur_nom,
                'date_plein'                 => $c->date_plein,
                'kilometrage'                => $c->kilometrage   ? (int)   $c->kilometrage   : null,
                'litres'                     => (float) $c->litres,
                'prix_unitaire'              => $c->prix_unitaire ? (float) $c->prix_unitaire : null,
                'cout_total'                 => $c->cout_total    ? (float) $c->cout_total    : null,
                'station'                    => $c->station,
                'km_depuis_dernier_plein'    => $c->km_depuis_dernier_plein ? (int) $c->km_depuis_dernier_plein : null,
                'consommation_calculee'      => $c->consommation_calculee   ? (float) $c->consommation_calculee : null,
                'notes'                      => $c->notes,
                'date_creation'              => $c->date_creation,
            ]);

        return response()->json($items);
    }

    // =========================================================================
    // 3. DÉTAIL SIMPLE (formulaire édition)
    // GET /admin/vehicules/{immatriculation}/carburant/{id}
    // =========================================================================
    public function show(string $immatriculation, int $id): JsonResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $record = $this->baseQuery($immatriculation)->where('cc.id', $id)->first();

        if (!$record) {
            return response()->json(['message' => 'Enregistrement introuvable.'], 404);
        }

        return response()->json($record);
    }

    // =========================================================================
    // 4. DÉTAIL COMPLET (modal "Voir")
    // GET /admin/vehicules/{immatriculation}/carburant/{id}/detail
    // =========================================================================
    public function showDetail(string $immatriculation, int $id): JsonResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $record = $this->detailQuery($immatriculation, $id);

        if (!$record) {
            return response()->json(['message' => 'Enregistrement introuvable.'], 404);
        }

        return response()->json($this->formatDetail($record));
    }

    // =========================================================================
    // 5. CRÉER UN PLEIN
    // POST /admin/vehicules/{immatriculation}/carburant
    //
    // SYNC MISSION :
    //   Si un mission_id est fourni, on appelle syncMissionAggregats()
    //   APRÈS l'insertion du carnet pour recalculer :
    //     - missions.carburant_consomme = SUM(litres) de tous les pleins de la mission
    //     - missions.cout_carburant     = SUM(litres * prix_unitaire) idem
    // =========================================================================
    public function store(Request $request, string $immatriculation): JsonResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $validator = Validator::make($request->all(), [
            'mission_id'    => 'nullable|integer|exists:missions,id',
            'date_plein'    => 'required|date',
            'station'       => 'nullable|string|max:200',
            'litres'        => 'required|numeric|min:0.01',
            'prix_unitaire' => 'nullable|numeric|min:0',
            'kilometrage'   => 'nullable|integer|min:0',
            'notes'         => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // ── Vérification mission ──────────────────────────────────────────────
        $mission = null;
        if ($request->filled('mission_id')) {
            $mission = DB::table('missions')
                ->where('id', $request->mission_id)
                ->where('vehicule_immatriculation', $immatriculation)
                ->where('est_supprime', 0)
                ->first();

            if (!$mission) {
                return response()->json([
                    'message' => "La mission sélectionnée n'appartient pas à ce véhicule.",
                ], 422);
            }
        }

        // ── Kilométrage ───────────────────────────────────────────────────────
        if ($request->filled('kilometrage')) {
            $km = (int) $request->kilometrage;
        } elseif ($mission && $mission->km_depart) {
            $km = (int) $mission->km_depart;
        } else {
            $km = (int) DB::table('vehicules')
                ->where('immatriculation', $immatriculation)
                ->value('kilometrage');
        }

        // ── km_depuis_dernier_plein ───────────────────────────────────────────
        $dernier = DB::table('carnets_carburant')
            ->where('vehicule_immatriculation', $immatriculation)
            ->where('est_supprime', 0)
            ->orderBy('date_plein', 'desc')
            ->orderBy('id', 'desc')
            ->first();

        $kmDepuis = null;
        if ($dernier && $dernier->kilometrage && $km > (int) $dernier->kilometrage) {
            $kmDepuis = $km - (int) $dernier->kilometrage;
        }

        // ── consommation_calculee : uniquement CAS 2 (sans mission) ──────────
        $consommation = null;
        if (!$mission && $request->filled('prix_unitaire')) {
            $consommation = round((float) $request->litres * (float) $request->prix_unitaire, 2);
        }

        // ── Insertion du carnet ───────────────────────────────────────────────
        $insertId = DB::table('carnets_carburant')->insertGetId([
            'vehicule_immatriculation' => $immatriculation,
            'mission_id'               => $mission ? $mission->id : null,
            'date_plein'               => $request->date_plein,
            'kilometrage'              => $km,
            'litres'                   => (float) $request->litres,
            'prix_unitaire'            => $request->filled('prix_unitaire') ? (float) $request->prix_unitaire : null,
            'station'                  => $request->station ?: null,
            'km_depuis_dernier_plein'  => $kmDepuis,
            'consommation_calculee'    => $consommation,
            'notes'                    => $request->notes ?: null,
            'est_supprime'             => 0,
            'date_creation'            => now(),
        ]);

        // ── MAJ kilométrage véhicule ──────────────────────────────────────────
        $kmActuel = (int) DB::table('vehicules')
            ->where('immatriculation', $immatriculation)
            ->value('kilometrage');

        if ($km > $kmActuel) {
            DB::table('vehicules')->where('immatriculation', $immatriculation)->update([
                'kilometrage'       => $km,
                'date_maj_km'       => now()->toDateString(),
                'date_modification' => now(),
            ]);
        }

        // ── SYNC MISSION ──────────────────────────────────────────────────────
        // Recalcule carburant_consomme et cout_carburant sur la mission
        // après l'insertion du nouveau plein.
        // Résultat : missions.carburant_consomme = SUM de tous les litres
        //            de cette mission (pleins déjà existants + ce nouveau plein)
        if ($mission) {
            $this->syncMissionAggregats($mission->id);
        }

        $detail = $this->detailQuery($immatriculation, (int) $insertId);

        return response()->json($this->formatDetail($detail), 201);
    }

    // =========================================================================
    // 6. MODIFIER UN PLEIN
    // PUT /admin/vehicules/{immatriculation}/carburant/{id}
    //
    // SYNC MISSION :
    //   - Si la mission a changé (ou a été retirée), on resynchronise
    //     l'ANCIENNE mission pour recalculer sans ce plein.
    //   - On synchronise ensuite la NOUVELLE mission (ou la même si inchangée)
    //     pour inclure les valeurs modifiées.
    // =========================================================================
    public function update(Request $request, string $immatriculation, int $id): JsonResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $record = DB::table('carnets_carburant')
            ->where('id', $id)
            ->where('vehicule_immatriculation', $immatriculation)
            ->where('est_supprime', 0)
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Enregistrement introuvable.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'mission_id'    => 'nullable|integer|exists:missions,id',
            'date_plein'    => 'nullable|date',
            'station'       => 'nullable|string|max:200',
            'litres'        => 'nullable|numeric|min:0.01',
            'prix_unitaire' => 'nullable|numeric|min:0',
            'kilometrage'   => 'nullable|integer|min:0',
            'notes'         => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // ── Résolution du nouveau mission_id ──────────────────────────────────
        $missionId = $record->mission_id; // valeur actuelle par défaut
        if ($request->has('mission_id')) {
            if ($request->filled('mission_id')) {
                $ok = DB::table('missions')
                    ->where('id', $request->mission_id)
                    ->where('vehicule_immatriculation', $immatriculation)
                    ->where('est_supprime', 0)
                    ->exists();

                if (!$ok) {
                    return response()->json([
                        'message' => "La mission sélectionnée n'appartient pas à ce véhicule.",
                    ], 422);
                }
                $missionId = (int) $request->mission_id;
            } else {
                $missionId = null;
            }
        }

        // ── Construction du payload de mise à jour ────────────────────────────
        $data = [];
        if ($request->has('mission_id'))    $data['mission_id']    = $missionId;
        if ($request->has('date_plein'))    $data['date_plein']    = $request->date_plein;
        if ($request->has('station'))       $data['station']       = $request->station       ?: null;
        if ($request->has('litres'))        $data['litres']        = (float) $request->litres;
        if ($request->has('prix_unitaire')) $data['prix_unitaire'] = $request->filled('prix_unitaire')
                                                                        ? (float) $request->prix_unitaire : null;
        if ($request->has('notes'))         $data['notes']         = $request->notes         ?: null;

        if ($request->filled('kilometrage')) {
            $newKm = (int) $request->kilometrage;
            $data['kilometrage'] = $newKm;

            $kmPrec = DB::table('carnets_carburant')
                ->where('vehicule_immatriculation', $immatriculation)
                ->where('est_supprime', 0)
                ->where('id', '!=', $id)
                ->where('kilometrage', '<', $newKm)
                ->orderBy('kilometrage', 'desc')
                ->value('kilometrage');

            $data['km_depuis_dernier_plein'] = ($kmPrec && $newKm > $kmPrec)
                ? $newKm - (int) $kmPrec : null;
        }

        // ── consommation_calculee (CAS 2 uniquement) ──────────────────────────
        $newLitres    = isset($data['litres'])        ? $data['litres']        : (float) $record->litres;
        $newPrix      = isset($data['prix_unitaire']) ? $data['prix_unitaire'] : ($record->prix_unitaire ? (float) $record->prix_unitaire : null);
        $newMissionId = array_key_exists('mission_id', $data) ? $data['mission_id'] : $record->mission_id;

        if (is_null($newMissionId) && $newPrix !== null) {
            $data['consommation_calculee'] = round($newLitres * $newPrix, 2);
        } elseif (!is_null($newMissionId)) {
            // Avec mission, pas de consommation_calculee sur le carnet
            $data['consommation_calculee'] = null;
        }

        // ── Mise à jour du carnet ─────────────────────────────────────────────
        DB::table('carnets_carburant')->where('id', $id)->update($data);

        // ── SYNC MISSION ──────────────────────────────────────────────────────
        // 1) Si la mission a changé, resynchroniser l'ANCIENNE mission
        //    (ce plein n'en fait plus partie → on recalcule sans lui)
        $ancienMissionId = $record->mission_id;
        if ($ancienMissionId && $ancienMissionId !== $newMissionId) {
            $this->syncMissionAggregats((int) $ancienMissionId);
        }
        // 2) Synchroniser la NOUVELLE mission (ou la même si inchangée)
        //    pour intégrer les nouvelles valeurs de litres/prix_unitaire
        if ($newMissionId) {
            $this->syncMissionAggregats((int) $newMissionId);
        }

        $detail = $this->detailQuery($immatriculation, $id);

        return response()->json($this->formatDetail($detail));
    }

    // =========================================================================
    // 7. SUPPRIMER UN PLEIN
    // DELETE /admin/vehicules/{immatriculation}/carburant/{id}
    //
    // SYNC MISSION :
    //   Après la suppression logique du plein, on resynchronise la mission
    //   pour recalculer carburant_consomme sans ce plein supprimé.
    // =========================================================================
    public function destroy(string $immatriculation, int $id): JsonResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $record = DB::table('carnets_carburant')
            ->where('id', $id)
            ->where('vehicule_immatriculation', $immatriculation)
            ->where('est_supprime', 0)
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Enregistrement introuvable.'], 404);
        }

        // ── Suppression logique ───────────────────────────────────────────────
        DB::table('carnets_carburant')->where('id', $id)->update([
            'est_supprime'     => 1,
            'date_suppression' => now(),
        ]);

        // ── SYNC MISSION ──────────────────────────────────────────────────────
        // Recalcule la mission sans ce plein supprimé.
        // Si c'était le seul plein, carburant_consomme → 0 et cout_carburant → 0.
        if ($record->mission_id) {
            $this->syncMissionAggregats((int) $record->mission_id);
        }

        return response()->json(['message' => 'Plein de carburant supprimé avec succès.']);
    }

    // =========================================================================
    // 8. EXPORT PDF
    // GET /admin/vehicules/{immatriculation}/carburant/export/pdf
    // =========================================================================
    public function exportPdf(Request $request, string $immatriculation): \Illuminate\Http\Response
    {
        $this->assertVehiculeExists($immatriculation);

        $vehicule = DB::table('vehicules as v')
            ->leftJoin('marques as ma',              'ma.id', '=', 'v.marque_id')
            ->leftJoin('modeles as mo',              'mo.id', '=', 'v.modele_id')
            ->leftJoin('categories_vehicules as ca', 'ca.id', '=', 'v.categorie_id')
            ->where('v.immatriculation', $immatriculation)
            ->select('v.immatriculation', 'v.kilometrage', 'ma.nom as marque', 'mo.nom as modele', 'ca.nom as categorie')
            ->first();

        $carnets = $this->buildExportQuery($immatriculation, $request)->get();

        $totaux = [
            'nb_pleins'    => $carnets->count(),
            'total_litres' => $carnets->sum(fn ($c) => (float) $c->litres),
            'total_cout'   => $carnets->sum(fn ($c) => (float) ($c->cout_total ?? 0)),
            'avec_mission' => $carnets->filter(fn ($c) => !is_null($c->mission_id))->count(),
            'sans_mission' => $carnets->filter(fn ($c) => is_null($c->mission_id))->count(),
        ];

        $pdf = Pdf::loadHTML($this->buildPdfHtml($vehicule, $carnets, $totaux))
            ->setPaper('A4', 'landscape');

        return $pdf->download("carnet_carburant_{$immatriculation}.pdf");
    }

    // =========================================================================
    // 9. EXPORT EXCEL
    // GET /admin/vehicules/{immatriculation}/carburant/export/excel
    // =========================================================================
    public function exportExcel(Request $request, string $immatriculation): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $this->assertVehiculeExists($immatriculation);

        $vehicule = DB::table('vehicules as v')
            ->leftJoin('marques as ma',              'ma.id', '=', 'v.marque_id')
            ->leftJoin('modeles as mo',              'mo.id', '=', 'v.modele_id')
            ->leftJoin('categories_vehicules as ca', 'ca.id', '=', 'v.categorie_id')
            ->where('v.immatriculation', $immatriculation)
            ->select('v.immatriculation', 'v.kilometrage', 'ma.nom as marque', 'mo.nom as modele', 'ca.nom as categorie')
            ->first();

        $carnets = $this->buildExportQuery($immatriculation, $request)->get();

        $spreadsheet = new Spreadsheet();
        $sheet       = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Carnet Carburant');

        $headerStyle = [
            'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1A1A2E']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ];
        $subStyle = [
            'font' => ['bold' => true],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E8EAF6']],
        ];

        $sheet->mergeCells('A1:Q1');
        $sheet->setCellValue('A1', 'CARNET DE CARBURANT — ' . $vehicule->immatriculation);
        $sheet->getStyle('A1')->applyFromArray($headerStyle)->getFont()->setSize(13);

        $infos = [
            ['Immatriculation', $vehicule->immatriculation],
            ['Marque / Modèle', trim(($vehicule->marque ?? '') . ' ' . ($vehicule->modele ?? ''))],
            ['Catégorie',       $vehicule->categorie ?? ''],
            ['Km actuel',       number_format((int) $vehicule->kilometrage, 0, ',', ' ') . ' km'],
        ];
        $col = 'A';
        foreach ($infos as [$label, $val]) {
            $sheet->setCellValue("{$col}2", $label);
            $sheet->setCellValue("{$col}3", $val);
            $sheet->getStyle("{$col}2")->applyFromArray($subStyle);
            $col++;
        }
        $sheet->getRowDimension(4)->setRowHeight(6);

        $headers = [
            'A' => '#',             'B' => 'Type',              'C' => 'Date plein',
            'D' => 'Station',       'E' => 'Litres',            'F' => 'Prix/L (FCFA)',
            'G' => 'Coût (FCFA)',   'H' => 'Km au plein',       'I' => 'Km depuis préc.',
            'J' => 'Conso. (CAS2)','K' => 'Réf. mission',      'L' => 'Destination',
            'M' => 'Type mission',  'N' => 'Carb. miss. (L)',   'O' => 'Coût miss. (FCFA)',
            'P' => 'Chauffeur',     'Q' => 'Notes',
        ];
        foreach ($headers as $c => $label) {
            $sheet->setCellValue("{$c}5", $label);
        }
        $sheet->getStyle('A5:Q5')->applyFromArray($headerStyle);

        $row = 6;
        foreach ($carnets as $c) {
            $sheet->setCellValue("A{$row}", $c->id);
            $sheet->setCellValue("B{$row}", $c->mission_id ? 'Avec mission' : 'Autonome');
            $sheet->setCellValue("C{$row}", $c->date_plein);
            $sheet->setCellValue("D{$row}", $c->station ?? '');
            $sheet->setCellValue("E{$row}", (float) $c->litres);
            $sheet->setCellValue("F{$row}", $c->prix_unitaire ? (float) $c->prix_unitaire : '');
            $sheet->setCellValue("G{$row}", $c->cout_total    ? (float) $c->cout_total    : '');
            $sheet->setCellValue("H{$row}", $c->kilometrage   ? (int)   $c->kilometrage   : '');
            $sheet->setCellValue("I{$row}", $c->km_depuis_dernier_plein ? (int) $c->km_depuis_dernier_plein : '');
            $sheet->setCellValue("J{$row}", $c->consommation_calculee   ? (float) $c->consommation_calculee : '');
            $sheet->setCellValue("K{$row}", $c->reference_mission  ?? '');
            $sheet->setCellValue("L{$row}", $c->mission_destination ?? '');
            $sheet->setCellValue("M{$row}", $c->type_mission        ?? '');
            $sheet->setCellValue("N{$row}", $c->carburant_consomme  ? (float) $c->carburant_consomme : '');
            $sheet->setCellValue("O{$row}", $c->cout_carburant      ? (float) $c->cout_carburant    : '');
            $sheet->setCellValue("P{$row}", $c->chauffeur_nom       ?? '');
            $sheet->setCellValue("Q{$row}", $c->notes               ?? '');

            if ($row % 2 === 0) {
                $sheet->getStyle("A{$row}:Q{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F4F6FB']],
                ]);
            }
            $row++;
        }

        $sheet->setCellValue("A{$row}", 'TOTAUX');
        $sheet->setCellValue("E{$row}", $carnets->sum(fn ($c) => (float) $c->litres));
        $sheet->setCellValue("G{$row}", $carnets->sum(fn ($c) => (float) ($c->cout_total ?? 0)));
        $sheet->getStyle("A{$row}:Q{$row}")->applyFromArray($subStyle)->getFont()->setBold(true);

        foreach (range('A', 'Q') as $c) {
            $sheet->getColumnDimension($c)->setAutoSize(true);
        }

        $writer = new XlsxWriter($spreadsheet);

        return response()->streamDownload(
            fn () => $writer->save('php://output'),
            "carnet_carburant_{$immatriculation}.xlsx",
            ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
        );
    }

    // =========================================================================
    // HELPERS EXPORTS PRIVÉS
    // =========================================================================
    private function buildExportQuery(string $immatriculation, Request $request)
    {
        $q = DB::table('carnets_carburant as cc')
            ->leftJoin('missions as m',     'm.id',  '=', 'cc.mission_id')
            ->leftJoin('utilisateurs as u', 'u.id',  '=', 'm.chauffeur_user_id')
            ->where('cc.vehicule_immatriculation', $immatriculation)
            ->where('cc.est_supprime', 0)
            ->select(
                'cc.id', 'cc.date_plein', 'cc.station', 'cc.litres', 'cc.prix_unitaire',
                'cc.kilometrage', 'cc.km_depuis_dernier_plein', 'cc.consommation_calculee',
                'cc.notes', 'cc.mission_id',
                'm.reference_mission',
                'm.destination as mission_destination',
                'm.type_mission',
                'm.carburant_consomme',
                'm.cout_carburant',
                'u.nom as chauffeur_nom',
                DB::raw('ROUND(cc.litres * cc.prix_unitaire, 2) as cout_total')
            )
            ->orderBy('cc.date_plein', 'desc');

        if ($request->filled('mission_id')) $q->where('cc.mission_id', $request->mission_id);
        if ($request->filled('date_debut')) $q->where('cc.date_plein', '>=', $request->date_debut);
        if ($request->filled('date_fin'))   $q->where('cc.date_plein', '<=', $request->date_fin);

        return $q;
    }

    private function buildPdfHtml(object $vehicule, $carnets, array $totaux): string
    {
        $rows = '';
        foreach ($carnets as $c) {
            $cas   = $c->mission_id ? 'Mission' : 'Autonome';
            $color = $c->mission_id ? '#1d4ed8' : '#374151';
            $bg    = $c->mission_id ? '#dbeafe'  : '#f3f4f6';
            $rows .= '<tr>
                <td>' . $c->id . '</td>
                <td><span style="background:' . $bg . ';color:' . $color . ';padding:2px 7px;border-radius:10px;font-size:7.5px;font-weight:600;">' . $cas . '</span></td>
                <td>' . ($c->date_plein ? date('d/m/Y', strtotime($c->date_plein)) : '—') . '</td>
                <td>' . ($c->station ?? '—') . '</td>
                <td>' . number_format((float) $c->litres, 2, ',', ' ') . '</td>
                <td>' . ($c->prix_unitaire ? number_format((float) $c->prix_unitaire, 2, ',', ' ') : '—') . '</td>
                <td>' . ($c->cout_total ? number_format((float) $c->cout_total, 0, ',', ' ') : '—') . '</td>
                <td>' . ($c->kilometrage ? number_format((int) $c->kilometrage, 0, ',', ' ') : '—') . '</td>
                <td>' . ($c->km_depuis_dernier_plein ? number_format((int) $c->km_depuis_dernier_plein, 0, ',', ' ') . ' km' : '—') . '</td>
                <td>' . ($c->reference_mission ?? '—') . '</td>
                <td>' . ($c->mission_destination ?? '—') . '</td>
                <td>' . ($c->type_mission ?? '—') . '</td>
                <td>' . ($c->chauffeur_nom ?? '—') . '</td>
                <td>' . ($c->notes ?? '—') . '</td>
            </tr>';
        }

        return '<!DOCTYPE html><html><head><meta charset="UTF-8">
        <style>
            *{margin:0;padding:0;box-sizing:border-box;}
            body{font-family:DejaVu Sans,sans-serif;font-size:9px;color:#1a1a2e;}
            .header{background:#1a1a2e;color:#fff;padding:12px 18px;margin-bottom:14px;display:flex;justify-content:space-between;}
            .header h1{font-size:14px;font-weight:700;}.header .sub{font-size:8px;opacity:.7;margin-top:2px;}
            .kpis{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;}
            .kpi{background:#f4f6fb;border:1px solid #e5e7eb;border-radius:6px;padding:5px 10px;}
            .kpi .label{font-size:7px;color:#666;text-transform:uppercase;letter-spacing:.5px;}
            .kpi .value{font-size:11px;font-weight:700;color:#1a1a2e;margin-top:1px;}
            table{width:100%;border-collapse:collapse;font-size:8px;}
            thead tr{background:#1a1a2e;}
            thead th{padding:5px 4px;text-align:left;font-weight:600;font-size:7.5px;color:#fff;}
            tbody td{padding:5px 4px;border-bottom:1px solid #e5e7eb;vertical-align:top;}
            tbody tr:nth-child(even) td{background:#f4f6fb;}
            .footer{margin-top:12px;text-align:center;font-size:7px;color:#9ca3af;}
        </style></head><body>
        <div class="header">
            <div>
                <h1>Carnet de Carburant — ' . $vehicule->immatriculation . '</h1>
                <div class="sub">' . ($vehicule->marque ?? '') . ' ' . ($vehicule->modele ?? '') . ' — ' . ($vehicule->categorie ?? '') . ' | Km actuel : ' . number_format((int) $vehicule->kilometrage, 0, ',', ' ') . ' km</div>
            </div>
            <div style="font-size:8px;opacity:.7;text-align:right;">Généré le ' . now()->format('d/m/Y à H:i') . '</div>
        </div>
        <div class="kpis">
            <div class="kpi"><div class="label">Total pleins</div><div class="value">' . $totaux['nb_pleins'] . '</div></div>
            <div class="kpi"><div class="label">Total litres</div><div class="value">' . number_format($totaux['total_litres'], 2, ',', ' ') . ' L</div></div>
            <div class="kpi"><div class="label">Coût total</div><div class="value">' . number_format($totaux['total_cout'], 0, ',', ' ') . ' FCFA</div></div>
            <div class="kpi"><div class="label">Avec mission</div><div class="value">' . $totaux['avec_mission'] . '</div></div>
            <div class="kpi"><div class="label">Autonomes</div><div class="value">' . $totaux['sans_mission'] . '</div></div>
        </div>
        <table>
            <thead><tr>
                <th>#</th><th>Type</th><th>Date</th><th>Station</th>
                <th>Litres</th><th>Prix/L (FCFA)</th><th>Coût (FCFA)</th>
                <th>Km au plein</th><th>Km depuis préc.</th>
                <th>Réf. mission</th><th>Destination</th><th>Type mission</th>
                <th>Chauffeur</th><th>Notes</th>
            </tr></thead>
            <tbody>' . $rows . '</tbody>
        </table>
        <div class="footer">Fleetify — Carnet de carburant ' . $vehicule->immatriculation . ' — ' . now()->format('d/m/Y') . '</div>
        </body></html>';
    }
}