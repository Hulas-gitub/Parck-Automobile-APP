<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JournalAudit extends Model
{
    protected $table = 'journaux_audit';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';

    /** Actions reconnues, alignées sur le frontend Activitesysteme.jsx */
    const ACTIONS = [
        'CREATE'    => 'Création',
        'UPDATE'    => 'Modification',
        'DELETE'    => 'Suppression',
        'READ'      => 'Consultation',
        'BLOQUER'   => 'Blocage',
        'DEBLOQUER' => 'Déblocage',
        'LOGIN'     => 'Connexion',
        'LOGOUT'    => 'Déconnexion',
    ];

    /** Périodes reconnues, alignées sur le frontend */
    const PERIODES = [
        '7j'          => ['libelle' => '7 derniers jours',  'jours' => 7],
        '30j'         => ['libelle' => '30 derniers jours', 'jours' => 30],
        'mensuel'     => ['libelle' => 'Mensuel',            'jours' => 30],
        'trimestriel' => ['libelle' => 'Trimestriel',        'jours' => 90],
        'semestriel'  => ['libelle' => 'Semestriel',         'jours' => 180],
        'annuel'      => ['libelle' => 'Annuel',              'jours' => 365],
    ];

    protected $fillable = [
        'user_id', 'action', 'libelle', 'nom_table', 'id_enregistrement',
        'anciennes_valeurs', 'nouvelles_valeurs', 'adresse_ip', 'user_agent',
    ];

    protected $casts = [
        'anciennes_valeurs' => 'array',
        'nouvelles_valeurs' => 'array',
        'date_creation'     => 'datetime',
    ];

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'user_id');
    }

    // ────────────────────────────────────────────────────────────
    // Scope générique utilisé par ActivitesSystemesController
    // ────────────────────────────────────────────────────────────
    public function scopeFiltrer($query, array $filtres)
    {
        if (!empty($filtres['periode']) && isset(self::PERIODES[$filtres['periode']])) {
            $jours = self::PERIODES[$filtres['periode']]['jours'];
            $query->where('journaux_audit.date_creation', '>=', now()->subDays($jours)->startOfDay());
        }

        if (!empty($filtres['action'])) {
            $query->where('journaux_audit.action', $filtres['action']);
        }

        if (!empty($filtres['table'])) {
            $query->where('journaux_audit.nom_table', $filtres['table']);
        }

        if (!empty($filtres['user_id'])) {
            $query->where('journaux_audit.user_id', $filtres['user_id']);
        }

        if (!empty($filtres['role'])) {
            $query->whereHas('utilisateur.role', fn ($q) => $q->where('code', $filtres['role']));
        }

        if (!empty($filtres['recherche'])) {
            $recherche = $filtres['recherche'];
            $query->where(function ($q) use ($recherche) {
                $q->where('journaux_audit.nom_table', 'like', "%{$recherche}%")
                  ->orWhere('journaux_audit.libelle', 'like', "%{$recherche}%")
                  ->orWhere('journaux_audit.adresse_ip', 'like', "%{$recherche}%")
                  ->orWhereHas('utilisateur', fn ($u) => $u->where('nom', 'like', "%{$recherche}%"));
            });
        }

        return $query;
    }

    // Scopes existants conservés (compat éventuelle avec du code déjà écrit)
    public function scopeParUtilisateur($query, int $userId) { return $query->where('user_id', $userId); }
    public function scopeParAction($query, string $action) { return $query->where('action', $action); }
    public function scopeParTable($query, string $table) { return $query->where('nom_table', $table); }
    public function scopeParEnregistrement($query, string $table, string $id)
    {
        return $query->where('nom_table', $table)->where('id_enregistrement', $id);
    }
    public function scopeRecent($query, int $jours = 30) { return $query->where('date_creation', '>=', now()->subDays($jours)); }
    public function scopeParPeriode($query, $dateDebut, $dateFin) { return $query->whereBetween('date_creation', [$dateDebut, $dateFin]); }

    public function getChangements(): array
    {
        $changements = [];
        if (!$this->anciennes_valeurs || !$this->nouvelles_valeurs) return $changements;

        foreach ($this->nouvelles_valeurs as $champ => $nouvelleValeur) {
            $ancienneValeur = $this->anciennes_valeurs[$champ] ?? null;
            if ($ancienneValeur != $nouvelleValeur) {
                $changements[$champ] = ['avant' => $ancienneValeur, 'apres' => $nouvelleValeur];
            }
        }
        return $changements;
    }

    // ────────────────────────────────────────────────────────────
    // Point d'entrée unique utilisé partout (trait + controllers)
    // ────────────────────────────────────────────────────────────

public static function tracer(
    int|string|null $userId,
    string $action,
    string $table,
    int|string|null $idEnregistrement = null,
    ?array $anciennes = null,
    ?array $nouvelles = null,
    ?string $libelle = null
): self {
    // On n'accepte qu'un id numérique valide. Sinon (email, 0, null...),
    // on prend la clé primaire de l'utilisateur connecté.
    $auteurId = (is_numeric($userId) && (int) $userId > 0)
        ? (int) $userId
        : auth()->user()?->getKey();

    return self::create([
        'user_id'            => (is_numeric($auteurId) && (int) $auteurId > 0) ? (int) $auteurId : null,
        'action'             => $action,
        'libelle'            => $libelle,
        'nom_table'          => $table,
        'id_enregistrement'  => $idEnregistrement !== null ? (string) $idEnregistrement : null,
        'anciennes_valeurs'  => $anciennes,
        'nouvelles_valeurs'  => $nouvelles,
        'adresse_ip'         => request()->ip(),
        'user_agent'         => request()->userAgent(),
    ]);
}
    
    public static function getHistorique(string $table, string $id, int $limite = 50)
    {
        return self::where('nom_table', $table)->where('id_enregistrement', $id)
            ->orderBy('date_creation', 'desc')->limit($limite)->get();
    }
}