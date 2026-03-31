<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // TRIGGER 01: Immobilisation véhicule si inspection "danger_immediat"
        DB::unprepared('
            CREATE TRIGGER trg_immobilisation_inspection_danger 
            AFTER INSERT ON inspections_vehicules 
            FOR EACH ROW 
            BEGIN
              IF NEW.statut_global = "danger_immediat" THEN
                UPDATE vehicules
                SET statut = "immobilise",
                    date_immobilisation = NOW()
                WHERE immatriculation = NEW.vehicule_immatriculation AND est_supprime = 0;
                
                INSERT INTO notifications (categorie_id, titre, message, vehicule_immatriculation, donnees, date_creation)
                SELECT 
                  cn.id,
                  CONCAT("DANGER IMMÉDIAT - Véhicule ", NEW.vehicule_immatriculation, " immobilisé"),
                  CONCAT("Inspection du ", DATE_FORMAT(NOW(), "%d/%m/%Y"), " : Véhicule immobilisé suite à détection de danger immédiat."),
                  NEW.vehicule_immatriculation,
                  JSON_OBJECT("inspection_vehicule_id", NEW.id, "statut", "danger_immediat"),
                  NOW()
                FROM categories_notifications cn
                WHERE cn.code = "alerte_inspection" AND cn.est_supprime = 0 AND cn.est_actif = 1
                LIMIT 1;
              END IF;
            END
        ');

        // TRIGGER 02: Gestion statut véhicule pendant mission (démarrage)
        DB::unprepared('
            CREATE TRIGGER trg_statut_veh_mission_start 
            AFTER UPDATE ON missions 
            FOR EACH ROW 
            BEGIN
              IF NEW.est_supprime = 0 THEN
                IF OLD.statut = "planifiee" AND NEW.statut = "en_cours" THEN
                  UPDATE vehicules 
                  SET statut = "en_mission" 
                  WHERE immatriculation = NEW.vehicule_immatriculation AND est_supprime = 0;
                END IF;
              END IF;
            END
        ');

        // TRIGGER 03: Gestion statut véhicule + MAJ km après mission (fin)
        DB::unprepared('
            CREATE TRIGGER trg_fin_mission_km_statut 
            AFTER UPDATE ON missions 
            FOR EACH ROW 
            BEGIN
              IF NEW.est_supprime = 0 THEN
                IF OLD.statut = "en_cours" AND NEW.statut IN ("terminee", "annulee") THEN
                  UPDATE vehicules 
                  SET statut = "disponible" 
                  WHERE immatriculation = NEW.vehicule_immatriculation AND est_supprime = 0;
                END IF;
                
                IF NEW.statut = "terminee" AND NEW.km_retour IS NOT NULL AND 
                   (OLD.km_retour IS NULL OR NEW.km_retour > OLD.km_retour) THEN
                  
                  UPDATE vehicules 
                  SET kilometrage = NEW.km_retour,
                      date_maj_km = DATE(NEW.date_retour_reelle)
                  WHERE immatriculation = NEW.vehicule_immatriculation AND est_supprime = 0;
                  
                  INSERT INTO historique_kilometrage (
                    vehicule_immatriculation, kilometrage, date_relevee, source, source_id, enregistre_par_user_id
                  ) VALUES (
                    NEW.vehicule_immatriculation, NEW.km_retour, DATE(NEW.date_retour_reelle), 
                    "mission", NEW.id, NEW.chauffeur_user_id
                  );
                END IF;
              END IF;
            END
        ');

        // TRIGGER 04: Gestion statut véhicule pendant intervention (démarrage)
        DB::unprepared('
            CREATE TRIGGER trg_statut_veh_intervention_start 
            AFTER UPDATE ON interventions 
            FOR EACH ROW 
            BEGIN
              IF NEW.est_supprime = 0 THEN
                IF OLD.statut != "en_cours" AND NEW.statut = "en_cours" THEN
                  UPDATE vehicules 
                  SET statut = "en_maintenance" 
                  WHERE immatriculation = NEW.vehicule_immatriculation AND est_supprime = 0;
                END IF;
              END IF;
            END
        ');

        // TRIGGER 05: Gestion statut véhicule après intervention (fin)
        DB::unprepared('
            CREATE TRIGGER trg_statut_veh_intervention_end 
            AFTER UPDATE ON interventions 
            FOR EACH ROW 
            BEGIN
              IF NEW.est_supprime = 0 THEN
                IF OLD.statut = "en_cours" AND NEW.statut IN ("terminee", "annulee") THEN
                  UPDATE vehicules 
                  SET statut = "disponible" 
                  WHERE immatriculation = NEW.vehicule_immatriculation AND est_supprime = 0;
                END IF;
              END IF;
            END
        ');

        // TRIGGER 06: MAJ kilométrage après PC Radio (retour)
        DB::unprepared('
            CREATE TRIGGER trg_maj_km_apres_pcradio 
            AFTER UPDATE ON pc_radio 
            FOR EACH ROW 
            BEGIN
              IF NEW.km_retour IS NOT NULL AND NEW.date_heure_retour IS NOT NULL AND
                 (OLD.km_retour IS NULL OR NEW.km_retour > OLD.km_retour) AND
                 NEW.est_supprime = 0 THEN
                
                UPDATE vehicules 
                SET kilometrage = NEW.km_retour,
                    date_maj_km = DATE(NEW.date_heure_retour)
                WHERE immatriculation = NEW.vehicule_immatriculation AND est_supprime = 0;
                
                INSERT INTO historique_kilometrage (
                  vehicule_immatriculation, kilometrage, date_relevee, source, source_id, enregistre_par_user_id
                ) VALUES (
                  NEW.vehicule_immatriculation, NEW.km_retour, DATE(NEW.date_heure_retour), 
                  "pc_radio", NEW.id, NEW.agent_pc_radio_user_id
                );
              END IF;
            END
        ');

        // TRIGGER 07: Notification stock faible
        DB::unprepared('
            CREATE TRIGGER trg_notif_stock_faible 
            AFTER UPDATE ON pieces_detachees 
            FOR EACH ROW 
            BEGIN
              DECLARE cat_id INT;
              DECLARE notif_id BIGINT;
              
              IF NEW.quantite_stock <= NEW.seuil_alerte AND 
                 OLD.quantite_stock > OLD.seuil_alerte AND
                 NEW.est_supprime = 0 THEN
                
                SELECT id INTO cat_id 
                FROM categories_notifications 
                WHERE code = "alerte_stock_faible" AND est_supprime = 0 
                LIMIT 1;
                
                IF cat_id IS NOT NULL THEN
                  INSERT INTO notifications (
                    categorie_id, titre, message, donnees, date_creation
                  ) VALUES (
                    cat_id,
                    CONCAT("Stock faible: ", NEW.nom),
                    CONCAT("La pièce \"", NEW.nom, "\" a atteint le seuil d\'alerte. Stock actuel: ", NEW.quantite_stock, " ", NEW.unite),
                    JSON_OBJECT("piece_id", NEW.id, "quantite_stock", NEW.quantite_stock, "seuil_alerte", NEW.seuil_alerte),
                    NOW()
                  );
                  
                  SET notif_id = LAST_INSERT_ID();
                  
                  INSERT INTO envois_notifications (notification_id, user_id, canal, statut_envoi, date_creation)
                  SELECT notif_id, u.id, "in_app", "en_attente", NOW()
                  FROM utilisateurs u
                  INNER JOIN roles r ON u.role_id = r.id
                  WHERE r.code = "chef_parc" AND u.est_actif = 1 AND u.est_supprime = 0;
                END IF;
              END IF;
            END
        ');

        // TRIGGER 08: MAJ coût pièces intervention (ajout prélèvement)
        DB::unprepared('
            CREATE TRIGGER trg_maj_cout_pieces_insert 
            AFTER INSERT ON prelevements_pieces 
            FOR EACH ROW 
            BEGIN
              UPDATE interventions 
              SET cout_pieces = (
                SELECT COALESCE(SUM(quantite * prix_unitaire), 0)
                FROM prelevements_pieces
                WHERE intervention_id = NEW.intervention_id
              )
              WHERE id = NEW.intervention_id;
            END
        ');

        // TRIGGER 09: MAJ coût pièces intervention (suppression prélèvement)
        DB::unprepared('
            CREATE TRIGGER trg_maj_cout_pieces_delete 
            AFTER DELETE ON prelevements_pieces 
            FOR EACH ROW 
            BEGIN
              UPDATE interventions 
              SET cout_pieces = (
                SELECT COALESCE(SUM(quantite * prix_unitaire), 0)
                FROM prelevements_pieces
                WHERE intervention_id = OLD.intervention_id
              )
              WHERE id = OLD.intervention_id;
            END
        ');

        // TRIGGER 10: MAJ stock + mouvement après prélèvement pièce
        DB::unprepared('
            CREATE TRIGGER trg_maj_stock_apres_prelevement 
            AFTER INSERT ON prelevements_pieces 
            FOR EACH ROW 
            BEGIN
              UPDATE pieces_detachees 
              SET quantite_stock = quantite_stock - NEW.quantite
              WHERE id = NEW.piece_id AND est_supprime = 0;
              
              INSERT INTO mouvements_stock (
                piece_id, type_mouvement, quantite, prix_unitaire, 
                type_reference, reference_id, effectue_par_user_id
              ) VALUES (
                NEW.piece_id, "sortie", -NEW.quantite, NEW.prix_unitaire,
                "intervention", NEW.intervention_id, NEW.preleve_par_user_id
              );
            END
        ');

        // TRIGGER 11: Notification accident déclaré
        DB::unprepared('
            CREATE TRIGGER trg_notif_accident 
            AFTER INSERT ON accidents 
            FOR EACH ROW 
            BEGIN
              DECLARE cat_id INT;
              DECLARE notif_id BIGINT;
              
              SELECT id INTO cat_id 
              FROM categories_notifications 
              WHERE code = "alerte_accident" AND est_supprime = 0 
              LIMIT 1;
              
              IF cat_id IS NOT NULL THEN
                INSERT INTO notifications (
                  categorie_id, titre, message, vehicule_immatriculation, donnees, date_creation
                ) VALUES (
                  cat_id,
                  CONCAT("Accident déclaré - ", NEW.vehicule_immatriculation),
                  CONCAT("Accident le ", DATE_FORMAT(NEW.date_accident, "%d/%m/%Y %H:%i"), " - ", COALESCE(NEW.lieu, "Lieu non précisé")),
                  NEW.vehicule_immatriculation,
                  JSON_OBJECT("accident_id", NEW.id, "niveau_degats", NEW.niveau_degats, "vehicule_immobilise", NEW.vehicule_immobilise),
                  NOW()
                );
                
                SET notif_id = LAST_INSERT_ID();
                
                INSERT INTO envois_notifications (notification_id, user_id, canal, statut_envoi, date_creation)
                SELECT notif_id, u.id, "email", "en_attente", NOW()
                FROM utilisateurs u
                INNER JOIN roles r ON u.role_id = r.id
                WHERE r.code IN ("admin", "chef_parc", "chef_tf") AND u.est_actif = 1 AND u.est_supprime = 0;
                
                INSERT INTO envois_notifications (notification_id, user_id, canal, statut_envoi, date_creation)
                SELECT notif_id, u.id, "in_app", "en_attente", NOW()
                FROM utilisateurs u
                INNER JOIN roles r ON u.role_id = r.id
                WHERE r.code IN ("admin", "chef_parc", "chef_tf") AND u.est_actif = 1 AND u.est_supprime = 0;
              END IF;
            END
        ');

        // TRIGGER 12: Notification anomalie PC Radio détectée
        DB::unprepared('
            CREATE TRIGGER trg_notif_anomalie_pcradio 
            AFTER INSERT ON anomalies_pc_radio 
            FOR EACH ROW 
            BEGIN
              DECLARE cat_id INT;
              DECLARE notif_id BIGINT;
              
              SELECT id INTO cat_id 
              FROM categories_notifications 
              WHERE code = "alerte_anomalie_pcradio" AND est_supprime = 0 
              LIMIT 1;
              
              IF cat_id IS NOT NULL THEN
                INSERT INTO notifications (
                  categorie_id, titre, message, vehicule_immatriculation, donnees, date_creation
                ) VALUES (
                  cat_id,
                  CONCAT("Anomalie PC Radio - ", NEW.vehicule_immatriculation),
                  CONCAT("Dégât détecté au retour: ", NEW.type_degat, " - ", LEFT(NEW.description, 100)),
                  NEW.vehicule_immatriculation,
                  JSON_OBJECT("anomalie_pc_radio_id", NEW.id, "severite", NEW.severite, "partie_vehicule", NEW.partie_vehicule),
                  NOW()
                );
                
                SET notif_id = LAST_INSERT_ID();
                
                INSERT INTO envois_notifications (notification_id, user_id, canal, statut_envoi, date_creation)
                SELECT notif_id, u.id, "email", "en_attente", NOW()
                FROM utilisateurs u
                INNER JOIN roles r ON u.role_id = r.id
                WHERE r.code IN ("chef_parc", "chef_tf") AND u.est_actif = 1 AND u.est_supprime = 0;
              END IF;
            END
        ');

        // TRIGGER 13: Immobilisation véhicule si accident grave
        DB::unprepared('
            CREATE TRIGGER trg_immobilisation_accident 
            AFTER INSERT ON accidents 
            FOR EACH ROW 
            BEGIN
              IF NEW.vehicule_immobilise = 1 THEN
                UPDATE vehicules
                SET statut = "immobilise",
                    date_immobilisation = NEW.date_accident
                WHERE immatriculation = NEW.vehicule_immatriculation AND est_supprime = 0;
              END IF;
            END
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS trg_immobilisation_inspection_danger');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_statut_veh_mission_start');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_fin_mission_km_statut');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_statut_veh_intervention_start');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_statut_veh_intervention_end');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_maj_km_apres_pcradio');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_notif_stock_faible');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_maj_cout_pieces_insert');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_maj_cout_pieces_delete');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_maj_stock_apres_prelevement');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_notif_accident');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_notif_anomalie_pcradio');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_immobilisation_accident');
    }
};