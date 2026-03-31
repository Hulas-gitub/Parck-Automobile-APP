<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('planning_maintenance', function (Blueprint $table) {
            $table->id();
            $table->string('vehicule_immatriculation', 30);
            $table->unsignedBigInteger('regle_id')->nullable();
            $table->string('type_maintenance', 150);
            $table->text('description')->nullable();
            $table->integer('frequence_km')->nullable();
            $table->integer('frequence_mois')->nullable();
            $table->date('date_derniere_realisation')->nullable();
            $table->unsignedBigInteger('km_derniere_realisation')->nullable();
            $table->unsignedBigInteger('derniere_intervention_id')->nullable();
            $table->date('prochaine_echeance_date')->nullable();
            $table->unsignedBigInteger('prochaine_echeance_km')->nullable();
            $table->string('statut', 50)->default('a_planifier');
            $table->boolean('est_supprime')->default(false);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('date_suppression')->nullable();
            
            $table->index('vehicule_immatriculation', 'idx_planmaint_vehicule');
            $table->index('regle_id', 'idx_planmaint_regle');
            $table->index('statut', 'idx_planmaint_statut');
            $table->index(['prochaine_echeance_date', 'prochaine_echeance_km'], 'idx_planmaint_echeances');
            $table->index('est_supprime', 'idx_planmaint_actifs');
            $table->index('derniere_intervention_id', 'fk_planmaint_derniere_interv');
            
            $table->foreign('vehicule_immatriculation', 'fk_planmaint_vehicule')
                  ->references('immatriculation')->on('vehicules')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            $table->foreign('regle_id', 'fk_planmaint_regle')
                  ->references('id')->on('regles_maintenance')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
            
            $table->foreign('derniere_intervention_id', 'fk_planmaint_derniere_interv')
                  ->references('id')->on('interventions')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('planning_maintenance');
    }
};