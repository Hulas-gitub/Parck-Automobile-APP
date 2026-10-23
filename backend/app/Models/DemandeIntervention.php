<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Cycle de vie :
 *   interne : en_cours dès la soumission (aucune validation)
 *   externe : en_attente → en_cours  (validée par le DAAL)
 *             en_attente → rejetee   (rejetée par le DAAL, motif obligatoire)
 *
 * Qui traite (valider / rejeter) :
 *   - nature EXTERNE → uniquement le rôle « daal » (notifié par email à la soumission)
 *   - nature INTERNE → jamais de validation (le contrôleur refuse tout traitement)
 *
 * MATRICULE : `matricule_demande` (ex. DEM-00007) est stocké en base et généré par le serveur
 * via DemandeIntervention::genererMatricule($id) juste après l'insertion.
 *
 * NB : les écritures passent par DB::table() dans le contrôleur (audit explicite via
 * JournalAudit::tracer, comme VehiculesController). Ne pas ajouter le trait Auditable ici
 * sous peine de doubler les lignes d'audit.
 */
class DemandeIntervention extends Model
{
    protected $table = 'demandes_intervention';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    // ── Constantes métier ────────────────────────────────────────────────────
    public const STATUT_EN_ATTENTE = 'en_attente';
    public const STATUT_EN_COURS   = 'en_cours';
    public const STATUT_TERMINE    = 'termine';
    public const STATUT_REJETEE    = 'rejetee';

    public const NATURE_INTERNE = 'interne';
    public const NATURE_EXTERNE = 'externe';

    public const ROLE_DAAL = 'daal';
    public const ROLES_TRAITEMENT_INTERNE = ['admin', 'chef_parc'];

    /** Préfixe + longueur du matricule : DEM-00007 */
    public const MATRICULE_PREFIXE = 'DEM-';
    public const MATRICULE_LONGUEUR = 5;

    protected $fillable = [
        'matricule_demande',
        'anomalie_id',
        'vehicule_immatriculation',
        'demandeur_user_id',
        'demandeur_autre',
        'date_demande',
        'type_maintenance',
        'nature_intervention',
        'type_intervention',
        'anomalie_constatee',
        'priorite',
        'direction_id',
        'affectation_id',
        'direction_service_autre',
        'statut',
        'commentaire',
        'recommandation',
        'kilometrage',
        'statut_vehicule',
        'statut_vehicule_avant',
        'motif_rejet',
        'validee_par_user_id',
        'date_validation',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'est_supprime'      => 'boolean',
        'kilometrage'       => 'integer',
        'date_demande'      => 'datetime',
        'date_validation'   => 'datetime',
        'date_creation'     => 'datetime',
        'date_modification' => 'datetime',
        'date_suppression'  => 'datetime',
    ];

    // ── Matricule ────────────────────────────────────────────────────────────

    /**
     * Matricule d'une demande à partir de son id (ex. 7 → « DEM-00007 »).
     * Utilisé par DemandeInterventionController (création, repli, audit, notifications).
     */
    public static function genererMatricule($id): string
    {
        return self::MATRICULE_PREFIXE . str_pad((string) $id, self::MATRICULE_LONGUEUR, '0', STR_PAD_LEFT);
    }

    /** Matricule stocké, sinon repli sur le calcul (lignes anciennes sans matricule). */
    public function getReferenceAttribute(): string
    {
        return $this->matricule_demande ?: self::genererMatricule($this->id);
    }

    // ── Relations ────────────────────────────────────────────────────────────
    public function anomalie(): BelongsTo
    {
        return $this->belongsTo(Anomalie::class, 'anomalie_id');
    }

    public function vehicule(): BelongsTo
    {
        return $this->belongsTo(Vehicule::class, 'vehicule_immatriculation', 'immatriculation');
    }

    public function demandeur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'demandeur_user_id');
    }

    public function valideePar(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'validee_par_user_id');
    }

    /** Nécessite un modèle App\Models\Direction (à adapter si le nom diffère). */
    public function direction(): BelongsTo
    {
        return $this->belongsTo(Direction::class, 'direction_id');
    }

    /** Nécessite un modèle App\Models\Affectation (à adapter si le nom diffère). */
    public function affectation(): BelongsTo
    {
        return $this->belongsTo(Affectation::class, 'affectation_id');
    }

    public function intervention(): HasOne
    {
        return $this->hasOne(Intervention::class, 'demande_id');
    }

    // ── Scopes ───────────────────────────────────────────────────────────────
    public function scopeActif($query)
    {
        return $query->where('est_supprime', false);
    }

    public function scopeEnAttente($query)
    {
        return $query->where('statut', self::STATUT_EN_ATTENTE);
    }

    public function scopeEnCours($query)
    {
        return $query->where('statut', self::STATUT_EN_COURS);
    }

    /** @deprecated « approuvee » est devenu « en_cours » — alias conservé pour compatibilité. */
    public function scopeApprouvee($query)
    {
        return $this->scopeEnCours($query);
    }

    public function scopeTermine($query)
    {
        return $query->where('statut', self::STATUT_TERMINE);
    }

    public function scopeRejetee($query)
    {
        return $query->where('statut', self::STATUT_REJETEE);
    }

    public function scopeInterne($query)
    {
        return $query->where('nature_intervention', self::NATURE_INTERNE);
    }

    public function scopeExterne($query)
    {
        return $query->where('nature_intervention', self::NATURE_EXTERNE);
    }

    public function scopeUrgente($query)
    {
        return $query->where('priorite', 'urgente');
    }

    public function scopeHautePriorite($query)
    {
        return $query->where('priorite', 'haute');
    }

    public function scopeCorrective($query)
    {
        return $query->where('type_maintenance', 'corrective');
    }

    public function scopePreventive($query)
    {
        return $query->where('type_maintenance', 'preventive');
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    public function isEnAttente(): bool
    {
        return $this->statut === self::STATUT_EN_ATTENTE;
    }

    public function isEnCours(): bool
    {
        return $this->statut === self::STATUT_EN_COURS;
    }

    /** @deprecated alias de isEnCours() */
    public function isApprouvee(): bool
    {
        return $this->isEnCours();
    }

    public function isTermine(): bool
    {
        return $this->statut === self::STATUT_TERMINE;
    }

    public function isRejetee(): bool
    {
        return $this->statut === self::STATUT_REJETEE;
    }

    public function isExterne(): bool
    {
        return $this->nature_intervention === self::NATURE_EXTERNE;
    }

    public function isInterne(): bool
    {
        return !$this->isExterne();
    }

    public function isUrgente(): bool
    {
        return $this->priorite === 'urgente';
    }

    public function hasIntervention(): bool
    {
        return $this->intervention()->exists();
    }

    /**
     * Un rôle donné peut-il valider / rejeter cette demande ?
     * Le contrôleur n'appelle ceci que pour la nature EXTERNE (DAAL) : une demande
     * interne n'est jamais validée.
     */
    public static function roleCanTreat(string $nature, ?string $roleCode): bool
    {
        if ($nature === self::NATURE_EXTERNE) {
            return $roleCode === self::ROLE_DAAL;
        }
        return in_array($roleCode, self::ROLES_TRAITEMENT_INTERNE, true);
    }

    public function getDelaiTraitement(): ?int
    {
        if ($this->date_validation) {
            return $this->date_demande->diffInDays($this->date_validation);
        }
        return null;
    }
}