<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute la colonne date_changement_mdp sur la table utilisateurs.
     *
     * Utilisée par ProfileController pour calculer l'expiration du mot
     * de passe à 6 mois.
     *
     * - NULL  → mot de passe jamais changé, on prend date_creation
     *           comme point de départ pour le calcul des 6 mois.
     * - Valeur → date du dernier changement effectif.
     */
    public function up(): void
    {
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->timestamp('date_changement_mdp')
                  ->nullable()
                  ->after('mot_de_passe')
                  ->comment('Date du dernier changement de mot de passe. NULL = jamais changé.');
        });
    }

    public function down(): void
    {
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->dropColumn('date_changement_mdp');
        });
    }
};