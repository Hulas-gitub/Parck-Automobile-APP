<?php

use Illuminate\Support\Facades\Route;
use Carbon\Carbon;

Route::get('/', function () {
    return view('welcome');
});

// ============================================================
// PREVIEW EMAIL — Document Véhicule
// Accessible sur : GET /emails/document-vehicule?statut=expire
// Paramètre GET optionnel : statut=expire | expire_bientot
// ============================================================
Route::get('/emails/document-vehicule', function () {

    $statut = request('statut', 'expire_bientot'); // expire | expire_bientot

    // ── Données fictives de prévisualisation ──────────────────
    $joursRestants = $statut === 'expire' ? -15 : 12;

    $data = [

        // ── Infos globales ──
        'appName'   => 'SGS Fleetify',
        'appUrl'    => 'http://localhost:8000',
        'annee'     => now()->year,
        'statut'    => $statut,

        // ── Destinataire ──
        'destinataire' => [
            'nom'          => 'Hulas Djyembi',
            'role_libelle' => 'Gestionnaire du Parc',
            'email'        => 'hulas.djyembi@sgs-gabon.com',
        ],

        // ── Véhicule ──
        'vehicule' => [
            'immatriculation' => 'AB-1234-GA',
            'marque'          => 'Toyota',
            'modele'          => 'Land Cruiser',
            'categorie'       => '4x4',
            'direction'       => 'Direction Générale',
            'statut'          => 'Disponible',
        ],

        // ── Document ──
        'document' => [
            'nom_document'       => 'Assurance Tous Risques',
            'type_document'      => 'assurance',
            'compagnie_assurance'=> 'OGAR Gabon',
            'numero_contrat'     => 'OG-2024-00789',
            'type_couverture'    => 'Tous risques',
            'montant_prime'      => 1250000,
            'date_emission'      => now()->subYear()->format('Y-m-d'),
            'date_expiration'    => Carbon::now()->addDays($joursRestants)->format('Y-m-d'),
        ],

        // ── Compteur jours ──
        'joursRestants' => $joursRestants,
    ];

    return view('emails.document-vehicule', $data);
});