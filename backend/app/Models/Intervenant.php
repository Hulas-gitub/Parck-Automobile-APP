<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Intervenant extends Model
{
    protected $table = 'intervenants';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'type_intervenant_id',
        'user_id',
        'nom_externe',
        'telephone',
        'email',
        'est_externe',
        'tarif_horaire',
        'specialisation',
        'notes',
        'est_actif',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'tarif_horaire' => 'decimal:2',
        'est_externe' => 'boolean',
        'est_actif' => 'boolean',
        'est_supprime' => 'boolean',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
        'date_suppression' => 'datetime',
    ];

    // Relations
    public function typeIntervenant(): BelongsTo
    {
        return $this->belongsTo(TypeIntervenant::class, 'type_intervenant_id');
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'user_id');
    }

    public function interventions(): HasMany
    {
        return $this->hasMany(Intervention::class, 'intervenant_id');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('est_actif', true)->where('est_supprime', false);
    }

    public function scopeInterne($query)
    {
        return $query->where('est_externe', false);
    }

    public function scopeExterne($query)
    {
        return $query->where('est_externe', true);
    }

    public function scopeParType($query, int $typeId)
    {
        return $query->where('type_intervenant_id', $typeId);
    }

    // Accessors
    public function getNomCompletAttribute(): string
    {
        if ($this->est_externe) {
            return $this->nom_externe ?? 'Intervenant externe';
        }
        return $this->utilisateur?->nom ?? 'Non défini';
    }

    // Méthodes helper
    public function isInterne(): bool
    {
        return $this->est_externe === false;
    }

    public function isExterne(): bool
    {
        return $this->est_externe === true;
    }

    public function getNombreInterventions(): int
    {
        return $this->interventions()->count();
    }

    public function getNombreInterventionsTerminees(): int
    {
        return $this->interventions()
            ->where('statut', 'terminee')
            ->count();
    }

    public function calculerTauxOccupation(int $annee = null, int $mois = null): float
    {
        $query = $this->interventions()->where('statut', 'terminee');
        
        if ($annee) {
            $query->whereYear('date_fin', $annee);
        }
        if ($mois) {
            $query->whereMonth('date_fin', $mois);
        }
        
        $totalHeures = $query->sum('duree_minutes') / 60;
        $heuresTravailMensuel = 160; // Environ 160h par mois
        
        return round(($totalHeures / $heuresTravailMensuel) * 100, 2);
    }
}