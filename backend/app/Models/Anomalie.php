<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Anomalie extends Model
{
    protected $table = 'anomalies';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'vehicule_immatriculation',
        'signalee_par_user_id',
        'mission_id',
        'inspection_vehicule_id',
        'date_signalement',
        'description',
        'partie_vehicule',
        'severite',
        'km_au_signalement',
        'position_gps',
        'photos',
        'statut',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'photos' => 'array',
        'km_au_signalement' => 'integer',
        'est_supprime' => 'boolean',
        'date_signalement' => 'datetime',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
        'date_suppression' => 'datetime',
    ];

    // Relations
    public function vehicule(): BelongsTo
    {
        return $this->belongsTo(Vehicule::class, 'vehicule_immatriculation', 'immatriculation');
    }

    public function signaleePar(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'signalee_par_user_id');
    }

    public function mission(): BelongsTo
    {
        return $this->belongsTo(Mission::class, 'mission_id');
    }

    public function inspectionVehicule(): BelongsTo
    {
        return $this->belongsTo(InspectionVehicule::class, 'inspection_vehicule_id');
    }

    public function demandeIntervention(): HasOne
    {
        return $this->hasOne(DemandeIntervention::class, 'anomalie_id');
    }

    public function inspectionsVehiculesLiees(): HasMany
    {
        return $this->hasMany(InspectionVehicule::class, 'anomalie_creee_id');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('est_supprime', false);
    }

    public function scopeOuverte($query)
    {
        return $query->where('statut', 'ouverte');
    }

    public function scopeEnCours($query)
    {
        return $query->where('statut', 'en_cours');
    }

    public function scopeResolue($query)
    {
        return $query->where('statut', 'resolue');
    }

    public function scopeCritique($query)
    {
        return $query->where('severite', 'critique');
    }

    public function scopeHaute($query)
    {
        return $query->where('severite', 'haute');
    }

    public function scopeNonResolues($query)
    {
        return $query->whereIn('statut', ['ouverte', 'en_cours']);
    }

    // Méthodes helper
    public function isOuverte(): bool
    {
        return $this->statut === 'ouverte';
    }

    public function isResolue(): bool
    {
        return $this->statut === 'resolue';
    }

    public function isCritique(): bool
    {
        return $this->severite === 'critique';
    }

    public function hasDemande(): bool
    {
        return $this->demandeIntervention()->exists();
    }
}