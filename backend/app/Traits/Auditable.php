<?php

namespace App\Traits;

use App\Models\JournalAudit;
use Illuminate\Support\Arr;

trait Auditable
{
    /** Champs qu'on ne veut jamais logger (mots de passe, tokens...) */
    protected function champsExclusAudit(): array
    {
        return ['mot_de_passe', 'remember_token'];
    }

    /** Champs exclus + colonnes de timestamps techniques (bruit, pas de valeur d'audit) */
    protected function colonnesTechniquesExclues(): array
    {
        $colonnes = $this->champsExclusAudit();
        $colonnes[] = $this->getCreatedAtColumn();
        $colonnes[] = $this->getUpdatedAtColumn();
        return array_values(array_filter($colonnes));
    }

    /**
     * Libellé lisible pour l'audit, surchargeable dans chaque modèle.
     * Par défaut : pas de libellé précis, le front retombera sur un texte générique.
     */
    public function libelleAudit(string $action): ?string
    {
        return null;
    }

    protected static function bootAuditable(): void
    {
        static::created(function ($model) {
            $valeurs = Arr::except($model->getAttributes(), $model->colonnesTechniquesExclues());
            JournalAudit::tracer(
                auth()->id(), 'CREATE', $model->getTable(), (string) $model->getKey(),
                null, $valeurs, $model->libelleAudit('CREATE')
            );
        });

        static::updated(function ($model) {
            $changements = Arr::except($model->getChanges(), $model->colonnesTechniquesExclues());
            if (empty($changements)) return; // rien de significatif n'a changé

            $anciennes = Arr::only($model->getOriginal(), array_keys($changements));

            // Suppression logique (est_supprime: 0 → 1) : on logue en DELETE, pas en UPDATE
            $estSuppressionLogique = array_key_exists('est_supprime', $changements)
                && (int) $changements['est_supprime'] === 1
                && (int) ($anciennes['est_supprime'] ?? 0) === 0;

            $action = $estSuppressionLogique ? 'DELETE' : 'UPDATE';

            JournalAudit::tracer(
                auth()->id(), $action, $model->getTable(), (string) $model->getKey(),
                $anciennes, $changements, $model->libelleAudit($action)
            );
        });

        // Ne se déclenche que sur un vrai DELETE SQL (forceDelete / destroy sans soft-delete par flag).
        // Sur ce schéma, la suppression "métier" passe par est_supprime=1, déjà couverte par updated() ci-dessus.
        static::deleted(function ($model) {
            $valeurs = Arr::except($model->getOriginal(), $model->colonnesTechniquesExclues());
            JournalAudit::tracer(
                auth()->id(), 'DELETE', $model->getTable(), (string) $model->getKey(),
                $valeurs, null, $model->libelleAudit('DELETE')
            );
        });
    }
}