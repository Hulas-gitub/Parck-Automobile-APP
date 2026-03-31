<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('envois_notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('notification_id');
            $table->unsignedBigInteger('user_id');
            $table->string('canal', 50);
            $table->string('statut_envoi', 50)->default('en_attente');
            $table->timestamp('date_envoi')->nullable();
            $table->timestamp('date_lecture')->nullable();
            $table->boolean('est_lu')->default(false);
            $table->text('erreur')->nullable();
            $table->json('metadata_envoi')->nullable();
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            
            $table->index('notification_id', 'idx_envoi_notification');
            $table->index('user_id', 'idx_envoi_user');
            $table->index('canal', 'idx_envoi_canal');
            $table->index('statut_envoi', 'idx_envoi_statut');
            $table->index(['user_id', 'canal', 'est_lu'], 'idx_envoi_user_canal_lu');
            $table->index('date_creation', 'idx_envoi_date');
            
            $table->foreign('notification_id', 'fk_envoi_notification')
                  ->references('id')->on('notifications')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            $table->foreign('user_id', 'fk_envoi_user')
                  ->references('id')->on('utilisateurs')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('envois_notifications');
    }
};