<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('types_inspection', function (Blueprint $table) {
            $table->increments('id');
            $table->string('code', 50)->unique()->comment('quotidienne, hebdomadaire, complete, periodique, tf');
            $table->string('libelle', 150);
            $table->text('description')->nullable();
            $table->integer('frequence_jours')->nullable()->comment('Fréquence recommandée en jours');
            $table->boolean('est_obligatoire')->default(false)->comment('Inspection obligatoire réglementaire');
            $table->integer('ordre_affichage')->default(0);
            $table->boolean('est_actif')->default(true);
            $table->boolean('est_supprime')->default(false);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('date_suppression')->nullable();
            
            $table->index(['est_supprime', 'est_actif'], 'idx_typeinsp_actifs');
            $table->index('ordre_affichage', 'idx_typeinsp_ordre');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('types_inspection');
    }
};