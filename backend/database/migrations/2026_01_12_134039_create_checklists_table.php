<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('checklists', function (Blueprint $table) {
            $table->increments('id');
            $table->string('code', 100)->unique()->comment('checklist_vidange, checklist_freins, checklist_tf');
            $table->string('libelle', 200);
            $table->text('description')->nullable();
            $table->unsignedInteger('type_inspection_id')->nullable()->comment('Type d\'inspection associé');
            $table->string('categorie', 100)->nullable()->comment('accessoires, niveaux_fluides, pneumatiques, carrosserie, freinage, direction, electricite, equipements_securite');
            $table->json('elements_a_verifier')->nullable()->comment('JSON: liste des éléments standards à vérifier');
            $table->integer('ordre_affichage')->default(0);
            $table->boolean('est_actif')->default(true);
            $table->boolean('est_supprime')->default(false);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('date_suppression')->nullable();
            
            $table->index('type_inspection_id', 'idx_checklist_type_insp');
            $table->index('categorie', 'idx_checklist_categorie');
            $table->index(['est_supprime', 'est_actif'], 'idx_checklist_actifs');
            $table->index('ordre_affichage', 'idx_checklist_ordre');
            
            $table->foreign('type_inspection_id', 'fk_checklist_type_insp')
                  ->references('id')->on('types_inspection')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('checklists');
    }
};