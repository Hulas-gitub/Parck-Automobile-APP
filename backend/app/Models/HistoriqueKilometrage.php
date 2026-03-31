<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistoriqueKilometrage extends Model
{
    protected $table = 'historique_kilometrage';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = false;

    const CREATED_AT = 'date_creation';

    protected $fillable = [
        'vehicule_immatriculation',
        'kilometrage',
        'date_relevee',
        'source',
        'source_id',
        'enregistre_par_user_id',
        'notes',
    ];

    protected $casts = [
        'kilometrage' => 'integer',
        'source_id' => 'integer',
        'date_relevee' => 'date',
        'date_creation' => 'datetime',
    ];

    // Relations
    public function vehicule(): BelongsTo
    {
        return $this->belongsTo(Vehicule::class, 'vehicule_immatriculation', 'immatriculation');
    }

    public function enregistrePar(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'enregistre_par_user_id');
    }

    // Scopes
    public function scopeParVehicule($query, string $immatriculation)
    {
        return $query->where('vehicule_immatriculation', $immatriculation);
    }

    public function scopeParSource($query, string $source)
    {
        return $query->where('source', $source);
    }

    public function scopeParPeriode($query, $dateDebut, $dateFin)
    {
        return $query->whereBetween('date_relevee', [$dateDebut, $dateFin]);
    }

    public function scopeRecent($query, int $jours = 30)
    {
        return $query->where('date_relevee', '>=', now()->subDays($jours));
    }

    // Méthodes helper
    public function getSourceReference()
    {
        if (!$this->source_id) {
            return null;
        }

        switch ($this->source) {
            case 'mission':
                return Mission::find($this->source_id);
            case 'intervention':
                return Intervention::find($this->source_id);
            case 'pc_radio':
                return PcRadio::find($this->source_id);
            default:
                return null;
        }
    }

    public static function calculerKmMoyenParJour(string $immatriculation, int $jours = 30): ?float
    {
        $historique = self::where('vehicule_immatriculation', $immatriculation)
            ->where('date_relevee', '>=', now()->subDays($jours))
            ->orderBy('date_relevee')
            ->get();

        if ($historique->count() < 2) {
            return null;
        }

        $premier = $historique->first();
        $dernier = $historique->last();

        $kmParcourus = $dernier->kilometrage - $premier->kilometrage;
        $joursEcoules = $premier->date_relevee->diffInDays($dernier->date_relevee);

        if ($joursEcoules > 0) {
            return round($kmParcourus / $joursEcoules, 2);
        }

        return null;
    }

    public static function getEvolution(string $immatriculation, int $limite = 10): array
    {
        $historiques = self::where('vehicule_immatriculation', $immatriculation)
            ->orderBy('date_relevee', 'desc')
            ->limit($limite)
            ->get()
            ->reverse()
            ->values();

        $evolution = [];
        $precedent = null;

        foreach ($historiques as $hist) {
            $item = [
                'date' => $hist->date_relevee->format('Y-m-d'),
                'kilometrage' => $hist->kilometrage,
                'km_parcourus' => null,
                'jours' => null,
                'km_par_jour' => null,
            ];

            if ($precedent) {
                $item['km_parcourus'] = $hist->kilometrage - $precedent->kilometrage;
                $item['jours'] = $precedent->date_relevee->diffInDays($hist->date_relevee);
                if ($item['jours'] > 0) {
                    $item['km_par_jour'] = round($item['km_parcourus'] / $item['jours'], 2);
                }
            }

            $evolution[] = $item;
            $precedent = $hist;
        }

        return $evolution;
    }
}