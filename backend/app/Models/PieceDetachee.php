<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PieceDetachee extends Model
{
    protected $table = 'pieces_detachees';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'sku',
        'nom',
        'type_piece',
        'description',
        'quantite_stock',
        'seuil_alerte',
        'unite',
        'prix_unitaire',
        'fournisseur_id',
        'emplacement',
        'est_actif',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'quantite_stock' => 'decimal:2',
        'seuil_alerte' => 'decimal:2',
        'prix_unitaire' => 'decimal:2',
        'est_actif' => 'boolean',
        'est_supprime' => 'boolean',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
        'date_suppression' => 'datetime',
    ];

    // Relations
    public function fournisseur(): BelongsTo
    {
        return $this->belongsTo(Fournisseur::class, 'fournisseur_id');
    }

    public function mouvementsStock(): HasMany
    {
        return $this->hasMany(MouvementStock::class, 'piece_id');
    }

    public function prelevements(): HasMany
    {
        return $this->hasMany(PrelevementPiece::class, 'piece_id');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('est_actif', true)->where('est_supprime', false);
    }

    public function scopeStockFaible($query)
    {
        return $query->whereRaw('quantite_stock <= seuil_alerte');
    }

    public function scopeRupture($query)
    {
        return $query->where('quantite_stock', '<=', 0);
    }

    public function scopeParType($query, string $type)
    {
        return $query->where('type_piece', $type);
    }

    // Méthodes helper
    public function isStockFaible(): bool
    {
        return $this->quantite_stock <= $this->seuil_alerte;
    }

    public function isEnRupture(): bool
    {
        return $this->quantite_stock <= 0;
    }

    public function getPourcentageStock(): float
    {
        if ($this->seuil_alerte == 0) {
            return 100.0;
        }
        return round(($this->quantite_stock / $this->seuil_alerte) * 100, 2);
    }

    public function ajouterStock(float $quantite, ?int $userId = null, ?int $fournisseurId = null): void
    {
        $this->quantite_stock += $quantite;
        $this->save();

        MouvementStock::create([
            'piece_id' => $this->id,
            'type_mouvement' => 'entree',
            'quantite' => $quantite,
            'prix_unitaire' => $this->prix_unitaire,
            'effectue_par_user_id' => $userId,
            'fournisseur_id' => $fournisseurId,
        ]);
    }

    public function retirerStock(float $quantite, ?int $userId = null): bool
    {
        if ($this->quantite_stock >= $quantite) {
            $this->quantite_stock -= $quantite;
            $this->save();

            MouvementStock::create([
                'piece_id' => $this->id,
                'type_mouvement' => 'sortie',
                'quantite' => -$quantite,
                'prix_unitaire' => $this->prix_unitaire,
                'effectue_par_user_id' => $userId,
            ]);

            return true;
        }
        return false;
    }

    public function getValeurStock(): float
    {
        return round($this->quantite_stock * $this->prix_unitaire, 2);
    }
}