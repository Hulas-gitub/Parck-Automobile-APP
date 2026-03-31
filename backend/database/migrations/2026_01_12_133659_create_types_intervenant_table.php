<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('types_intervenant', function (Blueprint $table) {
            $table->increments('id');
            $table->string('code', 50)->unique()->comment('mecanicien, electricien, carrossier, pneumaticien');
            $table->string('libelle', 150);
            $table->text('description')->nullable();
            $table->text('competences_requises')->nullable()->comment('Liste des compétences associées');
            $table->integer('ordre_affichage')->default(0);
            $table->boolean('est_actif')->default(true);
            $table->boolean('est_supprime')->default(false);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('date_suppression')->nullable();
            
            $table->index(['est_supprime', 'est_actif'], 'idx_typeinterv_actifs');
            $table->index('ordre_affichage', 'idx_typeinterv_ordre');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('types_intervenant');
    }
};