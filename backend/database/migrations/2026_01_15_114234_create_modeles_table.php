<?php
// Fichier: 2024_01_01_000005_create_modeles_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('modeles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('marque_id')->constrained('marques')->onDelete('cascade');
            $table->foreignId('categorie_id')->constrained('categories_vehicules')->onDelete('restrict');
            $table->string('nom', 100);
            $table->integer('nb_places_defaut')->default(5);
            $table->string('type_carburant_defaut', 50)->nullable()->comment('diesel, essence, hybride, electrique');
            $table->integer('capacite_reservoir_defaut')->nullable()->comment('Litres');
            $table->decimal('consommation_moyenne_defaut', 10, 2)->nullable()->comment('L/100km');
            $table->boolean('est_actif')->default(true);
            $table->timestamps();
            $table->softDeletes();
            
            $table->unique(['marque_id', 'nom'], 'unique_marque_modele');
            $table->index('marque_id', 'idx_modeles_marque');
            $table->index('categorie_id', 'idx_modeles_categorie');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('modeles');
    }
};