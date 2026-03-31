<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Notification extends Model
{
    protected $table = 'notifications';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';

    protected $fillable = [
        'categorie_id',
        'titre',
        'message',
        'vehicule_immatriculation',
        'donnees',
        'lien_url',
    ];

    protected $casts = [
        'donnees' => 'array',
        'date_creation' => 'datetime',
    ];

    // Relations
    public function categorie(): BelongsTo
    {
        return $this->belongsTo(CategorieNotification::class, 'categorie_id');
    }

    public function vehicule(): BelongsTo
    {
        return $this->belongsTo(Vehicule::class, 'vehicule_immatriculation', 'immatriculation');
    }

    public function envois(): HasMany
    {
        return $this->hasMany(EnvoiNotification::class, 'notification_id');
    }

    // Scopes
    public function scopeRecentes($query, int $jours = 7)
    {
        return $query->where('date_creation', '>=', now()->subDays($jours));
    }

    public function scopeCritiques($query)
    {
        return $query->whereHas('categorie', function($q) {
            $q->where('niveau_priorite', 'critique');
        });
    }

    public function scopeImportantes($query)
    {
        return $query->whereHas('categorie', function($q) {
            $q->where('niveau_priorite', 'important');
        });
    }

    public function scopeParVehicule($query, string $immatriculation)
    {
        return $query->where('vehicule_immatriculation', $immatriculation);
    }

    // Méthodes helper
    public function isCritique(): bool
    {
        return $this->categorie && $this->categorie->niveau_priorite === 'critique';
    }

    public function isImportante(): bool
    {
        return $this->categorie && $this->categorie->niveau_priorite === 'important';
    }

    public function getNombreDestinataires(): int
    {
        return $this->envois()->distinct('user_id')->count('user_id');
    }

    public function getNombreLus(): int
    {
        return $this->envois()->where('est_lu', true)->count();
    }

    public function getTauxLecture(): float
    {
        $total = $this->envois()->count();
        if ($total === 0) {
            return 0;
        }
        $lus = $this->getNombreLus();
        return round(($lus / $total) * 100, 2);
    }

    public function envoyerAUtilisateurs(array $userIds, array $canaux = ['in_app']): void
    {
        foreach ($userIds as $userId) {
            foreach ($canaux as $canal) {
                EnvoiNotification::create([
                    'notification_id' => $this->id,
                    'user_id' => $userId,
                    'canal' => $canal,
                    'statut_envoi' => 'en_attente',
                ]);
            }
        }
    }

    public function envoyerParRoles(array $roleCodes, array $canaux = ['in_app']): void
    {
        $users = Utilisateur::actif()
            ->whereHas('role', function($q) use ($roleCodes) {
                $q->whereIn('code', $roleCodes);
            })
            ->pluck('id')
            ->toArray();

        $this->envoyerAUtilisateurs($users, $canaux);
    }
}