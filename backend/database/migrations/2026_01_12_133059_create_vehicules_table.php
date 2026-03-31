<?php
// Fichier: 2024_01_01_000001_create_vehicules_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicules', function (Blueprint $table) {
            $table->string('immatriculation', 30)->primary();
            $table->string('numero_chassis', 100)->nullable()->unique()->comment('VIN');
            
            // Relations vers les autres tables (à créer après)
            $table->foreignId('marque_id')->nullable()->constrained('marques')->onDelete('restrict')->onUpdate('cascade');
            $table->foreignId('modele_id')->nullable()->constrained('modeles')->onDelete('restrict')->onUpdate('cascade');
            $table->foreignId('categorie_id')->nullable()->constrained('categories_vehicules')->onDelete('restrict')->onUpdate('cascade');
            $table->foreignId('annee_id')->nullable()->constrained('annees')->onDelete('restrict')->onUpdate('cascade');
            
            // Anciennes colonnes (gardées pour compatibilité)
            $table->string('marque', 100)->nullable();
            $table->string('modele', 100)->nullable();
            $table->string('type_vehicule', 60)->nullable()->comment('4x4, berline, utilitaire');
            
            // Informations du véhicule
            $table->integer('nb_places')->default(5);
            $table->unsignedInteger('direction_id')->nullable();
            
            // Kilométrage
            $table->unsignedBigInteger('kilometrage')->default(0);
            $table->date('date_maj_km')->nullable();
            $table->unsignedBigInteger('km_prochaine_vidange')->nullable();
            $table->unsignedBigInteger('km_prochaine_revision')->nullable();
            
            // Statut
            $table->string('statut', 50)->default('disponible')->comment('disponible, en_mission, en_maintenance, immobilise');
            $table->dateTime('date_immobilisation')->nullable();
            
            // Carburant
            $table->string('type_carburant', 50)->nullable()->comment('diesel, essence, hybride');
            $table->integer('capacite_reservoir')->nullable()->comment('Litres');
            $table->decimal('consommation_moyenne', 10, 2)->nullable()->comment('L/100km');
            
            // Dates importantes
            $table->date('date_acquisition')->nullable();
            $table->date('date_expiration_assurance')->nullable();
            $table->date('date_expiration_visite_technique')->nullable();
            
            // Finances
            $table->decimal('cout_acquisition', 14, 2)->default(0.00);
            $table->decimal('valeur_residuelle', 14, 2)->nullable();
            
            // Autres
            $table->string('photo', 255)->nullable();
            $table->text('notes')->nullable();
            
            // Gestion
            $table->boolean('est_actif')->default(false);
            $table->boolean('est_supprime')->default(false);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('date_suppression')->nullable();
            
            // Index
            $table->index('immatriculation', 'idx_vehicules_immat');
            $table->index('direction_id', 'idx_vehicules_direction');
            $table->index('statut', 'idx_vehicules_statut');
            $table->index(['est_supprime', 'est_actif'], 'idx_vehicules_actifs');
            $table->index('date_maj_km', 'idx_vehicules_date_maj_km');
            $table->index('marque_id', 'idx_vehicules_marque');
            $table->index('modele_id', 'idx_vehicules_modele');
            $table->index('categorie_id', 'idx_vehicules_categorie');
            $table->index('annee_id', 'idx_vehicules_annee');
            
            // Clé étrangère vers directions
            $table->foreign('direction_id', 'fk_vehicules_direction')
                  ->references('id')->on('directions')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicules');
    }
};