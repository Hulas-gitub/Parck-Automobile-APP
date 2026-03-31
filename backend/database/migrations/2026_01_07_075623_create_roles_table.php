<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->increments('id');
            $table->string('code', 50)->unique()->comment('admin, chef_parc, chef_tf, agent_pc_radio, mecanicien, chauffeur');
            $table->string('libelle', 100);
            $table->text('description')->nullable();
            $table->boolean('est_supprime')->default(false);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('date_suppression')->nullable();
            
            // Index
            $table->index('est_supprime', 'idx_roles_actifs');
        });

        // Insérer les rôles par défaut
        DB::table('roles')->insert([
            [
                'code' => 'admin',
                'libelle' => 'Super Administrateur',
                'description' => 'Accès complet système',
                'est_supprime' => false,
            ],
            [
                'code' => 'chef_parc',
                'libelle' => 'Gestionnaire du Parc',
                'description' => 'Gestion globale parc automobile',
                'est_supprime' => false,
            ],
            [
                'code' => 'chef_tf',
                'libelle' => 'Chef Transport de Fonds',
                'description' => 'Gestion missions TF + chauffeurs TF',
                'est_supprime' => false,
            ],
            [
                'code' => 'agent_pc_radio',
                'libelle' => 'Agent PC Radio',
                'description' => 'Traçabilité remise/retour clés véhicules',
                'est_supprime' => false,
            ],
            [
                'code' => 'mecanicien',
                'libelle' => 'Mécanicien / Technicien',
                'description' => 'Interventions + Inspections techniques',
                'est_supprime' => false,
            ],
            [
                'code' => 'chauffeur',
                'libelle' => 'Chauffeur',
                'description' => 'Exécution missions + signalement anomalies',
                'est_supprime' => false,
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};