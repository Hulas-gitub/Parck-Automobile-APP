<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('utilisateurs', function (Blueprint $table) {
            $table->id();

            $table->string('nom', 100);
            $table->string('email', 100)->unique();
            $table->string('mot_de_passe', 255);

            $table->unsignedInteger('role_id');
            $table->unsignedInteger('direction_id')->nullable();

            $table->boolean('est_actif')->default(true);
            $table->boolean('est_supprime')->default(false);

            $table->timestamp('derniere_connexion')->nullable();
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('date_suppression')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Index
            |--------------------------------------------------------------------------
            */
            $table->index('role_id', 'idx_utilisateurs_role');
            $table->index('direction_id', 'idx_utilisateurs_direction');
            $table->index('email', 'idx_utilisateurs_email');
            $table->index(['est_supprime', 'est_actif'], 'idx_utilisateurs_actifs');

            /*
            |--------------------------------------------------------------------------
            | Foreign Keys
            |--------------------------------------------------------------------------
            */
            $table->foreign('role_id', 'fk_utilisateurs_role')
                  ->references('id')
                  ->on('roles')
                  ->onUpdate('cascade')
                  ->onDelete('no action');

            $table->foreign('direction_id', 'fk_utilisateurs_direction')
                  ->references('id')
                  ->on('directions')
                  ->onUpdate('cascade')
                  ->onDelete('set null'); // logique car nullable
        });

        /*
        |--------------------------------------------------------------------------
        | Utilisateur admin par défaut
        |--------------------------------------------------------------------------
        */
        DB::table('utilisateurs')->insert([
            'nom' => 'Hulas Djyembi',
            'email' => 'admin@fleetify.com',
            'mot_de_passe' => Hash::make('password123'),
            'role_id' => 1,
            'direction_id' => 1, null,
            'est_actif' => true,
            'est_supprime' => false,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('utilisateurs');
    }
};
