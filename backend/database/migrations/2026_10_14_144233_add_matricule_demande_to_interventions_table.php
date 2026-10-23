<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. demandes_intervention : le matricule devient une vraie donnée stockée
        if (!Schema::hasColumn('demandes_intervention', 'matricule_demande')) {
            Schema::table('demandes_intervention', function (Blueprint $table) {
                $table->string('matricule_demande', 20)->nullable()->after('id');
            });

            // Rattrapage des 7 demandes existantes (y compris celles supprimées logiquement)
            DB::statement("
                UPDATE demandes_intervention
                SET matricule_demande = CONCAT('DEM-', LPAD(id, 5, '0'))
                WHERE matricule_demande IS NULL
            ");

            Schema::table('demandes_intervention', function (Blueprint $table) {
                $table->unique('matricule_demande', 'uq_demande_matricule');
            });
        }

        // 2. interventions : matricule de la demande d'origine
        if (!Schema::hasColumn('interventions', 'matricule_demande')) {
            Schema::table('interventions', function (Blueprint $table) {
                $table->string('matricule_demande', 20)->nullable()->after('demande_id');
                $table->index('matricule_demande', 'idx_interv_matricule_demande');
            });

            // Rattrapage (aucune ligne aujourd'hui, mais sans risque si la table se remplit avant la migration)
            DB::statement("
                UPDATE interventions i
                JOIN demandes_intervention d ON d.id = i.demande_id
                SET i.matricule_demande = d.matricule_demande
                WHERE i.matricule_demande IS NULL
            ");
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('interventions', 'matricule_demande')) {
            Schema::table('interventions', function (Blueprint $table) {
                $table->dropIndex('idx_interv_matricule_demande');
                $table->dropColumn('matricule_demande');
            });
        }

        if (Schema::hasColumn('demandes_intervention', 'matricule_demande')) {
            Schema::table('demandes_intervention', function (Blueprint $table) {
                $table->dropUnique('uq_demande_matricule');
                $table->dropColumn('matricule_demande');
            });
        }
    }
};