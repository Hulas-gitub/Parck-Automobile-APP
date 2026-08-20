<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicules', function (Blueprint $table) {
            $table->string('responsable_du_vehicule', 200)->nullable()->change();
            $table->string('affectation', 300)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('vehicules', function (Blueprint $table) {
            $table->string('responsable_du_vehicule', 200)->nullable(false)->change();
            $table->string('affectation', 300)->nullable(false)->change();
        });
    }
};