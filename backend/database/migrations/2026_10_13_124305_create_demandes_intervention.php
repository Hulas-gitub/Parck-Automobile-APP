<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Mise à jour de `demandes_intervention` :
 *   - nature_intervention (interne / externe)  → détermine QUI traite et SI un email part au DAAL
 *   - demandeur_autre (saisie libre si le demandeur n'est pas dans la liste)
 *   - anomalie_constatee (objet de l'intervention)
 *   - direction_id / affectation_id / direction_service_autre (Direction / service)
 *   - recommandation, kilometrage
 *   - statut_vehicule (statut imposé au véhicule à la soumission)
 *   - statut_vehicule_avant (pour restaurer le véhicule en cas de rejet / suppression)
 *   - statuts : en_attente | en_cours | termine | rejetee  (« approuvee » devient « en_cours »)
 *   - catégorie de notification « alerte_demande_intervention_externe »
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('demandes_intervention', function (Blueprint $table) {
            $table->string('nature_intervention', 20)->default('interne')->after('type_maintenance')
                  ->comment('interne, externe');
            $table->string('demandeur_autre', 150)->nullable()->after('demandeur_user_id');
            $table->text('anomalie_constatee')->nullable()->after('type_intervention');
            $table->unsignedInteger('direction_id')->nullable()->after('priorite');
            $table->unsignedBigInteger('affectation_id')->nullable()->after('direction_id');
            $table->string('direction_service_autre', 150)->nullable()->after('affectation_id');
            $table->text('recommandation')->nullable()->after('commentaire');
            $table->unsignedBigInteger('kilometrage')->nullable()->after('recommandation');
            $table->string('statut_vehicule', 50)->nullable()->after('kilometrage')
                  ->comment('immobilisation longue, immobilisation courte, indisponible, en_reparation, en_panne');
            $table->string('statut_vehicule_avant', 50)->nullable()->after('statut_vehicule');

            $table->index('nature_intervention', 'idx_demande_nature');
            $table->index('direction_id', 'idx_demande_direction');
            $table->index('affectation_id', 'idx_demande_affectation');

            $table->foreign('direction_id', 'fk_demande_direction')
                  ->references('id')->on('directions')->nullOnDelete()->cascadeOnUpdate();
            $table->foreign('affectation_id', 'fk_demande_affectation')
                  ->references('id')->on('affectations')->nullOnDelete()->cascadeOnUpdate();
        });

        DB::statement("ALTER TABLE `demandes_intervention`
            MODIFY `statut` VARCHAR(50) NOT NULL DEFAULT 'en_attente'
            COMMENT 'en_attente, en_cours, termine, rejetee'");

        // Ancien vocabulaire : « approuvee » → « en_cours »
        DB::table('demandes_intervention')->where('statut', 'approuvee')->update(['statut' => 'en_cours']);

        // Catégorie de notification (email + in_app) ciblant le rôle daal
        DB::table('categories_notifications')->insertOrIgnore([
            'code'            => 'alerte_demande_intervention_externe',
            'libelle'         => "Demande d'intervention externe",
            'niveau_priorite' => 'important',
            'canaux'          => json_encode(['email', 'in_app']),
            'roles_cibles'    => json_encode(['daal']),
            'description'     => "Une demande d'intervention EXTERNE a été soumise : le DAAL doit l'approuver ou la rejeter.",
            'est_actif'       => 1,
            'est_supprime'    => 0,
        ]);
    }

    public function down(): void
    {
        Schema::table('demandes_intervention', function (Blueprint $table) {
            $table->dropForeign('fk_demande_direction');
            $table->dropForeign('fk_demande_affectation');
            $table->dropIndex('idx_demande_nature');
            $table->dropIndex('idx_demande_direction');
            $table->dropIndex('idx_demande_affectation');
            $table->dropColumn([
                'nature_intervention', 'demandeur_autre', 'anomalie_constatee',
                'direction_id', 'affectation_id', 'direction_service_autre',
                'recommandation', 'kilometrage', 'statut_vehicule', 'statut_vehicule_avant',
            ]);
        });

        DB::table('demandes_intervention')->where('statut', 'termine')->update(['statut' => 'approuvee']);
        DB::table('demandes_intervention')->where('statut', 'en_cours')->update(['statut' => 'approuvee']);
        DB::statement("ALTER TABLE `demandes_intervention`
            MODIFY `statut` VARCHAR(50) NOT NULL DEFAULT 'en_attente'
            COMMENT 'en_attente, approuvee, rejetee'");

        DB::table('categories_notifications')->where('code', 'alerte_demande_intervention_externe')->delete();
    }
};