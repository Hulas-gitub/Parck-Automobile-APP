<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrelevementPiece extends Model
{
    protected $table = 'prelevements_pieces';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    protected $fillable = [
        'intervention_id',
        'piece_id',
        'quantite',
        'prix_unitaire',
        'preleve_par_user_id',
        'date_prelevement',
        'notes',
    ];

    protected $casts = [
        'quantite' => 'decimal:2',
        'prix_unitaire' => 'decimal:2',
        'date_prelevement' => 'datetime',
    ];

    // Relations
    public function intervention(): BelongsTo
    {
        return $this->belongsTo(Intervention::class, 'intervention_id');
    }

    public function piece(): BelongsTo
    {
        return $this->belongsTo(PieceDetachee::class, 'piece_id');
    }

    public function prelevePar(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'preleve_par_user_id');
    }

    // Accessors
    public function getCoutTotalAttribute(): float
    {
        return $this->quantite * $this->prix_unitaire;
    }

    // Méthodes helper
    public function annulerPrelevement(): bool
    {
        // Remettre la pièce en stock
        $piece = $this->piece;
        if ($piece) {
            $piece->quantite_stock += $this->quantite;
            $piece->save();

            // Créer un mouvement de retour
            MouvementStock::create([
                'piece_id' => $this->piece_id,
                'type_mouvement' => 'retour',
                'quantite' => $this->quantite,
                'prix_unitaire' => $this->prix_unitaire,
                'type_reference' => 'prelevement_annule',
                'reference_id' => $this->id,
                'effectue_par_user_id' => $this->preleve_par_user_id,
            ]);

            $this->delete();
            return true;
        }
        return false;
    }
}