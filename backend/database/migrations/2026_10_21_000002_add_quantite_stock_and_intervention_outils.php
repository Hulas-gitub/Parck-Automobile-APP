<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Ajouter quantite_stock dans la table outils si absente
        if (Schema::hasTable('outils') && !Schema::hasColumn('outils', 'quantite_stock')) {
            Schema::table('outils', function (Blueprint $table) {
                $table->integer('quantite_stock')->default(10)->after('emplacement')
                      ->comment('Quantité disponible en stock dans l\'atelier');
            });
        }

        // 2. Ajouter quantite dans la table outils_intervention si absente
        if (Schema::hasTable('outils_intervention') && !Schema::hasColumn('outils_intervention', 'quantite')) {
            Schema::table('outils_intervention', function (Blueprint $table) {
                $table->integer('quantite')->default(1)->after('outil_id')
                      ->comment('Quantité de cet outil utilisée lors de l\'intervention');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('outils') && Schema::hasColumn('outils', 'quantite_stock')) {
            Schema::table('outils', function (Blueprint $table) {
                $table->dropColumn('quantite_stock');
            });
        }

        if (Schema::hasTable('outils_intervention') && Schema::hasColumn('outils_intervention', 'quantite')) {
            Schema::table('outils_intervention', function (Blueprint $table) {
                $table->dropColumn('quantite');
            });
        }
    }
};
