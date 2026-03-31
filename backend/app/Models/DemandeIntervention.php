<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DemandeIntervention extends Model
{
    protected $table = 'demandes_intervention';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'anomalie_id',
        'vehicule_immatriculation',
        'demandeur_user_id',
        'date_demande',
        'type_maintenance',
        'type_intervention',
        'priorite',
        'statut',
        'commentaire',
        'motif_rejet',
        'validee_par_user_id',
        'date_validation',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'est_supprime' => 'boolean',
        'date_demande' => 'datetime',
        'date_validation' => 'datetime',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
        'date_suppression' => 'datetime',
    ];

    // Relations
    public function anomalie(): BelongsTo
    {
        return $this->belongsTo(Anomalie::class, 'anomalie_id');
    }

    public function vehicule(): BelongsTo
    {
        return $this->belongsTo(Vehicule::class, 'vehicule_immatriculation', 'immatriculation');
    }

    public function demandeur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'demandeur_user_id');
    }

    public function valideePar(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'validee_par_user_id');
    }

    public function intervention(): HasOne
    {
        return $this->hasOne(Intervention::class, 'demande_id');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('est_supprime', false);
    }

    public function scopeEnAttente($query)
    {
        return $query->where('statut', 'en_attente');
    }

    public function scopeApprouvee($query)
    {
        return $query->where('statut', 'approuvee');
    }

    public function scopeRejetee($query)
    {
        return $query->where('statut', 'rejetee');
    }

    public function scopeUrgente($query)
    {
        return $query->where('priorite', 'urgente');
    }

    public function scopeHautePriorite($query)
    {
        return $query->where('priorite', 'haute');
    }

    public function scopeCorrective($query)
    {
        return $query->where('type_maintenance', 'corrective');
    }

    public function scopePreventive($query)
    {
        return $query->where('type_maintenance', 'preventive');
    }

    // Méthodes helper
    public function isEnAttente(): bool
    {
        return $this->statut === 'en_attente';
    }

    public function isApprouvee(): bool
    {
        return $this->statut === 'approuvee';
    }

    public function isRejetee(): bool
    {
        return $this->statut === 'rejetee';
    }

    public function isUrgente(): bool
    {
        return $this->priorite === 'urgente';
    }

    public function hasIntervention(): bool
    {
        return $this->intervention()->exists();
    }

    public function getDelaiTraitement(): ?int
    {
        if ($this->date_validation) {
            return $this->date_demande->diffInDays($this->date_validation);
        }
        return null;
    }
}