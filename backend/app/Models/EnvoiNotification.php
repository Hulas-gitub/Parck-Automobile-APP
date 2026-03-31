<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EnvoiNotification extends Model
{
    protected $table = 'envois_notifications';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'notification_id',
        'user_id',
        'canal',
        'statut_envoi',
        'date_envoi',
        'date_lecture',
        'est_lu',
        'erreur',
        'metadata_envoi',
    ];

    protected $casts = [
        'metadata_envoi' => 'array',
        'est_lu' => 'boolean',
        'date_envoi' => 'datetime',
        'date_lecture' => 'datetime',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
    ];

    // Relations
    public function notification(): BelongsTo
    {
        return $this->belongsTo(Notification::class, 'notification_id');
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'user_id');
    }

    // Scopes
    public function scopeEnAttente($query)
    {
        return $query->where('statut_envoi', 'en_attente');
    }

    public function scopeEnvoye($query)
    {
        return $query->where('statut_envoi', 'envoye');
    }

    public function scopeEchec($query)
    {
        return $query->where('statut_envoi', 'echec');
    }

    public function scopeLu($query)
    {
        return $query->where('est_lu', true);
    }

    public function scopeNonLu($query)
    {
        return $query->where('est_lu', false);
    }

    public function scopeParCanal($query, string $canal)
    {
        return $query->where('canal', $canal);
    }

    public function scopeEmail($query)
    {
        return $query->where('canal', 'email');
    }

    public function scopeInApp($query)
    {
        return $query->where('canal', 'in_app');
    }

    public function scopeParUtilisateur($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeRecentes($query, int $jours = 7)
    {
        return $query->where('date_creation', '>=', now()->subDays($jours));
    }

    // Méthodes helper
    public function isLu(): bool
    {
        return $this->est_lu === true;
    }

    public function isEnvoye(): bool
    {
        return $this->statut_envoi === 'envoye';
    }

    public function isEchec(): bool
    {
        return $this->statut_envoi === 'echec';
    }

    public function marquerCommeLu(): void
    {
        $this->est_lu = true;
        $this->date_lecture = now();
        $this->save();
    }

    public function marquerCommeEnvoye(): void
    {
        $this->statut_envoi = 'envoye';
        $this->date_envoi = now();
        $this->save();
    }

    public function marquerCommeEchec(string $erreur): void
    {
        $this->statut_envoi = 'echec';
        $this->erreur = $erreur;
        $this->date_envoi = now();
        $this->save();
    }

    public function getDelaiLecture(): ?int
    {
        if ($this->date_envoi && $this->date_lecture) {
            return $this->date_envoi->diffInMinutes($this->date_lecture);
        }
        return null;
    }

    public static function getNotificationsNonLues(int $userId, int $limite = 50): \Illuminate\Support\Collection
    {
        return self::where('user_id', $userId)
            ->where('est_lu', false)
            ->where('canal', 'in_app')
            ->with('notification.categorie')
            ->orderBy('date_creation', 'desc')
            ->limit($limite)
            ->get();
    }

    public static function marquerToutCommeLu(int $userId): int
    {
        return self::where('user_id', $userId)
            ->where('est_lu', false)
            ->where('canal', 'in_app')
            ->update([
                'est_lu' => true,
                'date_lecture' => now(),
            ]);
    }
}