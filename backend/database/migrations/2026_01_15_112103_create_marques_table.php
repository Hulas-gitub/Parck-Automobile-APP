<?php
// Fichier: 2024_01_01_000002_create_marques_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marques', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 100)->unique();
            $table->string('pays_origine', 100)->nullable();
            $table->boolean('est_actif')->default(true);
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('nom', 'idx_marques_nom');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marques');
    }
};