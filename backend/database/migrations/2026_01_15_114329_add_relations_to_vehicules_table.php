<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicules', function (Blueprint $table) {
            // Ajout des 4 colonnes
            $table->foreignId('marque_id')->nullable()->after('numero_chassis')
                  ->constrained('marques')->onDelete('restrict')->onUpdate('cascade');
            
            $table->foreignId('modele_id')->nullable()->after('marque_id')
                  ->constrained('modeles')->onDelete('restrict')->onUpdate('cascade');
            
            $table->foreignId('categorie_id')->nullable()->after('modele_id')
                  ->constrained('categories_vehicules')->onDelete('restrict')->onUpdate('cascade');
            
            $table->foreignId('annee_id')->nullable()->after('categorie_id')
                  ->constrained('annees')->onDelete('restrict')->onUpdate('cascade');
            
            // Index
            $table->index('marque_id', 'idx_vehicules_marque');
            $table->index('modele_id', 'idx_vehicules_modele');
            $table->index('categorie_id', 'idx_vehicules_categorie');
            $table->index('annee_id', 'idx_vehicules_annee');
        });
    }

    public function down(): void
    {
        Schema::table('vehicules', function (Blueprint $table) {
            $table->dropIndex('idx_vehicules_marque');
            $table->dropIndex('idx_vehicules_modele');
            $table->dropIndex('idx_vehicules_categorie');
            $table->dropIndex('idx_vehicules_annee');
            
            $table->dropForeign(['marque_id']);
            $table->dropForeign(['modele_id']);
            $table->dropForeign(['categorie_id']);
            $table->dropForeign(['annee_id']);
            
            $table->dropColumn(['marque_id', 'modele_id', 'categorie_id', 'annee_id']);
        });
    }
};
