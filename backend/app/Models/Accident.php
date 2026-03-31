<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Accident extends Model
{
    protected $table = 'accidents';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'vehicule_immatriculation',
        'chauffeur_user_id',
        'mission_id',
        'date_accident',
        'lieu',
        'position_gps',
        'description',
        'type_responsabilite',
        'niveau_degats',
        'chemin_rapport_police',
        'photos',
        'vehicule_immobilise',
        'jours_immobilisation',
        'km_au_moment_accident',
        'assure',
        'cout_estime',
        'cout_reparation_final',
        'montant_reclame_assurance',
        'montant_verse_assurance',
        'statut',
        'notes',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'photos' => 'array',
        'jours_immobilisation' => 'integer',
        'km_au_moment_accident' => 'integer',
        'vehicule_immobilise' => 'boolean',
        'assure' => 'boolean',
        'cout_estime' => 'decimal:2',
        'cout_reparation_final' => 'decimal:2',
        'montant_reclame_assurance' => 'decimal:2',
        'montant_verse_assurance' => 'decimal:2',
        'est_supprime' => 'boolean',
        'date_accident' => 'datetime',
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

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('est_supprime', false);
    }

    public function scopeDeclare($query)
    {
        return $query->where('statut', 'declare');
    }

    public function scopeEnTraitement($query)
    {
        return $query->where('statut', 'en_traitement');
    }

    public function scopeCloture($query)
    {
        return $query->where('statut', 'cloture');
    }

    public function scopeAvecImmobilisation($query)
    {
        return $query->where('vehicule_immobilise', true);
    }

    public function scopeAssure($query)
    {
        return $query->where('assure', true);
    }

    public function scopeParPeriode($query, $dateDebut, $dateFin)
    {
        return $query->whereBetween('date_accident', [$dateDebut, $dateFin]);
    }

    // Accessors
    public function getMontantPerteAttribute(): float
    {
        $coutFinal = $this->cout_reparation_final ?? $this->cout_estime;
        $verse = $this->montant_verse_assurance ?? 0;
        return max(0, $coutFinal - $verse);
    }

    public function getTauxCouvertureAssuranceAttribute(): ?float
    {
        $coutFinal = $this->cout_reparation_final ?? $this->cout_estime;
        if ($coutFinal > 0 && $this->montant_verse_assurance) {
            return round(($this->montant_verse_assurance / $coutFinal) * 100, 2);
        }
        return null;
    }

    // Méthodes helper
    public function isVehiculeImmobilise(): bool
    {
        return $this->vehicule_immobilise === true;
    }

    public function isAssure(): bool
    {
        return $this->assure === true;
    }

    public function isCloture(): bool
    {
        return $this->statut === 'cloture';
    }

    public function isGrave(): bool
    {
        return in_array($this->niveau_degats, ['grave', 'tres_grave']);
    }

    public function calculerDureeImmobilisation(): ?int
    {
        if ($this->vehicule_immobilise && $this->date_accident) {
            // Calculer depuis la date de l'accident jusqu'à maintenant ou jusqu'à la remise en service
            $vehicule = $this->vehicule;
            if ($vehicule && $vehicule->statut !== 'immobilise') {
                // Le véhicule n'est plus immobilisé, retourner la durée enregistrée
                return $this->jours_immobilisation;
            }
            // Le véhicule est toujours immobilisé
            return $this->date_accident->diffInDays(now());
        }
        return null;
    }
}