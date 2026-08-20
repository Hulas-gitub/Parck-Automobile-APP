<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistoriqueAffectation extends Model
{
    protected $table = 'historique_affectations';

    protected $fillable = [
        // Véhicule
        'vehicule_immatriculation',

        // Origine
        'direction_origine_id',
        'affectation_origine_id',
        'direction_origine_nom',
        'affectation_origine_nom',

        // Emprunt
        'direction_emprunt_id',
        'affectation_emprunt_id',
        'direction_emprunt_nom',
        'affectation_emprunt_nom',

        // Période
        'date_debut',
        'date_fin_prevue',
        'date_fin_reelle',
        'duree_emprunt_minutes',

        // Acteurs
        'demande_par_user_id',
        'valide_par_user_id',
        'cloture_par_user_id',

        // Statut
        'statut',
        'motif',
        'notes',

        // Kilométrage
        'km_depart',
        'km_retour',

        // Suppression
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'date_debut'             => 'datetime',
        'date_fin_prevue'        => 'datetime',
        'date_fin_reelle'        => 'datetime',
        'date_suppression'       => 'datetime',
        'duree_emprunt_minutes'  => 'integer',
        'km_depart'              => 'integer',
        'km_retour'              => 'integer',
        'est_supprime'           => 'boolean',
    ];

    // ──────────────────────────────────────────────────────────────────────
    // RELATIONS
    // ──────────────────────────────────────────────────────────────────────

    public function vehicule(): BelongsTo
    {
        return $this->belongsTo(Vehicule::class, 'vehicule_immatriculation', 'immatriculation');
    }

    public function directionOrigine(): BelongsTo
    {
        return $this->belongsTo(Direction::class, 'direction_origine_id');
    }

    public function directionEmprunt(): BelongsTo
    {
        return $this->belongsTo(Direction::class, 'direction_emprunt_id');
    }

    public function affectationOrigine(): BelongsTo
    {
        return $this->belongsTo(Affectation::class, 'affectation_origine_id');
    }

    public function affectationEmprunt(): BelongsTo
    {
        return $this->belongsTo(Affectation::class, 'affectation_emprunt_id');
    }

    public function demandePar(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'demande_par_user_id');
    }

    public function validePar(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'valide_par_user_id');
    }

    public function cloturePar(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'cloture_par_user_id');
    }

    // ──────────────────────────────────────────────────────────────────────
    // SCOPES
    // ──────────────────────────────────────────────────────────────────────

    /** Emprunts actuellement actifs (en cours, non supprimés) */
    public function scopeEnCours($query)
    {
        return $query->where('statut', 'en_cours')
                     ->where('est_supprime', false);
    }

    /** Emprunts terminés */
    public function scopeTermines($query)
    {
        return $query->where('statut', 'termine')
                     ->where('est_supprime', false);
    }

    /** Historique d'un véhicule précis */
    public function scopePourVehicule($query, string $immatriculation)
    {
        return $query->where('vehicule_immatriculation', $immatriculation)
                     ->where('est_supprime', false);
    }

    /** Emprunts par la direction emprunteuse */
    public function scopePourDirectionEmprunt($query, int $directionId)
    {
        return $query->where('direction_emprunt_id', $directionId)
                     ->where('est_supprime', false);
    }

    // ──────────────────────────────────────────────────────────────────────
    // MÉTHODES MÉTIER
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Clôturer un emprunt : renseigne la date de fin réelle,
     * calcule la durée et passe le statut à "termine".
     */
    public function cloturer(int $cloturePar, ?int $kmRetour = null): void
    {
        $this->date_fin_reelle        = now();
        $this->duree_emprunt_minutes  = (int) $this->date_debut->diffInMinutes(now());
        $this->statut                 = 'termine';
        $this->cloture_par_user_id    = $cloturePar;

        if ($kmRetour !== null) {
            $this->km_retour = $kmRetour;
        }

        $this->save();
    }

    /**
     * Créer un nouvel emprunt en capturant automatiquement
     * les snapshots de noms depuis les relations.
     */
    public static function creerEmprunt(
        Vehicule    $vehicule,
        Direction   $directionEmprunt,
        int         $demandePar,
        string      $dateDebut,
        ?string     $dateFinPrevue      = null,
        ?int        $affectationEmpruntId = null,
        ?string     $motif              = null,
        ?int        $kmDepart           = null,
    ): self {
        return self::create([
            'vehicule_immatriculation' => $vehicule->immatriculation,

            // Origine — on snapshote depuis le véhicule
            'direction_origine_id'   => $vehicule->direction_id,
            'affectation_origine_id' => $vehicule->affectation_id,
            'direction_origine_nom'  => $vehicule->direction?->nom ?? 'N/A',
            'affectation_origine_nom'=> $vehicule->affectationRelation?->nom ?? $vehicule->affectation,

            // Emprunt
            'direction_emprunt_id'   => $directionEmprunt->id,
            'affectation_emprunt_id' => $affectationEmpruntId,
            'direction_emprunt_nom'  => $directionEmprunt->nom,

            // Période
            'date_debut'        => $dateDebut,
            'date_fin_prevue'   => $dateFinPrevue,
            'statut'            => 'en_cours',

            // Acteurs
            'demande_par_user_id' => $demandePar,

            // Divers
            'motif'     => $motif,
            'km_depart' => $kmDepart,
        ]);
    }
}