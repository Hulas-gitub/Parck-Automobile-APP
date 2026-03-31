<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentVehicule extends Model
{
    protected $table = 'documents_vehicules';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'vehicule_immatriculation',
        'type_document',
        'nom_document',
        'chemin_fichier',
        'compagnie_assurance',
        'numero_contrat',
        'type_couverture',
        'montant_prime',
        'date_emission',
        'date_expiration',
        'telecharge_par_user_id',
        'notes',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'montant_prime' => 'decimal:2',
        'est_supprime' => 'boolean',
        'date_emission' => 'date',
        'date_expiration' => 'date',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
        'date_suppression' => 'datetime',
    ];

    // Relations
    public function vehicule(): BelongsTo
    {
        return $this->belongsTo(Vehicule::class, 'vehicule_immatriculation', 'immatriculation');
    }

    public function telecargePar(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'telecharge_par_user_id');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('est_supprime', false);
    }

    public function scopeParType($query, string $type)
    {
        return $query->where('type_document', $type);
    }

    public function scopeAssurance($query)
    {
        return $query->where('type_document', 'assurance');
    }

    public function scopeCarteGrise($query)
    {
        return $query->where('type_document', 'carte_grise');
    }

    public function scopeVisiteTechnique($query)
    {
        return $query->where('type_document', 'visite_technique');
    }

    public function scopeExpire($query)
    {
        return $query->whereNotNull('date_expiration')
                    ->where('date_expiration', '<', now());
    }

    public function scopeExpirationProche($query, int $jours = 30)
    {
        return $query->whereNotNull('date_expiration')
                    ->whereBetween('date_expiration', [now(), now()->addDays($jours)]);
    }

    // Accessors
    public function getJoursAvantExpirationAttribute(): ?int
    {
        if ($this->date_expiration) {
            return now()->diffInDays($this->date_expiration, false);
        }
        return null;
    }

    // Méthodes helper
    public function isExpire(): bool
    {
        return $this->date_expiration && $this->date_expiration->isPast();
    }

    public function isExpirationProche(int $jours = 30): bool
    {
        if ($this->date_expiration) {
            $joursRestants = $this->jours_avant_expiration;
            return $joursRestants !== null && $joursRestants >= 0 && $joursRestants <= $jours;
        }
        return false;
    }

    public function isAssurance(): bool
    {
        return $this->type_document === 'assurance';
    }

    public function isVisiteTechnique(): bool
    {
        return $this->type_document === 'visite_technique';
    }
}