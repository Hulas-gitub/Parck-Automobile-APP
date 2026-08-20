<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Supprimer l'ancienne table
        Schema::drop('parametres_systeme');

        // Recréer proprement
        Schema::create('parametres_systeme', function (Blueprint $table) {
            $table->id();
            $table->string('valeur', 100)->comment('Nom du thème actif ex: orange, blue, green...');
            $table->string('couleur', 20)->comment('Couleur hex principale ex: #ffc400');
            $table->unsignedBigInteger('modifie_par_user_id')->nullable();
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('modifie_par_user_id')
                  ->references('id')
                  ->on('utilisateurs')
                  ->nullOnDelete();
        });

        // Insérer le thème par défaut
        DB::table('parametres_systeme')->insert([
            'valeur'              => 'orange',
            'couleur'             => '#ffc400',
            'modifie_par_user_id' => null,
            'date_creation'       => now(),
            'date_modification'   => now(),
        ]);
    }

    public function down(): void
    {
        Schema::drop('parametres_systeme');
    }
};