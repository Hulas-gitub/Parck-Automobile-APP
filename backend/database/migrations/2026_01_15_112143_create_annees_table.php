<?php
// Fichier: 2024_01_01_000004_create_annees_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('annees', function (Blueprint $table) {
            $table->id();
            $table->year('annee')->unique();
            $table->boolean('est_actif')->default(true);
            $table->timestamps();
            
            $table->index('annee', 'idx_annees_annee');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('annees');
    }
};