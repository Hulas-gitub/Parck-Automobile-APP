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

    protected $fillable = [
        'user_id',
        'action',
        'nom_table',
        'id_enregistrement',
        'anciennes_valeurs',
        'nouvelles_valeurs',
        'adresse_ip',
        'user_agent',
    ];

    protected $casts = [
        'anciennes_valeurs' => 'array',
        'nouvelles_valeurs' => 'array',
        'date_creation' => 'datetime',
    ];

    // Relations
    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'user_id');
    }

    // Scopes
    public function scopeParUtilisateur($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeParAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    public function scopeParTable($query, string $table)
    {
        return $query->where('nom_table', $table);
    }

    public function scopeParEnregistrement($query, string $table, string $id)
    {
        return $query->where('nom_table', $table)
                    ->where('id_enregistrement', $id);
    }

    public function scopeCreation($query)
    {
        return $query->where('action', 'creation');
    }

    public function scopeModification($query)
    {
        return $query->where('action', 'modification');
    }

    public function scopeSuppression($query)
    {
        return $query->where('action', 'suppression');
    }

    public function scopeRecent($query, int $jours = 30)
    {
        return $query->where('date_creation', '>=', now()->subDays($jours));
    }

    public function scopeParPeriode($query, $dateDebut, $dateFin)
    {
        return $query->whereBetween('date_creation', [$dateDebut, $dateFin]);
    }

    // Méthodes helper
    public function getChangements(): array
    {
        $changements = [];
        
        if (!$this->anciennes_valeurs || !$this->nouvelles_valeurs) {
            return $changements;
        }

        foreach ($this->nouvelles_valeurs as $champ => $nouvelleValeur) {
            $ancienneValeur = $this->anciennes_valeurs[$champ] ?? null;
            
            if ($ancienneValeur != $nouvelleValeur) {
                $changements[$champ] = [
                    'avant' => $ancienneValeur,
                    'apres' => $nouvelleValeur,
                ];
            }
        }

        return $changements;
    }

    public function getNombreChangements(): int
    {
        return count($this->getChangements());
    }

    public static function enregistrer(string $action, string $table, string $idEnregistrement, ?array $anciennes = null, ?array $nouvelles = null, ?int $userId = null): self
    {
        return self::create([
            'user_id' => $userId ?? auth()->id(),
            'action' => $action,
            'nom_table' => $table,
            'id_enregistrement' => $idEnregistrement,
            'anciennes_valeurs' => $anciennes,
            'nouvelles_valeurs' => $nouvelles,
            'adresse_ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    public static function enregistrerCreation(string $table, string $id, array $valeurs, ?int $userId = null): self
    {
        return self::enregistrer('creation', $table, $id, null, $valeurs, $userId);
    }

    public static function enregistrerModification(string $table, string $id, array $anciennes, array $nouvelles, ?int $userId = null): self
    {
        return self::enregistrer('modification', $table, $id, $anciennes, $nouvelles, $userId);
    }

    public static function enregistrerSuppression(string $table, string $id, array $valeurs, ?int $userId = null): self
    {
        return self::enregistrer('suppression', $table, $id, $valeurs, null, $userId);
    }

    public static function getHistorique(string $table, string $id, int $limite = 50): \Illuminate\Support\Collection
    {
        return self::where('nom_table', $table)
            ->where('id_enregistrement', $id)
            ->orderBy('date_creation', 'desc')
            ->limit($limite)
            ->get();
    }

    public static function getActiviteUtilisateur(int $userId, int $jours = 30): \Illuminate\Support\Collection
    {
        return self::where('user_id', $userId)
            ->where('date_creation', '>=', now()->subDays($jours))
            ->orderBy('date_creation', 'desc')
            ->get();
    }

    public static function getStatistiquesParAction(int $jours = 30): array
    {
        $stats = self::where('date_creation', '>=', now()->subDays($jours))
            ->selectRaw('action, COUNT(*) as total')
            ->groupBy('action')
            ->get();

        return $stats->pluck('total', 'action')->toArray();
    }

    public static function getTablesLesPlusModifiees(int $jours = 30, int $limite = 10): array
    {
        $stats = self::where('date_creation', '>=', now()->subDays($jours))
            ->selectRaw('nom_table, COUNT(*) as total')
            ->groupBy('nom_table')
            ->orderBy('total', 'desc')
            ->limit($limite)
            ->get();

        return $stats->pluck('total', 'nom_table')->toArray();
    }
}