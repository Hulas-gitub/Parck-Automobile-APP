<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\Auditable;
class Vehicule extends Model

{
    use Auditable;
    
    protected $table = 'vehicules';
    protected $primaryKey = 'immatriculation';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'immatriculation',
        'numero_chassis',
        'marque_id',        // ← FK vers marques.id
        'modele_id',        // ← FK vers modeles.id
        'categorie_id',     // ← FK vers categories_vehicules.id
        'annee_id',         // ← FK vers annees.id
        'nb_places',
        'direction_id',
        'ville',
        'affectation_id',
        'affectation',
        'responsable_du_vehicule',
        'kilometrage',
        'date_maj_km',
        'km_prochaine_vidange',
        'km_prochaine_revision',
        'statut',
        'date_immobilisation',
        'type_carburant',
        'capacite_reservoir',
        'consommation_moyenne',
        'date_acquisition',
        'date_expiration_assurance',
        'date_expiration_visite_technique',
        'cout_acquisition',
        'valeur_residuelle',
        'couleur',
        'photo',
        'notes',
        'est_actif',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'kilometrage'                      => 'integer',
        'km_prochaine_vidange'             => 'integer',
        'km_prochaine_revision'            => 'integer',
        'nb_places'                        => 'integer',
        'capacite_reservoir'               => 'integer',
        'consommation_moyenne'             => 'decimal:2',
        'cout_acquisition'                 => 'decimal:2',
        'valeur_residuelle'                => 'decimal:2',
        'date_maj_km'                      => 'date',
        'date_acquisition'                 => 'date',
        'date_expiration_assurance'        => 'date',
        'date_expiration_visite_technique' => 'date',
        'date_immobilisation'              => 'datetime',
        'est_actif'                        => 'boolean',
        'est_supprime'                     => 'boolean',
        'date_creation'                    => 'datetime',
        'date_modification'                => 'datetime',
        'date_suppression'                 => 'datetime',
    ];

    // =========================================================================
    // RELATIONS
    // =========================================================================

    public function marque(): BelongsTo
    {
        return $this->belongsTo(Marque::class, 'marque_id');
    }

    public function modele(): BelongsTo
    {
        return $this->belongsTo(Modele::class, 'modele_id');
    }

    public function categorie(): BelongsTo
    {
        return $this->belongsTo(CategorieVehicule::class, 'categorie_id');
    }

    public function annee(): BelongsTo
    {
        return $this->belongsTo(Annee::class, 'annee_id');
    }

    public function direction(): BelongsTo
    {
        return $this->belongsTo(Direction::class, 'direction_id');
    }

    public function missions(): HasMany
    {
        return $this->hasMany(Mission::class, 'vehicule_immatriculation');
    }

    public function anomalies(): HasMany
    {
        return $this->hasMany(Anomalie::class, 'vehicule_immatriculation');
    }

    public function interventions(): HasMany
    {
        return $this->hasMany(Intervention::class, 'vehicule_immatriculation');
    }

    public function accidents(): HasMany
    {
        return $this->hasMany(Accident::class, 'vehicule_immatriculation');
    }

    public function carnetsCarburant(): HasMany
    {
        return $this->hasMany(CarnetCarburant::class, 'vehicule_immatriculation');
    }

    public function historiqueKilometrage(): HasMany
    {
        return $this->hasMany(HistoriqueKilometrage::class, 'vehicule_immatriculation');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(DocumentVehicule::class, 'vehicule_immatriculation');
    }

    public function pcRadio(): HasMany
    {
        return $this->hasMany(PcRadio::class, 'vehicule_immatriculation');
    }

    public function planningMaintenances(): HasMany
    {
        return $this->hasMany(PlanningMaintenance::class, 'vehicule_immatriculation');
    }

    public function alertesKilometrage(): HasMany
    {
        return $this->hasMany(AlerteKilometrage::class, 'vehicule_immatriculation');
    }

    public function kpis(): HasMany
    {
        return $this->hasMany(KpiVehicule::class, 'vehicule_immatriculation');
    }

    public function inspectionsVehicules(): HasMany
    {
        return $this->hasMany(InspectionVehicule::class, 'vehicule_immatriculation');
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeActif($query)
    {
        return $query->where('est_actif', true)->where('est_supprime', false);
    }

    public function scopeDisponible($query)
    {
        return $query->where('statut', 'disponible');
    }

    public function scopeEnMission($query)
    {
        return $query->where('statut', 'en_mission');
    }

    public function scopeEnMaintenance($query)
    {
        return $query->where('statut', 'en_maintenance');
    }

    public function scopeImmobilise($query)
    {
        return $query->where('statut', 'immobilise');
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    public function isDisponible(): bool
    {
        return $this->statut === 'disponible';
    }

    public function kmRestantsAvantVidange(): ?int
    {
        if ($this->km_prochaine_vidange) {
            return max(0, $this->km_prochaine_vidange - $this->kilometrage);
        }
        return null;
    }

    public function joursAvantExpirationAssurance(): ?int
    {
        if ($this->date_expiration_assurance) {
            return now()->diffInDays($this->date_expiration_assurance, false);
        }
        return null;
    }
}