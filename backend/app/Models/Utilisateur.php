<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;

class Utilisateur extends Model
{
    use HasApiTokens;

    /**
     * The table associated with the model.
     */
    protected $table = 'utilisateurs';

    /**
     * The primary key associated with the table.
     */
    protected $primaryKey = 'id';

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
        'nom',
        'email',
        'mot_de_passe',
        'role_id',
        'direction_id',
        'est_actif',
        'est_supprime',
        'derniere_connexion',
        'date_suppression',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'mot_de_passe',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'est_actif' => 'boolean',
        'est_supprime' => 'boolean',
        'derniere_connexion' => 'datetime',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
        'date_suppression' => 'datetime',
    ];

    /**
     * Get the role that owns the utilisateur.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * Get the direction that owns the utilisateur.
     */
    public function direction(): BelongsTo
    {
        return $this->belongsTo(Direction::class, 'direction_id');
    }

    /**
     * Scope a query to only include active utilisateurs.
     */
    public function scopeActif($query)
    {
        return $query->where('est_actif', true)->where('est_supprime', false);
    }

    /**
     * Scope a query to filter by role.
     */
    public function scopeParRole($query, string $codeRole)
    {
        return $query->whereHas('role', function($q) use ($codeRole) {
            $q->where('code', $codeRole);
        });
    }

    /**
     * Set the mot_de_passe attribute (auto-hash).
     */
    public function setMotDePasseAttribute($value)
    {
        $this->attributes['mot_de_passe'] = Hash::make($value);
    }

    /**
     * Check if utilisateur has a specific role.
     */
    public function hasRole(string $roleCode): bool
    {
        return $this->role && $this->role->code === $roleCode;
    }

    /**
     * Check if utilisateur is admin.
     */
    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    /**
     * Check if utilisateur is chef_parc.
     */
    public function isChefParc(): bool
    {
        return $this->hasRole('chef_parc');
    }

    /**
     * Check if utilisateur is chef_tf.
     */
    public function isChefTF(): bool
    {
        return $this->hasRole('chef_tf');
    }

    /**
     * Check if utilisateur is chauffeur.
     */
    public function isChauffeur(): bool
    {
        return $this->hasRole('chauffeur');
    }

    /**
     * Check if utilisateur is mecanicien.
     */
    public function isMecanicien(): bool
    {
        return $this->hasRole('mecanicien');
    }

    /**
     * Check if utilisateur is agent_pc_radio.
     */
    public function isAgentPcRadio(): bool
    {
        return $this->hasRole('agent_pc_radio');
    }

    /**
     * Update derniere_connexion timestamp.
     */
    public function updateDerniereConnexion(): void
    {
        $this->derniere_connexion = now();
        $this->save();
    }

    /**
     * Get role libelle.
     */
    public function getRoleLibelleAttribute(): ?string
    {
        return $this->role?->libelle;
    }

    /**
     * Get role code.
     */
    public function getRoleCodeAttribute(): ?string
    {
        return $this->role?->code;
    }
}