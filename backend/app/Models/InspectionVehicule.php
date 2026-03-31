<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InspectionVehicule extends Model
{
    protected $table = 'inspections_vehicules';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';

    protected $fillable = [
        'inspection_id',
        'vehicule_immatriculation',
        'km_au_moment_inspection',
        'statut_global',
        'anomalies_detectees',
        'anomalie_creee_id',
        'observations_vehicule',
    ];

    protected $casts = [
        'km_au_moment_inspection' => 'integer',
        'anomalies_detectees' => 'boolean',
        'date_creation' => 'datetime',
    ];

    // Relations
    public function inspection(): BelongsTo
    {
        return $this->belongsTo(Inspection::class, 'inspection_id');
    }

    public function vehicule(): BelongsTo
    {
        return $this->belongsTo(Vehicule::class, 'vehicule_immatriculation', 'immatriculation');
    }

    public function anomalieCreee(): BelongsTo
    {
        return $this->belongsTo(Anomalie::class, 'anomalie_creee_id');
    }

    public function elementsInspectes(): HasMany
    {
        return $this->hasMany(ElementInspecte::class, 'inspection_vehicule_id');
    }

    // Scopes
    public function scopeConforme($query)
    {
        return $query->where('statut_global', 'conforme');
    }

    public function scopeNonConforme($query)
    {
        return $query->where('statut_global', 'non_conforme');
    }

    public function scopeDangerImmediat($query)
    {
        return $query->where('statut_global', 'danger_immediat');
    }

    public function scopeAvecAnomalies($query)
    {
        return $query->where('anomalies_detectees', true);
    }

    // Méthodes helper
    public function isConforme(): bool
    {
        return $this->statut_global === 'conforme';
    }

    public function isDangerImmediat(): bool
    {
        return $this->statut_global === 'danger_immediat';
    }

    public function hasAnomalies(): bool
    {
        return $this->anomalies_detectees === true;
    }

    public function getNombreElementsNOK(): int
    {
        return $this->elementsInspectes()
            ->whereIn('statut', ['NOK', 'defectueux', 'manquant', 'use'])
            ->count();
    }

    public function getTauxConformite(): float
    {
        $total = $this->elementsInspectes()->count();
        if ($total === 0) {
            return 100.0;
        }
        
        $ok = $this->elementsInspectes()->where('statut', 'OK')->count();
        return round(($ok / $total) * 100, 2);
    }
}