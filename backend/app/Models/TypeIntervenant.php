<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TypeIntervenant extends Model
{
    protected $table = 'types_intervenant';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'code',
        'libelle',
        'description',
        'competences_requises',
        'ordre_affichage',
        'est_actif',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'ordre_affichage' => 'integer',
        'est_actif' => 'boolean',
        'est_supprime' => 'boolean',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
        'date_suppression' => 'datetime',
    ];

    // Relations
    public function intervenants(): HasMany
    {
        return $this->hasMany(Intervenant::class, 'type_intervenant_id');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('est_actif', true)->where('est_supprime', false);
    }

    public function scopeOrdonne($query)
    {
        return $query->orderBy('ordre_affichage');
    }
}