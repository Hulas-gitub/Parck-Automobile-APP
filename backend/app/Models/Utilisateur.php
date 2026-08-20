<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;

class Utilisateur extends Authenticatable
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
        'est_actif'          => 'boolean',
        'est_supprime'       => 'boolean',
        'derniere_connexion' => 'datetime',
        'date_creation'      => 'datetime',
        'date_modification'  => 'datetime',
        'date_suppression'   => 'datetime',
        'date_embauche'      => 'datetime',  // ajouté via migration
        'categories_permis'  => 'string',    // ajouté via migration
    ];

    // ══════════════════════════════════════════════════════════════════
    // AUTHENTIFICATION
    // ══════════════════════════════════════════════════════════════════

    /**
     * Indique à Laravel quel champ contient le mot de passe.
     * Sans cette méthode Laravel cherche "password" (qui n'existe pas).
     */
    public function getAuthPassword(): string
    {
        return $this->mot_de_passe;
    }

    /**
     * Indique à Laravel quel champ utiliser comme identifiant de connexion.
     */
    public function getAuthIdentifierName(): string
    {
        return 'email';
    }

    // ══════════════════════════════════════════════════════════════════
    // MUTATEUR MOT DE PASSE
    // ══════════════════════════════════════════════════════════════════

    /**
     * Set the mot_de_passe attribute.
     *
     * IMPORTANT : on vérifie si la valeur est déjà un hash bcrypt avant
     * de hasher à nouveau. Cela évite le double-hachage quand on assigne
     * directement un Hash::make() depuis le controller.
     *
     * Règle : si la valeur commence par '$2y$' ou '$2a$' c'est déjà un
     * hash bcrypt → on la stocke telle quelle.
     * Sinon c'est un mot de passe en clair → on le hache.
     */
    public function setMotDePasseAttribute(string $value): void
    {
        if (str_starts_with($value, '$2y$') || str_starts_with($value, '$2a$')) {
            // Valeur déjà hashée (vient d'un Hash::make() externe)
            $this->attributes['mot_de_passe'] = $value;
        } else {
            // Mot de passe en clair → on hache
            $this->attributes['mot_de_passe'] = Hash::make($value);
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // RELATIONS
    // ══════════════════════════════════════════════════════════════════

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

    // ══════════════════════════════════════════════════════════════════
    // SCOPES
    // ══════════════════════════════════════════════════════════════════

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
        return $query->whereHas('role', function ($q) use ($codeRole) {
            $q->where('code', $codeRole);
        });
    }

    // ══════════════════════════════════════════════════════════════════
    // HELPERS RÔLES
    // ══════════════════════════════════════════════════════════════════

    public function hasRole(string $roleCode): bool
    {
        return $this->role && $this->role->code === $roleCode;
    }

    public function isAdmin(): bool        { return $this->hasRole('admin'); }
    public function isChefParc(): bool     { return $this->hasRole('chef_parc'); }
    public function isChefTF(): bool       { return $this->hasRole('chef_tf'); }
    public function isChauffeur(): bool    { return $this->hasRole('chauffeur'); }
    public function isMecanicien(): bool   { return $this->hasRole('mecanicien'); }
    public function isAgentPcRadio(): bool { return $this->hasRole('agent_pc_radio'); }

    // ══════════════════════════════════════════════════════════════════
    // AUTRES HELPERS
    // ══════════════════════════════════════════════════════════════════

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