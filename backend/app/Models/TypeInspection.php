<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TypeInspection extends Model
{
    protected $table = 'types_inspection';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'code',
        'libelle',
        'description',
        'frequence_jours',
        'est_obligatoire',
        'ordre_affichage',
        'est_actif',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'frequence_jours' => 'integer',
        'ordre_affichage' => 'integer',
        'est_obligatoire' => 'boolean',
        'est_actif' => 'boolean',
        'est_supprime' => 'boolean',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
        'date_suppression' => 'datetime',
    ];

    // Relations
    public function inspections(): HasMany
    {
        return $this->hasMany(Inspection::class, 'type_inspection_id');
    }

    public function checklists(): HasMany
    {
        return $this->hasMany(Checklist::class, 'type_inspection_id');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('est_actif', true)->where('est_supprime', false);
    }

    public function scopeObligatoire($query)
    {
        return $query->where('est_obligatoire', true);
    }

    public function scopeOrdonne($query)
    {
        return $query->orderBy('ordre_affichage');
    }
}