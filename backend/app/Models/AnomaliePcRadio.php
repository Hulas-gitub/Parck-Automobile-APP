<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnomaliePcRadio extends Model
{
    protected $table = 'anomalies_pc_radio';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'pc_radio_id',
        'vehicule_immatriculation',
        'chauffeur_user_id',
        'type_degat',
        'partie_vehicule',
        'description',
        'photos',
        'severite',
        'date_detection',
        'statut',
        'notes',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'photos' => 'array',
        'est_supprime' => 'boolean',
        'date_detection' => 'datetime',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
        'date_suppression' => 'datetime',
    ];

    // Relations
    public function pcRadio(): BelongsTo
    {
        return $this->belongsTo(PcRadio::class, 'pc_radio_id');
    }

    public function vehicule(): BelongsTo
    {
        return $this->belongsTo(Vehicule::class, 'vehicule_immatriculation', 'immatriculation');
    }

    public function chauffeur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'chauffeur_user_id');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('est_supprime', false);
    }

    public function scopeSignale($query)
    {
        return $query->where('statut', 'signale');
    }

    public function scopeParSeverite($query, string $severite)
    {
        return $query->where('severite', $severite);
    }

    // Méthodes helper
    public function isCritique(): bool
    {
        return $this->severite === 'critique';
    }
}