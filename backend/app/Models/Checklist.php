<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Checklist extends Model
{
    protected $table = 'checklists';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'code',
        'libelle',
        'description',
        'type_inspection_id',
        'categorie',
        'elements_a_verifier',
        'ordre_affichage',
        'est_actif',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'elements_a_verifier' => 'array',
        'ordre_affichage' => 'integer',
        'est_actif' => 'boolean',
        'est_supprime' => 'boolean',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
        'date_suppression' => 'datetime',
    ];

    // Relations
    public function typeInspection(): BelongsTo
    {
        return $this->belongsTo(TypeInspection::class, 'type_inspection_id');
    }

    public function elementsInspectes(): HasMany
    {
        return $this->hasMany(ElementInspecte::class, 'checklist_id');
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

    public function scopeParCategorie($query, string $categorie)
    {
        return $query->where('categorie', $categorie);
    }
}