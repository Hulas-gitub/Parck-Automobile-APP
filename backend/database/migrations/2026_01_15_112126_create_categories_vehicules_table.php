<?php
// Fichier: 2024_01_01_000003_create_categories_vehicules_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories_vehicules', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 100)->unique()->comment('Berline, SUV, Utilitaire, 4x4, etc.');
            $table->text('description')->nullable();
            $table->boolean('est_actif')->default(true);
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('nom', 'idx_categories_nom');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories_vehicules');
    }
};