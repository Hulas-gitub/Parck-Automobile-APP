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
 */
return new class extends Migration
{
    // ── UP ────────────────────────────────────────────────────────────────────

    public function up(): void
    {
        // ── 1. Table affectations ─────────────────────────────────────────────
        Schema::create('affectations', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->autoIncrement();
            $table->string('nom', 150)->unique();           // Ex : "Transport de Fonds (TF)"
            $table->string('code', 30)->nullable()->unique(); // Ex : "TF"  (court, pour affichage badge)
            $table->text('description')->nullable();
            $table->boolean('est_actif')->default(true);
            $table->timestamps();                            // created_at / updated_at
            $table->softDeletes();                           // deleted_at
        });

        // ── 2. Seed depuis les valeurs uniques déjà dans vehicules ───────────
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

            // Tenter d'extraire un code entre parenthèses ex : "Transport de Fonds (TF)" → "TF"
            $code = null;
            if (preg_match('/\(([^)]{1,30})\)\s*$/', $label, $m)) {
                $code = trim($m[1]);
            }

            // Évite les doublons si la migration tourne plusieurs fois
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
        Schema::table('vehicules', function (Blueprint $table) {
            $table->unsignedBigInteger('affectation_id')
                  ->nullable()
                  ->after('ville')
                  ->comment('FK vers affectations.id');
        });

        // ── 4. Renseigner affectation_id pour les lignes existantes ───────────
        $affectations = DB::table('affectations')->get(['id', 'nom']);
        foreach ($affectations as $aff) {
            DB::table('vehicules')
                ->where('affectation', trim($aff->nom))
                ->where('est_supprime', 0)
                ->update(['affectation_id' => $aff->id]);
        }

        // ── 5. Contrainte FK ──────────────────────────────────────────────────
        Schema::table('vehicules', function (Blueprint $table) {
            $table->foreign('affectation_id', 'fk_vehicules_affectation')
                  ->references('id')
                  ->on('affectations')
                  ->onDelete('set null')
                  ->onUpdate('cascade');

            // Index pour les filtres / stats
            $table->index('affectation_id', 'idx_vehicules_affectation');
        });
    }

    // ── DOWN ──────────────────────────────────────────────────────────────────

    public function down(): void
    {
        // Supprimer la FK et la colonne dans vehicules
        Schema::table('vehicules', function (Blueprint $table) {
            $table->dropForeign('fk_vehicules_affectation');
            $table->dropIndex('idx_vehicules_affectation');
            $table->dropColumn('affectation_id');
        });

        // Supprimer la table affectations
        Schema::dropIfExists('affectations');
    }
};