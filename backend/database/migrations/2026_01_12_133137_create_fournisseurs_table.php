<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fournisseurs', function (Blueprint $table) {
            $table->increments('id');
            $table->string('nom', 200);
            $table->string('contact', 150)->nullable();
            $table->string('telephone', 50)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('type', 100)->nullable()->comment('pieces, carburant, assurance, autre');
            $table->text('adresse')->nullable();
            $table->boolean('est_actif')->default(true);
            $table->boolean('est_supprime')->default(false);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('date_suppression')->nullable();
            
            $table->index(['est_supprime', 'est_actif'], 'idx_fournisseurs_actifs');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fournisseurs');
    }
};