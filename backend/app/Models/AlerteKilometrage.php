<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlerteKilometrage extends Model
{
    protected $table = 'alertes_kilometrage';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'vehicule_immatriculation',
        'type_alerte',
        'seuil_km',
        'km_actuel',
        'est_notifie',
        'date_notification',
        'est_resolue',
        'date_resolution',
    ];

    protected $casts = [
        'seuil_km' => 'integer',
        'km_actuel' => 'integer',
        'est_notifie' => 'boolean',
        'est_resolue' => 'boolean',
        'date_notification' => 'datetime',
        'date_resolution' => 'datetime',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
    ];

    // Relations
    public function vehicule(): BelongsTo
    {
        return $this->belongsTo(Vehicule::class, 'vehicule_immatriculation', 'immatriculation');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('est_resolue', false);
    }

    public function scopeResolue($query)
    {
        return $query->where('est_resolue', true);
    }

    public function scopeNonNotifiee($query)
    {
        return $query->where('est_notifie', false);
    }

    public function scopeParType($query, string $type)
    {
        return $query->where('type_alerte', $type);
    }

    public function scopeParVehicule($query, string $immatriculation)
    {
        return $query->where('vehicule_immatriculation', $immatriculation);
    }

    // Accessors
    public function getKmRestantsAttribute(): int
    {
        return max(0, $this->seuil_km - $this->km_actuel);
    }

    public function getPourcentageAtteintAttribute(): float
    {
        if ($this->seuil_km > 0) {
            return round(($this->km_actuel / $this->seuil_km) * 100, 2);
        }
        return 0;
    }

    // Méthodes helper
    public function isActive(): bool
    {
        return $this->est_resolue === false;
    }

    public function isDepassee(): bool
    {
        return $this->km_actuel >= $this->seuil_km;
    }

    public function marquerCommeNotifiee(): void
    {
        $this->est_notifie = true;
        $this->date_notification = now();
        $this->save();
    }

    public function resoudre(): void
    {
        $this->est_resolue = true;
        $this->date_resolution = now();
        $this->save();
    }

    public function mettreAJourKm(int $nouveauKm): void
    {
        $this->km_actuel = $nouveauKm;
        
        // Si le seuil est dépassé et que ce n'est pas encore notifié
        if ($nouveauKm >= $this->seuil_km && !$this->est_notifie) {
            $this->marquerCommeNotifiee();
        }
        
        $this->save();
    }

    public static function creerAlerteVidange(string $immatriculation, int $kmActuel, int $seuilKm): self
    {
        return self::create([
            'vehicule_immatriculation' => $immatriculation,
            'type_alerte' => 'vidange',
            'seuil_km' => $seuilKm,
            'km_actuel' => $kmActuel,
        ]);
    }

    public static function creerAlerteRevision(string $immatriculation, int $kmActuel, int $seuilKm): self
    {
        return self::create([
            'vehicule_immatriculation' => $immatriculation,
            'type_alerte' => 'revision',
            'seuil_km' => $seuilKm,
            'km_actuel' => $kmActuel,
        ]);
    }
}