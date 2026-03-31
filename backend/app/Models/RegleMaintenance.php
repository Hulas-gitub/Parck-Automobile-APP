<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RegleMaintenance extends Model
{
    protected $table = 'regles_maintenance';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'type_maintenance',
        'description',
        'type_declencheur',
        'valeur_km',
        'valeur_mois',
        'type_vehicule',
        'duree_estimee_heures',
        'cout_estime',
        'est_actif',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'valeur_km' => 'integer',
        'valeur_mois' => 'integer',
        'duree_estimee_heures' => 'integer',
        'cout_estime' => 'decimal:2',
        'est_actif' => 'boolean',
        'est_supprime' => 'boolean',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
        'date_suppression' => 'datetime',
    ];

    // Relations
    public function planningsMaintenances(): HasMany
    {
        return $this->hasMany(PlanningMaintenance::class, 'regle_id');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('est_actif', true)->where('est_supprime', false);
    }

    public function scopeParTypeVehicule($query, ?string $typeVehicule)
    {
        return $query->where(function($q) use ($typeVehicule) {
            $q->whereNull('type_vehicule')
              ->orWhere('type_vehicule', $typeVehicule);
        });
    }

    public function scopeParDeclencheur($query, string $type)
    {
        return $query->where('type_declencheur', $type);
    }

    // Méthodes helper
    public function isDeclencheurKm(): bool
    {
        return in_array($this->type_declencheur, ['km', 'mixte']);
    }

    public function isDeclencheurDate(): bool
    {
        return in_array($this->type_declencheur, ['date', 'mixte']);
    }

    public function applicableA(Vehicule $vehicule): bool
    {
        return is_null($this->type_vehicule) || $this->type_vehicule === $vehicule->type_vehicule;
    }
}