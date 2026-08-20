<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CategorieVehicule extends Model
{
    use SoftDeletes;

    protected $table = 'categories_vehicules';

    protected $fillable = [
        'nom',
        'description',
        'est_actif',
    ];

    protected $casts = [
        'est_actif'  => 'boolean',
        'deleted_at' => 'datetime',
    ];

    public function modeles(): HasMany
    {
        return $this->hasMany(Modele::class, 'categorie_id');
    }

    public function vehicules(): HasMany
    {
        return $this->hasMany(Vehicule::class, 'categorie_id');
    }
}