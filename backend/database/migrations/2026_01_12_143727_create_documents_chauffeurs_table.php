<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents_chauffeurs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('chauffeur_user_id');
            $table->string('type_document', 100);
            $table->string('nom_document', 255);
            $table->string('chemin_fichier', 255);
            $table->string('numero_permis', 100)->nullable();
            $table->string('categories_permis', 100)->nullable();
            $table->string('pays_delivrance', 100)->nullable();
            $table->date('date_delivrance')->nullable();
            $table->date('date_expiration')->nullable();
            $table->unsignedBigInteger('telecharge_par_user_id')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('est_supprime')->default(false);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('date_suppression')->nullable();
            
            $table->index('chauffeur_user_id', 'idx_docchauf_chauffeur');
            $table->index('type_document', 'idx_docchauf_type');
            $table->index('date_expiration', 'idx_docchauf_expiration');
            $table->index('est_supprime', 'idx_docchauf_actifs');
            $table->index('telecharge_par_user_id', 'fk_docchauf_telecharge_par');
            
            $table->foreign('chauffeur_user_id', 'fk_docchauf_chauffeur')
                  ->references('id')->on('utilisateurs')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            $table->foreign('telecharge_par_user_id', 'fk_docchauf_telecharge_par')
                  ->references('id')->on('utilisateurs')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents_chauffeurs');
    }
};