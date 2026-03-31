<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParametreAlerte extends Model
{
    protected $table = 'parametres_alertes';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'type_alerte',
        'condition_declenchement',
        'valeur_seuil',
        'categorie_notification_id',
        'message_template',
        'est_actif',
        'est_supprime',
        'date_suppression',
    ];

    protected $casts = [
        'valeur_seuil' => 'integer',
        'est_actif' => 'boolean',
        'est_supprime' => 'boolean',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
        'date_suppression' => 'datetime',
    ];

    // Relations
    public function categorieNotification(): BelongsTo
    {
        return $this->belongsTo(CategorieNotification::class, 'categorie_notification_id');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('est_actif', true)->where('est_supprime', false);
    }

    public function scopeParType($query, string $type)
    {
        return $query->where('type_alerte', $type);
    }

    // Méthodes helper
    public function isActif(): bool
    {
        return $this->est_actif === true && $this->est_supprime === false;
    }

    public function genererMessage(array $variables = []): string
    {
        $message = $this->message_template;
        
        foreach ($variables as $key => $value) {
            $message = str_replace('{{' . $key . '}}', $value, $message);
        }
        
        return $message;
    }

    public function verifierCondition($valeur): bool
    {
        if (!$this->valeur_seuil) {
            return false;
        }

        switch ($this->condition_declenchement) {
            case 'inferieur':
            case '<':
                return $valeur < $this->valeur_seuil;
            
            case 'inferieur_egal':
            case '<=':
                return $valeur <= $this->valeur_seuil;
            
            case 'superieur':
            case '>':
                return $valeur > $this->valeur_seuil;
            
            case 'superieur_egal':
            case '>=':
                return $valeur >= $this->valeur_seuil;
            
            case 'egal':
            case '==':
                return $valeur == $this->valeur_seuil;
            
            default:
                return false;
        }
    }

    public static function verifierStockFaible(PieceDetachee $piece): ?self
    {
        $parametre = self::actif()
            ->where('type_alerte', 'stock_faible')
            ->first();

        if ($parametre && $parametre->verifierCondition($piece->quantite_stock)) {
            return $parametre;
        }

        return null;
    }

    public static function verifierKilometrageVidange(Vehicule $vehicule): ?self
    {
        if (!$vehicule->km_prochaine_vidange) {
            return null;
        }

        $kmRestants = $vehicule->km_prochaine_vidange - $vehicule->kilometrage;
        
        $parametre = self::actif()
            ->where('type_alerte', 'kilometrage_vidange')
            ->first();

        if ($parametre && $parametre->verifierCondition($kmRestants)) {
            return $parametre;
        }

        return null;
    }
}