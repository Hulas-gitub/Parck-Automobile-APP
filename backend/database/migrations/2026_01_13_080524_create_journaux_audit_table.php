<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journaux_audit', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('action', 100);
            $table->string('nom_table', 100)->nullable();
            $table->string('id_enregistrement', 100)->nullable();
            $table->json('anciennes_valeurs')->nullable();
            $table->json('nouvelles_valeurs')->nullable();
            $table->string('adresse_ip', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('date_creation')->useCurrent();
            
            $table->index('user_id', 'idx_audit_user');
            $table->index(['nom_table', 'id_enregistrement'], 'idx_audit_table');
            $table->index('action', 'idx_audit_action');
            $table->index('date_creation', 'idx_audit_date');
            
            $table->foreign('user_id', 'fk_audit_user')
                  ->references('id')->on('utilisateurs')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journaux_audit');
    }
};