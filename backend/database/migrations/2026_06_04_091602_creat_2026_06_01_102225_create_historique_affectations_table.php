<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Table : historique_affectations
     *
     * Trace l'historique des emprunts/nouvelles affectations d'un véhicule
     * entre directions. Un véhicule appartient à une direction de base
     * (direction_origine_id) et peut être temporairement affecté à une
     * autre direction (direction_emprunt_id) pour une période donnée.
     */
    public function up(): void
    {
        Schema::create('historique_affectations', function (Blueprint $table) {

            $table->id();

            // ── VÉHICULE CONCERNÉ ──────────────────────────────────────────
            $table->string('vehicule_immatriculation', 30)
                  ->comment('Immatriculation du véhicule emprunté');

            // ── SITUATION D'ORIGINE (ce qui existait avant l'emprunt) ──────
            $table->unsignedInteger('direction_origine_id')
                  ->comment('Direction propriétaire / de base du véhicule');

            $table->unsignedBigInteger('affectation_origine_id')
                  ->nullable()
                  ->comment('Affectation de base du véhicule avant l\'emprunt (FK affectations.id)');

            // Snapshot texte au moment de l'enregistrement
            // (au cas où la direction ou l'affectation serait renommée plus tard)
            $table->string('direction_origine_nom', 150)
                  ->comment('Nom de la direction d\'origine au moment de l\'enregistrement');

            $table->string('affectation_origine_nom', 150)
                  ->nullable()
                  ->comment('Nom de l\'affectation d\'origine au moment de l\'enregistrement');

            // ── NOUVELLE AFFECTATION / EMPRUNT ─────────────────────────────
            $table->unsignedInteger('direction_emprunt_id')
                  ->comment('Direction qui emprunte le véhicule');

            $table->unsignedBigInteger('affectation_emprunt_id')
                  ->nullable()
                  ->comment('Nouvelle affectation pendant l\'emprunt (FK affectations.id), optionnelle');

            // Snapshot texte
            $table->string('direction_emprunt_nom', 150)
                  ->comment('Nom de la direction d\'emprunt au moment de l\'enregistrement');

            $table->string('affectation_emprunt_nom', 150)
                  ->nullable()
                  ->comment('Nom de la nouvelle affectation pendant l\'emprunt');

            // ── PÉRIODE D'EMPRUNT ──────────────────────────────────────────
            $table->dateTime('date_debut')
                  ->comment('Date et heure de début de l\'emprunt');

            $table->dateTime('date_fin_prevue')
                  ->nullable()
                  ->comment('Date et heure de fin prévue de l\'emprunt');

            $table->dateTime('date_fin_reelle')
                  ->nullable()
                  ->comment('Date et heure de fin réelle (renseignée au retour du véhicule)');

            // Durée calculée en minutes (peut être NULL si l'emprunt est en cours)
            $table->unsignedInteger('duree_emprunt_minutes')
                  ->nullable()
                  ->comment('Durée réelle de l\'emprunt en minutes (calculée à la clôture)');

            // ── ACTEURS ────────────────────────────────────────────────────
            $table->unsignedBigInteger('demande_par_user_id')
                  ->nullable()
                  ->comment('Utilisateur qui a fait la demande d\'emprunt');

            $table->unsignedBigInteger('valide_par_user_id')
                  ->nullable()
                  ->comment('Utilisateur qui a validé / autorisé l\'emprunt');

            $table->unsignedBigInteger('cloture_par_user_id')
                  ->nullable()
                  ->comment('Utilisateur qui a clôturé (retour du véhicule)');

            // ── STATUT ET MOTIF ────────────────────────────────────────────
            $table->string('statut', 50)
                  ->default('en_cours')
                  ->comment('en_cours | termine | annule');

            $table->string('motif', 255)
                  ->nullable()
                  ->comment('Motif de l\'emprunt / raison de la nouvelle affectation');

            $table->text('notes')
                  ->nullable()
                  ->comment('Observations, remarques libres');

            // ── KILOMÉTRAGE (optionnel, pour traçabilité) ──────────────────
            $table->unsignedBigInteger('km_depart')
                  ->nullable()
                  ->comment('Kilométrage du véhicule au départ de l\'emprunt');

            $table->unsignedBigInteger('km_retour')
                  ->nullable()
                  ->comment('Kilométrage du véhicule au retour');

            // ── SOFT DELETE & TIMESTAMPS ───────────────────────────────────
            $table->boolean('est_supprime')->default(false);
            $table->timestamp('date_suppression')->nullable();
            $table->timestamps(); // created_at + updated_at

            // ══════════════════════════════════════════════════════════════
            // CLÉS ÉTRANGÈRES
            // ══════════════════════════════════════════════════════════════
            $table->foreign('vehicule_immatriculation')
                  ->references('immatriculation')
                  ->on('vehicules')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');

            $table->foreign('direction_origine_id')
                  ->references('id')
                  ->on('directions')
                  ->onDelete('restrict')
                  ->onUpdate('cascade');

            $table->foreign('direction_emprunt_id')
                  ->references('id')
                  ->on('directions')
                  ->onDelete('restrict')
                  ->onUpdate('cascade');

            $table->foreign('affectation_origine_id')
                  ->references('id')
                  ->on('affectations')
                  ->onDelete('set null')
                  ->onUpdate('cascade');

            $table->foreign('affectation_emprunt_id')
                  ->references('id')
                  ->on('affectations')
                  ->onDelete('set null')
                  ->onUpdate('cascade');

            $table->foreign('demande_par_user_id')
                  ->references('id')
                  ->on('utilisateurs')
                  ->onDelete('set null')
                  ->onUpdate('cascade');

            $table->foreign('valide_par_user_id')
                  ->references('id')
                  ->on('utilisateurs')
                  ->onDelete('set null')
                  ->onUpdate('cascade');

            $table->foreign('cloture_par_user_id')
                  ->references('id')
                  ->on('utilisateurs')
                  ->onDelete('set null')
                  ->onUpdate('cascade');

            // ══════════════════════════════════════════════════════════════
            // INDEX
            // ══════════════════════════════════════════════════════════════
            $table->index('vehicule_immatriculation',  'idx_histaffect_vehicule');
            $table->index('direction_origine_id',      'idx_histaffect_dir_origine');
            $table->index('direction_emprunt_id',      'idx_histaffect_dir_emprunt');
            $table->index('statut',                    'idx_histaffect_statut');
            $table->index('date_debut',                'idx_histaffect_date_debut');
            $table->index('est_supprime',              'idx_histaffect_actifs');

            // Index composite : retrouver tous les emprunts actifs d'un véhicule
            $table->index(
                ['vehicule_immatriculation', 'statut', 'est_supprime'],
                'idx_histaffect_veh_statut'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historique_affectations');
    }
};