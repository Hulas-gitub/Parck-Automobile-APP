<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Intervention extends Model
{
    protected $table = 'interventions';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'demande_id',
        'vehicule_immatriculation',
        'intervenant_id',
        'type_intervention',
        'severite',
        'date_debut',
        'date_fin',
        'duree_minutes',
        'duree_estimee_heures',
        'km_au_moment_intervention',
        'diagnostic',
        'resultat',
        'cout_main_oeuvre',
        'cout_pieces',
        'documents',
        'notes',
        'statut',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'documents' => 'array',
        'duree_minutes' => 'integer',
        'duree_estimee_heures' => 'integer',
        'km_au_moment_intervention' => 'integer',
        'cout_main_oeuvre' => 'decimal:2',
        'cout_pieces' => 'decimal:2',
        'est_supprime' => 'boolean',
        'date_debut' => 'datetime',
        'date_fin' => 'datetime',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
        'date_suppression' => 'datetime',
    ];

    // Relations
    public function demande(): BelongsTo
    {
        return $this->belongsTo(DemandeIntervention::class, 'demande_id');
    }

    public function vehicule(): BelongsTo
    {
        return $this->belongsTo(Vehicule::class, 'vehicule_immatriculation', 'immatriculation');
    }

    public function intervenant(): BelongsTo
    {
        return $this->belongsTo(Intervenant::class, 'intervenant_id');
    }

    public function prelevementsPieces(): HasMany
    {
        return $this->hasMany(PrelevementPiece::class, 'intervention_id');
    }

    public function planningsMaintenances(): HasMany
    {
        return $this->hasMany(PlanningMaintenance::class, 'derniere_intervention_id');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('est_supprime', false);
    }

    public function scopePlanifiee($query)
    {
        return $query->where('statut', 'planifiee');
    }

    public function scopeEnCours($query)
    {
        return $query->where('statut', 'en_cours');
    }

    public function scopeTerminee($query)
    {
        return $query->where('statut', 'terminee');
    }

    public function scopeAnnulee($query)
    {
        return $query->where('statut', 'annulee');
    }

    // Accessors
    public function getCoutTotalAttribute(): float
    {
        return $this->cout_main_oeuvre + $this->cout_pieces;
    }

    public function getDureeReelleHeuresAttribute(): ?float
    {
        if ($this->duree_minutes) {
            return round($this->duree_minutes / 60, 2);
        }
        return null;
    }

    // Méthodes helper
    public function isEnCours(): bool
    {
        return $this->statut === 'en_cours';
    }

    public function isTerminee(): bool
    {
        return $this->statut === 'terminee';
    }

    public function calculerDuree(): void
    {
        if ($this->date_debut && $this->date_fin) {
            $this->duree_minutes = $this->date_debut->diffInMinutes($this->date_fin);
            $this->save();
        }
    }

    public function getTauxRespectDelai(): ?float
    {
        if ($this->duree_estimee_heures && $this->duree_minutes) {
            $dureeReelleHeures = $this->duree_minutes / 60;
            return round(($dureeReelleHeures / $this->duree_estimee_heures) * 100, 2);
        }
        return null;
    }

    public function getTotalPiecesUtilisees(): int
    {
        return $this->prelevementsPieces()->count();
    }
}