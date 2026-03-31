<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pieces_detachees', function (Blueprint $table) {
            $table->id();
            $table->string('sku', 100)->nullable();
            $table->string('nom', 200);
            $table->string('type_piece', 100)->nullable();
            $table->text('description')->nullable();
            $table->decimal('quantite_stock', 12, 2)->default(0.00);
            $table->decimal('seuil_alerte', 12, 2)->default(0.00);
            $table->string('unite', 50)->default('unite');
            $table->decimal('prix_unitaire', 12, 2)->default(0.00);
            $table->unsignedInteger('fournisseur_id')->nullable();
            $table->string('emplacement', 150)->nullable();
            $table->boolean('est_actif')->default(true);
            $table->boolean('est_supprime')->default(false);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('date_suppression')->nullable();
            
            $table->index('nom', 'idx_pieces_nom');
            $table->index('sku', 'idx_pieces_sku');
            $table->index('fournisseur_id', 'idx_pieces_fournisseur');
            $table->index('type_piece', 'idx_pieces_type');
            $table->index(['est_supprime', 'est_actif'], 'idx_pieces_actives');
            $table->index(['quantite_stock', 'seuil_alerte'], 'idx_pieces_stock_alerte');
            
            $table->foreign('fournisseur_id', 'fk_pieces_fournisseur')
                  ->references('id')->on('fournisseurs')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pieces_detachees');
    }
};