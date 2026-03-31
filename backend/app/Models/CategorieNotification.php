<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CategorieNotification extends Model
{
    protected $table = 'categories_notifications';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'code',
        'libelle',
        'niveau_priorite',
        'canaux',
        'roles_cibles',
        'description',
        'est_actif',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'canaux' => 'array',
        'roles_cibles' => 'array',
        'est_actif' => 'boolean',
        'est_supprime' => 'boolean',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
        'date_suppression' => 'datetime',
    ];

    // Relations
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class, 'categorie_id');
    }

    public function parametresAlertes(): HasMany
    {
        return $this->hasMany(ParametreAlerte::class, 'categorie_notification_id');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('est_actif', true)->where('est_supprime', false);
    }

    public function scopeCritique($query)
    {
        return $query->where('niveau_priorite', 'critique');
    }

    public function scopeImportant($query)
    {
        return $query->where('niveau_priorite', 'important');
    }

    // Méthodes helper
    public function isCritique(): bool
    {
        return $this->niveau_priorite === 'critique';
    }

    public function hasCanal(string $canal): bool
    {
        return in_array($canal, $this->canaux ?? []);
    }

    public function isForRole(string $role): bool
    {
        return in_array($role, $this->roles_cibles ?? []);
    }
}