<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    private const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

    /** Valeur exacte stockée en base dans vehicules.statut pour un véhicule en réparation */
    private const STATUT_EN_REPARATION = 'En reparation';

    public function index(): JsonResponse
    {
        // Cache 60 s : évite de recalculer tout le dashboard à chaque chargement
        $payload = Cache::remember('admin_dashboard_v2', 60, fn () => [
            'stats_cards'                  => $this->getStatsCards(),
            'donut_data'                   => $this->getDonutData(),
            'bar_chart_data'               => $this->getBarChartData(),
            'line_chart_data'              => $this->getLineChartData(),
            'interventions_data'           => $this->getInterventionsData(),
            'interventions_jour_data'      => $this->getInterventionsJourData(),
            'users_role_data'              => $this->getUsersRoleData(),
            'vehicules_marque_data'        => $this->getVehiculesMarqueData(),
            'vehicules_categorie_data'     => $this->getVehiculesCategorieData(),
            'documents_vehicules_data'     => $this->getDocumentsVehiculesData(),
            'documents_chauffeurs_data'    => $this->getDocumentsChaufffeursData(),
            'missions'                     => $this->getMissionsJour(),
            'performances_chauffeurs_data' => $this->getPerformancesChauffeurs(),
        ]);

        return response()->json($payload);
    }

    // =========================================================
    // GET /api/admin/dashboard/kpi-vehicules
    //
    // Paramètres :
    //   - periode         : '1m' | '3m' | '6m' | '1an'  (défaut : '3m')
    //   - search          : filtre texte libre
    //   - immatriculation : filtre sur UN seul véhicule (export individuel)
    //   - page            : numéro de page (défaut : 1)
    //   - per_page        : lignes par page (défaut : 15, max : 1000)
    // =========================================================
    public function getKpiVehiculesDetail(Request $request): JsonResponse
    {
        $periode         = $request->input('periode', '3m');
        $search          = trim($request->input('search', ''));
        $immatriculation = trim($request->input('immatriculation', ''));
        $page            = max(1, (int) $request->input('page', 1));
        // NB : le front demande per_page=999 pour les exports → on autorise jusqu'à 1000
        $perPage         = min(1000, max(5, (int) $request->input('per_page', 15)));

        $now   = Carbon::now();
        $debut = match ($periode) {
            '1m'  => $now->copy()->startOfMonth(),
            '6m'  => $now->copy()->subMonths(6)->startOfMonth(),
            '1an' => $now->copy()->subMonths(11)->startOfMonth(),
            default => $now->copy()->subMonths(2)->startOfMonth(),   // '3m'
        };

        $debutInt = (int) $debut->format('Y') * 100 + (int) $debut->format('n');
        $finInt   = (int) $now->format('Y')   * 100 + (int) $now->format('n');

        $query = DB::table('kpi_vehicules as kv')
            ->join('vehicules as v',      'kv.vehicule_immatriculation', '=', 'v.immatriculation')
            ->join('marques as m',        'v.marque_id',                 '=', 'm.id')
            ->join('modeles as mo',       'v.modele_id',                 '=', 'mo.id')
            ->leftJoin('directions as d', 'v.direction_id',              '=', 'd.id')
            ->where('v.est_supprime', 0)
            ->whereRaw('(kv.annee_periode * 100 + kv.mois_periode) >= ?', [$debutInt])
            ->whereRaw('(kv.annee_periode * 100 + kv.mois_periode) <= ?', [$finInt]);

        if ($immatriculation !== '') {
            $query->where('kv.vehicule_immatriculation', $immatriculation);
        }

        if ($search !== '') {
            $like = '%' . $search . '%';
            $query->where(function ($q) use ($like) {
                $q->where('kv.vehicule_immatriculation', 'like', $like)
                  ->orWhere('m.nom',  'like', $like)
                  ->orWhere('mo.nom', 'like', $like)
                  ->orWhere('d.nom',  'like', $like);
            });
        }

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
            DB::raw("(SELECT COUNT(*) FROM accidents a
                      WHERE a.vehicule_immatriculation = kv.vehicule_immatriculation
                        AND a.est_supprime = 0
                        AND (YEAR(a.date_accident) * 100 + MONTH(a.date_accident)) BETWEEN {$debutInt} AND {$finInt}
                     ) as nb_accidents"),

            DB::raw('SUM(kv.cout_missions + kv.cout_interventions + kv.cout_pieces) as cout_total'),

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

        $allRows = $query->get();
        $total   = $allRows->count();
        $rows    = $allRows->forPage($page, $perPage)->values();

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
                'immatriculation' => $immatriculation ?: null,
            ],
        ]);
    }

    // =========================================================
    // 1. STATS CARDS  (11 cartes — « Alertes » retirée,
    //    « En Maintenance » remplacée par « En Réparation »)
    //    Requêtes regroupées pour limiter les allers-retours SQL.
    // =========================================================
    private function getStatsCards(): array
    {
        $now       = Carbon::now();
        $debut     = $now->copy()->startOfMonth();
        $fin       = $now->copy()->endOfMonth();
        $debutPrec = $now->copy()->subMonth()->startOfMonth();
        $finPrec   = $now->copy()->subMonth()->endOfMonth();

        $dtDebut     = $debut->toDateTimeString();
        $dtFin       = $fin->toDateTimeString();
        $dtDebutPrec = $debutPrec->toDateTimeString();
        $dtFinPrec   = $finPrec->toDateTimeString();
        $dtJourDebut = $now->copy()->startOfDay()->toDateTimeString();
        $dtJourFin   = $now->copy()->endOfDay()->toDateTimeString();

        $pct = fn ($cur, $prec) => $prec > 0 ? round((($cur - $prec) / $prec) * 100, 1) : 0;

        // ── Véhicules : 1 seule requête ──
        // NB : l'ordre des bindings suit l'ordre des « ? » dans la requête
        $veh = DB::table('vehicules')
            ->where('est_supprime', 0)
            ->selectRaw("
                COUNT(*) as total,
                COALESCE(SUM(statut = 'disponible'), 0) as disponibles,
                COALESCE(SUM(statut = ?), 0)            as en_reparation,
                COALESCE(SUM(date_creation < ?), 0)     as total_prec
            ", [self::STATUT_EN_REPARATION, $dtDebut])
            ->first();

        $totalVehicules = (int) $veh->total;
        $disponibles    = (int) $veh->disponibles;
        $enReparation   = (int) $veh->en_reparation;
        $trendVehicules = $pct($totalVehicules, (int) $veh->total_prec);

        // ── Missions : mois courant + précédent + actives aujourd'hui ──
        $mis = DB::table('missions')
            ->where('est_supprime', 0)
            ->whereBetween('date_depart_prevue', [$dtDebutPrec, $dtFin])
            ->selectRaw("
                COALESCE(SUM(date_depart_prevue BETWEEN ? AND ?), 0) as cur,
                COALESCE(SUM(date_depart_prevue BETWEEN ? AND ?), 0) as prec,
                COALESCE(SUM(statut = 'en_cours' AND date_depart_prevue BETWEEN ? AND ?), 0) as actives
            ", [$dtDebut, $dtFin, $dtDebutPrec, $dtFinPrec, $dtJourDebut, $dtJourFin])
            ->first();

        $totalMissions     = (int) $mis->cur;
        $totalMissionsPrec = (int) $mis->prec;
        $missionsActives   = (int) $mis->actives;
        $trendMissions     = $pct($totalMissions, $totalMissionsPrec);

        // ── Kilométrage : mois courant + précédent ──
        $kmRow = DB::table('missions')
            ->where('est_supprime', 0)
            ->where('statut', 'terminee')
            ->whereBetween('date_retour_reelle', [$dtDebutPrec, $dtFin])
            ->whereNotNull('km_retour')->whereNotNull('km_depart')
            ->whereRaw('km_retour > km_depart')
            ->selectRaw("
                COALESCE(SUM(CASE WHEN date_retour_reelle BETWEEN ? AND ? THEN km_retour - km_depart ELSE 0 END), 0) as cur,
                COALESCE(SUM(CASE WHEN date_retour_reelle BETWEEN ? AND ? THEN km_retour - km_depart ELSE 0 END), 0) as prec
            ", [$dtDebut, $dtFin, $dtDebutPrec, $dtFinPrec])
            ->first();

        $kmTotal = (float) $kmRow->cur;
        $kmPrec  = (float) $kmRow->prec;
        $trendKm = $pct($kmTotal, $kmPrec);

        // ── Consommation carburant du mois ──
        $consommation = (float) DB::table('carnets_carburant')
            ->where('est_supprime', 0)
            ->whereBetween('date_plein', [$debut->toDateString(), $fin->toDateString()])
            ->sum('litres');

        // ── Interventions : créées (mois courant + précédent) ──
        $intCrees = DB::table('interventions')
            ->where('est_supprime', 0)
            ->whereBetween('date_creation', [$dtDebutPrec, $dtFin])
            ->selectRaw("
                COALESCE(SUM(date_creation BETWEEN ? AND ?), 0) as cur,
                COALESCE(SUM(date_creation BETWEEN ? AND ?), 0) as prec
            ", [$dtDebut, $dtFin, $dtDebutPrec, $dtFinPrec])
            ->first();

        $totalInterventions     = (int) $intCrees->cur;
        $totalInterventionsPrec = (int) $intCrees->prec;
        $trendInterventions     = $pct($totalInterventions, $totalInterventionsPrec);

        // ── Coût maintenance du trimestre ──
        $coutMaintenance = (float) (DB::table('interventions')
            ->where('est_supprime', 0)
            ->whereBetween('date_creation', [$now->copy()->startOfQuarter()->toDateTimeString(), $now->toDateTimeString()])
            ->selectRaw('COALESCE(SUM(cout_main_oeuvre + cout_pieces), 0) as total')
            ->value('total') ?? 0);

        // ── Interventions terminées : temps de réparation + résolution (mois courant + précédent) ──
        $tm = DB::table('interventions')
            ->where('est_supprime', 0)
            ->where('statut', 'terminee')
            ->whereBetween('date_fin', [$dtDebutPrec, $dtFin])
            ->selectRaw("
                AVG(CASE WHEN date_fin BETWEEN ? AND ? AND duree_minutes IS NOT NULL THEN duree_minutes END) as rep_cur,
                AVG(CASE WHEN date_fin BETWEEN ? AND ? AND duree_minutes IS NOT NULL THEN duree_minutes END) as rep_prec,
                AVG(CASE WHEN date_fin BETWEEN ? AND ? AND date_debut IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, date_debut, date_fin) END) as res_cur,
                AVG(CASE WHEN date_fin BETWEEN ? AND ? AND date_debut IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, date_debut, date_fin) END) as res_prec
            ", [$dtDebut, $dtFin, $dtDebutPrec, $dtFinPrec, $dtDebut, $dtFin, $dtDebutPrec, $dtFinPrec])
            ->first();

        $tempsMoyenRep     = (float) ($tm->rep_cur  ?? 0);
        $tempsMoyenRepPrec = (float) ($tm->rep_prec ?? 0);
        $tempsMoyenRes     = (float) ($tm->res_cur  ?? 0);
        $tempsMoyenResPrec = (float) ($tm->res_prec ?? 0);

        $tempsMoyenRepH = $tempsMoyenRep > 0 ? round($tempsMoyenRep / 60, 1) : 0;
        $tempsMoyenResH = $tempsMoyenRes > 0 ? round($tempsMoyenRes / 60, 1) : 0;
        $trendTmpRep    = $pct($tempsMoyenRep, $tempsMoyenRepPrec);
        $trendTmpRes    = $pct($tempsMoyenRes, $tempsMoyenResPrec);

        $kmFormate   = $kmTotal >= 1_000_000 ? round($kmTotal / 1_000_000, 1) . 'M km' : number_format((int) $kmTotal, 0, ',', ' ') . ' km';
        $coutFormate = $coutMaintenance >= 1_000_000 ? round($coutMaintenance / 1_000_000, 1) . 'M CFA' : number_format((int) $coutMaintenance, 0, ',', ' ') . ' CFA';
        $trend       = fn($v) => $v != 0 ? ($v > 0 ? '+' : '') . $v . '% vs mois dernier' : null;

        return [
            ['title' => 'Total Véhicules',     'value' => (string) $totalVehicules,   'subtitle' => 'dans le parc',                  'trend' => $trend($trendVehicules),   'icon' => 'bi-car-front-fill',    'iconBg' => 'bg-blue-100 dark:bg-blue-800',    'textColor' => 'text-blue-600 dark:text-blue-400'],
            ['title' => 'Disponibles',          'value' => (string) $disponibles,      'subtitle' => 'prêts à partir',                'trend' => null,                      'icon' => 'bi-check-circle-fill', 'iconBg' => 'bg-green-100 dark:bg-green-800',  'textColor' => 'text-green-600 dark:text-green-400'],
            ['title' => 'En reparation',        'value' => (string) $enReparation,     'subtitle' => "Au garage",                     'trend' => null,                      'icon' => 'bi-tools',             'iconBg' => 'bg-orange-100 dark:bg-orange-800','textColor' => 'text-orange-600 dark:text-orange-400'],
            ['title' => 'Interventions',        'value' => (string) $totalInterventions,'subtitle' => 'créées ce mois',               'trend' => $trend($trendInterventions),'icon' => 'bi-wrench',            'iconBg' => 'bg-orange-100 dark:bg-orange-800','textColor' => 'text-orange-600 dark:text-orange-400'],
            ['title' => 'Missions Actives',     'value' => (string) $missionsActives,  'subtitle' => "en cours aujourd'hui",          'trend' => null,                      'icon' => 'bi-geo-alt-fill',      'iconBg' => 'bg-blue-100 dark:bg-blue-800',    'textColor' => 'text-blue-600 dark:text-blue-400'],
            ['title' => 'Kilométrage Total',    'value' => $kmFormate,                 'subtitle' => 'missions terminées ce mois',    'trend' => $trend($trendKm),          'icon' => 'bi-speedometer2',      'iconBg' => 'bg-purple-100 dark:bg-purple-800','textColor' => 'text-purple-600 dark:text-purple-400'],
            ['title' => 'Consommation',         'value' => number_format($consommation, 0, ',', ' ') . ' L', 'subtitle' => 'carburant ce mois', 'trend' => null, 'icon' => 'bi-fuel-pump-fill', 'iconBg' => 'bg-yellow-100 dark:bg-yellow-800', 'textColor' => 'text-yellow-600 dark:text-yellow-400'],
            ['title' => 'Coût Maintenance',     'value' => $coutFormate,               'subtitle' => "main-d'œuvre + pièces (trim.)", 'trend' => null,                      'icon' => 'bi-currency-dollar',   'iconBg' => 'bg-orange-100 dark:bg-orange-800','textColor' => 'text-orange-600 dark:text-orange-400'],
            ['title' => 'Tps Moyen Réparation', 'value' => $tempsMoyenRepH . 'h',      'subtitle' => 'durée saisie par intervention', 'trend' => $trend($trendTmpRep),      'icon' => 'bi-clock-history',     'iconBg' => 'bg-blue-100 dark:bg-blue-800',    'textColor' => 'text-blue-600 dark:text-blue-400'],
            ['title' => 'Tps Moyen Résolution', 'value' => $tempsMoyenResH . 'h',      'subtitle' => 'de date_debut à date_fin',      'trend' => $trend($trendTmpRes),      'icon' => 'bi-hourglass-split',   'iconBg' => 'bg-green-100 dark:bg-green-800',  'textColor' => 'text-green-600 dark:text-green-400'],
            ['title' => 'Total Missions',       'value' => (string) $totalMissions,    'subtitle' => 'planifiées ce mois',            'trend' => $trend($trendMissions),    'icon' => 'bi-flag-fill',         'iconBg' => 'bg-purple-100 dark:bg-purple-800','textColor' => 'text-purple-600 dark:text-purple-400'],
            ['title' => 'Interventions',        'value' => (string) $totalInterventions,'subtitle' => 'créées ce mois',               'trend' => $trend($trendInterventions),'icon' => 'bi-wrench',            'iconBg' => 'bg-orange-100 dark:bg-orange-800','textColor' => 'text-orange-600 dark:text-orange-400'],
        ];
    }

    // =========================================================
    // Graphiques
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

    /** 1 requête groupée par mois (au lieu de 48) */
    private function getBarChartData(): array
    {
        $annee = Carbon::now()->year;

        $rows = DB::table('inspections_vehicules as iv')
            ->join('inspections as i', 'iv.inspection_id', '=', 'i.id')
            ->where('i.est_supprime', 0)
            ->whereBetween('i.date_inspection', ["$annee-01-01 00:00:00", "$annee-12-31 23:59:59"])
            ->selectRaw("
                MONTH(i.date_inspection) as m,
                COUNT(DISTINCT iv.vehicule_immatriculation) as total,
                COALESCE(SUM(iv.statut_global = 'conforme'), 0)        as conforme,
                COALESCE(SUM(iv.statut_global = 'non_conforme'), 0)    as non_conforme,
                COALESCE(SUM(iv.statut_global = 'danger_immediat'), 0) as danger
            ")
            ->groupByRaw('MONTH(i.date_inspection)')
            ->get()->keyBy('m');

        $result = [];
        for ($m = 1; $m <= 12; $m++) {
            $r = $rows->get($m);
            $result[] = [
                'month'       => self::MOIS[$m - 1],
                'total'       => (int) ($r->total ?? 0),
                'conforme'    => (int) ($r->conforme ?? 0),
                'nonConforme' => (int) ($r->non_conforme ?? 0),
                'danger'      => (int) ($r->danger ?? 0),
            ];
        }
        return $result;
    }

    /** 2 requêtes groupées (au lieu de 24) */
    private function getLineChartData(): array
    {
        $annee = Carbon::now()->year;

        $conso = DB::table('carnets_carburant')
            ->where('est_supprime', 0)
            ->whereBetween('date_plein', ["$annee-01-01", "$annee-12-31"])
            ->selectRaw('MONTH(date_plein) as m, COALESCE(SUM(litres), 0) as total')
            ->groupByRaw('MONTH(date_plein)')
            ->pluck('total', 'm');

        $eco = DB::table('missions')
            ->where('est_supprime', 0)
            ->where('statut', 'terminee')
            ->whereNotNull('cout_carburant')
            ->whereBetween('date_retour_reelle', ["$annee-01-01 00:00:00", "$annee-12-31 23:59:59"])
            ->selectRaw('MONTH(date_retour_reelle) as m, COALESCE(SUM(cout_carburant), 0) as total')
            ->groupByRaw('MONTH(date_retour_reelle)')
            ->pluck('total', 'm');

        $result = [];
        for ($m = 1; $m <= 12; $m++) {
            $result[] = [
                'month'        => self::MOIS[$m - 1],
                'consommation' => (int) round((float) ($conso[$m] ?? 0)),
                'economies'    => (int) round((float) ($eco[$m] ?? 0)),
            ];
        }
        return $result;
    }

    /** 2 requêtes groupées (au lieu de 24) */
    private function getInterventionsData(): array
    {
        $annee = Carbon::now()->year;
        $d1 = "$annee-01-01 00:00:00";
        $d2 = "$annee-12-31 23:59:59";

        $creees = DB::table('interventions')
            ->where('est_supprime', 0)
            ->whereBetween('date_creation', [$d1, $d2])
            ->selectRaw('MONTH(date_creation) as m, COUNT(*) as total')
            ->groupByRaw('MONTH(date_creation)')
            ->pluck('total', 'm');

        $resolues = DB::table('interventions')
            ->where('est_supprime', 0)
            ->where('statut', 'terminee')
            ->whereNotNull('date_fin')
            ->whereBetween('date_fin', [$d1, $d2])
            ->selectRaw('MONTH(date_fin) as m, COUNT(*) as total')
            ->groupByRaw('MONTH(date_fin)')
            ->pluck('total', 'm');

        $result = [];
        for ($m = 1; $m <= 12; $m++) {
            $result[] = [
                'month'    => self::MOIS[$m - 1],
                'creees'   => (int) ($creees[$m] ?? 0),
                'resolues' => (int) ($resolues[$m] ?? 0),
            ];
        }
        return $result;
    }

    /** 1 requête groupée par jour (au lieu de 7) */
    private function getInterventionsJourData(): array
    {
        $joursFr = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
        $lundi   = Carbon::now()->startOfWeek(Carbon::MONDAY);
        $dimanche = $lundi->copy()->addDays(6)->endOfDay();

        $counts = DB::table('interventions')
            ->where('est_supprime', 0)
            ->whereBetween('date_creation', [$lundi->toDateTimeString(), $dimanche->toDateTimeString()])
            ->selectRaw('DATE(date_creation) as d, COUNT(*) as total')
            ->groupByRaw('DATE(date_creation)')
            ->pluck('total', 'd');

        $result = [];
        for ($i = 0; $i < 7; $i++) {
            $jour     = $lundi->copy()->addDays($i)->toDateString();
            $result[] = ['day' => $joursFr[$i], 'count' => (int) ($counts[$jour] ?? 0)];
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
        return $this->buildDocsStatus(
            DB::table('documents_vehicules')->where('est_supprime', 0)->whereNotNull('date_expiration')
                ->select('vehicule_immatriculation', DB::raw('MAX(date_expiration) as date_exp'))
                ->groupBy('vehicule_immatriculation')->get(),
            'Assurance Valide'
        );
    }

    private function getDocumentsChaufffeursData(): array
    {
        return $this->buildDocsStatus(
            DB::table('documents_chauffeurs')->where('est_supprime', 0)->whereNotNull('date_expiration')
                ->select('chauffeur_user_id', DB::raw('MAX(date_expiration) as date_exp'))
                ->groupBy('chauffeur_user_id')->get(),
            'Permis Valide'
        );
    }

    private function buildDocsStatus($docs, string $labelValide): array
    {
        $dans30 = Carbon::today()->addDays(30);
        $v = $eb = $e = 0;
        foreach ($docs as $d) {
            $exp = Carbon::parse($d->date_exp);
            if ($exp->isPast()) $e++;
            elseif ($exp->lte($dans30)) $eb++;
            else $v++;
        }
        $t = $v + $eb + $e;
        return [
            ['label'=>$labelValide,  'value'=>$v,  'color'=>'#10b981','percentage'=>$t>0?(int)round(($v/$t)*100):0],
            ['label'=>'Expire < 30j','value'=>$eb, 'color'=>'#f59e0b','percentage'=>$t>0?(int)round(($eb/$t)*100):0],
            ['label'=>'Expirés',     'value'=>$e,  'color'=>'#ef4444','percentage'=>$t>0?(int)round(($e/$t)*100):0],
        ];
    }

    private function getMissionsJour(): array
    {
        $debut = Carbon::today()->startOfDay()->toDateTimeString();
        $fin   = Carbon::today()->endOfDay()->toDateTimeString();
        $rows  = DB::table('missions')->join('utilisateurs','missions.chauffeur_user_id','=','utilisateurs.id')
            ->where('missions.est_supprime',0)
            ->whereBetween('missions.date_depart_prevue', [$debut, $fin])
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

    /** Évolution du score : 1 requête + calcul PHP (au lieu d'une requête par mois) */
    private function getPerformancesChauffeurs(): array
    {
        $now   = Carbon::now();
        $debut = $now->copy()->startOfMonth()->toDateString();
        $fin   = $now->copy()->endOfMonth()->toDateString();

        $rows = DB::table('performances_chauffeurs')->join('utilisateurs','performances_chauffeurs.chauffeur_user_id','=','utilisateurs.id')
            ->where('utilisateurs.est_supprime',0)->where('utilisateurs.est_actif',1)
            ->where('performances_chauffeurs.date_debut_periode','<=',$fin)->where('performances_chauffeurs.date_fin_periode','>=',$debut)
            ->select('utilisateurs.nom as chauffeur',
                DB::raw('SUM(performances_chauffeurs.total_missions) as total_missions'),
                DB::raw('SUM(performances_chauffeurs.total_km) as total_km'),
                DB::raw('SUM(performances_chauffeurs.nb_accidents) as nb_accidents'),
                DB::raw('SUM(performances_chauffeurs.nb_anomalies_signalees) as nb_anomalies'),
                DB::raw('AVG(performances_chauffeurs.consommation_moyenne) as consommation_moyenne'),
                DB::raw('AVG(performances_chauffeurs.score_performance) as score'))
            ->groupBy('performances_chauffeurs.chauffeur_user_id','utilisateurs.nom')
            ->orderByDesc('score')->limit(10)->get();

        $gs = DB::table('performances_chauffeurs')
            ->where('date_debut_periode','<=',$fin)->where('date_fin_periode','>=',$debut)
            ->selectRaw('SUM(total_missions) as total_missions,SUM(total_km) as total_km,SUM(nb_accidents) as total_accidents,SUM(nb_anomalies_signalees) as total_anomalies,AVG(score_performance) as score_moyen')
            ->first();

        // Évolution annuelle : 1 seule requête, regroupement par mois en PHP
        $annee = $now->year;
        $perfRows = DB::table('performances_chauffeurs')
            ->where('date_debut_periode', '<=', "$annee-12-31")
            ->where('date_fin_periode',   '>=', "$annee-01-01")
            ->whereNotNull('score_performance')
            ->get(['date_debut_periode', 'date_fin_periode', 'score_performance']);

        $evolution = [];
        for ($m = 1; $m <= $now->month; $m++) {
            $dD = Carbon::create($annee, $m, 1)->startOfMonth()->toDateString();
            $dF = Carbon::create($annee, $m, 1)->endOfMonth()->toDateString();
            $scores = $perfRows->filter(fn ($r) => $r->date_debut_periode <= $dF && $r->date_fin_periode >= $dD)
                               ->pluck('score_performance');
            $evolution[] = [
                'month' => self::MOIS[$m - 1],
                'score' => $scores->isNotEmpty() ? round((float) $scores->avg(), 1) : 0,
            ];
        }

        return [
            'summary' => [
                'total_missions'  => (int) ($gs->total_missions ?? 0),
                'total_km'        => (int) ($gs->total_km ?? 0),
                'total_accidents' => (int) ($gs->total_accidents ?? 0),
                'total_anomalies' => (int) ($gs->total_anomalies ?? 0),
                'score_moyen'     => round((float) ($gs->score_moyen ?? 0), 1),
            ],
            'classement' => $rows->map(fn($row, $idx) => [
                'rang'                 => $idx + 1,
                'chauffeur'            => $row->chauffeur,
                'total_missions'       => (int) $row->total_missions,
                'total_km'             => (int) $row->total_km,
                'nb_accidents'         => (int) $row->nb_accidents,
                'nb_anomalies'         => (int) $row->nb_anomalies,
                'consommation_moyenne' => $row->consommation_moyenne !== null ? round((float) $row->consommation_moyenne, 2) : null,
                'score'                => $row->score !== null ? round((float) $row->score, 1) : null,
                'badge'                => match (true) {
                    ($row->score ?? 0) >= 80 => 'excellent',
                    ($row->score ?? 0) >= 60 => 'bon',
                    ($row->score ?? 0) >= 40 => 'moyen',
                    default                  => 'faible',
                },
            ])->toArray(),
            'evolution' => $evolution,
        ];
    }
}