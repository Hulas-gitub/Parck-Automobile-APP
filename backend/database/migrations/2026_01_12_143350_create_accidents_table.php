<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accidents', function (Blueprint $table) {
            $table->id();
            $table->string('vehicule_immatriculation', 30);
            $table->unsignedBigInteger('chauffeur_user_id')->nullable();
            $table->unsignedBigInteger('mission_id')->nullable();
            $table->dateTime('date_accident');
            $table->string('lieu', 255)->nullable();
            $table->string('position_gps', 100)->nullable();
            $table->text('description')->nullable();
            $table->string('type_responsabilite', 100)->nullable();
            $table->string('niveau_degats', 50)->nullable();
            $table->string('chemin_rapport_police', 255)->nullable();
            $table->json('photos')->nullable();
            $table->boolean('vehicule_immobilise')->default(false);
            $table->integer('jours_immobilisation')->nullable();
            $table->unsignedBigInteger('km_au_moment_accident')->nullable();
            $table->boolean('assure')->default(false);
            $table->decimal('cout_estime', 14, 2)->default(0.00);
            $table->decimal('cout_reparation_final', 14, 2)->nullable();
            $table->decimal('montant_reclame_assurance', 14, 2)->nullable();
            $table->decimal('montant_verse_assurance', 14, 2)->nullable();
            $table->string('statut', 50)->default('declare');
            $table->text('notes')->nullable();
            $table->boolean('est_supprime')->default(false);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('date_suppression')->nullable();
            
            $table->index('vehicule_immatriculation', 'idx_acc_vehicule');
            $table->index('chauffeur_user_id', 'idx_acc_chauffeur');
            $table->index('date_accident', 'idx_acc_date');
            $table->index('statut', 'idx_acc_statut');
            $table->index('mission_id', 'idx_acc_mission');
            $table->index('est_supprime', 'idx_acc_actifs');
            
            $table->foreign('vehicule_immatriculation', 'fk_accidents_vehicule')
                  ->references('immatriculation')->on('vehicules')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            $table->foreign('chauffeur_user_id', 'fk_accidents_chauffeur')
                  ->references('id')->on('utilisateurs')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
            
            $table->foreign('mission_id', 'fk_accidents_mission')
                  ->references('id')->on('missions')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accidents');
    }
};