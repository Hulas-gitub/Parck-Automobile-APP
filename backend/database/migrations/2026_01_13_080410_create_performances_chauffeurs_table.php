<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performances_chauffeurs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('chauffeur_user_id');
            $table->date('date_debut_periode');
            $table->date('date_fin_periode');
            $table->integer('total_missions')->default(0);
            $table->unsignedBigInteger('total_km')->default(0);
            $table->integer('total_duree_minutes')->default(0);
            $table->integer('nb_accidents')->default(0);
            $table->integer('nb_anomalies_signalees')->default(0);
            $table->decimal('consommation_moyenne', 10, 2)->nullable();
            $table->decimal('score_performance', 5, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('date_creation')->useCurrent();
            
            $table->index('chauffeur_user_id', 'idx_perfchauf_chauffeur');
            $table->index(['date_debut_periode', 'date_fin_periode'], 'idx_perfchauf_periode');
            
            $table->foreign('chauffeur_user_id', 'fk_perfchauf_chauffeur')
                  ->references('id')->on('utilisateurs')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performances_chauffeurs');
    }
};