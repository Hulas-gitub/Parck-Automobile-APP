-- ============================================================================
-- SYSTÈME DE GESTION DU PARC AUTOMOBILE - BASE DE DONNÉES OPTIMISÉE V4.0 FINAL
-- ============================================================================
-- CORRECTION: Cohérence contraintes FK avec colonnes NOT NULL
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

-- ============================================================================
-- DROP TABLES (Dans l'ordre inverse des dépendances)
-- ============================================================================

DROP TABLE IF EXISTS journaux_audit;
DROP TABLE IF EXISTS parametres_alertes;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS categories_notifications;
DROP TABLE IF EXISTS kpi_vehicules;
DROP TABLE IF EXISTS performances_chauffeurs;
DROP TABLE IF EXISTS documents_chauffeurs;
DROP TABLE IF EXISTS carnets_carburant;
DROP TABLE IF EXISTS accidents;
DROP TABLE IF EXISTS checklist_actions;
DROP TABLE IF EXISTS inspections_vehicules;
DROP TABLE IF EXISTS inspections;
DROP TABLE IF EXISTS planning_maintenance;
DROP TABLE IF EXISTS regles_maintenance;
DROP TABLE IF EXISTS problemes_outils;
DROP TABLE IF EXISTS outils;
DROP TABLE IF EXISTS mouvements_stock;
DROP TABLE IF EXISTS prelevements_pieces;
DROP TABLE IF EXISTS pieces_detachees;
DROP TABLE IF EXISTS interventions;
DROP TABLE IF EXISTS demandes_intervention;
DROP TABLE IF EXISTS anomalies;
DROP TABLE IF EXISTS alertes_kilometrage;
DROP TABLE IF EXISTS historique_kilometrage;
DROP TABLE IF EXISTS anomalies_pc_radio;
DROP TABLE IF EXISTS pc_radio;
DROP TABLE IF EXISTS missions;
DROP TABLE IF EXISTS documents_vehicules;
DROP TABLE IF EXISTS vehicules;
DROP TABLE IF EXISTS intervenants;
DROP TABLE IF EXISTS utilisateurs;
DROP TABLE IF EXISTS fournisseurs;
DROP TABLE IF EXISTS directions;
DROP TABLE IF EXISTS roles;

-- ============================================================================
-- TABLES DE RÉFÉRENCE (Configuration)
-- ============================================================================

-- 1. roles
CREATE TABLE roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE COMMENT 'admin, chef_parc, chef_tf, agent_pc_radio, mecanicien, chauffeur',
  libelle VARCHAR(100) NOT NULL,
  description TEXT,
  est_supprime TINYINT(1) DEFAULT 0,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  date_suppression TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_roles_actifs (est_supprime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. directions
CREATE TABLE directions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(150) NOT NULL,
  code VARCHAR(50) NULL,
  est_supprime TINYINT(1) DEFAULT 0,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  date_suppression TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_directions_actives (est_supprime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. fournisseurs
CREATE TABLE fournisseurs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(200) NOT NULL,
  contact VARCHAR(150) NULL,
  telephone VARCHAR(50) NULL,
  email VARCHAR(150) NULL,
  type VARCHAR(100) NULL COMMENT 'pieces, carburant, assurance, autre',
  adresse TEXT NULL,
  est_actif TINYINT(1) DEFAULT 1,
  est_supprime TINYINT(1) DEFAULT 0,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  date_suppression TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_fournisseurs_actifs (est_supprime, est_actif)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- GESTION UTILISATEURS
-- ============================================================================

-- 4. utilisateurs
CREATE TABLE utilisateurs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(200) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  mot_de_passe VARCHAR(255) NOT NULL,
  telephone VARCHAR(50) NULL,
  role_id INT UNSIGNED NOT NULL,
  direction_id INT UNSIGNED NULL,
  photo VARCHAR(255) NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  est_supprime TINYINT(1) DEFAULT 0,
  derniere_connexion TIMESTAMP NULL,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  date_suppression TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_utilisateurs_role (role_id),
  INDEX idx_utilisateurs_direction (direction_id),
  INDEX idx_utilisateurs_email (email),
  INDEX idx_utilisateurs_actifs (est_supprime, est_actif)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. intervenants
CREATE TABLE intervenants (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL COMMENT 'NULL si externe',
  nom_externe VARCHAR(200) NULL COMMENT 'Nom si prestataire externe',
  type VARCHAR(80) NOT NULL COMMENT 'mecanicien, electricien, carrossier, autre',
  telephone VARCHAR(50) NULL,
  email VARCHAR(150) NULL,
  est_externe TINYINT(1) NOT NULL DEFAULT 0,
  tarif_horaire DECIMAL(12,2) DEFAULT 0 COMMENT 'Tarif horaire CFA',
  specialisation TEXT NULL,
  notes TEXT NULL,
  est_actif TINYINT(1) DEFAULT 1,
  est_supprime TINYINT(1) DEFAULT 0,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  date_suppression TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_intervenants_user (user_id),
  INDEX idx_intervenants_type (type),
  INDEX idx_intervenants_actifs (est_supprime, est_actif)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- GESTION VÉHICULES
-- ============================================================================

-- 6. vehicules (IMMATRICULATION = PRIMARY KEY)
CREATE TABLE vehicules (
  immatriculation VARCHAR(30) PRIMARY KEY,
  numero_chassis VARCHAR(100) NULL UNIQUE COMMENT 'VIN',
  marque VARCHAR(100) NULL,
  modele VARCHAR(100) NULL,
  type_vehicule VARCHAR(60) NULL COMMENT '4x4, berline, utilitaire, camion, 4x4_blinde',
  nb_places INT DEFAULT 5,
  direction_id INT UNSIGNED NULL,
  kilometrage BIGINT UNSIGNED DEFAULT 0,
  date_maj_km DATE NULL,
  km_prochaine_vidange BIGINT NULL,
  km_prochaine_revision BIGINT NULL,
  statut VARCHAR(50) NOT NULL DEFAULT 'disponible' COMMENT 'disponible, en_mission, en_maintenance, immobilise',
  date_immobilisation DATETIME NULL,
  jours_immobilisation INT GENERATED ALWAYS AS 
    (CASE WHEN statut='immobilise' AND date_immobilisation IS NOT NULL 
     THEN DATEDIFF(NOW(), date_immobilisation) ELSE 0 END) VIRTUAL,
  type_carburant VARCHAR(50) NULL COMMENT 'diesel, essence, hybride',
  capacite_reservoir INT NULL COMMENT 'Litres',
  consommation_moyenne DECIMAL(10,2) NULL COMMENT 'L/100km',
  date_acquisition DATE NULL,
  date_expiration_assurance DATE NULL,
  date_expiration_visite_technique DATE NULL,
  cout_acquisition DECIMAL(14,2) DEFAULT 0,
  valeur_residuelle DECIMAL(14,2) NULL,
  photo VARCHAR(255) NULL,
  notes TEXT NULL,
  est_actif TINYINT(1) DEFAULT 1,
  est_supprime TINYINT(1) DEFAULT 0,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  date_suppression TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_vehicules_immat (immatriculation),
  INDEX idx_vehicules_direction (direction_id),
  INDEX idx_vehicules_statut (statut),
  INDEX idx_vehicules_actifs (est_supprime, est_actif)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. documents_vehicules
CREATE TABLE documents_vehicules (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicule_immatriculation VARCHAR(30) NOT NULL,
  type_document VARCHAR(100) NOT NULL COMMENT 'carte_grise, assurance, visite_technique, photo, facture_achat, autre',
  nom_document VARCHAR(255) NOT NULL,
  chemin_fichier VARCHAR(255) NOT NULL,
  compagnie_assurance VARCHAR(200) NULL,
  numero_contrat VARCHAR(100) NULL,
  type_couverture VARCHAR(100) NULL COMMENT 'tous_risques, tiers, tiers_plus',
  montant_prime DECIMAL(14,2) NULL,
  date_emission DATE NULL,
  date_expiration DATE NULL,
  telecharge_par_user_id BIGINT UNSIGNED NULL,
  notes TEXT NULL,
  est_supprime TINYINT(1) DEFAULT 0,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  date_suppression TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_docveh_vehicule (vehicule_immatriculation),
  INDEX idx_docveh_type (type_document),
  INDEX idx_docveh_expiration (date_expiration),
  INDEX idx_docveh_actifs (est_supprime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- GESTION MISSIONS
-- ============================================================================

-- 8. missions
CREATE TABLE missions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicule_immatriculation VARCHAR(30) NOT NULL,
  chauffeur_user_id BIGINT UNSIGNED NOT NULL,
  type_mission VARCHAR(100) NULL COMMENT 'transport_fonds, mission_brousse, autre',
  destination VARCHAR(255) NULL,
  direction_id INT UNSIGNED NULL,
  nb_passagers INT DEFAULT 1,
  date_depart_prevue DATETIME NOT NULL,
  date_depart_reelle DATETIME NULL,
  date_retour_reelle DATETIME NULL,
  duree_minutes INT GENERATED ALWAYS AS 
    (CASE WHEN date_depart_reelle IS NOT NULL AND date_retour_reelle IS NOT NULL 
     THEN TIMESTAMPDIFF(MINUTE, date_depart_reelle, date_retour_reelle) ELSE NULL END) VIRTUAL,
  km_depart BIGINT NULL,
  km_retour BIGINT NULL,
  km_parcourus INT GENERATED ALWAYS AS 
    (CASE WHEN km_depart IS NOT NULL AND km_retour IS NOT NULL 
     THEN (km_retour - km_depart) ELSE NULL END) VIRTUAL,
  carburant_consomme DECIMAL(10,2) NULL COMMENT 'Litres',
  cout_carburant DECIMAL(12,2) NULL,
  statut VARCHAR(50) DEFAULT 'planifiee' COMMENT 'planifiee, en_cours, terminee, annulee',
  reference_mission VARCHAR(100) NULL,
  observations TEXT NULL,
  incident_signale TINYINT(1) DEFAULT 0,
  description_incident TEXT NULL,
  photos JSON NULL,
  est_supprime TINYINT(1) DEFAULT 0,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  date_suppression TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_missions_vehicule (vehicule_immatriculation),
  INDEX idx_missions_chauffeur (chauffeur_user_id),
  INDEX idx_missions_statut (statut),
  INDEX idx_missions_dates (date_depart_prevue, statut),
  INDEX idx_missions_direction (direction_id),
  INDEX idx_missions_actives (est_supprime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- MODULE PC RADIO (TRAÇABILITÉ REMISE CLÉS)
-- ============================================================================

-- 9. pc_radio
CREATE TABLE pc_radio (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicule_immatriculation VARCHAR(30) NOT NULL,
  chauffeur_user_id BIGINT UNSIGNED NOT NULL,
  mission_id BIGINT UNSIGNED NULL COMMENT 'Mission associée si applicable',
  date_heure_remise DATETIME NOT NULL,
  km_depart BIGINT NOT NULL,
  niveau_carburant_depart VARCHAR(50) NULL COMMENT 'plein, 3/4, 1/2, 1/4, reserve',
  checklist_avant JSON NOT NULL COMMENT 'Carrosserie, vitres, rétroviseurs, pneus, propreté, équipements',
  photos_avant JSON NULL,
  observations_depart TEXT NULL,
  date_heure_retour DATETIME NULL,
  km_retour BIGINT NULL,
  niveau_carburant_retour VARCHAR(50) NULL,
  duree_utilisation_minutes INT GENERATED ALWAYS AS 
    (CASE WHEN date_heure_remise IS NOT NULL AND date_heure_retour IS NOT NULL 
     THEN TIMESTAMPDIFF(MINUTE, date_heure_remise, date_heure_retour) ELSE NULL END) VIRTUAL,
  km_parcourus INT GENERATED ALWAYS AS 
    (CASE WHEN km_depart IS NOT NULL AND km_retour IS NOT NULL 
     THEN (km_retour - km_depart) ELSE NULL END) VIRTUAL,
  checklist_apres JSON NULL COMMENT 'État après mission',
  photos_apres JSON NULL,
  anomalies_detectees TINYINT(1) DEFAULT 0,
  observations_retour TEXT NULL,
  agent_pc_radio_user_id BIGINT UNSIGNED NOT NULL,
  signature_chauffeur_remise TEXT NULL COMMENT 'Base64 ou chemin',
  signature_chauffeur_retour TEXT NULL,
  est_supprime TINYINT(1) DEFAULT 0,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  date_suppression TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_pcradio_vehicule (vehicule_immatriculation),
  INDEX idx_pcradio_chauffeur (chauffeur_user_id),
  INDEX idx_pcradio_mission (mission_id),
  INDEX idx_pcradio_agent (agent_pc_radio_user_id),
  INDEX idx_pcradio_dates (date_heure_remise, date_heure_retour),
  INDEX idx_pcradio_anomalies (anomalies_detectees),
  INDEX idx_pcradio_actifs (est_supprime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. anomalies_pc_radio
CREATE TABLE anomalies_pc_radio (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pc_radio_id BIGINT UNSIGNED NOT NULL,
  vehicule_immatriculation VARCHAR(30) NOT NULL,
  chauffeur_user_id BIGINT UNSIGNED NULL,
  type_degat VARCHAR(100) NULL COMMENT 'rayure, bosse, vitre, retroviseur, choc, autre',
  partie_vehicule VARCHAR(100) NULL COMMENT 'avant, arriere, laterale_gauche, laterale_droite, toit, interieur',
  description TEXT NOT NULL,
  photos JSON NULL,
  severite VARCHAR(30) DEFAULT 'moyenne' COMMENT 'faible, moyenne, haute, critique',
  date_detection DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  statut VARCHAR(50) DEFAULT 'signale' COMMENT 'signale, en_cours, resolue',
  notes TEXT NULL,
  est_supprime TINYINT(1) DEFAULT 0,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  date_suppression TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_anom_pcradio_pc (pc_radio_id),
  INDEX idx_anom_pcradio_vehicule (vehicule_immatriculation),
  INDEX idx_anom_pcradio_statut (statut),
  INDEX idx_anom_pcradio_actives (est_supprime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- GESTION KILOMÉTRAGE
-- ============================================================================

-- 11. historique_kilometrage
CREATE TABLE historique_kilometrage (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicule_immatriculation VARCHAR(30) NOT NULL,
  kilometrage BIGINT UNSIGNED NOT NULL,
  date_relevee DATE NOT NULL,
  source VARCHAR(50) DEFAULT 'manuel' COMMENT 'manuel, mission, intervention, pc_radio, inspection',
  source_id BIGINT NULL COMMENT 'ID mission/intervention/pc_radio/inspection',
  enregistre_par_user_id BIGINT UNSIGNED NULL,
  notes TEXT NULL,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_histokm_vehicule (vehicule_immatriculation),
  INDEX idx_histokm_date (date_relevee),
  INDEX idx_histokm_vehicule_date (vehicule_immatriculation, date_relevee DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. alertes_kilometrage
CREATE TABLE alertes_kilometrage (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicule_immatriculation VARCHAR(30) NOT NULL,
  type_alerte VARCHAR(100) NOT NULL COMMENT 'vidange, revision, pneus, courroie',
  seuil_km BIGINT NOT NULL,
  km_actuel BIGINT NOT NULL,
  km_restants INT GENERATED ALWAYS AS (seuil_km - km_actuel) VIRTUAL,
  est_notifie TINYINT(1) DEFAULT 0,
  date_notification TIMESTAMP NULL,
  est_resolue TINYINT(1) DEFAULT 0,
  date_resolution TIMESTAMP NULL,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_alertkm_vehicule (vehicule_immatriculation),
  INDEX idx_alertkm_type (type_alerte),
  INDEX idx_alertkm_resolue (est_resolue)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- GESTION ANOMALIES & INTERVENTIONS
-- ============================================================================

-- 13. anomalies
CREATE TABLE anomalies (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicule_immatriculation VARCHAR(30) NOT NULL,
  signalee_par_user_id BIGINT UNSIGNED NULL,
  mission_id BIGINT UNSIGNED NULL,
  inspection_vehicule_id BIGINT UNSIGNED NULL COMMENT 'Si détectée lors inspection',
  date_signalement DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  description TEXT NOT NULL,
  partie_vehicule VARCHAR(100) NULL COMMENT 'moteur, freins, direction, pneus, electricite, carrosserie, autre',
  severite VARCHAR(30) DEFAULT 'moyenne' COMMENT 'faible, moyenne, haute, critique',
  km_au_signalement BIGINT NULL,
  position_gps VARCHAR(100) NULL COMMENT 'Lat, Long',
  photos JSON NULL,
  statut VARCHAR(50) DEFAULT 'ouverte' COMMENT 'ouverte, en_cours, resolue, annulee',
  est_supprime TINYINT(1) DEFAULT 0,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  date_suppression TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_anomalies_vehicule (vehicule_immatriculation),
  INDEX idx_anomalies_signalee_par (signalee_par_user_id),
  INDEX idx_anomalies_statut (statut),
  INDEX idx_anomalies_severite (severite),
  INDEX idx_anomalies_mission (mission_id),
  INDEX idx_anomalies_inspection (inspection_vehicule_id),
  INDEX idx_anomalies_actives (est_supprime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. demandes_intervention (CORRECTION: demandeur_user_id NULL acceptable)
CREATE TABLE demandes_intervention (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  anomalie_id BIGINT UNSIGNED NULL COMMENT 'NULL si maintenance préventive',
  vehicule_immatriculation VARCHAR(30) NOT NULL,
  demandeur_user_id BIGINT UNSIGNED NULL COMMENT 'Peut être NULL si demande système',
  date_demande DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  type_maintenance VARCHAR(50) DEFAULT 'corrective' COMMENT 'corrective, preventive',
  type_intervention VARCHAR(100) NULL COMMENT 'vidange, freins, pneus, revision, moteur, carrosserie, electricite, autre',
  priorite VARCHAR(30) DEFAULT 'normale' COMMENT 'faible, normale, haute, urgente',
  statut VARCHAR(50) DEFAULT 'en_attente' COMMENT 'en_attente, approuvee, rejetee, en_cours, terminee, annulee',
  commentaire TEXT NULL,
  motif_rejet TEXT NULL,
  validee_par_user_id BIGINT UNSIGNED NULL,
  date_validation DATETIME NULL,
  est_supprime TINYINT(1) DEFAULT 0,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  date_suppression TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_demande_vehicule (vehicule_immatriculation),
  INDEX idx_demande_demandeur (demandeur_user_id),
  INDEX idx_demande_anomalie (anomalie_id),
  INDEX idx_demande_statut (statut),
  INDEX idx_demande_priorite (priorite),
  INDEX idx_demande_actives (est_supprime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. interventions
CREATE TABLE interventions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  demande_id BIGINT UNSIGNED NULL,
  vehicule_immatriculation VARCHAR(30) NOT NULL,
  intervenant_id BIGINT UNSIGNED NOT NULL,
  type_intervention VARCHAR(100) NULL COMMENT 'vidange, freins, pneus, revision, moteur, carrosserie, electricite, autre',
  severite VARCHAR(30) DEFAULT 'normale' COMMENT 'mineure, normale, majeure, critique',
  date_debut DATETIME NULL,
  date_fin DATETIME NULL,
  duree_minutes INT NULL,
  duree_estimee_heures INT NULL,
  km_au_moment_intervention BIGINT NULL,
  diagnostic TEXT NULL,
  resultat VARCHAR(100) DEFAULT 'en_attente' COMMENT 'en_attente, en_cours, termine, partiel',
  cout_main_oeuvre DECIMAL(12,2) DEFAULT 0,
  cout_pieces DECIMAL(12,2) DEFAULT 0,
  cout_total DECIMAL(14,2) GENERATED ALWAYS AS (cout_main_oeuvre + cout_pieces) VIRTUAL,
  documents JSON NULL COMMENT 'Photos, factures',
  notes TEXT NULL,
  statut VARCHAR(50) DEFAULT 'planifiee' COMMENT 'planifiee, en_cours, terminee, annulee',
  est_supprime TINYINT(1) DEFAULT 0,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  date_suppression TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_interv_vehicule (vehicule_immatriculation),
  INDEX idx_interv_intervenant (intervenant_id),
  INDEX idx_interv_demande (demande_id),
  INDEX idx_interv_statut (statut),
  INDEX idx_interv_dates (date_debut, date_fin),
  INDEX idx_interv_actives (est_supprime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- GESTION STOCK PIÈCES
-- ============================================================================

-- 16. pieces_detachees
CREATE TABLE pieces_detachees (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(100) NULL COMMENT 'Référence',
  nom VARCHAR(200) NOT NULL,
  type_piece VARCHAR(100) NULL COMMENT 'moteur, freinage, suspension, electrique, carrosserie, consommable',
  description TEXT NULL,
  quantite_stock DECIMAL(12,2) DEFAULT 0,
  seuil_alerte DECIMAL(12,2) DEFAULT 0,
  unite VARCHAR(50) DEFAULT 'unite' COMMENT 'unite, litre, kg, metre',
  prix_unitaire DECIMAL(12,2) DEFAULT 0,
  fournisseur_id INT UNSIGNED NULL,
  emplacement VARCHAR(150) NULL,
  est_actif TINYINT(1) DEFAULT 1,
  est_supprime TINYINT(1) DEFAULT 0,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  date_suppression TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_pieces_nom (nom),
  INDEX idx_pieces_sku (sku),
  INDEX idx_pieces_fournisseur (fournisseur_id),
  INDEX idx_pieces_type (type_piece),
  INDEX idx_pieces_actives (est_supprime, est_actif)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. prelevements_pieces
CREATE TABLE prelevements_pieces (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  intervention_id BIGINT UNSIGNED NOT NULL,
  piece_id BIGINT UNSIGNED NOT NULL,
  quantite DECIMAL(12,2) NOT NULL,
  prix_unitaire DECIMAL(12,2) NOT NULL,
  cout_total DECIMAL(14,2) GENERATED ALWAYS AS (quantite * prix_unitaire) VIRTUAL,
  preleve_par_user_id BIGINT UNSIGNED NOT NULL,
  date_prelevement DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT NULL,
  INDEX idx_prelpiec_intervention (intervention_id),
  INDEX idx_prelpiec_piece (piece_id),
  INDEX idx_prelpiec_preleve_par (preleve_par_user_id),
  INDEX idx_prelpiec_date (date_prelevement)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. mouvements_stock
CREATE TABLE mouvements_stock (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  piece_id BIGINT UNSIGNED NOT NULL,
  type_mouvement VARCHAR(50) NOT NULL COMMENT 'entree, sortie, ajustement, retour',
  quantite DECIMAL(12,2) NOT NULL COMMENT 'Positif = entrée, Négatif = sortie',
  prix_unitaire DECIMAL(12,2) NULL,
  type_reference VARCHAR(100) NULL COMMENT 'intervention, commande, inventaire, autre',
  reference_id BIGINT NULL,
  effectue_par_user_id BIGINT UNSIGNED NULL,
  fournisseur_id INT UNSIGNED NULL,
  notes TEXT NULL,
  chemin_document VARCHAR(255) NULL COMMENT 'Facture, bon',
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mouvstock_piece (piece_id),
  INDEX idx_mouvstock_date (date_creation DESC),
  INDEX idx_mouvstock_type (type_mouvement),
  INDEX idx_mouvstock_piece_date (piece_id, date_creation DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- GESTION OUTILS
-- ============================================================================

-- 19. outils
CREATE TABLE outils (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(200) NOT NULL,
  type VARCHAR(100) NULL,
  categorie VARCHAR(100) NULL COMMENT 'moteur, direction, frein, electrique, general',
  etat VARCHAR(50) DEFAULT 'OK' COMMENT 'OK, HS, en_reparation',
  emplacement VARCHAR(150) NULL,
  date_dernier_controle DATE NULL,
  notes TEXT NULL,
  est_supprime TINYINT(1) DEFAULT 0,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  date_suppression TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_outils_etat (etat),
  INDEX idx_outils_categorie (categorie),
  INDEX idx_outils_actifs (est_supprime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. problemes_outils
CREATE TABLE problemes_outils (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  outil_id BIGINT UNSIGNED NOT NULL,
  signale_par_user_id BIGINT UNSIGNED NOT NULL,
  description_probleme TEXT NOT NULL,
  photos JSON NULL,
  statut VARCHAR(50) DEFAULT 'signale' COMMENT 'signale, en_reparation, repare, irreparable',
  date_signalement DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_resolution DATETIME NULL,
  notes_resolution TEXT NULL,
  est_supprime TINYINT(1) DEFAULT 0,
  date_suppression TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_pboutil_outil (outil_id),
  INDEX idx_pboutil_statut (statut),
  INDEX idx_pboutil_actifs (est_supprime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- MAINTENANCE PRÉVENTIVE
-- ============================================================================

-- 21. regles_maintenance
CREATE TABLE regles_maintenance (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type_maintenance VARCHAR(150) NOT NULL COMMENT 'vidange_simple, vidange_complete, vidange_boite, revision, etc',
  description TEXT NULL,
  type_declencheur VARCHAR(10) NOT NULL COMMENT 'km, date, mixte',
  valeur_km BIGINT NULL COMMENT 'Tous les X km',
  valeur_mois INT NULL COMMENT 'Tous les X mois',
  type_vehicule VARCHAR(60) NULL COMMENT 'NULL = tous, sinon 4x4, berline...',
  duree_estimee_heures INT NULL,
  cout_estime DECIMAL(12,2) NULL,
  est_actif TINYINT(1) DEFAULT 1,
  est_supprime TINYINT(1) DEFAULT 0,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  date_suppression TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_reglemaint_type (type_maintenance),
  INDEX idx_reglemaint_actives (est_supprime, est_actif)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. planning_maintenance
CREATE TABLE planning_maintenance (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicule_immatriculation VARCHAR(30) NOT NULL,
  regle_id BIGINT UNSIGNED NULL,
  type_maintenance VARCHAR(150) NOT NULL,
  description TEXT NULL,
  frequence_km INT NULL,
  frequence_mois INT NULL,
  date_derniere_realisation DATE NULL,
  km_derniere_realisation BIGINT NULL,
  derniere_intervention_id BIGINT UNSIGNED NULL,
  prochaine_echeance_date DATE NULL,
  prochaine_echeance_km BIGINT NULL,
  statut VARCHAR(50) DEFAULT 'a_planifier' COMMENT 'a_planifier, planifiee, en_retard, faite, annulee',
  est_supprime TINYINT(1) DEFAULT 0,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  date_suppression TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_planmaint_vehicule (vehicule_immatriculation),
  INDEX idx_planmaint_regle (regle_id),
  INDEX idx_planmaint_statut (statut),
  INDEX idx_planmaint_echeances (prochaine_echeance_date, prochaine_echeance_km),
  INDEX idx_planmaint_actifs (est_supprime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- INSPECTIONS TECHNIQUES (RESTRUCTURÉES - LOGIQUE FACTURE)
-- ============================================================================

-- 23. inspections
CREATE TABLE inspections (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  inspecteur_user_id BIGINT UNSIGNED NULL COMMENT 'Mécanicien qui inspecte',
  type_inspection VARCHAR(100) DEFAULT 'quotidienne' COMMENT 'quotidienne, hebdomadaire, complete, periodique',
  date_inspection DATETIME NOT NULL,
  nom_verificateurs VARCHAR(255) NULL,
  autres_constats TEXT NULL,
  notes TEXT NULL,
  chemin_rapport_pdf VARCHAR(255) NULL,
  est_supprime TINYINT(1) DEFAULT 0,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  date_suppression TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_inspections_inspecteur (inspecteur_user_id),
  INDEX idx_inspections_date (date_inspection),
  INDEX idx_inspections_type (type_inspection),
  INDEX idx_inspections_actives (est_supprime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. inspections_vehicules
CREATE TABLE inspections_vehicules (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  inspection_id BIGINT UNSIGNED NOT NULL,
  vehicule_immatriculation VARCHAR(30) NOT NULL,
  km_au_moment_inspection BIGINT NULL,
  statut_global VARCHAR(50) DEFAULT 'conforme' COMMENT 'conforme, non_conforme, danger_immediat',
  anomalies_detectees TINYINT(1) DEFAULT 0,
  anomalie_creee_id BIGINT UNSIGNED NULL COMMENT 'ID anomalie créée si problème',
  observations_vehicule TEXT NULL,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_inspveh_inspection (inspection_id),
  INDEX idx_inspveh_vehicule (vehicule_immatriculation),
  INDEX idx_inspveh_statut (statut_global)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 25. checklist_actions
CREATE TABLE checklist_actions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  inspection_vehicule_id BIGINT UNSIGNED NOT NULL,
  categorie VARCHAR(100) NOT NULL COMMENT 'accessoires, niveaux_fluides, pneumatiques, carrosserie, freinage, direction, electricite, equipements_securite',
  element_verifie VARCHAR(150) NOT NULL COMMENT 'visite_technique, carte_grise, extincteur, niveau_huile_moteur, pneus_avant, freins, etc.',
  statut VARCHAR(30) DEFAULT 'OK' COMMENT 'OK, NOK, manquant, use, defectueux',
  valeur_relevee VARCHAR(100) NULL COMMENT 'Ex: pression pneus 2.5 bars, niveau huile OK, usure plaquettes 30%',
  commentaire TEXT NULL,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_checkact_insp_veh (inspection_vehicule_id),
  INDEX idx_checkact_categorie (categorie),
  INDEX idx_checkact_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- GESTION ACCIDENTS
-- ============================================================================

-- 26. accidents
CREATE TABLE accidents (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicule_immatriculation VARCHAR(30) NOT NULL,
  chauffeur_user_id BIGINT UNSIGNED NULL,
  mission_id BIGINT UNSIGNED NULL,
  date_accident DATETIME NOT NULL,
  lieu VARCHAR(255) NULL,
  position_gps VARCHAR(100) NULL,
  description TEXT NULL,
  type_responsabilite VARCHAR(100) NULL COMMENT 'responsable, non_responsable, partagee, incertain',
  niveau_degats VARCHAR(50) NULL COMMENT 'legers, moyens, importants, tres_graves',
  chemin_rapport_police VARCHAR(255) NULL,
  photos JSON NULL,
  vehicule_immobilise TINYINT(1) DEFAULT 0,
  jours_immobilisation INT NULL,
  km_au_moment_accident BIGINT NULL,
  assure TINYINT(1) DEFAULT 0,
  cout_estime DECIMAL(14,2) DEFAULT 0,
  cout_reparation_final DECIMAL(14,2) NULL,
  montant_reclame_assurance DECIMAL(14,2) NULL,
  montant_verse_assurance DECIMAL(14,2) NULL,
  statut VARCHAR(50) DEFAULT 'declare' COMMENT 'declare, expertise, en_reparation, cloture',
  notes TEXT NULL,
  est_supprime TINYINT(1) DEFAULT 0,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  date_suppression TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_acc_vehicule (vehicule_immatriculation),
  INDEX idx_acc_chauffeur (chauffeur_user_id),
  INDEX idx_acc_date (date_accident),
  INDEX idx_acc_statut (statut),
  INDEX idx_acc_mission (mission_id),
  INDEX idx_acc_actifs (est_supprime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- GESTION CARBURANT
-- ============================================================================

-- 27. carnets_carburant
CREATE TABLE carnets_carburant (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicule_immatriculation VARCHAR(30) NOT NULL,
  mission_id BIGINT UNSIGNED NULL,
  date_plein DATE NOT NULL,
  kilometrage BIGINT NULL,
  litres DECIMAL(12,2) NOT NULL,
  prix_unitaire DECIMAL(12,4) NULL,
  cout_total DECIMAL(14,2) GENERATED ALWAYS AS (litres * COALESCE(prix_unitaire,0)) VIRTUAL,
  station VARCHAR(200) NULL,
  chemin_recu VARCHAR(255) NULL,
  km_depuis_dernier_plein BIGINT NULL,
  consommation_calculee DECIMAL(10,2) NULL COMMENT 'L/100km',
  notes TEXT NULL,
  est_supprime TINYINT(1) DEFAULT 0,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  date_suppression TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_carburant_vehicule (vehicule_immatriculation),
  INDEX idx_carburant_date (date_plein),
  INDEX idx_carburant_mission (mission_id),
  INDEX idx_carburant_actifs (est_supprime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DOCUMENTS CHAUFFEURS
-- ============================================================================

-- 28. documents_chauffeurs
CREATE TABLE documents_chauffeurs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  chauffeur_user_id BIGINT UNSIGNED NOT NULL,
  type_document VARCHAR(100) NOT NULL COMMENT 'permis_conduire, certificat_medical, autre',
  nom_document VARCHAR(255) NOT NULL,
  chemin_fichier VARCHAR(255) NOT NULL,
  numero_permis VARCHAR(100) NULL,
  categories_permis VARCHAR(100) NULL COMMENT 'A, B, C, D, E',
  pays_delivrance VARCHAR(100) NULL,
  date_delivrance DATE NULL,
  date_expiration DATE NULL,
  telecharge_par_user_id BIGINT UNSIGNED NULL,
  notes TEXT NULL,
  est_supprime TINYINT(1) DEFAULT 0,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  date_suppression TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_docchauf_chauffeur (chauffeur_user_id),
  INDEX idx_docchauf_type (type_document),
  INDEX idx_docchauf_expiration (date_expiration),
  INDEX idx_docchauf_actifs (est_supprime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- KPI & STATISTIQUES
-- ============================================================================

-- 29. performances_chauffeurs
CREATE TABLE performances_chauffeurs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  chauffeur_user_id BIGINT UNSIGNED NOT NULL,
  date_debut_periode DATE NOT NULL,
  date_fin_periode DATE NOT NULL,
  total_missions INT DEFAULT 0,
  total_km BIGINT DEFAULT 0,
  total_duree_minutes INT DEFAULT 0,
  nb_accidents INT DEFAULT 0,
  nb_anomalies_signalees INT DEFAULT 0,
  consommation_moyenne DECIMAL(10,2) NULL COMMENT 'L/100km',
  score_performance DECIMAL(5,2) NULL COMMENT 'Sur 100',
  notes TEXT NULL,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_perfchauf_chauffeur (chauffeur_user_id),
  INDEX idx_perfchauf_periode (date_debut_periode, date_fin_periode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 30. kpi_vehicules
CREATE TABLE kpi_vehicules (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicule_immatriculation VARCHAR(30) NOT NULL,
  annee_periode INT NOT NULL,
  mois_periode INT NOT NULL,
  jours_disponible INT DEFAULT 0,
  jours_mission INT DEFAULT 0,
  jours_maintenance INT DEFAULT 0,
  jours_immobilise INT DEFAULT 0,
  taux_disponibilite DECIMAL(5,2) GENERATED ALWAYS AS
    (CASE WHEN (jours_disponible + jours_mission + jours_maintenance + jours_immobilise) > 0
     THEN (jours_disponible * 100.0) / (jours_disponible + jours_mission + jours_maintenance + jours_immobilise)
     ELSE 0 END) VIRTUAL,
  total_missions INT DEFAULT 0,
  total_km_missions BIGINT DEFAULT 0,
  total_interventions INT DEFAULT 0,
  total_duree_interventions_heures DECIMAL(10,2) DEFAULT 0,
  cout_missions DECIMAL(14,2) DEFAULT 0,
  cout_interventions DECIMAL(14,2) DEFAULT 0,
  cout_pieces DECIMAL(14,2) DEFAULT 0,
  cout_total DECIMAL(14,2) GENERATED ALWAYS AS (cout_missions + cout_interventions + cout_pieces) VIRTUAL,
  cout_par_km DECIMAL(10,2) NULL,
  nb_anomalies INT DEFAULT 0,
  nb_accidents INT DEFAULT 0,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_kpiveh_vehicule (vehicule_immatriculation),
  INDEX idx_kpiveh_periode (annee_periode, mois_periode),
  UNIQUE KEY uk_kpiveh_vehicule_periode (vehicule_immatriculation, annee_periode, mois_periode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SYSTÈME DE NOTIFICATIONS (RESTRUCTURÉ)
-- ============================================================================

-- 31. categories_notifications
CREATE TABLE categories_notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE COMMENT 'alerte_critique_email, alerte_importante, info_in_app, alerte_tf, alerte_inspection, etc.',
  libelle VARCHAR(200) NOT NULL,
  niveau_priorite VARCHAR(30) DEFAULT 'normal' COMMENT 'critique, important, a_surveiller, normal',
  canaux JSON NOT NULL COMMENT '["email", "popup", "in_app"] ou ["in_app"]',
  roles_cibles JSON NULL COMMENT 'Array codes rôles ["chef_parc", "chef_tf", "mecanicien"]',
  description TEXT NULL,
  est_actif TINYINT(1) DEFAULT 1,
  est_supprime TINYINT(1) DEFAULT 0,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  date_suppression TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_catnotif_code (code),
  INDEX idx_catnotif_priorite (niveau_priorite),
  INDEX idx_catnotif_actives (est_supprime, est_actif)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 32. notifications
CREATE TABLE notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL COMMENT 'NULL = broadcast',
  categorie_id INT UNSIGNED NOT NULL COMMENT 'FK vers categories_notifications',
  titre VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  vehicule_immatriculation VARCHAR(30) NULL,
  donnees JSON NULL COMMENT 'Données contextuelles supplémentaires',
  lien_url VARCHAR(255) NULL,
  est_lue TINYINT(1) DEFAULT 0,
  date_lecture TIMESTAMP NULL,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_user (user_id),
  INDEX idx_notif_categorie (categorie_id),
  INDEX idx_notif_vehicule (vehicule_immatriculation),
  INDEX idx_notif_non_lues (user_id, est_lue, date_creation DESC),
  INDEX idx_notif_date (date_creation DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SYSTÈME & CONFIGURATION
-- ============================================================================

-- 33. parametres_alertes
CREATE TABLE parametres_alertes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type_alerte VARCHAR(100) NOT NULL COMMENT 'vidange, assurance, visite_technique, stock_piece, immobilisation, etc',
  condition_declenchement VARCHAR(255) NOT NULL,
  valeur_seuil INT NULL COMMENT 'km, jours, quantité',
  categorie_notification_id INT UNSIGNED NULL COMMENT 'FK vers categories_notifications',
  message_template TEXT NULL,
  est_actif TINYINT(1) DEFAULT 1,
  est_supprime TINYINT(1) DEFAULT 0,
  date_creation TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  date_suppression TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_paramalert_type (type_alerte),
  INDEX idx_paramalert_actives (est_supprime, est_actif)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 34. journaux_audit
CREATE TABLE journaux_audit (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  action VARCHAR(100) NOT NULL COMMENT 'create, update, delete, login, logout',
  nom_table VARCHAR(100) NULL,
  id_enregistrement VARCHAR(100) NULL COMMENT 'Peut être immatriculation ou ID selon table',
  anciennes_valeurs JSON NULL,
  nouvelles_valeurs JSON NULL,
  adresse_ip VARCHAR(45) NULL,
  user_agent TEXT NULL,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_table (nom_table, id_enregistrement),
  INDEX idx_audit_action (action),
  INDEX idx_audit_date (date_creation DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CONTRAINTES D'INTÉGRITÉ (FOREIGN KEYS) - VERSION CORRIGÉE
-- ============================================================================

-- GROUP 1: Tables de base
ALTER TABLE utilisateurs
  ADD CONSTRAINT fk_utilisateurs_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT fk_utilisateurs_direction FOREIGN KEY (direction_id) REFERENCES directions(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE intervenants
  ADD CONSTRAINT fk_intervenants_user FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE vehicules
  ADD CONSTRAINT fk_vehicules_direction FOREIGN KEY (direction_id) REFERENCES directions(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE documents_vehicules
  ADD CONSTRAINT fk_docveh_vehicule FOREIGN KEY (vehicule_immatriculation) REFERENCES vehicules(immatriculation) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_docveh_telecharge_par FOREIGN KEY (telecharge_par_user_id) REFERENCES utilisateurs(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE pieces_detachees
  ADD CONSTRAINT fk_pieces_fournisseur FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- GROUP 2: Missions et PC Radio
ALTER TABLE missions
  ADD CONSTRAINT fk_missions_vehicule FOREIGN KEY (vehicule_immatriculation) REFERENCES vehicules(immatriculation) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_missions_chauffeur FOREIGN KEY (chauffeur_user_id) REFERENCES utilisateurs(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT fk_missions_direction FOREIGN KEY (direction_id) REFERENCES directions(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE pc_radio
  ADD CONSTRAINT fk_pcradio_vehicule FOREIGN KEY (vehicule_immatriculation) REFERENCES vehicules(immatriculation) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_pcradio_chauffeur FOREIGN KEY (chauffeur_user_id) REFERENCES utilisateurs(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT fk_pcradio_mission FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_pcradio_agent FOREIGN KEY (agent_pc_radio_user_id) REFERENCES utilisateurs(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE anomalies_pc_radio
  ADD CONSTRAINT fk_anom_pcradio_pc FOREIGN KEY (pc_radio_id) REFERENCES pc_radio(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_anom_pcradio_vehicule FOREIGN KEY (vehicule_immatriculation) REFERENCES vehicules(immatriculation) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_anom_pcradio_chauffeur FOREIGN KEY (chauffeur_user_id) REFERENCES utilisateurs(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- GROUP 3: Historique et alertes
ALTER TABLE historique_kilometrage
  ADD CONSTRAINT fk_histokm_vehicule FOREIGN KEY (vehicule_immatriculation) REFERENCES vehicules(immatriculation) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_histokm_enregistre_par FOREIGN KEY (enregistre_par_user_id) REFERENCES utilisateurs(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE alertes_kilometrage
  ADD CONSTRAINT fk_alertkm_vehicule FOREIGN KEY (vehicule_immatriculation) REFERENCES vehicules(immatriculation) ON DELETE CASCADE ON UPDATE CASCADE;

-- GROUP 4: Inspections
ALTER TABLE inspections
  ADD CONSTRAINT fk_inspections_inspecteur FOREIGN KEY (inspecteur_user_id) REFERENCES utilisateurs(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE inspections_vehicules
  ADD CONSTRAINT fk_inspveh_inspection FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_inspveh_vehicule FOREIGN KEY (vehicule_immatriculation) REFERENCES vehicules(immatriculation) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE checklist_actions
  ADD CONSTRAINT fk_checkact_insp_veh FOREIGN KEY (inspection_vehicule_id) REFERENCES inspections_vehicules(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- GROUP 5: Anomalies
ALTER TABLE anomalies
  ADD CONSTRAINT fk_anomalies_vehicule FOREIGN KEY (vehicule_immatriculation) REFERENCES vehicules(immatriculation) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_anomalies_signalee_par FOREIGN KEY (signalee_par_user_id) REFERENCES utilisateurs(id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_anomalies_mission FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_anomalies_inspection FOREIGN KEY (inspection_vehicule_id) REFERENCES inspections_vehicules(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- GROUP 6: FK circulaire
ALTER TABLE inspections_vehicules
  ADD CONSTRAINT fk_inspveh_anomalie FOREIGN KEY (anomalie_creee_id) REFERENCES anomalies(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- GROUP 7: Demandes et Interventions (CORRIGÉ)
ALTER TABLE demandes_intervention
  ADD CONSTRAINT fk_demande_anomalie FOREIGN KEY (anomalie_id) REFERENCES anomalies(id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_demande_vehicule FOREIGN KEY (vehicule_immatriculation) REFERENCES vehicules(immatriculation) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_demande_demandeur FOREIGN KEY (demandeur_user_id) REFERENCES utilisateurs(id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_demande_validee_par FOREIGN KEY (validee_par_user_id) REFERENCES utilisateurs(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE interventions
  ADD CONSTRAINT fk_interv_demande FOREIGN KEY (demande_id) REFERENCES demandes_intervention(id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_interv_vehicule FOREIGN KEY (vehicule_immatriculation) REFERENCES vehicules(immatriculation) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_interv_intervenant FOREIGN KEY (intervenant_id) REFERENCES intervenants(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- GROUP 8: Prélèvements et Stock
ALTER TABLE prelevements_pieces
  ADD CONSTRAINT fk_prelpiec_intervention FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_prelpiec_piece FOREIGN KEY (piece_id) REFERENCES pieces_detachees(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT fk_prelpiec_preleve_par FOREIGN KEY (preleve_par_user_id) REFERENCES utilisateurs(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE mouvements_stock
  ADD CONSTRAINT fk_mouvstock_piece FOREIGN KEY (piece_id) REFERENCES pieces_detachees(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_mouvstock_effectue_par FOREIGN KEY (effectue_par_user_id) REFERENCES utilisateurs(id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_mouvstock_fournisseur FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- GROUP 9: Outils
ALTER TABLE problemes_outils
  ADD CONSTRAINT fk_pboutil_outil FOREIGN KEY (outil_id) REFERENCES outils(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_pboutil_signale_par FOREIGN KEY (signale_par_user_id) REFERENCES utilisateurs(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- GROUP 10: Planning Maintenance
ALTER TABLE planning_maintenance
  ADD CONSTRAINT fk_planmaint_vehicule FOREIGN KEY (vehicule_immatriculation) REFERENCES vehicules(immatriculation) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_planmaint_regle FOREIGN KEY (regle_id) REFERENCES regles_maintenance(id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_planmaint_derniere_interv FOREIGN KEY (derniere_intervention_id) REFERENCES interventions(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- GROUP 11: Accidents
ALTER TABLE accidents
  ADD CONSTRAINT fk_accidents_vehicule FOREIGN KEY (vehicule_immatriculation) REFERENCES vehicules(immatriculation) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_accidents_chauffeur FOREIGN KEY (chauffeur_user_id) REFERENCES utilisateurs(id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_accidents_mission FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- GROUP 12: Carburant
ALTER TABLE carnets_carburant
  ADD CONSTRAINT fk_carburant_vehicule FOREIGN KEY (vehicule_immatriculation) REFERENCES vehicules(immatriculation) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_carburant_mission FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- GROUP 13: Documents Chauffeurs
ALTER TABLE documents_chauffeurs
  ADD CONSTRAINT fk_docchauf_chauffeur FOREIGN KEY (chauffeur_user_id) REFERENCES utilisateurs(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_docchauf_telecharge_par FOREIGN KEY (telecharge_par_user_id) REFERENCES utilisateurs(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE performances_chauffeurs
  ADD CONSTRAINT fk_perfchauf_chauffeur FOREIGN KEY (chauffeur_user_id) REFERENCES utilisateurs(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- GROUP 14: KPI
ALTER TABLE kpi_vehicules
  ADD CONSTRAINT fk_kpiveh_vehicule FOREIGN KEY (vehicule_immatriculation) REFERENCES vehicules(immatriculation) ON DELETE CASCADE ON UPDATE CASCADE;

-- GROUP 15: Notifications
ALTER TABLE notifications
  ADD CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_notifications_categorie FOREIGN KEY (categorie_id) REFERENCES categories_notifications(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT fk_notifications_vehicule FOREIGN KEY (vehicule_immatriculation) REFERENCES vehicules(immatriculation) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE parametres_alertes
  ADD CONSTRAINT fk_paramalert_categorie FOREIGN KEY (categorie_notification_id) REFERENCES categories_notifications(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- GROUP 16: Audit
ALTER TABLE journaux_audit
  ADD CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- TRIGGERS (Automatisation)
-- ============================================================================

DELIMITER $

-- Trigger 1: MAJ cout_pieces après prélèvement
DROP TRIGGER IF EXISTS trg_maj_cout_pieces$
CREATE TRIGGER trg_maj_cout_pieces
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
END$

DROP TRIGGER IF EXISTS trg_maj_cout_pieces_suppr$
CREATE TRIGGER trg_maj_cout_pieces_suppr
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
END$

-- Trigger 2: MAJ stock après prélèvement
DROP TRIGGER IF EXISTS trg_maj_stock_apres_prelevement$
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
    NEW.piece_id, 'sortie', -NEW.quantite, NEW.prix_unitaire,
    'intervention', NEW.intervention_id, NEW.preleve_par_user_id
  );
END$

-- Trigger 3: MAJ km véhicule après mission
DROP TRIGGER IF EXISTS trg_maj_km_apres_mission$
CREATE TRIGGER trg_maj_km_apres_mission
AFTER UPDATE ON missions
FOR EACH ROW
BEGIN
  IF NEW.statut = 'terminee' AND NEW.km_retour IS NOT NULL AND 
     (OLD.km_retour IS NULL OR NEW.km_retour > OLD.km_retour) AND
     NEW.est_supprime = 0 THEN
    
    UPDATE vehicules 
    SET kilometrage = NEW.km_retour,
        date_maj_km = DATE(NEW.date_retour_reelle)
    WHERE immatriculation = NEW.vehicule_immatriculation AND est_supprime = 0;
    
    INSERT INTO historique_kilometrage (
      vehicule_immatriculation, kilometrage, date_relevee, source, source_id, enregistre_par_user_id
    ) VALUES (
      NEW.vehicule_immatriculation, NEW.km_retour, DATE(NEW.date_retour_reelle), 
      'mission', NEW.id, NEW.chauffeur_user_id
    );
  END IF;
END$

-- Trigger 4: MAJ km après PC Radio
DROP TRIGGER IF EXISTS trg_maj_km_apres_pcradio$
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
      'pc_radio', NEW.id, NEW.agent_pc_radio_user_id
    );
  END IF;
END$

-- Trigger 5: Changement statut véhicule selon mission
DROP TRIGGER IF EXISTS trg_statut_veh_mission$
CREATE TRIGGER trg_statut_veh_mission
AFTER UPDATE ON missions
FOR EACH ROW
BEGIN
  IF NEW.est_supprime = 0 THEN
    IF OLD.statut = 'planifiee' AND NEW.statut = 'en_cours' THEN
      UPDATE vehicules 
      SET statut = 'en_mission' 
      WHERE immatriculation = NEW.vehicule_immatriculation AND est_supprime = 0;
    END IF;
    
    IF OLD.statut = 'en_cours' AND NEW.statut IN ('terminee', 'annulee') THEN
      UPDATE vehicules 
      SET statut = 'disponible' 
      WHERE immatriculation = NEW.vehicule_immatriculation AND est_supprime = 0;
    END IF;
  END IF;
END$

-- Trigger 6: Changement statut véhicule selon intervention
DROP TRIGGER IF EXISTS trg_statut_veh_intervention$
CREATE TRIGGER trg_statut_veh_intervention
AFTER UPDATE ON interventions
FOR EACH ROW
BEGIN
  IF NEW.est_supprime = 0 THEN
    IF OLD.statut != 'en_cours' AND NEW.statut = 'en_cours' THEN
      UPDATE vehicules 
      SET statut = 'en_maintenance' 
      WHERE immatriculation = NEW.vehicule_immatriculation AND est_supprime = 0;
    END IF;
    
    IF OLD.statut = 'en_cours' AND NEW.statut IN ('terminee', 'annulee') THEN
      UPDATE vehicules 
      SET statut = 'disponible' 
      WHERE immatriculation = NEW.vehicule_immatriculation AND est_supprime = 0;
    END IF;
  END IF;
END$

-- Trigger 7: Immobilisation véhicule si inspection "danger_immediat"
DROP TRIGGER IF EXISTS trg_immobilisation_inspection_danger$
CREATE TRIGGER trg_immobilisation_inspection_danger
AFTER INSERT ON inspections_vehicules
FOR EACH ROW
BEGIN
  IF NEW.statut_global = 'danger_immediat' THEN
    UPDATE vehicules
    SET statut = 'immobilise',
        date_immobilisation = NOW()
    WHERE immatriculation = NEW.vehicule_immatriculation AND est_supprime = 0;
  END IF;
END$

-- Trigger 8: Notification stock faible
DROP TRIGGER IF EXISTS trg_notif_stock_faible$
CREATE TRIGGER trg_notif_stock_faible
AFTER UPDATE ON pieces_detachees
FOR EACH ROW
BEGIN
  DECLARE cat_id INT;
  
  IF NEW.quantite_stock <= NEW.seuil_alerte AND 
     OLD.quantite_stock > OLD.seuil_alerte AND
     NEW.est_supprime = 0 THEN
    
    SELECT id INTO cat_id 
    FROM categories_notifications 
    WHERE code = 'alerte_stock_faible' AND est_supprime = 0 
    LIMIT 1;
    
    IF cat_id IS NOT NULL THEN
      INSERT INTO notifications (
        user_id, categorie_id, titre, message, donnees, date_creation
      ) VALUES (
        NULL, 
        cat_id,
        CONCAT('Stock faible: ', NEW.nom),
        CONCAT('La pièce "', NEW.nom, '" a atteint le seuil d\'alerte. Stock actuel: ', NEW.quantite_stock, ' ', NEW.unite),
        JSON_OBJECT('piece_id', NEW.id, 'quantite_stock', NEW.quantite_stock, 'seuil_alerte', NEW.seuil_alerte),
        NOW()
      );
    END IF;
  END IF;
END$

DELIMITER ;

-- ============================================================================
-- DONNÉES INITIALES (SEEDERS)
-- ============================================================================

-- Rôles
INSERT INTO roles (code, libelle, description) VALUES
('admin', 'Super Administrateur', 'Accès complet système'),
('chef_parc', 'Gestionnaire du Parc', 'Gestion globale parc automobile'),
('chef_tf', 'Chef Transport de Fonds', 'Gestion missions TF + chauffeurs TF'),
('agent_pc_radio', 'Agent PC Radio', 'Traçabilité remise/retour clés véhicules'),
('mecanicien', 'Mécanicien / Technicien', 'Interventions + Inspections techniques'),
('chauffeur', 'Chauffeur', 'Exécution missions + signalement anomalies');

-- Catégories de notifications
INSERT INTO categories_notifications (code, libelle, niveau_priorite, canaux, roles_cibles, description) VALUES
('alerte_critique_email', 'Alerte Critique (Email + Popup)', 'critique', '["email", "popup", "in_app"]', '["admin", "chef_parc", "chef_tf"]', 'Véhicule immobilisé, accident, rupture stock critique'),
('alerte_importante', 'Alerte Importante', 'important', '["email", "in_app"]', '["chef_parc", "chef_tf"]', 'Vidange proche, assurance expire, demande > 48h'),
('alerte_surveiller', 'À Surveiller', 'a_surveiller', '["in_app"]', '["chef_parc", "chef_tf"]', 'Stock faible, maintenance planifiée proche'),
('info_in_app', 'Information', 'normal', '["in_app"]', '["chef_parc", "mecanicien", "chauffeur"]', 'Mission assignée, intervention terminée'),
('alerte_tf', 'Alerte Transport de Fonds', 'important', '["email", "in_app"]', '["chef_tf"]', 'Anomalie véhicule TF, inspection non conforme TF'),
('alerte_inspection', 'Alerte Inspection', 'critique', '["email", "popup", "in_app"]', '["chef_parc", "chef_tf", "admin"]', 'Inspection danger immédiat'),
('alerte_stock_faible', 'Stock Faible', 'a_surveiller', '["in_app"]', '["chef_parc"]', 'Stock pièce en dessous du seuil'),
('alerte_accident', 'Accident Déclaré', 'critique', '["email", "popup", "in_app", "sms"]', '["admin", "chef_parc", "chef_tf"]', 'Accident véhicule déclaré'),
('alerte_anomalie_pcradio', 'Anomalie PC Radio', 'important', '["email", "in_app"]', '["chef_parc", "chef_tf"]', 'Dégâts détectés au retour PC Radio'),
('info_chauffeur', 'Information Chauffeur', 'normal', '["in_app"]', '["chauffeur"]', 'Mission assignée, permis expire, anomalie résolue');

-- Configuration alertes par défaut
INSERT INTO parametres_alertes (type_alerte, condition_declenchement, valeur_seuil, categorie_notification_id, message_template, est_actif) VALUES
('vidange', 'km_restants <= seuil', 1000, 2, 'Vidange proche pour {vehicule}: {km_restants} km restants', 1),
('assurance', 'jours_avant_expiration <= seuil', 60, 2, 'Assurance expire dans {jours} jours pour {vehicule}', 1),
('visite_technique', 'jours_avant_expiration <= seuil', 30, 2, 'Visite technique expire dans {jours} jours pour {vehicule}', 1),
('permis_expire', 'jours_avant_expiration <= seuil', 30, 2, 'Permis de {chauffeur} expire dans {jours} jours', 1),
('immobilisation', 'jours_immobilisation > seuil', 7, 1, 'Véhicule {vehicule} immobilisé depuis {jours} jours', 1),
('stock_rupture', 'quantite <= seuil', 0, 1, 'Rupture stock: {piece}', 1),
('accident_declare', 'nouveau_accident', 0, 8, 'Accident déclaré: {vehicule} ({date})', 1),
('inspection_danger', 'danger_immediat', 0, 6, 'Inspection DANGER IMMÉDIAT: {vehicule} - Véhicule immobilisé', 1);

-- Règles maintenance préventive
INSERT INTO regles_maintenance (type_maintenance, description, type_declencheur, valeur_km, valeur_mois, est_actif) VALUES
('vidange_simple', 'Vidange huile moteur simple (5W40/10W40/15W40)', 'km', 5000, NULL, 1),
('vidange_complete', 'Vidange complète : huile moteur + tous filtres', 'km', 10000, NULL, 1),
('vidange_boite_manuelle', 'Vidange boîte de vitesses manuelle (80W-90)', 'km', 60000, NULL, 1),
('vidange_boite_automatique', 'Vidange boîte automatique (ATX)', 'km', 40000, NULL, 1),
('vidange_neuf', 'Première vidange véhicule neuf', 'km', 1500, NULL, 1),
('revision_complete', 'Révision complète tous points', 'km', 20000, NULL, 1),
('controle_freins', 'Vérification système freinage', 'mixte', 15000, 12, 1),
('permutation_pneus', 'Permutation et équilibrage pneus', 'km', 10000, NULL, 1),
('controle_climatisation', 'Vérification système climatisation', 'date', NULL, 12, 1);

SET FOREIGN_KEY_CHECKS=1;

-- ============================================================================
-- VUES UTILES
-- ============================================================================

-- Vue: Véhicules avec alertes
CREATE OR REPLACE VIEW v_vehicules_avec_alertes AS
SELECT
  v.immatriculation,
  v.marque,
  v.modele,
  v.type_vehicule,
  v.kilometrage,
  v.statut,
  v.jours_immobilisation,
  d.nom AS direction_nom,
  (SELECT COUNT(*) FROM alertes_kilometrage ak
   WHERE ak.vehicule_immatriculation = v.immatriculation AND ak.est_resolue = 0) AS nb_alertes_km,
  CASE
    WHEN v.date_expiration_assurance IS NOT NULL AND DATEDIFF(v.date_expiration_assurance, CURDATE()) <= 60
    THEN DATEDIFF(v.date_expiration_assurance, CURDATE())
    ELSE NULL
  END AS jours_avant_expiration_assurance,
  CASE
    WHEN v.date_expiration_visite_technique IS NOT NULL AND DATEDIFF(v.date_expiration_visite_technique, CURDATE()) <= 30
    THEN DATEDIFF(v.date_expiration_visite_technique, CURDATE())
    ELSE NULL
  END AS jours_avant_expiration_visite,
  (SELECT MAX(date_fin) FROM interventions i 
   WHERE i.vehicule_immatriculation = v.immatriculation AND i.statut = 'terminee' AND i.est_supprime = 0) AS derniere_intervention,
  (SELECT COUNT(*) FROM interventions i
   WHERE i.vehicule_immatriculation = v.immatriculation
   AND YEAR(i.date_debut) = YEAR(CURDATE())
   AND MONTH(i.date_debut) = MONTH(CURDATE())
   AND i.est_supprime = 0) AS nb_interventions_mois,
  (SELECT COUNT(*) FROM missions m
   WHERE m.vehicule_immatriculation = v.immatriculation
   AND m.statut = 'terminee'
   AND YEAR(m.date_retour_reelle) = YEAR(CURDATE())
   AND MONTH(m.date_retour_reelle) = MONTH(CURDATE())
   AND m.est_supprime = 0) AS nb_missions_mois
FROM vehicules v
LEFT JOIN directions d ON v.direction_id = d.id
WHERE v.est_actif = 1 AND v.est_supprime = 0;

-- Vue: Dashboard gestionnaire
CREATE OR REPLACE VIEW v_dashboard_gestionnaire AS
SELECT
  (SELECT COUNT(*) FROM vehicules WHERE est_actif = 1 AND est_supprime = 0) AS total_vehicules,
  (SELECT COUNT(*) FROM vehicules WHERE est_actif = 1 AND est_supprime = 0 AND statut = 'disponible') AS vehicules_disponibles,
  (SELECT COUNT(*) FROM vehicules WHERE est_actif = 1 AND est_supprime = 0 AND statut = 'en_mission') AS vehicules_en_mission,
  (SELECT COUNT(*) FROM vehicules WHERE est_actif = 1 AND est_supprime = 0 AND statut = 'en_maintenance') AS vehicules_en_maintenance,
  (SELECT COUNT(*) FROM vehicules WHERE est_actif = 1 AND est_supprime = 0 AND statut = 'immobilise') AS vehicules_immobilises,
  (SELECT COUNT(*) FROM vehicules WHERE est_actif = 1 AND est_supprime = 0 AND jours_immobilisation > 7) AS vehicules_immobilises_alerte,
  (SELECT COUNT(*) FROM missions WHERE statut = 'en_cours' AND est_supprime = 0) AS missions_en_cours,
  (SELECT COUNT(*) FROM missions WHERE statut = 'planifiee' AND date_depart_prevue >= CURDATE() AND est_supprime = 0) AS missions_planifiees,
  (SELECT COUNT(*) FROM demandes_intervention WHERE statut = 'en_attente' AND est_supprime = 0) AS demandes_intervention_attente,
  (SELECT COUNT(*) FROM interventions WHERE statut = 'en_cours' AND est_supprime = 0) AS interventions_en_cours,
  (SELECT COUNT(*) FROM anomalies WHERE statut IN ('ouverte', 'en_cours') AND est_supprime = 0) AS anomalies_ouvertes,
  (SELECT COUNT(*) FROM pieces_detachees WHERE quantite_stock <= seuil_alerte AND est_supprime = 0) AS pieces_stock_alerte,
  (SELECT COUNT(*) FROM outils WHERE etat = 'HS' AND est_supprime = 0) AS outils_defectueux,
  (SELECT COUNT(*) FROM pc_radio WHERE date_heure_retour IS NULL AND est_supprime = 0) AS vehicules_en_circulation_pcradio;

-- ============================================================================
-- INDEX SUPPLÉMENTAIRES POUR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_missions_vehicule_statut ON missions(vehicule_immatriculation, statut);
CREATE INDEX idx_interventions_vehicule_statut ON interventions(vehicule_immatriculation, statut);
CREATE INDEX idx_pieces_stock_alerte ON pieces_detachees(quantite_stock, seuil_alerte);
CREATE INDEX idx_vehicules_date_maj_km ON vehicules(date_maj_km);
CREATE INDEX idx_anomalies_vehicule_statut ON anomalies(vehicule_immatriculation, statut);
CREATE INDEX idx_pcradio_en_cours ON pc_radio(vehicule_immatriculation, date_heure_retour);
CREATE INDEX idx_inspveh_vehicule_date ON inspections_vehicules(vehicule_immatriculation);

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
SELECT 'Base de données FleetHub V4.0 créée avec succès!' AS message;
SELECT COUNT(*) AS nb_tables FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE';
