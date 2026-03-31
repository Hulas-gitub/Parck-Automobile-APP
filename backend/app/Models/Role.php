<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'roles';

    /**
     * The primary key associated with the table.
     */
    protected $primaryKey = 'id';

    /**
     * Indicates if the model's ID is auto-incrementing.
     */
    public $incrementing = true;

    /**
     * Indicates if the model should be timestamped.
     */
    public $timestamps = false;

    /**
     * The name of the "created at" column.
     */
    const CREATED_AT = 'date_creation';

    /**
     * The name of the "updated at" column.
     */
    const UPDATED_AT = 'date_modification';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'code',
        'libelle',
        'description',
        'est_supprime',
        'date_suppression',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'est_supprime' => 'boolean',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
        'date_suppression' => 'datetime',
    ];

    /**
     * Get the utilisateurs for the role.
     */
    public function utilisateurs(): HasMany
    {
        return $this->hasMany(Utilisateur::class, 'role_id');
    }

    /**
     * Scope a query to only include active roles.
     */
    public function scopeActif($query)
    {
        return $query->where('est_supprime', false);
    }

    /**
     * Check if the role is admin.
     */
    public function isAdmin(): bool
    {
        return $this->code === 'admin';
    }

    /**
     * Check if the role is chef_parc.
     */
    public function isChefParc(): bool
    {
        return $this->code === 'chef_parc';
    }

    /**
     * Check if the role is chef_tf.
     */
    public function isChefTF(): bool
    {
        return $this->code === 'chef_tf';
    }

    /**
     * Check if the role is chauffeur.
     */
    public function isChauffeur(): bool
    {
        return $this->code === 'chauffeur';
    }

    /**
     * Check if the role is mecanicien.
     */
    public function isMecanicien(): bool
    {
        return $this->code === 'mecanicien';
    }

    /**
     * Check if the role is agent_pc_radio.
     */
    public function isAgentPcRadio(): bool
    {
        return $this->code === 'agent_pc_radio';
    }

    /**
     * Get the nombre of active users with this role.
     */
    public function getNombreUtilisateurs(): int
    {
        return $this->utilisateurs()->where('est_actif', true)->where('est_supprime', false)->count();
    }
}