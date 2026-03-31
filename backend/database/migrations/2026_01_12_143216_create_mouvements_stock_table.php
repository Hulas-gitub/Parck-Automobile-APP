<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mouvements_stock', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('piece_id');
            $table->string('type_mouvement', 50)->comment('entree, sortie, ajustement, retour');
            $table->decimal('quantite', 12, 2);
            $table->decimal('prix_unitaire', 12, 2)->nullable();
            $table->string('type_reference', 100)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->unsignedBigInteger('effectue_par_user_id')->nullable();
            $table->unsignedInteger('fournisseur_id')->nullable();
            $table->text('notes')->nullable();
            $table->string('chemin_document', 255)->nullable();
            $table->timestamp('date_creation')->useCurrent();
            
            $table->index('piece_id', 'idx_mouvstock_piece');
            $table->index('date_creation', 'idx_mouvstock_date');
            $table->index('type_mouvement', 'idx_mouvstock_type');
            $table->index(['piece_id', 'date_creation'], 'idx_mouvstock_piece_date');
            $table->index('effectue_par_user_id', 'fk_mouvstock_effectue_par');
            $table->index('fournisseur_id', 'fk_mouvstock_fournisseur');
            
            $table->foreign('piece_id', 'fk_mouvstock_piece')
                  ->references('id')->on('pieces_detachees')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            $table->foreign('effectue_par_user_id', 'fk_mouvstock_effectue_par')
                  ->references('id')->on('utilisateurs')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
            
            $table->foreign('fournisseur_id', 'fk_mouvstock_fournisseur')
                  ->references('id')->on('fournisseurs')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mouvements_stock');
    }
};