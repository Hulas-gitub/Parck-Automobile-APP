<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('demandes_intervention', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('anomalie_id')->nullable();
            $table->string('vehicule_immatriculation', 30);
            $table->unsignedBigInteger('demandeur_user_id')->nullable();
            $table->dateTime('date_demande')->useCurrent();
            $table->string('type_maintenance', 50)->default('corrective')->comment('corrective, preventive');
            $table->string('type_intervention', 100)->nullable();
            $table->string('priorite', 30)->default('normale')->comment('faible, normale, haute, urgente');
            $table->string('statut', 50)->default('en_attente')->comment('en_attente, approuvee, rejetee');
            $table->text('commentaire')->nullable();
            $table->text('motif_rejet')->nullable();
            $table->unsignedBigInteger('validee_par_user_id')->nullable();
            $table->dateTime('date_validation')->nullable();
            $table->boolean('est_supprime')->default(false);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('date_suppression')->nullable();
            
            $table->index('vehicule_immatriculation', 'idx_demande_vehicule');
            $table->index('demandeur_user_id', 'idx_demande_demandeur');
            $table->index('anomalie_id', 'idx_demande_anomalie');
            $table->index('statut', 'idx_demande_statut');
            $table->index('priorite', 'idx_demande_priorite');
            $table->index('est_supprime', 'idx_demande_actives');
            $table->index('validee_par_user_id', 'fk_demande_validee_par');
            
            $table->foreign('vehicule_immatriculation', 'fk_demande_vehicule')
                  ->references('immatriculation')->on('vehicules')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            $table->foreign('demandeur_user_id', 'fk_demande_demandeur')
                  ->references('id')->on('utilisateurs')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
            
            $table->foreign('anomalie_id', 'fk_demande_anomalie')
                  ->references('id')->on('anomalies')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
            
            $table->foreign('validee_par_user_id', 'fk_demande_validee_par')
                  ->references('id')->on('utilisateurs')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demandes_intervention');
    }
};