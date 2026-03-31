<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('intervenants', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('type_intervenant_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('nom_externe', 200)->nullable();
            $table->string('telephone', 50)->nullable();
            $table->string('email', 150)->nullable();
            $table->boolean('est_externe')->default(false);
            $table->decimal('tarif_horaire', 12, 2)->default(0.00);
            $table->text('specialisation')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('est_actif')->default(true);
            $table->boolean('est_supprime')->default(false);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('date_suppression')->nullable();
            
            $table->index('type_intervenant_id', 'idx_intervenants_type');
            $table->index('user_id', 'idx_intervenants_user');
            $table->index(['est_supprime', 'est_actif'], 'idx_intervenants_actifs');
            
            $table->foreign('type_intervenant_id', 'fk_intervenants_type')
                  ->references('id')->on('types_intervenant')
                  ->onDelete('no action')
                  ->onUpdate('cascade');
            
            $table->foreign('user_id', 'fk_intervenants_user')
                  ->references('id')->on('utilisateurs')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('intervenants');
    }
};