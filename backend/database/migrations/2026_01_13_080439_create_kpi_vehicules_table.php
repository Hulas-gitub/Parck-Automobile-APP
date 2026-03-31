<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kpi_vehicules', function (Blueprint $table) {
            $table->id();
            $table->string('vehicule_immatriculation', 30);
            $table->integer('annee_periode');
            $table->integer('mois_periode');
            $table->integer('jours_disponible')->default(0);
            $table->integer('jours_mission')->default(0);
            $table->integer('jours_maintenance')->default(0);
            $table->integer('jours_immobilise')->default(0);
            $table->integer('total_missions')->default(0);
            $table->unsignedBigInteger('total_km_missions')->default(0);
            $table->integer('total_interventions')->default(0);
            $table->decimal('total_duree_interventions_heures', 10, 2)->default(0.00);
            $table->decimal('cout_missions', 14, 2)->default(0.00);
            $table->decimal('cout_interventions', 14, 2)->default(0.00);
            $table->decimal('cout_pieces', 14, 2)->default(0.00);
            $table->decimal('cout_par_km', 10, 2)->nullable();
            $table->integer('nb_anomalies')->default(0);
            $table->integer('nb_accidents')->default(0);
            $table->timestamp('date_creation')->useCurrent();
            
            $table->unique(['vehicule_immatriculation', 'annee_periode', 'mois_periode'], 'uk_kpiveh_vehicule_periode');
            $table->index('vehicule_immatriculation', 'idx_kpiveh_vehicule');
            $table->index(['annee_periode', 'mois_periode'], 'idx_kpiveh_periode');
            
            $table->foreign('vehicule_immatriculation', 'fk_kpiveh_vehicule')
                  ->references('immatriculation')->on('vehicules')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
        });
        
        // Ajout des colonnes virtuelles après la création de la table
        DB::statement('ALTER TABLE kpi_vehicules ADD taux_disponibilite DECIMAL(5,2) GENERATED ALWAYS AS (
            CASE 
                WHEN jours_disponible + jours_mission + jours_maintenance + jours_immobilise > 0 
                THEN jours_disponible * 100.0 / (jours_disponible + jours_mission + jours_maintenance + jours_immobilise) 
                ELSE 0 
            END
        ) VIRTUAL');
        
        DB::statement('ALTER TABLE kpi_vehicules ADD cout_total DECIMAL(14,2) GENERATED ALWAYS AS (cout_missions + cout_interventions + cout_pieces) VIRTUAL');
    }

    public function down(): void
    {
        Schema::dropIfExists('kpi_vehicules');
    }
};