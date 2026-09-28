<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Supprimer les FK de l'ancienne table
        Schema::table('elements_inspectes', function (Blueprint $table) {
            $table->dropForeign('fk_eleminsp_checklist');
            $table->dropForeign('fk_eleminsp_insp_veh');
        });

        Schema::dropIfExists('elements_inspectes');

        // 2. Créer la nouvelle table fusionnée
        Schema::create('inspection_elements', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('inspection_vehicule_id');
            // ⚠ accessoire_id n'est PAS unique seul — même accessoire
            //   peut revenir dans plusieurs inspections différentes
            $table->unsignedBigInteger('accessoire_id');

            $table->enum('statut', ['OK', 'NOK', 'manquant', 'use', 'defectueux'])
                  ->default('OK');
            $table->string('valeur_relevee', 100)->nullable();
            $table->text('commentaire')->nullable();
            $table->json('photos')->nullable();
            $table->timestamps();

            // Un accessoire une seule fois PAR inspection (pas unique seul)
            $table->unique(['inspection_vehicule_id', 'accessoire_id'], 'uq_insp_elem_accessoire');

            $table->index('inspection_vehicule_id', 'idx_insp_elem_insp_veh');
            $table->index('accessoire_id',          'idx_insp_elem_accessoire');
            $table->index('statut',                 'idx_insp_elem_statut');

            $table->foreign('inspection_vehicule_id', 'fk_insp_elem_insp_veh')
                  ->references('id')->on('inspections_vehicules')
                  ->onDelete('cascade')->onUpdate('cascade');
            // FK accessoire_id ajoutée dans migration 3 (accessoires n'existe pas encore)
        });
    }

    public function down(): void
    {
        Schema::table('inspection_elements', function (Blueprint $table) {
            $table->dropForeign('fk_insp_elem_insp_veh');
        });
        Schema::dropIfExists('inspection_elements');

        Schema::create('elements_inspectes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('inspection_vehicule_id');
            $table->unsignedInteger('checklist_id');
            $table->string('element_verifie', 150);
            $table->string('statut', 30)->default('OK');
            $table->string('valeur_relevee', 100)->nullable();
            $table->text('commentaire')->nullable();
            $table->json('photos')->nullable();
            $table->timestamps();

            $table->foreign('inspection_vehicule_id', 'fk_eleminsp_insp_veh')
                  ->references('id')->on('inspections_vehicules')
                  ->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('checklist_id', 'fk_eleminsp_checklist')
                  ->references('id')->on('checklists')
                  ->onUpdate('cascade');
        });
    }
};

$nom = readline('Saisissez votre nom complet :');
$prenom = readline('Saisisez votre age :');
if($age >=30){
    echo('Bonjour '.$nom .''.$prenom ('Vous etes eligible a rentrer dans la ssale'));
} elseif($nom === 30){
    ech('Bonjour'.$nom.''.$prenom.'Vous avez l\'age Réquis');
}else{
    echo('Bonjour'.$nom.''.$prenom.'Vous n\'etes pas éliglible à rentré vous n\'avez pas un age requi pour ça');
}