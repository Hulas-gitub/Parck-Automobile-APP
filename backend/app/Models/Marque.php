<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Marque extends Model
{
    use SoftDeletes;

    protected $table = 'marques';

    protected $fillable = [
        'nom',
        'pays_origine',
        'est_actif',
    ];

    protected $casts = [
        'est_actif'  => 'boolean',
        'deleted_at' => 'datetime',
    ];

    // Un marque a plusieurs modèles
    public function modeles(): HasMany
    {
        return $this->hasMany(Modele::class, 'marque_id');
    }

    // Un marque a plusieurs véhicules
    public function vehicules(): HasMany
    {
        return $this->hasMany(Vehicule::class, 'marque_id');
    }
}