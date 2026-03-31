<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspections', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('type_inspection_id');
            $table->unsignedBigInteger('inspecteur_user_id')->nullable();
            $table->dateTime('date_inspection');
            $table->string('nom_verificateurs', 255)->nullable();
            $table->text('autres_constats')->nullable();
            $table->text('notes')->nullable();
            $table->string('chemin_rapport_pdf', 255)->nullable();
            $table->boolean('est_supprime')->default(false);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('date_suppression')->nullable();
            
            $table->index('type_inspection_id', 'idx_inspections_type');
            $table->index('inspecteur_user_id', 'idx_inspections_inspecteur');
            $table->index('date_inspection', 'idx_inspections_date');
            $table->index('est_supprime', 'idx_inspections_actives');
            
            $table->foreign('type_inspection_id', 'fk_inspections_type')
                  ->references('id')->on('types_inspection')
                  ->onDelete('no action')
                  ->onUpdate('cascade');
            
            $table->foreign('inspecteur_user_id', 'fk_inspections_inspecteur')
                  ->references('id')->on('utilisateurs')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspections');
    }
};