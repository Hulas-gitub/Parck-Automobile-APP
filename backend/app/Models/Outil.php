<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Outil extends Model
{
    protected $table = 'outils';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'nom',
        'type',
        'categorie',
        'etat',
        'emplacement',
        'date_dernier_controle',
        'notes',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'est_supprime' => 'boolean',
        'date_dernier_controle' => 'date',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
        'date_suppression' => 'datetime',
    ];

    // Relations
    public function problemes(): HasMany
    {
        return $this->hasMany(ProblemeOutil::class, 'outil_id');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('est_supprime', false);
    }

    public function scopeOK($query)
    {
        return $query->where('etat', 'OK');
    }

    public function scopeDefectueux($query)
    {
        return $query->whereIn('etat', ['HS', 'defectueux', 'en_panne']);
    }

    public function scopeHS($query)
    {
        return $query->where('etat', 'HS');
    }

    public function scopeParCategorie($query, string $categorie)
    {
        return $query->where('categorie', $categorie);
    }

    public function scopeParType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeControleDepasse($query, int $joursMax = 365)
    {
        return $query->where(function($q) use ($joursMax) {
            $q->whereNull('date_dernier_controle')
              ->orWhere('date_dernier_controle', '<', now()->subDays($joursMax));
        });
    }

    // Méthodes helper
    public function isOK(): bool
    {
        return $this->etat === 'OK';
    }

    public function isDefectueux(): bool
    {
        return in_array($this->etat, ['HS', 'defectueux', 'en_panne']);
    }

    public function isHS(): bool
    {
        return $this->etat === 'HS';
    }

    public function needsControle(int $joursMax = 365): bool
    {
        if (!$this->date_dernier_controle) {
            return true;
        }
        return $this->date_dernier_controle->diffInDays(now()) > $joursMax;
    }

    public function getJoursDepuisDernierControle(): ?int
    {
        if ($this->date_dernier_controle) {
            return $this->date_dernier_controle->diffInDays(now());
        }
        return null;
    }

    public function getNombreProblemes(): int
    {
        return $this->problemes()->count();
    }

    public function getNombreProblemesOuverts(): int
    {
        return $this->problemes()
            ->whereIn('statut', ['signale', 'en_cours'])
            ->count();
    }

    public function hasProblemeOuvert(): bool
    {
        return $this->getNombreProblemesOuverts() > 0;
    }

    public function marquerCommeControle(): void
    {
        $this->date_dernier_controle = now();
        $this->save();
    }

    public function changerEtat(string $nouvelEtat, ?string $notes = null): void
    {
        $ancienEtat = $this->etat;
        $this->etat = $nouvelEtat;
        
        if ($notes) {
            $this->notes = $this->notes ? $this->notes . "\n" . $notes : $notes;
        }
        
        $this->save();
    }
}