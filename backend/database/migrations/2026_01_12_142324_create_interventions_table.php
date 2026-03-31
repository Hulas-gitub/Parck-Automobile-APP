<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interventions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('demande_id')->nullable();
            $table->string('vehicule_immatriculation', 30);
            $table->unsignedBigInteger('intervenant_id');
            $table->string('type_intervention', 100)->nullable();
            $table->string('severite', 30)->default('normale');
            $table->dateTime('date_debut')->nullable();
            $table->dateTime('date_fin')->nullable();
            $table->integer('duree_minutes')->nullable();
            $table->integer('duree_estimee_heures')->nullable();
            $table->unsignedBigInteger('km_au_moment_intervention')->nullable();
            $table->text('diagnostic')->nullable();
            $table->string('resultat', 100)->default('en_attente');
            $table->decimal('cout_main_oeuvre', 12, 2)->default(0.00);
            $table->decimal('cout_pieces', 12, 2)->default(0.00);
            $table->json('documents')->nullable();
            $table->text('notes')->nullable();
            $table->string('statut', 50)->default('planifiee')->comment('planifiee, en_cours, terminee, annulee');
            $table->boolean('est_supprime')->default(false);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('date_suppression')->nullable();
            
            $table->index('vehicule_immatriculation', 'idx_interv_vehicule');
            $table->index('intervenant_id', 'idx_interv_intervenant');
            $table->index('demande_id', 'idx_interv_demande');
            $table->index('statut', 'idx_interv_statut');
            $table->index(['date_debut', 'date_fin'], 'idx_interv_dates');
            $table->index('est_supprime', 'idx_interv_actives');
            $table->index(['vehicule_immatriculation', 'statut'], 'idx_interventions_vehicule_statut');
            
            $table->foreign('vehicule_immatriculation', 'fk_interv_vehicule')
                  ->references('immatriculation')->on('vehicules')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            $table->foreign('intervenant_id', 'fk_interv_intervenant')
                  ->references('id')->on('intervenants')
                  ->onDelete('no action')
                  ->onUpdate('cascade');
            
            $table->foreign('demande_id', 'fk_interv_demande')
                  ->references('id')->on('demandes_intervention')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interventions');
    }
};