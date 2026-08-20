<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration
{
    public function up(): void
    {
        // 1. Maintenant que accessoires existe, on branche la FK
        Schema::table('inspection_elements', function (Blueprint $table) {
            $table->foreign('accessoire_id', 'fk_insp_elem_accessoire')
                  ->references('id')->on('accessoires')
                  ->onDelete('restrict') // protège les données historiques
                  ->onUpdate('cascade');
        });

        // 2. Ajouter vehicule_immatriculation sur inspections
        //    pour simplifier la requête directe sans double jointure
        if (!Schema::hasColumn('inspections', 'vehicule_immatriculation')) {
            Schema::table('inspections', function (Blueprint $table) {
                $table->string('vehicule_immatriculation', 30)
                      ->nullable()
                      ->after('type_inspection_id');

                $table->index('vehicule_immatriculation', 'idx_inspections_vehicule');

                $table->foreign('vehicule_immatriculation', 'fk_inspections_vehicule')
                      ->references('immatriculation')->on('vehicules')
                      ->onDelete('set null')->onUpdate('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::table('inspection_elements', function (Blueprint $table) {
            $table->dropForeign('fk_insp_elem_accessoire');
        });

        Schema::table('inspections', function (Blueprint $table) {
            $table->dropForeign('fk_inspections_vehicule');
            $table->dropIndex('idx_inspections_vehicule');
            $table->dropColumn('vehicule_immatriculation');
        });
    }
};