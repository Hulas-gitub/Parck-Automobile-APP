<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('anomalies', function (Blueprint $table) {
            $table->id();
            $table->string('vehicule_immatriculation', 30);
            $table->unsignedBigInteger('signalee_par_user_id')->nullable();
            $table->unsignedBigInteger('mission_id')->nullable();
            $table->unsignedBigInteger('inspection_vehicule_id')->nullable();
            $table->dateTime('date_signalement')->useCurrent();
            $table->text('description');
            $table->string('partie_vehicule', 100)->nullable()->comment('moteur, freins, direction');
            $table->string('severite', 30)->default('moyenne')->comment('faible, moyenne, haute, critique');
            $table->unsignedBigInteger('km_au_signalement')->nullable();
            $table->string('position_gps', 100)->nullable();
            $table->json('photos')->nullable();
            $table->string('statut', 50)->default('ouverte')->comment('ouverte, en_cours, resolue, annulee');
            $table->boolean('est_supprime')->default(false);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('date_suppression')->nullable();
            
            $table->index('vehicule_immatriculation', 'idx_anomalies_vehicule');
            $table->index('signalee_par_user_id', 'idx_anomalies_signalee_par');
            $table->index('statut', 'idx_anomalies_statut');
            $table->index('severite', 'idx_anomalies_severite');
            $table->index('mission_id', 'idx_anomalies_mission');
            $table->index('inspection_vehicule_id', 'idx_anomalies_inspection');
            $table->index('est_supprime', 'idx_anomalies_actives');
            $table->index(['vehicule_immatriculation', 'statut'], 'idx_anomalies_vehicule_statut');
            
            $table->foreign('vehicule_immatriculation', 'fk_anomalies_vehicule')
                  ->references('immatriculation')->on('vehicules')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            $table->foreign('signalee_par_user_id', 'fk_anomalies_signalee_par')
                  ->references('id')->on('utilisateurs')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
            
            $table->foreign('mission_id', 'fk_anomalies_mission')
                  ->references('id')->on('missions')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('anomalies');
    }
};