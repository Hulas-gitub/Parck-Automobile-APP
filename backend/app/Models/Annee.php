<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Annee extends Model
{
    protected $table = 'annees';

    protected $fillable = [
        'annee',
        'est_actif',
    ];

    protected $casts = [
        'est_actif' => 'boolean',
    ];

    public function vehicules(): HasMany
    {
        return $this->hasMany(Vehicule::class, 'annee_id');
    }
}