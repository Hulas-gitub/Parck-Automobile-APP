<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pc_radio', function (Blueprint $table) {
            $table->id();
            $table->string('vehicule_immatriculation', 30);
            $table->unsignedBigInteger('chauffeur_user_id');
            $table->unsignedBigInteger('mission_id')->nullable();
            $table->dateTime('date_heure_remise');
            $table->unsignedBigInteger('km_depart');
            $table->string('niveau_carburant_depart', 50)->nullable();
            $table->json('checklist_avant');
            $table->json('photos_avant')->nullable();
            $table->text('observations_depart')->nullable();
            $table->dateTime('date_heure_retour')->nullable();
            $table->unsignedBigInteger('km_retour')->nullable();
            $table->string('niveau_carburant_retour', 50)->nullable();
            $table->json('checklist_apres')->nullable();
            $table->json('photos_apres')->nullable();
            $table->boolean('anomalies_detectees')->default(false);
            $table->text('observations_retour')->nullable();
            $table->unsignedBigInteger('agent_pc_radio_user_id');
            $table->text('signature_chauffeur_remise')->nullable();
            $table->text('signature_chauffeur_retour')->nullable();
            $table->boolean('est_supprime')->default(false);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('date_suppression')->nullable();
            
            $table->index('vehicule_immatriculation', 'idx_pcradio_vehicule');
            $table->index('chauffeur_user_id', 'idx_pcradio_chauffeur');
            $table->index('mission_id', 'idx_pcradio_mission');
            $table->index('agent_pc_radio_user_id', 'idx_pcradio_agent');
            $table->index(['date_heure_remise', 'date_heure_retour'], 'idx_pcradio_dates');
            $table->index('anomalies_detectees', 'idx_pcradio_anomalies');
            $table->index('est_supprime', 'idx_pcradio_actifs');
            $table->index(['vehicule_immatriculation', 'date_heure_retour'], 'idx_pcradio_en_cours');
            
            $table->foreign('vehicule_immatriculation', 'fk_pcradio_vehicule')
                  ->references('immatriculation')->on('vehicules')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            $table->foreign('chauffeur_user_id', 'fk_pcradio_chauffeur')
                  ->references('id')->on('utilisateurs')
                  ->onDelete('no action')
                  ->onUpdate('cascade');
            
            $table->foreign('mission_id', 'fk_pcradio_mission')
                  ->references('id')->on('missions')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
            
            $table->foreign('agent_pc_radio_user_id', 'fk_pcradio_agent')
                  ->references('id')->on('utilisateurs')
                  ->onDelete('no action')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pc_radio');
    }
};