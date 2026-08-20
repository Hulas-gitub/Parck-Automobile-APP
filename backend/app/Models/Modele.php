<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Modele extends Model
{
    use SoftDeletes;

    protected $table = 'modeles';

    protected $fillable = [
        'marque_id',
        'categorie_id',
        'nom',
        'nb_places_defaut',
        'type_carburant_defaut',
        'capacite_reservoir_defaut',
        'consommation_moyenne_defaut',
        'est_actif',
    ];

    protected $casts = [
        'nb_places_defaut'            => 'integer',
        'capacite_reservoir_defaut'   => 'integer',
        'consommation_moyenne_defaut' => 'decimal:2',
        'est_actif'                   => 'boolean',
        'deleted_at'                  => 'datetime',
    ];

    public function marque(): BelongsTo
    {
        return $this->belongsTo(Marque::class, 'marque_id');
    }

    public function categorie(): BelongsTo
    {
        return $this->belongsTo(CategorieVehicule::class, 'categorie_id');
    }

    public function vehicules(): HasMany
    {
        return $this->hasMany(Vehicule::class, 'modele_id');
    }
}