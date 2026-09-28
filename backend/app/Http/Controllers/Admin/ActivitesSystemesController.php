<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JournalAudit;
use App\Models\Utilisateur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class ActivitesSystemesController extends Controller
{
    /** Nombre d'entrées par page par défaut */
    private const PAR_PAGE_DEFAUT = 15;

    /** Plafond d'entrées pour l'export (évite de charger toute la table) */
    private const EXPORT_MAX = 20000;

    /**
     * Règles de validation communes à tous les filtres.
     */
    private function reglesFiltres(): array
    {
        return [
            'periode'   => ['nullable', Rule::in(array_keys(JournalAudit::PERIODES))],
            'role'      => ['nullable', 'string', 'exists:roles,code'],
            'action'    => ['nullable', 'string', Rule::in(array_keys(JournalAudit::ACTIONS))],
            'table'     => ['nullable', 'string'],
            'user_id'   => ['nullable', 'integer', 'exists:utilisateurs,id'],
            'recherche' => ['nullable', 'string', 'max:150'],
        ];
    }

    private function filtresDepuisRequete(Request $request): array
    {
        return $request->validate(array_merge($this->reglesFiltres(), [
            'q' => ['nullable', 'string', 'max:150'],
        ]));
    }

    /**
     * GET /api/activites-systeme
     * Liste paginée des journaux d'audit, filtrable.
     */
    public function index(Request $request): JsonResponse
    {
        $filtres = $this->filtresDepuisRequete($request);
        $filtres['recherche'] = $filtres['recherche'] ?? $request->query('q');

        $perPage = (int) $request->query('per_page', self::PAR_PAGE_DEFAUT);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : self::PAR_PAGE_DEFAUT;

        $logs = JournalAudit::query()
            ->with(['utilisateur.role', 'utilisateur.direction'])
            ->filtrer($filtres)
            ->orderByDesc('date_creation')
            ->paginate($perPage)
            ->withQueryString();

        return response()->json([
            'success' => true,
            'data'    => $logs->getCollection()->map(fn ($log) => $this->formatLog($log)),
            'meta'    => [
                'current_page' => $logs->currentPage(),
                'last_page'    => $logs->lastPage(),
                'per_page'     => $logs->perPage(),
                'total'        => $logs->total(),
            ],
        ]);
    }

    /**
     * GET /api/activites-systeme/{id}
     * Détail complet d'une entrée (utilisé pour la modale de détail / diff).
     */
    public function show(int $id): JsonResponse
    {
        $log = JournalAudit::with(['utilisateur.role', 'utilisateur.direction'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $this->formatLog($log),
        ]);
    }

    /**
     * GET /api/activites-systeme/stats
     * KPI + répartitions (par action, par rôle) + sparkline 7 jours,
     * calculés sur le même périmètre filtré que la liste.
     */
    public function stats(Request $request): JsonResponse
    {
        $filtres = $this->filtresDepuisRequete($request);
        $filtres['recherche'] = $filtres['recherche'] ?? $request->query('q');

        $base = fn () => JournalAudit::query()->filtrer($filtres);

        $total = $base()->count();

        $parAction = array_fill_keys(array_keys(JournalAudit::ACTIONS), 0);
        $base()->select('action', DB::raw('count(*) as total'))
            ->groupBy('action')
            ->pluck('total', 'action')
            ->each(function ($count, $action) use (&$parAction) {
                $parAction[$action] = (int) $count;
            });

        $parRole = $base()
            ->join('utilisateurs', 'utilisateurs.id', '=', 'journaux_audit.user_id')
            ->join('roles', 'roles.id', '=', 'utilisateurs.role_id')
            ->select('roles.code as role_code', DB::raw('count(*) as total'))
            ->groupBy('roles.code')
            ->pluck('total', 'role_code');

        $parRoleComplet = [];
        foreach (\App\Models\Role::query()->pluck('code') as $code) {
            $parRoleComplet[$code] = (int) ($parRole[$code] ?? 0);
        }

        $utilisateursActifs = (clone $base())->distinct('user_id')->count('user_id');

        $tablesModifiees = (clone $base())
            ->whereIn('action', ['CREATE', 'UPDATE', 'DELETE'])
            ->distinct('nom_table')
            ->count('nom_table');

        // Sparkline : activité des 7 derniers jours (sur le périmètre filtré,
        // hors filtre de période afin de toujours montrer une tendance sur 7 jours)
        $filtresSansPeriode = $filtres;
        unset($filtresSansPeriode['periode']);
        $depuis = now()->subDays(6)->startOfDay();
        $parJour = JournalAudit::query()
            ->filtrer($filtresSansPeriode)
            ->where('date_creation', '>=', $depuis)
            ->select(DB::raw('DATE(date_creation) as jour'), DB::raw('count(*) as total'))
            ->groupBy('jour')
            ->pluck('total', 'jour');

        $sparkline = [];
        for ($i = 6; $i >= 0; $i--) {
            $jour = now()->subDays($i)->format('Y-m-d');
            $sparkline[] = (int) ($parJour[$jour] ?? 0);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'total'                => $total,
                'par_action'           => $parAction,
                'par_role'             => $parRoleComplet,
                'utilisateurs_actifs'  => $utilisateursActifs,
                'tables_modifiees'     => $tablesModifiees,
                'sparkline_7j'         => $sparkline,
            ],
        ]);
    }

    /**
     * GET /api/activites-systeme/utilisateurs
     * Liste des utilisateurs distincts (pour le filtre "Utilisateur").
     */
    public function utilisateurs(): JsonResponse
    {
        $utilisateurs = Utilisateur::query()
            ->with('role')
            ->orderBy('nom')
            ->get()
            ->map(fn (Utilisateur $u) => [
                'id'        => $u->id,
                'nom'       => $u->nom,
                'role_code' => $u->role?->code,
            ]);

        return response()->json([
            'success' => true,
            'data'    => $utilisateurs,
        ]);
    }

    /**
     * GET /api/activites-systeme/export
     * Renvoie l'intégralité des entrées filtrées (non paginées, plafonnées)
     * afin que le front génère le CSV / PDF, comme il le fait déjà.
     */
    public function export(Request $request): JsonResponse
    {
        $filtres = $this->filtresDepuisRequete($request);
        $filtres['recherche'] = $filtres['recherche'] ?? $request->query('q');

        $logs = JournalAudit::query()
            ->with(['utilisateur.role', 'utilisateur.direction'])
            ->filtrer($filtres)
            ->orderByDesc('date_creation')
            ->limit(self::EXPORT_MAX)
            ->get();

        // On trace la consultation/export dans le journal lui-même
        JournalAudit::tracer(
            $request->user()?->id,
            'READ',
            'journaux_audit',
            null,
            null,
            ['export' => true, 'filtres' => $filtres, 'nb_lignes' => $logs->count()]
        );

        return response()->json([
            'success' => true,
            'data'    => $logs->map(fn ($log) => $this->formatLog($log)),
            'total'   => $logs->count(),
            'tronque' => $logs->count() >= self::EXPORT_MAX,
        ]);
    }

    /**
     * Met en forme une entrée pour le front (mêmes clés que celles déjà
     * consommées par la page React Activitesysteme.jsx).
     */
    private function formatLog(JournalAudit $log): array
    {
        return [
            'id'                 => $log->id,
            'user_id'            => $log->user_id,
            'user_nom'           => $log->utilisateur?->nom ?? 'Utilisateur supprimé',
            'user_email'         => $log->utilisateur?->email,
            'user_role_code'     => $log->utilisateur?->role?->code,
            'user_direction'     => $log->utilisateur?->direction?->nom,
            'action'             => $log->action,
            'nom_table'          => $log->nom_table,
            'id_enregistrement'  => $log->id_enregistrement,
            'anciennes_valeurs'  => $log->anciennes_valeurs ? json_encode($log->anciennes_valeurs) : null,
            'nouvelles_valeurs'  => $log->nouvelles_valeurs ? json_encode($log->nouvelles_valeurs) : null,
            'adresse_ip'         => $log->adresse_ip,
            'user_agent'         => $log->user_agent,
            'libelle'            => $log->libelle,
            'date_creation'      => optional($log->date_creation)->toIso8601String(),
        ];
    }
}