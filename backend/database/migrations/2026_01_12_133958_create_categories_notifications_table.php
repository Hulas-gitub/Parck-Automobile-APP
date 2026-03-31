<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories_notifications', function (Blueprint $table) {
            $table->increments('id');
            $table->string('code', 100)->unique()->comment('alerte_critique_email, alerte_importante, info_in_app');
            $table->string('libelle', 200);
            $table->string('niveau_priorite', 30)->default('normal')->comment('critique, important, a_surveiller, normal');
            $table->json('canaux')->comment('["email", "popup", "in_app"]');
            $table->json('roles_cibles')->nullable()->comment('["chef_parc", "chef_tf"]');
            $table->text('description')->nullable();
            $table->boolean('est_actif')->default(true);
            $table->boolean('est_supprime')->default(false);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('date_suppression')->nullable();
            
            $table->index('code', 'idx_catnotif_code');
            $table->index('niveau_priorite', 'idx_catnotif_priorite');
            $table->index(['est_supprime', 'est_actif'], 'idx_catnotif_actives');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories_notifications');
    }
};