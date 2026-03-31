<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('historique_kilometrage', function (Blueprint $table) {
            $table->id();
            $table->string('vehicule_immatriculation', 30);
            $table->unsignedBigInteger('kilometrage');
            $table->date('date_relevee');
            $table->string('source', 50)->default('manuel');
            $table->unsignedBigInteger('source_id')->nullable();
            $table->unsignedBigInteger('enregistre_par_user_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('date_creation')->useCurrent();
            
            $table->index('vehicule_immatriculation', 'idx_histokm_vehicule');
            $table->index('date_relevee', 'idx_histokm_date');
            $table->index(['vehicule_immatriculation', 'date_relevee'], 'idx_histokm_vehicule_date');
            $table->index('enregistre_par_user_id', 'fk_histokm_enregistre_par');
            
            $table->foreign('vehicule_immatriculation', 'fk_histokm_vehicule')
                  ->references('immatriculation')->on('vehicules')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            $table->foreign('enregistre_par_user_id', 'fk_histokm_enregistre_par')
                  ->references('id')->on('utilisateurs')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historique_kilometrage');
    }
};