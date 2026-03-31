<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentChauffeur extends Model
{
    protected $table = 'documents_chauffeurs';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'chauffeur_user_id',
        'type_document',
        'nom_document',
        'chemin_fichier',
        'numero_permis',
        'categories_permis',
        'pays_delivrance',
        'date_delivrance',
        'date_expiration',
        'telecharge_par_user_id',
        'notes',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'est_supprime' => 'boolean',
        'date_delivrance' => 'date',
        'date_expiration' => 'date',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
        'date_suppression' => 'datetime',
    ];

    // Relations
    public function chauffeur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'chauffeur_user_id');
    }

    public function telchargePar(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'telecharge_par_user_id');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('est_supprime', false);
    }

    public function scopeParType($query, string $type)
    {
        return $query->where('type_document', $type);
    }

    public function scopePermisConduire($query)
    {
        return $query->where('type_document', 'permis_conduire');
    }

    public function scopeExpire($query)
    {
        return $query->whereNotNull('date_expiration')
                    ->where('date_expiration', '<', now());
    }

    public function scopeExpirationProche($query, int $jours = 60)
    {
        return $query->whereNotNull('date_expiration')
                    ->whereBetween('date_expiration', [now(), now()->addDays($jours)]);
    }

    // Accessors
    public function getJoursAvantExpirationAttribute(): ?int
    {
        if ($this->date_expiration) {
            return now()->diffInDays($this->date_expiration, false);
        }
        return null;
    }

    public function getCategoriesPermisArrayAttribute(): array
    {
        if ($this->categories_permis) {
            return explode(',', str_replace(' ', '', $this->categories_permis));
        }
        return [];
    }

    // Méthodes helper
    public function isExpire(): bool
    {
        return $this->date_expiration && $this->date_expiration->isPast();
    }

    public function isExpirationProche(int $jours = 60): bool
    {
        if ($this->date_expiration) {
            $joursRestants = $this->jours_avant_expiration;
            return $joursRestants !== null && $joursRestants >= 0 && $joursRestants <= $jours;
        }
        return false;
    }

    public function isPermisConduire(): bool
    {
        return $this->type_document === 'permis_conduire';
    }

    public function hasCategoriePermis(string $categorie): bool
    {
        return in_array(strtoupper($categorie), $this->categories_permis_array);
    }

    public function isValide(): bool
    {
        return !$this->isExpire() && !$this->est_supprime;
    }
}