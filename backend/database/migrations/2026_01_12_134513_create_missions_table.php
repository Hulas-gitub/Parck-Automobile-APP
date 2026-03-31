<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('missions', function (Blueprint $table) {
            $table->id();
            $table->string('vehicule_immatriculation', 30);
            $table->unsignedBigInteger('chauffeur_user_id');
            $table->string('type_mission', 100)->nullable()->comment('transport_fonds, mission_brousse, autre');
            $table->string('destination', 255)->nullable();
            $table->unsignedInteger('direction_id')->nullable();
            $table->integer('nb_passagers')->default(1);
            $table->dateTime('date_depart_prevue');
            $table->dateTime('date_depart_reelle')->nullable();
            $table->dateTime('date_retour_reelle')->nullable();
            $table->unsignedBigInteger('km_depart')->nullable();
            $table->unsignedBigInteger('km_retour')->nullable();
            $table->decimal('carburant_consomme', 10, 2)->nullable()->comment('Litres');
            $table->decimal('cout_carburant', 12, 2)->nullable();
            $table->string('statut', 50)->default('planifiee')->comment('planifiee, en_cours, terminee, annulee');
            $table->string('reference_mission', 100)->nullable();
            $table->text('observations')->nullable();
            $table->boolean('incident_signale')->default(false);
            $table->text('description_incident')->nullable();
            $table->json('photos')->nullable();
            $table->boolean('est_supprime')->default(false);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('date_suppression')->nullable();
            
            $table->index('vehicule_immatriculation', 'idx_missions_vehicule');
            $table->index('chauffeur_user_id', 'idx_missions_chauffeur');
            $table->index('statut', 'idx_missions_statut');
            $table->index(['date_depart_prevue', 'statut'], 'idx_missions_dates');
            $table->index('direction_id', 'idx_missions_direction');
            $table->index('est_supprime', 'idx_missions_actives');
            $table->index(['vehicule_immatriculation', 'statut'], 'idx_missions_vehicule_statut');
            
            $table->foreign('vehicule_immatriculation', 'fk_missions_vehicule')
                  ->references('immatriculation')->on('vehicules')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            $table->foreign('chauffeur_user_id', 'fk_missions_chauffeur')
                  ->references('id')->on('utilisateurs')
                  ->onDelete('no action')
                  ->onUpdate('cascade');
            
            $table->foreign('direction_id', 'fk_missions_direction')
                  ->references('id')->on('directions')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('missions');
    }
};