<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('parametres_systeme', function (Blueprint $table) {
            $table->increments('id');
            $table->string('cle', 100)->unique()->comment('theme_primary_color, theme_secondary_color, etc.');
            $table->text('valeur');
            $table->string('type', 50)->default('string')->comment('string, json, boolean, number');
            $table->string('categorie', 50)->default('theme')->comment('theme, general, notification');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('modifie_par_user_id')->nullable();
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            
            // Index
            $table->index('cle', 'idx_param_cle');
            $table->index('categorie', 'idx_param_categorie');
            
            // Foreign key
            $table->foreign('modifie_par_user_id', 'fk_param_modifie_par')
                  ->references('id')
                  ->on('utilisateurs')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });

        // Insérer les paramètres de thème par défaut
        DB::table('parametres_systeme')->insert([
            [
                'cle' => 'theme_primary_color',
                'valeur' => '#3B82F6',
                'type' => 'string',
                'categorie' => 'theme',
                'description' => 'Couleur principale du thème',
                'date_creation' => now(),
                'date_modification' => now(),
            ],
            [
                'cle' => 'theme_secondary_color',
                'valeur' => '#10B981',
                'type' => 'string',
                'categorie' => 'theme',
                'description' => 'Couleur secondaire du thème',
                'date_creation' => now(),
                'date_modification' => now(),
            ],
            [
                'cle' => 'theme_accent_color',
                'valeur' => '#F59E0B',
                'type' => 'string',
                'categorie' => 'theme',
                'description' => 'Couleur d\'accentuation',
                'date_creation' => now(),
                'date_modification' => now(),
            ],
            [
                'cle' => 'theme_danger_color',
                'valeur' => '#EF4444',
                'type' => 'string',
                'categorie' => 'theme',
                'description' => 'Couleur pour les éléments de danger/erreur',
                'date_creation' => now(),
                'date_modification' => now(),
            ],
            [
                'cle' => 'theme_warning_color',
                'valeur' => '#F59E0B',
                'type' => 'string',
                'categorie' => 'theme',
                'description' => 'Couleur pour les avertissements',
                'date_creation' => now(),
                'date_modification' => now(),
            ],
            [
                'cle' => 'theme_success_color',
                'valeur' => '#10B981',
                'type' => 'string',
                'categorie' => 'theme',
                'description' => 'Couleur pour les succès',
                'date_creation' => now(),
                'date_modification' => now(),
            ],
            [
                'cle' => 'theme_info_color',
                'valeur' => '#3B82F6',
                'type' => 'string',
                'categorie' => 'theme',
                'description' => 'Couleur pour les informations',
                'date_creation' => now(),
                'date_modification' => now(),
            ],
            [
                'cle' => 'theme_sidebar_bg',
                'valeur' => '#1F2937',
                'type' => 'string',
                'categorie' => 'theme',
                'description' => 'Couleur de fond de la sidebar',
                'date_creation' => now(),
                'date_modification' => now(),
            ],
            [
                'cle' => 'theme_header_bg',
                'valeur' => '#FFFFFF',
                'type' => 'string',
                'categorie' => 'theme',
                'description' => 'Couleur de fond du header',
                'date_creation' => now(),
                'date_modification' => now(),
            ],
            [
                'cle' => 'theme_card_border',
                'valeur' => '#E5E7EB',
                'type' => 'string',
                'categorie' => 'theme',
                'description' => 'Couleur des bordures des cartes',
                'date_creation' => now(),
                'date_modification' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parametres_systeme');
    }
};