<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Mission extends Model
{
    protected $table = 'missions';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'vehicule_immatriculation',
        'chauffeur_user_id',
        'type_mission',
        'destination',
        'direction_id',
        'nb_passagers',
        'date_depart_prevue',
        'date_depart_reelle',
        'date_retour_reelle',
        'km_depart',
        'km_retour',
        'carburant_consomme',
        'cout_carburant',
        'statut',
        'reference_mission',
        'observations',
        'incident_signale',
        'description_incident',
        'photos',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'photos' => 'array',
        'nb_passagers' => 'integer',
        'km_depart' => 'integer',
        'km_retour' => 'integer',
        'carburant_consomme' => 'decimal:2',
        'cout_carburant' => 'decimal:2',
        'incident_signale' => 'boolean',
        'est_supprime' => 'boolean',
        'date_depart_prevue' => 'datetime',
        'date_depart_reelle' => 'datetime',
        'date_retour_reelle' => 'datetime',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
        'date_suppression' => 'datetime',
    ];

    // Relations
    public function vehicule(): BelongsTo
    {
        return $this->belongsTo(Vehicule::class, 'vehicule_immatriculation', 'immatriculation');
    }

    public function chauffeur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'chauffeur_user_id');
    }

    public function direction(): BelongsTo
    {
        return $this->belongsTo(Direction::class, 'direction_id');
    }

    public function anomalies(): HasMany
    {
        return $this->hasMany(Anomalie::class, 'mission_id');
    }

    public function accidents(): HasMany
    {
        return $this->hasMany(Accident::class, 'mission_id');
    }

    public function carnetsCarburant(): HasMany
    {
        return $this->hasMany(CarnetCarburant::class, 'mission_id');
    }

    public function pcRadio(): HasMany
    {
        return $this->hasMany(PcRadio::class, 'mission_id');
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
    public function getDureeMiutesAttribute(): ?int
    {
        if ($this->date_depart_reelle && $this->date_retour_reelle) {
            return $this->date_depart_reelle->diffInMinutes($this->date_retour_reelle);
        }
        return null;
    }

    public function getKmParcourusAttribute(): ?int
    {
        if ($this->km_depart && $this->km_retour) {
            return $this->km_retour - $this->km_depart;
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

    public function hasIncident(): bool
    {
        return $this->incident_signale === true;
    }

    public function calculerConsommationMoyenne(): ?float
    {
        $kmParcourus = $this->km_parcourus;
        if ($kmParcourus && $this->carburant_consomme && $kmParcourus > 0) {
            return round(($this->carburant_consomme / $kmParcourus) * 100, 2);
        }
        return null;
    }
}