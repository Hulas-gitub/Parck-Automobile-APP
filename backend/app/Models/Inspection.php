<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Inspection extends Model
{
    protected $table = 'inspections';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'type_inspection_id',
        'inspecteur_user_id',
        'date_inspection',
        'nom_verificateurs',
        'autres_constats',
        'notes',
        'chemin_rapport_pdf',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'est_supprime' => 'boolean',
        'date_inspection' => 'datetime',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
        'date_suppression' => 'datetime',
    ];

    // Relations
    public function typeInspection(): BelongsTo
    {
        return $this->belongsTo(TypeInspection::class, 'type_inspection_id');
    }

    public function inspecteur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'inspecteur_user_id');
    }

    public function inspectionsVehicules(): HasMany
    {
        return $this->hasMany(InspectionVehicule::class, 'inspection_id');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('est_supprime', false);
    }

    public function scopeRecentes($query, int $jours = 30)
    {
        return $query->where('date_inspection', '>=', now()->subDays($jours));
    }

    // Méthodes helper
    public function getNombreVehiculesInspectes(): int
    {
        return $this->inspectionsVehicules()->count();
    }

    public function getNombreDangersImmediats(): int
    {
        return $this->inspectionsVehicules()
            ->where('statut_global', 'danger_immediat')
            ->count();
    }

    public function getNombreNonConformes(): int
    {
        return $this->inspectionsVehicules()
            ->where('statut_global', 'non_conforme')
            ->count();
    }
}