<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class KpiVehicule extends Model
{
    protected $table = 'kpi_vehicules';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';

    protected $fillable = [
        'vehicule_immatriculation',
        'annee_periode',
        'mois_periode',
        'jours_disponible',
        'jours_mission',
        'jours_maintenance',
        'jours_immobilise',
        'total_missions',
        'total_km_missions',
        'total_interventions',
        'total_duree_interventions_heures',
        'cout_missions',
        'cout_interventions',
        'cout_pieces',
        'cout_par_km',
        'nb_anomalies',
        'nb_accidents',
    ];

    protected $casts = [
        'annee_periode' => 'integer',
        'mois_periode' => 'integer',
        'jours_disponible' => 'integer',
        'jours_mission' => 'integer',
        'jours_maintenance' => 'integer',
        'jours_immobilise' => 'integer',
        'total_missions' => 'integer',
        'total_km_missions' => 'integer',
        'total_interventions' => 'integer',
        'nb_anomalies' => 'integer',
        'nb_accidents' => 'integer',
        'total_duree_interventions_heures' => 'decimal:2',
        'cout_missions' => 'decimal:2',
        'cout_interventions' => 'decimal:2',
        'cout_pieces' => 'decimal:2',
        'cout_par_km' => 'decimal:2',
        'date_creation' => 'datetime',
    ];

    // Relations
    public function vehicule(): BelongsTo
    {
        return $this->belongsTo(Vehicule::class, 'vehicule_immatriculation', 'immatriculation');
    }

    // Scopes
    public function scopeParVehicule($query, string $immatriculation)
    {
        return $query->where('vehicule_immatriculation', $immatriculation);
    }

    public function scopeParPeriode($query, int $annee, ?int $mois = null)
    {
        $query->where('annee_periode', $annee);
        
        if ($mois) {
            $query->where('mois_periode', $mois);
        }
        
        return $query;
    }

    public function scopeAnneeEnCours($query)
    {
        return $query->where('annee_periode', now()->year);
    }

    public function scopeMoisEnCours($query)
    {
        return $query->where('annee_periode', now()->year)
                    ->where('mois_periode', now()->month);
    }

    // Accessors
    public function getTauxDisponibiliteAttribute(): float
    {
        $totalJours = $this->jours_disponible + $this->jours_mission + $this->jours_maintenance + $this->jours_immobilise;
        
        if ($totalJours > 0) {
            return round(($this->jours_disponible * 100.0) / $totalJours, 2);
        }
        
        return 0;
    }

    public function getCoutTotalAttribute(): float
    {
        return $this->cout_missions + $this->cout_interventions + $this->cout_pieces;
    }

    public function getTauxUtilisationAttribute(): float
    {
        $totalJours = $this->jours_disponible + $this->jours_mission + $this->jours_maintenance + $this->jours_immobilise;
        
        if ($totalJours > 0) {
            return round(($this->jours_mission * 100.0) / $totalJours, 2);
        }
        
        return 0;
    }

    public function getKmMoyenParMissionAttribute(): ?float
    {
        if ($this->total_missions > 0) {
            return round($this->total_km_missions / $this->total_missions, 2);
        }
        return null;
    }

    // Méthodes helper
    public function calculerCoutParKm(): void
    {
        if ($this->total_km_missions > 0) {
            $this->cout_par_km = round($this->cout_total / $this->total_km_missions, 2);
            $this->save();
        }
    }

    public static function genererPourVehicule(string $immatriculation, int $annee, int $mois): self
    {
        $dateDebut = Carbon::create($annee, $mois, 1)->startOfMonth();
        $dateFin = Carbon::create($annee, $mois, 1)->endOfMonth();
        $joursParMois = $dateFin->day;

        // Calculer les jours par statut
        $vehicule = Vehicule::where('immatriculation', $immatriculation)->first();
        
        // Missions
        $missions = Mission::where('vehicule_immatriculation', $immatriculation)
            ->where('statut', 'terminee')
            ->whereYear('date_retour_reelle', $annee)
            ->whereMonth('date_retour_reelle', $mois)
            ->get();

        $totalMissions = $missions->count();
        $totalKm = $missions->sum('km_parcourus') ?? 0;
        $coutMissions = $missions->sum('cout_carburant') ?? 0;

        // Interventions
        $interventions = Intervention::where('vehicule_immatriculation', $immatriculation)
            ->where('statut', 'terminee')
            ->whereYear('date_fin', $annee)
            ->whereMonth('date_fin', $mois)
            ->get();

        $totalInterventions = $interventions->count();
        $coutInterventions = $interventions->sum('cout_main_oeuvre') ?? 0;
        $coutPieces = $interventions->sum('cout_pieces') ?? 0;
        $dureeInterventions = $interventions->sum('duree_minutes') / 60 ?? 0;

        // Anomalies et accidents
        $nbAnomalies = Anomalie::where('vehicule_immatriculation', $immatriculation)
            ->whereYear('date_signalement', $annee)
            ->whereMonth('date_signalement', $mois)
            ->count();

        $nbAccidents = Accident::where('vehicule_immatriculation', $immatriculation)
            ->whereYear('date_accident', $annee)
            ->whereMonth('date_accident', $mois)
            ->count();

        // Estimation simplifiée des jours (à affiner avec une logique plus complexe)
        $joursMission = min($totalMissions * 2, $joursParMois); // Approximation
        $joursMaintenance = min($totalInterventions * 3, $joursParMois);
        $joursImmobilise = $nbAccidents * 5; // Approximation
        $joursDisponible = max(0, $joursParMois - $joursMission - $joursMaintenance - $joursImmobilise);

        $kpi = self::updateOrCreate(
            [
                'vehicule_immatriculation' => $immatriculation,
                'annee_periode' => $annee,
                'mois_periode' => $mois,
            ],
            [
                'jours_disponible' => $joursDisponible,
                'jours_mission' => $joursMission,
                'jours_maintenance' => $joursMaintenance,
                'jours_immobilise' => $joursImmobilise,
                'total_missions' => $totalMissions,
                'total_km_missions' => $totalKm,
                'total_interventions' => $totalInterventions,
                'total_duree_interventions_heures' => round($dureeInterventions, 2),
                'cout_missions' => $coutMissions,
                'cout_interventions' => $coutInterventions,
                'cout_pieces' => $coutPieces,
                'nb_anomalies' => $nbAnomalies,
                'nb_accidents' => $nbAccidents,
            ]
        );

        $kpi->calculerCoutParKm();

        return $kpi;
    }

    public static function genererRapportAnnuel(string $immatriculation, int $annee): array
    {
        $kpis = self::where('vehicule_immatriculation', $immatriculation)
            ->where('annee_periode', $annee)
            ->orderBy('mois_periode')
            ->get();

        return [
            'total_missions' => $kpis->sum('total_missions'),
            'total_km' => $kpis->sum('total_km_missions'),
            'total_interventions' => $kpis->sum('total_interventions'),
            'cout_total' => $kpis->sum(function($kpi) {
                return $kpi->cout_total;
            }),
            'taux_disponibilite_moyen' => $kpis->avg('taux_disponibilite'),
            'nb_anomalies' => $kpis->sum('nb_anomalies'),
            'nb_accidents' => $kpis->sum('nb_accidents'),
            'details_mensuels' => $kpis,
        ];
    }
}