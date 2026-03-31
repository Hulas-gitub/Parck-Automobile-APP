<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PcRadio extends Model
{
    protected $table = 'pc_radio';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'vehicule_immatriculation',
        'chauffeur_user_id',
        'mission_id',
        'date_heure_remise',
        'km_depart',
        'niveau_carburant_depart',
        'checklist_avant',
        'photos_avant',
        'observations_depart',
        'date_heure_retour',
        'km_retour',
        'niveau_carburant_retour',
        'checklist_apres',
        'photos_apres',
        'anomalies_detectees',
        'observations_retour',
        'agent_pc_radio_user_id',
        'signature_chauffeur_remise',
        'signature_chauffeur_retour',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'checklist_avant' => 'array',
        'photos_avant' => 'array',
        'checklist_apres' => 'array',
        'photos_apres' => 'array',
        'km_depart' => 'integer',
        'km_retour' => 'integer',
        'anomalies_detectees' => 'boolean',
        'est_supprime' => 'boolean',
        'date_heure_remise' => 'datetime',
        'date_heure_retour' => 'datetime',
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

    public function mission(): BelongsTo
    {
        return $this->belongsTo(Mission::class, 'mission_id');
    }

    public function agentPcRadio(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'agent_pc_radio_user_id');
    }

    public function anomaliesPcRadio(): HasMany
    {
        return $this->hasMany(AnomaliePcRadio::class, 'pc_radio_id');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('est_supprime', false);
    }

    public function scopeEnCirculation($query)
    {
        return $query->whereNull('date_heure_retour');
    }

    public function scopeRetourne($query)
    {
        return $query->whereNotNull('date_heure_retour');
    }

    public function scopeAvecAnomalies($query)
    {
        return $query->where('anomalies_detectees', true);
    }

    // Accessors
    public function getDureeUtilisationMinutesAttribute(): ?int
    {
        if ($this->date_heure_remise && $this->date_heure_retour) {
            return $this->date_heure_remise->diffInMinutes($this->date_heure_retour);
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
    public function isEnCirculation(): bool
    {
        return is_null($this->date_heure_retour);
    }

    public function hasAnomalies(): bool
    {
        return $this->anomalies_detectees === true;
    }
}