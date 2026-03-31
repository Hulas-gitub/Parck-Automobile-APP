<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('anomalies_pc_radio', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pc_radio_id');
            $table->string('vehicule_immatriculation', 30);
            $table->unsignedBigInteger('chauffeur_user_id')->nullable();
            $table->string('type_degat', 100)->nullable();
            $table->string('partie_vehicule', 100)->nullable();
            $table->text('description');
            $table->json('photos')->nullable();
            $table->string('severite', 30)->default('moyenne')->comment('faible, moyenne, haute, critique');
            $table->dateTime('date_detection')->useCurrent();
            $table->string('statut', 50)->default('signale')->comment('signale, en_cours, resolu, cloture');
            $table->text('notes')->nullable();
            $table->boolean('est_supprime')->default(false);
            $table->timestamps(); // Crée created_at et updated_at automatiquement
            $table->timestamp('date_suppression')->nullable();
            
            // Index uniquement sur les colonnes SANS foreign keys
            $table->index('statut', 'idx_anom_pcradio_statut');
            $table->index('est_supprime', 'idx_anom_pcradio_actives');
            $table->index('severite', 'idx_anom_pcradio_severite');
            $table->index('date_detection', 'idx_anom_pcradio_date');
            
            // Foreign keys (créent automatiquement leurs propres index)
            $table->foreign('pc_radio_id', 'fk_anom_pcradio_pc')
                  ->references('id')->on('pc_radio')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            $table->foreign('vehicule_immatriculation', 'fk_anom_pcradio_vehicule')
                  ->references('immatriculation')->on('vehicules')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            $table->foreign('chauffeur_user_id', 'fk_anom_pcradio_chauffeur')
                  ->references('id')->on('utilisateurs')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('anomalies_pc_radio');
    }
};