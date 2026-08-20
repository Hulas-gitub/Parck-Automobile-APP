<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accessoires', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 150);
            $table->string('categorie', 100);
            $table->boolean('est_actif')->default(true);
            $table->timestamps();
        });

        $now = now();
        $items = [
            // Documents
            ['nom' => 'VISITE TECHNIQUE',               'categorie' => 'Documents'],
            ['nom' => 'CARTE GRISE',                    'categorie' => 'Documents'],
            ['nom' => 'ATTESTATION ASSURANCE',          'categorie' => 'Documents'],
            // Sécurité
            ['nom' => 'GILET DE SECURITE',              'categorie' => 'Sécurité'],
            ['nom' => 'EXTINCTEUR + CARTE',             'categorie' => 'Sécurité'],
            ['nom' => 'TROUSSE DE SECOURS',             'categorie' => 'Sécurité'],
            ['nom' => 'TRIANGLE x2',                    'categorie' => 'Sécurité'],
            ['nom' => 'CEINTURES DE SECURITE',          'categorie' => 'Sécurité'],
            // Équipements
            ['nom' => 'AUTO RADIO',                     'categorie' => 'Équipements'],
            ['nom' => 'CLIMATISATION',                  'categorie' => 'Équipements'],
            ['nom' => 'RETROVISEURS',                   'categorie' => 'Équipements'],
            ['nom' => 'BALAIS ESSUIE GLACE',            'categorie' => 'Équipements'],
            ['nom' => 'GARDES BOUE',                    'categorie' => 'Équipements'],
            ['nom' => 'ENJOLIVEURS',                    'categorie' => 'Équipements'],
            ['nom' => 'CALE x2',                        'categorie' => 'Équipements'],
            ['nom' => 'CRIC',                           'categorie' => 'Équipements'],
            ['nom' => 'MANIVELLE',                      'categorie' => 'Équipements'],
            ['nom' => 'ROUE DE SECOURS',                'categorie' => 'Équipements'],
            ['nom' => 'KLAXON',                         'categorie' => 'Équipements'],
            // Éclairage
            ['nom' => 'PHARES',                         'categorie' => 'Éclairage'],
            ['nom' => 'FEUX STOP',                      'categorie' => 'Éclairage'],
            ['nom' => 'CLIGNOTANTS',                    'categorie' => 'Éclairage'],
            ['nom' => 'PLAQUE IMMATRICULATION x2',      'categorie' => 'Éclairage'],
            // Niveaux
            ['nom' => 'NIVEAU LIQUIDE REFROIDISSEMENT', 'categorie' => 'Niveaux'],
            ['nom' => 'NIVEAU HUILE MOTEUR',            'categorie' => 'Niveaux'],
            ['nom' => 'NIVEAU EAU ESSUIES GLACE',       'categorie' => 'Niveaux'],
            ['nom' => 'NIVEAU HUILE FREIN',             'categorie' => 'Niveaux'],
            ['nom' => 'NIVEAU HUILE DIRECTION',         'categorie' => 'Niveaux'],
            ['nom' => 'NIVEAU HUILE PONT',              'categorie' => 'Niveaux'],
            // Mécanique
            ['nom' => 'ETAT PNEUMATIQUES',              'categorie' => 'Mécanique'],
            ['nom' => 'PLAQUETTES / GARNITURES (usure)', 'categorie' => 'Mécanique'],
            ['nom' => 'AMORTISSEURS',                   'categorie' => 'Mécanique'],
            ['nom' => 'PNEUS (usure, pression)',        'categorie' => 'Mécanique'],
            ['nom' => 'EMBRAYAGE',                      'categorie' => 'Mécanique'],
            ['nom' => 'TUYAU ECHAPPEMENT',              'categorie' => 'Mécanique'],
            ['nom' => 'ETAT BIELETTES',                 'categorie' => 'Mécanique'],
            ['nom' => 'ETAT ROTULES',                   'categorie' => 'Mécanique'],
            // État général
            ['nom' => 'ETAT FERMETURES',                'categorie' => 'État général'],
            ['nom' => 'ETAT VITRAGE',                   'categorie' => 'État général'],
            ['nom' => 'ETAT PEINTURE',                  'categorie' => 'État général'],
            ['nom' => 'CARROSSERIE',                    'categorie' => 'État général'],
            ['nom' => 'ETAT INTERIEUR',                 'categorie' => 'État général'],
            ['nom' => 'PROPRETE',                       'categorie' => 'État général'],
        ];

        foreach ($items as &$item) {
            $item['est_actif']  = 1;
            $item['created_at'] = $now;
            $item['updated_at'] = $now;
        }

        DB::table('accessoires')->insert($items);
    }

    public function down(): void
    {
        Schema::dropIfExists('accessoires');
    }
}; 