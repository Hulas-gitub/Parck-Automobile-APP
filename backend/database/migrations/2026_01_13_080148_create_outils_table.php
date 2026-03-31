<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('outils', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 200);
            $table->string('type', 100)->nullable();
            $table->string('categorie', 100)->nullable();
            $table->string('etat', 50)->default('OK');
            $table->string('emplacement', 150)->nullable();
            $table->date('date_dernier_controle')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('est_supprime')->default(false);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('date_suppression')->nullable();
            
            $table->index('etat', 'idx_outils_etat');
            $table->index('categorie', 'idx_outils_categorie');
            $table->index('est_supprime', 'idx_outils_actifs');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('outils');
    }
};