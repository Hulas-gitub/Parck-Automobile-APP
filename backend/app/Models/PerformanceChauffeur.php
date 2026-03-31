<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerformanceChauffeur extends Model
{
    protected $table = 'performances_chauffeurs';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';

    protected $fillable = [
        'chauffeur_user_id',
        'date_debut_periode',
        'date_fin_periode',
        'total_missions',
        'total_km',
        'total_duree_minutes',
        'nb_accidents',
        'nb_anomalies_signalees',
        'consommation_moyenne',
        'score_performance',
        'notes',
    ];

    protected $casts = [
        'total_missions' => 'integer',
        'total_km' => 'integer',
        'total_duree_minutes' => 'integer',
        'nb_accidents' => 'integer',
        'nb_anomalies_signalees' => 'integer',
        'consommation_moyenne' => 'decimal:2',
        'score_performance' => 'decimal:2',
        'date_debut_periode' => 'date',
        'date_fin_periode' => 'date',
        'date_creation' => 'datetime',
    ];

    // Relations
    public function chauffeur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'chauffeur_user_id');
    }

    // Scopes
    public function scopeParChauffeur($query, int $chauffeurId)
    {
        return $query->where('chauffeur_user_id', $chauffeurId);
    }

    public function scopeParPeriode($query, $dateDebut, $dateFin)
    {
        return $query->where('date_debut_periode', '>=', $dateDebut)
                    ->where('date_fin_periode', '<=', $dateFin);
    }

    public function scopeRecentes($query, int $mois = 6)
    {
        return $query->where('date_fin_periode', '>=', now()->subMonths($mois));
    }

    public function scopeMeilleursScores($query, int $limite = 10)
    {
        return $query->orderBy('score_performance', 'desc')->limit($limite);
    }

    // Accessors
    public function getTotalHeuresAttribute(): float
    {
        return round($this->total_duree_minutes / 60, 2);
    }

    public function getKmMoyenParMissionAttribute(): ?float
    {
        if ($this->total_missions > 0) {
            return round($this->total_km / $this->total_missions, 2);
        }
        return null;
    }

    public function getTauxAccidentsAttribute(): float
    {
        if ($this->total_missions > 0) {
            return round(($this->nb_accidents / $this->total_missions) * 100, 2);
        }
        return 0;
    }

    // Méthodes helper
    public function calculerScore(): float
    {
        $score = 100;

        // Pénalité pour accidents (- 10 points par accident)
        $score -= ($this->nb_accidents * 10);

        // Bonus pour anomalies signalées (+ 2 points par anomalie, max 20)
        $score += min($this->nb_anomalies_signalees * 2, 20);

        // Pénalité pour mauvaise consommation
        if ($this->consommation_moyenne && $this->consommation_moyenne > 15) {
            $score -= (($this->consommation_moyenne - 15) * 2);
        }

        // Bonus pour bonne consommation
        if ($this->consommation_moyenne && $this->consommation_moyenne < 10) {
            $score += ((10 - $this->consommation_moyenne) * 2);
        }

        return max(0, min(100, round($score, 2)));
    }

    public function mettreAJourScore(): void
    {
        $this->score_performance = $this->calculerScore();
        $this->save();
    }

    public static function genererPourChauffeur(int $chauffeurId, $dateDebut, $dateFin): self
    {
        $missions = Mission::where('chauffeur_user_id', $chauffeurId)
            ->where('statut', 'terminee')
            ->whereBetween('date_retour_reelle', [$dateDebut, $dateFin])
            ->get();

        $totalKm = 0;
        $totalDuree = 0;
        $totalCarburant = 0;
        $nbMissionsAvecConso = 0;

        foreach ($missions as $mission) {
            if ($mission->km_parcourus) {
                $totalKm += $mission->km_parcourus;
            }
            if ($mission->duree_minutes) {
                $totalDuree += $mission->duree_minutes;
            }
            if ($mission->carburant_consomme) {
                $totalCarburant += $mission->carburant_consomme;
                $nbMissionsAvecConso++;
            }
        }

        $consommationMoyenne = null;
        if ($totalKm > 0 && $totalCarburant > 0) {
            $consommationMoyenne = round(($totalCarburant / $totalKm) * 100, 2);
        }

        $nbAccidents = Accident::where('chauffeur_user_id', $chauffeurId)
            ->whereBetween('date_accident', [$dateDebut, $dateFin])
            ->count();

        $nbAnomalies = Anomalie::where('signalee_par_user_id', $chauffeurId)
            ->whereBetween('date_signalement', [$dateDebut, $dateFin])
            ->count();

        $performance = self::create([
            'chauffeur_user_id' => $chauffeurId,
            'date_debut_periode' => $dateDebut,
            'date_fin_periode' => $dateFin,
            'total_missions' => $missions->count(),
            'total_km' => $totalKm,
            'total_duree_minutes' => $totalDuree,
            'nb_accidents' => $nbAccidents,
            'nb_anomalies_signalees' => $nbAnomalies,
            'consommation_moyenne' => $consommationMoyenne,
        ]);

        $performance->mettreAJourScore();

        return $performance;
    }
}