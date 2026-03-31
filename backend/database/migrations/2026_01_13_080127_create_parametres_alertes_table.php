<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parametres_alertes', function (Blueprint $table) {
            $table->increments('id');
            $table->string('type_alerte', 100);
            $table->string('condition_declenchement', 255);
            $table->integer('valeur_seuil')->nullable();
            $table->unsignedInteger('categorie_notification_id')->nullable();
            $table->text('message_template')->nullable();
            $table->boolean('est_actif')->default(true);
            $table->boolean('est_supprime')->default(false);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('date_suppression')->nullable();
            
            $table->index('type_alerte', 'idx_paramalert_type');
            $table->index(['est_supprime', 'est_actif'], 'idx_paramalert_actives');
            $table->index('categorie_notification_id', 'fk_paramalert_categorie');
            
            $table->foreign('categorie_notification_id', 'fk_paramalert_categorie')
                  ->references('id')->on('categories_notifications')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parametres_alertes');
    }
};