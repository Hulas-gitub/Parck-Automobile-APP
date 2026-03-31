-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : mar. 31 mars 2026 à 13:23
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `fleetify_db`
--

-- --------------------------------------------------------

--
-- Structure de la table `accidents`
--

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
  `vehicule_immobilise` tinyint(1) NOT NULL DEFAULT 0,
  `jours_immobilisation` int(11) DEFAULT NULL,
  `km_au_moment_accident` bigint(20) UNSIGNED DEFAULT NULL,
  `assure` tinyint(1) NOT NULL DEFAULT 0,
  `cout_estime` decimal(14,2) NOT NULL DEFAULT 0.00,
  `cout_reparation_final` decimal(14,2) DEFAULT NULL,
  `montant_reclame_assurance` decimal(14,2) DEFAULT NULL,
  `montant_verse_assurance` decimal(14,2) DEFAULT NULL,
  `statut` varchar(50) NOT NULL DEFAULT 'declare',
  `notes` text DEFAULT NULL,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déclencheurs `accidents`
--
DELIMITER $$
CREATE TRIGGER `trg_immobilisation_accident` AFTER INSERT ON `accidents` FOR EACH ROW BEGIN
              IF NEW.vehicule_immobilise = 1 THEN
                UPDATE vehicules
                SET statut = "immobilise",
                    date_immobilisation = NEW.date_accident
                WHERE immatriculation = NEW.vehicule_immatriculation AND est_supprime = 0;
              END IF;
            END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_notif_accident` AFTER INSERT ON `accidents` FOR EACH ROW BEGIN
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
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `alertes_kilometrage`
--

CREATE TABLE `alertes_kilometrage` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `type_alerte` varchar(100) NOT NULL,
  `seuil_km` bigint(20) UNSIGNED NOT NULL,
  `km_actuel` bigint(20) UNSIGNED NOT NULL,
  `est_notifie` tinyint(1) NOT NULL DEFAULT 0,
  `date_notification` timestamp NULL DEFAULT NULL,
  `est_resolue` tinyint(1) NOT NULL DEFAULT 0,
  `date_resolution` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `km_restants` int(11) GENERATED ALWAYS AS (`seuil_km` - `km_actuel`) VIRTUAL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `annees`
--

CREATE TABLE `annees` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `annee` year(4) NOT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `annees`
--

INSERT INTO `annees` (`id`, `annee`, `est_actif`, `created_at`, `updated_at`) VALUES
(1, '2019', 1, NULL, NULL),
(2, '2020', 1, NULL, NULL),
(3, '2021', 1, NULL, NULL),
(4, '2022', 1, NULL, NULL),
(5, '2023', 1, NULL, NULL),
(6, '2026', 1, '2026-03-31 08:54:10', '2026-03-31 08:54:10');

-- --------------------------------------------------------

--
-- Structure de la table `anomalies`
--

CREATE TABLE `anomalies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `signalee_par_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `mission_id` bigint(20) UNSIGNED DEFAULT NULL,
  `inspection_vehicule_id` bigint(20) UNSIGNED DEFAULT NULL,
  `date_signalement` datetime NOT NULL DEFAULT current_timestamp(),
  `description` text NOT NULL,
  `partie_vehicule` varchar(100) DEFAULT NULL COMMENT 'moteur, freins, direction',
  `severite` varchar(30) NOT NULL DEFAULT 'moyenne' COMMENT 'faible, moyenne, haute, critique',
  `km_au_signalement` bigint(20) UNSIGNED DEFAULT NULL,
  `position_gps` varchar(100) DEFAULT NULL,
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photos`)),
  `statut` varchar(50) NOT NULL DEFAULT 'ouverte' COMMENT 'ouverte, en_cours, resolue, annulee',
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `anomalies`
--

INSERT INTO `anomalies` (`id`, `vehicule_immatriculation`, `signalee_par_user_id`, `mission_id`, `inspection_vehicule_id`, `date_signalement`, `description`, `partie_vehicule`, `severite`, `km_au_signalement`, `position_gps`, `photos`, `statut`, `est_supprime`, `date_creation`, `date_modification`, `date_suppression`) VALUES
(1, 'LBV-001-A', 5, 2, NULL, '2026-03-30 10:14:09', 'mauvais', NULL, 'moyenne', 33380, 'GP', NULL, 'ouverte', 0, '2026-03-30 09:14:09', '2026-03-30 09:14:09', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `anomalies_pc_radio`
--

CREATE TABLE `anomalies_pc_radio` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `pc_radio_id` bigint(20) UNSIGNED NOT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `chauffeur_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `type_degat` varchar(100) DEFAULT NULL,
  `partie_vehicule` varchar(100) DEFAULT NULL,
  `description` text NOT NULL,
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photos`)),
  `severite` varchar(30) NOT NULL DEFAULT 'moyenne' COMMENT 'faible, moyenne, haute, critique',
  `date_detection` datetime NOT NULL DEFAULT current_timestamp(),
  `statut` varchar(50) NOT NULL DEFAULT 'signale' COMMENT 'signale, en_cours, resolu, cloture',
  `notes` text DEFAULT NULL,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déclencheurs `anomalies_pc_radio`
--
DELIMITER $$
CREATE TRIGGER `trg_notif_anomalie_pcradio` AFTER INSERT ON `anomalies_pc_radio` FOR EACH ROW BEGIN
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
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `carnets_carburant`
--

CREATE TABLE `carnets_carburant` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `mission_id` bigint(20) UNSIGNED DEFAULT NULL,
  `date_plein` date NOT NULL,
  `kilometrage` bigint(20) UNSIGNED DEFAULT NULL,
  `litres` decimal(12,2) NOT NULL,
  `prix_unitaire` decimal(12,4) DEFAULT NULL,
  `station` varchar(200) DEFAULT NULL,
  `chemin_recu` varchar(255) DEFAULT NULL,
  `km_depuis_dernier_plein` bigint(20) UNSIGNED DEFAULT NULL,
  `consommation_calculee` decimal(10,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `categories_notifications`
--

CREATE TABLE `categories_notifications` (
  `id` int(10) UNSIGNED NOT NULL,
  `code` varchar(100) NOT NULL COMMENT 'alerte_critique_email, alerte_importante, info_in_app',
  `libelle` varchar(200) NOT NULL,
  `niveau_priorite` varchar(30) NOT NULL DEFAULT 'normal' COMMENT 'critique, important, a_surveiller, normal',
  `canaux` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '["email", "popup", "in_app"]' CHECK (json_valid(`canaux`)),
  `roles_cibles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '["chef_parc", "chef_tf"]' CHECK (json_valid(`roles_cibles`)),
  `description` text DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `categories_vehicules`
--

CREATE TABLE `categories_vehicules` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(100) NOT NULL COMMENT 'Berline, SUV, Utilitaire, 4x4, etc.',
  `description` text DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `categories_vehicules`
--

INSERT INTO `categories_vehicules` (`id`, `nom`, `description`, `est_actif`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Berline', 'Véhicule de tourisme standard', 1, NULL, NULL, NULL),
(2, 'SUV', 'Sport Utility Vehicle, tout-terrain léger', 1, NULL, NULL, NULL),
(3, '4x4', 'Véhicule tout-terrain à 4 roues motrices', 1, NULL, NULL, NULL),
(4, 'Utilitaire', 'Véhicule de transport de marchandises', 0, NULL, '2026-03-31 10:20:41', '2026-03-31 10:20:41'),
(5, 'Minibus', 'Transport collectif de personnes', 1, NULL, NULL, NULL),
(6, 'Itulitaires', NULL, 1, '2026-03-31 10:20:56', '2026-03-31 10:20:56', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `checklists`
--

CREATE TABLE `checklists` (
  `id` int(10) UNSIGNED NOT NULL,
  `code` varchar(100) NOT NULL COMMENT 'checklist_vidange, checklist_freins, checklist_tf',
  `libelle` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `type_inspection_id` int(10) UNSIGNED DEFAULT NULL COMMENT 'Type d''inspection associé',
  `categorie` varchar(100) DEFAULT NULL COMMENT 'accessoires, niveaux_fluides, pneumatiques, carrosserie, freinage, direction, electricite, equipements_securite',
  `elements_a_verifier` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON: liste des éléments standards à vérifier' CHECK (json_valid(`elements_a_verifier`)),
  `ordre_affichage` int(11) NOT NULL DEFAULT 0,
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `demandes_intervention`
--

CREATE TABLE `demandes_intervention` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `anomalie_id` bigint(20) UNSIGNED DEFAULT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `demandeur_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `date_demande` datetime NOT NULL DEFAULT current_timestamp(),
  `type_maintenance` varchar(50) NOT NULL DEFAULT 'corrective' COMMENT 'corrective, preventive',
  `type_intervention` varchar(100) DEFAULT NULL,
  `priorite` varchar(30) NOT NULL DEFAULT 'normale' COMMENT 'faible, normale, haute, urgente',
  `statut` varchar(50) NOT NULL DEFAULT 'en_attente' COMMENT 'en_attente, approuvee, rejetee',
  `commentaire` text DEFAULT NULL,
  `motif_rejet` text DEFAULT NULL,
  `validee_par_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `date_validation` datetime DEFAULT NULL,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `directions`
--

CREATE TABLE `directions` (
  `id` int(10) UNSIGNED NOT NULL,
  `nom` varchar(150) NOT NULL,
  `reference` varchar(50) DEFAULT NULL,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `directions`
--

INSERT INTO `directions` (`id`, `nom`, `reference`, `est_supprime`, `date_creation`, `date_modification`, `date_suppression`) VALUES
(1, 'Direction de Système d\'information', 'DSI', 0, '2026-01-07 11:53:48', '2026-01-07 11:53:48', NULL),
(2, 'Direction des Opérations', 'DOP', 0, '2026-03-25 09:52:49', '2026-03-25 09:52:49', NULL),
(3, 'Direction Administrative et Financière', 'DAF', 0, '2026-03-25 09:52:49', '2026-03-25 09:52:49', NULL),
(4, 'Direction des Ressources Humaines', 'DRH', 0, '2026-03-25 09:52:49', '2026-03-25 09:52:49', NULL),
(5, 'Direction Commerciale', 'DC', 0, '2026-03-25 09:52:49', '2026-03-25 09:52:49', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `documents_chauffeurs`
--

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
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `documents_chauffeurs`
--

INSERT INTO `documents_chauffeurs` (`id`, `chauffeur_user_id`, `type_document`, `nom_document`, `chemin_fichier`, `numero_permis`, `categories_permis`, `pays_delivrance`, `date_delivrance`, `date_expiration`, `telecharge_par_user_id`, `notes`, `est_supprime`, `date_creation`, `date_modification`, `date_suppression`) VALUES
(1, 6, 'permis_conduire', 'Permis de conduire — Jean-Marc Koua', 'docs/chauf/koua_permis.pdf', 'GA-P-2019-004512', 'B, C', 'Gabon', '2019-04-10', '2029-04-09', 2, NULL, 0, '2026-03-25 10:26:47', '2026-03-25 10:26:47', NULL),
(2, 6, 'carte_identite', 'CNI — Jean-Marc Koua', 'docs/chauf/koua_cni.pdf', NULL, NULL, 'Gabon', '2018-07-22', '2028-07-21', 2, NULL, 0, '2026-03-25 10:26:47', '2026-03-25 10:26:47', NULL),
(3, 3, 'permis_conduire', 'Permis de conduire — Patrick Mboula', 'docs/chauf/mboula_permis.pdf', 'GA-P-2017-001234', 'B, C, D', 'Gabon', '2017-01-15', '2027-01-14', 1, NULL, 0, '2026-03-25 10:26:47', '2026-03-25 10:26:47', NULL),
(4, 5, 'permis_conduire', 'Permis de conduire — Rodrigue Ella', 'docs/chauf/ella_permis.pdf', 'GA-P-2020-007788', 'B', 'Gabon', '2020-09-05', '2030-09-04', 2, NULL, 0, '2026-03-25 10:26:47', '2026-03-25 10:26:47', NULL),
(5, 6, 'visite_medicale', 'Aptitude médicale — Jean-Marc Koua', 'docs/chauf/koua_medical.pdf', NULL, NULL, 'Gabon', '2025-11-01', '2026-10-31', 2, NULL, 0, '2026-03-25 10:26:47', '2026-03-25 10:26:47', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `documents_vehicules`
--

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
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `documents_vehicules`
--

INSERT INTO `documents_vehicules` (`id`, `vehicule_immatriculation`, `type_document`, `nom_document`, `chemin_fichier`, `compagnie_assurance`, `numero_contrat`, `type_couverture`, `montant_prime`, `date_emission`, `date_expiration`, `telecharge_par_user_id`, `notes`, `est_supprime`, `date_creation`, `date_modification`, `date_suppression`) VALUES
(1, 'LBV-001-A', 'assurance', 'Attestation assurance LBV-001-A', 'docs/veh/lbv001_assurance.pdf', 'NSIA Gabon', 'GA-2025-10045', 'Tous risques', 850000.00, '2025-05-15', '2027-05-14', 2, NULL, 1, '2026-03-25 10:26:32', '2026-03-31 09:28:58', '2026-03-31 09:28:58'),
(2, 'LBV-001-A', 'visite_technique', 'Visite technique LBV-001-A 2026', 'docs/veh/lbv001_vt_2026.pdf', NULL, NULL, NULL, NULL, '2026-03-10', '2027-03-10', 2, NULL, 1, '2026-03-25 10:26:32', '2026-03-31 08:49:52', '2026-03-31 08:49:52'),
(3, 'LBV-002-A', 'assurance', 'Attestation assurance LBV-002-A', 'docs/veh/lbv002_assurance.pdf', 'CIMGA Gabon', 'GA-2024-88321', 'Tiers étendu', 620000.00, '2024-09-20', '2026-09-19', 2, NULL, 0, '2026-03-25 10:26:32', '2026-03-25 10:26:32', NULL),
(4, 'LBV-004-B', 'carte_grise', 'Carte grise LBV-004-B', 'docs/veh/lbv004_carte_grise.pdf', NULL, NULL, NULL, NULL, '2023-03-01', NULL, 1, NULL, 0, '2026-03-25 10:26:32', '2026-03-25 10:26:32', NULL),
(5, 'LBV-005-C', 'assurance', 'Attestation assurance LBV-005-C', 'docs/veh/lbv005_assurance.pdf', 'NSIA Gabon', 'GA-2023-55678', 'Tiers simple', 380000.00, '2023-07-10', '2026-07-09', 2, NULL, 0, '2026-03-25 10:26:32', '2026-03-25 10:26:32', NULL),
(6, 'LBV-001-A', 'Carte grise', 'fff', 'upload/document/vehicules/a6a66d67-5989-4e78-82a6-0a33da41c781.pdf', NULL, NULL, NULL, NULL, '2026-03-31', '2026-04-04', 2, 'dddddddddd', 0, '2026-03-31 09:29:46', '2026-03-31 09:29:46', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `elements_inspectes`
--

CREATE TABLE `elements_inspectes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `inspection_vehicule_id` bigint(20) UNSIGNED NOT NULL,
  `checklist_id` int(10) UNSIGNED NOT NULL,
  `element_verifie` varchar(150) NOT NULL,
  `statut` varchar(30) NOT NULL DEFAULT 'OK' COMMENT 'OK, NOK, manquant, use, defectueux',
  `valeur_relevee` varchar(100) DEFAULT NULL,
  `commentaire` text DEFAULT NULL,
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photos`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `envois_notifications`
--

CREATE TABLE `envois_notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `notification_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `canal` varchar(50) NOT NULL,
  `statut_envoi` varchar(50) NOT NULL DEFAULT 'en_attente',
  `date_envoi` timestamp NULL DEFAULT NULL,
  `date_lecture` timestamp NULL DEFAULT NULL,
  `est_lu` tinyint(1) NOT NULL DEFAULT 0,
  `erreur` text DEFAULT NULL,
  `metadata_envoi` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata_envoi`)),
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `fournisseurs`
--

CREATE TABLE `fournisseurs` (
  `id` int(10) UNSIGNED NOT NULL,
  `nom` varchar(200) NOT NULL,
  `contact` varchar(150) DEFAULT NULL,
  `telephone` varchar(50) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL COMMENT 'pieces, carburant, assurance, autre',
  `adresse` text DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `historique_kilometrage`
--

CREATE TABLE `historique_kilometrage` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `kilometrage` bigint(20) UNSIGNED NOT NULL,
  `date_relevee` date NOT NULL,
  `source` varchar(50) NOT NULL DEFAULT 'manuel',
  `source_id` bigint(20) UNSIGNED DEFAULT NULL,
  `enregistre_par_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `inspections`
--

CREATE TABLE `inspections` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type_inspection_id` int(10) UNSIGNED NOT NULL,
  `inspecteur_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `km_au_moment_inspection` bigint(20) UNSIGNED DEFAULT NULL,
  `date_inspection` datetime NOT NULL,
  `nom_verificateurs` varchar(255) DEFAULT NULL,
  `autres_constats` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `chemin_rapport_pdf` varchar(255) DEFAULT NULL,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `inspections`
--

INSERT INTO `inspections` (`id`, `type_inspection_id`, `inspecteur_user_id`, `km_au_moment_inspection`, `date_inspection`, `nom_verificateurs`, `autres_constats`, `notes`, `chemin_rapport_pdf`, `est_supprime`, `date_creation`, `date_modification`, `date_suppression`) VALUES
(1, 1, 5, 29990, '2026-03-30 11:16:07', 'HQITLD', 'GSSS', NULL, 'DGDGGD', 0, '2026-03-30 09:18:35', '2026-03-30 09:18:35', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `inspections_vehicules`
--

CREATE TABLE `inspections_vehicules` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `inspection_id` bigint(20) UNSIGNED NOT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `statut_global` varchar(50) NOT NULL DEFAULT 'conforme' COMMENT 'conforme, non_conforme, danger_immediat',
  `anomalies_detectees` tinyint(1) NOT NULL DEFAULT 0,
  `anomalie_creee_id` bigint(20) UNSIGNED DEFAULT NULL,
  `observations_vehicule` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `inspections_vehicules`
--

INSERT INTO `inspections_vehicules` (`id`, `inspection_id`, `vehicule_immatriculation`, `statut_global`, `anomalies_detectees`, `anomalie_creee_id`, `observations_vehicule`, `created_at`, `updated_at`) VALUES
(3, 1, 'LBV-001-A', 'conforme', 0, 1, 'R', NULL, NULL);

--
-- Déclencheurs `inspections_vehicules`
--
DELIMITER $$
CREATE TRIGGER `trg_immobilisation_inspection_danger` AFTER INSERT ON `inspections_vehicules` FOR EACH ROW BEGIN
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
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `intervenants`
--

CREATE TABLE `intervenants` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type_intervenant_id` int(10) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `nom_externe` varchar(200) DEFAULT NULL,
  `telephone` varchar(50) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `est_externe` tinyint(1) NOT NULL DEFAULT 0,
  `tarif_horaire` decimal(12,2) NOT NULL DEFAULT 0.00,
  `specialisation` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `intervenants`
--

INSERT INTO `intervenants` (`id`, `type_intervenant_id`, `user_id`, `nom_externe`, `telephone`, `email`, `est_externe`, `tarif_horaire`, `specialisation`, `notes`, `est_actif`, `est_supprime`, `date_creation`, `date_modification`, `date_suppression`) VALUES
(1, 1, 5, NULL, '+241 07 10 20 30', 'rodrigue.ella@sgs-gabon.com', 0, 15000.00, 'Moteur diesel Toyota/Mitsubishi', NULL, 1, 0, '2026-03-25 10:25:59', '2026-03-25 10:25:59', NULL),
(2, 1, NULL, 'Garage Central LBV', '+241 06 55 44 33', 'garage.central@email.ga', 1, 20000.00, 'Mécanique générale', NULL, 1, 0, '2026-03-25 10:25:59', '2026-03-25 10:25:59', NULL),
(3, 2, NULL, 'AutoElec Gabon', '+241 07 77 88 99', 'autoelec@email.ga', 1, 18000.00, 'Électricité automobile', NULL, 1, 0, '2026-03-25 10:25:59', '2026-03-25 10:25:59', NULL),
(4, 3, NULL, 'Carrosserie Estuaire', '+241 06 33 22 11', 'carrosserie.est@email.ga', 1, 22000.00, 'Carrosserie et peinture', NULL, 1, 0, '2026-03-25 10:25:59', '2026-03-25 10:25:59', NULL),
(5, 4, NULL, 'Pneu Express LBV', '+241 07 44 55 66', 'pneuexpress@email.ga', 1, 10000.00, 'Pneumatiques toutes marques', NULL, 1, 0, '2026-03-25 10:25:59', '2026-03-25 10:25:59', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `interventions`
--

CREATE TABLE `interventions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `demande_id` bigint(20) UNSIGNED DEFAULT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `intervenant_id` bigint(20) UNSIGNED NOT NULL,
  `type_intervention` varchar(100) DEFAULT NULL,
  `severite` varchar(30) NOT NULL DEFAULT 'normale',
  `date_debut` datetime DEFAULT NULL,
  `date_fin` datetime DEFAULT NULL,
  `duree_minutes` int(11) DEFAULT NULL,
  `duree_estimee_heures` int(11) DEFAULT NULL,
  `km_au_moment_intervention` bigint(20) UNSIGNED DEFAULT NULL,
  `diagnostic` text DEFAULT NULL,
  `resultat` varchar(100) NOT NULL DEFAULT 'en_attente',
  `cout_main_oeuvre` decimal(12,2) NOT NULL DEFAULT 0.00,
  `cout_pieces` decimal(12,2) NOT NULL DEFAULT 0.00,
  `documents` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`documents`)),
  `notes` text DEFAULT NULL,
  `statut` varchar(50) NOT NULL DEFAULT 'planifiee' COMMENT 'planifiee, en_cours, terminee, annulee',
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `interventions`
--

INSERT INTO `interventions` (`id`, `demande_id`, `vehicule_immatriculation`, `intervenant_id`, `type_intervention`, `severite`, `date_debut`, `date_fin`, `duree_minutes`, `duree_estimee_heures`, `km_au_moment_intervention`, `diagnostic`, `resultat`, `cout_main_oeuvre`, `cout_pieces`, `documents`, `notes`, `statut`, `est_supprime`, `date_creation`, `date_modification`, `date_suppression`) VALUES
(1, NULL, 'LBV-001-A', 1, 'Vidange huile moteur', 'normale', '2026-01-10 08:00:00', '2026-01-10 10:30:00', 150, NULL, 82000, 'Vidange complète + filtre huile', 'termine', 25000.00, 12000.00, NULL, NULL, 'terminee', 0, '2026-03-25 10:26:16', '2026-03-25 10:26:16', NULL),
(2, NULL, 'LBV-002-A', 2, 'Remplacement plaquettes frein', 'normale', '2026-02-05 09:00:00', '2026-02-05 12:00:00', 180, NULL, 45000, 'Plaquettes avant usées à 10%', 'termine', 30000.00, 35000.00, NULL, NULL, 'terminee', 0, '2026-03-25 10:26:16', '2026-03-25 10:26:16', NULL),
(3, NULL, 'LBV-003-B', 3, 'Réparation alternateur', 'haute', '2026-03-01 08:00:00', '2026-03-02 17:00:00', 1800, NULL, 60000, 'Alternateur défectueux — remplacé neuf', 'en_attente', 45000.00, 0.00, NULL, NULL, 'en_cours', 0, '2026-03-25 10:26:16', '2026-03-25 10:26:16', NULL),
(4, NULL, 'LBV-004-B', 5, 'Montage pneus neufs (4)', 'faible', '2026-03-15 10:00:00', '2026-03-15 11:30:00', 90, NULL, 18000, 'Pneus avant + arrière usés 30%', 'termine', 20000.00, 80000.00, NULL, NULL, 'terminee', 0, '2026-03-25 10:26:16', '2026-03-25 10:26:16', NULL),
(5, NULL, 'LBV-005-C', 2, 'Révision générale 100 000 km', 'normale', '2026-02-20 08:00:00', '2026-02-21 17:00:00', 1440, NULL, 110000, 'Révision complète : filtres, courroies, liquides', 'termine', 60000.00, 45000.00, NULL, NULL, 'terminee', 0, '2026-03-25 10:26:16', '2026-03-25 10:26:16', NULL);

--
-- Déclencheurs `interventions`
--
DELIMITER $$
CREATE TRIGGER `trg_statut_veh_intervention_end` AFTER UPDATE ON `interventions` FOR EACH ROW BEGIN
              IF NEW.est_supprime = 0 THEN
                IF OLD.statut = "en_cours" AND NEW.statut IN ("terminee", "annulee") THEN
                  UPDATE vehicules 
                  SET statut = "disponible" 
                  WHERE immatriculation = NEW.vehicule_immatriculation AND est_supprime = 0;
                END IF;
              END IF;
            END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_statut_veh_intervention_start` AFTER UPDATE ON `interventions` FOR EACH ROW BEGIN
              IF NEW.est_supprime = 0 THEN
                IF OLD.statut != "en_cours" AND NEW.statut = "en_cours" THEN
                  UPDATE vehicules 
                  SET statut = "en_maintenance" 
                  WHERE immatriculation = NEW.vehicule_immatriculation AND est_supprime = 0;
                END IF;
              END IF;
            END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `journaux_audit`
--

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

--
-- Structure de la table `kpi_vehicules`
--

CREATE TABLE `kpi_vehicules` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `annee_periode` int(11) NOT NULL,
  `mois_periode` int(11) NOT NULL,
  `jours_disponible` int(11) NOT NULL DEFAULT 0,
  `jours_mission` int(11) NOT NULL DEFAULT 0,
  `jours_maintenance` int(11) NOT NULL DEFAULT 0,
  `jours_immobilise` int(11) NOT NULL DEFAULT 0,
  `total_missions` int(11) NOT NULL DEFAULT 0,
  `total_km_missions` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
  `total_interventions` int(11) NOT NULL DEFAULT 0,
  `total_duree_interventions_heures` decimal(10,2) NOT NULL DEFAULT 0.00,
  `cout_missions` decimal(14,2) NOT NULL DEFAULT 0.00,
  `cout_interventions` decimal(14,2) NOT NULL DEFAULT 0.00,
  `cout_pieces` decimal(14,2) NOT NULL DEFAULT 0.00,
  `cout_par_km` decimal(10,2) DEFAULT NULL,
  `nb_anomalies` int(11) NOT NULL DEFAULT 0,
  `nb_accidents` int(11) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `taux_disponibilite` decimal(5,2) GENERATED ALWAYS AS (case when `jours_disponible` + `jours_mission` + `jours_maintenance` + `jours_immobilise` > 0 then `jours_disponible` * 100.0 / (`jours_disponible` + `jours_mission` + `jours_maintenance` + `jours_immobilise`) else 0 end) VIRTUAL,
  `cout_total` decimal(14,2) GENERATED ALWAYS AS (`cout_missions` + `cout_interventions` + `cout_pieces`) VIRTUAL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `kpi_vehicules`
--

INSERT INTO `kpi_vehicules` (`id`, `vehicule_immatriculation`, `annee_periode`, `mois_periode`, `jours_disponible`, `jours_mission`, `jours_maintenance`, `jours_immobilise`, `total_missions`, `total_km_missions`, `total_interventions`, `total_duree_interventions_heures`, `cout_missions`, `cout_interventions`, `cout_pieces`, `cout_par_km`, `nb_anomalies`, `nb_accidents`, `date_creation`) VALUES
(1, 'LBV-001-A', 2026, 1, 22, 6, 0, 3, 8, 4200, 1, 2.50, 250000.00, 37000.00, 12000.00, NULL, 1, 0, '2026-03-25 10:27:16'),
(2, 'LBV-002-A', 2026, 2, 18, 8, 2, 0, 12, 6800, 2, 5.00, 380000.00, 65000.00, 35000.00, NULL, 0, 0, '2026-03-25 10:27:16'),
(3, 'LBV-003-B', 2026, 3, 5, 2, 18, 5, 2, 890, 1, 30.00, 80000.00, 45000.00, 0.00, NULL, 2, 0, '2026-03-25 10:27:16'),
(4, 'LBV-004-B', 2026, 2, 20, 5, 2, 1, 10, 5100, 1, 1.50, 300000.00, 20000.00, 80000.00, NULL, 0, 0, '2026-03-25 10:27:16'),
(5, 'LBV-005-C', 2026, 2, 16, 10, 2, 0, 15, 8200, 1, 24.00, 490000.00, 60000.00, 45000.00, NULL, 1, 0, '2026-03-25 10:27:16');

-- --------------------------------------------------------

--
-- Structure de la table `marques`
--

CREATE TABLE `marques` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(100) NOT NULL,
  `pays_origine` varchar(100) DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `marques`
--

INSERT INTO `marques` (`id`, `nom`, `pays_origine`, `est_actif`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Toyota', 'Japon', 1, NULL, NULL, NULL),
(2, 'Mitsubishi', 'Japon', 1, NULL, NULL, NULL),
(3, 'Ford', 'États-Unis', 1, NULL, NULL, NULL),
(4, 'Renault', 'France', 1, NULL, NULL, NULL),
(5, 'Isuzu', 'Japon', 1, NULL, NULL, NULL),
(6, 'Ferarie', NULL, 1, '2026-03-31 10:21:12', '2026-03-31 10:21:12', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000001_create_cache_table', 1),
(2, '0001_01_01_000002_create_jobs_table', 1),
(3, '2025_11_25_110526_create_personal_access_tokens_table', 1),
(4, '2025_11_26_144408_create_personal_access_tokens_table', 2),
(5, '2026_01_07_075623_create_roles_table', 2),
(6, '2026_01_07_075649_create_utilisateurs_table', 2),
(7, '2026_01_07_114432_create_directions_table', 3),
(8, '2026_01_07_115807_add_foreign_key_direction_to_utilisateurs_table', 4),
(9, '2026_01_07_115946_add_foreign_key_directions_to_utilisateurs_table', 5),
(10, '2026_01_07_120354_create_utilisateurs_table', 6),
(11, '2026_01_12_133059_create_vehicules_table', 7),
(12, '2026_01_12_133137_create_fournisseurs_table', 7),
(13, '2026_01_12_133618_create_types_inspection_table', 7),
(14, '2026_01_12_133659_create_types_intervenant_table', 7),
(15, '2026_01_12_133958_create_categories_notifications_table', 8),
(17, '2026_01_12_134111_create_regles_maintenance_table', 8),
(18, '2026_01_12_134513_create_missions_table', 9),
(19, '2026_01_12_140921_create_pc_radio_table', 9),
(20, '2026_01_12_141003_create_inspections_table', 9),
(21, '2026_01_12_141044_create_anomalies_table', 9),
(23, '2026_01_12_141202_create_nomalies_pc_radio_table', 10),
(24, '2026_01_12_141234_create_demandes_intervention_table', 10),
(25, '2026_01_12_142241_create_intervenants_table', 11),
(26, '2026_01_12_142324_create_interventions_table', 11),
(27, '2026_01_12_142400_create_pieces_detachees_table', 11),
(28, '2026_01_12_142452_create_pieces_detachees_table', 11),
(29, '2026_01_12_141113_create_inspections_vehicules_table', 12),
(30, '2026_01_12_143216_create_mouvements_stock_table', 12),
(31, '2026_01_12_143243_create_prelevements_pieces_table', 12),
(32, '2026_01_12_143321_create_planning_maintenance_table', 12),
(33, '2026_01_12_143350_create_accidents_table', 12),
(34, '2026_01_12_143438_create_carnets_carburant_table', 12),
(35, '2026_01_12_143551_create_historique_kilometrage_table', 12),
(36, '2026_01_12_143623_create_alertes_kilometrage_table', 12),
(37, '2026_01_12_143659_create_documents_vehicules_table', 12),
(38, '2026_01_12_143727_create_documents_chauffeurs_table', 12),
(39, '2026_01_12_134039_create_checklists_table', 13),
(40, '2026_01_12_143831_create_elements_inspectes_table', 14),
(41, '2026_01_13_080038_create_notifications_table', 15),
(42, '2026_01_13_080101_create_envois_notifications_table', 15),
(43, '2026_01_13_080127_create_parametres_alertes_table', 15),
(44, '2026_01_13_080148_create_outils_table', 15),
(45, '2026_01_13_080209_create_problemes_outils_table', 15),
(46, '2026_01_13_080410_create_performances_chauffeurs_table', 16),
(47, '2026_01_13_080439_create_kpi_vehicules_table', 16),
(48, '2026_01_13_080524_create_journaux_audit_table', 16),
(49, '2026_01_13_103248_create_database_triggers', 17),
(50, '2026_01_14_084709_create_paramettre_systeme_table', 18),
(51, '2026_01_15_112103_create_marques_table', 19),
(52, '2026_01_15_112126_create_categories_vehicules_table', 19),
(53, '2026_01_15_112143_create_annees_table', 19),
(54, '2026_01_15_114234_create_modeles_table', 19),
(55, '2026_01_15_114329_add_relations_to_vehicules_table', 19);

-- --------------------------------------------------------

--
-- Structure de la table `missions`
--

CREATE TABLE `missions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `chauffeur_user_id` bigint(20) UNSIGNED NOT NULL,
  `type_mission` varchar(100) DEFAULT NULL COMMENT 'transport_fonds, mission_brousse, autre',
  `destination` varchar(255) DEFAULT NULL,
  `direction_id` int(10) UNSIGNED DEFAULT NULL,
  `nb_passagers` int(11) NOT NULL DEFAULT 1,
  `date_depart_prevue` datetime NOT NULL,
  `date_depart_reelle` datetime DEFAULT NULL,
  `date_retour_reelle` datetime DEFAULT NULL,
  `km_depart` bigint(20) UNSIGNED DEFAULT NULL,
  `km_retour` bigint(20) UNSIGNED DEFAULT NULL,
  `carburant_consomme` decimal(10,2) DEFAULT NULL COMMENT 'Litres',
  `cout_carburant` decimal(12,2) DEFAULT NULL,
  `statut` varchar(50) NOT NULL DEFAULT 'planifiee' COMMENT 'planifiee, en_cours, terminee, annulee',
  `reference_mission` varchar(100) DEFAULT NULL,
  `observations` text DEFAULT NULL,
  `incident_signale` tinyint(1) NOT NULL DEFAULT 0,
  `description_incident` text DEFAULT NULL,
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photos`)),
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `missions`
--

INSERT INTO `missions` (`id`, `vehicule_immatriculation`, `chauffeur_user_id`, `type_mission`, `destination`, `direction_id`, `nb_passagers`, `date_depart_prevue`, `date_depart_reelle`, `date_retour_reelle`, `km_depart`, `km_retour`, `carburant_consomme`, `cout_carburant`, `statut`, `reference_mission`, `observations`, `incident_signale`, `description_incident`, `photos`, `est_supprime`, `date_creation`, `date_modification`, `date_suppression`) VALUES
(1, 'LBV-001-A', 6, 'mission_brousse', 'Port-Gentil', 2, 3, '2026-02-10 07:00:00', '2026-02-10 07:30:00', '2026-02-12 18:00:00', 80000, 81350, 135.50, 94850.00, 'terminee', 'MS-2026-001', 'Mission sans incident', 0, NULL, NULL, 0, '2026-03-25 10:27:03', '2026-03-25 10:27:03', NULL),
(2, 'LBV-002-A', 6, 'transport_fonds', 'Libreville Centre', 2, 2, '2026-02-20 08:00:00', '2026-02-20 08:10:00', '2026-02-20 15:30:00', 46000, 46210, 21.00, 14700.00, 'terminee', 'MS-2026-002', 'Transfert de fonds sécurisé', 0, NULL, NULL, 0, '2026-03-25 10:27:03', '2026-03-25 10:27:03', NULL),
(3, 'LBV-004-B', 6, 'mission_brousse', 'Lambaréné', 3, 4, '2026-03-05 06:00:00', '2026-03-05 06:20:00', '2026-03-06 17:45:00', 18000, 18890, 89.00, 62300.00, 'terminee', 'MS-2026-003', 'Route en mauvais état', 0, NULL, NULL, 0, '2026-03-25 10:27:03', '2026-03-25 10:27:03', NULL),
(4, 'LBV-001-A', 6, 'autre', 'Aéroport Léon MBA', 2, 2, '2026-03-15 05:00:00', '2026-03-15 05:00:00', '2026-03-15 08:30:00', 81350, 81500, 15.00, 10500.00, 'terminee', 'MS-2026-004', 'Accueil délégation', 0, NULL, NULL, 0, '2026-03-25 10:27:03', '2026-03-25 10:27:03', NULL),
(5, 'LBV-004-B', 6, 'transport_fonds', 'Owendo', 4, 2, '2026-03-22 07:30:00', NULL, NULL, 18890, NULL, NULL, NULL, 'planifiee', 'MS-2026-005', NULL, 0, NULL, NULL, 0, '2026-03-25 10:27:03', '2026-03-25 10:27:03', NULL);

--
-- Déclencheurs `missions`
--
DELIMITER $$
CREATE TRIGGER `trg_fin_mission_km_statut` AFTER UPDATE ON `missions` FOR EACH ROW BEGIN
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
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_statut_veh_mission_start` AFTER UPDATE ON `missions` FOR EACH ROW BEGIN
              IF NEW.est_supprime = 0 THEN
                IF OLD.statut = "planifiee" AND NEW.statut = "en_cours" THEN
                  UPDATE vehicules 
                  SET statut = "en_mission" 
                  WHERE immatriculation = NEW.vehicule_immatriculation AND est_supprime = 0;
                END IF;
              END IF;
            END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `modeles`
--

CREATE TABLE `modeles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `marque_id` bigint(20) UNSIGNED NOT NULL,
  `categorie_id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(100) NOT NULL,
  `nb_places_defaut` int(11) NOT NULL DEFAULT 5,
  `type_carburant_defaut` varchar(50) DEFAULT NULL COMMENT 'diesel, essence, hybride, electrique',
  `capacite_reservoir_defaut` int(11) DEFAULT NULL COMMENT 'Litres',
  `consommation_moyenne_defaut` decimal(10,2) DEFAULT NULL COMMENT 'L/100km',
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `modeles`
--

INSERT INTO `modeles` (`id`, `marque_id`, `categorie_id`, `nom`, `nb_places_defaut`, `type_carburant_defaut`, `capacite_reservoir_defaut`, `consommation_moyenne_defaut`, `est_actif`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 2, 'Land Cruiser 200', 5, 'diesel', 93, 12.50, 1, NULL, NULL, NULL),
(2, 1, 3, 'Hilux Double Cab', 5, 'diesel', 80, 9.50, 1, NULL, NULL, NULL),
(3, 2, 3, 'Pajero Sport', 7, 'diesel', 68, 10.20, 1, NULL, NULL, NULL),
(4, 3, 3, 'Ranger Wildtrak', 5, 'diesel', 80, 9.80, 1, NULL, NULL, NULL),
(5, 5, 4, 'D-MAX Utilitaire', 2, 'diesel', 76, 9.00, 1, NULL, NULL, NULL),
(6, 6, 1, 'GTX', 5, NULL, NULL, NULL, 1, '2026-03-31 10:21:28', '2026-03-31 10:21:28', NULL),
(7, 5, 1, 'dddd', 5, NULL, NULL, NULL, 1, '2026-03-31 10:21:41', '2026-03-31 10:21:41', NULL),
(8, 6, 1, 'fgtr', 5, NULL, NULL, NULL, 0, '2026-03-31 10:21:59', '2026-03-31 10:22:04', '2026-03-31 10:22:04');

-- --------------------------------------------------------

--
-- Structure de la table `mouvements_stock`
--

CREATE TABLE `mouvements_stock` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `piece_id` bigint(20) UNSIGNED NOT NULL,
  `type_mouvement` varchar(50) NOT NULL COMMENT 'entree, sortie, ajustement, retour',
  `quantite` decimal(12,2) NOT NULL,
  `prix_unitaire` decimal(12,2) DEFAULT NULL,
  `type_reference` varchar(100) DEFAULT NULL,
  `reference_id` bigint(20) UNSIGNED DEFAULT NULL,
  `effectue_par_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `fournisseur_id` int(10) UNSIGNED DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `chemin_document` varchar(255) DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

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

--
-- Structure de la table `outils`
--

CREATE TABLE `outils` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(200) NOT NULL,
  `type` varchar(100) DEFAULT NULL,
  `categorie` varchar(100) DEFAULT NULL,
  `etat` varchar(50) NOT NULL DEFAULT 'OK',
  `emplacement` varchar(150) DEFAULT NULL,
  `date_dernier_controle` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `parametres_alertes`
--

CREATE TABLE `parametres_alertes` (
  `id` int(10) UNSIGNED NOT NULL,
  `type_alerte` varchar(100) NOT NULL,
  `condition_declenchement` varchar(255) NOT NULL,
  `valeur_seuil` int(11) DEFAULT NULL,
  `categorie_notification_id` int(10) UNSIGNED DEFAULT NULL,
  `message_template` text DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `parametres_systeme`
--

CREATE TABLE `parametres_systeme` (
  `id` int(10) UNSIGNED NOT NULL,
  `cle` varchar(100) NOT NULL COMMENT 'theme_primary_color, theme_secondary_color, etc.',
  `valeur` text NOT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'string' COMMENT 'string, json, boolean, number',
  `categorie` varchar(50) NOT NULL DEFAULT 'theme' COMMENT 'theme, general, notification',
  `description` text DEFAULT NULL,
  `modifie_par_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `parametres_systeme`
--

INSERT INTO `parametres_systeme` (`id`, `cle`, `valeur`, `type`, `categorie`, `description`, `modifie_par_user_id`, `date_creation`, `date_modification`) VALUES
(1, 'theme_primary_color', '#3B82F6', 'string', 'theme', 'Couleur principale du thème', NULL, '2026-01-14 07:51:45', '2026-01-14 07:51:45'),
(2, 'theme_secondary_color', '#10B981', 'string', 'theme', 'Couleur secondaire du thème', NULL, '2026-01-14 07:51:45', '2026-01-14 07:51:45'),
(3, 'theme_accent_color', '#F59E0B', 'string', 'theme', 'Couleur d\'accentuation', NULL, '2026-01-14 07:51:45', '2026-01-14 07:51:45'),
(4, 'theme_danger_color', '#EF4444', 'string', 'theme', 'Couleur pour les éléments de danger/erreur', NULL, '2026-01-14 07:51:45', '2026-01-14 07:51:45'),
(5, 'theme_warning_color', '#F59E0B', 'string', 'theme', 'Couleur pour les avertissements', NULL, '2026-01-14 07:51:45', '2026-01-14 07:51:45'),
(6, 'theme_success_color', '#10B981', 'string', 'theme', 'Couleur pour les succès', NULL, '2026-01-14 07:51:45', '2026-01-14 07:51:45'),
(7, 'theme_info_color', '#3B82F6', 'string', 'theme', 'Couleur pour les informations', NULL, '2026-01-14 07:51:45', '2026-01-14 07:51:45'),
(8, 'theme_sidebar_bg', '#1F2937', 'string', 'theme', 'Couleur de fond de la sidebar', NULL, '2026-01-14 07:51:45', '2026-01-14 07:51:45'),
(9, 'theme_header_bg', '#FFFFFF', 'string', 'theme', 'Couleur de fond du header', NULL, '2026-01-14 07:51:45', '2026-01-14 07:51:45'),
(10, 'theme_card_border', '#E5E7EB', 'string', 'theme', 'Couleur des bordures des cartes', NULL, '2026-01-14 07:51:45', '2026-01-14 07:51:45');

-- --------------------------------------------------------

--
-- Structure de la table `pc_radio`
--

CREATE TABLE `pc_radio` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `chauffeur_user_id` bigint(20) UNSIGNED NOT NULL,
  `mission_id` bigint(20) UNSIGNED DEFAULT NULL,
  `date_heure_remise` datetime NOT NULL,
  `km_depart` bigint(20) UNSIGNED NOT NULL,
  `niveau_carburant_depart` varchar(50) DEFAULT NULL,
  `checklist_avant` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`checklist_avant`)),
  `photos_avant` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photos_avant`)),
  `observations_depart` text DEFAULT NULL,
  `date_heure_retour` datetime DEFAULT NULL,
  `km_retour` bigint(20) UNSIGNED DEFAULT NULL,
  `niveau_carburant_retour` varchar(50) DEFAULT NULL,
  `checklist_apres` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`checklist_apres`)),
  `photos_apres` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photos_apres`)),
  `anomalies_detectees` tinyint(1) NOT NULL DEFAULT 0,
  `observations_retour` text DEFAULT NULL,
  `agent_pc_radio_user_id` bigint(20) UNSIGNED NOT NULL,
  `signature_chauffeur_remise` text DEFAULT NULL,
  `signature_chauffeur_retour` text DEFAULT NULL,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déclencheurs `pc_radio`
--
DELIMITER $$
CREATE TRIGGER `trg_maj_km_apres_pcradio` AFTER UPDATE ON `pc_radio` FOR EACH ROW BEGIN
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
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `performances_chauffeurs`
--

CREATE TABLE `performances_chauffeurs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `chauffeur_user_id` bigint(20) UNSIGNED NOT NULL,
  `date_debut_periode` date NOT NULL,
  `date_fin_periode` date NOT NULL,
  `total_missions` int(11) NOT NULL DEFAULT 0,
  `total_km` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
  `total_duree_minutes` int(11) NOT NULL DEFAULT 0,
  `nb_accidents` int(11) NOT NULL DEFAULT 0,
  `nb_anomalies_signalees` int(11) NOT NULL DEFAULT 0,
  `consommation_moyenne` decimal(10,2) DEFAULT NULL,
  `score_performance` decimal(5,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `performances_chauffeurs`
--

INSERT INTO `performances_chauffeurs` (`id`, `chauffeur_user_id`, `date_debut_periode`, `date_fin_periode`, `total_missions`, `total_km`, `total_duree_minutes`, `nb_accidents`, `nb_anomalies_signalees`, `consommation_moyenne`, `score_performance`, `notes`, `date_creation`) VALUES
(1, 6, '2026-01-01', '2026-01-31', 12, 4800, 3600, 0, 1, 10.20, 88.50, 'Bonne conduite sur tout le mois', '2026-03-25 10:27:29'),
(2, 6, '2026-02-01', '2026-02-28', 15, 6200, 4500, 0, 0, 9.80, 92.00, 'Aucun incident — excellent mois', '2026-03-25 10:27:29'),
(3, 3, '2026-01-01', '2026-01-31', 8, 3200, 2800, 0, 1, 11.00, 82.00, 'Légère consommation excessive signalée', '2026-03-25 10:27:29'),
(4, 3, '2026-02-01', '2026-02-28', 10, 4100, 3100, 1, 0, 10.50, 74.50, 'Accident minier sans blessé — déclaré', '2026-03-25 10:27:29'),
(5, 6, '2026-03-01', '2026-03-25', 9, 3900, 2700, 0, 0, 10.00, 90.00, 'Période en cours — tendance positive', '2026-03-25 10:27:29');

-- --------------------------------------------------------

--
-- Structure de la table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(66, 'App\\Models\\Utilisateur', 3, 'auth_token', '65033617a16d697207a16be2dcde3e3639bd9f385459b9ffef839ac4eecda616', '[\"*\"]', '2026-03-25 11:10:19', '2026-03-25 12:41:33', '2026-03-25 10:41:33', '2026-03-25 11:10:19'),
(68, 'App\\Models\\Utilisateur', 2, 'auth_token', '988fecf851f168e85802d68a6ff099d3deac85263df2d8009af1fcc0d0759d86', '[\"*\"]', NULL, '2026-03-29 20:12:12', '2026-03-29 18:12:14', '2026-03-29 18:12:14'),
(69, 'App\\Models\\Utilisateur', 2, 'auth_token', '00d95391efa3afc043a07f8098be80758abd734680673d1c3ec7c66f00e5e311', '[\"*\"]', '2026-03-29 18:38:28', '2026-03-29 20:12:36', '2026-03-29 18:12:36', '2026-03-29 18:38:28'),
(76, 'App\\Models\\Utilisateur', 2, 'auth_token', '53693136c05ebb158940424a55374947460ea359f5f074c241161a227be6f3ed', '[\"*\"]', '2026-03-30 15:11:54', '2026-03-30 15:24:50', '2026-03-30 13:24:50', '2026-03-30 15:11:54'),
(77, 'App\\Models\\Utilisateur', 2, 'auth_token', 'b0a82cf2b148c75139382fa032fd43dcd02bab355339b705394d286d0d2fbafd', '[\"*\"]', '2026-03-31 08:58:37', '2026-03-31 09:02:26', '2026-03-31 07:02:26', '2026-03-31 08:58:37'),
(78, 'App\\Models\\Utilisateur', 2, 'auth_token', 'ff1377f59eea759df80edfa73c9d46c47b7f0e2cc97edba1e8a30a6df17f4e85', '[\"*\"]', '2026-03-31 10:22:04', '2026-03-31 11:06:30', '2026-03-31 09:06:30', '2026-03-31 10:22:04');

-- --------------------------------------------------------

--
-- Structure de la table `pieces_detachees`
--

CREATE TABLE `pieces_detachees` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `nom` varchar(200) NOT NULL,
  `type_piece` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `quantite_stock` decimal(12,2) NOT NULL DEFAULT 0.00,
  `seuil_alerte` decimal(12,2) NOT NULL DEFAULT 0.00,
  `unite` varchar(50) NOT NULL DEFAULT 'unite',
  `prix_unitaire` decimal(12,2) NOT NULL DEFAULT 0.00,
  `fournisseur_id` int(10) UNSIGNED DEFAULT NULL,
  `emplacement` varchar(150) DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déclencheurs `pieces_detachees`
--
DELIMITER $$
CREATE TRIGGER `trg_notif_stock_faible` AFTER UPDATE ON `pieces_detachees` FOR EACH ROW BEGIN
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
                    CONCAT("La pièce """, NEW.nom, """ a atteint le seuil d'alerte. Stock actuel: ", NEW.quantite_stock, " ", NEW.unite),
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
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `planning_maintenance`
--

CREATE TABLE `planning_maintenance` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `regle_id` bigint(20) UNSIGNED DEFAULT NULL,
  `type_maintenance` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `frequence_km` int(11) DEFAULT NULL,
  `frequence_mois` int(11) DEFAULT NULL,
  `date_derniere_realisation` date DEFAULT NULL,
  `km_derniere_realisation` bigint(20) UNSIGNED DEFAULT NULL,
  `derniere_intervention_id` bigint(20) UNSIGNED DEFAULT NULL,
  `prochaine_echeance_date` date DEFAULT NULL,
  `prochaine_echeance_km` bigint(20) UNSIGNED DEFAULT NULL,
  `statut` varchar(50) NOT NULL DEFAULT 'a_planifier',
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `prelevements_pieces`
--

CREATE TABLE `prelevements_pieces` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `intervention_id` bigint(20) UNSIGNED NOT NULL,
  `piece_id` bigint(20) UNSIGNED NOT NULL,
  `quantite` decimal(12,2) NOT NULL,
  `prix_unitaire` decimal(12,2) NOT NULL,
  `preleve_par_user_id` bigint(20) UNSIGNED NOT NULL,
  `date_prelevement` datetime NOT NULL DEFAULT current_timestamp(),
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déclencheurs `prelevements_pieces`
--
DELIMITER $$
CREATE TRIGGER `trg_maj_cout_pieces_delete` AFTER DELETE ON `prelevements_pieces` FOR EACH ROW BEGIN
              UPDATE interventions 
              SET cout_pieces = (
                SELECT COALESCE(SUM(quantite * prix_unitaire), 0)
                FROM prelevements_pieces
                WHERE intervention_id = OLD.intervention_id
              )
              WHERE id = OLD.intervention_id;
            END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_maj_cout_pieces_insert` AFTER INSERT ON `prelevements_pieces` FOR EACH ROW BEGIN
              UPDATE interventions 
              SET cout_pieces = (
                SELECT COALESCE(SUM(quantite * prix_unitaire), 0)
                FROM prelevements_pieces
                WHERE intervention_id = NEW.intervention_id
              )
              WHERE id = NEW.intervention_id;
            END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_maj_stock_apres_prelevement` AFTER INSERT ON `prelevements_pieces` FOR EACH ROW BEGIN
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
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `problemes_outils`
--

CREATE TABLE `problemes_outils` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `outil_id` bigint(20) UNSIGNED NOT NULL,
  `signale_par_user_id` bigint(20) UNSIGNED NOT NULL,
  `description_probleme` text NOT NULL,
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photos`)),
  `statut` varchar(50) NOT NULL DEFAULT 'signale',
  `date_signalement` datetime NOT NULL DEFAULT current_timestamp(),
  `date_resolution` datetime DEFAULT NULL,
  `notes_resolution` text DEFAULT NULL,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `regles_maintenance`
--

CREATE TABLE `regles_maintenance` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type_maintenance` varchar(150) NOT NULL COMMENT 'vidange_simple, vidange_complete, revision',
  `description` text DEFAULT NULL,
  `type_declencheur` varchar(10) NOT NULL COMMENT 'km, date, mixte',
  `valeur_km` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Tous les X km',
  `valeur_mois` int(11) DEFAULT NULL COMMENT 'Tous les X mois',
  `type_vehicule` varchar(60) DEFAULT NULL COMMENT 'NULL = tous',
  `duree_estimee_heures` int(11) DEFAULT NULL,
  `cout_estime` decimal(12,2) DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `roles`
--

CREATE TABLE `roles` (
  `id` int(10) UNSIGNED NOT NULL,
  `code` varchar(50) NOT NULL COMMENT 'admin, chef_parc, chef_tf, agent_pc_radio, mecanicien, chauffeur',
  `libelle` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `roles`
--

INSERT INTO `roles` (`id`, `code`, `libelle`, `description`, `est_supprime`, `date_creation`, `date_modification`, `date_suppression`) VALUES
(1, 'admin', ' Administrateur', 'Accès complet système', 0, '2026-01-07 09:11:16', '2026-03-25 10:59:51', NULL),
(2, 'chef_parc', 'Gestionnaire du Parc', 'Gestion globale parc automobile', 0, '2026-01-07 09:11:16', '2026-01-07 09:11:16', NULL),
(3, 'chef_tf', 'Chef Transport de Fonds', 'Gestion missions TF + chauffeurs TF', 0, '2026-01-07 09:11:16', '2026-01-07 09:11:16', NULL),
(4, 'agent_pc_radio', 'Agent PC Radio', 'Traçabilité remise/retour clés véhicules', 0, '2026-01-07 09:11:16', '2026-01-07 09:11:16', NULL),
(5, 'mecanicien', 'Mécanicien / Technicien', 'Interventions + Inspections techniques', 0, '2026-01-07 09:11:16', '2026-01-07 09:11:16', NULL),
(6, 'chauffeur', 'Chauffeur', 'Exécution missions + signalement anomalies', 0, '2026-01-07 09:11:16', '2026-01-07 09:11:16', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `types_inspection`
--

CREATE TABLE `types_inspection` (
  `id` int(10) UNSIGNED NOT NULL,
  `code` varchar(50) NOT NULL COMMENT 'quotidienne, hebdomadaire, complete, periodique, tf',
  `libelle` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `frequence_jours` int(11) DEFAULT NULL COMMENT 'Fréquence recommandée en jours',
  `est_obligatoire` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Inspection obligatoire réglementaire',
  `ordre_affichage` int(11) NOT NULL DEFAULT 0,
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `types_inspection`
--

INSERT INTO `types_inspection` (`id`, `code`, `libelle`, `description`, `frequence_jours`, `est_obligatoire`, `ordre_affichage`, `est_actif`, `est_supprime`, `date_creation`, `date_modification`, `date_suppression`) VALUES
(1, 'HH', 'JJ', 'JJJL', 0, 0, 0, 1, 0, '2026-03-30 09:15:58', '2026-03-30 09:15:58', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `types_intervenant`
--

CREATE TABLE `types_intervenant` (
  `id` int(10) UNSIGNED NOT NULL,
  `code` varchar(50) NOT NULL COMMENT 'mecanicien, electricien, carrossier, pneumaticien',
  `libelle` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `competences_requises` text DEFAULT NULL COMMENT 'Liste des compétences associées',
  `ordre_affichage` int(11) NOT NULL DEFAULT 0,
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `types_intervenant`
--

INSERT INTO `types_intervenant` (`id`, `code`, `libelle`, `description`, `competences_requises`, `ordre_affichage`, `est_actif`, `est_supprime`, `date_creation`, `date_modification`, `date_suppression`) VALUES
(1, 'mecanicien', 'Mécanicien', 'Réparations moteur, transmission, freins', NULL, 1, 1, 0, '2026-03-25 10:23:16', '2026-03-25 10:23:16', NULL),
(2, 'electricien', 'Électricien auto', 'Câblage, batterie, alternateur, électronique', NULL, 2, 1, 0, '2026-03-25 10:23:16', '2026-03-25 10:23:16', NULL),
(3, 'carrossier', 'Carrossier', 'Réparation et peinture carrosserie', NULL, 3, 1, 0, '2026-03-25 10:23:16', '2026-03-25 10:23:16', NULL),
(4, 'pneumaticien', 'Pneumaticien', 'Montage, équilibrage et réparation pneus', NULL, 4, 1, 0, '2026-03-25 10:23:16', '2026-03-25 10:23:16', NULL),
(5, 'climatiseur', 'Technicien Climatisation', 'Entretien et réparation climatisation', NULL, 5, 1, 0, '2026-03-25 10:23:16', '2026-03-25 10:23:16', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `utilisateurs`
--

CREATE TABLE `utilisateurs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `role_id` int(10) UNSIGNED NOT NULL,
  `direction_id` int(10) UNSIGNED DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `derniere_connexion` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `utilisateurs`
--

INSERT INTO `utilisateurs` (`id`, `nom`, `email`, `mot_de_passe`, `role_id`, `direction_id`, `est_actif`, `est_supprime`, `derniere_connexion`, `date_creation`, `date_modification`, `date_suppression`) VALUES
(1, 'Hulas Djyembi', 'hulas.djyembi@sgs-gabon.com', '$2y$12$3eJJSxMXLDGEUGcRip8fQuNdOm9QwsSJGoVWUW4g0oDFmz/Weh34O', 1, 1, 1, 0, '2026-03-30 13:24:04', '2026-01-07 12:05:58', '2026-03-30 14:24:04', NULL),
(2, 'Boris LIPOT ', 'b.lipot@sgs-gabon.com', '$2y$12$3eJJSxMXLDGEUGcRip8fQuNdOm9QwsSJGoVWUW4g0oDFmz/Weh34O', 1, 1, 1, 0, '2026-03-31 09:06:30', '2026-03-25 09:56:41', '2026-03-31 10:06:30', NULL),
(3, 'Patrick Mboula', 'patrick.mboula@sgs-gabon.com', '$2y$12$3eJJSxMXLDGEUGcRip8fQuNdOm9QwsSJGoVWUW4g0oDFmz/Weh34O', 1, 2, 1, 0, '2026-03-25 10:41:33', '2026-03-25 09:56:41', '2026-03-25 11:41:33', NULL),
(4, 'Carine Obiang', 'carine.obiang@sgs-gabon.com', '$2y$12$3eJJSxMXLDGEUGcRip8fQuNdOm9QwsSJGoVWUW4g0oDFmz/Weh34O', 4, 1, 1, 0, NULL, '2026-03-25 09:56:41', '2026-03-25 10:03:45', NULL),
(5, 'Rodrigue Ella', 'rodrigue.ella@sgs-gabon.com', '$2y$12$3eJJSxMXLDGEUGcRip8fQuNdOm9QwsSJGoVWUW4g0oDFmz/Weh34O', 5, 2, 1, 0, NULL, '2026-03-25 09:56:41', '2026-03-25 10:03:48', NULL),
(6, 'Jean-Marc Koua', 'jeanmarc.koua@sgs-gabon.com', '$2y$12$3eJJSxMXLDGEUGcRip8fQuNdOm9QwsSJGoVWUW4g0oDFmz/Weh34O', 2, 2, 1, 0, NULL, '2026-03-25 09:56:41', '2026-03-25 10:03:51', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `vehicules`
--

CREATE TABLE `vehicules` (
  `immatriculation` varchar(30) NOT NULL,
  `numero_chassis` varchar(100) DEFAULT NULL COMMENT 'VIN',
  `marque_id` bigint(20) UNSIGNED DEFAULT NULL,
  `modele_id` bigint(20) UNSIGNED DEFAULT NULL,
  `categorie_id` bigint(20) UNSIGNED DEFAULT NULL,
  `annee_id` bigint(20) UNSIGNED DEFAULT NULL,
  `nb_places` int(11) NOT NULL DEFAULT 5,
  `direction_id` int(10) UNSIGNED DEFAULT NULL,
  `kilometrage` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
  `date_maj_km` date DEFAULT NULL,
  `km_prochaine_vidange` bigint(20) UNSIGNED DEFAULT NULL,
  `km_prochaine_revision` bigint(20) UNSIGNED DEFAULT NULL,
  `statut` varchar(50) NOT NULL DEFAULT 'disponible' COMMENT 'disponible, en_mission, en_maintenance, immobilise',
  `date_immobilisation` datetime DEFAULT NULL,
  `consommation_moyenne` decimal(10,2) DEFAULT NULL COMMENT 'L/100km',
  `date_acquisition` date DEFAULT NULL,
  `date_expiration_assurance` date DEFAULT NULL,
  `date_expiration_visite_technique` date DEFAULT NULL,
  `cout_acquisition` decimal(14,2) NOT NULL DEFAULT 0.00,
  `valeur_residuelle` decimal(14,2) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT 0,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `vehicules`
--

INSERT INTO `vehicules` (`immatriculation`, `numero_chassis`, `marque_id`, `modele_id`, `categorie_id`, `annee_id`, `nb_places`, `direction_id`, `kilometrage`, `date_maj_km`, `km_prochaine_vidange`, `km_prochaine_revision`, `statut`, `date_immobilisation`, `consommation_moyenne`, `date_acquisition`, `date_expiration_assurance`, `date_expiration_visite_technique`, `cout_acquisition`, `valeur_residuelle`, `photo`, `notes`, `est_actif`, `est_supprime`, `date_creation`, `date_modification`, `date_suppression`) VALUES
('LBV-001-A', 'JTMHX3FV70D123001', 1, 1, 2, 4, 5, 2, 85420, '2026-03-31', NULL, NULL, 'en_mission', NULL, 12.30, '2022-05-15', '2027-05-14', '2027-03-10', 35000000.00, NULL, 'upload/images/vehicules/40f7fcde-bbc8-46c9-a453-1d00fab73489.png', NULL, 1, 0, '2026-03-25 10:20:48', '2026-03-31 09:33:35', NULL),
('LBV-002-A', 'JTFHX9BV70D456002', 1, 2, 3, 3, 5, 2, 47230, '2026-03-10', NULL, NULL, 'disponible', NULL, 9.70, '2021-09-20', '2026-09-19', '2026-07-18', 22000000.00, NULL, NULL, NULL, 1, 0, '2026-03-25 10:20:48', '2026-03-25 10:20:48', NULL),
('LBV-003-B', 'MMCSSR93WEH789003', 2, 3, 3, 2, 7, 3, 62100, '2026-02-28', NULL, NULL, 'en_maintenance', NULL, 10.50, '2020-11-12', '2026-11-11', '2026-10-05', 28000000.00, NULL, NULL, NULL, 1, 0, '2026-03-25 10:20:48', '2026-03-25 10:20:48', NULL),
('LBV-004-B', '1FTTW2BT50EBC4004', 3, 4, 3, 5, 5, 4, 18900, '2026-03-31', NULL, NULL, 'en_mission', NULL, 9.90, '2023-03-01', '2028-02-28', '2028-01-15', 26000000.00, NULL, NULL, NULL, 1, 0, '2026-03-25 10:20:48', '2026-03-31 08:14:19', NULL),
('LBV-005-C', 'JADTF5510N7005005', 5, 5, 4, 1, 2, 5, 112500, '2026-03-31', NULL, NULL, 'immobilise', NULL, 9.20, '2019-07-10', '2026-07-09', '2026-05-25', 18000000.00, NULL, NULL, NULL, 1, 0, '2026-03-25 10:20:48', '2026-03-31 08:14:56', NULL),
('QQWNK445', NULL, 1, 1, 2, 6, 5, 4, 8470, '2026-03-31', NULL, NULL, 'immobilise', NULL, NULL, '2026-03-20', '2026-03-05', '2026-03-12', 2780000.00, NULL, NULL, 'Noire', 1, 1, '2026-03-31 08:54:10', '2026-03-31 09:28:16', '2026-03-31 09:28:16');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `accidents`
--
ALTER TABLE `accidents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_acc_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_acc_chauffeur` (`chauffeur_user_id`),
  ADD KEY `idx_acc_date` (`date_accident`),
  ADD KEY `idx_acc_statut` (`statut`),
  ADD KEY `idx_acc_mission` (`mission_id`),
  ADD KEY `idx_acc_actifs` (`est_supprime`);

--
-- Index pour la table `alertes_kilometrage`
--
ALTER TABLE `alertes_kilometrage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_alertkm_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_alertkm_type` (`type_alerte`),
  ADD KEY `idx_alertkm_resolue` (`est_resolue`);

--
-- Index pour la table `annees`
--
ALTER TABLE `annees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `annees_annee_unique` (`annee`),
  ADD KEY `idx_annees_annee` (`annee`);

--
-- Index pour la table `anomalies`
--
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

--
-- Index pour la table `anomalies_pc_radio`
--
ALTER TABLE `anomalies_pc_radio`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_anom_pcradio_statut` (`statut`),
  ADD KEY `idx_anom_pcradio_actives` (`est_supprime`),
  ADD KEY `idx_anom_pcradio_severite` (`severite`),
  ADD KEY `idx_anom_pcradio_date` (`date_detection`),
  ADD KEY `fk_anom_pcradio_pc` (`pc_radio_id`),
  ADD KEY `fk_anom_pcradio_vehicule` (`vehicule_immatriculation`),
  ADD KEY `fk_anom_pcradio_chauffeur` (`chauffeur_user_id`);

--
-- Index pour la table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Index pour la table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Index pour la table `carnets_carburant`
--
ALTER TABLE `carnets_carburant`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_carburant_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_carburant_date` (`date_plein`),
  ADD KEY `idx_carburant_mission` (`mission_id`),
  ADD KEY `idx_carburant_actifs` (`est_supprime`);

--
-- Index pour la table `categories_notifications`
--
ALTER TABLE `categories_notifications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `categories_notifications_code_unique` (`code`),
  ADD KEY `idx_catnotif_code` (`code`),
  ADD KEY `idx_catnotif_priorite` (`niveau_priorite`),
  ADD KEY `idx_catnotif_actives` (`est_supprime`,`est_actif`);

--
-- Index pour la table `categories_vehicules`
--
ALTER TABLE `categories_vehicules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `categories_vehicules_nom_unique` (`nom`),
  ADD KEY `idx_categories_nom` (`nom`);

--
-- Index pour la table `checklists`
--
ALTER TABLE `checklists`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `checklists_code_unique` (`code`),
  ADD KEY `idx_checklist_type_insp` (`type_inspection_id`),
  ADD KEY `idx_checklist_categorie` (`categorie`),
  ADD KEY `idx_checklist_actifs` (`est_supprime`,`est_actif`),
  ADD KEY `idx_checklist_ordre` (`ordre_affichage`);

--
-- Index pour la table `demandes_intervention`
--
ALTER TABLE `demandes_intervention`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_demande_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_demande_demandeur` (`demandeur_user_id`),
  ADD KEY `idx_demande_anomalie` (`anomalie_id`),
  ADD KEY `idx_demande_statut` (`statut`),
  ADD KEY `idx_demande_priorite` (`priorite`),
  ADD KEY `idx_demande_actives` (`est_supprime`),
  ADD KEY `fk_demande_validee_par` (`validee_par_user_id`);

--
-- Index pour la table `directions`
--
ALTER TABLE `directions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_directions_actives` (`est_supprime`);

--
-- Index pour la table `documents_chauffeurs`
--
ALTER TABLE `documents_chauffeurs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_docchauf_chauffeur` (`chauffeur_user_id`),
  ADD KEY `idx_docchauf_type` (`type_document`),
  ADD KEY `idx_docchauf_expiration` (`date_expiration`),
  ADD KEY `idx_docchauf_actifs` (`est_supprime`),
  ADD KEY `fk_docchauf_telecharge_par` (`telecharge_par_user_id`);

--
-- Index pour la table `documents_vehicules`
--
ALTER TABLE `documents_vehicules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_docveh_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_docveh_type` (`type_document`),
  ADD KEY `idx_docveh_expiration` (`date_expiration`),
  ADD KEY `idx_docveh_actifs` (`est_supprime`),
  ADD KEY `fk_docveh_telecharge_par` (`telecharge_par_user_id`);

--
-- Index pour la table `elements_inspectes`
--
ALTER TABLE `elements_inspectes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_eleminsp_statut` (`statut`),
  ADD KEY `idx_eleminsp_element` (`element_verifie`),
  ADD KEY `fk_eleminsp_insp_veh` (`inspection_vehicule_id`),
  ADD KEY `fk_eleminsp_checklist` (`checklist_id`);

--
-- Index pour la table `envois_notifications`
--
ALTER TABLE `envois_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_envoi_notification` (`notification_id`),
  ADD KEY `idx_envoi_user` (`user_id`),
  ADD KEY `idx_envoi_canal` (`canal`),
  ADD KEY `idx_envoi_statut` (`statut_envoi`),
  ADD KEY `idx_envoi_user_canal_lu` (`user_id`,`canal`,`est_lu`),
  ADD KEY `idx_envoi_date` (`date_creation`);

--
-- Index pour la table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Index pour la table `fournisseurs`
--
ALTER TABLE `fournisseurs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_fournisseurs_actifs` (`est_supprime`,`est_actif`);

--
-- Index pour la table `historique_kilometrage`
--
ALTER TABLE `historique_kilometrage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_histokm_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_histokm_date` (`date_relevee`),
  ADD KEY `idx_histokm_vehicule_date` (`vehicule_immatriculation`,`date_relevee`),
  ADD KEY `fk_histokm_enregistre_par` (`enregistre_par_user_id`);

--
-- Index pour la table `inspections`
--
ALTER TABLE `inspections`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_inspections_type` (`type_inspection_id`),
  ADD KEY `idx_inspections_inspecteur` (`inspecteur_user_id`),
  ADD KEY `idx_inspections_date` (`date_inspection`),
  ADD KEY `idx_inspections_actives` (`est_supprime`);

--
-- Index pour la table `inspections_vehicules`
--
ALTER TABLE `inspections_vehicules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_inspveh_statut` (`statut_global`),
  ADD KEY `fk_inspveh_inspection` (`inspection_id`),
  ADD KEY `fk_inspveh_vehicule` (`vehicule_immatriculation`),
  ADD KEY `fk_inspveh_anomalie` (`anomalie_creee_id`);

--
-- Index pour la table `intervenants`
--
ALTER TABLE `intervenants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_intervenants_type` (`type_intervenant_id`),
  ADD KEY `idx_intervenants_user` (`user_id`),
  ADD KEY `idx_intervenants_actifs` (`est_supprime`,`est_actif`);

--
-- Index pour la table `interventions`
--
ALTER TABLE `interventions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_interv_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_interv_intervenant` (`intervenant_id`),
  ADD KEY `idx_interv_demande` (`demande_id`),
  ADD KEY `idx_interv_statut` (`statut`),
  ADD KEY `idx_interv_dates` (`date_debut`,`date_fin`),
  ADD KEY `idx_interv_actives` (`est_supprime`),
  ADD KEY `idx_interventions_vehicule_statut` (`vehicule_immatriculation`,`statut`);

--
-- Index pour la table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Index pour la table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `journaux_audit`
--
ALTER TABLE `journaux_audit`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_user` (`user_id`),
  ADD KEY `idx_audit_table` (`nom_table`,`id_enregistrement`),
  ADD KEY `idx_audit_action` (`action`),
  ADD KEY `idx_audit_date` (`date_creation`);

--
-- Index pour la table `kpi_vehicules`
--
ALTER TABLE `kpi_vehicules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_kpiveh_vehicule_periode` (`vehicule_immatriculation`,`annee_periode`,`mois_periode`),
  ADD KEY `idx_kpiveh_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_kpiveh_periode` (`annee_periode`,`mois_periode`);

--
-- Index pour la table `marques`
--
ALTER TABLE `marques`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `marques_nom_unique` (`nom`),
  ADD KEY `idx_marques_nom` (`nom`);

--
-- Index pour la table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `missions`
--
ALTER TABLE `missions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_missions_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_missions_chauffeur` (`chauffeur_user_id`),
  ADD KEY `idx_missions_statut` (`statut`),
  ADD KEY `idx_missions_dates` (`date_depart_prevue`,`statut`),
  ADD KEY `idx_missions_direction` (`direction_id`),
  ADD KEY `idx_missions_actives` (`est_supprime`),
  ADD KEY `idx_missions_vehicule_statut` (`vehicule_immatriculation`,`statut`);

--
-- Index pour la table `modeles`
--
ALTER TABLE `modeles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_marque_modele` (`marque_id`,`nom`),
  ADD KEY `idx_modeles_marque` (`marque_id`),
  ADD KEY `idx_modeles_categorie` (`categorie_id`);

--
-- Index pour la table `mouvements_stock`
--
ALTER TABLE `mouvements_stock`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_mouvstock_piece` (`piece_id`),
  ADD KEY `idx_mouvstock_date` (`date_creation`),
  ADD KEY `idx_mouvstock_type` (`type_mouvement`),
  ADD KEY `idx_mouvstock_piece_date` (`piece_id`,`date_creation`),
  ADD KEY `fk_mouvstock_effectue_par` (`effectue_par_user_id`),
  ADD KEY `fk_mouvstock_fournisseur` (`fournisseur_id`);

--
-- Index pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notif_categorie` (`categorie_id`),
  ADD KEY `idx_notif_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_notif_date` (`date_creation`);

--
-- Index pour la table `outils`
--
ALTER TABLE `outils`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_outils_etat` (`etat`),
  ADD KEY `idx_outils_categorie` (`categorie`),
  ADD KEY `idx_outils_actifs` (`est_supprime`);

--
-- Index pour la table `parametres_alertes`
--
ALTER TABLE `parametres_alertes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_paramalert_type` (`type_alerte`),
  ADD KEY `idx_paramalert_actives` (`est_supprime`,`est_actif`),
  ADD KEY `fk_paramalert_categorie` (`categorie_notification_id`);

--
-- Index pour la table `parametres_systeme`
--
ALTER TABLE `parametres_systeme`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `parametres_systeme_cle_unique` (`cle`),
  ADD KEY `idx_param_cle` (`cle`),
  ADD KEY `idx_param_categorie` (`categorie`),
  ADD KEY `fk_param_modifie_par` (`modifie_par_user_id`);

--
-- Index pour la table `pc_radio`
--
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

--
-- Index pour la table `performances_chauffeurs`
--
ALTER TABLE `performances_chauffeurs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_perfchauf_chauffeur` (`chauffeur_user_id`),
  ADD KEY `idx_perfchauf_periode` (`date_debut_periode`,`date_fin_periode`);

--
-- Index pour la table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Index pour la table `pieces_detachees`
--
ALTER TABLE `pieces_detachees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pieces_nom` (`nom`),
  ADD KEY `idx_pieces_sku` (`sku`),
  ADD KEY `idx_pieces_fournisseur` (`fournisseur_id`),
  ADD KEY `idx_pieces_type` (`type_piece`),
  ADD KEY `idx_pieces_actives` (`est_supprime`,`est_actif`),
  ADD KEY `idx_pieces_stock_alerte` (`quantite_stock`,`seuil_alerte`);

--
-- Index pour la table `planning_maintenance`
--
ALTER TABLE `planning_maintenance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_planmaint_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_planmaint_regle` (`regle_id`),
  ADD KEY `idx_planmaint_statut` (`statut`),
  ADD KEY `idx_planmaint_echeances` (`prochaine_echeance_date`,`prochaine_echeance_km`),
  ADD KEY `idx_planmaint_actifs` (`est_supprime`),
  ADD KEY `fk_planmaint_derniere_interv` (`derniere_intervention_id`);

--
-- Index pour la table `prelevements_pieces`
--
ALTER TABLE `prelevements_pieces`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_prelpiec_intervention` (`intervention_id`),
  ADD KEY `idx_prelpiec_piece` (`piece_id`),
  ADD KEY `idx_prelpiec_preleve_par` (`preleve_par_user_id`),
  ADD KEY `idx_prelpiec_date` (`date_prelevement`);

--
-- Index pour la table `problemes_outils`
--
ALTER TABLE `problemes_outils`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pboutil_outil` (`outil_id`),
  ADD KEY `idx_pboutil_statut` (`statut`),
  ADD KEY `idx_pboutil_actifs` (`est_supprime`),
  ADD KEY `fk_pboutil_signale_par` (`signale_par_user_id`);

--
-- Index pour la table `regles_maintenance`
--
ALTER TABLE `regles_maintenance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reglemaint_type` (`type_maintenance`),
  ADD KEY `idx_reglemaint_actives` (`est_supprime`,`est_actif`);

--
-- Index pour la table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_code_unique` (`code`),
  ADD KEY `idx_roles_actifs` (`est_supprime`);

--
-- Index pour la table `types_inspection`
--
ALTER TABLE `types_inspection`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `types_inspection_code_unique` (`code`),
  ADD KEY `idx_typeinsp_actifs` (`est_supprime`,`est_actif`),
  ADD KEY `idx_typeinsp_ordre` (`ordre_affichage`);

--
-- Index pour la table `types_intervenant`
--
ALTER TABLE `types_intervenant`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `types_intervenant_code_unique` (`code`),
  ADD KEY `idx_typeinterv_actifs` (`est_supprime`,`est_actif`),
  ADD KEY `idx_typeinterv_ordre` (`ordre_affichage`);

--
-- Index pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `utilisateurs_email_unique` (`email`),
  ADD KEY `idx_utilisateurs_role` (`role_id`),
  ADD KEY `idx_utilisateurs_direction` (`direction_id`),
  ADD KEY `idx_utilisateurs_email` (`email`),
  ADD KEY `idx_utilisateurs_actifs` (`est_supprime`,`est_actif`);

--
-- Index pour la table `vehicules`
--
ALTER TABLE `vehicules`
  ADD PRIMARY KEY (`immatriculation`),
  ADD UNIQUE KEY `vehicules_numero_chassis_unique` (`numero_chassis`),
  ADD KEY `idx_vehicules_immat` (`immatriculation`),
  ADD KEY `idx_vehicules_direction` (`direction_id`),
  ADD KEY `idx_vehicules_statut` (`statut`),
  ADD KEY `idx_vehicules_actifs` (`est_supprime`,`est_actif`),
  ADD KEY `idx_vehicules_date_maj_km` (`date_maj_km`),
  ADD KEY `idx_vehicules_marque` (`marque_id`),
  ADD KEY `idx_vehicules_modele` (`modele_id`),
  ADD KEY `idx_vehicules_categorie` (`categorie_id`),
  ADD KEY `idx_vehicules_annee` (`annee_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `accidents`
--
ALTER TABLE `accidents`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `alertes_kilometrage`
--
ALTER TABLE `alertes_kilometrage`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `annees`
--
ALTER TABLE `annees`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `anomalies`
--
ALTER TABLE `anomalies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `anomalies_pc_radio`
--
ALTER TABLE `anomalies_pc_radio`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `carnets_carburant`
--
ALTER TABLE `carnets_carburant`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `categories_notifications`
--
ALTER TABLE `categories_notifications`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `categories_vehicules`
--
ALTER TABLE `categories_vehicules`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `checklists`
--
ALTER TABLE `checklists`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `demandes_intervention`
--
ALTER TABLE `demandes_intervention`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `directions`
--
ALTER TABLE `directions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `documents_chauffeurs`
--
ALTER TABLE `documents_chauffeurs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `documents_vehicules`
--
ALTER TABLE `documents_vehicules`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `elements_inspectes`
--
ALTER TABLE `elements_inspectes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `envois_notifications`
--
ALTER TABLE `envois_notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `fournisseurs`
--
ALTER TABLE `fournisseurs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `historique_kilometrage`
--
ALTER TABLE `historique_kilometrage`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `inspections`
--
ALTER TABLE `inspections`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `inspections_vehicules`
--
ALTER TABLE `inspections_vehicules`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `intervenants`
--
ALTER TABLE `intervenants`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `interventions`
--
ALTER TABLE `interventions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `journaux_audit`
--
ALTER TABLE `journaux_audit`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `kpi_vehicules`
--
ALTER TABLE `kpi_vehicules`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `marques`
--
ALTER TABLE `marques`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT pour la table `missions`
--
ALTER TABLE `missions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `modeles`
--
ALTER TABLE `modeles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `mouvements_stock`
--
ALTER TABLE `mouvements_stock`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `outils`
--
ALTER TABLE `outils`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `parametres_alertes`
--
ALTER TABLE `parametres_alertes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `parametres_systeme`
--
ALTER TABLE `parametres_systeme`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pour la table `pc_radio`
--
ALTER TABLE `pc_radio`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `performances_chauffeurs`
--
ALTER TABLE `performances_chauffeurs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=79;

--
-- AUTO_INCREMENT pour la table `pieces_detachees`
--
ALTER TABLE `pieces_detachees`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `planning_maintenance`
--
ALTER TABLE `planning_maintenance`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `prelevements_pieces`
--
ALTER TABLE `prelevements_pieces`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `problemes_outils`
--
ALTER TABLE `problemes_outils`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `regles_maintenance`
--
ALTER TABLE `regles_maintenance`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `types_inspection`
--
ALTER TABLE `types_inspection`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `types_intervenant`
--
ALTER TABLE `types_intervenant`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `accidents`
--
ALTER TABLE `accidents`
  ADD CONSTRAINT `fk_accidents_chauffeur` FOREIGN KEY (`chauffeur_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_accidents_mission` FOREIGN KEY (`mission_id`) REFERENCES `missions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_accidents_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `alertes_kilometrage`
--
ALTER TABLE `alertes_kilometrage`
  ADD CONSTRAINT `fk_alertkm_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `anomalies`
--
ALTER TABLE `anomalies`
  ADD CONSTRAINT `fk_anomalies_mission` FOREIGN KEY (`mission_id`) REFERENCES `missions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_anomalies_signalee_par` FOREIGN KEY (`signalee_par_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_anomalies_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `anomalies_pc_radio`
--
ALTER TABLE `anomalies_pc_radio`
  ADD CONSTRAINT `fk_anom_pcradio_chauffeur` FOREIGN KEY (`chauffeur_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_anom_pcradio_pc` FOREIGN KEY (`pc_radio_id`) REFERENCES `pc_radio` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_anom_pcradio_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `carnets_carburant`
--
ALTER TABLE `carnets_carburant`
  ADD CONSTRAINT `fk_carburant_mission` FOREIGN KEY (`mission_id`) REFERENCES `missions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_carburant_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `checklists`
--
ALTER TABLE `checklists`
  ADD CONSTRAINT `fk_checklist_type_insp` FOREIGN KEY (`type_inspection_id`) REFERENCES `types_inspection` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `demandes_intervention`
--
ALTER TABLE `demandes_intervention`
  ADD CONSTRAINT `fk_demande_anomalie` FOREIGN KEY (`anomalie_id`) REFERENCES `anomalies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_demande_demandeur` FOREIGN KEY (`demandeur_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_demande_validee_par` FOREIGN KEY (`validee_par_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_demande_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `documents_chauffeurs`
--
ALTER TABLE `documents_chauffeurs`
  ADD CONSTRAINT `fk_docchauf_chauffeur` FOREIGN KEY (`chauffeur_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_docchauf_telecharge_par` FOREIGN KEY (`telecharge_par_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `documents_vehicules`
--
ALTER TABLE `documents_vehicules`
  ADD CONSTRAINT `fk_docveh_telecharge_par` FOREIGN KEY (`telecharge_par_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_docveh_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `elements_inspectes`
--
ALTER TABLE `elements_inspectes`
  ADD CONSTRAINT `fk_eleminsp_checklist` FOREIGN KEY (`checklist_id`) REFERENCES `checklists` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_eleminsp_insp_veh` FOREIGN KEY (`inspection_vehicule_id`) REFERENCES `inspections_vehicules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `envois_notifications`
--
ALTER TABLE `envois_notifications`
  ADD CONSTRAINT `fk_envoi_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_envoi_user` FOREIGN KEY (`user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `historique_kilometrage`
--
ALTER TABLE `historique_kilometrage`
  ADD CONSTRAINT `fk_histokm_enregistre_par` FOREIGN KEY (`enregistre_par_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_histokm_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `inspections`
--
ALTER TABLE `inspections`
  ADD CONSTRAINT `fk_inspections_inspecteur` FOREIGN KEY (`inspecteur_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inspections_type` FOREIGN KEY (`type_inspection_id`) REFERENCES `types_inspection` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Contraintes pour la table `inspections_vehicules`
--
ALTER TABLE `inspections_vehicules`
  ADD CONSTRAINT `fk_inspveh_anomalie` FOREIGN KEY (`anomalie_creee_id`) REFERENCES `anomalies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inspveh_inspection` FOREIGN KEY (`inspection_id`) REFERENCES `inspections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inspveh_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `intervenants`
--
ALTER TABLE `intervenants`
  ADD CONSTRAINT `fk_intervenants_type` FOREIGN KEY (`type_intervenant_id`) REFERENCES `types_intervenant` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_intervenants_user` FOREIGN KEY (`user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `interventions`
--
ALTER TABLE `interventions`
  ADD CONSTRAINT `fk_interv_demande` FOREIGN KEY (`demande_id`) REFERENCES `demandes_intervention` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_interv_intervenant` FOREIGN KEY (`intervenant_id`) REFERENCES `intervenants` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_interv_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `journaux_audit`
--
ALTER TABLE `journaux_audit`
  ADD CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `kpi_vehicules`
--
ALTER TABLE `kpi_vehicules`
  ADD CONSTRAINT `fk_kpiveh_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `missions`
--
ALTER TABLE `missions`
  ADD CONSTRAINT `fk_missions_chauffeur` FOREIGN KEY (`chauffeur_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_missions_direction` FOREIGN KEY (`direction_id`) REFERENCES `directions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_missions_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `modeles`
--
ALTER TABLE `modeles`
  ADD CONSTRAINT `modeles_categorie_id_foreign` FOREIGN KEY (`categorie_id`) REFERENCES `categories_vehicules` (`id`),
  ADD CONSTRAINT `modeles_marque_id_foreign` FOREIGN KEY (`marque_id`) REFERENCES `marques` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `mouvements_stock`
--
ALTER TABLE `mouvements_stock`
  ADD CONSTRAINT `fk_mouvstock_effectue_par` FOREIGN KEY (`effectue_par_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mouvstock_fournisseur` FOREIGN KEY (`fournisseur_id`) REFERENCES `fournisseurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mouvstock_piece` FOREIGN KEY (`piece_id`) REFERENCES `pieces_detachees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_categorie` FOREIGN KEY (`categorie_id`) REFERENCES `categories_notifications` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notifications_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `parametres_alertes`
--
ALTER TABLE `parametres_alertes`
  ADD CONSTRAINT `fk_paramalert_categorie` FOREIGN KEY (`categorie_notification_id`) REFERENCES `categories_notifications` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `parametres_systeme`
--
ALTER TABLE `parametres_systeme`
  ADD CONSTRAINT `fk_param_modifie_par` FOREIGN KEY (`modifie_par_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `pc_radio`
--
ALTER TABLE `pc_radio`
  ADD CONSTRAINT `fk_pcradio_agent` FOREIGN KEY (`agent_pc_radio_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pcradio_chauffeur` FOREIGN KEY (`chauffeur_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pcradio_mission` FOREIGN KEY (`mission_id`) REFERENCES `missions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pcradio_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `performances_chauffeurs`
--
ALTER TABLE `performances_chauffeurs`
  ADD CONSTRAINT `fk_perfchauf_chauffeur` FOREIGN KEY (`chauffeur_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `pieces_detachees`
--
ALTER TABLE `pieces_detachees`
  ADD CONSTRAINT `fk_pieces_fournisseur` FOREIGN KEY (`fournisseur_id`) REFERENCES `fournisseurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `planning_maintenance`
--
ALTER TABLE `planning_maintenance`
  ADD CONSTRAINT `fk_planmaint_derniere_interv` FOREIGN KEY (`derniere_intervention_id`) REFERENCES `interventions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_planmaint_regle` FOREIGN KEY (`regle_id`) REFERENCES `regles_maintenance` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_planmaint_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `prelevements_pieces`
--
ALTER TABLE `prelevements_pieces`
  ADD CONSTRAINT `fk_prelpiec_intervention` FOREIGN KEY (`intervention_id`) REFERENCES `interventions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_prelpiec_piece` FOREIGN KEY (`piece_id`) REFERENCES `pieces_detachees` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_prelpiec_preleve_par` FOREIGN KEY (`preleve_par_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Contraintes pour la table `problemes_outils`
--
ALTER TABLE `problemes_outils`
  ADD CONSTRAINT `fk_pboutil_outil` FOREIGN KEY (`outil_id`) REFERENCES `outils` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pboutil_signale_par` FOREIGN KEY (`signale_par_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Contraintes pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  ADD CONSTRAINT `fk_utilisateurs_direction` FOREIGN KEY (`direction_id`) REFERENCES `directions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_utilisateurs_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Contraintes pour la table `vehicules`
--
ALTER TABLE `vehicules`
  ADD CONSTRAINT `fk_vehicules_direction` FOREIGN KEY (`direction_id`) REFERENCES `directions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `vehicules_annee_id_foreign` FOREIGN KEY (`annee_id`) REFERENCES `annees` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `vehicules_categorie_id_foreign` FOREIGN KEY (`categorie_id`) REFERENCES `categories_vehicules` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `vehicules_marque_id_foreign` FOREIGN KEY (`marque_id`) REFERENCES `marques` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `vehicules_modele_id_foreign` FOREIGN KEY (`modele_id`) REFERENCES `modeles` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
