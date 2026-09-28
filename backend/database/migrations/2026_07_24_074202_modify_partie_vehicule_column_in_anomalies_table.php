<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('anomalies', function (Blueprint $table) {
            $table->text('partie_vehicule')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('anomalies', function (Blueprint $table) {
            $table->string('partie_vehicule', 100)->nullable()->change();
        });
    }
};