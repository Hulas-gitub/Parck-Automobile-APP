<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'stats_cards'                 => $this->getStatsCards(),
            'donut_data'                  => $this->getDonutData(),
            'bar_chart_data'              => $this->getBarChartData(),
            'line_chart_data'             => $this->getLineChartData(),
            'interventions_data'          => $this->getInterventionsData(),
            'interventions_jour_data'     => $this->getInterventionsJourData(),
            'users_role_data'             => $this->getUsersRoleData(),
            'vehicules_marque_data'       => $this->getVehiculesMarqueData(),
            'vehicules_categorie_data'    => $this->getVehiculesCategorieData(),
            'documents_vehicules_data'    => $this->getDocumentsVehiculesData(),
            'documents_chauffeurs_data'   => $this->getDocumentsChaufffeursData(),
            'missions'                    => $this->getMissionsJour(),
            'alerts'                      => $this->getAlertes(),
            'performances_chauffeurs_data'=> $this->getPerformancesChauffeurs(),
        ]);
    }

    // =========================================================
    // GET /api/admin/dashboard/kpi-vehicules
    //
    // Paramètres :
    //   - periode         : '1m' | '3m' | '6m' | '1an'  (défaut : '3m')
    //   - search          : filtre texte libre
    //   - immatriculation : filtre sur UN seul véhicule (export individuel)
    //   - page            : numéro de page (défaut : 1)
    //   - per_page        : lignes par page (défaut : 15, max : 100)
    // =========================================================
    public function getKpiVehiculesDetail(Request $request): JsonResponse
    {
        $periode         = $request->input('periode', '3m');
        $search          = trim($request->input('search', ''));
        $immatriculation = trim($request->input('immatriculation', ''));   // ← NOUVEAU
        $page            = max(1, (int) $request->input('page', 1));
        $perPage         = min(100, max(5, (int) $request->input('per_page', 15)));

        // ── Calcul des bornes ─────────────────────────────────
        $now   = Carbon::now();
        $debut = match ($periode) {
            '1m'  => $now->copy()->startOfMonth(),
            '6m'  => $now->copy()->subMonths(6)->startOfMonth(),
            '1an' => $now->copy()->subMonths(11)->startOfMonth(),
            default => $now->copy()->subMonths(2)->startOfMonth(),   // '3m'
        };

        $debutInt = (int) $debut->format('Y') * 100 + (int) $debut->format('n');
        $finInt   = (int) $now->format('Y')   * 100 + (int) $now->format('n');

        // ── Requête ───────────────────────────────────────────
        $query = DB::table('kpi_vehicules as kv')
            ->join('vehicules as v',      'kv.vehicule_immatriculation', '=', 'v.immatriculation')
            ->join('marques as m',        'v.marque_id',                 '=', 'm.id')
            ->join('modeles as mo',       'v.modele_id',                 '=', 'mo.id')
            ->leftJoin('directions as d', 'v.direction_id',              '=', 'd.id')
            ->where('v.est_supprime', 0)
            ->whereRaw('(kv.annee_periode * 100 + kv.mois_periode) >= ?', [$debutInt])
            ->whereRaw('(kv.annee_periode * 100 + kv.mois_periode) <= ?', [$finInt]);

        // ── Filtre : un seul véhicule (export individuel) ─────
        if ($immatriculation !== '') {
            $query->where('kv.vehicule_immatriculation', $immatriculation);
        }

        // ── Filtre recherche texte libre ──────────────────────
        if ($search !== '') {
            $like = '%' . $search . '%';
            $query->where(function ($q) use ($like) {
                $q->where('kv.vehicule_immatriculation', 'like', $like)
                  ->orWhere('m.nom',  'like', $like)
                  ->orWhere('mo.nom', 'like', $like)
                  ->orWhere('d.nom',  'like', $like);
            });
        }

        // ── SELECT ────────────────────────────────────────────
        $query->select(
            'kv.vehicule_immatriculation as immatriculation',
            'm.nom  as marque',
            'mo.nom as modele',
            'v.statut',
            DB::raw('COALESCE(d.nom, "Non affecté") as direction'),

            DB::raw('SUM(kv.jours_disponible)                 as jours_disponible'),
            DB::raw('SUM(kv.jours_mission)                    as jours_mission'),
            DB::raw('SUM(kv.jours_maintenance)                as jours_maintenance'),
            DB::raw('SUM(kv.jours_immobilise)                 as jours_immobilise'),
            DB::raw('SUM(kv.total_missions)                   as total_missions'),
            DB::raw('SUM(kv.total_km_missions)                as total_km'),
            DB::raw('SUM(kv.total_interventions)              as total_interventions'),
            DB::raw('SUM(kv.total_duree_interventions_heures) as total_duree_interventions_h'),
            DB::raw('SUM(kv.cout_missions)                    as cout_missions'),
            DB::raw('SUM(kv.cout_interventions)               as cout_interventions'),
            DB::raw('SUM(kv.cout_pieces)                      as cout_pieces'),
            DB::raw('SUM(kv.nb_anomalies)                     as nb_anomalies'),
            DB::raw('SUM(kv.nb_accidents)                     as nb_accidents'),

            // Recalcul cout_total (colonne virtuelle MariaDB → pas de SUM direct)
            DB::raw('SUM(kv.cout_missions + kv.cout_interventions + kv.cout_pieces) as cout_total'),

            // Recalcul taux_disponibilite
            DB::raw('
                CASE
                    WHEN SUM(kv.jours_disponible + kv.jours_mission + kv.jours_maintenance + kv.jours_immobilise) > 0
                    THEN ROUND(
                        SUM(kv.jours_disponible) * 100.0
                        / SUM(kv.jours_disponible + kv.jours_mission + kv.jours_maintenance + kv.jours_immobilise),
                        2
                    )
                    ELSE 0
                END as taux_disponibilite
            '),

            // Recalcul cout_par_km
            DB::raw('
                CASE
                    WHEN SUM(kv.total_km_missions) > 0
                    THEN ROUND(
                        SUM(kv.cout_missions + kv.cout_interventions + kv.cout_pieces)
                        / SUM(kv.total_km_missions),
                        2
                    )
                    ELSE NULL
                END as cout_par_km
            ')
        )
        ->groupBy(
            'kv.vehicule_immatriculation',
            'm.nom',
            'mo.nom',
            'v.statut',
            'd.nom'
        )
        ->orderByRaw('SUM(kv.cout_missions + kv.cout_interventions + kv.cout_pieces) DESC');

        // ── Pagination manuelle ───────────────────────────────
        $allRows = $query->get();
        $total   = $allRows->count();
        $rows    = $allRows->forPage($page, $perPage)->values();

        // ── Totaux globaux ────────────────────────────────────
        $totaux = [
            'total_missions'           => (int)   $allRows->sum('total_missions'),
            'total_km'                 => (int)   $allRows->sum('total_km'),
            'total_interventions'      => (int)   $allRows->sum('total_interventions'),
            'cout_total'               => (float) $allRows->sum('cout_total'),
            'cout_missions'            => (float) $allRows->sum('cout_missions'),
            'cout_interventions'       => (float) $allRows->sum('cout_interventions'),
            'cout_pieces'              => (float) $allRows->sum('cout_pieces'),
            'nb_anomalies'             => (int)   $allRows->sum('nb_anomalies'),
            'nb_accidents'             => (int)   $allRows->sum('nb_accidents'),
            'taux_disponibilite_moyen' => $allRows->count() > 0
                ? round((float) $allRows->avg('taux_disponibilite'), 2)
                : 0.0,
        ];

        // ── Formatage ─────────────────────────────────────────
        $data = $rows->map(fn($row) => [
            'immatriculation'             => $row->immatriculation,
            'marque'                      => $row->marque,
            'modele'                      => $row->modele,
            'statut'                      => $row->statut,
            'direction'                   => $row->direction,
            'jours_disponible'            => (int)   $row->jours_disponible,
            'jours_mission'               => (int)   $row->jours_mission,
            'jours_maintenance'           => (int)   $row->jours_maintenance,
            'jours_immobilise'            => (int)   $row->jours_immobilise,
            'taux_disponibilite'          => (float) $row->taux_disponibilite,
            'total_missions'              => (int)   $row->total_missions,
            'total_km'                    => (int)   $row->total_km,
            'total_interventions'         => (int)   $row->total_interventions,
            'total_duree_interventions_h' => (float) $row->total_duree_interventions_h,
            'cout_missions'               => (float) $row->cout_missions,
            'cout_interventions'          => (float) $row->cout_interventions,
            'cout_pieces'                 => (float) $row->cout_pieces,
            'cout_total'                  => (float) $row->cout_total,
            'cout_par_km'                 => $row->cout_par_km !== null ? (float) $row->cout_par_km : null,
            'nb_anomalies'                => (int)   $row->nb_anomalies,
            'nb_accidents'                => (int)   $row->nb_accidents,
        ])->toArray();

        return response()->json([
            'data'       => $data,
            'totaux'     => $totaux,
            'pagination' => [
                'total'        => $total,
                'per_page'     => $perPage,
                'current_page' => $page,
                'last_page'    => max(1, (int) ceil($total / $perPage)),
            ],
            'meta' => [
                'periode'         => $periode,
                'debut_int'       => $debutInt,
                'fin_int'         => $finInt,
                'nb_vehicules'    => $total,
                'immatriculation' => $immatriculation ?: null,   // ← info pour le front
            ],
        ]);
    }

    // =========================================================
    // 1. STATS CARDS
    // =========================================================
    private function getStatsCards(): array
    {
        $now        = Carbon::now();
        $debut      = $now->copy()->startOfMonth();
        $fin        = $now->copy()->endOfMonth();
        $debutPrec  = $now->copy()->subMonth()->startOfMonth();
        $finPrec    = $now->copy()->subMonth()->endOfMonth();

        $totalVehicules  = DB::table('vehicules')->where('est_supprime', 0)->count();
        $disponibles     = DB::table('vehicules')->where('est_supprime', 0)->where('statut', 'disponible')->count();
        $enMaintenance   = DB::table('vehicules')->where('est_supprime', 0)->where('statut', 'en_maintenance')->count();
        $totalVehPrec    = DB::table('vehicules')->where('est_supprime', 0)->where('date_creation', '<', $debut)->count();
        $trendVehicules  = $totalVehPrec > 0 ? round((($totalVehicules - $totalVehPrec) / $totalVehPrec) * 100, 1) : 0;
        $missionsActives = DB::table('missions')->where('est_supprime', 0)->where('statut', 'en_cours')->whereDate('date_depart_prevue', $now->toDateString())->count();

        $kmTotal = DB::table('missions')->where('est_supprime', 0)->where('statut', 'terminee')
            ->whereBetween('date_retour_reelle', [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()])
            ->whereNotNull('km_retour')->whereNotNull('km_depart')->whereRaw('km_retour > km_depart')
            ->selectRaw('SUM(km_retour - km_depart) as total')->value('total') ?? 0;

        $kmPrec = DB::table('missions')->where('est_supprime', 0)->where('statut', 'terminee')
            ->whereBetween('date_retour_reelle', [Carbon::now()->subMonth()->startOfMonth(), Carbon::now()->subMonth()->endOfMonth()])
            ->whereNotNull('km_retour')->whereNotNull('km_depart')->whereRaw('km_retour > km_depart')
            ->selectRaw('SUM(km_retour - km_depart) as total')->value('total') ?? 0;

        $trendKm      = $kmPrec > 0 ? round((($kmTotal - $kmPrec) / $kmPrec) * 100, 1) : 0;
        $consommation = DB::table('carnets_carburant')->where('est_supprime', 0)->whereBetween('date_plein', [$debut->toDateString(), $fin->toDateString()])->sum('litres') ?? 0;

        $debutTrimestre  = $now->copy()->startOfQuarter();
        $coutMaintenance = DB::table('interventions')->where('est_supprime', 0)
            ->whereBetween('date_creation', [$debutTrimestre->toDateTimeString(), $now->toDateTimeString()])
            ->selectRaw('COALESCE(SUM(cout_main_oeuvre + cout_pieces), 0) as total')->value('total') ?? 0;

        $alertes = DB::table('notifications')
            ->join('categories_notifications', 'notifications.categorie_id', '=', 'categories_notifications.id')
            ->where('categories_notifications.niveau_priorite', 'critique')
            ->where('categories_notifications.est_supprime', 0)
            ->whereDate('notifications.date_creation', '>=', $now->copy()->subDays(7)->toDateString())->count();

        $tempsMoyenRep      = DB::table('interventions')->where('est_supprime', 0)->where('statut', 'terminee')->whereNotNull('duree_minutes')->whereBetween('date_fin', [$debut->toDateTimeString(), $fin->toDateTimeString()])->avg('duree_minutes') ?? 0;
        $tempsMoyenRepPrec  = DB::table('interventions')->where('est_supprime', 0)->where('statut', 'terminee')->whereNotNull('duree_minutes')->whereBetween('date_fin', [$debutPrec->toDateTimeString(), $finPrec->toDateTimeString()])->avg('duree_minutes') ?? 0;
        $tempsMoyenRepH     = $tempsMoyenRep > 0 ? round($tempsMoyenRep / 60, 1) : 0;
        $trendTmpRep        = $tempsMoyenRepPrec > 0 ? round((($tempsMoyenRep - $tempsMoyenRepPrec) / $tempsMoyenRepPrec) * 100, 1) : 0;

        $tempsMoyenRes      = DB::table('interventions')->where('est_supprime', 0)->where('statut', 'terminee')->whereNotNull('date_debut')->whereNotNull('date_fin')->whereBetween('date_fin', [$debut->toDateTimeString(), $fin->toDateTimeString()])->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, date_debut, date_fin)) as moy')->value('moy') ?? 0;
        $tempsMoyenResPrec  = DB::table('interventions')->where('est_supprime', 0)->where('statut', 'terminee')->whereNotNull('date_debut')->whereNotNull('date_fin')->whereBetween('date_fin', [$debutPrec->toDateTimeString(), $finPrec->toDateTimeString()])->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, date_debut, date_fin)) as moy')->value('moy') ?? 0;
        $tempsMoyenResH     = $tempsMoyenRes > 0 ? round($tempsMoyenRes / 60, 1) : 0;
        $trendTmpRes        = $tempsMoyenResPrec > 0 ? round((($tempsMoyenRes - $tempsMoyenResPrec) / $tempsMoyenResPrec) * 100, 1) : 0;

        $totalMissions      = DB::table('missions')->where('est_supprime', 0)->whereBetween('date_depart_prevue', [$debut->toDateTimeString(), $fin->toDateTimeString()])->count();
        $totalMissionsPrec  = DB::table('missions')->where('est_supprime', 0)->whereBetween('date_depart_prevue', [$debutPrec->toDateTimeString(), $finPrec->toDateTimeString()])->count();
        $trendMissions      = $totalMissionsPrec > 0 ? round((($totalMissions - $totalMissionsPrec) / $totalMissionsPrec) * 100, 1) : 0;

        $totalInterventions      = DB::table('interventions')->where('est_supprime', 0)->whereBetween('date_creation', [$debut->toDateTimeString(), $fin->toDateTimeString()])->count();
        $totalInterventionsPrec  = DB::table('interventions')->where('est_supprime', 0)->whereBetween('date_creation', [$debutPrec->toDateTimeString(), $finPrec->toDateTimeString()])->count();
        $trendInterventions      = $totalInterventionsPrec > 0 ? round((($totalInterventions - $totalInterventionsPrec) / $totalInterventionsPrec) * 100, 1) : 0;

        $kmFormate   = $kmTotal >= 1_000_000 ? round($kmTotal / 1_000_000, 1) . 'M km' : number_format((int) $kmTotal, 0, ',', ' ') . ' km';
        $coutFormate = $coutMaintenance >= 1_000_000 ? round($coutMaintenance / 1_000_000, 1) . 'M CFA' : number_format((int) $coutMaintenance, 0, ',', ' ') . ' CFA';
        $trend       = fn($v) => $v != 0 ? ($v > 0 ? '+' : '') . $v . '% vs mois dernier' : null;

        return [
            ['title' => 'Total Véhicules',     'value' => (string) $totalVehicules,   'subtitle' => 'dans le parc',                  'trend' => $trend($trendVehicules),   'icon' => 'bi-car-front-fill',          'iconBg' => 'bg-blue-100 dark:bg-blue-800',    'textColor' => 'text-blue-600 dark:text-blue-400'],
            ['title' => 'Disponibles',          'value' => (string) $disponibles,      'subtitle' => 'prêts à partir',                'trend' => null,                      'icon' => 'bi-check-circle-fill',       'iconBg' => 'bg-green-100 dark:bg-green-800',  'textColor' => 'text-green-600 dark:text-green-400'],
            ['title' => 'En Maintenance',       'value' => (string) $enMaintenance,    'subtitle' => "à l'atelier",                  'trend' => null,                      'icon' => 'bi-tools',                   'iconBg' => 'bg-orange-100 dark:bg-orange-800','textColor' => 'text-orange-600 dark:text-orange-400'],
            ['title' => 'Missions Actives',     'value' => (string) $missionsActives,  'subtitle' => "en cours aujourd'hui",          'trend' => null,                      'icon' => 'bi-geo-alt-fill',            'iconBg' => 'bg-blue-100 dark:bg-blue-800',    'textColor' => 'text-blue-600 dark:text-blue-400'],
            ['title' => 'Kilométrage Total',    'value' => $kmFormate,                 'subtitle' => 'missions terminées ce mois',    'trend' => $trend($trendKm),          'icon' => 'bi-speedometer2',            'iconBg' => 'bg-purple-100 dark:bg-purple-800','textColor' => 'text-purple-600 dark:text-purple-400'],
            ['title' => 'Consommation',         'value' => number_format((float) $consommation, 0, ',', ' ') . ' L', 'subtitle' => 'carburant ce mois', 'trend' => null, 'icon' => 'bi-fuel-pump-fill', 'iconBg' => 'bg-yellow-100 dark:bg-yellow-800', 'textColor' => 'text-yellow-600 dark:text-yellow-400'],
            ['title' => 'Coût Maintenance',     'value' => $coutFormate,               'subtitle' => "main-d'œuvre + pièces (trim.)", 'trend' => null,                      'icon' => 'bi-currency-dollar',         'iconBg' => 'bg-orange-100 dark:bg-orange-800','textColor' => 'text-orange-600 dark:text-orange-400'],
            ['title' => 'Alertes',              'value' => (string) $alertes,          'subtitle' => 'critiques 7 derniers jours',    'trend' => null,                      'icon' => 'bi-exclamation-triangle-fill','iconBg' => 'bg-red-100 dark:bg-red-800',      'textColor' => 'text-red-600 dark:text-red-400'],
            ['title' => 'Tps Moyen Réparation', 'value' => $tempsMoyenRepH . 'h',      'subtitle' => 'durée saisie par intervention', 'trend' => $trend($trendTmpRep),      'icon' => 'bi-clock-history',           'iconBg' => 'bg-blue-100 dark:bg-blue-800',    'textColor' => 'text-blue-600 dark:text-blue-400'],
            ['title' => 'Tps Moyen Résolution', 'value' => $tempsMoyenResH . 'h',      'subtitle' => 'de date_debut à date_fin',      'trend' => $trend($trendTmpRes),      'icon' => 'bi-hourglass-split',         'iconBg' => 'bg-green-100 dark:bg-green-800',  'textColor' => 'text-green-600 dark:text-green-400'],
            ['title' => 'Total Missions',       'value' => (string) $totalMissions,    'subtitle' => 'planifiées ce mois',            'trend' => $trend($trendMissions),    'icon' => 'bi-flag-fill',               'iconBg' => 'bg-purple-100 dark:bg-purple-800','textColor' => 'text-purple-600 dark:text-purple-400'],
            ['title' => 'Interventions',        'value' => (string) $totalInterventions,'subtitle' => 'créées ce mois',               'trend' => $trend($trendInterventions),'icon' => 'bi-wrench',                  'iconBg' => 'bg-orange-100 dark:bg-orange-800','textColor' => 'text-orange-600 dark:text-orange-400'],
        ];
    }

    // =========================================================
    // Autres méthodes (inchangées)
    // =========================================================

    private function getDonutData(): array
    {
        $colors = ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#9ca3af','#ef4444','#ec4899'];
        $rows = DB::table('vehicules')->join('directions','vehicules.direction_id','=','directions.id')
            ->where('vehicules.est_supprime',0)->where('directions.est_supprime',0)
            ->select('directions.nom as label',DB::raw('COUNT(*) as value'))
            ->groupBy('directions.id','directions.nom')->orderByDesc('value')->get();
        $sansDirCount = DB::table('vehicules')->where('est_supprime',0)->whereNull('direction_id')->count();
        $total  = $rows->sum('value') + $sansDirCount;
        $result = $rows->map(function($row,$idx) use ($total,$colors) {
            return ['label'=>$row->label,'value'=>(int)$row->value,'color'=>$colors[$idx%count($colors)],'percentage'=>$total>0?(int)round(($row->value/$total)*100):0];
        })->toArray();
        if ($sansDirCount > 0) {
            $result[] = ['label'=>'Non affectés','value'=>$sansDirCount,'color'=>$colors[count($result)%count($colors)],'percentage'=>$total>0?(int)round(($sansDirCount/$total)*100):0];
        }
        return $result;
    }

    private function getBarChartData(): array
    {
        $moisLabels = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
        $annee = Carbon::now()->year;
        $result = [];
        for ($mois = 1; $mois <= 12; $mois++) {
            $debut = Carbon::create($annee,$mois,1)->startOfMonth();
            $fin   = Carbon::create($annee,$mois,1)->endOfMonth();
            $base  = fn($statut) => DB::table('inspections_vehicules')
                ->join('inspections','inspections_vehicules.inspection_id','=','inspections.id')
                ->where('inspections.est_supprime',0)->whereBetween('inspections.date_inspection',[$debut,$fin])
                ->where('inspections_vehicules.statut_global',$statut)->count();
            $result[] = [
                'month'       => $moisLabels[$mois-1],
                'total'       => DB::table('inspections_vehicules')->join('inspections','inspections_vehicules.inspection_id','=','inspections.id')->where('inspections.est_supprime',0)->whereBetween('inspections.date_inspection',[$debut,$fin])->distinct()->count('inspections_vehicules.vehicule_immatriculation'),
                'conforme'    => $base('conforme'),
                'nonConforme' => $base('non_conforme'),
                'danger'      => $base('danger_immediat'),
            ];
        }
        return $result;
    }

    private function getLineChartData(): array
    {
        $moisLabels = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
        $annee = Carbon::now()->year;
        $result = [];
        for ($mois = 1; $mois <= 12; $mois++) {
            $debut = Carbon::create($annee,$mois,1)->startOfMonth()->toDateString();
            $fin   = Carbon::create($annee,$mois,1)->endOfMonth()->toDateString();
            $result[] = [
                'month'        => $moisLabels[$mois-1],
                'consommation' => (int) round(DB::table('carnets_carburant')->where('est_supprime',0)->whereBetween('date_plein',[$debut,$fin])->sum('litres') ?? 0),
                'economies'    => (int) round(DB::table('missions')->where('est_supprime',0)->where('statut','terminee')->whereBetween(DB::raw('DATE(date_retour_reelle)'),[$debut,$fin])->whereNotNull('cout_carburant')->sum('cout_carburant') ?? 0),
            ];
        }
        return $result;
    }

    private function getInterventionsData(): array
    {
        $moisLabels = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
        $annee = Carbon::now()->year;
        $result = [];
        for ($mois = 1; $mois <= 12; $mois++) {
            $debut = Carbon::create($annee,$mois,1)->startOfMonth();
            $fin   = Carbon::create($annee,$mois,1)->endOfMonth();
            $result[] = [
                'month'   => $moisLabels[$mois-1],
                'creees'  => DB::table('interventions')->where('est_supprime',0)->whereBetween('date_creation',[$debut->toDateTimeString(),$fin->toDateTimeString()])->count(),
                'resolues'=> DB::table('interventions')->where('est_supprime',0)->where('statut','terminee')->whereNotNull('date_fin')->whereBetween('date_fin',[$debut->toDateTimeString(),$fin->toDateTimeString()])->count(),
            ];
        }
        return $result;
    }

    private function getInterventionsJourData(): array
    {
        $joursFr = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
        $lundi   = Carbon::now()->startOfWeek(Carbon::MONDAY);
        $result  = [];
        for ($i = 0; $i < 7; $i++) {
            $jour     = $lundi->copy()->addDays($i);
            $result[] = ['day'=>$joursFr[$i],'count'=>DB::table('interventions')->where('est_supprime',0)->whereDate('date_creation',$jour->toDateString())->count()];
        }
        return $result;
    }

    private function getUsersRoleData(): array
    {
        $colors = ['admin'=>'#ef4444','chef_parc'=>'#f59e0b','chauffeur'=>'#10b981','chef_tf'=>'#3b82f6','mecanicien'=>'#8b5cf6','agent_pc_radio'=>'#ec4899'];
        $rows = DB::table('utilisateurs')->join('roles','utilisateurs.role_id','=','roles.id')
            ->where('utilisateurs.est_supprime',0)->where('utilisateurs.est_actif',1)->where('roles.est_supprime',0)
            ->select('roles.libelle as role','roles.code',DB::raw('COUNT(*) as count'))
            ->groupBy('roles.id','roles.libelle','roles.code')->orderByDesc('count')->get();
        return $rows->map(fn($row) => ['role'=>$row->role,'count'=>(int)$row->count,'color'=>$colors[$row->code]??'#9ca3af'])->toArray();
    }

    private function getVehiculesMarqueData(): array
    {
        $colors = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#06b6d4'];
        $rows = DB::table('vehicules')->join('marques','vehicules.marque_id','=','marques.id')
            ->where('vehicules.est_supprime',0)->where('marques.est_actif',1)
            ->select('marques.nom as marque',DB::raw('COUNT(*) as count'))
            ->groupBy('marques.id','marques.nom')->orderByDesc('count')->limit(5)->get();
        return $rows->map(fn($row,$idx) => ['marque'=>$row->marque,'count'=>(int)$row->count,'color'=>$colors[$idx%count($colors)]])->toArray();
    }

    private function getVehiculesCategorieData(): array
    {
        $colors = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899'];
        $rows = DB::table('vehicules')->join('categories_vehicules','vehicules.categorie_id','=','categories_vehicules.id')
            ->where('vehicules.est_supprime',0)->where('categories_vehicules.est_actif',1)
            ->select('categories_vehicules.nom as categorie',DB::raw('COUNT(*) as count'))
            ->groupBy('categories_vehicules.id','categories_vehicules.nom')->orderByDesc('count')->get();
        return $rows->map(fn($row,$idx) => ['categorie'=>$row->categorie,'count'=>(int)$row->count,'color'=>$colors[$idx%count($colors)]])->toArray();
    }

    private function getDocumentsVehiculesData(): array
    {
        $today=$today=Carbon::today(); $dans30=Carbon::today()->addDays(30);
        $docs = DB::table('documents_vehicules')->where('est_supprime',0)->whereNotNull('date_expiration')
            ->select('vehicule_immatriculation',DB::raw('MAX(date_expiration) as date_exp'))->groupBy('vehicule_immatriculation')->get();
        $v=$eb=$e=0;
        foreach ($docs as $d) { $exp=Carbon::parse($d->date_exp); if ($exp->isPast()) $e++; elseif ($exp->lte($dans30)) $eb++; else $v++; }
        $t=$v+$eb+$e;
        return [
            ['label'=>'Assurance Valide','value'=>$v, 'color'=>'#10b981','percentage'=>$t>0?(int)round(($v/$t)*100):0],
            ['label'=>'Expire < 30j',   'value'=>$eb,'color'=>'#f59e0b','percentage'=>$t>0?(int)round(($eb/$t)*100):0],
            ['label'=>'Expirés',        'value'=>$e, 'color'=>'#ef4444','percentage'=>$t>0?(int)round(($e/$t)*100):0],
        ];
    }

    private function getDocumentsChaufffeursData(): array
    {
        $today=Carbon::today(); $dans30=Carbon::today()->addDays(30);
        $docs = DB::table('documents_chauffeurs')->where('est_supprime',0)->whereNotNull('date_expiration')
            ->select('chauffeur_user_id',DB::raw('MAX(date_expiration) as date_exp'))->groupBy('chauffeur_user_id')->get();
        $v=$eb=$e=0;
        foreach ($docs as $d) { $exp=Carbon::parse($d->date_exp); if ($exp->isPast()) $e++; elseif ($exp->lte($dans30)) $eb++; else $v++; }
        $t=$v+$eb+$e;
        return [
            ['label'=>'Permis Valide','value'=>$v, 'color'=>'#10b981','percentage'=>$t>0?(int)round(($v/$t)*100):0],
            ['label'=>'Expire < 30j', 'value'=>$eb,'color'=>'#f59e0b','percentage'=>$t>0?(int)round(($eb/$t)*100):0],
            ['label'=>'Expirés',      'value'=>$e, 'color'=>'#ef4444','percentage'=>$t>0?(int)round(($e/$t)*100):0],
        ];
    }

    private function getMissionsJour(): array
    {
        $today = Carbon::today()->toDateString();
        $rows  = DB::table('missions')->join('utilisateurs','missions.chauffeur_user_id','=','utilisateurs.id')
            ->where('missions.est_supprime',0)->whereDate('missions.date_depart_prevue',$today)
            ->whereIn('missions.statut',['planifiee','en_cours'])
            ->select('missions.vehicule_immatriculation as id','missions.destination as route',
                DB::raw("DATE_FORMAT(missions.date_depart_prevue,'%H:%i') as time"),
                DB::raw("CASE WHEN missions.statut='en_cours' THEN 'En cours' WHEN missions.statut='planifiee' THEN 'Planifiée' ELSE missions.statut END as status"),
                'missions.type_mission','utilisateurs.nom as chauffeur')
            ->orderBy('missions.date_depart_prevue')->limit(10)->get();
        return $rows->map(function ($row) {
            $icon = match ($row->type_mission) { 'transport_fonds' => 'bi-truck','mission_brousse' => 'bi-taxi-front-fill',default => 'bi-car-front-fill' };
            return ['id'=>$row->id,'route'=>$row->route.($row->chauffeur?' — '.$row->chauffeur:''),'time'=>$row->time,'status'=>$row->status,'icon'=>$icon];
        })->toArray();
    }

    private function getAlertes(): array
    {
        $alertes=[]; $today=Carbon::today(); $dans30=Carbon::today()->addDays(30);
        $docsVeh = DB::table('documents_vehicules')->where('est_supprime',0)->whereNotNull('date_expiration')
            ->where('date_expiration','<=',$dans30->toDateString())
            ->select('vehicule_immatriculation','date_expiration','type_document')->orderBy('date_expiration')->limit(5)->get();
        foreach ($docsVeh as $doc) {
            $exp=$exp=Carbon::parse($doc->date_expiration); $j=(int)$today->diffInDays($exp,false);
            $alertes[]=['type'=>$j<0?'error':'warning','title'=>$j<0?ucfirst(strtolower($doc->type_document)).' expiré':ucfirst(strtolower($doc->type_document)).' expire bientôt','vehicle'=>$doc->vehicule_immatriculation,'status'=>$j<0?'Jours dépassés':'Jj restants','days'=>(string)abs($j),'date'=>$exp->translatedFormat('M Y'),'icon'=>$j<0?'bi-exclamation-circle-fill':'bi-exclamation-triangle-fill'];
        }
        $docsChauf = DB::table('documents_chauffeurs')->join('utilisateurs','documents_chauffeurs.chauffeur_user_id','=','utilisateurs.id')
            ->where('documents_chauffeurs.est_supprime',0)->whereNotNull('documents_chauffeurs.date_expiration')
            ->where('documents_chauffeurs.date_expiration','<=',$dans30->toDateString())
            ->select('documents_chauffeurs.date_expiration','documents_chauffeurs.type_document','utilisateurs.nom as chauffeur')
            ->orderBy('documents_chauffeurs.date_expiration')->limit(3)->get();
        foreach ($docsChauf as $doc) {
            $exp=Carbon::parse($doc->date_expiration); $j=(int)$today->diffInDays($exp,false);
            $alertes[]=['type'=>$j<0?'error':'warning','title'=>$j<0?'Permis expiré':'Permis à renouveler','vehicle'=>$doc->chauffeur,'status'=>$j<0?'Jours dépassés':'Jj restants','days'=>(string)abs($j),'date'=>$exp->translatedFormat('d M Y'),'icon'=>'bi-person-badge-fill'];
        }
        $alertsKm = DB::table('alertes_kilometrage')->where('est_resolue',0)->select('vehicule_immatriculation','type_alerte','km_restants')->orderBy('km_restants')->limit(3)->get();
        foreach ($alertsKm as $a) {
            $km=(int)($a->km_restants??0);
            $alertes[]=['type'=>$km<=0?'error':'info','title'=>ucfirst(str_replace('_',' ',$a->type_alerte)),'vehicle'=>$a->vehicule_immatriculation,'status'=>'Km restants','days'=>'—','date'=>($km<=0?'Dépassé de ':'Dans ').number_format(abs($km),0,',',' ').' km','icon'=>$km<=0?'bi-exclamation-circle-fill':'bi-info-circle-fill'];
        }
        usort($alertes, fn($a,$b) => (['error'=>0,'warning'=>1,'info'=>2][$a['type']]??3)<=>(['error'=>0,'warning'=>1,'info'=>2][$b['type']]??3));
        return array_slice($alertes, 0, 10);
    }

    private function getPerformancesChauffeurs(): array
    {
        $debut=Carbon::now()->startOfMonth()->toDateString(); $fin=Carbon::now()->endOfMonth()->toDateString();
        $rows = DB::table('performances_chauffeurs')->join('utilisateurs','performances_chauffeurs.chauffeur_user_id','=','utilisateurs.id')
            ->where('utilisateurs.est_supprime',0)->where('utilisateurs.est_actif',1)
            ->where('performances_chauffeurs.date_debut_periode','<=',$fin)->where('performances_chauffeurs.date_fin_periode','>=',$debut)
            ->select('utilisateurs.nom as chauffeur',DB::raw('SUM(performances_chauffeurs.total_missions) as total_missions'),DB::raw('SUM(performances_chauffeurs.total_km) as total_km'),DB::raw('SUM(performances_chauffeurs.nb_accidents) as nb_accidents'),DB::raw('SUM(performances_chauffeurs.nb_anomalies_signalees) as nb_anomalies'),DB::raw('AVG(performances_chauffeurs.consommation_moyenne) as consommation_moyenne'),DB::raw('AVG(performances_chauffeurs.score_performance) as score'))
            ->groupBy('performances_chauffeurs.chauffeur_user_id','utilisateurs.nom')->orderByDesc('score')->limit(10)->get();
        $gs = DB::table('performances_chauffeurs')->where('date_debut_periode','<=',$fin)->where('date_fin_periode','>=',$debut)
            ->selectRaw('SUM(total_missions) as total_missions,SUM(total_km) as total_km,SUM(nb_accidents) as total_accidents,SUM(nb_anomalies_signalees) as total_anomalies,AVG(score_performance) as score_moyen')->first();
        $moisLabels=['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']; $mc=Carbon::now()->month; $annee=Carbon::now()->year; $evolution=[];
        for ($mois=1;$mois<=$mc;$mois++) {
            $dD=Carbon::create($annee,$mois,1)->startOfMonth()->toDateString(); $dF=Carbon::create($annee,$mois,1)->endOfMonth()->toDateString();
            $s=DB::table('performances_chauffeurs')->where('date_debut_periode','<=',$dF)->where('date_fin_periode','>=',$dD)->avg('score_performance');
            $evolution[]=['month'=>$moisLabels[$mois-1],'score'=>$s!==null?round((float)$s,1):0];
        }
        return ['summary'=>['total_missions'=>(int)($gs->total_missions??0),'total_km'=>(int)($gs->total_km??0),'total_accidents'=>(int)($gs->total_accidents??0),'total_anomalies'=>(int)($gs->total_anomalies??0),'score_moyen'=>round((float)($gs->score_moyen??0),1)],'classement'=>$rows->map(fn($row,$idx)=>['rang'=>$idx+1,'chauffeur'=>$row->chauffeur,'total_missions'=>(int)$row->total_missions,'total_km'=>(int)$row->total_km,'nb_accidents'=>(int)$row->nb_accidents,'nb_anomalies'=>(int)$row->nb_anomalies,'consommation_moyenne'=>$row->consommation_moyenne!==null?round((float)$row->consommation_moyenne,2):null,'score'=>$row->score!==null?round((float)$row->score,1):null,'badge'=>match(true){($row->score??0)>=80=>'excellent',($row->score??0)>=60=>'bon',($row->score??0)>=40=>'moyen',default=>'faible'}])->toArray(),'evolution'=>$evolution];
    }
}