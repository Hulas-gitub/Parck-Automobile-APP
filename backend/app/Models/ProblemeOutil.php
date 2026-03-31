<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProblemeOutil extends Model
{
    protected $table = 'problemes_outils';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    protected $fillable = [
        'outil_id',
        'signale_par_user_id',
        'description_probleme',
        'photos',
        'statut',
        'date_signalement',
        'date_resolution',
        'notes_resolution',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'photos' => 'array',
        'est_supprime' => 'boolean',
        'date_signalement' => 'datetime',
        'date_resolution' => 'datetime',
        'date_suppression' => 'datetime',
    ];

    // Relations
    public function outil(): BelongsTo
    {
        return $this->belongsTo(Outil::class, 'outil_id');
    }

    public function signalePar(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'signale_par_user_id');
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

    public function scopeEnCours($query)
    {
        return $query->where('statut', 'en_cours');
    }

    public function scopeResolu($query)
    {
        return $query->where('statut', 'resolu');
    }

    public function scopeOuvert($query)
    {
        return $query->whereIn('statut', ['signale', 'en_cours']);
    }

    public function scopeRecents($query, int $jours = 30)
    {
        return $query->where('date_signalement', '>=', now()->subDays($jours));
    }

    // Méthodes helper
    public function isSignale(): bool
    {
        return $this->statut === 'signale';
    }

    public function isEnCours(): bool
    {
        return $this->statut === 'en_cours';
    }

    public function isResolu(): bool
    {
        return $this->statut === 'resolu';
    }

    public function isOuvert(): bool
    {
        return in_array($this->statut, ['signale', 'en_cours']);
    }

    public function marquerEnCours(): void
    {
        $this->statut = 'en_cours';
        $this->save();
    }

    public function resoudre(string $notesResolution): void
    {
        $this->statut = 'resolu';
        $this->date_resolution = now();
        $this->notes_resolution = $notesResolution;
        $this->save();

        // Mettre à jour l'état de l'outil si nécessaire
        $outil = $this->outil;
        if ($outil && $outil->isDefectueux()) {
            // Vérifier s'il n'y a plus de problèmes ouverts
            if ($outil->getNombreProblemesOuverts() === 0) {
                $outil->changerEtat('OK', 'Problèmes résolus');
            }
        }
    }

    public function getDureeResolution(): ?int
    {
        if ($this->date_resolution) {
            return $this->date_signalement->diffInDays($this->date_resolution);
        }
        return null;
    }

    public function getDureeOuverte(): int
    {
        $dateFin = $this->date_resolution ?? now();
        return $this->date_signalement->diffInDays($dateFin);
    }
}