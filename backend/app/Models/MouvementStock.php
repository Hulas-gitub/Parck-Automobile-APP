<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MouvementStock extends Model
{
    protected $table = 'mouvements_stock';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';

    protected $fillable = [
        'piece_id',
        'type_mouvement',
        'quantite',
        'prix_unitaire',
        'type_reference',
        'reference_id',
        'effectue_par_user_id',
        'fournisseur_id',
        'notes',
        'chemin_document',
    ];

    protected $casts = [
        'quantite' => 'decimal:2',
        'prix_unitaire' => 'decimal:2',
        'reference_id' => 'integer',
        'date_creation' => 'datetime',
    ];

    // Relations
    public function piece(): BelongsTo
    {
        return $this->belongsTo(PieceDetachee::class, 'piece_id');
    }

    public function effectuePar(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'effectue_par_user_id');
    }

    public function fournisseur(): BelongsTo
    {
        return $this->belongsTo(Fournisseur::class, 'fournisseur_id');
    }

    // Scopes
    public function scopeEntree($query)
    {
        return $query->where('type_mouvement', 'entree');
    }

    public function scopeSortie($query)
    {
        return $query->where('type_mouvement', 'sortie');
    }

    public function scopeAjustement($query)
    {
        return $query->where('type_mouvement', 'ajustement');
    }

    public function scopeRetour($query)
    {
        return $query->where('type_mouvement', 'retour');
    }

    public function scopeParPeriode($query, $dateDebut, $dateFin)
    {
        return $query->whereBetween('date_creation', [$dateDebut, $dateFin]);
    }

    // Accessors
    public function getMontantTotalAttribute(): float
    {
        return abs($this->quantite) * ($this->prix_unitaire ?? 0);
    }

    // Méthodes helper
    public function isEntree(): bool
    {
        return $this->type_mouvement === 'entree';
    }

    public function isSortie(): bool
    {
        return $this->type_mouvement === 'sortie';
    }
}