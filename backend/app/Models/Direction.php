<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Direction extends Model
{
    protected $table = 'directions';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'nom',
        'code',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'est_supprime' => 'boolean',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
        'date_suppression' => 'datetime',
    ];

    // Relations
    public function utilisateurs(): HasMany
    {
        return $this->hasMany(Utilisateur::class, 'direction_id');
    }

    public function vehicules(): HasMany
    {
        return $this->hasMany(Vehicule::class, 'direction_id');
    }

    public function missions(): HasMany
    {
        return $this->hasMany(Mission::class, 'direction_id');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('est_supprime', false);
    }
}