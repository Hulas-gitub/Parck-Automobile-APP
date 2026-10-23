<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  // php artisan make:migration modify_prestataire_columns_in_interventions_table

public function up(): void
{
    Schema::table('interventions', function (Blueprint $table) {
        $table->decimal('montant_pieces_prestataire', 12, 2)->default(0)->change();
        $table->decimal('montant_main_oeuvre_prestataire', 12, 2)->default(0)->change();
    });
}

public function down(): void
{
    Schema::table('interventions', function (Blueprint $table) {
        $table->decimal('montant_pieces_prestataire', 12, 2)->default(null)->change();
        $table->decimal('montant_main_oeuvre_prestataire', 12, 2)->default(null)->change();
    });
}
};
