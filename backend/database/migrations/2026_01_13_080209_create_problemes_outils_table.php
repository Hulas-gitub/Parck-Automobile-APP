<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('problemes_outils', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('outil_id');
            $table->unsignedBigInteger('signale_par_user_id');
            $table->text('description_probleme');
            $table->json('photos')->nullable();
            $table->string('statut', 50)->default('signale');
            $table->dateTime('date_signalement')->useCurrent();
            $table->dateTime('date_resolution')->nullable();
            $table->text('notes_resolution')->nullable();
            $table->boolean('est_supprime')->default(false);
            $table->timestamp('date_suppression')->nullable();
            
            $table->index('outil_id', 'idx_pboutil_outil');
            $table->index('statut', 'idx_pboutil_statut');
            $table->index('est_supprime', 'idx_pboutil_actifs');
            $table->index('signale_par_user_id', 'fk_pboutil_signale_par');
            
            $table->foreign('outil_id', 'fk_pboutil_outil')
                  ->references('id')->on('outils')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            $table->foreign('signale_par_user_id', 'fk_pboutil_signale_par')
                  ->references('id')->on('utilisateurs')
                  ->onDelete('no action')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('problemes_outils');
    }
};