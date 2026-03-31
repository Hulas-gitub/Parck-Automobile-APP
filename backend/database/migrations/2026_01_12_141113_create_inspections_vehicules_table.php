<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspections_vehicules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('inspection_id');
            $table->string('vehicule_immatriculation', 30);
            $table->unsignedBigInteger('km_au_moment_inspection')->nullable();
            $table->string('statut_global', 50)->default('conforme')->comment('conforme, non_conforme, danger_immediat');
            $table->boolean('anomalies_detectees')->default(false);
            $table->unsignedBigInteger('anomalie_creee_id')->nullable();
            $table->text('observations_vehicule')->nullable();
            $table->timestamps(); // ✅ CORRECTION
            
            // Index uniquement sur les colonnes SANS foreign keys
            $table->index('statut_global', 'idx_inspveh_statut');
            // ✅ SUPPRIMÉ l'index dupliqué 'idx_inspveh_vehicule_date'
            
            // Foreign keys (créent automatiquement leurs propres index)
            $table->foreign('inspection_id', 'fk_inspveh_inspection')
                  ->references('id')->on('inspections')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            $table->foreign('vehicule_immatriculation', 'fk_inspveh_vehicule')
                  ->references('immatriculation')->on('vehicules')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            $table->foreign('anomalie_creee_id', 'fk_inspveh_anomalie')
                  ->references('id')->on('anomalies')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspections_vehicules');
    }
};