<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alertes_kilometrage', function (Blueprint $table) {
            $table->id();
            $table->string('vehicule_immatriculation', 30);
            $table->string('type_alerte', 100);
            $table->unsignedBigInteger('seuil_km');
            $table->unsignedBigInteger('km_actuel');
            $table->boolean('est_notifie')->default(false);
            $table->timestamp('date_notification')->nullable();
            $table->boolean('est_resolue')->default(false);
            $table->timestamp('date_resolution')->nullable();
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            
            $table->index('vehicule_immatriculation', 'idx_alertkm_vehicule');
            $table->index('type_alerte', 'idx_alertkm_type');
            $table->index('est_resolue', 'idx_alertkm_resolue');
            
            $table->foreign('vehicule_immatriculation', 'fk_alertkm_vehicule')
                  ->references('immatriculation')->on('vehicules')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
        });
        
        // Ajout de la colonne virtuelle km_restants après la création de la table
        DB::statement('ALTER TABLE alertes_kilometrage ADD km_restants INT GENERATED ALWAYS AS (seuil_km - km_actuel) VIRTUAL');
    }

    public function down(): void
    {
        Schema::dropIfExists('alertes_kilometrage');
    }
};