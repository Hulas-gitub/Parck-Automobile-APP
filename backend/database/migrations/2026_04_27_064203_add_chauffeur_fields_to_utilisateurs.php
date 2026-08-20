<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('utilisateurs', function (Blueprint $table) {
            // Date d'embauche du chauffeur
            $table->date('date_embauche')->nullable()->after('direction_id');

            // Catégories du permis de conduire (ex: "B, C, E")
            // Stocké ici en complément de documents_chauffeurs
            // pour un accès rapide sans jointure sur les documents
            $table->string('categories_permis', 50)->nullable()->after('date_embauche');
        });
    }

    public function down(): void
    {
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->dropColumn(['date_embauche', 'categories_permis']);
        });
    }
};