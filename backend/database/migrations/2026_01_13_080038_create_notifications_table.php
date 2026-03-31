<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('categorie_id');
            $table->string('titre', 200);
            $table->text('message');
            $table->string('vehicule_immatriculation', 30)->nullable();
            $table->json('donnees')->nullable();
            $table->string('lien_url', 255)->nullable();
            $table->timestamp('date_creation')->useCurrent();
            
            $table->index('categorie_id', 'idx_notif_categorie');
            $table->index('vehicule_immatriculation', 'idx_notif_vehicule');
            $table->index('date_creation', 'idx_notif_date');
            
            $table->foreign('categorie_id', 'fk_notifications_categorie')
                  ->references('id')->on('categories_notifications')
                  ->onDelete('no action')
                  ->onUpdate('cascade');
            
            $table->foreign('vehicule_immatriculation', 'fk_notifications_vehicule')
                  ->references('immatriculation')->on('vehicules')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};