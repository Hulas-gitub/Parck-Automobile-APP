<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarnetCarburant extends Model
{
    protected $table = 'carnets_carburant';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';

    protected $fillable = [
        'vehicule_immatriculation',
        'mission_id',
        'date_plein',
        'kilometrage',
        'litres',
        'prix_unitaire',
        'station',
        'chemin_recu',
        'km_depuis_dernier_plein',
        'consommation_calculee',
        'notes',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'kilometrage' => 'integer',
        'km_depuis_dernier_plein' => 'integer',
        'litres' => 'decimal:2',
        'prix_unitaire' => 'decimal:4',
        'consommation_calculee' => 'decimal:2',
        'est_supprime' => 'boolean',
        'date_plein' => 'date',
        'date_creation' => 'datetime',
        'date_suppression' => 'datetime',
    ];

    // Relations
    public function vehicule(): BelongsTo
    {
        return $this->belongsTo(Vehicule::class, 'vehicule_immatriculation', 'immatriculation');
    }

    public function mission(): BelongsTo
    {
        return $this->belongsTo(Mission::class, 'mission_id');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('est_supprime', false);
    }

    public function scopeParPeriode($query, $dateDebut, $dateFin)
    {
        return $query->whereBetween('date_plein', [$dateDebut, $dateFin]);
    }

    public function scopeParVehicule($query, string $immatriculation)
    {
        return $query->where('vehicule_immatriculation', $immatriculation);
    }

    // Accessors
    public function getCoutTotalAttribute(): float
    {
        return $this->litres * ($this->prix_unitaire ?? 0);
    }

    // Méthodes helper
    public function calculerConsommation(): ?float
    {
        if ($this->km_depuis_dernier_plein && $this->km_depuis_dernier_plein > 0 && $this->litres) {
            return round(($this->litres / $this->km_depuis_dernier_plein) * 100, 2);
        }
        return null;
    }

    public function calculerEtEnregistrerConsommation(): void
    {
        $consommation = $this->calculerConsommation();
        if ($consommation) {
            $this->consommation_calculee = $consommation;
            $this->save();
        }
    }

    public function calculerKmDepuisDernierPlein(): ?int
    {
        $dernierPlein = self::where('vehicule_immatriculation', $this->vehicule_immatriculation)
            ->where('date_plein', '<', $this->date_plein)
            ->orderBy('date_plein', 'desc')
            ->first();

        if ($dernierPlein && $this->kilometrage && $dernierPlein->kilometrage) {
            return $this->kilometrage - $dernierPlein->kilometrage;
        }

        return null;
    }

    public static function calculerConsommationMoyenne(string $immatriculation, int $nombrePleins = 5): ?float
    {
        $carnets = self::where('vehicule_immatriculation', $immatriculation)
            ->whereNotNull('consommation_calculee')
            ->where('consommation_calculee', '>', 0)
            ->orderBy('date_plein', 'desc')
            ->limit($nombrePleins)
            ->get();

        if ($carnets->isEmpty()) {
            return null;
        }

        return round($carnets->avg('consommation_calculee'), 2);
    }
}