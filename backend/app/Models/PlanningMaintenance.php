<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class PlanningMaintenance extends Model
{
    protected $table = 'planning_maintenance';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'vehicule_immatriculation',
        'regle_id',
        'type_maintenance',
        'description',
        'frequence_km',
        'frequence_mois',
        'date_derniere_realisation',
        'km_derniere_realisation',
        'derniere_intervention_id',
        'prochaine_echeance_date',
        'prochaine_echeance_km',
        'statut',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'frequence_km' => 'integer',
        'frequence_mois' => 'integer',
        'km_derniere_realisation' => 'integer',
        'prochaine_echean_km' => 'integer',
        'est_supprime' => 'boolean',
        'date_derniere_realisation' => 'date',
        'prochaine_echeance_date' => 'date',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
        'date_suppression' => 'datetime',
    ];

    // Relations
    public function vehicule(): BelongsTo
    {
        return $this->belongsTo(Vehicule::class, 'vehicule_immatriculation', 'immatriculation');
    }

    public function regle(): BelongsTo
    {
        return $this->belongsTo(RegleMaintenance::class, 'regle_id');
    }

    public function derniereIntervention(): BelongsTo
    {
        return $this->belongsTo(Intervention::class, 'derniere_intervention_id');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('est_supprime', false);
    }

    public function scopeAPlanifier($query)
    {
        return $query->where('statut', 'a_planifier');
    }

    public function scopePlanifiee($query)
    {
        return $query->where('statut', 'planifiee');
    }

    public function scopeEnRetard($query)
    {
        return $query->where(function($q) {
            $q->where('prochaine_echeance_date', '<', now())
              ->orWhereRaw('prochaine_echeance_km < (SELECT kilometrage FROM vehicules WHERE immatriculation = planning_maintenance.vehicule_immatriculation)');
        });
    }

    public function scopeProche($query, int $joursAvance = 30, int $kmAvance = 1000)
    {
        return $query->where(function($q) use ($joursAvance, $kmAvance) {
            $q->whereBetween('prochaine_echeance_date', [now(), now()->addDays($joursAvance)])
              ->orWhereRaw('prochaine_echeance_km - (SELECT kilometrage FROM vehicules WHERE immatriculation = planning_maintenance.vehicule_immatriculation) <= ?', [$kmAvance]);
        });
    }

    // Méthodes helper
    public function isEnRetard(): bool
    {
        $vehicule = $this->vehicule;
        
        if ($this->prochaine_echeance_date && $this->prochaine_echeance_date->isPast()) {
            return true;
        }
        
        if ($this->prochaine_echeance_km && $vehicule && $vehicule->kilometrage >= $this->prochaine_echeance_km) {
            return true;
        }
        
        return false;
    }

    public function getJoursRestants(): ?int
    {
        if ($this->prochaine_echeance_date) {
            return now()->diffInDays($this->prochaine_echeance_date, false);
        }
        return null;
    }

    public function getKmRestants(): ?int
    {
        $vehicule = $this->vehicule;
        if ($this->prochaine_echeance_km && $vehicule) {
            return max(0, $this->prochaine_echeance_km - $vehicule->kilometrage);
        }
        return null;
    }

    public function calculerProchaineEcheance(): void
    {
        $vehicule = $this->vehicule;
        
        if ($this->frequence_km && $this->km_derniere_realisation) {
            $this->prochaine_echeance_km = $this->km_derniere_realisation + $this->frequence_km;
        } elseif ($this->frequence_km && $vehicule) {
            $this->prochaine_echeance_km = $vehicule->kilometrage + $this->frequence_km;
        }
        
        if ($this->frequence_mois && $this->date_derniere_realisation) {
            $this->prochaine_echeance_date = Carbon::parse($this->date_derniere_realisation)
                ->addMonths($this->frequence_mois);
        } elseif ($this->frequence_mois) {
            $this->prochaine_echeance_date = now()->addMonths($this->frequence_mois);
        }
        
        $this->save();
    }

    public function marquerCommeRealisee(Intervention $intervention): void
    {
        $this->date_derniere_realisation = $intervention->date_fin ? $intervention->date_fin->toDateString() : now()->toDateString();
        $this->km_derniere_realisation = $intervention->km_au_moment_intervention;
        $this->derniere_intervention_id = $intervention->id;
        $this->calculerProchaineEcheance();
        $this->statut = 'a_planifier';
        $this->save();
    }
}