<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('elements_inspectes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('inspection_vehicule_id');
            $table->unsignedInteger('checklist_id'); // ✅ CHANGÉ en unsignedInteger pour correspondre à checklists
            $table->string('element_verifie', 150);
            $table->string('statut', 30)->default('OK')->comment('OK, NOK, manquant, use, defectueux');
            $table->string('valeur_relevee', 100)->nullable();
            $table->text('commentaire')->nullable();
            $table->json('photos')->nullable();
            $table->timestamps();
            
            // Index uniquement sur les colonnes SANS foreign keys
            $table->index('statut', 'idx_eleminsp_statut');
            $table->index('element_verifie', 'idx_eleminsp_element');
            
            // Foreign keys (créent automatiquement leurs propres index)
            $table->foreign('inspection_vehicule_id', 'fk_eleminsp_insp_veh')
                  ->references('id')->on('inspections_vehicules')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            $table->foreign('checklist_id', 'fk_eleminsp_checklist')
                  ->references('id')->on('checklists')
                  ->onDelete('restrict')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('elements_inspectes');
    }
};