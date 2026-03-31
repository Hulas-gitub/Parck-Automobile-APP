<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Utilisateur;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Créer un rôle admin si il n'existe pas
        $adminRole = Role::firstOrCreate(
            ['code' => 'admin'],
            [
                'libelle' => 'Administrateur',
                'description' => 'Accès complet système'
            ]
        );

        // Créer un utilisateur admin de test
        Utilisateur::firstOrCreate(
            ['email' => 'admin@fleetify.com'],
            [
                'nom' => 'Hulas Djyembi',
                'mot_de_passe' => 'password123', // Sera hashé automatiquement
                'role_id' => $adminRole->id,
                'est_actif' => true,
            ]
        );

        echo "✅ Utilisateur créé:\n";
        echo "Email: admin@fleetify.com\n";
        echo "Mot de passe: password123\n";
    }
}