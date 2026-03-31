<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Fournisseur extends Model
{
    protected $table = 'fournisseurs';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'nom',
        'contact',
        'telephone',
        'email',
        'type',
        'adresse',
        'est_actif',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'est_actif' => 'boolean',
        'est_supprime' => 'boolean',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
        'date_suppression' => 'datetime',
    ];

    // Relations
    public function piecesDetachees(): HasMany
    {
        return $this->hasMany(PieceDetachee::class, 'fournisseur_id');
    }

    public function mouvementsStock(): HasMany
    {
        return $this->hasMany(MouvementStock::class, 'fournisseur_id');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('est_actif', true)->where('est_supprime', false);
    }

    public function scopeParType($query, string $type)
    {
        return $query->where('type', $type);
    }
}