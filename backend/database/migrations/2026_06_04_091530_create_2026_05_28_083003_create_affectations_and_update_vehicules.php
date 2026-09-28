<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Migration : table `affectations` + mise à jour `vehicules`
 *
 * Stratégie :
 *  1. Créer la table `affectations` (référentiel géré en backoffice)
 *  2. Insérer les valeurs distinctes existantes dans vehicules.affectation
 *  3. Ajouter la colonne `affectation_id` (FK nullable) dans vehicules
 *  4. Remplir affectation_id en faisant correspondre vehicules.affectation → affectations.id
 *  5. Conserver la colonne vehicules.affectation (varchar) comme cache dénormalisé
 *     → elle sera mise à jour automatiquement via le contrôleur
 *
 * ⚠️  Migration idempotente : chaque étape vérifie si elle a déjà été exécutée
 *     avant d'agir, pour éviter les erreurs en cas de re-run ou de déploiement
 *     sur une base déjà partiellement migrée.
 */
return new class extends Migration
{
    // ── UP ────────────────────────────────────────────────────────────────────

    public function up(): void
    {
        // ── 1. Table affectations ─────────────────────────────────────────────
        if (!Schema::hasTable('affectations')) {
            Schema::create('affectations', function (Blueprint $table) {
                $table->unsignedBigInteger('id')->autoIncrement();
                $table->string('nom', 150)->unique();
                $table->string('code', 30)->nullable()->unique();
                $table->text('description')->nullable();
                $table->boolean('est_actif')->default(true);
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // ── 2. Seed depuis les valeurs uniques déjà dans vehicules ───────────
        // (uniquement si la table vient d'être créée ou est vide)
        $existing = DB::table('vehicules')
            ->whereNotNull('affectation')
            ->where('affectation', '!=', '')
            ->where('est_supprime', 0)
            ->distinct()
            ->pluck('affectation');

        $now = now();
        foreach ($existing as $label) {
            $label = trim($label);
            if ($label === '') continue;

            $code = null;
            if (preg_match('/\(([^)]{1,30})\)\s*$/', $label, $m)) {
                $code = trim($m[1]);
            }

            $alreadyExists = DB::table('affectations')
                ->where('nom', $label)
                ->exists();

            if (!$alreadyExists) {
                DB::table('affectations')->insert([
                    'nom'        => $label,
                    'code'       => $code,
                    'est_actif'  => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        // ── 3. Ajouter affectation_id dans vehicules ──────────────────────────
        if (!Schema::hasColumn('vehicules', 'affectation_id')) {
            Schema::table('vehicules', function (Blueprint $table) {
                $table->unsignedBigInteger('affectation_id')
                      ->nullable()
                      ->after('ville')
                      ->comment('FK vers affectations.id');
            });
        }

        // ── 4. Renseigner affectation_id pour les lignes existantes ───────────
        $affectations = DB::table('affectations')->get(['id', 'nom']);
        foreach ($affectations as $aff) {
            DB::table('vehicules')
                ->where('affectation', trim($aff->nom))
                ->where('est_supprime', 0)
                ->whereNull('affectation_id') // ne pas écraser les valeurs déjà renseignées
                ->update(['affectation_id' => $aff->id]);
        }

        // ── 5. Contrainte FK ──────────────────────────────────────────────────
        // Vérifier si la FK existe déjà avant de la créer
        $fkExists = $this->foreignKeyExists('vehicules', 'fk_vehicules_affectation');

        if (!$fkExists) {
            Schema::table('vehicules', function (Blueprint $table) {
                $table->foreign('affectation_id', 'fk_vehicules_affectation')
                      ->references('id')
                      ->on('affectations')
                      ->onDelete('set null')
                      ->onUpdate('cascade');
            });
        }

        // Index pour les filtres / stats
        $indexExists = $this->indexExists('vehicules', 'idx_vehicules_affectation');

        if (!$indexExists) {
            Schema::table('vehicules', function (Blueprint $table) {
                $table->index('affectation_id', 'idx_vehicules_affectation');
            });
        }
    }

    // ── DOWN ──────────────────────────────────────────────────────────────────

    public function down(): void
    {
        Schema::table('vehicules', function (Blueprint $table) {
            if ($this->foreignKeyExists('vehicules', 'fk_vehicules_affectation')) {
                $table->dropForeign('fk_vehicules_affectation');
            }
            if ($this->indexExists('vehicules', 'idx_vehicules_affectation')) {
                $table->dropIndex('idx_vehicules_affectation');
            }
            if (Schema::hasColumn('vehicules', 'affectation_id')) {
                $table->dropColumn('affectation_id');
            }
        });

        Schema::dropIfExists('affectations');
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────

    /**
     * Vérifie si une clé étrangère existe sur une table.
     */
    private function foreignKeyExists(string $table, string $fkName): bool
    {
        $database = config('database.connections.mysql.database');

        return DB::table('information_schema.KEY_COLUMN_USAGE')
            ->where('TABLE_SCHEMA', $database)
            ->where('TABLE_NAME', $table)
            ->where('CONSTRAINT_NAME', $fkName)
            ->exists();
    }

    /**
     * Vérifie si un index existe sur une table.
     */
    private function indexExists(string $table, string $indexName): bool
    {
        $database = config('database.connections.mysql.database');

        return DB::table('information_schema.STATISTICS')
            ->where('TABLE_SCHEMA', $database)
            ->where('TABLE_NAME', $table)
            ->where('INDEX_NAME', $indexName)
            ->exists();
    }
};