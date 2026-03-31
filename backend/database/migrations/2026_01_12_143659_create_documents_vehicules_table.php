<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents_vehicules', function (Blueprint $table) {
            $table->id();
            $table->string('vehicule_immatriculation', 30);
            $table->string('type_document', 100);
            $table->string('nom_document', 255);
            $table->string('chemin_fichier', 255);
            $table->string('compagnie_assurance', 200)->nullable();
            $table->string('numero_contrat', 100)->nullable();
            $table->string('type_couverture', 100)->nullable();
            $table->decimal('montant_prime', 14, 2)->nullable();
            $table->date('date_emission')->nullable();
            $table->date('date_expiration')->nullable();
            $table->unsignedBigInteger('telecharge_par_user_id')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('est_supprime')->default(false);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('date_suppression')->nullable();
            
            $table->index('vehicule_immatriculation', 'idx_docveh_vehicule');
            $table->index('type_document', 'idx_docveh_type');
            $table->index('date_expiration', 'idx_docveh_expiration');
            $table->index('est_supprime', 'idx_docveh_actifs');
            $table->index('telecharge_par_user_id', 'fk_docveh_telecharge_par');
            
            $table->foreign('vehicule_immatriculation', 'fk_docveh_vehicule')
                  ->references('immatriculation')->on('vehicules')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            
            $table->foreign('telecharge_par_user_id', 'fk_docveh_telecharge_par')
                  ->references('id')->on('utilisateurs')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents_vehicules');
    }
};