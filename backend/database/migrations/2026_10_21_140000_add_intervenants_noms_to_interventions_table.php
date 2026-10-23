<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Traçabilité des intervenants saisis librement (noms concaténés).
 * L'id principal reste dans interventions.intervenant_id.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('interventions', 'intervenants_noms')) {
            Schema::table('interventions', function (Blueprint $table) {
                $table->text('intervenants_noms')->nullable()->after('intervenant_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('interventions', 'intervenants_noms')) {
            Schema::table('interventions', function (Blueprint $table) {
                $table->dropColumn('intervenants_noms');
            });
        }
    }
};
