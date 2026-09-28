<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HistoriqueConnexion;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class HistoriqueConnexionController extends Controller
{
    protected function periodeJours(?string $code): int
    {
        return match ($code) {
            '7j'   => 7,
            '90j'  => 90,
            '180j' => 180,
            '365j' => 365,
            default => 30, // '30j'
        };
    }

    public function index(Request $request)
    {
        $jours = $this->periodeJours($request->get('periode'));

        $query = HistoriqueConnexion::with(['utilisateur.role', 'utilisateur.direction'])
            ->where('login_at', '>=', now()->subDays($jours));

        if ($request->filled('role')) {
            $query->whereHas('utilisateur.role', fn ($q) => $q->where('code', $request->role));
        }

        if ($request->filled('statut')) {
            $request->statut === 'active'
                ? $query->whereNull('logout_at')
                : $query->whereNotNull('logout_at');
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('adresse_ip', 'like', "%{$s}%")
                  ->orWhereHas('utilisateur', fn ($u) => $u->where('nom', 'like', "%{$s}%")
                                                            ->orWhere('email', 'like', "%{$s}%"));
            });
        }

        $all = $query->orderByDesc('login_at')->get();

        // Enrichissement (parsing navigateur/OS) + filtres post-parsing
        $enriched = $all->map(function (HistoriqueConnexion $h) {
            $agentInfo = $h->parsedAgent();
            return [
                'id'                 => $h->id,
                'session_id'         => 'SES-' . str_pad($h->id, 6, '0', STR_PAD_LEFT),
                'user_id'            => $h->user_id,
                'user_nom'           => $h->utilisateur->nom ?? '—',
                'user_email'         => $h->utilisateur->email ?? '—',
                'user_role'          => $h->utilisateur->role->code ?? null,
                'user_role_libelle'  => $h->utilisateur->role->libelle ?? null,
                'user_direction'     => $h->utilisateur->direction->nom ?? null,
                'navigateur'         => $agentInfo['navigateur'],
                'navigateur_version' => $agentInfo['navigateur_version'],
                'os'                 => $agentInfo['os'],
                'os_version'         => $agentInfo['os_version'],
                'adresse_ip'         => $h->adresse_ip,
                'is_externe'         => $h->is_externe,
                'login_at'           => $h->login_at,
                'logout_at'          => $h->logout_at,
                'duree_mins'         => $h->duree_mins,
                'is_active'          => $h->is_active,
                'user_agent'         => $h->user_agent,
            ];
        });

        if ($request->filled('navigateur')) {
            $enriched = $enriched->filter(fn ($s) => strtolower($s['navigateur']) === strtolower($request->navigateur));
        }
        if ($request->filled('os')) {
            $enriched = $enriched->filter(fn ($s) => strtolower($s['os']) === strtolower($request->os));
        }

        $enriched = $enriched->values();
        $total = $enriched->count();

        // ── Stats globales (sur l'ensemble filtré, pas seulement la page) ──
        $nbActive     = $enriched->where('is_active', true)->count();
        $dureeMoyenne = $total ? (int) round($enriched->avg('duree_mins')) : 0;

        $navStats = $enriched->groupBy('navigateur')->map->count();
        $osStats  = $enriched->groupBy('os')->map->count();
        $heures   = $enriched->groupBy(fn ($s) => Carbon::parse($s['login_at'])->format('G'))->map->count();

        // ── Pagination manuelle (le tri/parsing se fait en mémoire) ──
        $perPage = (int) $request->get('per_page', 10);
        $page    = (int) $request->get('page', 1);

        return response()->json([
            'data' => $enriched->forPage($page, $perPage)->values(),
            'meta' => [
                'current_page' => $page,
                'last_page'    => (int) ceil($total / $perPage) ?: 1,
                'total'        => $total,
                'per_page'     => $perPage,
            ],
            'stats' => [
                'total'              => $total,
                'en_ligne'           => $nbActive,
                'deconnectes'        => $total - $nbActive,
                'duree_moyenne_mins' => $dureeMoyenne,
            ],
            'navigateurs' => $navStats,
            'os'          => $osStats,
            'heures'      => $heures,
        ]);
    }

    public function show($id)
    {
        $h = HistoriqueConnexion::with(['utilisateur.role', 'utilisateur.direction'])->findOrFail($id);
        $agentInfo = $h->parsedAgent();

        return response()->json(array_merge($agentInfo, [
            'id'          => $h->id,
            'session_id'  => 'SES-' . str_pad($h->id, 6, '0', STR_PAD_LEFT),
            'user_nom'    => $h->utilisateur->nom ?? '—',
            'user_email'  => $h->utilisateur->email ?? '—',
            'adresse_ip'  => $h->adresse_ip,
            'is_externe'  => $h->is_externe,
            'login_at'    => $h->login_at,
            'logout_at'   => $h->logout_at,
            'duree_mins'  => $h->duree_mins,
            'is_active'   => $h->is_active,
            'user_agent'  => $h->user_agent,
        ]));
    }

    public function forceLogout($id)
    {
        $h = HistoriqueConnexion::findOrFail($id);

        if ($h->personal_access_token_id) {
            \Laravel\Sanctum\PersonalAccessToken::where('id', $h->personal_access_token_id)->delete();
        }

        $h->update(['logout_at' => now()]);

        return response()->json(['message' => 'Session déconnectée de force']);
    }
}