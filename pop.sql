-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Base de données : `fleethub_db`
-- Version finale complète optimisée
-- Date de génération : 2025-12-23
-- Total : 38 TABLES NUMÉROTÉES

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- ========================================
-- TABLES DE RÉFÉRENCE (01-08)
-- ========================================

-- --------------------------------------------------------
-- Table 01: roles
-- --------------------------------------------------------
CREATE TABLE `roles` (
  `id` int(10) UNSIGNED NOT NULL,
  `code` varchar(50) NOT NULL COMMENT 'admin, chef_parc, chef_tf, agent_pc_radio, mecanicien, chauffeur',
  `libelle` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles` (`id`, `code`, `libelle`, `description`, `est_supprime`, `date_creation`, `date_modification`, `date_suppression`) VALUES
(1, 'admin', 'Super Administrateur', 'Accès complet système', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
(2, 'chef_parc', 'Gestionnaire du Parc', 'Gestion globale parc automobile', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
(3, 'chef_tf', 'Chef Transport de Fonds', 'Gestion missions TF + chauffeurs TF', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
(4, 'agent_pc_radio', 'Agent PC Radio', 'Traçabilité remise/retour clés véhicules', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
(5, 'mecanicien', 'Mécanicien / Technicien', 'Interventions + Inspections techniques', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
(6, 'chauffeur', 'Chauffeur', 'Exécution missions + signalement anomalies', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL);

-- --------------------------------------------------------
-- Table 02: directions
-- --------------------------------------------------------
CREATE TABLE `directions` (
  `id` int(10) UNSIGNED NOT NULL,
  `nom` varchar(150) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 03: types_inspection
-- --------------------------------------------------------
CREATE TABLE `types_inspection` (
  `id` int(10) UNSIGNED NOT NULL,
  `code` varchar(50) NOT NULL COMMENT 'quotidienne, hebdomadaire, complete, periodique, tf',
  `libelle` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `frequence_jours` int(11) DEFAULT NULL COMMENT 'Fréquence recommandée en jours',
  `est_obligatoire` tinyint(1) DEFAULT 0 COMMENT 'Inspection obligatoire réglementaire',
  `ordre_affichage` int(11) DEFAULT 0,
  `est_actif` tinyint(1) DEFAULT 1,
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 04: types_intervenant
-- --------------------------------------------------------
CREATE TABLE `types_intervenant` (
  `id` int(10) UNSIGNED NOT NULL,
  `code` varchar(50) NOT NULL COMMENT 'mecanicien, electricien, carrossier, pneumaticien',
  `libelle` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `competences_requises` text DEFAULT NULL COMMENT 'Liste des compétences associées',
  `ordre_affichage` int(11) DEFAULT 0,
  `est_actif` tinyint(1) DEFAULT 1,
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 05: checklists
-- --------------------------------------------------------
CREATE TABLE `checklists` (
  `id` int(10) UNSIGNED NOT NULL,
  `code` varchar(100) NOT NULL COMMENT 'checklist_vidange, checklist_freins, checklist_tf',
  `libelle` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `type_inspection_id` int(10) UNSIGNED DEFAULT NULL COMMENT 'Type d''inspection associé',
  `categorie` varchar(100) DEFAULT NULL COMMENT 'accessoires, niveaux_fluides, pneumatiques, carrosserie, freinage, direction, electricite, equipements_securite',
  `elements_a_verifier` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON: liste des éléments standards à vérifier' CHECK (json_valid(`elements_a_verifier`)),
  `ordre_affichage` int(11) DEFAULT 0,
  `est_actif` tinyint(1) DEFAULT 1,
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 06: fournisseurs
-- --------------------------------------------------------
CREATE TABLE `fournisseurs` (
  `id` int(10) UNSIGNED NOT NULL,
  `nom` varchar(200) NOT NULL,
  `contact` varchar(150) DEFAULT NULL,
  `telephone` varchar(50) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL COMMENT 'pieces, carburant, assurance, autre',
  `adresse` text DEFAULT NULL,
  `est_actif` tinyint(1) DEFAULT 1,
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 07: categories_notifications
-- --------------------------------------------------------
CREATE TABLE `categories_notifications` (
  `id` int(10) UNSIGNED NOT NULL,
  `code` varchar(100) NOT NULL COMMENT 'alerte_critique_email, alerte_importante, info_in_app',
  `libelle` varchar(200) NOT NULL,
  `niveau_priorite` varchar(30) DEFAULT 'normal' COMMENT 'critique, important, a_surveiller, normal',
  `canaux` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '["email", "popup", "in_app"]' CHECK (json_valid(`canaux`)),
  `roles_cibles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '["chef_parc", "chef_tf"]' CHECK (json_valid(`roles_cibles`)),
  `description` text DEFAULT NULL,
  `est_actif` tinyint(1) DEFAULT 1,
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 08: regles_maintenance
-- --------------------------------------------------------
CREATE TABLE `regles_maintenance` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type_maintenance` varchar(150) NOT NULL COMMENT 'vidange_simple, vidange_complete, revision',
  `description` text DEFAULT NULL,
  `type_declencheur` varchar(10) NOT NULL COMMENT 'km, date, mixte',
  `valeur_km` bigint(20) DEFAULT NULL COMMENT 'Tous les X km',
  `valeur_mois` int(11) DEFAULT NULL COMMENT 'Tous les X mois',
  `type_vehicule` varchar(60) DEFAULT NULL COMMENT 'NULL = tous',
  `duree_estimee_heures` int(11) DEFAULT NULL,
  `cout_estime` decimal(12,2) DEFAULT NULL,
  `est_actif` tinyint(1) DEFAULT 1,
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLES PRINCIPALES (09-26)
-- ========================================

-- --------------------------------------------------------
-- Table 09: utilisateurs
-- --------------------------------------------------------
CREATE TABLE `utilisateurs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `role_id` int(10) UNSIGNED NOT NULL,
  `direction_id` int(10) UNSIGNED DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `est_supprime` tinyint(1) DEFAULT 0,
  `derniere_connexion` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 10: vehicules
-- --------------------------------------------------------
CREATE TABLE `vehicules` (
  `immatriculation` varchar(30) NOT NULL,
  `numero_chassis` varchar(100) DEFAULT NULL COMMENT 'VIN',
  `marque` varchar(100) DEFAULT NULL,
  `modele` varchar(100) DEFAULT NULL,
  `type_vehicule` varchar(60) DEFAULT NULL COMMENT '4x4, berline, utilitaire',
  `nb_places` int(11) DEFAULT 5,
  `direction_id` int(10) UNSIGNED DEFAULT NULL,
  `kilometrage` bigint(20) UNSIGNED DEFAULT 0,
  `date_maj_km` date DEFAULT NULL,
  `km_prochaine_vidange` bigint(20) DEFAULT NULL,
  `km_prochaine_revision` bigint(20) DEFAULT NULL,
  `statut` varchar(50) NOT NULL DEFAULT 'disponible' COMMENT 'disponible, en_mission, en_maintenance, immobilise',
  `date_immobilisation` datetime DEFAULT NULL,
  `jours_immobilisation` int(11) GENERATED ALWAYS AS (case when `statut` = 'immobilise' and `date_immobilisation` is not null then to_days(current_timestamp()) - to_days(`date_immobilisation`) else 0 end) VIRTUAL,
  `type_carburant` varchar(50) DEFAULT NULL COMMENT 'diesel, essence, hybride',
  `capacite_reservoir` int(11) DEFAULT NULL COMMENT 'Litres',
  `consommation_moyenne` decimal(10,2) DEFAULT NULL COMMENT 'L/100km',
  `date_acquisition` date DEFAULT NULL,
  `date_expiration_assurance` date DEFAULT NULL,
  `date_expiration_visite_technique` date DEFAULT NULL,
  `cout_acquisition` decimal(14,2) DEFAULT 0.00,
  `valeur_residuelle` decimal(14,2) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `est_actif` tinyint(1) DEFAULT 0,
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 11: missions
-- --------------------------------------------------------
CREATE TABLE `missions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `chauffeur_user_id` bigint(20) UNSIGNED NOT NULL,
  `type_mission` varchar(100) DEFAULT NULL COMMENT 'transport_fonds, mission_brousse, autre',
  `destination` varchar(255) DEFAULT NULL,
  `direction_id` int(10) UNSIGNED DEFAULT NULL,
  `nb_passagers` int(11) DEFAULT 1,
  `date_depart_prevue` datetime NOT NULL,
  `date_depart_reelle` datetime DEFAULT NULL,
  `date_retour_reelle` datetime DEFAULT NULL,
  `duree_minutes` int(11) GENERATED ALWAYS AS (case when `date_depart_reelle` is not null and `date_retour_reelle` is not null then timestampdiff(MINUTE,`date_depart_reelle`,`date_retour_reelle`) else NULL end) VIRTUAL,
  `km_depart` bigint(20) DEFAULT NULL,
  `km_retour` bigint(20) DEFAULT NULL,
  `km_parcourus` int(11) GENERATED ALWAYS AS (case when `km_depart` is not null and `km_retour` is not null then `km_retour` - `km_depart` else NULL end) VIRTUAL,
  `carburant_consomme` decimal(10,2) DEFAULT NULL COMMENT 'Litres',
  `cout_carburant` decimal(12,2) DEFAULT NULL,
  `statut` varchar(50) DEFAULT 'planifiee' COMMENT 'planifiee, en_cours, terminee, annulee',
  `reference_mission` varchar(100) DEFAULT NULL,
  `observations` text DEFAULT NULL,
  `incident_signale` tinyint(1) DEFAULT 0,
  `description_incident` text DEFAULT NULL,
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photos`)),
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 12: inspections
-- --------------------------------------------------------
CREATE TABLE `inspections` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type_inspection_id` int(10) UNSIGNED NOT NULL,
  `inspecteur_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `date_inspection` datetime NOT NULL,
  `nom_verificateurs` varchar(255) DEFAULT NULL,
  `autres_constats` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `chemin_rapport_pdf` varchar(255) DEFAULT NULL,
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 13: inspections_vehicules
-- --------------------------------------------------------
CREATE TABLE `inspections_vehicules` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `inspection_id` bigint(20) UNSIGNED NOT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `km_au_moment_inspection` bigint(20) DEFAULT NULL,
  `statut_global` varchar(50) DEFAULT 'conforme' COMMENT 'conforme, non_conforme, danger_immediat',
  `anomalies_detectees` tinyint(1) DEFAULT 0,
  `anomalie_creee_id` bigint(20) UNSIGNED DEFAULT NULL,
  `observations_vehicule` text DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 14: elements_inspectes
-- --------------------------------------------------------
CREATE TABLE `elements_inspectes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `inspection_vehicule_id` bigint(20) UNSIGNED NOT NULL,
  `checklist_id` int(10) UNSIGNED NOT NULL,
  `element_verifie` varchar(150) NOT NULL,
  `statut` varchar(30) DEFAULT 'OK' COMMENT 'OK, NOK, manquant, use, defectueux',
  `valeur_relevee` varchar(100) DEFAULT NULL,
  `commentaire` text DEFAULT NULL,
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photos`)),
  `date_creation` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 15: anomalies
-- --------------------------------------------------------
CREATE TABLE `anomalies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `signalee_par_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `mission_id` bigint(20) UNSIGNED DEFAULT NULL,
  `inspection_vehicule_id` bigint(20) UNSIGNED DEFAULT NULL,
  `date_signalement` datetime NOT NULL DEFAULT current_timestamp(),
  `description` text NOT NULL,
  `partie_vehicule` varchar(100) DEFAULT NULL COMMENT 'moteur, freins, direction',
  `severite` varchar(30) DEFAULT 'moyenne' COMMENT 'faible, moyenne, haute, critique',
  `km_au_signalement` bigint(20) DEFAULT NULL,
  `position_gps` varchar(100) DEFAULT NULL,
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photos`)),
  `statut` varchar(50) DEFAULT 'ouverte' COMMENT 'ouverte, en_cours, resolue, annulee',
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 16: intervenants
-- --------------------------------------------------------
CREATE TABLE `intervenants` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type_intervenant_id` int(10) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `nom_externe` varchar(200) DEFAULT NULL,
  `telephone` varchar(50) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `est_externe` tinyint(1) NOT NULL DEFAULT 0,
  `tarif_horaire` decimal(12,2) DEFAULT 0.00,
  `specialisation` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `est_actif` tinyint(1) DEFAULT 1,
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 17: demandes_intervention
-- --------------------------------------------------------
CREATE TABLE `demandes_intervention` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `anomalie_id` bigint(20) UNSIGNED DEFAULT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `demandeur_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `date_demande` datetime NOT NULL DEFAULT current_timestamp(),
  `type_maintenance` varchar(50) DEFAULT 'corrective' COMMENT 'corrective, preventive',
  `type_intervention` varchar(100) DEFAULT NULL,
  `priorite` varchar(30) DEFAULT 'normale' COMMENT 'faible, normale, haute, urgente',
  `statut` varchar(50) DEFAULT 'en_attente' COMMENT 'en_attente, approuvee, rejetee',
  `commentaire` text DEFAULT NULL,
  `motif_rejet` text DEFAULT NULL,
  `validee_par_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `date_validation` datetime DEFAULT NULL,
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 18: interventions
-- --------------------------------------------------------
CREATE TABLE `interventions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `demande_id` bigint(20) UNSIGNED DEFAULT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `intervenant_id` bigint(20) UNSIGNED NOT NULL,
  `type_intervention` varchar(100) DEFAULT NULL,
  `severite` varchar(30) DEFAULT 'normale',
  `date_debut` datetime DEFAULT NULL,
  `date_fin` datetime DEFAULT NULL,
  `duree_minutes` int(11) DEFAULT NULL,
  `duree_estimee_heures` int(11) DEFAULT NULL,
  `km_au_moment_intervention` bigint(20) DEFAULT NULL,
  `diagnostic` text DEFAULT NULL,
  `resultat` varchar(100) DEFAULT 'en_attente',
  `cout_main_oeuvre` decimal(12,2) DEFAULT 0.00,
  `cout_pieces` decimal(12,2) DEFAULT 0.00,
  `cout_total` decimal(14,2) GENERATED ALWAYS AS (`cout_main_oeuvre` + `cout_pieces`) VIRTUAL,
  `documents` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`documents`)),
  `notes` text DEFAULT NULL,
  `statut` varchar(50) DEFAULT 'planifiee' COMMENT 'planifiee, en_cours, terminee, annulee',
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 19: accidents
-- --------------------------------------------------------
CREATE TABLE `accidents` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `chauffeur_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `mission_id` bigint(20) UNSIGNED DEFAULT NULL,
  `date_accident` datetime NOT NULL,
  `lieu` varchar(255) DEFAULT NULL,
  `position_gps` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `type_responsabilite` varchar(100) DEFAULT NULL,
  `niveau_degats` varchar(50) DEFAULT NULL,
  `chemin_rapport_police` varchar(255) DEFAULT NULL,
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photos`)),
  `vehicule_immobilise` tinyint(1) DEFAULT 0,
  `jours_immobilisation` int(11) DEFAULT NULL,
  `km_au_moment_accident` bigint(20) DEFAULT NULL,
  `assure` tinyint(1) DEFAULT 0,
  `cout_estime` decimal(14,2) DEFAULT 0.00,
  `cout_reparation_final` decimal(14,2) DEFAULT NULL,
  `montant_reclame_assurance` decimal(14,2) DEFAULT NULL,
  `montant_verse_assurance` decimal(14,2) DEFAULT NULL,
  `statut` varchar(50) DEFAULT 'declare',
  `notes` text DEFAULT NULL,
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 20: pieces_detachees
-- --------------------------------------------------------
CREATE TABLE `pieces_detachees` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `nom` varchar(200) NOT NULL,
  `type_piece` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `quantite_stock` decimal(12,2) DEFAULT 0.00,
  `seuil_alerte` decimal(12,2) DEFAULT 0.00,
  `unite` varchar(50) DEFAULT 'unite',
  `prix_unitaire` decimal(12,2) DEFAULT 0.00,
  `fournisseur_id` int(10) UNSIGNED DEFAULT NULL,
  `emplacement` varchar(150) DEFAULT NULL,
  `est_actif` tinyint(1) DEFAULT 1,
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 21: prelevements_pieces
-- --------------------------------------------------------
CREATE TABLE `prelevements_pieces` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `intervention_id` bigint(20) UNSIGNED NOT NULL,
  `piece_id` bigint(20) UNSIGNED NOT NULL,
  `quantite` decimal(12,2) NOT NULL,
  `prix_unitaire` decimal(12,2) NOT NULL,
  `cout_total` decimal(14,2) GENERATED ALWAYS AS (`quantite` * `prix_unitaire`) VIRTUAL,
  `preleve_par_user_id` bigint(20) UNSIGNED NOT NULL,
  `date_prelevement` datetime NOT NULL DEFAULT current_timestamp(),
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 22: mouvements_stock
-- --------------------------------------------------------
CREATE TABLE `mouvements_stock` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `piece_id` bigint(20) UNSIGNED NOT NULL,
  `type_mouvement` varchar(50) NOT NULL COMMENT 'entree, sortie, ajustement, retour',
  `quantite` decimal(12,2) NOT NULL,
  `prix_unitaire` decimal(12,2) DEFAULT NULL,
  `type_reference` varchar(100) DEFAULT NULL,
  `reference_id` bigint(20) DEFAULT NULL,
  `effectue_par_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `fournisseur_id` int(10) UNSIGNED DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `chemin_document` varchar(255) DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 23: pc_radio
-- --------------------------------------------------------
CREATE TABLE `pc_radio` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `chauffeur_user_id` bigint(20) UNSIGNED NOT NULL,
  `mission_id` bigint(20) UNSIGNED DEFAULT NULL,
  `date_heure_remise` datetime NOT NULL,
  `km_depart` bigint(20) NOT NULL,
  `niveau_carburant_depart` varchar(50) DEFAULT NULL,
  `checklist_avant` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`checklist_avant`)),
  `photos_avant` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photos_avant`)),
  `observations_depart` text DEFAULT NULL,
  `date_heure_retour` datetime DEFAULT NULL,
  `km_retour` bigint(20) DEFAULT NULL,
  `niveau_carburant_retour` varchar(50) DEFAULT NULL,
  `duree_utilisation_minutes` int(11) GENERATED ALWAYS AS (case when `date_heure_remise` is not null and `date_heure_retour` is not null then timestampdiff(MINUTE,`date_heure_remise`,`date_heure_retour`) else NULL end) VIRTUAL,
  `km_parcourus` int(11) GENERATED ALWAYS AS (case when `km_depart` is not null and `km_retour` is not null then `km_retour` - `km_depart` else NULL end) VIRTUAL,
  `checklist_apres` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`checklist_apres`)),
  `photos_apres` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photos_apres`)),
  `anomalies_detectees` tinyint(1) DEFAULT 0,
  `observations_retour` text DEFAULT NULL,
  `agent_pc_radio_user_id` bigint(20) UNSIGNED NOT NULL,
  `signature_chauffeur_remise` text DEFAULT NULL,
  `signature_chauffeur_retour` text DEFAULT NULL,
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 24: anomalies_pc_radio
-- --------------------------------------------------------
CREATE TABLE `anomalies_pc_radio` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `pc_radio_id` bigint(20) UNSIGNED NOT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `chauffeur_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `type_degat` varchar(100) DEFAULT NULL,
  `partie_vehicule` varchar(100) DEFAULT NULL,
  `description` text NOT NULL,
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photos`)),
  `severite` varchar(30) DEFAULT 'moyenne',
  `date_detection` datetime NOT NULL DEFAULT current_timestamp(),
  `statut` varchar(50) DEFAULT 'signale',
  `notes` text DEFAULT NULL,
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 25: carnets_carburant
-- --------------------------------------------------------
CREATE TABLE `carnets_carburant` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `mission_id` bigint(20) UNSIGNED DEFAULT NULL,
  `date_plein` date NOT NULL,
  `kilometrage` bigint(20) DEFAULT NULL,
  `litres` decimal(12,2) NOT NULL,
  `prix_unitaire` decimal(12,4) DEFAULT NULL,
  `cout_total` decimal(14,2) GENERATED ALWAYS AS (`litres` * coalesce(`prix_unitaire`,0)) VIRTUAL,
  `station` varchar(200) DEFAULT NULL,
  `chemin_recu` varchar(255) DEFAULT NULL,
  `km_depuis_dernier_plein` bigint(20) DEFAULT NULL,
  `consommation_calculee` decimal(10,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 26: documents_vehicules
-- --------------------------------------------------------
CREATE TABLE `documents_vehicules` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `type_document` varchar(100) NOT NULL,
  `nom_document` varchar(255) NOT NULL,
  `chemin_fichier` varchar(255) NOT NULL,
  `compagnie_assurance` varchar(200) DEFAULT NULL,
  `numero_contrat` varchar(100) DEFAULT NULL,
  `type_couverture` varchar(100) DEFAULT NULL,
  `montant_prime` decimal(14,2) DEFAULT NULL,
  `date_emission` date DEFAULT NULL,
  `date_expiration` date DEFAULT NULL,
  `telecharge_par_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLES DE SUIVI (27-33)
-- ========================================

-- --------------------------------------------------------
-- Table 27: documents_chauffeurs
-- --------------------------------------------------------
CREATE TABLE `documents_chauffeurs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `chauffeur_user_id` bigint(20) UNSIGNED NOT NULL,
  `type_document` varchar(100) NOT NULL,
  `nom_document` varchar(255) NOT NULL,
  `chemin_fichier` varchar(255) NOT NULL,
  `numero_permis` varchar(100) DEFAULT NULL,
  `categories_permis` varchar(100) DEFAULT NULL,
  `pays_delivrance` varchar(100) DEFAULT NULL,
  `date_delivrance` date DEFAULT NULL,
  `date_expiration` date DEFAULT NULL,
  `telecharge_par_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 28: historique_kilometrage
-- --------------------------------------------------------
CREATE TABLE `historique_kilometrage` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `kilometrage` bigint(20) UNSIGNED NOT NULL,
  `date_relevee` date NOT NULL,
  `source` varchar(50) DEFAULT 'manuel',
  `source_id` bigint(20) DEFAULT NULL,
  `enregistre_par_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 29: alertes_kilometrage
-- --------------------------------------------------------
CREATE TABLE `alertes_kilometrage` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `type_alerte` varchar(100) NOT NULL,
  `seuil_km` bigint(20) NOT NULL,
  `km_actuel` bigint(20) NOT NULL,
  `km_restants` int(11) GENERATED ALWAYS AS (`seuil_km` - `km_actuel`) VIRTUAL,
  `est_notifie` tinyint(1) DEFAULT 0,
  `date_notification` timestamp NULL DEFAULT NULL,
  `est_resolue` tinyint(1) DEFAULT 0,
  `date_resolution` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 30: planning_maintenance
-- --------------------------------------------------------
CREATE TABLE `planning_maintenance` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `regle_id` bigint(20) UNSIGNED DEFAULT NULL,
  `type_maintenance` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `frequence_km` int(11) DEFAULT NULL,
  `frequence_mois` int(11) DEFAULT NULL,
  `date_derniere_realisation` date DEFAULT NULL,
  `km_derniere_realisation` bigint(20) DEFAULT NULL,
  `derniere_intervention_id` bigint(20) UNSIGNED DEFAULT NULL,
  `prochaine_echeance_date` date DEFAULT NULL,
  `prochaine_echeance_km` bigint(20) DEFAULT NULL,
  `statut` varchar(50) DEFAULT 'a_planifier',
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 31: outils
-- --------------------------------------------------------
CREATE TABLE `outils` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(200) NOT NULL,
  `type` varchar(100) DEFAULT NULL,
  `categorie` varchar(100) DEFAULT NULL,
  `etat` varchar(50) DEFAULT 'OK',
  `emplacement` varchar(150) DEFAULT NULL,
  `date_dernier_controle` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 32: problemes_outils
-- --------------------------------------------------------
CREATE TABLE `problemes_outils` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `outil_id` bigint(20) UNSIGNED NOT NULL,
  `signale_par_user_id` bigint(20) UNSIGNED NOT NULL,
  `description_probleme` text NOT NULL,
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photos`)),
  `statut` varchar(50) DEFAULT 'signale',
  `date_signalement` datetime NOT NULL DEFAULT current_timestamp(),
  `date_resolution` datetime DEFAULT NULL,
  `notes_resolution` text DEFAULT NULL,
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 33: performances_chauffeurs
-- --------------------------------------------------------
CREATE TABLE `performances_chauffeurs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `chauffeur_user_id` bigint(20) UNSIGNED NOT NULL,
  `date_debut_periode` date NOT NULL,
  `date_fin_periode` date NOT NULL,
  `total_missions` int(11) DEFAULT 0,
  `total_km` bigint(20) DEFAULT 0,
  `total_duree_minutes` int(11) DEFAULT 0,
  `nb_accidents` int(11) DEFAULT 0,
  `nb_anomalies_signalees` int(11) DEFAULT 0,
  `consommation_moyenne` decimal(10,2) DEFAULT NULL,
  `score_performance` decimal(5,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLES SYSTÈME (34-38)
-- ========================================

-- --------------------------------------------------------
-- Table 34: kpi_vehicules
-- --------------------------------------------------------
CREATE TABLE `kpi_vehicules` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `annee_periode` int(11) NOT NULL,
  `mois_periode` int(11) NOT NULL,
  `jours_disponible` int(11) DEFAULT 0,
  `jours_mission` int(11) DEFAULT 0,
  `jours_maintenance` int(11) DEFAULT 0,
  `jours_immobilise` int(11) DEFAULT 0,
  `taux_disponibilite` decimal(5,2) GENERATED ALWAYS AS (case when `jours_disponible` + `jours_mission` + `jours_maintenance` + `jours_immobilise` > 0 then `jours_disponible` * 100.0 / (`jours_disponible` + `jours_mission` + `jours_maintenance` + `jours_immobilise`) else 0 end) VIRTUAL,
  `total_missions` int(11) DEFAULT 0,
  `total_km_missions` bigint(20) DEFAULT 0,
  `total_interventions` int(11) DEFAULT 0,
  `total_duree_interventions_heures` decimal(10,2) DEFAULT 0.00,
  `cout_missions` decimal(14,2) DEFAULT 0.00,
  `cout_interventions` decimal(14,2) DEFAULT 0.00,
  `cout_pieces` decimal(14,2) DEFAULT 0.00,
  `cout_total` decimal(14,2) GENERATED ALWAYS AS (`cout_missions` + `cout_interventions` + `cout_pieces`) VIRTUAL,
  `cout_par_km` decimal(10,2) DEFAULT NULL,
  `nb_anomalies` int(11) DEFAULT 0,
  `nb_accidents` int(11) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 35: journaux_audit
-- --------------------------------------------------------
CREATE TABLE `journaux_audit` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `nom_table` varchar(100) DEFAULT NULL,
  `id_enregistrement` varchar(100) DEFAULT NULL,
  `anciennes_valeurs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`anciennes_valeurs`)),
  `nouvelles_valeurs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`nouvelles_valeurs`)),
  `adresse_ip` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 36: notifications
-- --------------------------------------------------------
CREATE TABLE `notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `categorie_id` int(10) UNSIGNED NOT NULL,
  `titre` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `vehicule_immatriculation` varchar(30) DEFAULT NULL,
  `donnees` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`donnees`)),
  `lien_url` varchar(255) DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 37: envois_notifications
-- --------------------------------------------------------
CREATE TABLE `envois_notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `notification_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `canal` varchar(50) NOT NULL,
  `statut_envoi` varchar(50) DEFAULT 'en_attente',
  `date_envoi` timestamp NULL DEFAULT NULL,
  `date_lecture` timestamp NULL DEFAULT NULL,
  `est_lu` tinyint(1) DEFAULT 0,
  `erreur` text DEFAULT NULL,
  `metadata_envoi` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata_envoi`)),
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table 38: parametres_alertes
-- --------------------------------------------------------
CREATE TABLE `parametres_alertes` (
  `id` int(10) UNSIGNED NOT NULL,
  `type_alerte` varchar(100) NOT NULL,
  `condition_declenchement` varchar(255) NOT NULL,
  `valeur_seuil` int(11) DEFAULT NULL,
  `categorie_notification_id` int(10) UNSIGNED DEFAULT NULL,
  `message_template` text DEFAULT NULL,
  `est_actif` tinyint(1) DEFAULT 1,
  `est_supprime` tinyint(1) DEFAULT 0,
  `date_creation` timestamp NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- VUES
-- ========================================

CREATE OR REPLACE VIEW `v_dashboard_gestionnaire` AS
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
    (SELECT COUNT(*) FROM anomalies WHERE statut IN ('ouverte','en_cours') AND est_supprime = 0) AS anomalies_ouvertes,
    (SELECT COUNT(*) FROM pieces_detachees WHERE quantite_stock <= seuil_alerte AND est_supprime = 0) AS pieces_stock_alerte,
    (SELECT COUNT(*) FROM outils WHERE etat = 'HS' AND est_supprime = 0) AS outils_defectueux,
    (SELECT COUNT(*) FROM pc_radio WHERE date_heure_retour IS NULL AND est_supprime = 0) AS vehicules_en_circulation_pcradio;

CREATE OR REPLACE VIEW `v_vehicules_avec_alertes` AS
SELECT 
    v.immatriculation, v.marque, v.modele, v.type_vehicule, v.kilometrage, v.statut, v.jours_immobilisation,
    d.nom AS direction_nom,
    (SELECT COUNT(*) FROM alertes_kilometrage ak WHERE ak.vehicule_immatriculation = v.immatriculation AND ak.est_resolue = 0) AS nb_alertes_km,
    CASE WHEN v.date_expiration_assurance IS NOT NULL AND DATEDIFF(v.date_expiration_assurance, CURDATE()) <= 60 
        THEN DATEDIFF(v.date_expiration_assurance, CURDATE()) ELSE NULL END AS jours_avant_expiration_assurance,
    CASE WHEN v.date_expiration_visite_technique IS NOT NULL AND DATEDIFF(v.date_expiration_visite_technique, CURDATE()) <= 30 
        THEN DATEDIFF(v.date_expiration_visite_technique, CURDATE()) ELSE NULL END AS jours_avant_expiration_visite,
    (SELECT MAX(i.date_fin) FROM interventions i WHERE i.vehicule_immatriculation = v.immatriculation AND i.statut = 'terminee' AND i.est_supprime = 0) AS derniere_intervention,
    (SELECT COUNT(*) FROM interventions i WHERE i.vehicule_immatriculation = v.immatriculation AND YEAR(i.date_debut) = YEAR(CURDATE()) AND MONTH(i.date_debut) = MONTH(CURDATE()) AND i.est_supprime = 0) AS nb_interventions_mois,
    (SELECT COUNT(*) FROM missions m WHERE m.vehicule_immatriculation = v.immatriculation AND m.statut = 'terminee' AND YEAR(m.date_retour_reelle) = YEAR(CURDATE()) AND MONTH(m.date_retour_reelle) = MONTH(CURDATE()) AND m.est_supprime = 0) AS nb_missions_mois
FROM vehicules v
LEFT JOIN directions d ON v.direction_id = d.id
WHERE v.est_actif = 1 AND v.est_supprime = 0;

CREATE OR REPLACE VIEW `v_notifications_inapp_users` AS
SELECT 
    e.id AS envoi_id, e.user_id, u.nom AS nom_utilisateur, u.email, e.est_lu, e.date_creation AS date_reception, e.date_lecture,
    n.id AS notification_id, n.titre, n.message, n.lien_url, n.vehicule_immatriculation, n.donnees,
    c.id AS categorie_id, c.code AS type_notification, c.libelle AS libelle_categorie, c.niveau_priorite
FROM envois_notifications e
INNER JOIN utilisateurs u ON e.user_id = u.id
INNER JOIN notifications n ON e.notification_id = n.id
INNER JOIN categories_notifications c ON n.categorie_id = c.id
WHERE e.canal = 'in_app' AND u.est_actif = 1 AND u.est_supprime = 0;

CREATE OR REPLACE VIEW `v_historique_emails_users` AS
SELECT 
    e.id AS envoi_id, e.user_id, u.nom AS nom_utilisateur, u.email, e.statut_envoi, e.date_envoi, e.erreur, e.metadata_envoi,
    n.id AS notification_id, n.titre, n.message,
    c.code AS type_notification, c.libelle AS libelle_categorie, c.niveau_priorite, e.date_creation AS date_creation_envoi
FROM envois_notifications e
INNER JOIN utilisateurs u ON e.user_id = u.id
INNER JOIN notifications n ON e.notification_id = n.id
INNER JOIN categories_notifications c ON n.categorie_id = c.id
WHERE e.canal = 'email' AND u.est_actif = 1 AND u.est_supprime = 0;

CREATE OR REPLACE VIEW `v_inspections_detaillees` AS
SELECT 
    i.id AS inspection_id, i.date_inspection, ti.libelle AS type_inspection_libelle, ti.code AS type_inspection_code,
    u.nom AS inspecteur_nom,
    COUNT(DISTINCT iv.id) AS nb_vehicules_inspectes,
    COUNT(DISTINCT CASE WHEN iv.statut_global = 'danger_immediat' THEN iv.id END) AS nb_danger_immediat,
    COUNT(DISTINCT CASE WHEN iv.statut_global = 'non_conforme' THEN iv.id END) AS nb_non_conforme,
    COUNT(DISTINCT CASE WHEN iv.anomalies_detectees = 1 THEN iv.id END) AS nb_avec_anomalies
FROM inspections i
INNER JOIN types_inspection ti ON i.type_inspection_id = ti.id
LEFT JOIN utilisateurs u ON i.inspecteur_user_id = u.id
LEFT JOIN inspections_vehicules iv ON i.id = iv.inspection_id
WHERE i.est_supprime = 0
GROUP BY i.id, i.date_inspection, ti.libelle, ti.code, u.nom;

CREATE OR REPLACE VIEW `v_intervenants_details` AS
SELECT 
    i.id, COALESCE(u.nom, i.nom_externe) AS nom_complet,
    ti.libelle AS type_intervenant_libelle, ti.code AS type_intervenant_code,
    i.est_externe, i.tarif_horaire, i.specialisation, i.telephone, i.email,
    (SELECT COUNT(*) FROM interventions WHERE intervenant_id = i.id AND statut = 'terminee' AND est_supprime = 0) AS nb_interventions_total,
    (SELECT COUNT(*) FROM interventions WHERE intervenant_id = i.id AND statut = 'terminee' AND YEAR(date_fin) = YEAR(CURDATE()) AND est_supprime = 0) AS nb_interventions_annee
FROM intervenants i
INNER JOIN types_intervenant ti ON i.type_intervenant_id = ti.id
LEFT JOIN utilisateurs u ON i.user_id = u.id
WHERE i.est_actif = 1 AND i.est_supprime = 0;

-- ========================================
-- INDEX ET CLÉS PRIMAIRES
-- ========================================
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_roles_actifs` (`est_supprime`);

ALTER TABLE `directions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_directions_actives` (`est_supprime`);

ALTER TABLE `types_inspection`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_typeinsp_actifs` (`est_supprime`,`est_actif`),
  ADD KEY `idx_typeinsp_ordre` (`ordre_affichage`);

ALTER TABLE `types_intervenant`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_typeinterv_actifs` (`est_supprime`,`est_actif`),
  ADD KEY `idx_typeinterv_ordre` (`ordre_affichage`);

ALTER TABLE `checklists`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_checklist_type_insp` (`type_inspection_id`),
  ADD KEY `idx_checklist_categorie` (`categorie`),
  ADD KEY `idx_checklist_actifs` (`est_supprime`,`est_actif`),
  ADD KEY `idx_checklist_ordre` (`ordre_affichage`);

ALTER TABLE `fournisseurs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_fournisseurs_actifs` (`est_supprime`,`est_actif`);

ALTER TABLE `categories_notifications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_catnotif_code` (`code`),
  ADD KEY `idx_catnotif_priorite` (`niveau_priorite`),
  ADD KEY `idx_catnotif_actives` (`est_supprime`,`est_actif`);

ALTER TABLE `regles_maintenance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reglemaint_type` (`type_maintenance`),
  ADD KEY `idx_reglemaint_actives` (`est_supprime`,`est_actif`);

ALTER TABLE `utilisateurs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_utilisateurs_role` (`role_id`),
  ADD KEY `idx_utilisateurs_direction` (`direction_id`),
  ADD KEY `idx_utilisateurs_email` (`email`),
  ADD KEY `idx_utilisateurs_actifs` (`est_supprime`,`est_actif`);

ALTER TABLE `vehicules`
  ADD PRIMARY KEY (`immatriculation`),
  ADD UNIQUE KEY `numero_chassis` (`numero_chassis`),
  ADD KEY `idx_vehicules_immat` (`immatriculation`),
  ADD KEY `idx_vehicules_direction` (`direction_id`),
  ADD KEY `idx_vehicules_statut` (`statut`),
  ADD KEY `idx_vehicules_actifs` (`est_supprime`,`est_actif`),
  ADD KEY `idx_vehicules_date_maj_km` (`date_maj_km`);

ALTER TABLE `missions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_missions_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_missions_chauffeur` (`chauffeur_user_id`),
  ADD KEY `idx_missions_statut` (`statut`),
  ADD KEY `idx_missions_dates` (`date_depart_prevue`,`statut`),
  ADD KEY `idx_missions_direction` (`direction_id`),
  ADD KEY `idx_missions_actives` (`est_supprime`),
  ADD KEY `idx_missions_vehicule_statut` (`vehicule_immatriculation`,`statut`);

ALTER TABLE `inspections`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_inspections_type` (`type_inspection_id`),
  ADD KEY `idx_inspections_inspecteur` (`inspecteur_user_id`),
  ADD KEY `idx_inspections_date` (`date_inspection`),
  ADD KEY `idx_inspections_actives` (`est_supprime`);

ALTER TABLE `inspections_vehicules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_inspveh_inspection` (`inspection_id`),
  ADD KEY `idx_inspveh_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_inspveh_statut` (`statut_global`),
  ADD KEY `fk_inspveh_anomalie` (`anomalie_creee_id`),
  ADD KEY `idx_inspveh_vehicule_date` (`vehicule_immatriculation`);

ALTER TABLE `elements_inspectes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_eleminsp_insp_veh` (`inspection_vehicule_id`),
  ADD KEY `idx_eleminsp_checklist` (`checklist_id`),
  ADD KEY `idx_eleminsp_statut` (`statut`),
  ADD KEY `idx_eleminsp_element` (`element_verifie`);

ALTER TABLE `anomalies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_anomalies_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_anomalies_signalee_par` (`signalee_par_user_id`),
  ADD KEY `idx_anomalies_statut` (`statut`),
  ADD KEY `idx_anomalies_severite` (`severite`),
  ADD KEY `idx_anomalies_mission` (`mission_id`),
  ADD KEY `idx_anomalies_inspection` (`inspection_vehicule_id`),
  ADD KEY `idx_anomalies_actives` (`est_supprime`),
  ADD KEY `idx_anomalies_vehicule_statut` (`vehicule_immatriculation`,`statut`);

ALTER TABLE `intervenants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_intervenants_type` (`type_intervenant_id`),
  ADD KEY `idx_intervenants_user` (`user_id`),
  ADD KEY `idx_intervenants_actifs` (`est_supprime`,`est_actif`);

ALTER TABLE `demandes_intervention`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_demande_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_demande_demandeur` (`demandeur_user_id`),
  ADD KEY `idx_demande_anomalie` (`anomalie_id`),
  ADD KEY `idx_demande_statut` (`statut`),
  ADD KEY `idx_demande_priorite` (`priorite`),
  ADD KEY `idx_demande_actives` (`est_supprime`),
  ADD KEY `fk_demande_validee_par` (`validee_par_user_id`);

ALTER TABLE `interventions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_interv_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_interv_intervenant` (`intervenant_id`),
  ADD KEY `idx_interv_demande` (`demande_id`),
  ADD KEY `idx_interv_statut` (`statut`),
  ADD KEY `idx_interv_dates` (`date_debut`,`date_fin`),
  ADD KEY `idx_interv_actives` (`est_supprime`),
  ADD KEY `idx_interventions_vehicule_statut` (`vehicule_immatriculation`,`statut`);

ALTER TABLE `accidents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_acc_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_acc_chauffeur` (`chauffeur_user_id`),
  ADD KEY `idx_acc_date` (`date_accident`),
  ADD KEY `idx_acc_statut` (`statut`),
  ADD KEY `idx_acc_mission` (`mission_id`),
  ADD KEY `idx_acc_actifs` (`est_supprime`);

ALTER TABLE `pieces_detachees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pieces_nom` (`nom`),
  ADD KEY `idx_pieces_sku` (`sku`),
  ADD KEY `idx_pieces_fournisseur` (`fournisseur_id`),
  ADD KEY `idx_pieces_type` (`type_piece`),
  ADD KEY `idx_pieces_actives` (`est_supprime`,`est_actif`),
  ADD KEY `idx_pieces_stock_alerte` (`quantite_stock`,`seuil_alerte`);

ALTER TABLE `prelevements_pieces`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_prelpiec_intervention` (`intervention_id`),
  ADD KEY `idx_prelpiec_piece` (`piece_id`),
  ADD KEY `idx_prelpiec_preleve_par` (`preleve_par_user_id`),
  ADD KEY `idx_prelpiec_date` (`date_prelevement`);

ALTER TABLE `mouvements_stock`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_mouvstock_piece` (`piece_id`),
  ADD KEY `idx_mouvstock_date` (`date_creation`),
  ADD KEY `idx_mouvstock_type` (`type_mouvement`),
  ADD KEY `idx_mouvstock_piece_date` (`piece_id`,`date_creation`),
  ADD KEY `fk_mouvstock_effectue_par` (`effectue_par_user_id`),
  ADD KEY `fk_mouvstock_fournisseur` (`fournisseur_id`);

ALTER TABLE `pc_radio`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pcradio_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_pcradio_chauffeur` (`chauffeur_user_id`),
  ADD KEY `idx_pcradio_mission` (`mission_id`),
  ADD KEY `idx_pcradio_agent` (`agent_pc_radio_user_id`),
  ADD KEY `idx_pcradio_dates` (`date_heure_remise`,`date_heure_retour`),
  ADD KEY `idx_pcradio_anomalies` (`anomalies_detectees`),
  ADD KEY `idx_pcradio_actifs` (`est_supprime`),
  ADD KEY `idx_pcradio_en_cours` (`vehicule_immatriculation`,`date_heure_retour`);

ALTER TABLE `anomalies_pc_radio`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_anom_pcradio_pc` (`pc_radio_id`),
  ADD KEY `idx_anom_pcradio_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_anom_pcradio_statut` (`statut`),
  ADD KEY `idx_anom_pcradio_actives` (`est_supprime`),
  ADD KEY `fk_anom_pcradio_chauffeur` (`chauffeur_user_id`);

ALTER TABLE `carnets_carburant`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_carburant_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_carburant_date` (`date_plein`),
  ADD KEY `idx_carburant_mission` (`mission_id`),
  ADD KEY `idx_carburant_actifs` (`est_supprime`);

ALTER TABLE `documents_vehicules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_docveh_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_docveh_type` (`type_document`),
  ADD KEY `idx_docveh_expiration` (`date_expiration`),
  ADD KEY `idx_docveh_actifs` (`est_supprime`),
  ADD KEY `fk_docveh_telecharge_par` (`telecharge_par_user_id`);

ALTER TABLE `documents_chauffeurs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_docchauf_chauffeur` (`chauffeur_user_id`),
  ADD KEY `idx_docchauf_type` (`type_document`),
  ADD KEY `idx_docchauf_expiration` (`date_expiration`),
  ADD KEY `idx_docchauf_actifs` (`est_supprime`),
  ADD KEY `fk_docchauf_telecharge_par` (`telecharge_par_user_id`);

ALTER TABLE `historique_kilometrage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_histokm_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_histokm_date` (`date_relevee`),
  ADD KEY `idx_histokm_vehicule_date` (`vehicule_immatriculation`,`date_relevee`),
  ADD KEY `fk_histokm_enregistre_par` (`enregistre_par_user_id`);

ALTER TABLE `alertes_kilometrage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_alertkm_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_alertkm_type` (`type_alerte`),
  ADD KEY `idx_alertkm_resolue` (`est_resolue`);

ALTER TABLE `planning_maintenance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_planmaint_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_planmaint_regle` (`regle_id`),
  ADD KEY `idx_planmaint_statut` (`statut`),
  ADD KEY `idx_planmaint_echeances` (`prochaine_echeance_date`,`prochaine_echeance_km`),
  ADD KEY `idx_planmaint_actifs` (`est_supprime`),
  ADD KEY `fk_planmaint_derniere_interv` (`derniere_intervention_id`);

ALTER TABLE `outils`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_outils_etat` (`etat`),
  ADD KEY `idx_outils_categorie` (`categorie`),
  ADD KEY `idx_outils_actifs` (`est_supprime`);

ALTER TABLE `problemes_outils`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pboutil_outil` (`outil_id`),
  ADD KEY `idx_pboutil_statut` (`statut`),
  ADD KEY `idx_pboutil_actifs` (`est_supprime`),
  ADD KEY `fk_pboutil_signale_par` (`signale_par_user_id`);

ALTER TABLE `performances_chauffeurs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_perfchauf_chauffeur` (`chauffeur_user_id`),
  ADD KEY `idx_perfchauf_periode` (`date_debut_periode`,`date_fin_periode`);

ALTER TABLE `kpi_vehicules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_kpiveh_vehicule_periode` (`vehicule_immatriculation`,`annee_periode`,`mois_periode`),
  ADD KEY `idx_kpiveh_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_kpiveh_periode` (`annee_periode`,`mois_periode`);

ALTER TABLE `journaux_audit`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_user` (`user_id`),
  ADD KEY `idx_audit_table` (`nom_table`,`id_enregistrement`),
  ADD KEY `idx_audit_action` (`action`),
  ADD KEY `idx_audit_date` (`date_creation`);

ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notif_categorie` (`categorie_id`),
  ADD KEY `idx_notif_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_notif_date` (`date_creation`);

ALTER TABLE `envois_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_envoi_notification` (`notification_id`),
  ADD KEY `idx_envoi_user` (`user_id`),
  ADD KEY `idx_envoi_canal` (`canal`),
  ADD KEY `idx_envoi_statut` (`statut_envoi`),
  ADD KEY `idx_envoi_user_canal_lu` (`user_id`,`canal`,`est_lu`),
  ADD KEY `idx_envoi_date` (`date_creation`);

ALTER TABLE `parametres_alertes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_paramalert_type` (`type_alerte`),
  ADD KEY `idx_paramalert_actives` (`est_supprime`,`est_actif`),
  ADD KEY `fk_paramalert_categorie` (`categorie_notification_id`);

-- ========================================
-- AUTO_INCREMENT
-- ========================================

ALTER TABLE `roles` MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
ALTER TABLE `directions` MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `types_inspection` MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `types_intervenant` MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `checklists` MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `fournisseurs` MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `categories_notifications` MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `regles_maintenance` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `utilisateurs` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `missions` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `inspections` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `inspections_vehicules` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `elements_inspectes` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `anomalies` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `intervenants` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `demandes_intervention` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `interventions` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `accidents` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `pieces_detachees` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `prelevements_pieces` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `mouvements_stock` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `pc_radio` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `anomalies_pc_radio` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `carnets_carburant` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `documents_vehicules` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `documents_chauffeurs` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `historique_kilometrage` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `alertes_kilometrage` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `planning_maintenance` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `outils` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `problemes_outils` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `performances_chauffeurs` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `kpi_vehicules` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `journaux_audit` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `notifications` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `envois_notifications` MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `parametres_alertes` MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
-- ========================================
-- CONTRAINTES DE CLÉS ÉTRANGÈRES COMPLÈTES
-- ========================================

-- --------------------------------------------------------
-- TABLES DE RÉFÉRENCE (01-08)
-- --------------------------------------------------------

-- Table 05: checklists
ALTER TABLE `checklists`
  ADD CONSTRAINT `fk_checklist_type_insp` FOREIGN KEY (`type_inspection_id`) REFERENCES `types_inspection` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- --------------------------------------------------------
-- TABLES PRINCIPALES (09-26)
-- --------------------------------------------------------

-- Table 09: utilisateurs
ALTER TABLE `utilisateurs`
  ADD CONSTRAINT `fk_utilisateurs_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_utilisateurs_direction` FOREIGN KEY (`direction_id`) REFERENCES `directions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table 10: vehicules
ALTER TABLE `vehicules`
  ADD CONSTRAINT `fk_vehicules_direction` FOREIGN KEY (`direction_id`) REFERENCES `directions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table 11: missions
ALTER TABLE `missions`
  ADD CONSTRAINT `fk_missions_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_missions_chauffeur` FOREIGN KEY (`chauffeur_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_missions_direction` FOREIGN KEY (`direction_id`) REFERENCES `directions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table 12: inspections
ALTER TABLE `inspections`
  ADD CONSTRAINT `fk_inspections_type` FOREIGN KEY (`type_inspection_id`) REFERENCES `types_inspection` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inspections_inspecteur` FOREIGN KEY (`inspecteur_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table 13: inspections_vehicules
ALTER TABLE `inspections_vehicules`
  ADD CONSTRAINT `fk_inspveh_inspection` FOREIGN KEY (`inspection_id`) REFERENCES `inspections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inspveh_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inspveh_anomalie` FOREIGN KEY (`anomalie_creee_id`) REFERENCES `anomalies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table 14: elements_inspectes
ALTER TABLE `elements_inspectes`
  ADD CONSTRAINT `fk_eleminsp_insp_veh` FOREIGN KEY (`inspection_vehicule_id`) REFERENCES `inspections_vehicules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_eleminsp_checklist` FOREIGN KEY (`checklist_id`) REFERENCES `checklists` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- Table 15: anomalies
ALTER TABLE `anomalies`
  ADD CONSTRAINT `fk_anomalies_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_anomalies_signalee_par` FOREIGN KEY (`signalee_par_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_anomalies_mission` FOREIGN KEY (`mission_id`) REFERENCES `missions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_anomalies_inspection` FOREIGN KEY (`inspection_vehicule_id`) REFERENCES `inspections_vehicules` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table 16: intervenants
ALTER TABLE `intervenants`
  ADD CONSTRAINT `fk_intervenants_type` FOREIGN KEY (`type_intervenant_id`) REFERENCES `types_intervenant` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_intervenants_user` FOREIGN KEY (`user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table 17: demandes_intervention
ALTER TABLE `demandes_intervention`
  ADD CONSTRAINT `fk_demande_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_demande_demandeur` FOREIGN KEY (`demandeur_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_demande_anomalie` FOREIGN KEY (`anomalie_id`) REFERENCES `anomalies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_demande_validee_par` FOREIGN KEY (`validee_par_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table 18: interventions
ALTER TABLE `interventions`
  ADD CONSTRAINT `fk_interv_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_interv_intervenant` FOREIGN KEY (`intervenant_id`) REFERENCES `intervenants` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_interv_demande` FOREIGN KEY (`demande_id`) REFERENCES `demandes_intervention` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table 19: accidents
ALTER TABLE `accidents`
  ADD CONSTRAINT `fk_accidents_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_accidents_chauffeur` FOREIGN KEY (`chauffeur_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_accidents_mission` FOREIGN KEY (`mission_id`) REFERENCES `missions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table 20: pieces_detachees
ALTER TABLE `pieces_detachees`
  ADD CONSTRAINT `fk_pieces_fournisseur` FOREIGN KEY (`fournisseur_id`) REFERENCES `fournisseurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table 21: prelevements_pieces
ALTER TABLE `prelevements_pieces`
  ADD CONSTRAINT `fk_prelpiec_intervention` FOREIGN KEY (`intervention_id`) REFERENCES `interventions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_prelpiec_piece` FOREIGN KEY (`piece_id`) REFERENCES `pieces_detachees` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_prelpiec_preleve_par` FOREIGN KEY (`preleve_par_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- Table 22: mouvements_stock
ALTER TABLE `mouvements_stock`
  ADD CONSTRAINT `fk_mouvstock_piece` FOREIGN KEY (`piece_id`) REFERENCES `pieces_detachees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mouvstock_effectue_par` FOREIGN KEY (`effectue_par_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mouvstock_fournisseur` FOREIGN KEY (`fournisseur_id`) REFERENCES `fournisseurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table 23: pc_radio
ALTER TABLE `pc_radio`
  ADD CONSTRAINT `fk_pcradio_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pcradio_chauffeur` FOREIGN KEY (`chauffeur_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pcradio_mission` FOREIGN KEY (`mission_id`) REFERENCES `missions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pcradio_agent` FOREIGN KEY (`agent_pc_radio_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- Table 24: anomalies_pc_radio
ALTER TABLE `anomalies_pc_radio`
  ADD CONSTRAINT `fk_anom_pcradio_pc` FOREIGN KEY (`pc_radio_id`) REFERENCES `pc_radio` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_anom_pcradio_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_anom_pcradio_chauffeur` FOREIGN KEY (`chauffeur_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table 25: carnets_carburant
ALTER TABLE `carnets_carburant`
  ADD CONSTRAINT `fk_carburant_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_carburant_mission` FOREIGN KEY (`mission_id`) REFERENCES `missions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table 26: documents_vehicules
ALTER TABLE `documents_vehicules`
  ADD CONSTRAINT `fk_docveh_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_docveh_telecharge_par` FOREIGN KEY (`telecharge_par_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- --------------------------------------------------------
-- TABLES DE SUIVI (27-33)
-- --------------------------------------------------------

-- Table 27: documents_chauffeurs
ALTER TABLE `documents_chauffeurs`
  ADD CONSTRAINT `fk_docchauf_chauffeur` FOREIGN KEY (`chauffeur_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_docchauf_telecharge_par` FOREIGN KEY (`telecharge_par_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table 28: historique_kilometrage
ALTER TABLE `historique_kilometrage`
  ADD CONSTRAINT `fk_histokm_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_histokm_enregistre_par` FOREIGN KEY (`enregistre_par_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table 29: alertes_kilometrage
ALTER TABLE `alertes_kilometrage`
  ADD CONSTRAINT `fk_alertkm_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Table 30: planning_maintenance
ALTER TABLE `planning_maintenance`
  ADD CONSTRAINT `fk_planmaint_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_planmaint_regle` FOREIGN KEY (`regle_id`) REFERENCES `regles_maintenance` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_planmaint_derniere_interv` FOREIGN KEY (`derniere_intervention_id`) REFERENCES `interventions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table 31: outils
-- Pas de FK pour cette table

-- Table 32: problemes_outils
ALTER TABLE `problemes_outils`
  ADD CONSTRAINT `fk_pboutil_outil` FOREIGN KEY (`outil_id`) REFERENCES `outils` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pboutil_signale_par` FOREIGN KEY (`signale_par_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- Table 33: performances_chauffeurs
ALTER TABLE `performances_chauffeurs`
  ADD CONSTRAINT `fk_perfchauf_chauffeur` FOREIGN KEY (`chauffeur_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- --------------------------------------------------------
-- TABLES SYSTÈME (34-38)
-- --------------------------------------------------------

-- Table 34: kpi_vehicules
ALTER TABLE `kpi_vehicules`
  ADD CONSTRAINT `fk_kpiveh_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Table 35: journaux_audit
ALTER TABLE `journaux_audit`
  ADD CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table 36: notifications
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_categorie` FOREIGN KEY (`categorie_id`) REFERENCES `categories_notifications` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notifications_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table 37: envois_notifications
ALTER TABLE `envois_notifications`
  ADD CONSTRAINT `fk_envoi_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_envoi_user` FOREIGN KEY (`user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Table 38: parametres_alertes
ALTER TABLE `parametres_alertes`
  ADD CONSTRAINT `fk_paramalert_categorie` FOREIGN KEY (`categorie_notification_id`) REFERENCES `categories_notifications` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ========================================
-- FIN DES CONTRAINTES
-- ========================================



-- ========================================
-- TRIGGERS (13 AU TOTAL)
-- ========================================

DELIMITER $$

-- --------------------------------------------------------
-- TRIGGER 01: Immobilisation véhicule si inspection "danger_immediat"
-- --------------------------------------------------------
CREATE TRIGGER `trg_immobilisation_inspection_danger` 
AFTER INSERT ON `inspections_vehicules` 
FOR EACH ROW 
BEGIN
  IF NEW.statut_global = 'danger_immediat' THEN
    UPDATE vehicules
    SET statut = 'immobilise',
        date_immobilisation = NOW()
    WHERE immatriculation = NEW.vehicule_immatriculation AND est_supprime = 0;
    
    -- Notification automatique
    INSERT INTO notifications (categorie_id, titre, message, vehicule_immatriculation, donnees, date_creation)
    SELECT 
      cn.id,
      CONCAT('DANGER IMMÉDIAT - Véhicule ', NEW.vehicule_immatriculation, ' immobilisé'),
      CONCAT('Inspection du ', DATE_FORMAT(NOW(), '%d/%m/%Y'), ' : Véhicule immobilisé suite à détection de danger immédiat.'),
      NEW.vehicule_immatriculation,
      JSON_OBJECT('inspection_vehicule_id', NEW.id, 'statut', 'danger_immediat'),
      NOW()
    FROM categories_notifications cn
    WHERE cn.code = 'alerte_inspection' AND cn.est_supprime = 0 AND cn.est_actif = 1
    LIMIT 1;
  END IF;
END$$

-- --------------------------------------------------------
-- TRIGGER 02: Gestion statut véhicule pendant mission (démarrage)
-- --------------------------------------------------------
CREATE TRIGGER `trg_statut_veh_mission_start` 
AFTER UPDATE ON `missions` 
FOR EACH ROW 
BEGIN
  IF NEW.est_supprime = 0 THEN
    IF OLD.statut = 'planifiee' AND NEW.statut = 'en_cours' THEN
      UPDATE vehicules 
      SET statut = 'en_mission' 
      WHERE immatriculation = NEW.vehicule_immatriculation AND est_supprime = 0;
    END IF;
  END IF;
END$$

-- --------------------------------------------------------
-- TRIGGER 03: Gestion statut véhicule + MAJ km après mission (fin)
-- --------------------------------------------------------
CREATE TRIGGER `trg_fin_mission_km_statut` 
AFTER UPDATE ON `missions` 
FOR EACH ROW 
BEGIN
  IF NEW.est_supprime = 0 THEN
    -- Retour statut disponible si mission terminée/annulée
    IF OLD.statut = 'en_cours' AND NEW.statut IN ('terminee', 'annulee') THEN
      UPDATE vehicules 
      SET statut = 'disponible' 
      WHERE immatriculation = NEW.vehicule_immatriculation AND est_supprime = 0;
    END IF;
    
    -- MAJ kilométrage si mission terminée avec km_retour
    IF NEW.statut = 'terminee' AND NEW.km_retour IS NOT NULL AND 
       (OLD.km_retour IS NULL OR NEW.km_retour > OLD.km_retour) THEN
      
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
  END IF;
END$$

-- --------------------------------------------------------
-- TRIGGER 04: Gestion statut véhicule pendant intervention (démarrage)
-- --------------------------------------------------------
CREATE TRIGGER `trg_statut_veh_intervention_start` 
AFTER UPDATE ON `interventions` 
FOR EACH ROW 
BEGIN
  IF NEW.est_supprime = 0 THEN
    IF OLD.statut != 'en_cours' AND NEW.statut = 'en_cours' THEN
      UPDATE vehicules 
      SET statut = 'en_maintenance' 
      WHERE immatriculation = NEW.vehicule_immatriculation AND est_supprime = 0;
    END IF;
  END IF;
END$$

-- --------------------------------------------------------
-- TRIGGER 05: Gestion statut véhicule après intervention (fin)
-- --------------------------------------------------------
CREATE TRIGGER `trg_statut_veh_intervention_end` 
AFTER UPDATE ON `interventions` 
FOR EACH ROW 
BEGIN
  IF NEW.est_supprime = 0 THEN
    IF OLD.statut = 'en_cours' AND NEW.statut IN ('terminee', 'annulee') THEN
      UPDATE vehicules 
      SET statut = 'disponible' 
      WHERE immatriculation = NEW.vehicule_immatriculation AND est_supprime = 0;
    END IF;
  END IF;
END$$

-- --------------------------------------------------------
-- TRIGGER 06: MAJ kilométrage après PC Radio (retour)
-- --------------------------------------------------------
CREATE TRIGGER `trg_maj_km_apres_pcradio` 
AFTER UPDATE ON `pc_radio` 
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
END$$

-- --------------------------------------------------------
-- TRIGGER 07: Notification stock faible
-- --------------------------------------------------------
CREATE TRIGGER `trg_notif_stock_faible` 
AFTER UPDATE ON `pieces_detachees` 
FOR EACH ROW 
BEGIN
  DECLARE cat_id INT;
  DECLARE notif_id BIGINT;
  
  IF NEW.quantite_stock <= NEW.seuil_alerte AND 
     OLD.quantite_stock > OLD.seuil_alerte AND
     NEW.est_supprime = 0 THEN
    
    SELECT id INTO cat_id 
    FROM categories_notifications 
    WHERE code = 'alerte_stock_faible' AND est_supprime = 0 
    LIMIT 1;
    
    IF cat_id IS NOT NULL THEN
      -- Créer la notification
      INSERT INTO notifications (
        categorie_id, titre, message, donnees, date_creation
      ) VALUES (
        cat_id,
        CONCAT('Stock faible: ', NEW.nom),
        CONCAT('La pièce "', NEW.nom, '" a atteint le seuil d''alerte. Stock actuel: ', NEW.quantite_stock, ' ', NEW.unite),
        JSON_OBJECT('piece_id', NEW.id, 'quantite_stock', NEW.quantite_stock, 'seuil_alerte', NEW.seuil_alerte),
        NOW()
      );
      
      SET notif_id = LAST_INSERT_ID();
      
      -- Créer les envois pour les users concernés (chef_parc)
      INSERT INTO envois_notifications (notification_id, user_id, canal, statut_envoi, date_creation)
      SELECT notif_id, u.id, 'in_app', 'en_attente', NOW()
      FROM utilisateurs u
      INNER JOIN roles r ON u.role_id = r.id
      WHERE r.code = 'chef_parc' AND u.est_actif = 1 AND u.est_supprime = 0;
    END IF;
  END IF;
END$$

-- --------------------------------------------------------
-- TRIGGER 08: MAJ coût pièces intervention (ajout prélèvement)
-- --------------------------------------------------------
CREATE TRIGGER `trg_maj_cout_pieces_insert` 
AFTER INSERT ON `prelevements_pieces` 
FOR EACH ROW 
BEGIN
  UPDATE interventions 
  SET cout_pieces = (
    SELECT COALESCE(SUM(quantite * prix_unitaire), 0)
    FROM prelevements_pieces
    WHERE intervention_id = NEW.intervention_id
  )
  WHERE id = NEW.intervention_id;
END$$

-- --------------------------------------------------------
-- TRIGGER 09: MAJ coût pièces intervention (suppression prélèvement)
-- --------------------------------------------------------
CREATE TRIGGER `trg_maj_cout_pieces_delete` 
AFTER DELETE ON `prelevements_pieces` 
FOR EACH ROW 
BEGIN
  UPDATE interventions 
  SET cout_pieces = (
    SELECT COALESCE(SUM(quantite * prix_unitaire), 0)
    FROM prelevements_pieces
    WHERE intervention_id = OLD.intervention_id
  )
  WHERE id = OLD.intervention_id;
END$$

-- --------------------------------------------------------
-- TRIGGER 10: MAJ stock + mouvement après prélèvement pièce
-- --------------------------------------------------------
CREATE TRIGGER `trg_maj_stock_apres_prelevement` 
AFTER INSERT ON `prelevements_pieces` 
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
END$$

-- --------------------------------------------------------
-- TRIGGER 11: Notification accident déclaré
-- --------------------------------------------------------
CREATE TRIGGER `trg_notif_accident` 
AFTER INSERT ON `accidents` 
FOR EACH ROW 
BEGIN
  DECLARE cat_id INT;
  DECLARE notif_id BIGINT;
  
  SELECT id INTO cat_id 
  FROM categories_notifications 
  WHERE code = 'alerte_accident' AND est_supprime = 0 
  LIMIT 1;
  
  IF cat_id IS NOT NULL THEN
    INSERT INTO notifications (
      categorie_id, titre, message, vehicule_immatriculation, donnees, date_creation
    ) VALUES (
      cat_id,
      CONCAT('Accident déclaré - ', NEW.vehicule_immatriculation),
      CONCAT('Accident le ', DATE_FORMAT(NEW.date_accident, '%d/%m/%Y %H:%i'), ' - ', COALESCE(NEW.lieu, 'Lieu non précisé')),
      NEW.vehicule_immatriculation,
      JSON_OBJECT('accident_id', NEW.id, 'niveau_degats', NEW.niveau_degats, 'vehicule_immobilise', NEW.vehicule_immobilise),
      NOW()
    );
    
    SET notif_id = LAST_INSERT_ID();
    
    -- Envoi multi-canal pour admin + chef_parc + chef_tf
    INSERT INTO envois_notifications (notification_id, user_id, canal, statut_envoi, date_creation)
    SELECT notif_id, u.id, 'email', 'en_attente', NOW()
    FROM utilisateurs u
    INNER JOIN roles r ON u.role_id = r.id
    WHERE r.code IN ('admin', 'chef_parc', 'chef_tf') AND u.est_actif = 1 AND u.est_supprime = 0;
    
    INSERT INTO envois_notifications (notification_id, user_id, canal, statut_envoi, date_creation)
    SELECT notif_id, u.id, 'in_app', 'en_attente', NOW()
    FROM utilisateurs u
    INNER JOIN roles r ON u.role_id = r.id
    WHERE r.code IN ('admin', 'chef_parc', 'chef_tf') AND u.est_actif = 1 AND u.est_supprime = 0;
  END IF;
END$$

-- --------------------------------------------------------
-- TRIGGER 12: Notification anomalie PC Radio détectée
-- --------------------------------------------------------
CREATE TRIGGER `trg_notif_anomalie_pcradio` 
AFTER INSERT ON `anomalies_pc_radio` 
FOR EACH ROW 
BEGIN
  DECLARE cat_id INT;
  DECLARE notif_id BIGINT;
  
  SELECT id INTO cat_id 
  FROM categories_notifications 
  WHERE code = 'alerte_anomalie_pcradio' AND est_supprime = 0 
  LIMIT 1;
  
  IF cat_id IS NOT NULL THEN
    INSERT INTO notifications (
      categorie_id, titre, message, vehicule_immatriculation, donnees, date_creation
    ) VALUES (
      cat_id,
      CONCAT('Anomalie PC Radio - ', NEW.vehicule_immatriculation),
      CONCAT('Dégât détecté au retour: ', NEW.type_degat, ' - ', LEFT(NEW.description, 100)),
      NEW.vehicule_immatriculation,
      JSON_OBJECT('anomalie_pc_radio_id', NEW.id, 'severite', NEW.severite, 'partie_vehicule', NEW.partie_vehicule),
      NOW()
    );
    
    SET notif_id = LAST_INSERT_ID();
    
    INSERT INTO envois_notifications (notification_id, user_id, canal, statut_envoi, date_creation)
    SELECT notif_id, u.id, 'email', 'en_attente', NOW()
    FROM utilisateurs u
    INNER JOIN roles r ON u.role_id = r.id
    WHERE r.code IN ('chef_parc', 'chef_tf') AND u.est_actif = 1 AND u.est_supprime = 0;
  END IF;
END$$

-- --------------------------------------------------------
-- TRIGGER 13: Immobilisation véhicule si accident grave avec véhicule immobilisé
-- --------------------------------------------------------
CREATE TRIGGER `trg_immobilisation_accident` 
AFTER INSERT ON `accidents` 
FOR EACH ROW 
BEGIN
  IF NEW.vehicule_immobilise = 1 THEN
    UPDATE vehicules
    SET statut = 'immobilise',
        date_immobilisation = NEW.date_accident
    WHERE immatriculation = NEW.vehicule_immatriculation AND est_supprime = 0;
  END IF;
END$$

DELIMITER ;

-- ========================================
-- DONNÉES DE TEST POUR NOUVELLES TABLES
-- ========================================

-- Types d'inspection
INSERT INTO `types_inspection` (`id`, `code`, `libelle`, `description`, `frequence_jours`, `est_obligatoire`, `ordre_affichage`, `est_actif`) VALUES
(1, 'quotidienne', 'Inspection Quotidienne', 'Contrôle rapide avant utilisation', 1, 1, 1, 1),
(2, 'hebdomadaire', 'Inspection Hebdomadaire', 'Contrôle approfondi chaque semaine', 7, 1, 2, 1),
(3, 'complete', 'Inspection Complète', 'Inspection détaillée tous points', 30, 0, 3, 1),
(4, 'tf', 'Inspection Transport de Fonds', 'Inspection spéciale véhicules blindés TF', 1, 1, 4, 1),
(5, 'periodique', 'Inspection Périodique', 'Inspection trimestrielle', 90, 0, 5, 1);

-- Types d'intervenant
INSERT INTO `types_intervenant` (`id`, `code`, `libelle`, `description`, `competences_requises`, `ordre_affichage`, `est_actif`) VALUES
(1, 'mecanicien', 'Mécanicien Général', 'Réparations mécaniques générales', 'Moteur, transmission, embrayage', 1, 1),
(2, 'electricien', 'Électricien Auto', 'Systèmes électriques et électroniques', 'Électricité, diagnostic électronique', 2, 1),
(3, 'carrossier', 'Carrossier-Peintre', 'Réparation carrosserie et peinture', 'Tôlerie, soudure, peinture', 3, 1),
(4, 'pneumaticien', 'Pneumaticien', 'Spécialiste pneumatiques', 'Montage, équilibrage, géométrie', 4, 1),
(5, 'climatisation', 'Frigoriste Auto', 'Climatisation et chauffage', 'Circuits frigorifiques, recharge gaz', 5, 1);

-- Catégories notifications (ajout des manquantes)
INSERT INTO `categories_notifications` (`id`, `code`, `libelle`, `niveau_priorite`, `canaux`, `roles_cibles`, `description`, `est_actif`) VALUES
(1, 'alerte_critique_email', 'Alerte Critique (Email + Popup)', 'critique', '["email", "popup", "in_app"]', '["admin", "chef_parc", "chef_tf"]', 'Véhicule immobilisé, accident, rupture stock critique', 1),
(2, 'alerte_importante', 'Alerte Importante', 'important', '["email", "in_app"]', '["chef_parc", "chef_tf"]', 'Vidange proche, assurance expire, demande > 48h', 1),
(3, 'alerte_surveiller', 'À Surveiller', 'a_surveiller', '["in_app"]', '["chef_parc", "chef_tf"]', 'Stock faible, maintenance planifiée proche', 1),
(4, 'info_in_app', 'Information', 'normal', '["in_app"]', '["chef_parc", "mecanicien", "chauffeur"]', 'Mission assignée, intervention terminée', 1),
(5, 'alerte_tf', 'Alerte Transport de Fonds', 'important', '["email", "in_app"]', '["chef_tf"]', 'Anomalie véhicule TF, inspection non conforme TF', 1),
(6, 'alerte_inspection', 'Alerte Inspection', 'critique', '["email", "popup", "in_app"]', '["chef_parc", "chef_tf", "admin"]', 'Inspection danger immédiat', 1),
(7, 'alerte_stock_faible', 'Stock Faible', 'a_surveiller', '["in_app"]', '["chef_parc"]', 'Stock pièce en dessous du seuil', 1),
(8, 'alerte_accident', 'Accident Déclaré', 'critique', '["email", "popup", "in_app", "sms"]', '["admin", "chef_parc", "chef_tf"]', 'Accident véhicule déclaré', 1),
(9, 'alerte_anomalie_pcradio', 'Anomalie PC Radio', 'important', '["email", "in_app"]', '["chef_parc", "chef_tf"]', 'Dégâts détectés au retour PC Radio', 1),
(10, 'info_chauffeur', 'Information Chauffeur', 'normal', '["in_app"]', '["chauffeur"]', 'Mission assignée, permis expire, anomalie résolue', 1);

-- Règles maintenance (données de base)
INSERT INTO `regles_maintenance` (`id`, `type_maintenance`, `description`, `type_declencheur`, `valeur_km`, `valeur_mois`, `type_vehicule`, `duree_estimee_heures`, `cout_estime`, `est_actif`) VALUES
(1, 'vidange_simple', 'Vidange huile moteur simple (5W40/10W40/15W40)', 'km', 5000, NULL, NULL, 1, 15000.00, 1),
(2, 'vidange_complete', 'Vidange complète : huile moteur + tous filtres', 'km', 10000, NULL, NULL, 2, 35000.00, 1),
(3, 'vidange_boite_manuelle', 'Vidange boîte de vitesses manuelle (80W-90)', 'km', 60000, NULL, NULL, 2, 25000.00, 1),
(4, 'vidange_boite_automatique', 'Vidange boîte automatique (ATX)', 'km', 40000, NULL, NULL, 3, 45000.00, 1),
(5, 'revision_complete', 'Révision complète tous points', 'km', 20000, NULL, NULL, 4, 75000.00, 1),
(6, 'controle_freins', 'Vérification système freinage', 'mixte', 15000, 12, NULL, 1, 20000.00, 1),
(7, 'permutation_pneus', 'Permutation et équilibrage pneus', 'km', 10000, NULL, NULL, 1, 10000.00, 1),
(8, 'controle_climatisation', 'Vérification système climatisation', 'date', NULL, 12, NULL, 1, 15000.00, 1);

COMMIT;

-- ========================================
-- FIN DU SCRIPT
-- ========================================