<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prelevements_pieces', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('intervention_id');
            $table->unsignedBigInteger('piece_id');
            $table->decimal('quantite', 12, 2);
            $table->decimal('prix_unitaire', 12, 2);
            $table->unsignedBigInteger('preleve_par_user_id');
            $table->dateTime('date_prelevement')->useCurrent();
            $table->text('notes')->nullable();
            
            $table->index('intervention_id', 'idx_prelpiec_intervention');
            $table->index('piece_id', 'idx_prelpiec_piece');
            $table->index('preleve_par_user_id', 'idx_prelpiec_preleve_par');
            $table->index('date_prelevement', 'idx_prelpiec_date');
            
            $table->foreign('intervention_id', 'fk_prelpiec_intervention')
                  ->references('id')->on('interventions')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            $table->foreign('piece_id', 'fk_prelpiec_piece')
                  ->references('id')->on('pieces_detachees')
                  ->onDelete('no action')
                  ->onUpdate('cascade');
            
            $table->foreign('preleve_par_user_id', 'fk_prelpiec_preleve_par')
                  ->references('id')->on('utilisateurs')
                  ->onDelete('no action')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prelevements_pieces');
    }
};