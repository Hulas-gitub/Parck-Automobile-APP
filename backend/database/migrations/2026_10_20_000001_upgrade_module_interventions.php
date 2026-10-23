<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Migration — Module Interventions (v2)
 *
 *  1. Ajoute les champs manquants dans `interventions`
 *  2. Crée `intervention_demandes`  (pivot demandes ↔ intervention)
 *  3. Crée `outils_intervention`    (outils utilisés par intervention)
 *  4. Crée `periodes_caisse`        (périodes mensuelles)
 *  5. Crée `mouvements_caisse`      (entrées / sorties de caisse)
 *  6. Supprime les deux triggers Laravel-obsolètes
 *  7. Seed intervenants de démo si la table est vide
 */
return new class extends Migration
{
    // -----------------------------------------------------------------------
    // UP
    // -----------------------------------------------------------------------

    public function up(): void
    {
        /* ================================================================
           1. INTERVENTIONS — champs supplémentaires
        ================================================================ */
        Schema::table('interventions', function (Blueprint $table) {
            // Nature (interne / externe)
            if (!Schema::hasColumn('interventions', 'nature_intervention')) {
                $table->string('nature_intervention', 20)->default('interne')
                      ->after('statut')
                      ->comment('interne | externe');
            }

            // ---- Champs spécifiques EXTERNE --------------------------------
            if (!Schema::hasColumn('interventions', 'date_entree_garage')) {
                $table->dateTime('date_entree_garage')->nullable()->after('nature_intervention');
            }
            if (!Schema::hasColumn('interventions', 'date_sortie_garage')) {
                $table->dateTime('date_sortie_garage')->nullable()->after('date_entree_garage');
            }
            if (!Schema::hasColumn('interventions', 'montant_main_oeuvre_prestataire')) {
                $table->decimal('montant_main_oeuvre_prestataire', 12, 2)->nullable()
                      ->after('date_sortie_garage')
                      ->comment('Coût MO annoncé par le prestataire (externe)');
            }
            if (!Schema::hasColumn('interventions', 'montant_pieces_prestataire')) {
                $table->decimal('montant_pieces_prestataire', 12, 2)->default(0)->after('montant_main_oeuvre_prestataire');
            }
            if (!Schema::hasColumn('interventions', 'numero_devis_facture')) {
                $table->string('numero_devis_facture', 100)->nullable()->after('montant_pieces_prestataire');
            }
            if (!Schema::hasColumn('interventions', 'garantie_jours')) {
                $table->unsignedSmallInteger('garantie_jours')->nullable()->after('numero_devis_facture');
            }
            if (!Schema::hasColumn('interventions', 'statut_paiement')) {
                $table->string('statut_paiement', 30)->nullable()
                      ->after('garantie_jours')
                      ->comment('en_attente | paye | partiel');
            }

        });

        try {
            $hasIndex = collect(DB::select("SHOW INDEX FROM interventions WHERE Key_name = 'idx_interv_nature'"))->isNotEmpty();
            if (!$hasIndex) {
                Schema::table('interventions', function (Blueprint $table) {
                    $table->index('nature_intervention', 'idx_interv_nature');
                });
            }
        } catch (\Throwable $e) {}

        /* ================================================================
           2. PIVOT : intervention_demandes
        ================================================================ */
        if (!Schema::hasTable('intervention_demandes')) {
            Schema::create('intervention_demandes', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('intervention_id');
                $table->unsignedBigInteger('demande_id');
                $table->string('matricule_demande', 20)->nullable();
                $table->boolean('est_principale')->default(false)
                      ->comment('La première demande cochée lors de la création');
                $table->timestamp('date_creation')->useCurrent();

                $table->unique(['intervention_id', 'demande_id'], 'uq_interv_dem');
                $table->index('intervention_id', 'idx_intdem_intervention');
                $table->index('demande_id',      'idx_intdem_demande');

                $table->foreign('intervention_id', 'fk_intdem_intervention')
                      ->references('id')->on('interventions')
                      ->onDelete('cascade')->onUpdate('cascade');

                $table->foreign('demande_id', 'fk_intdem_demande')
                      ->references('id')->on('demandes_intervention')
                      ->onDelete('cascade')->onUpdate('cascade');
            });
        }

        /* ================================================================
           3. OUTILS UTILISÉS PAR INTERVENTION
        ================================================================ */
        if (!Schema::hasTable('outils_intervention')) {
            Schema::create('outils_intervention', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('intervention_id');
                $table->unsignedBigInteger('outil_id');
                $table->text('notes')->nullable();
                $table->timestamp('date_creation')->useCurrent();

                $table->unique(['intervention_id', 'outil_id'], 'uq_outil_interv');
                $table->index('intervention_id', 'idx_outinterv_intervention');
                $table->index('outil_id',        'idx_outinterv_outil');

                $table->foreign('intervention_id', 'fk_outinterv_intervention')
                      ->references('id')->on('interventions')
                      ->onDelete('cascade')->onUpdate('cascade');

                $table->foreign('outil_id', 'fk_outinterv_outil')
                      ->references('id')->on('outils')
                      ->onDelete('cascade')->onUpdate('cascade');
            });
        }

        /* ================================================================
           4. PÉRIODES DE CAISSE (une ligne par mois)
        ================================================================ */
        if (!Schema::hasTable('periodes_caisse')) {
            Schema::create('periodes_caisse', function (Blueprint $table) {
                $table->id();
                $table->unsignedSmallInteger('annee');
                $table->unsignedTinyInteger('mois');   // 1–12
                $table->decimal('solde_ouverture', 14, 2)->default(0);
                $table->decimal('solde_cloture',  14, 2)->nullable()
                      ->comment('Calculé à la clôture du mois');
                $table->boolean('est_cloture')->default(false);
                $table->timestamp('date_creation')->useCurrent();
                $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();

                $table->unique(['annee', 'mois'], 'uq_periode_caisse');
                $table->index(['annee', 'mois'], 'idx_periode_caisse_ym');
            });
        }

        /* ================================================================
           5. MOUVEMENTS DE CAISSE
        ================================================================ */
        if (!Schema::hasTable('mouvements_caisse')) {
            Schema::create('mouvements_caisse', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('periode_caisse_id')->nullable();
                $table->string('type_mouvement', 20)
                      ->comment('approvisionnement | sortie | contre_passation');
                $table->decimal('montant', 14, 2);      // positif pour entrée, négatif ou positif selon type
                $table->decimal('solde_apres', 14, 2)->default(0);
                $table->string('libelle', 255)->nullable();
                $table->text('article')->nullable();
                $table->unsignedBigInteger('fournisseur_id')->nullable();
                $table->string('vehicule_immatriculation', 30)->nullable();
                $table->unsignedBigInteger('intervention_id')->nullable();
                $table->unsignedBigInteger('piece_id')->nullable()
                      ->comment('Pièce achetée avec ce mouvement');
                $table->string('chemin_justificatif', 255)->nullable();
                $table->unsignedBigInteger('annule_par_mouvement_id')->nullable()
                      ->comment('Pointe vers le mouvement de contre-passation');
                $table->boolean('est_annule')->default(false);
                $table->unsignedBigInteger('cree_par_user_id')->nullable();
                $table->timestamp('date_mouvement')->useCurrent();
                $table->timestamp('date_creation')->useCurrent();

                $table->index('type_mouvement',           'idx_mvcaisse_type');
                $table->index('vehicule_immatriculation', 'idx_mvcaisse_vehicule');
                $table->index('intervention_id',          'idx_mvcaisse_intervention');
                $table->index('periode_caisse_id',        'idx_mvcaisse_periode');
                $table->index('date_mouvement',           'idx_mvcaisse_date');

                $table->foreign('periode_caisse_id', 'fk_mvcaisse_periode')
                      ->references('id')->on('periodes_caisse')
                      ->onDelete('set null')->onUpdate('cascade');

                $table->foreign('intervention_id', 'fk_mvcaisse_intervention')
                      ->references('id')->on('interventions')
                      ->onDelete('set null')->onUpdate('cascade');

                $table->foreign('cree_par_user_id', 'fk_mvcaisse_user')
                      ->references('id')->on('utilisateurs')
                      ->onDelete('set null')->onUpdate('cascade');
            });
        }

        /* ================================================================
           6. SUPPRESSION DES TRIGGERS OBSOLÈTES
        ================================================================ */
        // Ces triggers utilisent 'en_maintenance' (mauvais vocabulaire)
        // et interfèrent avec la gestion Laravel.
        DB::unprepared('DROP TRIGGER IF EXISTS trg_statut_veh_intervention_start');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_statut_veh_intervention_end');

        /* ================================================================
           7. SEED INTERVENANTS DE DÉMO (si table vide)
        ================================================================ */
        $count = DB::table('intervenants')->count();
        if ($count === 0) {
            // Récupérer les type_intervenant_id
            $typeInterne   = DB::table('types_intervenant')->where('code', 'mecanicien_interne')->value('id')
                          ?? DB::table('types_intervenant')->whereRaw("LOWER(libelle) LIKE '%interne%'")->value('id');
            $typeExterne   = DB::table('types_intervenant')->where('code', 'prestataire_externe')->value('id')
                          ?? DB::table('types_intervenant')->whereRaw("LOWER(libelle) LIKE '%externe%'")->value('id');

            $now = now();
            $seeds = [];

            if ($typeInterne) {
                $seeds[] = [
                    'type_intervenant_id' => $typeInterne,
                    'nom_externe'         => 'Jean-Paul NDONG',
                    'telephone'           => '+241 77 00 00 01',
                    'email'               => null,
                    'est_externe'         => false,
                    'tarif_horaire'       => 5000.00,
                    'specialisation'      => 'Mécanique générale',
                    'est_actif'           => true,
                    'est_supprime'        => false,
                    'date_creation'       => $now,
                    'date_modification'   => $now,
                ];
                $seeds[] = [
                    'type_intervenant_id' => $typeInterne,
                    'nom_externe'         => 'Michel ONDO',
                    'telephone'           => '+241 77 00 00 02',
                    'email'               => null,
                    'est_externe'         => false,
                    'tarif_horaire'       => 4500.00,
                    'specialisation'      => 'Électricité automobile',
                    'est_actif'           => true,
                    'est_supprime'        => false,
                    'date_creation'       => $now,
                    'date_modification'   => $now,
                ];
            }

            if ($typeExterne) {
                $seeds[] = [
                    'type_intervenant_id' => $typeExterne,
                    'nom_externe'         => 'Garage SGS Libreville',
                    'telephone'           => '+241 77 10 20 30',
                    'email'               => 'contact@garage-sgs.ga',
                    'est_externe'         => true,
                    'tarif_horaire'       => 0.00,
                    'specialisation'      => 'Prestataire agrée SGS',
                    'est_actif'           => true,
                    'est_supprime'        => false,
                    'date_creation'       => $now,
                    'date_modification'   => $now,
                ];
            }

            if ($seeds) {
                DB::table('intervenants')->insert($seeds);
            }
        }
    }

    // -----------------------------------------------------------------------
    // DOWN
    // -----------------------------------------------------------------------

    public function down(): void
    {
        // Supprimer dans l'ordre inverse des FK
        Schema::dropIfExists('mouvements_caisse');
        Schema::dropIfExists('periodes_caisse');
        Schema::dropIfExists('outils_intervention');
        Schema::dropIfExists('intervention_demandes');

        // Retirer les colonnes ajoutées à interventions
        Schema::table('interventions', function (Blueprint $table) {
            $cols = [
                'nature_intervention', 'date_entree_garage', 'date_sortie_garage',
                'montant_main_oeuvre_prestataire', 'montant_pieces_prestataire',
                'numero_devis_facture', 'garantie_jours', 'statut_paiement',
            ];
            foreach ($cols as $col) {
                if (Schema::hasColumn('interventions', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
