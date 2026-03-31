<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ElementInspecte extends Model
{
    protected $table = 'elements_inspectes';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';

    protected $fillable = [
        'inspection_vehicule_id',
        'checklist_id',
        'element_verifie',
        'statut',
        'valeur_relevee',
        'commentaire',
        'photos',
    ];

    protected $casts = [
        'photos' => 'array',
        'date_creation' => 'datetime',
    ];

    // Relations
    public function inspectionVehicule(): BelongsTo
    {
        return $this->belongsTo(InspectionVehicule::class, 'inspection_vehicule_id');
    }

    public function checklist(): BelongsTo
    {
        return $this->belongsTo(Checklist::class, 'checklist_id');
    }

    // Scopes
    public function scopeOK($query)
    {
        return $query->where('statut', 'OK');
    }

    public function scopeNOK($query)
    {
        return $query->where('statut', 'NOK');
    }

    public function scopeDefectueux($query)
    {
        return $query->whereIn('statut', ['NOK', 'defectueux', 'use']);
    }

    public function scopeManquant($query)
    {
        return $query->where('statut', 'manquant');
    }

    public function scopeParChecklist($query, int $checklistId)
    {
        return $query->where('checklist_id', $checklistId);
    }

    // Méthodes helper
    public function isOK(): bool
    {
        return $this->statut === 'OK';
    }

    public function isNOK(): bool
    {
        return in_array($this->statut, ['NOK', 'defectueux', 'use', 'manquant']);
    }

    public function isDefectueux(): bool
    {
        return in_array($this->statut, ['defectueux', 'use']);
    }

    public function isManquant(): bool
    {
        return $this->statut === 'manquant';
    }

    public function getNiveauGravite(): string
    {
        switch ($this->statut) {
            case 'OK':
                return 'normal';
            case 'use':
                return 'faible';
            case 'NOK':
                return 'moyen';
            case 'defectueux':
                return 'haute';
            case 'manquant':
                return 'critique';
            default:
                return 'inconnu';
        }
    }

    public function requiresIntervention(): bool
    {
        return in_array($this->statut, ['NOK', 'defectueux', 'manquant']);
    }
}