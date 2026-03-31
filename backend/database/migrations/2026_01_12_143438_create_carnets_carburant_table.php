<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('carnets_carburant', function (Blueprint $table) {
            $table->id();
            $table->string('vehicule_immatriculation', 30);
            $table->unsignedBigInteger('mission_id')->nullable();
            $table->date('date_plein');
            $table->unsignedBigInteger('kilometrage')->nullable();
            $table->decimal('litres', 12, 2);
            $table->decimal('prix_unitaire', 12, 4)->nullable();
            $table->string('station', 200)->nullable();
            $table->string('chemin_recu', 255)->nullable();
            $table->unsignedBigInteger('km_depuis_dernier_plein')->nullable();
            $table->decimal('consommation_calculee', 10, 2)->nullable();
            $table->text('notes')->nullable();
            $table->boolean('est_supprime')->default(false);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_suppression')->nullable();
            
            $table->index('vehicule_immatriculation', 'idx_carburant_vehicule');
            $table->index('date_plein', 'idx_carburant_date');
            $table->index('mission_id', 'idx_carburant_mission');
            $table->index('est_supprime', 'idx_carburant_actifs');
            
            $table->foreign('vehicule_immatriculation', 'fk_carburant_vehicule')
                  ->references('immatriculation')->on('vehicules')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            $table->foreign('mission_id', 'fk_carburant_mission')
                  ->references('id')->on('missions')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('carnets_carburant');
    }
};