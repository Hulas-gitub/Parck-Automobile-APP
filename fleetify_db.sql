-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : ven. 23 oct. 2026 à 11:36
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
-- Structure de la table `accessoires`
--

CREATE TABLE `accessoires` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(150) NOT NULL,
  `categorie` varchar(100) NOT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `accessoires`
--

INSERT INTO `accessoires` (`id`, `nom`, `categorie`, `est_actif`, `created_at`, `updated_at`) VALUES
(1, 'VISITE TECHNIQUE', 'Documents', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(2, 'CARTE GRISE', 'Documents', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(3, 'ATTESTATION ASSURANCE', 'Documents', 1, '2026-05-15 12:28:41', '2026-10-15 16:15:26'),
(4, 'GILET DE SECURITE', 'Sécurité', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(5, 'EXTINCTEUR + CARTE', 'Sécurité', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(6, 'TROUSSE DE SECOURS', 'Sécurité', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(7, 'TRIANGLE x2', 'Sécurité', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(8, 'CEINTURES DE SECURITE', 'Sécurité', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(9, 'AUTO RADIO', 'Équipements', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(10, 'CLIMATISATION', 'Équipements', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(11, 'RETROVISEURS', 'Équipements', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(12, 'BALAIS ESSUIE GLACE', 'Équipements', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(13, 'GARDES BOUE', 'Équipements', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(14, 'ENJOLIVEURS', 'Équipements', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(15, 'CALE x2', 'Équipements', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(16, 'CRIC', 'Équipements', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(17, 'MANIVELLE', 'Équipements', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(18, 'ROUE DE SECOURS', 'Équipements', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(19, 'KLAXON', 'Équipements', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(20, 'PHARES', 'Éclairage', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(21, 'FEUX STOP', 'Éclairage', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(22, 'CLIGNOTANTS', 'Éclairage', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(23, 'PLAQUE IMMATRICULATION x2', 'Éclairage', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(24, 'NIVEAU LIQUIDE REFROIDISSEMENT', 'Niveaux', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(25, 'NIVEAU HUILE MOTEUR', 'Niveaux', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(26, 'NIVEAU EAU ESSUIES GLACE', 'Niveaux', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(27, 'NIVEAU HUILE FREIN', 'Niveaux', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(28, 'NIVEAU HUILE DIRECTION', 'Niveaux', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(29, 'NIVEAU HUILE PONT', 'Niveaux', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(30, 'ETAT PNEUMATIQUES', 'Mécanique', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(31, 'PLAQUETTES / GARNITURES (usure)', 'Mécanique', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(32, 'AMORTISSEURS', 'Mécanique', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(33, 'PNEUS (usure, pression)', 'Mécanique', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(34, 'EMBRAYAGE', 'Mécanique', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(35, 'TUYAU ECHAPPEMENT', 'Mécanique', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(36, 'ETAT BIELETTES', 'Mécanique', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(37, 'ETAT ROTULES', 'Mécanique', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(38, 'ETAT FERMETURES', 'État général', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(39, 'ETAT VITRAGE', 'État général', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(40, 'ETAT PEINTURE', 'État général', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(41, 'CARROSSERIE', 'État général', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(42, 'ETAT INTERIEUR', 'État général', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(43, 'PROPRETE', 'État général', 1, '2026-05-15 12:28:41', '2026-05-15 12:28:41'),
(44, 'Phare avant', 'Éclairage', 1, '2026-05-15 13:05:46', '2026-05-15 13:05:46');

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
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
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
-- Structure de la table `affectations`
--

CREATE TABLE `affectations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(150) NOT NULL,
  `code` varchar(30) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `affectations`
--

INSERT INTO `affectations` (`id`, `nom`, `code`, `description`, `est_actif`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'PARC AUTO', NULL, NULL, 1, '2026-05-28 06:47:01', '2026-05-28 06:47:01', NULL),
(2, 'CONTROLE ZONE 3', NULL, NULL, 1, '2026-05-28 06:47:01', '2026-05-28 06:47:01', NULL),
(3, 'DIRECTEUR FINANCIER', NULL, NULL, 1, '2026-05-28 06:47:01', '2026-05-28 06:47:01', NULL),
(4, 'AGENCE POG', NULL, NULL, 1, '2026-05-28 06:47:01', '2026-05-28 06:47:01', NULL),
(5, 'AGENCE', NULL, NULL, 1, '2026-05-28 06:47:01', '2026-05-28 06:47:01', NULL),
(6, 'CONTROLE ZONE', NULL, NULL, 1, '2026-05-28 06:47:01', '2026-05-28 06:47:01', NULL),
(7, 'EBOMAF', NULL, NULL, 1, '2026-05-28 06:47:01', '2026-05-28 06:47:01', NULL),
(8, 'VHL LIAISON COMMERCIALE', NULL, NULL, 1, '2026-05-28 06:47:01', '2026-05-28 06:47:01', NULL),
(9, 'RECOUVREMENT', NULL, NULL, 1, '2026-05-28 06:47:01', '2026-05-28 06:47:01', NULL),
(10, 'DAAL - LIAISON', NULL, NULL, 1, '2026-07-23 10:32:54', '2026-07-23 10:32:54', NULL),
(11, 'D R H', NULL, NULL, 1, '2026-07-23 10:32:54', '2026-07-23 10:32:54', NULL),
(12, 'D A A L', NULL, NULL, 1, '2026-07-23 10:32:54', '2026-07-23 10:32:54', NULL),
(13, 'LIAISON COMMERCIAL', NULL, NULL, 1, '2026-07-23 10:32:54', '2026-07-23 10:32:54', NULL),
(14, 'DOP', NULL, NULL, 1, '2026-07-23 10:32:54', '2026-07-23 10:32:54', NULL),
(15, 'LIPOT', NULL, NULL, 1, '2026-07-23 10:32:54', '2026-07-23 10:32:54', NULL),
(16, 'DOP - ESCORTE - TF', NULL, NULL, 1, '2026-07-23 10:32:54', '2026-07-23 10:32:54', NULL),
(17, 'DOP - GI', NULL, NULL, 1, '2026-07-23 10:32:54', '2026-07-23 10:32:54', NULL),
(18, 'MOANDA', NULL, NULL, 1, '2026-07-23 10:32:54', '2026-07-23 10:32:54', NULL),
(19, 'FRANCEVILLE', NULL, NULL, 1, '2026-07-23 10:32:54', '2026-07-23 10:32:54', NULL),
(20, 'HAKIM - JEROBOAM', NULL, NULL, 1, '2026-07-23 10:32:54', '2026-07-23 10:32:54', NULL),
(21, 'DEX - ZONE 1', NULL, NULL, 1, '2026-07-23 10:32:54', '2026-07-23 10:32:54', NULL),
(22, 'DEX - ZONE 3', NULL, NULL, 1, '2026-07-23 10:32:54', '2026-07-23 10:32:54', NULL),
(23, 'DEX - ZONE 2', NULL, NULL, 1, '2026-07-23 10:32:54', '2026-07-23 10:32:54', NULL),
(24, 'PORT GENTIL', NULL, NULL, 1, '2026-07-23 10:32:54', '2026-07-23 10:32:54', NULL),
(25, 'LAMBARENE', NULL, NULL, 1, '2026-07-23 10:32:54', '2026-07-23 10:32:54', NULL),
(26, 'DOP - TF', NULL, NULL, 1, '2026-07-23 10:32:54', '2026-07-23 10:32:54', NULL),
(27, 'POG - TF', NULL, NULL, 1, '2026-07-23 10:32:54', '2026-07-23 10:32:54', NULL),
(28, 'OYEM TF', NULL, NULL, 1, '2026-07-23 10:32:54', '2026-07-23 10:32:54', NULL),
(29, 'OYEM - MEP', NULL, NULL, 1, '2026-07-23 10:32:54', '2026-07-23 10:32:54', NULL),
(30, 'ZONE 4', NULL, NULL, 1, '2026-07-23 10:32:54', '2026-07-23 10:32:54', NULL),
(31, 'BRIGADE CANINE', NULL, NULL, 1, NULL, NULL, NULL),
(32, 'TF/OPS', NULL, NULL, 1, NULL, NULL, NULL),
(33, 'ESCORTE/TF', NULL, NULL, 1, NULL, NULL, NULL),
(34, 'CONTROLE/COMMERCIAL', NULL, NULL, 1, NULL, NULL, NULL),
(35, 'DT/FORMATION', NULL, NULL, 1, NULL, NULL, NULL),
(54, 'DNT', NULL, NULL, 1, NULL, NULL, NULL);

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
(1, '2010', 1, NULL, NULL),
(2, '2011', 1, NULL, NULL),
(3, '2012', 1, '2026-05-06 08:55:14', '2026-05-06 08:55:14'),
(4, '2013', 1, NULL, NULL),
(5, '2014', 1, NULL, NULL),
(6, '2015', 1, NULL, NULL),
(7, '2016', 1, NULL, NULL),
(8, '2017', 1, NULL, NULL),
(9, '2018', 1, NULL, NULL),
(10, '2019', 1, NULL, NULL),
(11, '2020', 1, NULL, NULL),
(12, '2021', 1, NULL, NULL),
(13, '2022', 1, NULL, NULL),
(14, '2023', 1, NULL, NULL),
(15, '2024', 1, NULL, NULL),
(16, '2025', 1, NULL, NULL),
(17, '2026', 1, NULL, NULL);

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
  `partie_vehicule` text DEFAULT NULL,
  `severite` varchar(30) NOT NULL DEFAULT 'moyenne' COMMENT 'faible, moyenne, haute, critique',
  `km_au_signalement` bigint(20) UNSIGNED DEFAULT NULL,
  `position_gps` varchar(100) DEFAULT NULL,
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
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
(1, 'JM 815 AA', 5, NULL, 1, '2026-10-15 17:16:52', 'Inspection : éléments NOK — Voir observations', NULL, 'haute', 42500, NULL, NULL, 'ouverte', 0, '2026-10-15 16:16:52', '2026-10-15 16:16:52', NULL);

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
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
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

--
-- Déchargement des données de la table `cache`
--

INSERT INTO `cache` (`key`, `value`, `expiration`) VALUES
('fleetify_cacheadmin_dashboard_v2', 'a:13:{s:11:\"stats_cards\";a:12:{i:0;a:7:{s:5:\"title\";s:16:\"Total Véhicules\";s:5:\"value\";s:2:\"90\";s:8:\"subtitle\";s:12:\"dans le parc\";s:5:\"trend\";N;s:4:\"icon\";s:17:\"bi-car-front-fill\";s:6:\"iconBg\";s:28:\"bg-blue-100 dark:bg-blue-800\";s:9:\"textColor\";s:32:\"text-blue-600 dark:text-blue-400\";}i:1;a:7:{s:5:\"title\";s:11:\"Disponibles\";s:5:\"value\";s:2:\"75\";s:8:\"subtitle\";s:16:\"prêts à partir\";s:5:\"trend\";N;s:4:\"icon\";s:20:\"bi-check-circle-fill\";s:6:\"iconBg\";s:30:\"bg-green-100 dark:bg-green-800\";s:9:\"textColor\";s:34:\"text-green-600 dark:text-green-400\";}i:2;a:7:{s:5:\"title\";s:13:\"En reparation\";s:5:\"value\";s:1:\"2\";s:8:\"subtitle\";s:9:\"Au garage\";s:5:\"trend\";N;s:4:\"icon\";s:8:\"bi-tools\";s:6:\"iconBg\";s:32:\"bg-orange-100 dark:bg-orange-800\";s:9:\"textColor\";s:36:\"text-orange-600 dark:text-orange-400\";}i:3;a:7:{s:5:\"title\";s:13:\"Interventions\";s:5:\"value\";s:1:\"4\";s:8:\"subtitle\";s:16:\"créées ce mois\";s:5:\"trend\";N;s:4:\"icon\";s:9:\"bi-wrench\";s:6:\"iconBg\";s:32:\"bg-orange-100 dark:bg-orange-800\";s:9:\"textColor\";s:36:\"text-orange-600 dark:text-orange-400\";}i:4;a:7:{s:5:\"title\";s:16:\"Missions Actives\";s:5:\"value\";s:1:\"0\";s:8:\"subtitle\";s:20:\"en cours aujourd\'hui\";s:5:\"trend\";N;s:4:\"icon\";s:15:\"bi-geo-alt-fill\";s:6:\"iconBg\";s:28:\"bg-blue-100 dark:bg-blue-800\";s:9:\"textColor\";s:32:\"text-blue-600 dark:text-blue-400\";}i:5;a:7:{s:5:\"title\";s:18:\"Kilométrage Total\";s:5:\"value\";s:4:\"0 km\";s:8:\"subtitle\";s:27:\"missions terminées ce mois\";s:5:\"trend\";N;s:4:\"icon\";s:15:\"bi-speedometer2\";s:6:\"iconBg\";s:32:\"bg-purple-100 dark:bg-purple-800\";s:9:\"textColor\";s:36:\"text-purple-600 dark:text-purple-400\";}i:6;a:7:{s:5:\"title\";s:12:\"Consommation\";s:5:\"value\";s:3:\"0 L\";s:8:\"subtitle\";s:17:\"carburant ce mois\";s:5:\"trend\";N;s:4:\"icon\";s:17:\"bi-fuel-pump-fill\";s:6:\"iconBg\";s:32:\"bg-yellow-100 dark:bg-yellow-800\";s:9:\"textColor\";s:36:\"text-yellow-600 dark:text-yellow-400\";}i:7;a:7:{s:5:\"title\";s:17:\"Coût Maintenance\";s:5:\"value\";s:8:\"1.3M CFA\";s:8:\"subtitle\";s:31:\"main-d\'œuvre + pièces (trim.)\";s:5:\"trend\";N;s:4:\"icon\";s:18:\"bi-currency-dollar\";s:6:\"iconBg\";s:32:\"bg-orange-100 dark:bg-orange-800\";s:9:\"textColor\";s:36:\"text-orange-600 dark:text-orange-400\";}i:8;a:7:{s:5:\"title\";s:21:\"Tps Moyen Réparation\";s:5:\"value\";s:5:\"1015h\";s:8:\"subtitle\";s:30:\"durée saisie par intervention\";s:5:\"trend\";N;s:4:\"icon\";s:16:\"bi-clock-history\";s:6:\"iconBg\";s:28:\"bg-blue-100 dark:bg-blue-800\";s:9:\"textColor\";s:32:\"text-blue-600 dark:text-blue-400\";}i:9;a:7:{s:5:\"title\";s:21:\"Tps Moyen Résolution\";s:5:\"value\";s:5:\"1015h\";s:8:\"subtitle\";s:25:\"de date_debut à date_fin\";s:5:\"trend\";N;s:4:\"icon\";s:18:\"bi-hourglass-split\";s:6:\"iconBg\";s:30:\"bg-green-100 dark:bg-green-800\";s:9:\"textColor\";s:34:\"text-green-600 dark:text-green-400\";}i:10;a:7:{s:5:\"title\";s:14:\"Total Missions\";s:5:\"value\";s:1:\"0\";s:8:\"subtitle\";s:19:\"planifiées ce mois\";s:5:\"trend\";N;s:4:\"icon\";s:12:\"bi-flag-fill\";s:6:\"iconBg\";s:32:\"bg-purple-100 dark:bg-purple-800\";s:9:\"textColor\";s:36:\"text-purple-600 dark:text-purple-400\";}i:11;a:7:{s:5:\"title\";s:13:\"Interventions\";s:5:\"value\";s:1:\"4\";s:8:\"subtitle\";s:16:\"créées ce mois\";s:5:\"trend\";N;s:4:\"icon\";s:9:\"bi-wrench\";s:6:\"iconBg\";s:32:\"bg-orange-100 dark:bg-orange-800\";s:9:\"textColor\";s:36:\"text-orange-600 dark:text-orange-400\";}}s:10:\"donut_data\";a:9:{i:0;a:4:{s:5:\"label\";s:25:\"Direction des Opérations\";s:5:\"value\";i:41;s:5:\"color\";s:7:\"#10b981\";s:10:\"percentage\";i:46;}i:1;a:4:{s:5:\"label\";s:24:\"Direction d\'Exploitation\";s:5:\"value\";i:21;s:5:\"color\";s:7:\"#3b82f6\";s:10:\"percentage\";i:23;}i:2;a:4:{s:5:\"label\";s:39:\"Direction Administrative et Financière\";s:5:\"value\";i:6;s:5:\"color\";s:7:\"#8b5cf6\";s:10:\"percentage\";i:7;}i:3;a:4:{s:5:\"label\";s:40:\"Direction des achats et de la Logistique\";s:5:\"value\";i:5;s:5:\"color\";s:7:\"#f59e0b\";s:10:\"percentage\";i:6;}i:4;a:4:{s:5:\"label\";s:21:\"Direction Commerciale\";s:5:\"value\";i:5;s:5:\"color\";s:7:\"#9ca3af\";s:10:\"percentage\";i:6;}i:5;a:4:{s:5:\"label\";s:19:\"Direction Technique\";s:5:\"value\";i:3;s:5:\"color\";s:7:\"#ef4444\";s:10:\"percentage\";i:3;}i:6;a:4:{s:5:\"label\";s:33:\"Direction des Ressources Humaines\";s:5:\"value\";i:3;s:5:\"color\";s:7:\"#ec4899\";s:10:\"percentage\";i:3;}i:7;a:4:{s:5:\"label\";s:20:\"Direction Générale\";s:5:\"value\";i:3;s:5:\"color\";s:7:\"#10b981\";s:10:\"percentage\";i:3;}i:8;a:4:{s:5:\"label\";s:35:\"Direction de Système d\'information\";s:5:\"value\";i:3;s:5:\"color\";s:7:\"#3b82f6\";s:10:\"percentage\";i:3;}}s:14:\"bar_chart_data\";a:12:{i:0;a:5:{s:5:\"month\";s:3:\"Jan\";s:5:\"total\";i:0;s:8:\"conforme\";i:0;s:11:\"nonConforme\";i:0;s:6:\"danger\";i:0;}i:1;a:5:{s:5:\"month\";s:4:\"Fév\";s:5:\"total\";i:0;s:8:\"conforme\";i:0;s:11:\"nonConforme\";i:0;s:6:\"danger\";i:0;}i:2;a:5:{s:5:\"month\";s:3:\"Mar\";s:5:\"total\";i:0;s:8:\"conforme\";i:0;s:11:\"nonConforme\";i:0;s:6:\"danger\";i:0;}i:3;a:5:{s:5:\"month\";s:3:\"Avr\";s:5:\"total\";i:1;s:8:\"conforme\";i:1;s:11:\"nonConforme\";i:0;s:6:\"danger\";i:0;}i:4;a:5:{s:5:\"month\";s:3:\"Mai\";s:5:\"total\";i:0;s:8:\"conforme\";i:0;s:11:\"nonConforme\";i:0;s:6:\"danger\";i:0;}i:5;a:5:{s:5:\"month\";s:3:\"Jun\";s:5:\"total\";i:0;s:8:\"conforme\";i:0;s:11:\"nonConforme\";i:0;s:6:\"danger\";i:0;}i:6;a:5:{s:5:\"month\";s:3:\"Jul\";s:5:\"total\";i:0;s:8:\"conforme\";i:0;s:11:\"nonConforme\";i:0;s:6:\"danger\";i:0;}i:7;a:5:{s:5:\"month\";s:4:\"Aoû\";s:5:\"total\";i:0;s:8:\"conforme\";i:0;s:11:\"nonConforme\";i:0;s:6:\"danger\";i:0;}i:8;a:5:{s:5:\"month\";s:3:\"Sep\";s:5:\"total\";i:0;s:8:\"conforme\";i:0;s:11:\"nonConforme\";i:0;s:6:\"danger\";i:0;}i:9;a:5:{s:5:\"month\";s:3:\"Oct\";s:5:\"total\";i:0;s:8:\"conforme\";i:0;s:11:\"nonConforme\";i:0;s:6:\"danger\";i:0;}i:10;a:5:{s:5:\"month\";s:3:\"Nov\";s:5:\"total\";i:0;s:8:\"conforme\";i:0;s:11:\"nonConforme\";i:0;s:6:\"danger\";i:0;}i:11;a:5:{s:5:\"month\";s:4:\"Déc\";s:5:\"total\";i:0;s:8:\"conforme\";i:0;s:11:\"nonConforme\";i:0;s:6:\"danger\";i:0;}}s:15:\"line_chart_data\";a:12:{i:0;a:3:{s:5:\"month\";s:3:\"Jan\";s:12:\"consommation\";i:0;s:9:\"economies\";i:0;}i:1;a:3:{s:5:\"month\";s:4:\"Fév\";s:12:\"consommation\";i:0;s:9:\"economies\";i:0;}i:2;a:3:{s:5:\"month\";s:3:\"Mar\";s:12:\"consommation\";i:0;s:9:\"economies\";i:0;}i:3;a:3:{s:5:\"month\";s:3:\"Avr\";s:12:\"consommation\";i:0;s:9:\"economies\";i:0;}i:4;a:3:{s:5:\"month\";s:3:\"Mai\";s:12:\"consommation\";i:0;s:9:\"economies\";i:0;}i:5;a:3:{s:5:\"month\";s:3:\"Jun\";s:12:\"consommation\";i:0;s:9:\"economies\";i:0;}i:6;a:3:{s:5:\"month\";s:3:\"Jul\";s:12:\"consommation\";i:0;s:9:\"economies\";i:0;}i:7;a:3:{s:5:\"month\";s:4:\"Aoû\";s:12:\"consommation\";i:0;s:9:\"economies\";i:0;}i:8;a:3:{s:5:\"month\";s:3:\"Sep\";s:12:\"consommation\";i:0;s:9:\"economies\";i:0;}i:9;a:3:{s:5:\"month\";s:3:\"Oct\";s:12:\"consommation\";i:0;s:9:\"economies\";i:0;}i:10;a:3:{s:5:\"month\";s:3:\"Nov\";s:12:\"consommation\";i:0;s:9:\"economies\";i:0;}i:11;a:3:{s:5:\"month\";s:4:\"Déc\";s:12:\"consommation\";i:0;s:9:\"economies\";i:0;}}s:18:\"interventions_data\";a:12:{i:0;a:3:{s:5:\"month\";s:3:\"Jan\";s:6:\"creees\";i:0;s:8:\"resolues\";i:0;}i:1;a:3:{s:5:\"month\";s:4:\"Fév\";s:6:\"creees\";i:0;s:8:\"resolues\";i:0;}i:2;a:3:{s:5:\"month\";s:3:\"Mar\";s:6:\"creees\";i:0;s:8:\"resolues\";i:0;}i:3;a:3:{s:5:\"month\";s:3:\"Avr\";s:6:\"creees\";i:0;s:8:\"resolues\";i:0;}i:4;a:3:{s:5:\"month\";s:3:\"Mai\";s:6:\"creees\";i:0;s:8:\"resolues\";i:0;}i:5;a:3:{s:5:\"month\";s:3:\"Jun\";s:6:\"creees\";i:0;s:8:\"resolues\";i:0;}i:6;a:3:{s:5:\"month\";s:3:\"Jul\";s:6:\"creees\";i:0;s:8:\"resolues\";i:0;}i:7;a:3:{s:5:\"month\";s:4:\"Aoû\";s:6:\"creees\";i:0;s:8:\"resolues\";i:0;}i:8;a:3:{s:5:\"month\";s:3:\"Sep\";s:6:\"creees\";i:0;s:8:\"resolues\";i:0;}i:9;a:3:{s:5:\"month\";s:3:\"Oct\";s:6:\"creees\";i:4;s:8:\"resolues\";i:4;}i:10;a:3:{s:5:\"month\";s:3:\"Nov\";s:6:\"creees\";i:0;s:8:\"resolues\";i:0;}i:11;a:3:{s:5:\"month\";s:4:\"Déc\";s:6:\"creees\";i:0;s:8:\"resolues\";i:0;}}s:23:\"interventions_jour_data\";a:7:{i:0;a:2:{s:3:\"day\";s:3:\"Lun\";s:5:\"count\";i:0;}i:1;a:2:{s:3:\"day\";s:3:\"Mar\";s:5:\"count\";i:0;}i:2;a:2:{s:3:\"day\";s:3:\"Mer\";s:5:\"count\";i:2;}i:3;a:2:{s:3:\"day\";s:3:\"Jeu\";s:5:\"count\";i:2;}i:4;a:2:{s:3:\"day\";s:3:\"Ven\";s:5:\"count\";i:0;}i:5;a:2:{s:3:\"day\";s:3:\"Sam\";s:5:\"count\";i:0;}i:6;a:2:{s:3:\"day\";s:3:\"Dim\";s:5:\"count\";i:0;}}s:15:\"users_role_data\";a:2:{i:0;a:3:{s:4:\"role\";s:20:\"Gestionnaire du Parc\";s:5:\"count\";i:4;s:5:\"color\";s:7:\"#f59e0b\";}i:1;a:3:{s:4:\"role\";s:14:\"Administrateur\";s:5:\"count\";i:1;s:5:\"color\";s:7:\"#ef4444\";}}s:21:\"vehicules_marque_data\";a:5:{i:0;a:3:{s:6:\"marque\";s:6:\"TOYOYA\";s:5:\"count\";i:33;s:5:\"color\";s:7:\"#ef4444\";}i:1;a:3:{s:6:\"marque\";s:10:\"MITSUBISHI\";s:5:\"count\";i:14;s:5:\"color\";s:7:\"#f59e0b\";}i:2;a:3:{s:6:\"marque\";s:7:\"ZX AUTO\";s:5:\"count\";i:14;s:5:\"color\";s:7:\"#10b981\";}i:3;a:3:{s:6:\"marque\";s:7:\"RENAULT\";s:5:\"count\";i:12;s:5:\"color\";s:7:\"#3b82f6\";}i:4;a:3:{s:6:\"marque\";s:3:\"KIA\";s:5:\"count\";i:6;s:5:\"color\";s:7:\"#8b5cf6\";}}s:24:\"vehicules_categorie_data\";a:4:{i:0;a:3:{s:9:\"categorie\";s:11:\"PICK UP 4*4\";s:5:\"count\";i:57;s:5:\"color\";s:7:\"#ef4444\";}i:1;a:3:{s:9:\"categorie\";s:3:\"SUV\";s:5:\"count\";i:28;s:5:\"color\";s:7:\"#f59e0b\";}i:2;a:3:{s:9:\"categorie\";s:19:\"DUSTER HJD 4X4 LUXE\";s:5:\"count\";i:3;s:5:\"color\";s:7:\"#10b981\";}i:3;a:3:{s:9:\"categorie\";s:7:\"J210 GL\";s:5:\"count\";i:2;s:5:\"color\";s:7:\"#3b82f6\";}}s:24:\"documents_vehicules_data\";a:3:{i:0;a:4:{s:5:\"label\";s:16:\"Assurance Valide\";s:5:\"value\";i:5;s:5:\"color\";s:7:\"#10b981\";s:10:\"percentage\";i:71;}i:1;a:4:{s:5:\"label\";s:12:\"Expire < 30j\";s:5:\"value\";i:1;s:5:\"color\";s:7:\"#f59e0b\";s:10:\"percentage\";i:14;}i:2;a:4:{s:5:\"label\";s:8:\"Expirés\";s:5:\"value\";i:1;s:5:\"color\";s:7:\"#ef4444\";s:10:\"percentage\";i:14;}}s:25:\"documents_chauffeurs_data\";a:3:{i:0;a:4:{s:5:\"label\";s:13:\"Permis Valide\";s:5:\"value\";i:0;s:5:\"color\";s:7:\"#10b981\";s:10:\"percentage\";i:0;}i:1;a:4:{s:5:\"label\";s:12:\"Expire < 30j\";s:5:\"value\";i:0;s:5:\"color\";s:7:\"#f59e0b\";s:10:\"percentage\";i:0;}i:2;a:4:{s:5:\"label\";s:8:\"Expirés\";s:5:\"value\";i:0;s:5:\"color\";s:7:\"#ef4444\";s:10:\"percentage\";i:0;}}s:8:\"missions\";a:0:{}s:28:\"performances_chauffeurs_data\";a:3:{s:7:\"summary\";a:5:{s:14:\"total_missions\";i:0;s:8:\"total_km\";i:0;s:15:\"total_accidents\";i:0;s:15:\"total_anomalies\";i:0;s:11:\"score_moyen\";d:0;}s:10:\"classement\";a:0:{}s:9:\"evolution\";a:10:{i:0;a:2:{s:5:\"month\";s:3:\"Jan\";s:5:\"score\";i:0;}i:1;a:2:{s:5:\"month\";s:4:\"Fév\";s:5:\"score\";i:0;}i:2;a:2:{s:5:\"month\";s:3:\"Mar\";s:5:\"score\";i:0;}i:3;a:2:{s:5:\"month\";s:3:\"Avr\";s:5:\"score\";i:0;}i:4;a:2:{s:5:\"month\";s:3:\"Mai\";s:5:\"score\";i:0;}i:5;a:2:{s:5:\"month\";s:3:\"Jun\";s:5:\"score\";i:0;}i:6;a:2:{s:5:\"month\";s:3:\"Jul\";s:5:\"score\";i:0;}i:7;a:2:{s:5:\"month\";s:4:\"Aoû\";s:5:\"score\";i:0;}i:8;a:2:{s:5:\"month\";s:3:\"Sep\";s:5:\"score\";i:0;}i:9;a:2:{s:5:\"month\";s:3:\"Oct\";s:5:\"score\";i:0;}}}}', 1792748216);

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

--
-- Déchargement des données de la table `carnets_carburant`
--

INSERT INTO `carnets_carburant` (`id`, `vehicule_immatriculation`, `mission_id`, `date_plein`, `kilometrage`, `litres`, `prix_unitaire`, `station`, `chemin_recu`, `km_depuis_dernier_plein`, `consommation_calculee`, `notes`, `est_supprime`, `date_creation`, `date_suppression`) VALUES
(13, 'FM 649 AA', NULL, '2026-06-02', 748000, 20.00, 650.0000, 'Petro Gabon', NULL, NULL, 13000.00, NULL, 1, '2026-06-02 12:43:27', '2026-06-02 12:43:44');

-- --------------------------------------------------------

--
-- Structure de la table `categories_notifications`
--

CREATE TABLE `categories_notifications` (
  `id` int(10) UNSIGNED NOT NULL,
  `code` varchar(100) NOT NULL COMMENT 'alerte_critique_email, alerte_importante, info_in_app',
  `libelle` varchar(200) NOT NULL,
  `niveau_priorite` varchar(30) NOT NULL DEFAULT 'normal' COMMENT 'critique, important, a_surveiller, normal',
  `canaux` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '["email", "popup", "in_app"]',
  `roles_cibles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '["chef_parc", "chef_tf"]',
  `description` text DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `categories_notifications`
--

INSERT INTO `categories_notifications` (`id`, `code`, `libelle`, `niveau_priorite`, `canaux`, `roles_cibles`, `description`, `est_actif`, `est_supprime`, `date_creation`, `date_modification`, `date_suppression`) VALUES
(3, 'alerte_demande_intervention_externe', 'Demande d\'intervention externe', 'important', '[\"email\",\"in_app\"]', '[\"daal\"]', 'Une demande d\'intervention EXTERNE a été soumise : le DAAL doit l\'approuver ou la rejeter.', 1, 0, '2026-10-13 11:56:31', '2026-10-13 11:56:31', NULL);

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
(15, 'PICK UP 4*4', NULL, 1, '2026-05-07 09:07:14', '2026-05-07 09:07:14', NULL),
(18, 'SUV', NULL, 1, '2026-05-07 09:29:07', '2026-05-07 09:29:07', NULL),
(19, 'DUSTER HJD 4X4 LUXE', NULL, 1, '2026-08-28 06:11:12', '2026-08-28 06:11:12', NULL),
(20, 'J210 GL', NULL, 1, '2026-08-28 08:44:48', '2026-08-28 08:44:48', NULL);

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
  `elements_a_verifier` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON: liste des éléments standards à vérifier',
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
  `matricule_demande` varchar(20) DEFAULT NULL,
  `anomalie_id` bigint(20) UNSIGNED DEFAULT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `demandeur_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `demandeur_autre` varchar(150) DEFAULT NULL,
  `date_demande` datetime NOT NULL DEFAULT current_timestamp(),
  `type_maintenance` varchar(50) NOT NULL DEFAULT 'corrective' COMMENT 'corrective, preventive',
  `nature_intervention` varchar(20) NOT NULL DEFAULT 'interne' COMMENT 'interne, externe',
  `type_intervention` varchar(100) DEFAULT NULL,
  `anomalie_constatee` text DEFAULT NULL,
  `priorite` varchar(30) NOT NULL DEFAULT 'normale' COMMENT 'faible, normale, haute, urgente',
  `direction_id` int(10) UNSIGNED DEFAULT NULL,
  `affectation_id` bigint(20) UNSIGNED DEFAULT NULL,
  `direction_service_autre` varchar(150) DEFAULT NULL,
  `statut` varchar(50) NOT NULL DEFAULT 'en_attente' COMMENT 'en_attente, en_cours, validee, approuvee, traitee, rejetee',
  `commentaire` text DEFAULT NULL,
  `recommandation` text DEFAULT NULL,
  `kilometrage` bigint(20) UNSIGNED DEFAULT NULL,
  `statut_vehicule` varchar(50) DEFAULT NULL COMMENT 'immobilisation longue, immobilisation courte, indisponible, en_reparation, en_panne',
  `statut_vehicule_avant` varchar(50) DEFAULT NULL,
  `motif_rejet` text DEFAULT NULL,
  `validee_par_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `date_validation` datetime DEFAULT NULL,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `demandes_intervention`
--

INSERT INTO `demandes_intervention` (`id`, `matricule_demande`, `anomalie_id`, `vehicule_immatriculation`, `demandeur_user_id`, `demandeur_autre`, `date_demande`, `type_maintenance`, `nature_intervention`, `type_intervention`, `anomalie_constatee`, `priorite`, `direction_id`, `affectation_id`, `direction_service_autre`, `statut`, `commentaire`, `recommandation`, `kilometrage`, `statut_vehicule`, `statut_vehicule_avant`, `motif_rejet`, `validee_par_user_id`, `date_validation`, `est_supprime`, `date_creation`, `date_modification`, `date_suppression`) VALUES
(1, 'DEM-00001', NULL, 'FM 609 AA', NULL, 'MAYOMBO Jean Benoit', '2026-10-13 14:53:15', 'corrective', 'externe', 'vidange', 'Il faut refaire la vidange', 'haute', NULL, 21, NULL, 'traitee', NULL, NULL, 346790, 'en_panne', 'En réparation', NULL, 1, '2026-10-14 11:10:09', 0, '2026-10-13 13:53:15', '2026-10-22 09:47:04', '2026-10-15 10:00:18'),
(2, 'DEM-00002', NULL, 'KH-758-AA', NULL, 'dsdsdsdqdq', '2026-10-13 15:56:01', 'corrective', 'interne', 'courroie_distribution', 'sssss', 'normale', NULL, 31, NULL, 'en_attente', 'QQQQDDQDdDdDDd', 'SSS', 346000, 'En reparation', 'disponible', NULL, NULL, NULL, 0, '2026-10-13 14:56:01', '2026-10-15 15:28:04', '2026-10-14 13:31:56'),
(3, 'DEM-00003', NULL, 'JW-164-AA', NULL, 'gsgdsgsdggs', '2026-10-14 10:18:08', 'corrective', 'externe', 'transmission', 'ffffffffzsdsdscqc', 'normale', NULL, 28, NULL, 'en_cours', 'vzvsvsvsvsv', 'hdfffff', 185680, 'en_reparation', 'disponible', NULL, 1, '2026-10-14 14:31:35', 0, '2026-10-14 09:18:08', '2026-10-15 10:09:03', '2026-10-15 10:00:27'),
(4, 'DEM-00004', NULL, 'FM 612 AA', NULL, 'dfzfzfzfzf', '2026-10-14 10:39:15', 'corrective', 'externe', 'freinage', 'fzfzfzfzzfzfzfzf', 'haute', 8, NULL, NULL, 'en_attente', 'FZFZFZFZFZ', 'FZFZFZF', 138006, 'en_panne', 'immobilisation longue', NULL, 1, '2026-10-14 14:31:22', 0, '2026-10-14 09:39:15', '2026-10-15 10:15:36', '2026-10-15 10:01:57'),
(5, 'DEM-00005', NULL, 'FM 610 AA', NULL, 'ssvvsvsvs', '2026-10-14 10:50:02', 'corrective', 'externe', 'vidange', 'vsvsvsvsvsvsvs', 'haute', 15, NULL, NULL, 'en_cours', 'vwwvvvvvwvwvv', 'vsvsvsvssvvsvvv', 123000, 'En reparation', 'indisponible', NULL, 1, '2026-10-15 11:16:16', 0, '2026-10-14 09:50:02', '2026-10-15 10:16:16', '2026-10-14 11:33:00'),
(6, 'DEM-00006', NULL, 'DX-309-AA', 3, NULL, '2026-10-14 11:30:27', 'corrective', 'interne', 'moteur', 'dddddddddddd', 'urgente', 3, NULL, NULL, 'en_cours', 'FFF', 'FFF', 235000, 'En panne', 'disponible', NULL, NULL, NULL, 0, '2026-10-14 10:30:27', '2026-10-15 10:13:24', '2026-10-15 10:08:01'),
(7, 'DEM-00007', NULL, 'FM 610 AA', NULL, 'dsgsddsdssvdsvsd', '2026-10-14 12:43:41', 'corrective', 'interne', 'moteur', 'scpijfrmeposinddjsbbkd', 'haute', NULL, 4, NULL, 'en_cours', NULL, 'bldoir bcldosie  vsjjdkoirhd smlppd', 123000, 'En reparation', 'hors_service', NULL, NULL, NULL, 0, '2026-10-14 11:43:41', '2026-10-15 10:12:30', '2026-10-15 10:00:10'),
(12, 'DEM-00012', NULL, 'CX 032 AA', NULL, 'ddddddddddddddddd', '2026-10-15 13:35:08', 'corrective', 'externe', 'refroidissement', 'dbbbbbbbbbbbbbx', 'haute', NULL, 4, NULL, 'en_attente', NULL, 'ddddddddddddddddd', 0, 'En reparation', 'immobilisation longue', NULL, NULL, NULL, 0, '2026-10-15 12:35:08', '2026-10-15 12:36:35', NULL),
(13, 'DEM-00013', NULL, 'FM 609 AA', NULL, 'dddddddddddddd', '2026-10-15 13:37:37', 'corrective', 'externe', 'transmission', 'dddddddddddddddddd', 'urgente', 9, NULL, NULL, 'traitee', NULL, 'ddddddddddddddddd', 346790, 'En panne', 'en_panne', NULL, NULL, NULL, 0, '2026-10-15 12:37:37', '2026-10-22 09:47:02', NULL),
(14, 'DEM-00014', NULL, 'JM 562 AA', NULL, 'dvdvddvdvdvdvdv', '2026-10-15 13:55:13', 'corrective', 'externe', 'courroie_distribution', 'vddsdc', 'haute', NULL, NULL, 'xxxxxxxxxxxx', 'traitee', NULL, 'SBDBBDBDBDBDB', 4564690, 'En reparation', 'immobilisation courte', NULL, NULL, NULL, 0, '2026-10-15 12:55:13', '2026-10-21 12:53:48', NULL),
(15, 'DEM-00015', NULL, 'CX 032 AA', NULL, 'cccc', '2026-10-20 12:25:23', 'corrective', 'interne', 'moteur', 'xxxxxxxxxxxxxxxxxxxxx456900', 'normale', 8, NULL, NULL, 'traitee', NULL, 'SSSSSSSSSSSSSSS', 134700, 'immobilisation longue', 'En reparation', NULL, NULL, NULL, 0, '2026-10-20 11:25:23', '2026-10-21 12:43:22', NULL);

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
(5, 'Direction Commerciale', 'DC', 0, '2026-03-25 09:52:49', '2026-03-25 09:52:49', NULL),
(6, 'Direction Technique', 'DT', 0, '2026-04-08 10:09:45', '2026-05-05 12:34:12', '2026-04-08 09:10:07'),
(7, 'Direction Technique des Effectifs', 'DTEF', 0, '2026-04-09 12:23:07', '2026-05-05 12:26:19', NULL),
(8, 'Direction Générale', 'DG', 0, '2026-04-09 12:26:28', '2026-05-05 12:34:15', '2026-04-29 10:37:10'),
(9, 'Direction d\'Exploitation', 'DEX', 0, '2026-05-05 12:27:40', '2026-05-05 12:27:53', NULL),
(15, 'Direction des achats et de la Logistique', 'DAL', 0, '2026-05-05 12:37:00', '2026-05-26 09:07:44', NULL),
(16, 'TRANSPORT DE FOND', 'TF', 1, '2026-05-11 10:40:44', '2026-05-26 09:06:06', '2026-05-26 08:06:06'),
(17, 'GROUPE D\'INTERVENTION', 'GI', 1, '2026-05-11 10:41:08', '2026-05-26 09:06:33', '2026-05-26 08:06:33');

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
(23, 'FM 610 AA', 'Assurance', 'ASSURANCE FM 610 AA', 'upload/admin/document/vehicules/4ac3aac3-23d8-464c-a94a-7eebc66450cf.docx', NULL, NULL, NULL, NULL, '2026-05-18', '2026-10-31', 3, NULL, 1, '2026-05-18 12:22:36', '2026-05-18 13:15:23', '2026-05-18 13:15:23'),
(24, 'FM 610 AA', 'Assurance', 'DFSFS', 'upload/admin/document/vehicules/65ab96c9-0494-4bd2-a21a-16df6fa4758c.pdf', NULL, NULL, NULL, NULL, '2026-04-28', '2026-07-24', 1, NULL, 1, '2026-05-18 14:17:39', '2026-05-18 14:18:18', '2026-05-18 14:18:18'),
(25, 'LK 850 AA', 'Assurance', 'ASSURANCE LK 850 AA', 'upload/admin/document/vehicules/df969890-8bfd-431f-9475-9e11d125d090.pdf', 'ASSINCO', NULL, 'TOUT RISQUE', NULL, '2026-01-01', '2026-12-31', 3, NULL, 0, '2026-05-19 09:47:45', '2026-05-19 09:47:45', NULL),
(26, 'LK 850 AA', 'Carte grise', 'CARTE GRISE LK 850 AA', 'upload/admin/document/vehicules/80bac47a-c509-4621-bcc9-8167c81eb066.pdf', NULL, NULL, NULL, NULL, '2025-04-03', NULL, 3, NULL, 0, '2026-05-19 09:49:43', '2026-05-19 09:49:43', NULL),
(27, 'LK 848 AA', 'Carte grise', 'CARTE GRISE LK 848 AA', 'upload/admin/document/vehicules/bd59a557-05ad-4a5a-acc7-73607ec098f8.pdf', NULL, NULL, NULL, NULL, '2026-04-03', NULL, 3, NULL, 0, '2026-05-19 09:51:26', '2026-05-19 09:51:26', NULL),
(28, 'LK 848 AA', 'Assurance', 'ASSURANCE LK 848 AA', 'upload/admin/document/vehicules/e55433b5-80e7-42cd-88ee-fd2e20e7e9c2.pdf', 'ASSINCO', NULL, 'TOUT RISQUE', NULL, '2026-01-01', '2026-12-31', 3, NULL, 0, '2026-05-19 09:52:35', '2026-05-19 09:52:35', NULL),
(29, 'FM 610 AA', 'Carte grise', 'CRATE GRISE FM 610', 'upload/admin/document/vehicules/d5c330a5-32b1-4a6b-bbbc-ffa9cb6b6262.pdf', NULL, NULL, NULL, NULL, '2016-12-06', NULL, 3, NULL, 0, '2026-05-19 09:55:30', '2026-05-19 12:17:58', NULL),
(30, 'FM 610 AA', 'Assurance', 'ASSURANCE FM 610 AA', 'upload/admin/document/vehicules/66717211-d542-4f26-9201-f82fb59736ec.pdf', 'ASSINCO', NULL, 'TOUT RISQUE', NULL, '2026-01-01', '2026-12-31', 3, NULL, 0, '2026-05-19 09:57:28', '2026-05-19 09:57:28', NULL),
(31, 'LK 851 AA', 'Assurance', 'Assurance — LK 851 AA', 'upload/admin/document/vehicules/3d9c781b-6240-43b2-9a94-524d10b27654.pdf', 'ASSINCO', NULL, 'TOUT RISQUE', NULL, '2026-01-01', '2026-12-31', 3, NULL, 0, '2026-05-19 09:58:58', '2026-05-19 09:58:58', NULL),
(32, 'LK 851 AA', 'Carte grise', 'CARTE GRISE LK 851 AA', 'upload/admin/document/vehicules/b2f6c89c-d5d9-4025-9728-c3d7eb53c669.pdf', NULL, NULL, NULL, NULL, '2025-04-03', NULL, 3, NULL, 0, '2026-05-19 10:00:08', '2026-05-19 10:00:08', NULL),
(33, 'LK 797AA', 'Carte grise', 'CARTE GRISE LK 797 AA', 'upload/admin/document/vehicules/a39059ab-fd5b-4f43-a91a-2202a94cab98.pdf', NULL, NULL, NULL, NULL, '2025-04-03', NULL, 3, NULL, 0, '2026-05-19 10:01:44', '2026-05-19 10:01:44', NULL),
(34, 'LK 797AA', 'Assurance', 'ASSURANCE LK 797 AA', 'upload/admin/document/vehicules/c6c53e26-e52e-4628-9fac-751a1a1c704f.pdf', 'ASSINCO', NULL, 'TOUT RISQUE', NULL, '2026-01-01', '2026-12-31', 3, NULL, 0, '2026-05-19 10:02:55', '2026-05-19 10:02:55', NULL),
(35, 'ABG-325 AA', 'Assurance', 'ASSURANCE ABG-325 AA', 'upload/admin/document/vehicules/649cf51f-fbca-4786-a6fb-84bc712a26b1.pdf', '/', '/', '/', NULL, '2026-09-24', '2026-10-20', 1, NULL, 1, '2026-09-24 08:30:10', '2026-09-24 08:34:21', '2026-09-24 08:34:21'),
(36, 'AFG-650 AA', 'Assurance', 'Assurance AFG-650 AA', 'upload/admin/document/vehicules/3275dc40-a0b1-4d9d-b211-0bd95e22e143.pdf', 'ASSENCO', 'CLX037500', 'Complèt', 150000.00, '2026-09-24', '2026-10-20', 1, NULL, 0, '2026-09-24 09:40:22', '2026-09-24 09:40:22', NULL),
(37, 'ABG-325 AA', 'Assurance', 'ASSURANCE 370 AA', 'upload/admin/document/vehicules/3c04d0f4-7b88-4bde-ae8c-43b69413037d.pdf', 'ASSENCO', 'XCL 0037', 'Complète', 150000.00, '2026-09-24', '2026-10-23', 1, 'RAS', 0, '2026-09-24 09:56:07', '2026-10-15 13:03:09', NULL),
(38, 'ABG-325 AA', 'Carte grise', 'Carte Rose ABG-325 AA', 'upload/admin/document/vehicules/7c7cdd4b-e19c-40c3-b8e2-dec0e99bfff0.docx', NULL, NULL, NULL, NULL, '2026-01-27', NULL, 1, 'RAS', 0, '2026-10-20 19:08:56', '2026-10-20 19:12:30', NULL),
(39, 'ABG-325 AA', 'Instecteur', 'Instecteur ABG-325 AA', 'upload/admin/document/vehicules/0ae82553-1ba6-493b-b632-d6135d5baf77.pdf', NULL, NULL, NULL, NULL, '2026-01-29', '2026-10-25', 1, NULL, 0, '2026-10-20 19:12:01', '2026-10-20 19:12:01', NULL),
(40, 'ABG-325 AA', 'Carte grise', 'Carte rose BG-325 AA', 'upload/admin/document/vehicules/fb911682-c0d0-4a32-8b88-76d1557cf88e.pdf', NULL, NULL, NULL, NULL, '2026-10-20', NULL, 1, NULL, 0, '2026-10-20 19:13:41', '2026-10-20 19:13:41', NULL),
(41, 'ABG-325 AA', 'Instecteur', 'RAS ABG-325 AA', 'upload/admin/document/vehicules/9dd2c094-38bf-4d4f-bf00-b4a43f43ffac.pdf', NULL, NULL, NULL, NULL, '2026-10-20', NULL, 1, NULL, 1, '2026-10-20 19:14:33', '2026-10-20 19:16:38', '2026-10-20 19:16:38');

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
  `metadata_envoi` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `envois_notifications`
--

INSERT INTO `envois_notifications` (`id`, `notification_id`, `user_id`, `canal`, `statut_envoi`, `date_envoi`, `date_lecture`, `est_lu`, `erreur`, `metadata_envoi`, `date_creation`, `date_modification`) VALUES
(18, 4, 1, 'in_app', 'envoye', '2026-10-13 13:53:16', '2026-10-13 14:32:22', 1, NULL, NULL, '2026-10-13 13:53:16', '2026-10-13 14:32:22'),
(19, 4, 1, 'email', 'envoye', '2026-10-13 13:53:20', NULL, 0, NULL, NULL, '2026-10-13 13:53:20', '2026-10-13 13:53:20'),
(20, 5, 1, 'in_app', 'envoye', '2026-10-14 09:50:02', '2026-10-14 10:25:16', 1, NULL, NULL, '2026-10-14 09:50:02', '2026-10-14 10:25:16'),
(21, 5, 1, 'email', 'envoye', '2026-10-14 09:50:05', NULL, 0, NULL, NULL, '2026-10-14 09:50:05', '2026-10-14 09:50:05'),
(22, 4, 2, 'in_app', 'envoye', '2026-10-14 10:06:25', '2026-10-14 10:06:25', 1, NULL, NULL, '2026-10-14 10:06:25', '2026-10-14 10:06:25'),
(23, 5, 2, 'in_app', 'envoye', '2026-10-14 10:08:39', '2026-10-14 10:08:39', 1, NULL, NULL, '2026-10-14 10:08:39', '2026-10-14 10:08:39'),
(24, 5, 5, 'in_app', 'envoye', '2026-10-14 10:24:56', '2026-10-14 10:24:56', 1, NULL, NULL, '2026-10-14 10:24:56', '2026-10-14 10:24:56'),
(25, 4, 5, 'in_app', 'envoye', '2026-10-14 10:28:48', '2026-10-14 10:28:48', 1, NULL, NULL, '2026-10-14 10:28:48', '2026-10-14 10:28:48'),
(26, 6, 1, 'in_app', 'envoye', '2026-10-15 12:35:08', NULL, 0, NULL, NULL, '2026-10-15 12:35:08', '2026-10-15 12:35:08'),
(27, 6, 1, 'email', 'echec', NULL, NULL, 0, 'Connection could not be established with host \"mail.sgs-gabon.com:587\": stream_socket_client(): Unable to connect to mail.sgs-gabon.com:587 (Une tentative de connexion a échoué car le parti connecté n’a pas répondu convenablement au-delà d’une certaine durée ou une connexion établie a échoué car l’hôte de connexion n’a pas répondu)', NULL, '2026-10-15 12:35:15', '2026-10-15 12:35:15'),
(28, 7, 1, 'in_app', 'envoye', '2026-10-15 12:37:37', NULL, 0, NULL, NULL, '2026-10-15 12:37:37', '2026-10-15 12:37:37'),
(29, 7, 1, 'email', 'echec', NULL, NULL, 0, 'Connection could not be established with host \"mail.sgs-gabon.com:587\": stream_socket_client(): Unable to connect to mail.sgs-gabon.com:587 (Une tentative de connexion a échoué car le parti connecté n’a pas répondu convenablement au-delà d’une certaine durée ou une connexion établie a échoué car l’hôte de connexion n’a pas répondu)', NULL, '2026-10-15 12:37:42', '2026-10-15 12:37:42'),
(30, 8, 1, 'in_app', 'envoye', '2026-10-15 12:55:13', NULL, 0, NULL, NULL, '2026-10-15 12:55:13', '2026-10-15 12:55:13'),
(31, 8, 1, 'email', 'envoye', '2026-10-15 12:55:16', NULL, 0, NULL, NULL, '2026-10-15 12:55:16', '2026-10-15 12:55:16'),
(32, 6, 5, 'in_app', 'envoye', '2026-10-15 13:03:46', '2026-10-15 13:03:46', 1, NULL, NULL, '2026-10-15 13:03:46', '2026-10-15 13:03:46');

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

--
-- Déchargement des données de la table `fournisseurs`
--

INSERT INTO `fournisseurs` (`id`, `nom`, `contact`, `telephone`, `email`, `type`, `adresse`, `est_actif`, `est_supprime`, `date_creation`, `date_modification`, `date_suppression`) VALUES
(1, 'Piece EQUIPE AUTO', 'ASSOUMOU', '+2417789800', 'hueddss@gmail.com', 'pieces', 'Quartier Louis', 1, 0, '2026-10-05 09:20:46', '2026-10-05 09:20:46', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `historique_affectations`
--

CREATE TABLE `historique_affectations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL COMMENT 'Immatriculation du véhicule emprunté',
  `direction_origine_id` int(10) UNSIGNED NOT NULL COMMENT 'Direction propriétaire / de base du véhicule',
  `affectation_origine_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Affectation de base du véhicule avant l''emprunt (FK affectations.id)',
  `direction_origine_nom` varchar(150) NOT NULL COMMENT 'Nom de la direction d''origine au moment de l''enregistrement',
  `affectation_origine_nom` varchar(150) DEFAULT NULL COMMENT 'Nom de l''affectation d''origine au moment de l''enregistrement',
  `direction_emprunt_id` int(10) UNSIGNED NOT NULL COMMENT 'Direction qui emprunte le véhicule',
  `affectation_emprunt_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Nouvelle affectation pendant l''emprunt (FK affectations.id), optionnelle',
  `direction_emprunt_nom` varchar(150) NOT NULL COMMENT 'Nom de la direction d''emprunt au moment de l''enregistrement',
  `affectation_emprunt_nom` varchar(150) DEFAULT NULL COMMENT 'Nom de la nouvelle affectation pendant l''emprunt',
  `date_debut` datetime NOT NULL COMMENT 'Date et heure de début de l''emprunt',
  `date_fin_prevue` datetime DEFAULT NULL COMMENT 'Date et heure de fin prévue de l''emprunt',
  `date_fin_reelle` datetime DEFAULT NULL COMMENT 'Date et heure de fin réelle (renseignée au retour du véhicule)',
  `duree_emprunt_minutes` int(10) UNSIGNED DEFAULT NULL COMMENT 'Durée réelle de l''emprunt en minutes (calculée à la clôture)',
  `demande_par_user_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Utilisateur qui a fait la demande d''emprunt',
  `valide_par_user_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Utilisateur qui a validé / autorisé l''emprunt',
  `cloture_par_user_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Utilisateur qui a clôturé (retour du véhicule)',
  `statut` varchar(50) NOT NULL DEFAULT 'en_cours' COMMENT 'en_cours | termine | annule',
  `motif` varchar(255) DEFAULT NULL COMMENT 'Motif de l''emprunt / raison de la nouvelle affectation',
  `notes` text DEFAULT NULL COMMENT 'Observations, remarques libres',
  `km_depart` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Kilométrage du véhicule au départ de l''emprunt',
  `km_retour` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Kilométrage du véhicule au retour',
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_suppression` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `historique_affectations`
--

INSERT INTO `historique_affectations` (`id`, `vehicule_immatriculation`, `direction_origine_id`, `affectation_origine_id`, `direction_origine_nom`, `affectation_origine_nom`, `direction_emprunt_id`, `affectation_emprunt_id`, `direction_emprunt_nom`, `affectation_emprunt_nom`, `date_debut`, `date_fin_prevue`, `date_fin_reelle`, `duree_emprunt_minutes`, `demande_par_user_id`, `valide_par_user_id`, `cloture_par_user_id`, `statut`, `motif`, `notes`, `km_depart`, `km_retour`, `est_supprime`, `date_suppression`, `created_at`, `updated_at`) VALUES
(1, 'CX 032 AA', 8, NULL, 'Direction Générale', NULL, 2, NULL, 'Direction des Opérations', 'EBOMAF', '2026-06-04 00:00:00', '2026-06-18 00:00:00', '2026-06-04 09:58:36', 599, NULL, NULL, NULL, 'termine', NULL, NULL, NULL, NULL, 1, '2026-06-04 08:59:02', '2026-06-04 08:34:55', '2026-06-04 08:59:02');

-- --------------------------------------------------------

--
-- Structure de la table `historique_connexions`
--

CREATE TABLE `historique_connexions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `personal_access_token_id` bigint(20) UNSIGNED DEFAULT NULL,
  `adresse_ip` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `login_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` datetime DEFAULT NULL,
  `logout_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `historique_connexions`
--

INSERT INTO `historique_connexions` (`id`, `user_id`, `personal_access_token_id`, `adresse_ip`, `user_agent`, `login_at`, `expires_at`, `logout_at`, `created_at`, `updated_at`) VALUES
(15, 1, 318, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0', '2026-09-25 08:55:40', NULL, '2026-09-25 07:55:40', '2026-09-25 06:03:01', '2026-09-25 07:55:40'),
(16, 1, 319, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0', '2026-09-28 08:27:01', NULL, '2026-09-28 07:27:01', '2026-09-28 07:12:17', '2026-09-28 07:27:01'),
(17, 1, 320, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0', '2026-09-28 08:47:16', NULL, '2026-09-28 07:47:16', '2026-09-28 07:12:35', '2026-09-28 07:47:16'),
(18, 1, 321, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0', '2026-09-28 08:46:31', NULL, '2026-09-28 07:46:31', '2026-09-28 07:40:30', '2026-09-28 07:46:31'),
(19, 1, 322, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0', '2026-09-28 07:46:44', NULL, '2026-09-28 09:17:32', '2026-09-28 07:46:44', '2026-09-28 09:17:32'),
(20, 1, 323, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0', '2026-09-28 09:17:44', '2026-09-28 12:17:44', '2026-09-28 11:17:44', '2026-09-28 09:17:44', '2026-09-28 13:10:11'),
(21, 1, 324, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0', '2026-09-28 13:10:12', '2026-09-28 16:10:12', '2026-09-28 14:51:29', '2026-09-28 13:10:12', '2026-09-28 14:51:29'),
(22, 1, 325, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0', '2026-09-29 09:05:49', '2026-09-29 12:05:49', '2026-09-29 11:05:49', '2026-09-29 09:05:49', '2026-10-01 08:05:54'),
(23, 1, 326, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-01 08:05:55', '2026-10-01 11:05:55', '2026-10-01 10:05:55', '2026-10-01 08:05:55', '2026-10-05 07:46:19'),
(24, 1, 327, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-10-05 07:46:21', '2026-10-05 10:46:21', '2026-10-05 08:08:20', '2026-10-05 07:46:21', '2026-10-05 08:08:20'),
(25, 1, 328, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0', '2026-10-05 07:47:28', '2026-10-05 10:47:28', '2026-10-05 08:08:20', '2026-10-05 07:47:28', '2026-10-05 08:08:20'),
(26, 1, 329, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '2026-10-05 07:48:42', '2026-10-05 10:48:42', '2026-10-05 08:08:20', '2026-10-05 07:48:42', '2026-10-05 08:08:20'),
(27, 1, 330, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-05 08:37:19', '2026-10-05 11:37:19', '2026-10-05 10:37:19', '2026-10-05 08:37:19', '2026-10-06 07:34:46'),
(28, 1, 331, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-06 07:34:48', '2026-10-06 10:34:48', '2026-10-06 09:34:48', '2026-10-06 07:34:49', '2026-10-08 11:21:53'),
(29, 1, 332, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-06 07:34:54', '2026-10-06 10:34:54', '2026-10-06 09:34:54', '2026-10-06 07:34:54', '2026-10-08 11:21:53'),
(30, 1, 333, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-08 11:21:55', '2026-10-08 14:21:55', '2026-10-08 13:21:55', '2026-10-08 11:21:55', '2026-10-12 11:40:01'),
(31, 1, 334, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-12 11:40:02', '2026-10-12 14:40:02', '2026-10-12 13:40:02', '2026-10-12 11:40:02', '2026-10-13 08:36:13'),
(32, 1, 335, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-13 08:36:15', '2026-10-13 11:36:15', '2026-10-13 10:36:15', '2026-10-13 08:36:15', '2026-10-13 12:29:14'),
(33, 1, 336, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-13 12:29:14', '2026-10-13 15:29:14', '2026-10-13 14:29:14', '2026-10-13 12:29:15', '2026-10-13 14:32:49'),
(34, 1, 337, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-13 12:32:33', '2026-10-13 15:32:33', '2026-10-13 14:32:33', '2026-10-13 12:32:33', '2026-10-13 14:32:49'),
(35, 1, 338, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-13 14:32:49', '2026-10-13 17:32:49', '2026-10-13 15:16:04', '2026-10-13 14:32:49', '2026-10-13 15:16:04'),
(36, 1, 339, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 08:57:34', '2026-10-14 11:57:34', '2026-10-14 09:44:59', '2026-10-14 08:57:35', '2026-10-14 09:44:59'),
(37, 5, 340, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 09:45:07', '2026-10-14 12:45:07', '2026-10-14 11:45:07', '2026-10-14 09:45:07', '2026-10-14 11:45:43'),
(38, 1, 341, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-14 09:46:17', '2026-10-14 12:46:17', '2026-10-14 11:46:17', '2026-10-14 09:46:17', '2026-10-14 12:07:55'),
(39, 2, 342, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-14 10:04:02', '2026-10-14 13:04:02', '2026-10-14 12:04:02', '2026-10-14 10:04:02', '2026-10-14 12:07:55'),
(40, 1, 343, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 11:45:43', '2026-10-14 14:45:43', '2026-10-14 12:08:05', '2026-10-14 11:45:43', '2026-10-14 12:08:05'),
(41, 1, 344, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-14 12:07:56', '2026-10-14 15:07:56', '2026-10-14 12:08:05', '2026-10-14 12:07:56', '2026-10-14 12:08:05'),
(42, 5, 345, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-14 12:08:20', '2026-10-14 15:08:20', '2026-10-14 14:08:20', '2026-10-14 12:08:20', '2026-10-14 14:09:17'),
(43, 1, 346, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 12:08:28', '2026-10-14 15:08:28', '2026-10-14 14:08:28', '2026-10-14 12:08:28', '2026-10-14 14:09:17'),
(44, 2, 347, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-14 12:51:28', '2026-10-14 15:51:28', '2026-10-14 14:51:28', '2026-10-14 12:51:28', '2026-10-15 09:50:13'),
(45, 1, 348, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 14:09:18', '2026-10-14 17:09:18', '2026-10-14 14:11:54', '2026-10-14 14:09:18', '2026-10-14 14:11:54'),
(46, 1, 349, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-15 09:50:14', '2026-10-15 12:50:14', '2026-10-15 11:50:14', '2026-10-15 09:50:15', '2026-10-15 12:28:39'),
(47, 5, 350, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 09:59:25', '2026-10-15 12:59:25', '2026-10-15 11:59:25', '2026-10-15 09:59:25', '2026-10-15 12:28:39'),
(48, 5, 351, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 12:28:40', '2026-10-15 15:28:40', '2026-10-15 13:13:23', '2026-10-15 12:28:40', '2026-10-15 13:13:23'),
(49, 5, 352, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 12:29:58', '2026-10-15 15:29:58', '2026-10-15 14:29:58', '2026-10-15 12:29:58', '2026-10-15 15:18:38'),
(50, 1, 353, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-15 12:35:43', '2026-10-15 15:35:43', '2026-10-15 13:14:04', '2026-10-15 12:35:43', '2026-10-15 13:14:04'),
(51, 1, 354, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-15 13:14:25', '2026-10-15 16:14:25', '2026-10-15 15:14:25', '2026-10-15 13:14:25', '2026-10-15 15:18:38'),
(52, 5, 355, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 15:18:38', '2026-10-15 18:18:38', '2026-10-15 16:24:35', '2026-10-15 15:18:38', '2026-10-15 16:24:35'),
(53, 1, 356, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-15 15:54:16', '2026-10-15 18:54:16', '2026-10-15 15:54:36', '2026-10-15 15:54:16', '2026-10-15 15:54:36'),
(54, 1, 357, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-15 15:55:22', '2026-10-15 18:55:22', '2026-10-15 17:55:22', '2026-10-15 15:55:22', '2026-10-19 14:24:53'),
(55, 1, 358, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-19 14:24:54', '2026-10-19 17:24:54', '2026-10-19 16:24:54', '2026-10-19 14:24:54', '2026-10-20 08:53:36'),
(56, 1, 359, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 08:53:37', '2026-10-20 11:53:37', '2026-10-20 09:38:49', '2026-10-20 08:53:37', '2026-10-20 09:38:49'),
(57, 1, 360, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 09:53:48', '2026-10-20 12:53:48', '2026-10-20 11:53:48', '2026-10-20 09:53:48', '2026-10-20 12:41:14'),
(58, 1, 361, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 10:40:35', '2026-10-20 13:40:35', '2026-10-20 12:40:35', '2026-10-20 10:40:35', '2026-10-20 12:41:14'),
(59, 1, 362, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 12:41:15', '2026-10-20 15:41:15', '2026-10-20 14:41:15', '2026-10-20 12:41:15', '2026-10-20 18:56:47'),
(60, 1, 363, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 18:56:47', '2026-10-20 21:56:47', '2026-10-20 20:56:47', '2026-10-20 18:56:48', '2026-10-21 08:16:52'),
(61, 1, 364, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-21 08:16:53', '2026-10-21 11:16:53', '2026-10-21 10:16:53', '2026-10-21 08:16:53', '2026-10-21 10:17:57'),
(62, 1, 365, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-21 10:17:57', '2026-10-21 13:17:57', '2026-10-21 12:17:57', '2026-10-21 10:17:57', '2026-10-21 12:41:14'),
(63, 1, 366, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-21 12:41:14', '2026-10-21 15:41:14', '2026-10-21 14:41:14', '2026-10-21 12:41:14', '2026-10-22 07:21:28'),
(64, 5, 367, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-21 12:50:41', '2026-10-21 15:50:41', '2026-10-21 14:50:41', '2026-10-21 12:50:42', '2026-10-22 07:21:28'),
(65, 1, 368, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-22 07:21:29', '2026-10-22 10:21:29', '2026-10-22 09:21:29', '2026-10-22 07:21:29', '2026-10-22 09:22:02'),
(66, 5, 369, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-22 07:21:59', '2026-10-22 10:21:59', '2026-10-22 09:21:59', '2026-10-22 07:21:59', '2026-10-22 09:22:02'),
(67, 5, 370, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-22 09:22:02', '2026-10-22 12:22:02', '2026-10-22 11:22:02', '2026-10-22 09:22:02', '2026-10-22 12:45:49'),
(68, 1, 371, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-22 09:35:14', '2026-10-22 12:35:14', '2026-10-22 11:35:14', '2026-10-22 09:35:14', '2026-10-22 12:45:49'),
(69, 1, 372, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-22 12:45:49', '2026-10-22 15:45:49', '2026-10-22 13:50:50', '2026-10-22 12:45:49', '2026-10-22 13:50:50'),
(70, 5, 373, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-22 12:46:12', '2026-10-22 15:46:12', '2026-10-22 13:50:42', '2026-10-22 12:46:12', '2026-10-22 13:50:42'),
(71, 5, 374, '127.0.0.1', 'Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Edg/155.0.0.0 Mobile Safari/537.36', '2026-10-23 09:35:49', '2026-10-23 12:35:49', NULL, '2026-10-23 09:35:49', '2026-10-23 09:35:49');

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

--
-- Déchargement des données de la table `historique_kilometrage`
--

INSERT INTO `historique_kilometrage` (`id`, `vehicule_immatriculation`, `kilometrage`, `date_relevee`, `source`, `source_id`, `enregistre_par_user_id`, `notes`, `date_creation`) VALUES
(1, 'FM 609 AA', 346790, '2026-10-13', 'demande_intervention', 1, 1, 'Relevé saisi dans la demande DEM-00001', '2026-10-13 13:53:15'),
(2, 'KH-758-AA', 346000, '2026-10-13', 'demande_intervention', 2, 1, 'Relevé saisi dans la demande DEM-00002', '2026-10-13 14:56:01'),
(3, 'JW-164-AA', 185680, '2026-10-14', 'demande_intervention', 3, 1, 'Relevé saisi dans la demande DEM-00003', '2026-10-14 09:18:08'),
(4, 'FM 612 AA', 138006, '2026-10-14', 'demande_intervention', 4, 1, 'Relevé saisi dans la demande DEM-00004', '2026-10-14 09:39:15'),
(5, 'FM 610 AA', 123000, '2026-10-14', 'demande_intervention', 5, 5, 'Relevé saisi dans la demande DEM-00005', '2026-10-14 09:50:02'),
(6, 'DX-309-AA', 235000, '2026-10-14', 'demande_intervention', 6, 5, 'Relevé saisi dans la demande DEM-00006', '2026-10-14 10:30:27'),
(7, 'JM 562 AA', 4564690, '2026-10-15', 'demande_intervention', 14, 5, 'Relevé saisi dans la demande DEM-00014', '2026-10-15 12:55:13'),
(8, 'CX 032 AA', 134700, '2026-10-20', 'demande_intervention', 15, 1, 'Relevé saisi dans la demande DEM-00015', '2026-10-20 11:25:23');

-- --------------------------------------------------------

--
-- Structure de la table `inspections`
--

CREATE TABLE `inspections` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type_inspection_id` int(10) UNSIGNED NOT NULL,
  `vehicule_immatriculation` varchar(30) DEFAULT NULL,
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

INSERT INTO `inspections` (`id`, `type_inspection_id`, `vehicule_immatriculation`, `inspecteur_user_id`, `km_au_moment_inspection`, `date_inspection`, `nom_verificateurs`, `autres_constats`, `notes`, `chemin_rapport_pdf`, `est_supprime`, `date_creation`, `date_modification`, `date_suppression`) VALUES
(1, 1, 'JM 815 AA', 5, 42500, '2026-04-12 12:00:00', 'Jean dupo martin', NULL, NULL, NULL, 0, '2026-10-15 16:16:52', '2026-10-15 16:17:13', NULL);

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
(1, 1, 'JM 815 AA', 'conforme', 0, 1, NULL, '2026-10-15 16:16:52', '2026-10-15 16:17:13');

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
-- Structure de la table `inspection_elements`
--

CREATE TABLE `inspection_elements` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `inspection_vehicule_id` bigint(20) UNSIGNED NOT NULL,
  `accessoire_id` bigint(20) UNSIGNED NOT NULL,
  `statut` enum('OK','NOK','manquant','use','defectueux') NOT NULL DEFAULT 'OK',
  `valeur_relevee` varchar(100) DEFAULT NULL,
  `commentaire` text DEFAULT NULL,
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photos`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `inspection_elements`
--

INSERT INTO `inspection_elements` (`id`, `inspection_vehicule_id`, `accessoire_id`, `statut`, `valeur_relevee`, `commentaire`, `photos`, `created_at`, `updated_at`) VALUES
(6, 1, 22, 'OK', NULL, NULL, NULL, '2026-10-15 16:17:13', '2026-10-15 16:17:13'),
(7, 1, 20, 'OK', NULL, NULL, NULL, '2026-10-15 16:17:13', '2026-10-15 16:17:13'),
(8, 1, 19, 'OK', NULL, NULL, NULL, '2026-10-15 16:17:13', '2026-10-15 16:17:13'),
(9, 1, 17, 'OK', NULL, NULL, NULL, '2026-10-15 16:17:13', '2026-10-15 16:17:13'),
(10, 1, 34, 'OK', NULL, NULL, NULL, '2026-10-15 16:17:13', '2026-10-15 16:17:13');

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
(1, 1, NULL, 'Jean-Paul NDONG', '+241 77 00 00 01', NULL, 0, 5000.00, 'Mécanique générale', NULL, 1, 0, '2026-10-20 13:36:58', '2026-10-20 13:36:58', NULL),
(2, 1, NULL, 'Michel ONDO', '+241 77 00 00 02', NULL, 0, 4500.00, 'Électricité automobile', NULL, 1, 0, '2026-10-20 13:36:58', '2026-10-20 13:36:58', NULL),
(3, 2, NULL, 'Garage SGS Libreville', '+241 77 10 20 30', 'contact@garage-sgs.ga', 1, 0.00, 'Prestataire agrée SGS', NULL, 1, 0, '2026-10-20 13:36:58', '2026-10-20 13:36:58', NULL),
(4, 2, NULL, 'Darel', NULL, NULL, 1, 0.00, 'Mecanissien', NULL, 1, 0, '2026-10-21 12:53:48', '2026-10-21 12:53:48', NULL),
(5, 2, NULL, '/MOUSSAVOU BASSE / Garage de Toyta GABON', NULL, NULL, 1, 0.00, 'Mecanissien Automobile', NULL, 1, 0, '2026-10-22 09:47:02', '2026-10-22 09:47:02', NULL),
(6, 2, NULL, 'ABA DONG / Bernabé GAbon', NULL, NULL, 1, 0.00, 'Mecanissien autmobile', NULL, 1, 0, '2026-10-22 09:47:04', '2026-10-22 09:47:04', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `interventions`
--

CREATE TABLE `interventions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `demande_id` bigint(20) UNSIGNED DEFAULT NULL,
  `matricule_demande` varchar(20) DEFAULT NULL,
  `vehicule_immatriculation` varchar(30) NOT NULL,
  `intervenant_id` bigint(20) UNSIGNED NOT NULL,
  `intervenants_noms` text DEFAULT NULL,
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
  `documents` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `statut` varchar(50) NOT NULL DEFAULT 'planifiee' COMMENT 'planifiee, en_cours, terminee, annulee',
  `nature_intervention` varchar(20) NOT NULL DEFAULT 'interne' COMMENT 'interne | externe',
  `date_entree_garage` datetime DEFAULT NULL,
  `date_sortie_garage` datetime DEFAULT NULL,
  `montant_main_oeuvre_prestataire` decimal(12,2) DEFAULT NULL COMMENT 'Coût MO annoncé par le prestataire (externe)',
  `montant_pieces_prestataire` decimal(12,2) NOT NULL DEFAULT 0.00,
  `numero_devis_facture` varchar(100) DEFAULT NULL,
  `garantie_jours` smallint(5) UNSIGNED DEFAULT NULL,
  `statut_paiement` varchar(30) DEFAULT NULL COMMENT 'en_attente | paye | partiel',
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `interventions`
--

INSERT INTO `interventions` (`id`, `demande_id`, `matricule_demande`, `vehicule_immatriculation`, `intervenant_id`, `intervenants_noms`, `type_intervention`, `severite`, `date_debut`, `date_fin`, `duree_minutes`, `duree_estimee_heures`, `km_au_moment_intervention`, `diagnostic`, `resultat`, `cout_main_oeuvre`, `cout_pieces`, `documents`, `notes`, `statut`, `nature_intervention`, `date_entree_garage`, `date_sortie_garage`, `montant_main_oeuvre_prestataire`, `montant_pieces_prestataire`, `numero_devis_facture`, `garantie_jours`, `statut_paiement`, `est_supprime`, `date_creation`, `date_modification`, `date_suppression`) VALUES
(1, 15, 'DEM-00015', 'CX 032 AA', 1, 'Jean-Paul NDONG', 'moteur', 'normale', '2026-08-23 12:41:00', '2026-10-20 15:45:00', 83704, NULL, 134700, 'xxxxxxxxxxxxxxxxxxxxx456900', 'resolu', 0.00, 48900.00, NULL, 'RAS', 'terminee', 'interne', '2026-08-23 12:41:00', '2026-10-20 15:45:00', 0.00, 0.00, NULL, NULL, NULL, 0, '2026-10-21 12:43:22', '2026-10-22 08:21:41', NULL),
(2, 14, 'DEM-00014', 'JM 562 AA', 4, 'Darel', 'courroie_distribution', 'haute', '2026-08-15 12:47:00', '2026-10-07 13:49:00', 76382, NULL, 4564690, 'Vidange simple,changement des des roues,', 'resolu', 234000.00, 0.00, NULL, NULL, 'terminee', 'externe', '2026-08-15 12:47:00', '2026-10-07 13:49:00', 234000.00, 0.00, NULL, NULL, 'paye', 0, '2026-10-21 12:53:48', '2026-10-22 08:21:41', NULL),
(3, 13, 'DEM-00013', 'FM 609 AA', 5, '/MOUSSAVOU BASSE / Garage de Toyta GABON', 'transmission', 'normale', '2026-09-10 00:00:00', '2026-10-18 00:00:00', 54720, NULL, 346790, 'Changement du radiateur du disque d\'ambrouiage et la répration de la boite de transmission', 'resolu', 345000.00, 475000.00, '[{\"type\":\"facture\",\"nom\":\"etude_de_texte_forets_afrique_centrale.pdf\",\"chemin\":\"http:\\/\\/localhost\\/Fleetify_management_autoparck\\/Fleetify_management_autoparck\\/backend\\/public\\/storage\\/interventions_factures\\/MQXblGCQVYm6F9v4kHdvWzDehahry6NxSfWVx3rg.pdf\",\"date\":\"2026-10-22\"}]', 'Il faut faire une revision général tous les deux jours  de la boite de transmission', 'terminee', 'externe', '2026-09-10 00:00:00', '2026-10-18 00:00:00', 345000.00, 0.00, NULL, 90, 'en_attente', 0, '2026-10-22 09:47:02', '2026-10-22 09:47:02', NULL),
(4, 1, 'DEM-00001', 'FM 609 AA', 6, 'ABA DONG / Bernabé GAbon', 'vidange', 'normale', '2026-09-30 00:00:00', '2026-10-20 00:00:00', 28800, NULL, 346790, 'Vidanges simple du véhicule', 'resolu', 150000.00, 0.00, NULL, 'Il faut prevoir une prochaine vidange dans les deux prochaines semaines', 'terminee', 'externe', '2026-09-30 00:00:00', '2026-10-20 00:00:00', 150000.00, 0.00, NULL, NULL, 'paye', 0, '2026-10-22 09:47:04', '2026-10-22 09:47:04', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `intervention_demandes`
--

CREATE TABLE `intervention_demandes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `intervention_id` bigint(20) UNSIGNED NOT NULL,
  `demande_id` bigint(20) UNSIGNED NOT NULL,
  `matricule_demande` varchar(20) DEFAULT NULL,
  `est_principale` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'La première demande cochée lors de la création',
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `intervention_demandes`
--

INSERT INTO `intervention_demandes` (`id`, `intervention_id`, `demande_id`, `matricule_demande`, `est_principale`, `date_creation`) VALUES
(1, 1, 15, 'DEM-00015', 1, '2026-10-21 12:43:22'),
(2, 2, 14, 'DEM-00014', 1, '2026-10-21 12:53:48'),
(3, 3, 13, 'DEM-00013', 1, '2026-10-22 09:47:02'),
(4, 4, 1, 'DEM-00001', 1, '2026-10-22 09:47:04');

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

--
-- Déchargement des données de la table `jobs`
--

INSERT INTO `jobs` (`id`, `queue`, `payload`, `attempts`, `reserved_at`, `available_at`, `created_at`) VALUES
(1, 'default', '{\"uuid\":\"4567c7ee-0495-46ff-bd0d-6c9d48a7483e\",\"displayName\":\"App\\\\Mail\\\\MailDocumentVehicule\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Mail\\\\SendQueuedMailable\",\"command\":\"O:34:\\\"Illuminate\\\\Mail\\\\SendQueuedMailable\\\":17:{s:8:\\\"mailable\\\";O:29:\\\"App\\\\Mail\\\\MailDocumentVehicule\\\":8:{s:8:\\\"document\\\";a:9:{s:2:\\\"id\\\";i:9;s:12:\\\"nom_document\\\";s:5:\\\"FFFFF\\\";s:13:\\\"type_document\\\";s:11:\\\"Carte grise\\\";s:19:\\\"compagnie_assurance\\\";N;s:14:\\\"numero_contrat\\\";N;s:15:\\\"type_couverture\\\";N;s:13:\\\"montant_prime\\\";N;s:13:\\\"date_emission\\\";s:10:\\\"2026-04-01\\\";s:15:\\\"date_expiration\\\";s:10:\\\"2026-05-01\\\";}s:8:\\\"vehicule\\\";a:7:{s:15:\\\"immatriculation\\\";s:9:\\\"LBV-005-C\\\";s:6:\\\"marque\\\";s:5:\\\"Isuzu\\\";s:6:\\\"modele\\\";s:16:\\\"D-MAX Utilitaire\\\";s:9:\\\"direction\\\";s:21:\\\"Direction Commerciale\\\";s:9:\\\"categorie\\\";s:10:\\\"Utilitaire\\\";s:6:\\\"statut\\\";s:11:\\\"Immobilisé\\\";s:11:\\\"kilometrage\\\";i:112500;}s:12:\\\"destinataire\\\";a:5:{s:2:\\\"id\\\";i:1;s:3:\\\"nom\\\";s:13:\\\"Hulas Djyembi\\\";s:5:\\\"email\\\";s:27:\\\"hulas.djyembi@sgs-gabon.com\\\";s:9:\\\"role_code\\\";s:5:\\\"admin\\\";s:12:\\\"role_libelle\\\";s:15:\\\" Administrateur\\\";}s:6:\\\"statut\\\";s:14:\\\"expire_bientot\\\";s:13:\\\"joursRestants\\\";i:30;s:6:\\\"niveau\\\";s:8:\\\"seuil_30\\\";s:2:\\\"to\\\";a:1:{i:0;a:2:{s:4:\\\"name\\\";N;s:7:\\\"address\\\";s:27:\\\"hulas.djyembi@sgs-gabon.com\\\";}}s:6:\\\"mailer\\\";s:4:\\\"smtp\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"maxExceptions\\\";N;s:17:\\\"shouldBeEncrypted\\\";b:0;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;s:3:\\\"job\\\";N;}\"},\"createdAt\":1775045266,\"delay\":null}', 0, NULL, 1775045266, 1775045266),
(2, 'default', '{\"uuid\":\"746c6b14-f786-4c9a-9b52-db15d77211d6\",\"displayName\":\"App\\\\Mail\\\\MailDocumentVehicule\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Mail\\\\SendQueuedMailable\",\"command\":\"O:34:\\\"Illuminate\\\\Mail\\\\SendQueuedMailable\\\":17:{s:8:\\\"mailable\\\";O:29:\\\"App\\\\Mail\\\\MailDocumentVehicule\\\":8:{s:8:\\\"document\\\";a:9:{s:2:\\\"id\\\";i:9;s:12:\\\"nom_document\\\";s:5:\\\"FFFFF\\\";s:13:\\\"type_document\\\";s:11:\\\"Carte grise\\\";s:19:\\\"compagnie_assurance\\\";N;s:14:\\\"numero_contrat\\\";N;s:15:\\\"type_couverture\\\";N;s:13:\\\"montant_prime\\\";N;s:13:\\\"date_emission\\\";s:10:\\\"2026-04-01\\\";s:15:\\\"date_expiration\\\";s:10:\\\"2026-05-01\\\";}s:8:\\\"vehicule\\\";a:7:{s:15:\\\"immatriculation\\\";s:9:\\\"LBV-005-C\\\";s:6:\\\"marque\\\";s:5:\\\"Isuzu\\\";s:6:\\\"modele\\\";s:16:\\\"D-MAX Utilitaire\\\";s:9:\\\"direction\\\";s:21:\\\"Direction Commerciale\\\";s:9:\\\"categorie\\\";s:10:\\\"Utilitaire\\\";s:6:\\\"statut\\\";s:11:\\\"Immobilisé\\\";s:11:\\\"kilometrage\\\";i:112500;}s:12:\\\"destinataire\\\";a:5:{s:2:\\\"id\\\";i:2;s:3:\\\"nom\\\";s:12:\\\"Boris LIPOT \\\";s:5:\\\"email\\\";s:21:\\\"b.lipot@sgs-gabon.com\\\";s:9:\\\"role_code\\\";s:5:\\\"admin\\\";s:12:\\\"role_libelle\\\";s:15:\\\" Administrateur\\\";}s:6:\\\"statut\\\";s:14:\\\"expire_bientot\\\";s:13:\\\"joursRestants\\\";i:30;s:6:\\\"niveau\\\";s:8:\\\"seuil_30\\\";s:2:\\\"to\\\";a:1:{i:0;a:2:{s:4:\\\"name\\\";N;s:7:\\\"address\\\";s:21:\\\"b.lipot@sgs-gabon.com\\\";}}s:6:\\\"mailer\\\";s:4:\\\"smtp\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"maxExceptions\\\";N;s:17:\\\"shouldBeEncrypted\\\";b:0;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;s:3:\\\"job\\\";N;}\"},\"createdAt\":1775045266,\"delay\":null}', 0, NULL, 1775045266, 1775045266),
(3, 'default', '{\"uuid\":\"8a499969-aef5-46bb-892e-c7c30df03266\",\"displayName\":\"App\\\\Mail\\\\MailDocumentVehicule\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Mail\\\\SendQueuedMailable\",\"command\":\"O:34:\\\"Illuminate\\\\Mail\\\\SendQueuedMailable\\\":17:{s:8:\\\"mailable\\\";O:29:\\\"App\\\\Mail\\\\MailDocumentVehicule\\\":8:{s:8:\\\"document\\\";a:9:{s:2:\\\"id\\\";i:9;s:12:\\\"nom_document\\\";s:5:\\\"FFFFF\\\";s:13:\\\"type_document\\\";s:11:\\\"Carte grise\\\";s:19:\\\"compagnie_assurance\\\";N;s:14:\\\"numero_contrat\\\";N;s:15:\\\"type_couverture\\\";N;s:13:\\\"montant_prime\\\";N;s:13:\\\"date_emission\\\";s:10:\\\"2026-04-01\\\";s:15:\\\"date_expiration\\\";s:10:\\\"2026-05-01\\\";}s:8:\\\"vehicule\\\";a:7:{s:15:\\\"immatriculation\\\";s:9:\\\"LBV-005-C\\\";s:6:\\\"marque\\\";s:5:\\\"Isuzu\\\";s:6:\\\"modele\\\";s:16:\\\"D-MAX Utilitaire\\\";s:9:\\\"direction\\\";s:21:\\\"Direction Commerciale\\\";s:9:\\\"categorie\\\";s:10:\\\"Utilitaire\\\";s:6:\\\"statut\\\";s:11:\\\"Immobilisé\\\";s:11:\\\"kilometrage\\\";i:112500;}s:12:\\\"destinataire\\\";a:5:{s:2:\\\"id\\\";i:3;s:3:\\\"nom\\\";s:14:\\\"Patrick Mboula\\\";s:5:\\\"email\\\";s:28:\\\"patrick.mboula@sgs-gabon.com\\\";s:9:\\\"role_code\\\";s:5:\\\"admin\\\";s:12:\\\"role_libelle\\\";s:15:\\\" Administrateur\\\";}s:6:\\\"statut\\\";s:14:\\\"expire_bientot\\\";s:13:\\\"joursRestants\\\";i:30;s:6:\\\"niveau\\\";s:8:\\\"seuil_30\\\";s:2:\\\"to\\\";a:1:{i:0;a:2:{s:4:\\\"name\\\";N;s:7:\\\"address\\\";s:28:\\\"patrick.mboula@sgs-gabon.com\\\";}}s:6:\\\"mailer\\\";s:4:\\\"smtp\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"maxExceptions\\\";N;s:17:\\\"shouldBeEncrypted\\\";b:0;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;s:3:\\\"job\\\";N;}\"},\"createdAt\":1775045266,\"delay\":null}', 0, NULL, 1775045266, 1775045266),
(4, 'default', '{\"uuid\":\"1c5ee565-e89b-4aef-a322-14724c9249dd\",\"displayName\":\"App\\\\Mail\\\\MailDocumentVehicule\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Mail\\\\SendQueuedMailable\",\"command\":\"O:34:\\\"Illuminate\\\\Mail\\\\SendQueuedMailable\\\":17:{s:8:\\\"mailable\\\";O:29:\\\"App\\\\Mail\\\\MailDocumentVehicule\\\":8:{s:8:\\\"document\\\";a:9:{s:2:\\\"id\\\";i:9;s:12:\\\"nom_document\\\";s:5:\\\"FFFFF\\\";s:13:\\\"type_document\\\";s:11:\\\"Carte grise\\\";s:19:\\\"compagnie_assurance\\\";N;s:14:\\\"numero_contrat\\\";N;s:15:\\\"type_couverture\\\";N;s:13:\\\"montant_prime\\\";N;s:13:\\\"date_emission\\\";s:10:\\\"2026-04-01\\\";s:15:\\\"date_expiration\\\";s:10:\\\"2026-05-01\\\";}s:8:\\\"vehicule\\\";a:7:{s:15:\\\"immatriculation\\\";s:9:\\\"LBV-005-C\\\";s:6:\\\"marque\\\";s:5:\\\"Isuzu\\\";s:6:\\\"modele\\\";s:16:\\\"D-MAX Utilitaire\\\";s:9:\\\"direction\\\";s:21:\\\"Direction Commerciale\\\";s:9:\\\"categorie\\\";s:10:\\\"Utilitaire\\\";s:6:\\\"statut\\\";s:11:\\\"Immobilisé\\\";s:11:\\\"kilometrage\\\";i:112500;}s:12:\\\"destinataire\\\";a:5:{s:2:\\\"id\\\";i:6;s:3:\\\"nom\\\";s:14:\\\"Jean-Marc Koua\\\";s:5:\\\"email\\\";s:27:\\\"jeanmarc.koua@sgs-gabon.com\\\";s:9:\\\"role_code\\\";s:9:\\\"chef_parc\\\";s:12:\\\"role_libelle\\\";s:20:\\\"Gestionnaire du Parc\\\";}s:6:\\\"statut\\\";s:14:\\\"expire_bientot\\\";s:13:\\\"joursRestants\\\";i:30;s:6:\\\"niveau\\\";s:8:\\\"seuil_30\\\";s:2:\\\"to\\\";a:1:{i:0;a:2:{s:4:\\\"name\\\";N;s:7:\\\"address\\\";s:27:\\\"jeanmarc.koua@sgs-gabon.com\\\";}}s:6:\\\"mailer\\\";s:4:\\\"smtp\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"maxExceptions\\\";N;s:17:\\\"shouldBeEncrypted\\\";b:0;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;s:3:\\\"job\\\";N;}\"},\"createdAt\":1775045266,\"delay\":null}', 0, NULL, 1775045266, 1775045266),
(5, 'default', '{\"uuid\":\"e520d618-4839-4b61-8f00-19e6f7320efe\",\"displayName\":\"App\\\\Mail\\\\MailDocumentChauffeur\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Mail\\\\SendQueuedMailable\",\"command\":\"O:34:\\\"Illuminate\\\\Mail\\\\SendQueuedMailable\\\":17:{s:8:\\\"mailable\\\";O:30:\\\"App\\\\Mail\\\\MailDocumentChauffeur\\\":8:{s:8:\\\"document\\\";a:8:{s:13:\\\"type_document\\\";s:14:\\\"carte_identite\\\";s:12:\\\"nom_document\\\";s:4:\\\"dddd\\\";s:13:\\\"numero_permis\\\";s:6:\\\"PCu-67\\\";s:17:\\\"categories_permis\\\";s:1:\\\"B\\\";s:15:\\\"pays_delivrance\\\";s:5:\\\"Gabon\\\";s:15:\\\"date_delivrance\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-04-30 00:00:00.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:3:\\\"UTC\\\";}s:15:\\\"date_expiration\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-05-29 00:00:00.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:3:\\\"UTC\\\";}s:5:\\\"notes\\\";N;}s:9:\\\"chauffeur\\\";a:6:{s:2:\\\"id\\\";i:18;s:3:\\\"nom\\\";s:4:\\\"Test\\\";s:5:\\\"email\\\";s:18:\\\"test@sgs-gabon.com\\\";s:9:\\\"direction\\\";s:19:\\\"Direction Technique\\\";s:16:\\\"categoriesPermis\\\";s:3:\\\"—\\\";s:12:\\\"dateEmbauche\\\";N;}s:12:\\\"destinataire\\\";a:3:{s:5:\\\"email\\\";s:18:\\\"test@sgs-gabon.com\\\";s:3:\\\"nom\\\";s:4:\\\"Test\\\";s:12:\\\"role_libelle\\\";s:9:\\\"Chauffeur\\\";}s:6:\\\"statut\\\";s:14:\\\"expire_bientot\\\";s:13:\\\"joursRestants\\\";i:22;s:6:\\\"niveau\\\";s:8:\\\"seuil_30\\\";s:2:\\\"to\\\";a:1:{i:0;a:2:{s:4:\\\"name\\\";N;s:7:\\\"address\\\";s:18:\\\"test@sgs-gabon.com\\\";}}s:6:\\\"mailer\\\";s:4:\\\"smtp\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"maxExceptions\\\";N;s:17:\\\"shouldBeEncrypted\\\";b:0;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;s:3:\\\"job\\\";N;}\"},\"createdAt\":1778162009,\"delay\":null}', 0, NULL, 1778162009, 1778162009),
(6, 'default', '{\"uuid\":\"25d062c2-6827-420d-b7b4-a0f28ffbc782\",\"displayName\":\"App\\\\Mail\\\\MailDocumentChauffeur\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Mail\\\\SendQueuedMailable\",\"command\":\"O:34:\\\"Illuminate\\\\Mail\\\\SendQueuedMailable\\\":17:{s:8:\\\"mailable\\\";O:30:\\\"App\\\\Mail\\\\MailDocumentChauffeur\\\":8:{s:8:\\\"document\\\";a:8:{s:13:\\\"type_document\\\";s:14:\\\"carte_identite\\\";s:12:\\\"nom_document\\\";s:4:\\\"dddd\\\";s:13:\\\"numero_permis\\\";s:6:\\\"PCu-67\\\";s:17:\\\"categories_permis\\\";s:1:\\\"B\\\";s:15:\\\"pays_delivrance\\\";s:5:\\\"Gabon\\\";s:15:\\\"date_delivrance\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-04-30 00:00:00.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:3:\\\"UTC\\\";}s:15:\\\"date_expiration\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-05-29 00:00:00.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:3:\\\"UTC\\\";}s:5:\\\"notes\\\";N;}s:9:\\\"chauffeur\\\";a:6:{s:2:\\\"id\\\";i:18;s:3:\\\"nom\\\";s:4:\\\"Test\\\";s:5:\\\"email\\\";s:18:\\\"test@sgs-gabon.com\\\";s:9:\\\"direction\\\";s:19:\\\"Direction Technique\\\";s:16:\\\"categoriesPermis\\\";s:3:\\\"—\\\";s:12:\\\"dateEmbauche\\\";N;}s:12:\\\"destinataire\\\";a:3:{s:5:\\\"email\\\";s:27:\\\"hulas.djyembi@sgs-gabon.com\\\";s:3:\\\"nom\\\";s:13:\\\"Djyembi Hulas\\\";s:12:\\\"role_libelle\\\";s:14:\\\"Administrateur\\\";}s:6:\\\"statut\\\";s:14:\\\"expire_bientot\\\";s:13:\\\"joursRestants\\\";i:22;s:6:\\\"niveau\\\";s:8:\\\"seuil_30\\\";s:2:\\\"to\\\";a:1:{i:0;a:2:{s:4:\\\"name\\\";N;s:7:\\\"address\\\";s:27:\\\"hulas.djyembi@sgs-gabon.com\\\";}}s:6:\\\"mailer\\\";s:4:\\\"smtp\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"maxExceptions\\\";N;s:17:\\\"shouldBeEncrypted\\\";b:0;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;s:3:\\\"job\\\";N;}\"},\"createdAt\":1778162009,\"delay\":null}', 0, NULL, 1778162009, 1778162009),
(7, 'default', '{\"uuid\":\"c3b164fc-67d7-4adf-af85-c3ffa7ef7461\",\"displayName\":\"App\\\\Mail\\\\MailDocumentChauffeur\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Mail\\\\SendQueuedMailable\",\"command\":\"O:34:\\\"Illuminate\\\\Mail\\\\SendQueuedMailable\\\":17:{s:8:\\\"mailable\\\";O:30:\\\"App\\\\Mail\\\\MailDocumentChauffeur\\\":8:{s:8:\\\"document\\\";a:8:{s:13:\\\"type_document\\\";s:14:\\\"carte_identite\\\";s:12:\\\"nom_document\\\";s:4:\\\"dddd\\\";s:13:\\\"numero_permis\\\";s:6:\\\"PCu-67\\\";s:17:\\\"categories_permis\\\";s:1:\\\"B\\\";s:15:\\\"pays_delivrance\\\";s:5:\\\"Gabon\\\";s:15:\\\"date_delivrance\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-04-30 00:00:00.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:3:\\\"UTC\\\";}s:15:\\\"date_expiration\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-05-29 00:00:00.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:3:\\\"UTC\\\";}s:5:\\\"notes\\\";N;}s:9:\\\"chauffeur\\\";a:6:{s:2:\\\"id\\\";i:18;s:3:\\\"nom\\\";s:4:\\\"Test\\\";s:5:\\\"email\\\";s:18:\\\"test@sgs-gabon.com\\\";s:9:\\\"direction\\\";s:19:\\\"Direction Technique\\\";s:16:\\\"categoriesPermis\\\";s:3:\\\"—\\\";s:12:\\\"dateEmbauche\\\";N;}s:12:\\\"destinataire\\\";a:3:{s:5:\\\"email\\\";s:24:\\\"jb.mayombo@sgs-gabon.com\\\";s:3:\\\"nom\\\";s:19:\\\"MAYOMBO JEAN BENOIT\\\";s:12:\\\"role_libelle\\\";s:14:\\\"Administrateur\\\";}s:6:\\\"statut\\\";s:14:\\\"expire_bientot\\\";s:13:\\\"joursRestants\\\";i:22;s:6:\\\"niveau\\\";s:8:\\\"seuil_30\\\";s:2:\\\"to\\\";a:1:{i:0;a:2:{s:4:\\\"name\\\";N;s:7:\\\"address\\\";s:24:\\\"jb.mayombo@sgs-gabon.com\\\";}}s:6:\\\"mailer\\\";s:4:\\\"smtp\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"maxExceptions\\\";N;s:17:\\\"shouldBeEncrypted\\\";b:0;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;s:3:\\\"job\\\";N;}\"},\"createdAt\":1778162009,\"delay\":null}', 0, NULL, 1778162009, 1778162009),
(8, 'default', '{\"uuid\":\"2584a860-9bba-43b8-808a-e47730fc6a4c\",\"displayName\":\"App\\\\Mail\\\\MailDocumentChauffeur\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Mail\\\\SendQueuedMailable\",\"command\":\"O:34:\\\"Illuminate\\\\Mail\\\\SendQueuedMailable\\\":17:{s:8:\\\"mailable\\\";O:30:\\\"App\\\\Mail\\\\MailDocumentChauffeur\\\":8:{s:8:\\\"document\\\";a:8:{s:13:\\\"type_document\\\";s:14:\\\"carte_identite\\\";s:12:\\\"nom_document\\\";s:4:\\\"dddd\\\";s:13:\\\"numero_permis\\\";s:6:\\\"PCu-67\\\";s:17:\\\"categories_permis\\\";s:1:\\\"B\\\";s:15:\\\"pays_delivrance\\\";s:5:\\\"Gabon\\\";s:15:\\\"date_delivrance\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-04-30 00:00:00.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:3:\\\"UTC\\\";}s:15:\\\"date_expiration\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-05-29 00:00:00.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:3:\\\"UTC\\\";}s:5:\\\"notes\\\";N;}s:9:\\\"chauffeur\\\";a:6:{s:2:\\\"id\\\";i:18;s:3:\\\"nom\\\";s:4:\\\"Test\\\";s:5:\\\"email\\\";s:18:\\\"test@sgs-gabon.com\\\";s:9:\\\"direction\\\";s:19:\\\"Direction Technique\\\";s:16:\\\"categoriesPermis\\\";s:3:\\\"—\\\";s:12:\\\"dateEmbauche\\\";N;}s:12:\\\"destinataire\\\";a:3:{s:5:\\\"email\\\";s:30:\\\"priest.boulingui@sgs-gabon.com\\\";s:3:\\\"nom\\\";s:16:\\\"Claude BOULINGUI\\\";s:12:\\\"role_libelle\\\";s:14:\\\"Administrateur\\\";}s:6:\\\"statut\\\";s:14:\\\"expire_bientot\\\";s:13:\\\"joursRestants\\\";i:22;s:6:\\\"niveau\\\";s:8:\\\"seuil_30\\\";s:2:\\\"to\\\";a:1:{i:0;a:2:{s:4:\\\"name\\\";N;s:7:\\\"address\\\";s:30:\\\"priest.boulingui@sgs-gabon.com\\\";}}s:6:\\\"mailer\\\";s:4:\\\"smtp\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"maxExceptions\\\";N;s:17:\\\"shouldBeEncrypted\\\";b:0;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;s:3:\\\"job\\\";N;}\"},\"createdAt\":1778162010,\"delay\":null}', 0, NULL, 1778162010, 1778162010),
(9, 'default', '{\"uuid\":\"df49e1c2-e15a-419d-8175-17c1ecfda731\",\"displayName\":\"App\\\\Mail\\\\MailDocumentChauffeur\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Mail\\\\SendQueuedMailable\",\"command\":\"O:34:\\\"Illuminate\\\\Mail\\\\SendQueuedMailable\\\":17:{s:8:\\\"mailable\\\";O:30:\\\"App\\\\Mail\\\\MailDocumentChauffeur\\\":8:{s:8:\\\"document\\\";a:8:{s:13:\\\"type_document\\\";s:14:\\\"carte_identite\\\";s:12:\\\"nom_document\\\";s:4:\\\"dddd\\\";s:13:\\\"numero_permis\\\";s:6:\\\"PCu-67\\\";s:17:\\\"categories_permis\\\";s:1:\\\"B\\\";s:15:\\\"pays_delivrance\\\";s:5:\\\"Gabon\\\";s:15:\\\"date_delivrance\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-04-30 00:00:00.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:3:\\\"UTC\\\";}s:15:\\\"date_expiration\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-05-29 00:00:00.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:3:\\\"UTC\\\";}s:5:\\\"notes\\\";N;}s:9:\\\"chauffeur\\\";a:6:{s:2:\\\"id\\\";i:18;s:3:\\\"nom\\\";s:4:\\\"Test\\\";s:5:\\\"email\\\";s:18:\\\"test@sgs-gabon.com\\\";s:9:\\\"direction\\\";s:19:\\\"Direction Technique\\\";s:16:\\\"categoriesPermis\\\";s:3:\\\"—\\\";s:12:\\\"dateEmbauche\\\";N;}s:12:\\\"destinataire\\\";a:3:{s:5:\\\"email\\\";s:24:\\\"f.mekontso@sgs-gabon.com\\\";s:3:\\\"nom\\\";s:22:\\\"Falone MEKONTSO BEKALE\\\";s:12:\\\"role_libelle\\\";s:14:\\\"Administrateur\\\";}s:6:\\\"statut\\\";s:14:\\\"expire_bientot\\\";s:13:\\\"joursRestants\\\";i:22;s:6:\\\"niveau\\\";s:8:\\\"seuil_30\\\";s:2:\\\"to\\\";a:1:{i:0;a:2:{s:4:\\\"name\\\";N;s:7:\\\"address\\\";s:24:\\\"f.mekontso@sgs-gabon.com\\\";}}s:6:\\\"mailer\\\";s:4:\\\"smtp\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"maxExceptions\\\";N;s:17:\\\"shouldBeEncrypted\\\";b:0;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;s:3:\\\"job\\\";N;}\"},\"createdAt\":1778162010,\"delay\":null}', 0, NULL, 1778162010, 1778162010),
(10, 'default', '{\"uuid\":\"831bccc8-5b64-41d9-a2ee-f3573d597447\",\"displayName\":\"App\\\\Mail\\\\MailDocumentChauffeur\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Mail\\\\SendQueuedMailable\",\"command\":\"O:34:\\\"Illuminate\\\\Mail\\\\SendQueuedMailable\\\":17:{s:8:\\\"mailable\\\";O:30:\\\"App\\\\Mail\\\\MailDocumentChauffeur\\\":8:{s:8:\\\"document\\\";a:8:{s:13:\\\"type_document\\\";s:14:\\\"carte_identite\\\";s:12:\\\"nom_document\\\";s:4:\\\"dddd\\\";s:13:\\\"numero_permis\\\";s:6:\\\"PCu-67\\\";s:17:\\\"categories_permis\\\";s:1:\\\"B\\\";s:15:\\\"pays_delivrance\\\";s:5:\\\"Gabon\\\";s:15:\\\"date_delivrance\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-04-30 00:00:00.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:3:\\\"UTC\\\";}s:15:\\\"date_expiration\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-05-29 00:00:00.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:3:\\\"UTC\\\";}s:5:\\\"notes\\\";N;}s:9:\\\"chauffeur\\\";a:6:{s:2:\\\"id\\\";i:18;s:3:\\\"nom\\\";s:4:\\\"Test\\\";s:5:\\\"email\\\";s:18:\\\"test@sgs-gabon.com\\\";s:9:\\\"direction\\\";s:19:\\\"Direction Technique\\\";s:16:\\\"categoriesPermis\\\";s:3:\\\"—\\\";s:12:\\\"dateEmbauche\\\";N;}s:12:\\\"destinataire\\\";a:3:{s:5:\\\"email\\\";s:27:\\\"d.doumatsanga@sgs-gabon.com\\\";s:3:\\\"nom\\\";s:19:\\\"Delprat DOUMATSANGA\\\";s:12:\\\"role_libelle\\\";s:14:\\\"Administrateur\\\";}s:6:\\\"statut\\\";s:14:\\\"expire_bientot\\\";s:13:\\\"joursRestants\\\";i:22;s:6:\\\"niveau\\\";s:8:\\\"seuil_30\\\";s:2:\\\"to\\\";a:1:{i:0;a:2:{s:4:\\\"name\\\";N;s:7:\\\"address\\\";s:27:\\\"d.doumatsanga@sgs-gabon.com\\\";}}s:6:\\\"mailer\\\";s:4:\\\"smtp\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"maxExceptions\\\";N;s:17:\\\"shouldBeEncrypted\\\";b:0;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;s:3:\\\"job\\\";N;}\"},\"createdAt\":1778162010,\"delay\":null}', 0, NULL, 1778162010, 1778162010),
(11, 'default', '{\"uuid\":\"d687375a-a3e2-4220-89ab-ab353704d732\",\"displayName\":\"App\\\\Mail\\\\MailDocumentChauffeur\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Mail\\\\SendQueuedMailable\",\"command\":\"O:34:\\\"Illuminate\\\\Mail\\\\SendQueuedMailable\\\":17:{s:8:\\\"mailable\\\";O:30:\\\"App\\\\Mail\\\\MailDocumentChauffeur\\\":8:{s:8:\\\"document\\\";a:8:{s:13:\\\"type_document\\\";s:14:\\\"carte_identite\\\";s:12:\\\"nom_document\\\";s:4:\\\"dddd\\\";s:13:\\\"numero_permis\\\";s:6:\\\"PCu-67\\\";s:17:\\\"categories_permis\\\";s:1:\\\"C\\\";s:15:\\\"pays_delivrance\\\";s:5:\\\"Gabon\\\";s:15:\\\"date_delivrance\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-04-30 00:00:00.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:3:\\\"UTC\\\";}s:15:\\\"date_expiration\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-05-29 00:00:00.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:3:\\\"UTC\\\";}s:5:\\\"notes\\\";N;}s:9:\\\"chauffeur\\\";a:6:{s:2:\\\"id\\\";i:18;s:3:\\\"nom\\\";s:4:\\\"Test\\\";s:5:\\\"email\\\";s:18:\\\"test@sgs-gabon.com\\\";s:9:\\\"direction\\\";s:19:\\\"Direction Technique\\\";s:16:\\\"categoriesPermis\\\";s:3:\\\"—\\\";s:12:\\\"dateEmbauche\\\";N;}s:12:\\\"destinataire\\\";a:3:{s:5:\\\"email\\\";s:18:\\\"test@sgs-gabon.com\\\";s:3:\\\"nom\\\";s:4:\\\"Test\\\";s:12:\\\"role_libelle\\\";s:9:\\\"Chauffeur\\\";}s:6:\\\"statut\\\";s:14:\\\"expire_bientot\\\";s:13:\\\"joursRestants\\\";i:22;s:6:\\\"niveau\\\";s:8:\\\"seuil_30\\\";s:2:\\\"to\\\";a:1:{i:0;a:2:{s:4:\\\"name\\\";N;s:7:\\\"address\\\";s:18:\\\"test@sgs-gabon.com\\\";}}s:6:\\\"mailer\\\";s:4:\\\"smtp\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"maxExceptions\\\";N;s:17:\\\"shouldBeEncrypted\\\";b:0;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;s:3:\\\"job\\\";N;}\"},\"createdAt\":1778162046,\"delay\":null}', 0, NULL, 1778162046, 1778162046),
(12, 'default', '{\"uuid\":\"e8e3d578-eb7f-4dcc-8485-2db3810f849a\",\"displayName\":\"App\\\\Mail\\\\MailDocumentChauffeur\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Mail\\\\SendQueuedMailable\",\"command\":\"O:34:\\\"Illuminate\\\\Mail\\\\SendQueuedMailable\\\":17:{s:8:\\\"mailable\\\";O:30:\\\"App\\\\Mail\\\\MailDocumentChauffeur\\\":8:{s:8:\\\"document\\\";a:8:{s:13:\\\"type_document\\\";s:14:\\\"carte_identite\\\";s:12:\\\"nom_document\\\";s:4:\\\"dddd\\\";s:13:\\\"numero_permis\\\";s:6:\\\"PCu-67\\\";s:17:\\\"categories_permis\\\";s:1:\\\"C\\\";s:15:\\\"pays_delivrance\\\";s:5:\\\"Gabon\\\";s:15:\\\"date_delivrance\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-04-30 00:00:00.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:3:\\\"UTC\\\";}s:15:\\\"date_expiration\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-05-29 00:00:00.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:3:\\\"UTC\\\";}s:5:\\\"notes\\\";N;}s:9:\\\"chauffeur\\\";a:6:{s:2:\\\"id\\\";i:18;s:3:\\\"nom\\\";s:4:\\\"Test\\\";s:5:\\\"email\\\";s:18:\\\"test@sgs-gabon.com\\\";s:9:\\\"direction\\\";s:19:\\\"Direction Technique\\\";s:16:\\\"categoriesPermis\\\";s:3:\\\"—\\\";s:12:\\\"dateEmbauche\\\";N;}s:12:\\\"destinataire\\\";a:3:{s:5:\\\"email\\\";s:27:\\\"hulas.djyembi@sgs-gabon.com\\\";s:3:\\\"nom\\\";s:13:\\\"Djyembi Hulas\\\";s:12:\\\"role_libelle\\\";s:14:\\\"Administrateur\\\";}s:6:\\\"statut\\\";s:14:\\\"expire_bientot\\\";s:13:\\\"joursRestants\\\";i:22;s:6:\\\"niveau\\\";s:8:\\\"seuil_30\\\";s:2:\\\"to\\\";a:1:{i:0;a:2:{s:4:\\\"name\\\";N;s:7:\\\"address\\\";s:27:\\\"hulas.djyembi@sgs-gabon.com\\\";}}s:6:\\\"mailer\\\";s:4:\\\"smtp\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"maxExceptions\\\";N;s:17:\\\"shouldBeEncrypted\\\";b:0;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;s:3:\\\"job\\\";N;}\"},\"createdAt\":1778162046,\"delay\":null}', 0, NULL, 1778162046, 1778162046),
(13, 'default', '{\"uuid\":\"88decfce-32e7-417d-a174-ffd175d2404a\",\"displayName\":\"App\\\\Mail\\\\MailDocumentChauffeur\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Mail\\\\SendQueuedMailable\",\"command\":\"O:34:\\\"Illuminate\\\\Mail\\\\SendQueuedMailable\\\":17:{s:8:\\\"mailable\\\";O:30:\\\"App\\\\Mail\\\\MailDocumentChauffeur\\\":8:{s:8:\\\"document\\\";a:8:{s:13:\\\"type_document\\\";s:14:\\\"carte_identite\\\";s:12:\\\"nom_document\\\";s:4:\\\"dddd\\\";s:13:\\\"numero_permis\\\";s:6:\\\"PCu-67\\\";s:17:\\\"categories_permis\\\";s:1:\\\"C\\\";s:15:\\\"pays_delivrance\\\";s:5:\\\"Gabon\\\";s:15:\\\"date_delivrance\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-04-30 00:00:00.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:3:\\\"UTC\\\";}s:15:\\\"date_expiration\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-05-29 00:00:00.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:3:\\\"UTC\\\";}s:5:\\\"notes\\\";N;}s:9:\\\"chauffeur\\\";a:6:{s:2:\\\"id\\\";i:18;s:3:\\\"nom\\\";s:4:\\\"Test\\\";s:5:\\\"email\\\";s:18:\\\"test@sgs-gabon.com\\\";s:9:\\\"direction\\\";s:19:\\\"Direction Technique\\\";s:16:\\\"categoriesPermis\\\";s:3:\\\"—\\\";s:12:\\\"dateEmbauche\\\";N;}s:12:\\\"destinataire\\\";a:3:{s:5:\\\"email\\\";s:24:\\\"jb.mayombo@sgs-gabon.com\\\";s:3:\\\"nom\\\";s:19:\\\"MAYOMBO JEAN BENOIT\\\";s:12:\\\"role_libelle\\\";s:14:\\\"Administrateur\\\";}s:6:\\\"statut\\\";s:14:\\\"expire_bientot\\\";s:13:\\\"joursRestants\\\";i:22;s:6:\\\"niveau\\\";s:8:\\\"seuil_30\\\";s:2:\\\"to\\\";a:1:{i:0;a:2:{s:4:\\\"name\\\";N;s:7:\\\"address\\\";s:24:\\\"jb.mayombo@sgs-gabon.com\\\";}}s:6:\\\"mailer\\\";s:4:\\\"smtp\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"maxExceptions\\\";N;s:17:\\\"shouldBeEncrypted\\\";b:0;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;s:3:\\\"job\\\";N;}\"},\"createdAt\":1778162046,\"delay\":null}', 0, NULL, 1778162046, 1778162046),
(14, 'default', '{\"uuid\":\"91071366-c902-4cf9-b05b-7a571a4b192f\",\"displayName\":\"App\\\\Mail\\\\MailDocumentChauffeur\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Mail\\\\SendQueuedMailable\",\"command\":\"O:34:\\\"Illuminate\\\\Mail\\\\SendQueuedMailable\\\":17:{s:8:\\\"mailable\\\";O:30:\\\"App\\\\Mail\\\\MailDocumentChauffeur\\\":8:{s:8:\\\"document\\\";a:8:{s:13:\\\"type_document\\\";s:14:\\\"carte_identite\\\";s:12:\\\"nom_document\\\";s:4:\\\"dddd\\\";s:13:\\\"numero_permis\\\";s:6:\\\"PCu-67\\\";s:17:\\\"categories_permis\\\";s:1:\\\"C\\\";s:15:\\\"pays_delivrance\\\";s:5:\\\"Gabon\\\";s:15:\\\"date_delivrance\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-04-30 00:00:00.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:3:\\\"UTC\\\";}s:15:\\\"date_expiration\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-05-29 00:00:00.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:3:\\\"UTC\\\";}s:5:\\\"notes\\\";N;}s:9:\\\"chauffeur\\\";a:6:{s:2:\\\"id\\\";i:18;s:3:\\\"nom\\\";s:4:\\\"Test\\\";s:5:\\\"email\\\";s:18:\\\"test@sgs-gabon.com\\\";s:9:\\\"direction\\\";s:19:\\\"Direction Technique\\\";s:16:\\\"categoriesPermis\\\";s:3:\\\"—\\\";s:12:\\\"dateEmbauche\\\";N;}s:12:\\\"destinataire\\\";a:3:{s:5:\\\"email\\\";s:30:\\\"priest.boulingui@sgs-gabon.com\\\";s:3:\\\"nom\\\";s:16:\\\"Claude BOULINGUI\\\";s:12:\\\"role_libelle\\\";s:14:\\\"Administrateur\\\";}s:6:\\\"statut\\\";s:14:\\\"expire_bientot\\\";s:13:\\\"joursRestants\\\";i:22;s:6:\\\"niveau\\\";s:8:\\\"seuil_30\\\";s:2:\\\"to\\\";a:1:{i:0;a:2:{s:4:\\\"name\\\";N;s:7:\\\"address\\\";s:30:\\\"priest.boulingui@sgs-gabon.com\\\";}}s:6:\\\"mailer\\\";s:4:\\\"smtp\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"maxExceptions\\\";N;s:17:\\\"shouldBeEncrypted\\\";b:0;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;s:3:\\\"job\\\";N;}\"},\"createdAt\":1778162046,\"delay\":null}', 0, NULL, 1778162046, 1778162046),
(15, 'default', '{\"uuid\":\"8d2818f3-ea55-4efe-8863-a083ec9b6773\",\"displayName\":\"App\\\\Mail\\\\MailDocumentChauffeur\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Mail\\\\SendQueuedMailable\",\"command\":\"O:34:\\\"Illuminate\\\\Mail\\\\SendQueuedMailable\\\":17:{s:8:\\\"mailable\\\";O:30:\\\"App\\\\Mail\\\\MailDocumentChauffeur\\\":8:{s:8:\\\"document\\\";a:8:{s:13:\\\"type_document\\\";s:14:\\\"carte_identite\\\";s:12:\\\"nom_document\\\";s:4:\\\"dddd\\\";s:13:\\\"numero_permis\\\";s:6:\\\"PCu-67\\\";s:17:\\\"categories_permis\\\";s:1:\\\"C\\\";s:15:\\\"pays_delivrance\\\";s:5:\\\"Gabon\\\";s:15:\\\"date_delivrance\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-04-30 00:00:00.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:3:\\\"UTC\\\";}s:15:\\\"date_expiration\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-05-29 00:00:00.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:3:\\\"UTC\\\";}s:5:\\\"notes\\\";N;}s:9:\\\"chauffeur\\\";a:6:{s:2:\\\"id\\\";i:18;s:3:\\\"nom\\\";s:4:\\\"Test\\\";s:5:\\\"email\\\";s:18:\\\"test@sgs-gabon.com\\\";s:9:\\\"direction\\\";s:19:\\\"Direction Technique\\\";s:16:\\\"categoriesPermis\\\";s:3:\\\"—\\\";s:12:\\\"dateEmbauche\\\";N;}s:12:\\\"destinataire\\\";a:3:{s:5:\\\"email\\\";s:24:\\\"f.mekontso@sgs-gabon.com\\\";s:3:\\\"nom\\\";s:22:\\\"Falone MEKONTSO BEKALE\\\";s:12:\\\"role_libelle\\\";s:14:\\\"Administrateur\\\";}s:6:\\\"statut\\\";s:14:\\\"expire_bientot\\\";s:13:\\\"joursRestants\\\";i:22;s:6:\\\"niveau\\\";s:8:\\\"seuil_30\\\";s:2:\\\"to\\\";a:1:{i:0;a:2:{s:4:\\\"name\\\";N;s:7:\\\"address\\\";s:24:\\\"f.mekontso@sgs-gabon.com\\\";}}s:6:\\\"mailer\\\";s:4:\\\"smtp\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"maxExceptions\\\";N;s:17:\\\"shouldBeEncrypted\\\";b:0;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;s:3:\\\"job\\\";N;}\"},\"createdAt\":1778162046,\"delay\":null}', 0, NULL, 1778162046, 1778162046),
(16, 'default', '{\"uuid\":\"d90cf56d-532d-4c49-865e-e5b6cd1f69dc\",\"displayName\":\"App\\\\Mail\\\\MailDocumentChauffeur\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Mail\\\\SendQueuedMailable\",\"command\":\"O:34:\\\"Illuminate\\\\Mail\\\\SendQueuedMailable\\\":17:{s:8:\\\"mailable\\\";O:30:\\\"App\\\\Mail\\\\MailDocumentChauffeur\\\":8:{s:8:\\\"document\\\";a:8:{s:13:\\\"type_document\\\";s:14:\\\"carte_identite\\\";s:12:\\\"nom_document\\\";s:4:\\\"dddd\\\";s:13:\\\"numero_permis\\\";s:6:\\\"PCu-67\\\";s:17:\\\"categories_permis\\\";s:1:\\\"C\\\";s:15:\\\"pays_delivrance\\\";s:5:\\\"Gabon\\\";s:15:\\\"date_delivrance\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-04-30 00:00:00.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:3:\\\"UTC\\\";}s:15:\\\"date_expiration\\\";O:25:\\\"Illuminate\\\\Support\\\\Carbon\\\":3:{s:4:\\\"date\\\";s:26:\\\"2026-05-29 00:00:00.000000\\\";s:13:\\\"timezone_type\\\";i:3;s:8:\\\"timezone\\\";s:3:\\\"UTC\\\";}s:5:\\\"notes\\\";N;}s:9:\\\"chauffeur\\\";a:6:{s:2:\\\"id\\\";i:18;s:3:\\\"nom\\\";s:4:\\\"Test\\\";s:5:\\\"email\\\";s:18:\\\"test@sgs-gabon.com\\\";s:9:\\\"direction\\\";s:19:\\\"Direction Technique\\\";s:16:\\\"categoriesPermis\\\";s:3:\\\"—\\\";s:12:\\\"dateEmbauche\\\";N;}s:12:\\\"destinataire\\\";a:3:{s:5:\\\"email\\\";s:27:\\\"d.doumatsanga@sgs-gabon.com\\\";s:3:\\\"nom\\\";s:19:\\\"Delprat DOUMATSANGA\\\";s:12:\\\"role_libelle\\\";s:14:\\\"Administrateur\\\";}s:6:\\\"statut\\\";s:14:\\\"expire_bientot\\\";s:13:\\\"joursRestants\\\";i:22;s:6:\\\"niveau\\\";s:8:\\\"seuil_30\\\";s:2:\\\"to\\\";a:1:{i:0;a:2:{s:4:\\\"name\\\";N;s:7:\\\"address\\\";s:27:\\\"d.doumatsanga@sgs-gabon.com\\\";}}s:6:\\\"mailer\\\";s:4:\\\"smtp\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"maxExceptions\\\";N;s:17:\\\"shouldBeEncrypted\\\";b:0;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;s:3:\\\"job\\\";N;}\"},\"createdAt\":1778162046,\"delay\":null}', 0, NULL, 1778162046, 1778162046);

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
  `libelle` varchar(255) DEFAULT NULL,
  `nom_table` varchar(100) DEFAULT NULL,
  `id_enregistrement` varchar(100) DEFAULT NULL,
  `anciennes_valeurs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `nouvelles_valeurs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `adresse_ip` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `journaux_audit`
--

INSERT INTO `journaux_audit` (`id`, `user_id`, `action`, `libelle`, `nom_table`, `id_enregistrement`, `anciennes_valeurs`, `nouvelles_valeurs`, `adresse_ip`, `user_agent`, `date_creation`) VALUES
(1, 1, 'CREATE', NULL, 'test_manuel', '1', NULL, '{\"ok\":true}', '127.0.0.1', 'Symfony', '2026-09-23 09:00:56'),
(2, 1, 'CREATE', 'Ajout du véhicule ABG-325 AA (DAIHATSU TERIOS TERRIOS)', 'vehicules', 'ABG-325 AA', NULL, '{\"immatriculation\":\"ABG-325 AA\",\"numero_chassis\":\"49809FG98CN00X\",\"marque_id\":18,\"modele_id\":31,\"categorie_id\":20,\"annee_id\":15,\"direction_id\":3,\"ville\":\"LAMBAR\\u00c9N\\u00c9\",\"affectation_id\":9,\"affectation\":\"RECOUVREMENT\",\"affectation_nom\":\"RECOUVREMENT\",\"affectation_code\":null,\"responsable_du_vehicule\":null,\"nb_places\":5,\"kilometrage\":0,\"date_maj_km\":null,\"km_prochaine_vidange\":null,\"km_prochaine_revision\":null,\"statut\":\"disponible\",\"date_immobilisation\":null,\"consommation_moyenne\":null,\"date_acquisition\":\"2024-09-03\",\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null,\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"photo\":null,\"couleur\":\"Rouge\",\"est_actif\":1,\"marque_nom\":\"DAIHATSU TERIOS\",\"modele_nom\":\"TERRIOS\",\"type_carburant_defaut\":null,\"capacite_reservoir_defaut\":null,\"consommation_moyenne_defaut\":null,\"categorie_nom\":\"J210 GL\",\"annee_val\":\"2024\",\"direction_nom\":\"Direction Administrative et Financi\\u00e8re\",\"chauffeur_nom\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0', '2026-09-24 07:59:34'),
(3, 1, 'UPDATE', 'Changement de statut du véhicule ABG-325 AA : disponible → disponible', 'vehicules', 'ABG-325 AA', '{\"numero_chassis\":\"49809FG98CN00X\",\"marque_id\":18,\"modele_id\":31,\"categorie_id\":20,\"annee_id\":15,\"nb_places\":5,\"direction_id\":3,\"ville\":\"LAMBAR\\u00c9N\\u00c9\",\"affectation_id\":9,\"affectation\":\"RECOUVREMENT\",\"responsable_du_vehicule\":null,\"kilometrage\":0,\"date_maj_km\":null,\"km_prochaine_vidange\":null,\"km_prochaine_revision\":null,\"statut\":\"disponible\",\"consommation_moyenne\":null,\"date_acquisition\":\"2024-09-03\",\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null,\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"couleur\":\"Rouge\"}', '{\"marque_id\":18,\"modele_id\":31,\"categorie_id\":20,\"direction_id\":3,\"annee_id\":15,\"numero_chassis\":\"49809FG98CN00X\",\"nb_places\":5,\"ville\":\"LIBREVILLE\",\"affectation_id\":9,\"affectation\":\"RECOUVREMENT\",\"responsable_du_vehicule\":null,\"kilometrage\":0,\"date_maj_km\":\"2026-09-24\",\"statut\":\"disponible\",\"couleur\":\"Rouge\",\"date_acquisition\":\"2024-09-03\",\"cout_acquisition\":1445000,\"valeur_residuelle\":null,\"consommation_moyenne\":null,\"km_prochaine_vidange\":null,\"km_prochaine_revision\":null,\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0', '2026-09-24 09:12:36'),
(4, 1, 'DELETE', 'Suppression du véhicule ABG-325 AA', 'vehicules', 'ABG-325 AA', '{\"immatriculation\":\"ABG-325 AA\",\"numero_chassis\":\"49809FG98CN00X\",\"marque_id\":18,\"modele_id\":31,\"categorie_id\":20,\"annee_id\":15,\"nb_places\":5,\"direction_id\":3,\"ville\":\"LIBREVILLE\",\"affectation_id\":9,\"affectation\":\"RECOUVREMENT\",\"responsable_du_vehicule\":null,\"kilometrage\":0,\"date_maj_km\":\"2026-09-24\",\"km_prochaine_vidange\":null,\"km_prochaine_revision\":null,\"statut\":\"disponible\",\"date_immobilisation\":null,\"consommation_moyenne\":null,\"date_acquisition\":\"2024-09-03\",\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null,\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"photo\":null,\"couleur\":\"Rouge\",\"est_actif\":1,\"est_supprime\":0,\"date_creation\":\"2026-09-24 07:59:34\",\"date_modification\":\"2026-09-24 09:12:36\",\"date_suppression\":null}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0', '2026-09-24 09:14:27'),
(5, 1, 'CREATE', 'Ajout du document \"ASSURANCE ABG-325 AA\" (Assurance) pour le véhicule ABG-325 AA', 'documents_vehicules', '35', NULL, '{\"id\":35,\"vehicule_immatriculation\":\"ABG-325 AA\",\"type_document\":\"Assurance\",\"nom_document\":\"ASSURANCE ABG-325 AA\",\"chemin_fichier\":\"upload\\/admin\\/document\\/vehicules\\/649cf51f-fbca-4786-a6fb-84bc712a26b1.pdf\",\"compagnie_assurance\":\"\\/\",\"numero_contrat\":\"\\/\",\"type_couverture\":\"\\/\",\"montant_prime\":null,\"date_emission\":\"2026-09-24\",\"date_expiration\":\"2026-10-23\",\"telecharge_par_user_id\":1,\"notes\":null,\"est_supprime\":0,\"date_creation\":\"2026-09-24 09:30:10\",\"date_modification\":\"2026-09-24 09:30:10\",\"date_suppression\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0', '2026-09-24 09:30:10'),
(6, 1, 'UPDATE', 'Modification du document \"ASSURANCE ABG-325 AA\" du véhicule ABG-325 AA', 'documents_vehicules', '35', '{\"id\":35,\"vehicule_immatriculation\":\"ABG-325 AA\",\"type_document\":\"Assurance\",\"nom_document\":\"ASSURANCE ABG-325 AA\",\"chemin_fichier\":\"upload\\/admin\\/document\\/vehicules\\/649cf51f-fbca-4786-a6fb-84bc712a26b1.pdf\",\"compagnie_assurance\":\"\\/\",\"numero_contrat\":\"\\/\",\"type_couverture\":\"\\/\",\"montant_prime\":null,\"date_emission\":\"2026-09-24\",\"date_expiration\":\"2026-10-23\",\"telecharge_par_user_id\":1,\"notes\":null,\"est_supprime\":0,\"date_creation\":\"2026-09-24 09:30:10\",\"date_modification\":\"2026-09-24 09:30:10\",\"date_suppression\":null}', '{\"type_document\":\"Assurance\",\"nom_document\":\"ASSURANCE ABG-325 AA\",\"compagnie_assurance\":\"\\/\",\"numero_contrat\":\"\\/\",\"type_couverture\":\"\\/\",\"montant_prime\":null,\"date_emission\":\"2026-09-24\",\"date_expiration\":\"2026-10-20\",\"notes\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0', '2026-09-24 09:32:51'),
(7, 1, 'DELETE', 'Suppression du document \"ASSURANCE ABG-325 AA\" du véhicule ABG-325 AA', 'documents_vehicules', '35', '{\"id\":35,\"vehicule_immatriculation\":\"ABG-325 AA\",\"type_document\":\"Assurance\",\"nom_document\":\"ASSURANCE ABG-325 AA\",\"chemin_fichier\":\"upload\\/admin\\/document\\/vehicules\\/649cf51f-fbca-4786-a6fb-84bc712a26b1.pdf\",\"compagnie_assurance\":\"\\/\",\"numero_contrat\":\"\\/\",\"type_couverture\":\"\\/\",\"montant_prime\":null,\"date_emission\":\"2026-09-24\",\"date_expiration\":\"2026-10-20\",\"telecharge_par_user_id\":1,\"notes\":null,\"est_supprime\":0,\"date_creation\":\"2026-09-24 09:30:10\",\"date_modification\":\"2026-09-24 09:32:51\",\"date_suppression\":null}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0', '2026-09-24 09:34:21'),
(8, 1, 'CREATE', 'Ajout du document \"Assurance AFG-650 AA\" (Assurance) pour le véhicule AFG-650 AA', 'documents_vehicules', '36', NULL, '{\"id\":36,\"vehicule_immatriculation\":\"AFG-650 AA\",\"type_document\":\"Assurance\",\"nom_document\":\"Assurance AFG-650 AA\",\"chemin_fichier\":\"upload\\/admin\\/document\\/vehicules\\/3275dc40-a0b1-4d9d-b211-0bd95e22e143.pdf\",\"compagnie_assurance\":\"ASSENCO\",\"numero_contrat\":\"CLX037500\",\"type_couverture\":\"Compl\\u00e8t\",\"montant_prime\":\"150000.00\",\"date_emission\":\"2026-09-24\",\"date_expiration\":\"2026-10-20\",\"telecharge_par_user_id\":1,\"notes\":null,\"est_supprime\":0,\"date_creation\":\"2026-09-24 10:40:22\",\"date_modification\":\"2026-09-24 10:40:22\",\"date_suppression\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0', '2026-09-24 10:40:22'),
(9, 1, 'CREATE', 'Ajout du document \"ASSURANCE 370 AA\" (Assurance) pour le véhicule ABG-325 AA', 'documents_vehicules', '37', NULL, '{\"id\":37,\"vehicule_immatriculation\":\"ABG-325 AA\",\"type_document\":\"Assurance\",\"nom_document\":\"ASSURANCE 370 AA\",\"chemin_fichier\":\"upload\\/admin\\/document\\/vehicules\\/8c1b1968-d4b5-4773-872f-dd5713e5ecbf.pdf\",\"compagnie_assurance\":\"ASSENCO\",\"numero_contrat\":\"XCL 0037\",\"type_couverture\":\"Compl\\u00e8te\",\"montant_prime\":\"150000.00\",\"date_emission\":\"2026-09-24\",\"date_expiration\":\"2026-10-23\",\"telecharge_par_user_id\":1,\"notes\":null,\"est_supprime\":0,\"date_creation\":\"2026-09-24 10:56:07\",\"date_modification\":\"2026-09-24 10:56:07\",\"date_suppression\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0', '2026-09-24 10:56:07'),
(10, 1, 'READ', NULL, 'journaux_audit', NULL, NULL, '{\"export\":true,\"filtres\":{\"periode\":\"7j\",\"recherche\":null},\"nb_lignes\":9}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0', '2026-09-25 08:50:42'),
(11, 1, 'READ', NULL, 'journaux_audit', NULL, NULL, '{\"export\":true,\"filtres\":{\"periode\":\"7j\",\"recherche\":null},\"nb_lignes\":10}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0', '2026-09-28 14:06:28'),
(12, 1, 'READ', NULL, 'journaux_audit', NULL, NULL, '{\"export\":true,\"filtres\":{\"periode\":\"7j\",\"recherche\":null},\"nb_lignes\":11}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0', '2026-09-28 14:06:29'),
(13, 1, 'CREATE', 'Ajout du fournisseur « Piece EQUIPE AUTO »', 'fournisseurs', '1', NULL, '{\"id\":1,\"nom\":\"Piece EQUIPE AUTO\",\"contact\":\"ASSOUMOU\",\"telephone\":\"+2417789800\",\"email\":\"hueddss@gmail.com\",\"type\":\"pieces\",\"adresse\":\"Quartier Louis\",\"est_actif\":1}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-05 09:20:46'),
(14, 1, 'CREATE', 'Ajout de l\'outil « gegegge »', 'outils', '1', NULL, '{\"id\":1,\"nom\":\"gegegge\",\"type\":\"piecese\",\"categorie\":\"Pneumatique\",\"etat\":\"OK\",\"emplacement\":\"Armoire A2\",\"date_dernier_controle\":\"2026-10-05\",\"notes\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-05 09:22:35'),
(15, 1, 'CREATE', 'Ajout de la pièce « Filtre à huils » (stock initial : 40 litre)', 'pieces_detachees', '1', NULL, '{\"id\":1,\"sku\":\"FLT-012\",\"nom\":\"Filtre \\u00e0 huils\",\"type_piece\":\"Filtre\",\"description\":\"ddsdds\",\"quantite_stock\":\"40.00\",\"seuil_alerte\":\"5.00\",\"unite\":\"litre\",\"prix_unitaire\":\"500.00\",\"fournisseur_id\":1,\"emplacement\":\"Magazin\",\"est_actif\":1}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-05 09:24:13'),
(16, 1, 'UPDATE', 'Réapprovisionnement de « Filtre à huils » : +30 litre', 'pieces_detachees', '1', '{\"quantite_stock\":\"40.00\"}', '{\"quantite_stock\":\"70.00\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-05 09:31:27'),
(20, 1, 'UPDATE', 'Modification du rôle \"Daal\"', 'roles', '7', '{\"code\":\"daal\",\"libelle\":\"Daal\",\"description\":null}', '{\"code\":\"daal\",\"libelle\":\"Daal\",\"description\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-13 10:04:55'),
(21, 1, 'UPDATE', 'Changement de rôle de DJYEMBI Hulas Brily : Administrateur → Daal', 'utilisateurs', '1', '{\"nom\":\"DJYEMBI Hulas Brily\",\"email\":\"hulas.djyembi@sgs-gabon.com\",\"role\":\"Administrateur\",\"direction\":\"Direction de Syst\\u00e8me d\'information\"}', '{\"nom\":\"DJYEMBI Hulas Brily\",\"email\":\"hulas.djyembi@sgs-gabon.com\",\"role\":\"Daal\",\"direction\":\"Direction de Syst\\u00e8me d\'information\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-13 10:05:19'),
(22, 1, 'UPDATE', 'Changement de rôle de DJYEMBI Hulas Brily : Administrateur → Daal', 'utilisateurs', '1', '{\"nom\":\"DJYEMBI Hulas Brily\",\"email\":\"hulas.djyembi@sgs-gabon.com\",\"role\":\"Administrateur\",\"direction\":\"Direction de Syst\\u00e8me d\'information\"}', '{\"nom\":\"DJYEMBI Hulas Brily\",\"email\":\"hulas.djyembi@sgs-gabon.com\",\"role\":\"Daal\",\"direction\":\"Direction de Syst\\u00e8me d\'information\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-13 13:50:01'),
(23, 1, 'UPDATE', 'Mise à jour du kilométrage du véhicule FM 609 AA : 0 km → 346790 km (demande DEM-00001)', 'vehicules', 'FM 609 AA', '{\"kilometrage\":0}', '{\"kilometrage\":346790}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-13 13:53:15'),
(24, 1, 'UPDATE', 'Changement de statut du véhicule FM 609 AA : immobilisation longue → en_panne (demande DEM-00001)', 'vehicules', 'FM 609 AA', '{\"statut\":\"immobilisation longue\"}', '{\"statut\":\"en_panne\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-13 13:53:15'),
(25, 1, 'CREATE', 'Création de la demande d\'intervention DEM-00001 (externe) pour le véhicule FM 609 AA', 'demandes_intervention', '1', NULL, '{\"reference\":\"DEM-00001\",\"vehicule\":\"FM 609 AA\",\"demandeur\":\"MAYOMBO Jean Benoit\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"vidange\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"Il faut refaire la vidange\",\"direction_service\":\"DEX - ZONE 1\",\"recommandation\":null,\"kilometrage\":346790,\"statut_vehicule\":\"en_panne\",\"commentaire\":null,\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-13 13:53:16'),
(26, 1, 'UPDATE', 'Restauration du statut du véhicule FM 609 AA : en_panne → immobilisation longue (demande DEM-00001)', 'vehicules', 'FM 609 AA', '{\"statut\":\"en_panne\"}', '{\"statut\":\"immobilisation longue\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-13 13:56:38'),
(27, 1, 'UPDATE', 'Changement de statut du véhicule FM 609 AA : immobilisation longue → en_reparation (demande DEM-00001)', 'vehicules', 'FM 609 AA', '{\"statut\":\"immobilisation longue\"}', '{\"statut\":\"en_reparation\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-13 13:56:38'),
(28, 1, 'UPDATE', 'Modification de la demande d\'intervention DEM-00001', 'demandes_intervention', '1', '{\"reference\":\"DEM-00001\",\"vehicule\":\"FM 609 AA\",\"demandeur\":\"MAYOMBO Jean Benoit\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"vidange\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"Il faut refaire la vidange\",\"direction_service\":\"DEX - ZONE 1\",\"recommandation\":null,\"kilometrage\":346790,\"statut_vehicule\":\"en_panne\",\"commentaire\":null,\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '{\"reference\":\"DEM-00001\",\"vehicule\":\"FM 609 AA\",\"demandeur\":\"MAYOMBO Jean Benoit\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"vidange\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"Il faut refaire la vidange\",\"direction_service\":\"DEX - ZONE 1\",\"recommandation\":null,\"kilometrage\":346790,\"statut_vehicule\":\"en_reparation\",\"commentaire\":null,\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-13 13:56:38'),
(29, 1, 'UPDATE', 'Changement de statut du véhicule FM 609 AA : En réparation → en_panne (demande DEM-00001)', 'vehicules', 'FM 609 AA', '{\"statut\":\"En r\\u00e9paration\"}', '{\"statut\":\"en_panne\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-13 14:09:43'),
(30, 1, 'UPDATE', 'Modification de la demande d\'intervention DEM-00001', 'demandes_intervention', '1', '{\"reference\":\"DEM-00001\",\"vehicule\":\"FM 609 AA\",\"demandeur\":\"MAYOMBO Jean Benoit\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"vidange\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"Il faut refaire la vidange\",\"direction_service\":\"DEX - ZONE 1\",\"recommandation\":null,\"kilometrage\":346790,\"statut_vehicule\":\"en_reparation\",\"commentaire\":null,\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '{\"reference\":\"DEM-00001\",\"vehicule\":\"FM 609 AA\",\"demandeur\":\"MAYOMBO Jean Benoit\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"vidange\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"Il faut refaire la vidange\",\"direction_service\":\"DEX - ZONE 1\",\"recommandation\":null,\"kilometrage\":346790,\"statut_vehicule\":\"en_panne\",\"commentaire\":null,\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-13 14:09:43'),
(31, 1, 'UPDATE', 'Mise à jour du kilométrage du véhicule KH-758-AA : 0 km → 346000 km (demande DEM-00002)', 'vehicules', 'KH-758-AA', '{\"kilometrage\":0}', '{\"kilometrage\":346000}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-13 14:56:01'),
(32, 1, 'UPDATE', 'Changement de statut du véhicule KH-758-AA : disponible → en_panne (demande DEM-00002)', 'vehicules', 'KH-758-AA', '{\"statut\":\"disponible\"}', '{\"statut\":\"en_panne\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-13 14:56:01'),
(33, 1, 'CREATE', 'Création de la demande d\'intervention DEM-00002 (interne) pour le véhicule KH-758-AA', 'demandes_intervention', '2', NULL, '{\"reference\":\"DEM-00002\",\"vehicule\":\"KH-758-AA\",\"demandeur\":\"dsdsdsdqdq\",\"nature_intervention\":\"interne\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"courroie_distribution\",\"priorite\":\"normale\",\"anomalie\":null,\"anomalie_constatee\":\"sssss\",\"direction_service\":\"BRIGADE CANINE\",\"recommandation\":\"SSS\",\"kilometrage\":346000,\"statut_vehicule\":\"en_panne\",\"commentaire\":\"QQQQDDQDdDdDDd\",\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-13 14:56:01'),
(34, 1, 'UPDATE', 'Mise à jour du kilométrage du véhicule JW-164-AA : 0 km → 185680 km (demande DEM-00003)', 'vehicules', 'JW-164-AA', '{\"kilometrage\":0}', '{\"kilometrage\":185680}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 09:18:08'),
(35, 1, 'UPDATE', 'Changement de statut du véhicule JW-164-AA : disponible → en_panne (demande DEM-00003)', 'vehicules', 'JW-164-AA', '{\"statut\":\"disponible\"}', '{\"statut\":\"en_panne\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 09:18:08'),
(36, 1, 'CREATE', 'Création de la demande d\'intervention DEM-00003 (externe) pour le véhicule JW-164-AA', 'demandes_intervention', '3', NULL, '{\"reference\":\"DEM-00003\",\"vehicule\":\"JW-164-AA\",\"demandeur\":\"gsgdsgsdggs\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"transmission\",\"priorite\":\"normale\",\"anomalie\":null,\"anomalie_constatee\":\"ffffffffzsdsdscqc\",\"direction_service\":\"OYEM TF\",\"recommandation\":\"hdfffff\",\"kilometrage\":185680,\"statut_vehicule\":\"en_panne\",\"commentaire\":\"vzvsvsvsvsv\",\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 09:18:08'),
(37, 1, 'UPDATE', 'Restauration du statut du véhicule FM 609 AA : en_panne → En réparation (demande DEM-00001)', 'vehicules', 'FM 609 AA', '{\"statut\":\"en_panne\"}', '{\"statut\":\"En r\\u00e9paration\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 09:25:42'),
(38, 1, 'UPDATE', 'Changement de statut du véhicule FM 609 AA : En réparation → en_panne (demande DEM-00001)', 'vehicules', 'FM 609 AA', '{\"statut\":\"En r\\u00e9paration\"}', '{\"statut\":\"en_panne\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 09:25:42'),
(39, 1, 'UPDATE', 'Modification de la demande d\'intervention DEM-00001', 'demandes_intervention', '1', '{\"reference\":\"DEM-00001\",\"vehicule\":\"FM 609 AA\",\"demandeur\":\"MAYOMBO Jean Benoit\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"vidange\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"Il faut refaire la vidange\",\"direction_service\":\"DEX - ZONE 1\",\"recommandation\":null,\"kilometrage\":346790,\"statut_vehicule\":\"en_panne\",\"commentaire\":null,\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '{\"reference\":\"DEM-00001\",\"vehicule\":\"FM 609 AA\",\"demandeur\":\"MAYOMBO Jean Benoit\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"vidange\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"Il faut refaire la vidange\",\"direction_service\":\"DEX - ZONE 1\",\"recommandation\":null,\"kilometrage\":346790,\"statut_vehicule\":\"en_panne\",\"commentaire\":null,\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 09:25:42'),
(40, 1, 'UPDATE', 'Mise à jour du kilométrage du véhicule FM 612 AA : 0 km → 138006 km (demande DEM-00004)', 'vehicules', 'FM 612 AA', '{\"kilometrage\":0}', '{\"kilometrage\":138006}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 09:39:15'),
(41, 1, 'UPDATE', 'Changement de statut du véhicule FM 612 AA : immobilisation longue → en_panne (demande DEM-00004)', 'vehicules', 'FM 612 AA', '{\"statut\":\"immobilisation longue\"}', '{\"statut\":\"en_panne\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 09:39:15'),
(42, 1, 'CREATE', 'Création de la demande d\'intervention DEM-00004 (externe) pour le véhicule FM 612 AA', 'demandes_intervention', '4', NULL, '{\"reference\":\"DEM-00004\",\"vehicule\":\"FM 612 AA\",\"demandeur\":\"dfzfzfzfzf\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"freinage\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"fzfzfzfzzfzfzfzf\",\"direction_service\":\"Direction G\\u00e9n\\u00e9rale\",\"recommandation\":\"FZFZFZF\",\"kilometrage\":138006,\"statut_vehicule\":\"en_panne\",\"commentaire\":\"FZFZFZFZFZ\",\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 09:39:15'),
(43, 5, 'UPDATE', 'Mise à jour du kilométrage du véhicule FM 610 AA : 0 km → 123000 km (demande DEM-00005)', 'vehicules', 'FM 610 AA', '{\"kilometrage\":0}', '{\"kilometrage\":123000}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 09:50:02'),
(44, 5, 'UPDATE', 'Changement de statut du véhicule FM 610 AA : immobilisation longue → en_panne (demande DEM-00005)', 'vehicules', 'FM 610 AA', '{\"statut\":\"immobilisation longue\"}', '{\"statut\":\"en_panne\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 09:50:02'),
(45, 5, 'CREATE', 'Création de la demande d\'intervention DEM-00005 (externe) pour le véhicule FM 610 AA', 'demandes_intervention', '5', NULL, '{\"reference\":\"DEM-00005\",\"vehicule\":\"FM 610 AA\",\"demandeur\":\"ssvvsvsvs\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"vidange\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"vsvsvsvsvsvsvs\",\"direction_service\":\"Direction des achats et de la Logistique\",\"recommandation\":\"vsvsvsvssvvsvvv\",\"kilometrage\":123000,\"statut_vehicule\":\"en_panne\",\"commentaire\":\"vwwvvvvvwvwvv\",\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 09:50:02'),
(46, 1, 'UPDATE', 'Validation de la demande DEM-00001 (externe) — en cours de traitement', 'demandes_intervention', '1', '{\"reference\":\"DEM-00001\",\"vehicule\":\"FM 609 AA\",\"demandeur\":\"MAYOMBO Jean Benoit\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"vidange\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"Il faut refaire la vidange\",\"direction_service\":\"DEX - ZONE 1\",\"recommandation\":null,\"kilometrage\":346790,\"statut_vehicule\":\"en_panne\",\"commentaire\":null,\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '{\"reference\":\"DEM-00001\",\"vehicule\":\"FM 609 AA\",\"demandeur\":\"MAYOMBO Jean Benoit\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"vidange\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"Il faut refaire la vidange\",\"direction_service\":\"DEX - ZONE 1\",\"recommandation\":null,\"kilometrage\":346790,\"statut_vehicule\":\"en_panne\",\"commentaire\":null,\"statut\":\"en_cours\",\"motif_rejet\":null,\"validee_par\":\"DJYEMBI Hulas Brily\",\"date_validation\":\"2026-10-14 11:10:09\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-14 10:10:09'),
(47, 5, 'UPDATE', 'Mise à jour du kilométrage du véhicule DX-309-AA : 0 km → 235000 km (demande DEM-00006)', 'vehicules', 'DX-309-AA', '{\"kilometrage\":0}', '{\"kilometrage\":235000}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 10:30:27'),
(48, 5, 'UPDATE', 'Changement de statut du véhicule DX-309-AA : disponible → en_panne (demande DEM-00006)', 'vehicules', 'DX-309-AA', '{\"statut\":\"disponible\"}', '{\"statut\":\"en_panne\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 10:30:27'),
(49, 5, 'CREATE', 'Création de la demande d\'intervention DEM-00006 (interne) pour le véhicule DX-309-AA — en cours de traitement directement (aucune validation requise)', 'demandes_intervention', '6', NULL, '{\"reference\":\"DEM-00006\",\"vehicule\":\"DX-309-AA\",\"demandeur\":\"Falone MEKONTSO BEKALE\",\"nature_intervention\":\"interne\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"moteur\",\"priorite\":\"urgente\",\"anomalie\":null,\"anomalie_constatee\":\"dddddddddddd\",\"direction_service\":\"Direction Administrative et Financi\\u00e8re\",\"recommandation\":\"FFF\",\"kilometrage\":235000,\"statut_vehicule\":\"en_panne\",\"commentaire\":\"FFF\",\"statut\":\"en_cours\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 10:30:27'),
(50, 5, 'UPDATE', 'Restauration du statut du véhicule FM 610 AA : en_panne → immobilisation longue (demande DEM-00005)', 'vehicules', 'FM 610 AA', '{\"statut\":\"en_panne\"}', '{\"statut\":\"immobilisation longue\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 11:33:00'),
(51, 5, 'DELETE', 'Suppression de la demande d\'intervention DEM-00005', 'demandes_intervention', '5', '{\"reference\":\"DEM-00005\",\"vehicule\":\"FM 610 AA\",\"demandeur\":\"ssvvsvsvs\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"vidange\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"vsvsvsvsvsvsvs\",\"direction_service\":\"Direction des achats et de la Logistique\",\"recommandation\":\"vsvsvsvssvvsvvv\",\"kilometrage\":123000,\"statut_vehicule\":\"en_panne\",\"commentaire\":\"vwwvvvvvwvwvv\",\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 11:33:00'),
(52, 5, 'UPDATE', 'Changement de statut du véhicule FM 610 AA : immobilisation longue → indisponible (demande DEM-00007)', 'vehicules', 'FM 610 AA', '{\"statut\":\"immobilisation longue\"}', '{\"statut\":\"indisponible\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 11:43:41'),
(53, 5, 'CREATE', 'Création de la demande d\'intervention DEM-00007 (interne) pour le véhicule FM 610 AA — en cours de traitement directement (aucune validation requise)', 'demandes_intervention', '7', NULL, '{\"reference\":\"DEM-00007\",\"vehicule\":\"FM 610 AA\",\"demandeur\":\"daaaaaaaaaaaaa\",\"nature_intervention\":\"interne\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"moteur\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"daaddada\",\"direction_service\":\"dadaaadad\",\"recommandation\":\"aaaaaaaaaaa\",\"kilometrage\":123000,\"statut_vehicule\":\"indisponible\",\"commentaire\":null,\"statut\":\"en_cours\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 11:43:41'),
(54, 5, 'UPDATE', 'Restauration du statut du véhicule JW-164-AA : en_panne → disponible (demande DEM-00003)', 'vehicules', 'JW-164-AA', '{\"statut\":\"en_panne\"}', '{\"statut\":\"disponible\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-14 12:09:55'),
(55, 5, 'UPDATE', 'Changement de statut du véhicule JW-164-AA : disponible → en_reparation (demande DEM-00003)', 'vehicules', 'JW-164-AA', '{\"statut\":\"disponible\"}', '{\"statut\":\"en_reparation\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-14 12:09:55'),
(56, 5, 'UPDATE', 'Modification de la demande d\'intervention DEM-00003', 'demandes_intervention', '3', '{\"reference\":\"DEM-00003\",\"vehicule\":\"JW-164-AA\",\"demandeur\":\"gsgdsgsdggs\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"transmission\",\"priorite\":\"normale\",\"anomalie\":null,\"anomalie_constatee\":\"ffffffffzsdsdscqc\",\"direction_service\":\"OYEM TF\",\"recommandation\":\"hdfffff\",\"kilometrage\":185680,\"statut_vehicule\":\"en_panne\",\"commentaire\":\"vzvsvsvsvsv\",\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '{\"reference\":\"DEM-00003\",\"vehicule\":\"JW-164-AA\",\"demandeur\":\"gsgdsgsdggs\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"transmission\",\"priorite\":\"normale\",\"anomalie\":null,\"anomalie_constatee\":\"ffffffffzsdsdscqc\",\"direction_service\":\"OYEM TF\",\"recommandation\":\"hdfffff\",\"kilometrage\":185680,\"statut_vehicule\":\"en_reparation\",\"commentaire\":\"vzvsvsvsvsv\",\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-14 12:09:55'),
(57, 5, 'UPDATE', 'Changement de statut du véhicule FM 610 AA : indisponible → En reparation (demande DEM-00005)', 'vehicules', 'FM 610 AA', '{\"statut\":\"indisponible\"}', '{\"statut\":\"En reparation\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-14 12:13:23'),
(58, 5, 'UPDATE', 'Modification de la demande d\'intervention DEM-00005', 'demandes_intervention', '5', '{\"reference\":\"DEM-00005\",\"vehicule\":\"FM 610 AA\",\"demandeur\":\"ssvvsvsvs\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"vidange\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"vsvsvsvsvsvsvs\",\"direction_service\":\"Direction des achats et de la Logistique\",\"recommandation\":\"vsvsvsvssvvsvvv\",\"kilometrage\":123000,\"statut_vehicule\":\"en_panne\",\"commentaire\":\"vwwvvvvvwvwvv\",\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '{\"reference\":\"DEM-00005\",\"vehicule\":\"FM 610 AA\",\"demandeur\":\"ssvvsvsvs\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"vidange\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"vsvsvsvsvsvsvs\",\"direction_service\":\"Direction des achats et de la Logistique\",\"recommandation\":\"vsvsvsvssvvsvvv\",\"kilometrage\":123000,\"statut_vehicule\":\"En reparation\",\"commentaire\":\"vwwvvvvvwvwvv\",\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-14 12:13:23'),
(59, 5, 'UPDATE', 'Changement de statut du véhicule FM 610 AA : En reparation → hors_service', 'vehicules', 'FM 610 AA', '{\"statut\":\"En reparation\"}', '{\"statut\":\"hors_service\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-14 12:31:57'),
(60, 1, 'UPDATE', 'Validation de la demande DEM-00005 (externe) — en cours de traitement', 'demandes_intervention', '5', '{\"reference\":\"DEM-00005\",\"vehicule\":\"FM 610 AA\",\"demandeur\":\"ssvvsvsvs\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"vidange\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"vsvsvsvsvsvsvs\",\"direction_service\":\"Direction des achats et de la Logistique\",\"recommandation\":\"vsvsvsvssvvsvvv\",\"kilometrage\":123000,\"statut_vehicule\":\"En reparation\",\"commentaire\":\"vwwvvvvvwvwvv\",\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '{\"reference\":\"DEM-00005\",\"vehicule\":\"FM 610 AA\",\"demandeur\":\"ssvvsvsvs\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"vidange\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"vsvsvsvsvsvsvs\",\"direction_service\":\"Direction des achats et de la Logistique\",\"recommandation\":\"vsvsvsvssvvsvvv\",\"kilometrage\":123000,\"statut_vehicule\":\"En reparation\",\"commentaire\":\"vwwvvvvvwvwvv\",\"statut\":\"en_cours\",\"motif_rejet\":null,\"validee_par\":\"DJYEMBI Hulas Brily\",\"date_validation\":\"2026-10-14 13:47:56\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 12:47:56'),
(61, 1, 'UPDATE', 'Validation de la demande DEM-00004 (externe) — en cours de traitement', 'demandes_intervention', '4', '{\"reference\":\"DEM-00004\",\"vehicule\":\"FM 612 AA\",\"demandeur\":\"dfzfzfzfzf\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"freinage\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"fzfzfzfzzfzfzfzf\",\"direction_service\":\"Direction G\\u00e9n\\u00e9rale\",\"recommandation\":\"FZFZFZF\",\"kilometrage\":138006,\"statut_vehicule\":\"en_panne\",\"commentaire\":\"FZFZFZFZFZ\",\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '{\"reference\":\"DEM-00004\",\"vehicule\":\"FM 612 AA\",\"demandeur\":\"dfzfzfzfzf\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"freinage\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"fzfzfzfzzfzfzfzf\",\"direction_service\":\"Direction G\\u00e9n\\u00e9rale\",\"recommandation\":\"FZFZFZF\",\"kilometrage\":138006,\"statut_vehicule\":\"en_panne\",\"commentaire\":\"FZFZFZFZFZ\",\"statut\":\"en_cours\",\"motif_rejet\":null,\"validee_par\":\"DJYEMBI Hulas Brily\",\"date_validation\":\"2026-10-14 14:31:22\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 13:31:22'),
(62, 1, 'UPDATE', 'Validation de la demande DEM-00003 (externe) — en cours de traitement', 'demandes_intervention', '3', '{\"reference\":\"DEM-00003\",\"vehicule\":\"JW-164-AA\",\"demandeur\":\"gsgdsgsdggs\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"transmission\",\"priorite\":\"normale\",\"anomalie\":null,\"anomalie_constatee\":\"ffffffffzsdsdscqc\",\"direction_service\":\"OYEM TF\",\"recommandation\":\"hdfffff\",\"kilometrage\":185680,\"statut_vehicule\":\"en_reparation\",\"commentaire\":\"vzvsvsvsvsv\",\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '{\"reference\":\"DEM-00003\",\"vehicule\":\"JW-164-AA\",\"demandeur\":\"gsgdsgsdggs\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"transmission\",\"priorite\":\"normale\",\"anomalie\":null,\"anomalie_constatee\":\"ffffffffzsdsdscqc\",\"direction_service\":\"OYEM TF\",\"recommandation\":\"hdfffff\",\"kilometrage\":185680,\"statut_vehicule\":\"en_reparation\",\"commentaire\":\"vzvsvsvsvsv\",\"statut\":\"en_cours\",\"motif_rejet\":null,\"validee_par\":\"DJYEMBI Hulas Brily\",\"date_validation\":\"2026-10-14 14:31:35\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', '2026-10-14 13:31:35'),
(63, 5, 'UPDATE', 'Restauration du statut du véhicule KH-758-AA : en_panne → disponible (demande DEM-00002)', 'vehicules', 'KH-758-AA', '{\"statut\":\"en_panne\"}', '{\"statut\":\"disponible\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-14 13:31:56'),
(64, 5, 'DELETE', 'Suppression de la demande d\'intervention DEM-00002', 'demandes_intervention', '2', '{\"reference\":\"DEM-00002\",\"vehicule\":\"KH-758-AA\",\"demandeur\":\"dsdsdsdqdq\",\"nature_intervention\":\"interne\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"courroie_distribution\",\"priorite\":\"normale\",\"anomalie\":null,\"anomalie_constatee\":\"sssss\",\"direction_service\":\"BRIGADE CANINE\",\"recommandation\":\"SSS\",\"kilometrage\":346000,\"statut_vehicule\":\"en_panne\",\"commentaire\":\"QQQQDDQDdDdDDd\",\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-14 13:31:56'),
(65, 5, 'DELETE', 'Suppression de la demande d\'intervention DEM-00007', 'demandes_intervention', '7', '{\"reference\":\"DEM-00007\",\"matricule_demande\":\"DEM-00007\",\"vehicule\":\"FM 610 AA\",\"demandeur\":\"daaaaaaaaaaaaa\",\"nature_intervention\":\"interne\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"moteur\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"daaddada\",\"direction_service\":\"dadaaadad\",\"recommandation\":\"aaaaaaaaaaa\",\"kilometrage\":123000,\"statut_vehicule\":\"indisponible\",\"commentaire\":null,\"statut\":\"en_cours\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 10:00:10'),
(66, 5, 'DELETE', 'Suppression de la demande d\'intervention DEM-00001', 'demandes_intervention', '1', '{\"reference\":\"DEM-00001\",\"matricule_demande\":\"DEM-00001\",\"vehicule\":\"FM 609 AA\",\"demandeur\":\"MAYOMBO Jean Benoit\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"vidange\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"Il faut refaire la vidange\",\"direction_service\":\"DEX - ZONE 1\",\"recommandation\":null,\"kilometrage\":346790,\"statut_vehicule\":\"en_panne\",\"commentaire\":null,\"statut\":\"en_cours\",\"motif_rejet\":null,\"validee_par\":\"DJYEMBI Hulas Brily\",\"date_validation\":\"2026-10-14 11:10:09\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 10:00:18'),
(67, 5, 'DELETE', 'Suppression de la demande d\'intervention DEM-00003', 'demandes_intervention', '3', '{\"reference\":\"DEM-00003\",\"matricule_demande\":\"DEM-00003\",\"vehicule\":\"JW-164-AA\",\"demandeur\":\"gsgdsgsdggs\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"transmission\",\"priorite\":\"normale\",\"anomalie\":null,\"anomalie_constatee\":\"ffffffffzsdsdscqc\",\"direction_service\":\"OYEM TF\",\"recommandation\":\"hdfffff\",\"kilometrage\":185680,\"statut_vehicule\":\"en_reparation\",\"commentaire\":\"vzvsvsvsvsv\",\"statut\":\"en_cours\",\"motif_rejet\":null,\"validee_par\":\"DJYEMBI Hulas Brily\",\"date_validation\":\"2026-10-14 14:31:35\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 10:00:27'),
(68, 5, 'DELETE', 'Suppression de la demande d\'intervention DEM-00004', 'demandes_intervention', '4', '{\"reference\":\"DEM-00004\",\"matricule_demande\":\"DEM-00004\",\"vehicule\":\"FM 612 AA\",\"demandeur\":\"dfzfzfzfzf\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"freinage\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"fzfzfzfzzfzfzfzf\",\"direction_service\":\"Direction G\\u00e9n\\u00e9rale\",\"recommandation\":\"FZFZFZF\",\"kilometrage\":138006,\"statut_vehicule\":\"en_panne\",\"commentaire\":\"FZFZFZFZFZ\",\"statut\":\"en_cours\",\"motif_rejet\":null,\"validee_par\":\"DJYEMBI Hulas Brily\",\"date_validation\":\"2026-10-14 14:31:22\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 10:01:57'),
(69, 5, 'UPDATE', 'Restauration du statut du véhicule DX-309-AA : en_panne → disponible (demande DEM-00006)', 'vehicules', 'DX-309-AA', '{\"statut\":\"en_panne\"}', '{\"statut\":\"disponible\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 10:03:31'),
(70, 5, 'DELETE', 'Suppression de la demande d\'intervention DEM-00006', 'demandes_intervention', '6', '{\"reference\":\"DEM-00006\",\"matricule_demande\":\"DEM-00006\",\"vehicule\":\"DX-309-AA\",\"demandeur\":\"Falone MEKONTSO BEKALE\",\"nature_intervention\":\"interne\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"moteur\",\"priorite\":\"urgente\",\"anomalie\":null,\"anomalie_constatee\":\"dddddddddddd\",\"direction_service\":\"Direction Administrative et Financi\\u00e8re\",\"recommandation\":\"FFF\",\"kilometrage\":235000,\"statut_vehicule\":\"en_panne\",\"commentaire\":\"FFF\",\"statut\":\"en_cours\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 10:08:01'),
(71, 5, 'UPDATE', 'Changement de statut du véhicule FM 610 AA : hors_service → indisponible (demande DEM-00007)', 'vehicules', 'FM 610 AA', '{\"statut\":\"hors_service\"}', '{\"statut\":\"indisponible\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 10:11:30'),
(72, 5, 'UPDATE', 'Modification de la demande d\'intervention DEM-00007', 'demandes_intervention', '7', '{\"reference\":\"DEM-00007\",\"matricule_demande\":\"DEM-00007\",\"vehicule\":\"FM 610 AA\",\"demandeur\":\"daaaaaaaaaaaaa\",\"nature_intervention\":\"interne\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"moteur\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"daaddada\",\"direction_service\":\"dadaaadad\",\"recommandation\":\"aaaaaaaaaaa\",\"kilometrage\":123000,\"statut_vehicule\":\"indisponible\",\"commentaire\":null,\"statut\":\"en_cours\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '{\"reference\":\"DEM-00007\",\"matricule_demande\":\"DEM-00007\",\"vehicule\":\"FM 610 AA\",\"demandeur\":\"daaaaaaaaaaaaa\",\"nature_intervention\":\"interne\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"moteur\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"daaddada\",\"direction_service\":\"dadaaadad\",\"recommandation\":\"aaaaaaaaaaa\",\"kilometrage\":123000,\"statut_vehicule\":\"indisponible\",\"commentaire\":null,\"statut\":\"en_cours\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 10:11:30'),
(73, 5, 'UPDATE', 'Restauration du statut du véhicule FM 610 AA : indisponible → hors_service (demande DEM-00007)', 'vehicules', 'FM 610 AA', '{\"statut\":\"indisponible\"}', '{\"statut\":\"hors_service\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 10:11:41'),
(74, 5, 'UPDATE', 'Changement de statut du véhicule FM 610 AA : hors_service → indisponible (demande DEM-00007)', 'vehicules', 'FM 610 AA', '{\"statut\":\"hors_service\"}', '{\"statut\":\"indisponible\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 10:11:41'),
(75, 5, 'UPDATE', 'Modification de la demande d\'intervention DEM-00007', 'demandes_intervention', '7', '{\"reference\":\"DEM-00007\",\"matricule_demande\":\"DEM-00007\",\"vehicule\":\"FM 610 AA\",\"demandeur\":\"daaaaaaaaaaaaa\",\"nature_intervention\":\"interne\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"moteur\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"daaddada\",\"direction_service\":\"dadaaadad\",\"recommandation\":\"aaaaaaaaaaa\",\"kilometrage\":123000,\"statut_vehicule\":\"indisponible\",\"commentaire\":null,\"statut\":\"en_cours\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '{\"reference\":\"DEM-00007\",\"matricule_demande\":\"DEM-00007\",\"vehicule\":\"FM 610 AA\",\"demandeur\":\"dsgsddsdssvdsvsd\",\"nature_intervention\":\"interne\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"moteur\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"daaddada\",\"direction_service\":\"dadaaadad\",\"recommandation\":\"aaaaaaaaaaa\",\"kilometrage\":123000,\"statut_vehicule\":\"indisponible\",\"commentaire\":null,\"statut\":\"en_cours\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 10:11:41'),
(76, 5, 'UPDATE', 'Restauration du statut du véhicule FM 610 AA : indisponible → hors_service (demande DEM-00007)', 'vehicules', 'FM 610 AA', '{\"statut\":\"indisponible\"}', '{\"statut\":\"hors_service\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 10:12:30'),
(77, 5, 'UPDATE', 'Changement de statut du véhicule FM 610 AA : hors_service → En reparation (demande DEM-00007)', 'vehicules', 'FM 610 AA', '{\"statut\":\"hors_service\"}', '{\"statut\":\"En reparation\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 10:12:30');
INSERT INTO `journaux_audit` (`id`, `user_id`, `action`, `libelle`, `nom_table`, `id_enregistrement`, `anciennes_valeurs`, `nouvelles_valeurs`, `adresse_ip`, `user_agent`, `date_creation`) VALUES
(78, 5, 'UPDATE', 'Modification de la demande d\'intervention DEM-00007', 'demandes_intervention', '7', '{\"reference\":\"DEM-00007\",\"matricule_demande\":\"DEM-00007\",\"vehicule\":\"FM 610 AA\",\"demandeur\":\"dsgsddsdssvdsvsd\",\"nature_intervention\":\"interne\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"moteur\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"daaddada\",\"direction_service\":\"dadaaadad\",\"recommandation\":\"aaaaaaaaaaa\",\"kilometrage\":123000,\"statut_vehicule\":\"indisponible\",\"commentaire\":null,\"statut\":\"en_cours\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '{\"reference\":\"DEM-00007\",\"matricule_demande\":\"DEM-00007\",\"vehicule\":\"FM 610 AA\",\"demandeur\":\"dsgsddsdssvdsvsd\",\"nature_intervention\":\"interne\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"moteur\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"scpijfrmeposinddjsbbkd\",\"direction_service\":\"AGENCE POG\",\"recommandation\":\"bldoir bcldosie  vsjjdkoirhd smlppd\",\"kilometrage\":123000,\"statut_vehicule\":\"En reparation\",\"commentaire\":null,\"statut\":\"en_cours\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 10:12:30'),
(79, 5, 'UPDATE', 'Changement de statut du véhicule DX-309-AA : disponible → En panne (demande DEM-00006)', 'vehicules', 'DX-309-AA', '{\"statut\":\"disponible\"}', '{\"statut\":\"En panne\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 10:13:24'),
(80, 5, 'UPDATE', 'Modification de la demande d\'intervention DEM-00006', 'demandes_intervention', '6', '{\"reference\":\"DEM-00006\",\"matricule_demande\":\"DEM-00006\",\"vehicule\":\"DX-309-AA\",\"demandeur\":\"Falone MEKONTSO BEKALE\",\"nature_intervention\":\"interne\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"moteur\",\"priorite\":\"urgente\",\"anomalie\":null,\"anomalie_constatee\":\"dddddddddddd\",\"direction_service\":\"Direction Administrative et Financi\\u00e8re\",\"recommandation\":\"FFF\",\"kilometrage\":235000,\"statut_vehicule\":\"en_panne\",\"commentaire\":\"FFF\",\"statut\":\"en_cours\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '{\"reference\":\"DEM-00006\",\"matricule_demande\":\"DEM-00006\",\"vehicule\":\"DX-309-AA\",\"demandeur\":\"Falone MEKONTSO BEKALE\",\"nature_intervention\":\"interne\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"moteur\",\"priorite\":\"urgente\",\"anomalie\":null,\"anomalie_constatee\":\"dddddddddddd\",\"direction_service\":\"Direction Administrative et Financi\\u00e8re\",\"recommandation\":\"FFF\",\"kilometrage\":235000,\"statut_vehicule\":\"En panne\",\"commentaire\":\"FFF\",\"statut\":\"en_cours\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 10:13:24'),
(81, 1, 'UPDATE', 'Validation de la demande DEM-00005 (externe) — en cours de traitement', 'demandes_intervention', '5', '{\"reference\":\"DEM-00005\",\"matricule_demande\":\"DEM-00005\",\"vehicule\":\"FM 610 AA\",\"demandeur\":\"ssvvsvsvs\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"vidange\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"vsvsvsvsvsvsvs\",\"direction_service\":\"Direction des achats et de la Logistique\",\"recommandation\":\"vsvsvsvssvvsvvv\",\"kilometrage\":123000,\"statut_vehicule\":\"En reparation\",\"commentaire\":\"vwwvvvvvwvwvv\",\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":\"DJYEMBI Hulas Brily\",\"date_validation\":\"2026-10-14 13:47:56\"}', '{\"reference\":\"DEM-00005\",\"matricule_demande\":\"DEM-00005\",\"vehicule\":\"FM 610 AA\",\"demandeur\":\"ssvvsvsvs\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"vidange\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"vsvsvsvsvsvsvs\",\"direction_service\":\"Direction des achats et de la Logistique\",\"recommandation\":\"vsvsvsvssvvsvvv\",\"kilometrage\":123000,\"statut_vehicule\":\"En reparation\",\"commentaire\":\"vwwvvvvvwvwvv\",\"statut\":\"en_cours\",\"motif_rejet\":null,\"validee_par\":\"DJYEMBI Hulas Brily\",\"date_validation\":\"2026-10-15 11:16:16\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-15 10:16:16'),
(82, 5, 'BLOQUER', 'Blocage de l\'utilisateur Boris LIPOT (b.lipot@sgs-gabon.com)', 'utilisateurs', '5', '{\"est_actif\":true}', '{\"est_actif\":false}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 12:29:07'),
(83, 5, 'BLOQUER', 'Blocage de l\'utilisateur Claude BOULINGUI (priest.boulingui@sgs-gabon.com)', 'utilisateurs', '2', '{\"est_actif\":true}', '{\"est_actif\":false}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 12:30:27'),
(84, 5, 'DEBLOQUER', 'Déblocage de l\'utilisateur Claude BOULINGUI (priest.boulingui@sgs-gabon.com)', 'utilisateurs', '2', '{\"est_actif\":false}', '{\"est_actif\":true}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 12:30:34'),
(85, 5, 'UPDATE', 'Changement de rôle de Falone MEKONTSO BEKALE : Gestionnaire du Parc → Gestionnaire du Parc', 'utilisateurs', '3', '{\"nom\":\"Falone MEKONTSO BEKALE\",\"email\":\"f.mekontso@sgs-gabon.com\",\"role\":\"Gestionnaire du Parc\",\"direction\":\"Direction des achats et de la Logistique\"}', '{\"nom\":\"MEKONTSO BEKALE\",\"email\":\"f.mekontso@sgs-gabon.com\",\"role\":\"Gestionnaire du Parc\",\"direction\":\"Direction des achats et de la Logistique\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 12:30:56'),
(86, 5, 'UPDATE', 'Changement de rôle de MEKONTSO BEKALE : Gestionnaire du Parc → Gestionnaire du Parc', 'utilisateurs', '3', '{\"nom\":\"MEKONTSO BEKALE\",\"email\":\"f.mekontso@sgs-gabon.com\",\"role\":\"Gestionnaire du Parc\",\"direction\":\"Direction des achats et de la Logistique\"}', '{\"nom\":\"MEKONTSO BEKALE Falone\",\"email\":\"f.mekontso@sgs-gabon.com\",\"role\":\"Gestionnaire du Parc\",\"direction\":\"Direction des achats et de la Logistique\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 12:31:13'),
(87, 5, 'BLOQUER', 'Blocage de l\'utilisateur Claude BOULINGUI (priest.boulingui@sgs-gabon.com)', 'utilisateurs', '2', '{\"est_actif\":true}', '{\"est_actif\":false}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 12:31:35'),
(88, 5, 'DEBLOQUER', 'Déblocage de l\'utilisateur Claude BOULINGUI (priest.boulingui@sgs-gabon.com)', 'utilisateurs', '2', '{\"est_actif\":false}', '{\"est_actif\":true}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 12:31:45'),
(89, 5, 'BLOQUER', 'Blocage de l\'utilisateur Claude BOULINGUI (priest.boulingui@sgs-gabon.com)', 'utilisateurs', '2', '{\"est_actif\":true}', '{\"est_actif\":false}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 12:31:52'),
(90, 5, 'DEBLOQUER', 'Déblocage de l\'utilisateur Claude BOULINGUI (priest.boulingui@sgs-gabon.com)', 'utilisateurs', '2', '{\"est_actif\":false}', '{\"est_actif\":true}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 12:32:18'),
(91, 5, 'UPDATE', 'Changement de statut du véhicule CX 032 AA : immobilisation longue → En reparation (demande DEM-00012)', 'vehicules', 'CX 032 AA', '{\"statut\":\"immobilisation longue\"}', '{\"statut\":\"En reparation\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 12:35:08'),
(92, 5, 'CREATE', 'Création de la demande d\'intervention DEM-00012 (externe) pour le véhicule CX 032 AA', 'demandes_intervention', '12', NULL, '{\"reference\":\"DEM-00012\",\"matricule_demande\":\"DEM-00012\",\"vehicule\":\"CX 032 AA\",\"demandeur\":\"ddddddddddddddddd\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"refroidissement\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"dbbbbbbbbbbbbbx\",\"direction_service\":\"bbbbbbbbbbbbbdd\",\"recommandation\":\"ddddddddddddddddd\",\"kilometrage\":0,\"statut_vehicule\":\"En reparation\",\"commentaire\":null,\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 12:35:08'),
(93, 5, 'UPDATE', 'Restauration du statut du véhicule CX 032 AA : En reparation → immobilisation longue (demande DEM-00012)', 'vehicules', 'CX 032 AA', '{\"statut\":\"En reparation\"}', '{\"statut\":\"immobilisation longue\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 12:36:35'),
(94, 5, 'UPDATE', 'Changement de statut du véhicule CX 032 AA : immobilisation longue → En reparation (demande DEM-00012)', 'vehicules', 'CX 032 AA', '{\"statut\":\"immobilisation longue\"}', '{\"statut\":\"En reparation\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 12:36:35'),
(95, 5, 'UPDATE', 'Modification de la demande d\'intervention DEM-00012', 'demandes_intervention', '12', '{\"reference\":\"DEM-00012\",\"matricule_demande\":\"DEM-00012\",\"vehicule\":\"CX 032 AA\",\"demandeur\":\"ddddddddddddddddd\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"refroidissement\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"dbbbbbbbbbbbbbx\",\"direction_service\":\"bbbbbbbbbbbbbdd\",\"recommandation\":\"ddddddddddddddddd\",\"kilometrage\":0,\"statut_vehicule\":\"En reparation\",\"commentaire\":null,\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '{\"reference\":\"DEM-00012\",\"matricule_demande\":\"DEM-00012\",\"vehicule\":\"CX 032 AA\",\"demandeur\":\"ddddddddddddddddd\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"refroidissement\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"dbbbbbbbbbbbbbx\",\"direction_service\":\"AGENCE POG\",\"recommandation\":\"ddddddddddddddddd\",\"kilometrage\":0,\"statut_vehicule\":\"En reparation\",\"commentaire\":null,\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 12:36:35'),
(96, 5, 'UPDATE', 'Changement de statut du véhicule FM 609 AA : en_panne → En panne (demande DEM-00013)', 'vehicules', 'FM 609 AA', '{\"statut\":\"en_panne\"}', '{\"statut\":\"En panne\"}', '127.0.0.1', 'Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Edg/155.0.0.0 Mobile Safari/537.36', '2026-10-15 12:37:37'),
(97, 5, 'CREATE', 'Création de la demande d\'intervention DEM-00013 (externe) pour le véhicule FM 609 AA', 'demandes_intervention', '13', NULL, '{\"reference\":\"DEM-00013\",\"matricule_demande\":\"DEM-00013\",\"vehicule\":\"FM 609 AA\",\"demandeur\":\"dddddddddddddd\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"transmission\",\"priorite\":\"urgente\",\"anomalie\":null,\"anomalie_constatee\":\"dddddddddddddddddd\",\"direction_service\":\"Direction d\'Exploitation\",\"recommandation\":\"ddddddddddddddddd\",\"kilometrage\":346790,\"statut_vehicule\":\"En panne\",\"commentaire\":null,\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '127.0.0.1', 'Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Edg/155.0.0.0 Mobile Safari/537.36', '2026-10-15 12:37:37'),
(98, 5, 'UPDATE', 'Restauration du statut du véhicule FM 609 AA : En panne → en_panne (demande DEM-00013)', 'vehicules', 'FM 609 AA', '{\"statut\":\"En panne\"}', '{\"statut\":\"en_panne\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 12:42:51'),
(99, 5, 'UPDATE', 'Changement de statut du véhicule FM 609 AA : en_panne → En panne (demande DEM-00013)', 'vehicules', 'FM 609 AA', '{\"statut\":\"en_panne\"}', '{\"statut\":\"En panne\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 12:42:51'),
(100, 5, 'UPDATE', 'Modification de la demande d\'intervention DEM-00013', 'demandes_intervention', '13', '{\"reference\":\"DEM-00013\",\"matricule_demande\":\"DEM-00013\",\"vehicule\":\"FM 609 AA\",\"demandeur\":\"dddddddddddddd\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"transmission\",\"priorite\":\"urgente\",\"anomalie\":null,\"anomalie_constatee\":\"dddddddddddddddddd\",\"direction_service\":\"Direction d\'Exploitation\",\"recommandation\":\"ddddddddddddddddd\",\"kilometrage\":346790,\"statut_vehicule\":\"En panne\",\"commentaire\":null,\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '{\"reference\":\"DEM-00013\",\"matricule_demande\":\"DEM-00013\",\"vehicule\":\"FM 609 AA\",\"demandeur\":\"dddddddddddddd\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"transmission\",\"priorite\":\"urgente\",\"anomalie\":null,\"anomalie_constatee\":\"dddddddddddddddddd\",\"direction_service\":\"Direction d\'Exploitation\",\"recommandation\":\"ddddddddddddddddd\",\"kilometrage\":346790,\"statut_vehicule\":\"En panne\",\"commentaire\":null,\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 12:42:51'),
(101, 5, 'UPDATE', 'Mise à jour du kilométrage du véhicule JM 562 AA : 0 km → 4564690 km (demande DEM-00014)', 'vehicules', 'JM 562 AA', '{\"kilometrage\":0}', '{\"kilometrage\":4564690}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 12:55:13'),
(102, 5, 'UPDATE', 'Changement de statut du véhicule JM 562 AA : immobilisation courte → En panne (demande DEM-00014)', 'vehicules', 'JM 562 AA', '{\"statut\":\"immobilisation courte\"}', '{\"statut\":\"En panne\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 12:55:13'),
(103, 5, 'CREATE', 'Création de la demande d\'intervention DEM-00014 (externe) pour le véhicule JM 562 AA', 'demandes_intervention', '14', NULL, '{\"reference\":\"DEM-00014\",\"matricule_demande\":\"DEM-00014\",\"vehicule\":\"JM 562 AA\",\"demandeur\":\"dvdvddvdvdvdvdv\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"courroie_distribution\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"vddsdc\",\"direction_service\":\"xxxxxxxxxxxx\",\"recommandation\":\"SBDBBDBDBDBDB\",\"kilometrage\":4564690,\"statut_vehicule\":\"En panne\",\"commentaire\":null,\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 12:55:13'),
(104, 5, 'UPDATE', 'Changement de statut du véhicule ABG-325 AA : disponible → disponible', 'vehicules', 'ABG-325 AA', '{\"marque\":\"DAIHATSU TERIOS\",\"modele\":\"TERRIOS\",\"categorie\":\"J210 GL\",\"direction\":\"Direction Administrative et Financi\\u00e8re\",\"annee\":\"2024\",\"numero_chassis\":\"49809FG98CN00X\",\"nb_places\":5,\"ville\":\"LIBREVILLE\",\"affectation\":\"RECOUVREMENT\",\"responsable_du_vehicule\":null,\"kilometrage\":0,\"date_maj_km\":\"2026-09-24\",\"statut\":\"disponible\",\"couleur\":\"Rouge\",\"date_acquisition\":\"2024-09-03\",\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"consommation_moyenne\":null,\"km_prochaine_vidange\":null,\"km_prochaine_revision\":null,\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null}', '{\"marque\":\"DAIHATSU TERIOS\",\"modele\":\"TERRIOS\",\"categorie\":\"J210 GL\",\"direction\":\"Direction Administrative et Financi\\u00e8re\",\"annee\":\"2024\",\"numero_chassis\":\"49809FG98CN00X\",\"nb_places\":5,\"ville\":\"LIBREVILLE\",\"affectation\":\"RECOUVREMENT\",\"responsable_du_vehicule\":null,\"kilometrage\":0,\"date_maj_km\":\"2026-10-15\",\"statut\":\"disponible\",\"couleur\":\"Rouge\",\"date_acquisition\":\"2024-09-03\",\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"consommation_moyenne\":null,\"km_prochaine_vidange\":null,\"km_prochaine_revision\":null,\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 13:01:57'),
(105, 5, 'UPDATE', 'Modification du document \"ASSURANCE 370 AA\" du véhicule ABG-325 AA', 'documents_vehicules', '37', '{\"id\":37,\"vehicule_immatriculation\":\"ABG-325 AA\",\"type_document\":\"Assurance\",\"nom_document\":\"ASSURANCE 370 AA\",\"chemin_fichier\":\"upload\\/admin\\/document\\/vehicules\\/8c1b1968-d4b5-4773-872f-dd5713e5ecbf.pdf\",\"compagnie_assurance\":\"ASSENCO\",\"numero_contrat\":\"XCL 0037\",\"type_couverture\":\"Compl\\u00e8te\",\"montant_prime\":\"150000.00\",\"date_emission\":\"2026-09-24\",\"date_expiration\":\"2026-10-23\",\"telecharge_par_user_id\":1,\"notes\":null,\"est_supprime\":0,\"date_creation\":\"2026-09-24 10:56:07\",\"date_modification\":\"2026-09-24 10:56:07\",\"date_suppression\":null}', '{\"type_document\":\"Assurance\",\"nom_document\":\"ASSURANCE 370 AA\",\"compagnie_assurance\":\"ASSENCO\",\"numero_contrat\":\"XCL 0037\",\"type_couverture\":\"Compl\\u00e8te\",\"montant_prime\":\"150000.00\",\"date_emission\":\"2026-09-24\",\"date_expiration\":\"2026-10-23\",\"notes\":null,\"chemin_fichier\":\"upload\\/admin\\/document\\/vehicules\\/3c04d0f4-7b88-4bde-ae8c-43b69413037d.pdf\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 13:02:27'),
(106, 5, 'UPDATE', 'Modification du document \"ASSURANCE 370 AA\" du véhicule ABG-325 AA', 'documents_vehicules', '37', '{\"id\":37,\"vehicule_immatriculation\":\"ABG-325 AA\",\"type_document\":\"Assurance\",\"nom_document\":\"ASSURANCE 370 AA\",\"chemin_fichier\":\"upload\\/admin\\/document\\/vehicules\\/3c04d0f4-7b88-4bde-ae8c-43b69413037d.pdf\",\"compagnie_assurance\":\"ASSENCO\",\"numero_contrat\":\"XCL 0037\",\"type_couverture\":\"Compl\\u00e8te\",\"montant_prime\":\"150000.00\",\"date_emission\":\"2026-09-24\",\"date_expiration\":\"2026-10-23\",\"telecharge_par_user_id\":1,\"notes\":null,\"est_supprime\":0,\"date_creation\":\"2026-09-24 10:56:07\",\"date_modification\":\"2026-10-15 14:02:25\",\"date_suppression\":null}', '{\"type_document\":\"Assurance\",\"nom_document\":\"ASSURANCE 370 AA\",\"compagnie_assurance\":\"ASSENCO\",\"numero_contrat\":\"XCL 0037\",\"type_couverture\":\"Compl\\u00e8te\",\"montant_prime\":\"150000.00\",\"date_emission\":\"2026-09-24\",\"date_expiration\":\"2026-10-23\",\"notes\":\"RAS\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 13:03:09'),
(107, 5, 'UPDATE', 'Restauration du statut du véhicule JM 562 AA : En panne → immobilisation courte (demande DEM-00014)', 'vehicules', 'JM 562 AA', '{\"statut\":\"En panne\"}', '{\"statut\":\"immobilisation courte\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 15:27:21'),
(108, 5, 'UPDATE', 'Changement de statut du véhicule JM 562 AA : immobilisation courte → En reparation (demande DEM-00014)', 'vehicules', 'JM 562 AA', '{\"statut\":\"immobilisation courte\"}', '{\"statut\":\"En reparation\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 15:27:21'),
(109, 5, 'UPDATE', 'Modification de la demande d\'intervention DEM-00014', 'demandes_intervention', '14', '{\"reference\":\"DEM-00014\",\"matricule_demande\":\"DEM-00014\",\"vehicule\":\"JM 562 AA\",\"demandeur\":\"dvdvddvdvdvdvdv\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"courroie_distribution\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"vddsdc\",\"direction_service\":\"xxxxxxxxxxxx\",\"recommandation\":\"SBDBBDBDBDBDB\",\"kilometrage\":4564690,\"statut_vehicule\":\"En panne\",\"commentaire\":null,\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '{\"reference\":\"DEM-00014\",\"matricule_demande\":\"DEM-00014\",\"vehicule\":\"JM 562 AA\",\"demandeur\":\"dvdvddvdvdvdvdv\",\"nature_intervention\":\"externe\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"courroie_distribution\",\"priorite\":\"haute\",\"anomalie\":null,\"anomalie_constatee\":\"vddsdc\",\"direction_service\":\"xxxxxxxxxxxx\",\"recommandation\":\"SBDBBDBDBDBDB\",\"kilometrage\":4564690,\"statut_vehicule\":\"En reparation\",\"commentaire\":null,\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 15:27:21'),
(110, 5, 'UPDATE', 'Changement de statut du véhicule KH-758-AA : disponible → En reparation (demande DEM-00002)', 'vehicules', 'KH-758-AA', '{\"statut\":\"disponible\"}', '{\"statut\":\"En reparation\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 15:28:04'),
(111, 5, 'UPDATE', 'Modification de la demande d\'intervention DEM-00002', 'demandes_intervention', '2', '{\"reference\":\"DEM-00002\",\"matricule_demande\":\"DEM-00002\",\"vehicule\":\"KH-758-AA\",\"demandeur\":\"dsdsdsdqdq\",\"nature_intervention\":\"interne\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"courroie_distribution\",\"priorite\":\"normale\",\"anomalie\":null,\"anomalie_constatee\":\"sssss\",\"direction_service\":\"BRIGADE CANINE\",\"recommandation\":\"SSS\",\"kilometrage\":346000,\"statut_vehicule\":\"en_panne\",\"commentaire\":\"QQQQDDQDdDdDDd\",\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '{\"reference\":\"DEM-00002\",\"matricule_demande\":\"DEM-00002\",\"vehicule\":\"KH-758-AA\",\"demandeur\":\"dsdsdsdqdq\",\"nature_intervention\":\"interne\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"courroie_distribution\",\"priorite\":\"normale\",\"anomalie\":null,\"anomalie_constatee\":\"sssss\",\"direction_service\":\"BRIGADE CANINE\",\"recommandation\":\"SSS\",\"kilometrage\":346000,\"statut_vehicule\":\"En reparation\",\"commentaire\":\"QQQQDDQDdDdDDd\",\"statut\":\"en_attente\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-15 15:28:04'),
(112, 1, 'UPDATE', 'Changement de statut du véhicule ABG-325 AA : disponible → disponible', 'vehicules', 'ABG-325 AA', '{\"marque\":\"DAIHATSU TERIOS\",\"modele\":\"TERRIOS\",\"categorie\":\"J210 GL\",\"direction\":\"Direction Administrative et Financi\\u00e8re\",\"annee\":\"2024\",\"numero_chassis\":\"49809FG98CN00X\",\"nb_places\":5,\"ville\":\"LIBREVILLE\",\"affectation\":\"RECOUVREMENT\",\"responsable_du_vehicule\":null,\"kilometrage\":0,\"date_maj_km\":\"2026-10-15\",\"statut\":\"disponible\",\"couleur\":\"Rouge\",\"date_acquisition\":\"2024-09-03\",\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"consommation_moyenne\":null,\"km_prochaine_vidange\":null,\"km_prochaine_revision\":null,\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null}', '{\"marque\":\"DAIHATSU TERIOS\",\"modele\":\"TERRIOS\",\"categorie\":\"J210 GL\",\"direction\":\"Direction Administrative et Financi\\u00e8re\",\"annee\":\"2024\",\"numero_chassis\":\"49809FG98CN00X\",\"nb_places\":5,\"ville\":\"LIBREVILLE\",\"affectation\":\"RECOUVREMENT\",\"responsable_du_vehicule\":null,\"kilometrage\":0,\"date_maj_km\":\"2026-10-20\",\"statut\":\"disponible\",\"couleur\":\"Rouge\",\"date_acquisition\":\"2024-09-03\",\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"consommation_moyenne\":null,\"km_prochaine_vidange\":null,\"km_prochaine_revision\":null,\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 10:44:55'),
(113, 1, 'UPDATE', 'Changement de statut du véhicule ABG-325 AA : disponible → disponible', 'vehicules', 'ABG-325 AA', '{\"marque\":\"DAIHATSU TERIOS\",\"modele\":\"TERRIOS\",\"categorie\":\"J210 GL\",\"direction\":\"Direction Administrative et Financi\\u00e8re\",\"annee\":\"2024\",\"numero_chassis\":\"49809FG98CN00X\",\"nb_places\":5,\"ville\":\"LIBREVILLE\",\"affectation\":\"RECOUVREMENT\",\"responsable_du_vehicule\":null,\"kilometrage\":0,\"date_maj_km\":\"2026-10-20\",\"statut\":\"disponible\",\"couleur\":\"Rouge\",\"date_acquisition\":\"2024-09-03\",\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"consommation_moyenne\":null,\"km_prochaine_vidange\":null,\"km_prochaine_revision\":null,\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null}', '{\"marque\":\"DAIHATSU TERIOS\",\"modele\":\"TERRIOS\",\"categorie\":\"J210 GL\",\"direction\":\"Direction Administrative et Financi\\u00e8re\",\"annee\":\"2024\",\"numero_chassis\":\"49809FG98CN00X\",\"nb_places\":5,\"ville\":\"LIBREVILLE\",\"affectation\":\"POG - TF\",\"responsable_du_vehicule\":null,\"kilometrage\":0,\"date_maj_km\":\"2026-10-20\",\"statut\":\"disponible\",\"couleur\":\"Rouge\",\"date_acquisition\":\"2024-09-03\",\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"consommation_moyenne\":null,\"km_prochaine_vidange\":null,\"km_prochaine_revision\":null,\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 10:45:09'),
(114, 1, 'UPDATE', 'Changement de statut du véhicule ABG-325 AA : disponible → disponible', 'vehicules', 'ABG-325 AA', '{\"marque\":\"DAIHATSU TERIOS\",\"modele\":\"TERRIOS\",\"categorie\":\"J210 GL\",\"direction\":\"Direction Administrative et Financi\\u00e8re\",\"annee\":\"2024\",\"numero_chassis\":\"49809FG98CN00X\",\"nb_places\":5,\"ville\":\"LIBREVILLE\",\"affectation\":\"POG - TF\",\"responsable_du_vehicule\":null,\"kilometrage\":0,\"date_maj_km\":\"2026-10-20\",\"statut\":\"disponible\",\"couleur\":\"Rouge\",\"date_acquisition\":\"2024-09-03\",\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"consommation_moyenne\":null,\"km_prochaine_vidange\":null,\"km_prochaine_revision\":null,\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null}', '{\"marque\":\"DAIHATSU TERIOS\",\"modele\":\"TERRIOS\",\"categorie\":\"J210 GL\",\"direction\":\"Direction Administrative et Financi\\u00e8re\",\"annee\":\"2024\",\"numero_chassis\":\"49809FG98CN00X\",\"nb_places\":5,\"ville\":\"LIBREVILLE\",\"affectation\":\"ESCORTE\\/TF\",\"responsable_du_vehicule\":null,\"kilometrage\":0,\"date_maj_km\":\"2026-10-20\",\"statut\":\"disponible\",\"couleur\":\"Rouge\",\"date_acquisition\":\"2024-09-03\",\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"consommation_moyenne\":null,\"km_prochaine_vidange\":null,\"km_prochaine_revision\":null,\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 10:45:18'),
(115, 1, 'UPDATE', 'Changement de statut du véhicule FM 610 AA : En reparation → vendu', 'vehicules', 'FM 610 AA', '{\"statut\":\"En reparation\"}', '{\"statut\":\"vendu\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 10:45:43'),
(116, 1, 'UPDATE', 'Changement de statut du véhicule FM 610 AA : vendu → disponible', 'vehicules', 'FM 610 AA', '{\"statut\":\"vendu\"}', '{\"statut\":\"disponible\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 10:45:51'),
(117, 1, 'UPDATE', 'Mise à jour du kilométrage du véhicule CX 032 AA : 0 km → 134700 km (demande DEM-00015)', 'vehicules', 'CX 032 AA', '{\"kilometrage\":0}', '{\"kilometrage\":134700}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 11:25:23'),
(118, 1, 'UPDATE', 'Changement de statut du véhicule CX 032 AA : En reparation → immobilisation longue (demande DEM-00015)', 'vehicules', 'CX 032 AA', '{\"statut\":\"En reparation\"}', '{\"statut\":\"immobilisation longue\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 11:25:23'),
(119, 1, 'CREATE', 'Création de la demande d\'intervention DEM-00015 (interne) pour le véhicule CX 032 AA — en cours de traitement directement (aucune validation requise)', 'demandes_intervention', '15', NULL, '{\"reference\":\"DEM-00015\",\"matricule_demande\":\"DEM-00015\",\"vehicule\":\"CX 032 AA\",\"demandeur\":\"cccc\",\"nature_intervention\":\"interne\",\"type_maintenance\":\"corrective\",\"type_intervention\":\"moteur\",\"priorite\":\"normale\",\"anomalie\":null,\"anomalie_constatee\":\"xxxxxxxxxxxxxxxxxxxxx456900\",\"direction_service\":\"Direction G\\u00e9n\\u00e9rale\",\"recommandation\":\"SSSSSSSSSSSSSSS\",\"kilometrage\":134700,\"statut_vehicule\":\"immobilisation longue\",\"commentaire\":null,\"statut\":\"en_cours\",\"motif_rejet\":null,\"validee_par\":null,\"date_validation\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 11:25:23'),
(120, 1, 'UPDATE', 'Changement de statut du véhicule ABG-325 AA : disponible → en_mission', 'vehicules', 'ABG-325 AA', '{\"statut\":\"disponible\"}', '{\"statut\":\"en_mission\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 18:59:27'),
(121, 1, 'UPDATE', 'Changement de statut du véhicule ABG-325 AA : en_mission → hors_service', 'vehicules', 'ABG-325 AA', '{\"statut\":\"en_mission\"}', '{\"statut\":\"hors_service\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 18:59:37'),
(122, 1, 'UPDATE', 'Changement de statut du véhicule ABG-325 AA : hors_service → disponible', 'vehicules', 'ABG-325 AA', '{\"marque\":\"DAIHATSU TERIOS\",\"modele\":\"TERRIOS\",\"categorie\":\"J210 GL\",\"direction\":\"Direction Administrative et Financi\\u00e8re\",\"annee\":\"2024\",\"numero_chassis\":\"49809FG98CN00X\",\"nb_places\":5,\"ville\":\"LIBREVILLE\",\"affectation\":\"ESCORTE\\/TF\",\"responsable_du_vehicule\":null,\"kilometrage\":0,\"date_maj_km\":\"2026-10-20\",\"statut\":\"hors_service\",\"couleur\":\"Rouge\",\"date_acquisition\":\"2024-09-03\",\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"consommation_moyenne\":null,\"km_prochaine_vidange\":null,\"km_prochaine_revision\":null,\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null,\"photo\":null}', '{\"marque\":\"DAIHATSU TERIOS\",\"modele\":\"TERRIOS\",\"categorie\":\"J210 GL\",\"direction\":\"Direction Administrative et Financi\\u00e8re\",\"annee\":\"2024\",\"numero_chassis\":\"49809FG98CN00X\",\"nb_places\":5,\"ville\":\"LIBREVILLE\",\"affectation\":\"ESCORTE\\/TF\",\"responsable_du_vehicule\":null,\"kilometrage\":0,\"date_maj_km\":\"2026-10-20\",\"statut\":\"disponible\",\"couleur\":\"Rouge\",\"date_acquisition\":\"2024-09-03\",\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"consommation_moyenne\":null,\"km_prochaine_vidange\":null,\"km_prochaine_revision\":null,\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null,\"photo\":\"upload\\/admin\\/images\\/vehicules\\/717b2e86-8372-46d6-b806-446f4c2a1207.png\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 19:01:30'),
(123, 1, 'UPDATE', 'Changement de statut du véhicule ABG-325 AA : disponible → disponible', 'vehicules', 'ABG-325 AA', '{\"marque\":\"DAIHATSU TERIOS\",\"modele\":\"TERRIOS\",\"categorie\":\"J210 GL\",\"direction\":\"Direction Administrative et Financi\\u00e8re\",\"annee\":\"2024\",\"numero_chassis\":\"49809FG98CN00X\",\"nb_places\":5,\"ville\":\"LIBREVILLE\",\"affectation\":\"ESCORTE\\/TF\",\"responsable_du_vehicule\":null,\"kilometrage\":0,\"date_maj_km\":\"2026-10-20\",\"statut\":\"disponible\",\"couleur\":\"Rouge\",\"date_acquisition\":\"2024-09-03\",\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"consommation_moyenne\":null,\"km_prochaine_vidange\":null,\"km_prochaine_revision\":null,\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null}', '{\"marque\":\"DAIHATSU TERIOS\",\"modele\":\"TERRIOS\",\"categorie\":\"J210 GL\",\"direction\":\"Direction Administrative et Financi\\u00e8re\",\"annee\":\"2024\",\"numero_chassis\":\"49809FG98CN00X\",\"nb_places\":5,\"ville\":\"LIBREVILLE\",\"affectation\":\"ESCORTE\\/TF\",\"responsable_du_vehicule\":null,\"kilometrage\":0,\"date_maj_km\":\"2026-10-20\",\"statut\":\"disponible\",\"couleur\":\"Rouge\",\"date_acquisition\":\"2024-09-03\",\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"consommation_moyenne\":25,\"km_prochaine_vidange\":null,\"km_prochaine_revision\":null,\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 19:02:02'),
(124, 1, 'UPDATE', 'Changement de statut du véhicule ABG-325 AA : disponible → disponible', 'vehicules', 'ABG-325 AA', '{\"marque\":\"DAIHATSU TERIOS\",\"modele\":\"TERRIOS\",\"categorie\":\"J210 GL\",\"direction\":\"Direction Administrative et Financi\\u00e8re\",\"annee\":\"2024\",\"numero_chassis\":\"49809FG98CN00X\",\"nb_places\":5,\"ville\":\"LIBREVILLE\",\"affectation\":\"ESCORTE\\/TF\",\"responsable_du_vehicule\":null,\"kilometrage\":0,\"date_maj_km\":\"2026-10-20\",\"statut\":\"disponible\",\"couleur\":\"Rouge\",\"date_acquisition\":\"2024-09-03\",\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"consommation_moyenne\":\"25.00\",\"km_prochaine_vidange\":null,\"km_prochaine_revision\":null,\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null}', '{\"marque\":\"DAIHATSU TERIOS\",\"modele\":\"TERRIOS\",\"categorie\":\"J210 GL\",\"direction\":\"Direction Administrative et Financi\\u00e8re\",\"annee\":\"2024\",\"numero_chassis\":\"49809FG98CN00X\",\"nb_places\":5,\"ville\":\"LIBREVILLE\",\"affectation\":\"ESCORTE\\/TF\",\"responsable_du_vehicule\":null,\"kilometrage\":0,\"date_maj_km\":\"2026-10-20\",\"statut\":\"disponible\",\"couleur\":\"Blanche\",\"date_acquisition\":\"2024-09-03\",\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"consommation_moyenne\":25,\"km_prochaine_vidange\":null,\"km_prochaine_revision\":null,\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 19:02:26'),
(125, 1, 'UPDATE', 'Changement de statut du véhicule ABG-325 AA : disponible → disponible', 'vehicules', 'ABG-325 AA', '{\"marque\":\"DAIHATSU TERIOS\",\"modele\":\"TERRIOS\",\"categorie\":\"J210 GL\",\"direction\":\"Direction Administrative et Financi\\u00e8re\",\"annee\":\"2024\",\"numero_chassis\":\"49809FG98CN00X\",\"nb_places\":5,\"ville\":\"LIBREVILLE\",\"affectation\":\"ESCORTE\\/TF\",\"responsable_du_vehicule\":null,\"kilometrage\":0,\"date_maj_km\":\"2026-10-20\",\"statut\":\"disponible\",\"couleur\":\"Blanche\",\"date_acquisition\":\"2024-09-03\",\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"consommation_moyenne\":\"25.00\",\"km_prochaine_vidange\":null,\"km_prochaine_revision\":null,\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null}', '{\"marque\":\"DAIHATSU TERIOS\",\"modele\":\"TERRIOS\",\"categorie\":\"J210 GL\",\"direction\":\"Direction Administrative et Financi\\u00e8re\",\"annee\":\"2024\",\"numero_chassis\":\"49809FG98CN00X\",\"nb_places\":5,\"ville\":\"LIBREVILLE\",\"affectation\":\"ESCORTE\\/TF\",\"responsable_du_vehicule\":null,\"kilometrage\":0,\"date_maj_km\":\"2026-10-20\",\"statut\":\"disponible\",\"couleur\":\"Blanche\",\"date_acquisition\":\"2024-09-03\",\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"consommation_moyenne\":25,\"km_prochaine_vidange\":130000,\"km_prochaine_revision\":null,\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 19:02:56'),
(126, 1, 'UPDATE', 'Changement de statut du véhicule ABG-325 AA : disponible → disponible', 'vehicules', 'ABG-325 AA', '{\"marque\":\"DAIHATSU TERIOS\",\"modele\":\"TERRIOS\",\"categorie\":\"J210 GL\",\"direction\":\"Direction Administrative et Financi\\u00e8re\",\"annee\":\"2024\",\"numero_chassis\":\"49809FG98CN00X\",\"nb_places\":5,\"ville\":\"LIBREVILLE\",\"affectation\":\"ESCORTE\\/TF\",\"responsable_du_vehicule\":null,\"kilometrage\":0,\"date_maj_km\":\"2026-10-20\",\"statut\":\"disponible\",\"couleur\":\"Blanche\",\"date_acquisition\":\"2024-09-03\",\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"consommation_moyenne\":\"25.00\",\"km_prochaine_vidange\":130000,\"km_prochaine_revision\":null,\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null}', '{\"marque\":\"DAIHATSU TERIOS\",\"modele\":\"TERRIOS\",\"categorie\":\"J210 GL\",\"direction\":\"Direction Administrative et Financi\\u00e8re\",\"annee\":\"2024\",\"numero_chassis\":\"49809FG98CN00X\",\"nb_places\":5,\"ville\":\"LIBREVILLE\",\"affectation\":\"ESCORTE\\/TF\",\"responsable_du_vehicule\":null,\"kilometrage\":43490,\"date_maj_km\":\"2026-10-20\",\"statut\":\"disponible\",\"couleur\":\"Blanche\",\"date_acquisition\":\"2024-09-03\",\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"consommation_moyenne\":25,\"km_prochaine_vidange\":130000,\"km_prochaine_revision\":null,\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 19:03:21'),
(127, 1, 'UPDATE', 'Changement de statut du véhicule ABG-325 AA : disponible → disponible', 'vehicules', 'ABG-325 AA', '{\"marque\":\"DAIHATSU TERIOS\",\"modele\":\"TERRIOS\",\"categorie\":\"J210 GL\",\"direction\":\"Direction Administrative et Financi\\u00e8re\",\"annee\":\"2024\",\"numero_chassis\":\"49809FG98CN00X\",\"nb_places\":5,\"ville\":\"LIBREVILLE\",\"affectation\":\"ESCORTE\\/TF\",\"responsable_du_vehicule\":null,\"kilometrage\":43490,\"date_maj_km\":\"2026-10-20\",\"statut\":\"disponible\",\"couleur\":\"Blanche\",\"date_acquisition\":\"2024-09-03\",\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"consommation_moyenne\":\"25.00\",\"km_prochaine_vidange\":130000,\"km_prochaine_revision\":null,\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null}', '{\"marque\":\"DAIHATSU TERIOS\",\"modele\":\"TERRIOS\",\"categorie\":\"J210 GL\",\"direction\":\"Direction Administrative et Financi\\u00e8re\",\"annee\":\"2024\",\"numero_chassis\":\"49809FG98CN00X\",\"nb_places\":5,\"ville\":\"LIBREVILLE\",\"affectation\":\"ESCORTE\\/TF\",\"responsable_du_vehicule\":\"Boris LIPOT DSI\",\"kilometrage\":43490,\"date_maj_km\":\"2026-10-20\",\"statut\":\"disponible\",\"couleur\":\"Blanche\",\"date_acquisition\":\"2024-09-03\",\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"consommation_moyenne\":25,\"km_prochaine_vidange\":130000,\"km_prochaine_revision\":null,\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 19:06:55'),
(128, 1, 'UPDATE', 'Changement de statut du véhicule ABG-325 AA : disponible → disponible', 'vehicules', 'ABG-325 AA', '{\"marque\":\"DAIHATSU TERIOS\",\"modele\":\"TERRIOS\",\"categorie\":\"J210 GL\",\"direction\":\"Direction Administrative et Financi\\u00e8re\",\"annee\":\"2024\",\"numero_chassis\":\"49809FG98CN00X\",\"nb_places\":5,\"ville\":\"LIBREVILLE\",\"affectation\":\"ESCORTE\\/TF\",\"responsable_du_vehicule\":\"Boris LIPOT DSI\",\"kilometrage\":43490,\"date_maj_km\":\"2026-10-20\",\"statut\":\"disponible\",\"couleur\":\"Blanche\",\"date_acquisition\":\"2024-09-03\",\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"consommation_moyenne\":\"25.00\",\"km_prochaine_vidange\":130000,\"km_prochaine_revision\":null,\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null}', '{\"marque\":\"DAIHATSU TERIOS\",\"modele\":\"TERRIOS\",\"categorie\":\"J210 GL\",\"direction\":\"Direction de Syst\\u00e8me d\'information\",\"annee\":\"2024\",\"numero_chassis\":\"49809FG98CN00X\",\"nb_places\":5,\"ville\":\"LIBREVILLE\",\"affectation\":\"ESCORTE\\/TF\",\"responsable_du_vehicule\":\"Boris LIPOT DSI\",\"kilometrage\":43490,\"date_maj_km\":\"2026-10-20\",\"statut\":\"disponible\",\"couleur\":\"Blanche\",\"date_acquisition\":\"2024-09-03\",\"cout_acquisition\":\"1445000.00\",\"valeur_residuelle\":null,\"consommation_moyenne\":25,\"km_prochaine_vidange\":130000,\"km_prochaine_revision\":null,\"date_expiration_assurance\":null,\"date_expiration_visite_technique\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 19:07:17'),
(129, 1, 'CREATE', 'Ajout du document \"Carte Rose ABG-325 AA\" (Carte grise) pour le véhicule ABG-325 AA', 'documents_vehicules', '38', NULL, '{\"id\":38,\"vehicule_immatriculation\":\"ABG-325 AA\",\"type_document\":\"Carte grise\",\"nom_document\":\"Carte Rose ABG-325 AA\",\"chemin_fichier\":\"upload\\/admin\\/document\\/vehicules\\/7c7cdd4b-e19c-40c3-b8e2-dec0e99bfff0.docx\",\"compagnie_assurance\":null,\"numero_contrat\":null,\"type_couverture\":null,\"montant_prime\":null,\"date_emission\":\"2026-01-27\",\"date_expiration\":null,\"telecharge_par_user_id\":1,\"notes\":null,\"est_supprime\":0,\"date_creation\":\"2026-10-20 20:08:56\",\"date_modification\":\"2026-10-20 20:08:56\",\"date_suppression\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 19:08:56'),
(130, 1, 'CREATE', 'Ajout du document \"Instecteur ABG-325 AA\" (Instecteur) pour le véhicule ABG-325 AA', 'documents_vehicules', '39', NULL, '{\"id\":39,\"vehicule_immatriculation\":\"ABG-325 AA\",\"type_document\":\"Instecteur\",\"nom_document\":\"Instecteur ABG-325 AA\",\"chemin_fichier\":\"upload\\/admin\\/document\\/vehicules\\/0ae82553-1ba6-493b-b632-d6135d5baf77.pdf\",\"compagnie_assurance\":null,\"numero_contrat\":null,\"type_couverture\":null,\"montant_prime\":null,\"date_emission\":\"2026-01-29\",\"date_expiration\":\"2026-10-25\",\"telecharge_par_user_id\":1,\"notes\":null,\"est_supprime\":0,\"date_creation\":\"2026-10-20 20:12:01\",\"date_modification\":\"2026-10-20 20:12:01\",\"date_suppression\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 19:12:01'),
(131, 1, 'UPDATE', 'Modification du document \"Carte Rose ABG-325 AA\" du véhicule ABG-325 AA', 'documents_vehicules', '38', '{\"id\":38,\"vehicule_immatriculation\":\"ABG-325 AA\",\"type_document\":\"Carte grise\",\"nom_document\":\"Carte Rose ABG-325 AA\",\"chemin_fichier\":\"upload\\/admin\\/document\\/vehicules\\/7c7cdd4b-e19c-40c3-b8e2-dec0e99bfff0.docx\",\"compagnie_assurance\":null,\"numero_contrat\":null,\"type_couverture\":null,\"montant_prime\":null,\"date_emission\":\"2026-01-27\",\"date_expiration\":null,\"telecharge_par_user_id\":1,\"notes\":null,\"est_supprime\":0,\"date_creation\":\"2026-10-20 20:08:56\",\"date_modification\":\"2026-10-20 20:08:56\",\"date_suppression\":null}', '{\"type_document\":\"Carte grise\",\"nom_document\":\"Carte Rose ABG-325 AA\",\"compagnie_assurance\":null,\"numero_contrat\":null,\"type_couverture\":null,\"montant_prime\":null,\"date_emission\":\"2026-01-27\",\"date_expiration\":null,\"notes\":\"RAS\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 19:12:30'),
(132, 1, 'CREATE', 'Ajout du document \"Carte rose BG-325 AA\" (Carte grise) pour le véhicule ABG-325 AA', 'documents_vehicules', '40', NULL, '{\"id\":40,\"vehicule_immatriculation\":\"ABG-325 AA\",\"type_document\":\"Carte grise\",\"nom_document\":\"Carte rose BG-325 AA\",\"chemin_fichier\":\"upload\\/admin\\/document\\/vehicules\\/fb911682-c0d0-4a32-8b88-76d1557cf88e.pdf\",\"compagnie_assurance\":null,\"numero_contrat\":null,\"type_couverture\":null,\"montant_prime\":null,\"date_emission\":\"2026-10-20\",\"date_expiration\":null,\"telecharge_par_user_id\":1,\"notes\":null,\"est_supprime\":0,\"date_creation\":\"2026-10-20 20:13:41\",\"date_modification\":\"2026-10-20 20:13:41\",\"date_suppression\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 19:13:41'),
(133, 1, 'CREATE', 'Ajout du document \"RAS ABG-325 AA\" (Instecteur) pour le véhicule ABG-325 AA', 'documents_vehicules', '41', NULL, '{\"id\":41,\"vehicule_immatriculation\":\"ABG-325 AA\",\"type_document\":\"Instecteur\",\"nom_document\":\"RAS ABG-325 AA\",\"chemin_fichier\":\"upload\\/admin\\/document\\/vehicules\\/9dd2c094-38bf-4d4f-bf00-b4a43f43ffac.pdf\",\"compagnie_assurance\":null,\"numero_contrat\":null,\"type_couverture\":null,\"montant_prime\":null,\"date_emission\":\"2026-10-20\",\"date_expiration\":null,\"telecharge_par_user_id\":1,\"notes\":null,\"est_supprime\":0,\"date_creation\":\"2026-10-20 20:14:33\",\"date_modification\":\"2026-10-20 20:14:33\",\"date_suppression\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 19:14:33'),
(134, 1, 'DELETE', 'Suppression du document \"RAS ABG-325 AA\" du véhicule ABG-325 AA', 'documents_vehicules', '41', '{\"id\":41,\"vehicule_immatriculation\":\"ABG-325 AA\",\"type_document\":\"Instecteur\",\"nom_document\":\"RAS ABG-325 AA\",\"chemin_fichier\":\"upload\\/admin\\/document\\/vehicules\\/9dd2c094-38bf-4d4f-bf00-b4a43f43ffac.pdf\",\"compagnie_assurance\":null,\"numero_contrat\":null,\"type_couverture\":null,\"montant_prime\":null,\"date_emission\":\"2026-10-20\",\"date_expiration\":null,\"telecharge_par_user_id\":1,\"notes\":null,\"est_supprime\":0,\"date_creation\":\"2026-10-20 20:14:33\",\"date_modification\":\"2026-10-20 20:14:33\",\"date_suppression\":null}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-20 19:16:38'),
(135, 1, 'CREATE', 'Création intervention #1 (interne) pour CX 032 AA', 'interventions', '1', NULL, '{\"nature\":\"interne\",\"immat\":\"CX 032 AA\",\"demandes\":[15],\"statut\":\"terminee\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-21 12:43:22'),
(136, 1, 'CREATE', 'Création intervention #2 (externe) pour JM 562 AA', 'interventions', '2', NULL, '{\"nature\":\"externe\",\"immat\":\"JM 562 AA\",\"demandes\":[14],\"statut\":\"terminee\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', '2026-10-21 12:53:48');
INSERT INTO `journaux_audit` (`id`, `user_id`, `action`, `libelle`, `nom_table`, `id_enregistrement`, `anciennes_valeurs`, `nouvelles_valeurs`, `adresse_ip`, `user_agent`, `date_creation`) VALUES
(137, 5, 'UPDATE', 'Changement de rôle de DJYEMBI Hulas Brily : Administrateur → Daal', 'utilisateurs', '1', '{\"nom\":\"DJYEMBI Hulas Brily\",\"email\":\"hulas.djyembi@sgs-gabon.com\",\"role\":\"Administrateur\",\"direction\":\"Direction de Syst\\u00e8me d\'information\"}', '{\"nom\":\"DJYEMBI Hulas Brily\",\"email\":\"hulas.djyembi@sgs-gabon.com\",\"role\":\"Daal\",\"direction\":\"Direction de Syst\\u00e8me d\'information\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-21 12:58:33'),
(138, 5, 'CREATE', 'Approvisionnement de la caisse : +500 000 XAF (approvisionnenment)', 'mouvements_caisse', '7', NULL, '{\"type_mouvement\":\"approvisionnement\",\"montant\":500000,\"libelle\":\"approvisionnenment\",\"solde_apres\":2001100}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-22 09:20:37'),
(139, 5, 'CREATE', 'Ajout de l\'outil « Pneu »', 'outils', '2', NULL, '{\"id\":2,\"nom\":\"Pneu\",\"type\":\"pieces\",\"categorie\":\"Pneumatique\",\"etat\":\"OK\",\"emplacement\":\"Amoir A3\",\"quantite_stock\":10,\"date_dernier_controle\":null,\"notes\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-22 09:30:58'),
(140, 5, 'UPDATE', 'Modification de l\'outil « Huil de direction »', 'outils', '1', '{\"nom\":\"gegegge\",\"type\":\"piecese\"}', '{\"nom\":\"Huil de direction\",\"type\":\"Bidon\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-22 09:32:12'),
(141, 5, 'UPDATE', 'Modification de l\'outil « Huil de direction »', 'outils', '1', '{\"categorie\":\"Pneumatique\"}', '{\"categorie\":\"Outillage m\\u00e9canique\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-22 09:32:27'),
(142, 5, 'CREATE', 'Création intervention #3 (externe) pour FM 609 AA', 'interventions', '3', NULL, '{\"nature\":\"externe\",\"immat\":\"FM 609 AA\",\"demandes\":[\"13\"],\"statut\":\"terminee\",\"statut_vehicule\":null,\"intervenants\":[\"\\/MOUSSAVOU BASSE \\/ Garage de Toyta GABON\"],\"facture\":true}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-22 09:47:02'),
(143, 5, 'CREATE', 'Création intervention #4 (externe) pour FM 609 AA', 'interventions', '4', NULL, '{\"nature\":\"externe\",\"immat\":\"FM 609 AA\",\"demandes\":[1],\"statut\":\"terminee\",\"statut_vehicule\":\"disponible\",\"intervenants\":[\"ABA DONG \\/ Bernab\\u00e9 GAbon\"],\"facture\":false}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-22 09:47:04'),
(144, 5, 'UPDATE', 'Annulation par contre-passation du mouvement #8 (sortie, 150 000 XAF)', 'mouvements_caisse', '8', '{\"est_annule\":false}', '{\"est_annule\":true,\"annule_par_mouvement_id\":10}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-22 09:51:07'),
(145, 5, 'UPDATE', 'Changement de rôle de DJYEMBI Hulas Brily : Daal → Gestionnaire du Parc', 'utilisateurs', '1', '{\"nom\":\"DJYEMBI Hulas Brily\",\"email\":\"hulas.djyembi@sgs-gabon.com\",\"role\":\"Daal\",\"direction\":\"Direction de Syst\\u00e8me d\'information\"}', '{\"nom\":\"DJYEMBI Hulas Brily\",\"email\":\"hulas.djyembi@sgs-gabon.com\",\"role\":\"Gestionnaire du Parc\",\"direction\":\"Direction de Syst\\u00e8me d\'information\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-22 13:44:26');

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
(3, 'CX 032 AA', 2026, 10, 0, 0, 58, 0, 0, 0, 1, 1395.07, 0.00, 0.00, 48900.00, NULL, 0, 0, '2026-10-21 12:43:22'),
(4, 'JM 562 AA', 2026, 10, 0, 0, 53, 0, 0, 0, 1, 1273.03, 0.00, 234000.00, 0.00, NULL, 0, 0, '2026-10-21 12:53:48'),
(5, 'FM 609 AA', 2026, 10, 0, 0, 58, 0, 0, 0, 2, 1392.00, 0.00, 495000.00, 475000.00, NULL, 0, 0, '2026-10-22 09:47:02');

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
(9, 'TOYOTA', NULL, 0, '2026-05-07 09:01:16', '2026-05-07 09:06:05', '2026-05-07 09:06:05'),
(10, 'SUZIKI', NULL, 1, '2026-05-07 09:04:55', '2026-05-07 09:04:55', NULL),
(11, 'KIA', NULL, 1, '2026-05-07 09:05:47', '2026-05-07 09:05:47', NULL),
(12, 'TOYOYA', NULL, 1, '2026-05-07 09:06:22', '2026-05-07 09:06:22', NULL),
(13, 'ZX AUTO', NULL, 1, '2026-05-07 09:34:05', '2026-05-07 09:34:05', NULL),
(14, 'RENAULT', NULL, 1, '2026-05-07 09:36:47', '2026-05-07 09:36:47', NULL),
(15, 'PEUGEOT', NULL, 1, '2026-05-07 09:39:00', '2026-05-07 09:39:00', NULL),
(16, 'MITSUBISHI', NULL, 1, '2026-07-22 11:43:10', '2026-07-22 11:43:10', NULL),
(17, 'FIAT', NULL, 1, '2026-07-28 13:32:38', '2026-07-28 13:32:38', NULL),
(18, 'DAIHATSU TERIOS', NULL, 1, '2026-08-28 08:45:23', '2026-08-28 08:45:23', NULL);

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
(55, '2026_01_15_114329_add_relations_to_vehicules_table', 19),
(56, '2026_04_18_add_date_changement_mdp_to_utilisateurs', 20),
(57, '2026_04_22_092001_add_ville_to_vehicules_table', 21),
(58, '2026_04_27_064203_add_chauffeur_fields_to_utilisateurs', 22),
(59, '2026_05_15_132433_2026_05_13_071246_remplacer_elements_inspectes_par_inspection_elements', 23),
(60, '2026_05_15_132514_2026_05_13_075930_create_accessoires_table', 23),
(61, '2026_05_15_132605_2026_05_13_080008_ajouter_fk_accessoire_et_vehicule_sur_inspections', 23),
(62, '2026_05_28_084340_create_affectations_and_update_vehicules', 24),
(63, '2026_06_04_091530_create_2026_05_28_083003_create_affectations_and_update_vehicules', 25),
(64, '2026_06_04_091602_creat_2026_06_01_102225_create_historique_affectations_table', 25),
(65, '2026_07_24_074202_modify_partie_vehicule_column_in_anomalies_table', 26),
(66, '2026_09_16_092924_create_historique_connexions_table', 27),
(67, '2026_10_13_124305_create_demandes_intervention', 28),
(68, '2026_10_14_150000_add_matricule_demande_to_interventions', 29),
(69, '2026_10_14_150000_add_matricule_demande_to_interventions', 30),
(70, '2026_10_20_000001_upgrade_module_interventions', 31),
(71, '2026_10_21_000002_add_quantite_stock_and_intervention_outils', 32);

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
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(11, 12, 15, 'HILUX', 5, NULL, NULL, NULL, 1, '2026-05-07 09:09:49', '2026-05-07 09:09:49', NULL),
(12, 11, 18, 'SORENTO', 5, NULL, NULL, NULL, 1, '2026-05-07 09:30:27', '2026-05-07 09:30:27', NULL),
(13, 13, 15, 'GRAND TIGER', 5, NULL, NULL, NULL, 1, '2026-05-07 09:34:27', '2026-05-07 09:34:27', NULL),
(14, 13, 15, 'TERRALORD', 5, NULL, NULL, NULL, 1, '2026-05-07 09:35:17', '2026-05-07 09:35:17', NULL),
(15, 12, 18, 'RAV 4 III', 5, NULL, NULL, NULL, 1, '2026-05-07 09:35:54', '2026-05-07 09:35:54', NULL),
(16, 12, 18, 'FORTUNER', 5, NULL, NULL, NULL, 1, '2026-05-07 09:36:19', '2026-05-07 09:36:19', NULL),
(17, 14, 18, 'DUSTER', 5, NULL, NULL, NULL, 1, '2026-05-07 09:37:18', '2026-05-07 09:37:18', NULL),
(18, 15, 18, '3008', 5, NULL, NULL, NULL, 1, '2026-05-07 09:39:23', '2026-05-07 09:39:23', NULL),
(19, 12, 18, 'STARLET', 5, NULL, NULL, NULL, 1, '2026-05-15 08:04:01', '2026-05-15 08:04:01', NULL),
(20, 14, 18, 'LOGAN', 5, NULL, NULL, NULL, 1, '2026-05-18 09:34:39', '2026-05-18 09:34:39', NULL),
(21, 11, 18, 'SPORTAGE', 5, NULL, NULL, NULL, 1, '2026-05-29 12:41:05', '2026-05-29 12:41:05', NULL),
(22, 16, 15, 'L200', 5, NULL, NULL, NULL, 1, '2026-07-22 11:43:59', '2026-07-22 11:43:59', NULL),
(23, 12, 15, 'HILUX GUN 125', 5, NULL, NULL, NULL, 1, '2026-07-22 11:44:57', '2026-07-22 11:44:57', NULL),
(24, 10, 18, 'GRAND VITARA', 5, NULL, NULL, NULL, 1, '2026-07-24 07:39:10', '2026-07-24 07:39:10', NULL),
(25, 10, 18, 'SWIFT', 5, NULL, NULL, NULL, 1, '2026-07-24 07:39:41', '2026-07-24 07:39:41', NULL),
(26, 11, 18, 'SONET', 5, NULL, NULL, NULL, 1, '2026-07-24 07:40:34', '2026-07-24 07:40:34', NULL),
(27, 14, 18, 'OROCK', 5, NULL, NULL, NULL, 1, '2026-07-28 13:01:37', '2026-07-28 13:01:37', NULL),
(28, 14, 18, 'KOLEOS', 5, NULL, NULL, NULL, 1, '2026-07-28 13:17:54', '2026-07-28 13:17:54', NULL),
(29, 17, 15, 'FULL BACK', 5, NULL, NULL, NULL, 1, '2026-07-28 13:32:58', '2026-07-28 13:32:58', NULL),
(30, 16, 18, 'PAJERO GLX', 5, NULL, NULL, NULL, 1, '2026-07-28 13:42:23', '2026-07-28 13:42:23', NULL),
(31, 18, 20, 'TERRIOS', 5, NULL, NULL, NULL, 1, '2026-08-28 08:49:34', '2026-08-28 08:49:34', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `mouvements_caisse`
--

CREATE TABLE `mouvements_caisse` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `periode_caisse_id` bigint(20) UNSIGNED DEFAULT NULL,
  `type_mouvement` varchar(20) NOT NULL COMMENT 'approvisionnement | sortie | contre_passation',
  `montant` decimal(14,2) NOT NULL,
  `solde_apres` decimal(14,2) NOT NULL DEFAULT 0.00,
  `libelle` varchar(255) DEFAULT NULL,
  `article` text DEFAULT NULL,
  `fournisseur_id` bigint(20) UNSIGNED DEFAULT NULL,
  `vehicule_immatriculation` varchar(30) DEFAULT NULL,
  `intervention_id` bigint(20) UNSIGNED DEFAULT NULL,
  `piece_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Pièce achetée avec ce mouvement',
  `chemin_justificatif` varchar(255) DEFAULT NULL,
  `annule_par_mouvement_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Pointe vers le mouvement de contre-passation',
  `est_annule` tinyint(1) NOT NULL DEFAULT 0,
  `cree_par_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `date_mouvement` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `mouvements_caisse`
--

INSERT INTO `mouvements_caisse` (`id`, `periode_caisse_id`, `type_mouvement`, `montant`, `solde_apres`, `libelle`, `article`, `fournisseur_id`, `vehicule_immatriculation`, `intervention_id`, `piece_id`, `chemin_justificatif`, `annule_par_mouvement_id`, `est_annule`, `cree_par_user_id`, `date_mouvement`, `date_creation`) VALUES
(2, 2, 'approvisionnement', 500000.00, 500000.00, 'Approvisionnement', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-10-21 08:44:03', '2026-10-21 08:44:03'),
(3, 2, 'approvisionnement', 50000.00, 550000.00, 'Pièces', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-10-21 08:50:07', '2026-10-21 08:50:07'),
(4, 2, 'approvisionnement', 1000000.00, 1550000.00, 'Pièces', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-10-21 10:47:31', '2026-10-21 10:47:31'),
(5, 2, 'sortie', 23900.00, 1526100.00, 'Achat pièce: Achat du disk d\'ambruillage (23 900 XAF)', 'Achat du disk d\'ambruillage', NULL, 'CX 032 AA', 1, NULL, NULL, NULL, 0, 1, '2026-10-21 12:43:22', '2026-10-21 12:43:22'),
(6, 2, 'sortie', 25000.00, 1501100.00, 'Achat pièce: Avaht du radiateur (25 000 XAF)', 'Avaht du radiateur', NULL, 'CX 032 AA', 1, NULL, NULL, NULL, 0, 1, '2026-10-21 12:43:22', '2026-10-21 12:43:22'),
(7, 2, 'approvisionnement', 500000.00, 2001100.00, 'approvisionnenment', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 5, '2026-10-22 09:20:37', '2026-10-22 09:20:37'),
(8, 2, 'sortie', 150000.00, 1851100.00, 'Achat pièce: Achat du radiateur (150 000 XAF)', 'Achat du radiateur', NULL, 'FM 609 AA', 3, NULL, NULL, 10, 1, 5, '2026-10-22 09:47:02', '2026-10-22 09:47:02'),
(9, 2, 'sortie', 325000.00, 1526100.00, 'Achat pièce: Achat du  disque d\'ambrouillage (325 000 XAF)', 'Achat du  disque d\'ambrouillage', NULL, 'FM 609 AA', 3, NULL, NULL, NULL, 0, 5, '2026-10-22 09:47:02', '2026-10-22 09:47:02'),
(10, 2, 'contre_passation', 150000.00, 1676100.00, 'Contre-passation du mouvement #8 : Achat pièce: Achat du radiateur (150 000 XAF)', 'Annulation de l\'écriture #8', NULL, 'FM 609 AA', 3, NULL, NULL, NULL, 0, 5, '2026-10-22 09:51:07', '2026-10-22 09:51:07');

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

--
-- Déchargement des données de la table `mouvements_stock`
--

INSERT INTO `mouvements_stock` (`id`, `piece_id`, `type_mouvement`, `quantite`, `prix_unitaire`, `type_reference`, `reference_id`, `effectue_par_user_id`, `fournisseur_id`, `notes`, `chemin_document`, `date_creation`) VALUES
(1, 1, 'entree', 40.00, 500.00, 'stock_initial', 1, 1, 1, 'Stock initial à la création de la fiche', NULL, '2026-10-05 09:24:13'),
(2, 1, 'entree', 30.00, 500.00, 'reapprovisionnement', 1, 1, 1, NULL, NULL, '2026-10-05 09:31:27');

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
  `donnees` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `lien_url` varchar(255) DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `notifications`
--

INSERT INTO `notifications` (`id`, `categorie_id`, `titre`, `message`, `vehicule_immatriculation`, `donnees`, `lien_url`, `date_creation`) VALUES
(4, 3, 'Nouvelle demande d\'intervention externe — DEM-00001', 'Véhicule FM 609 AA · Vidange · priorité haute. Validation ou rejet attendu du DAAL.', 'FM 609 AA', '{\"demande_id\":1,\"reference\":\"DEM-00001\",\"nature\":\"externe\"}', '/Admin/Navigation/DemandesIntervention', '2026-10-13 13:53:16'),
(5, 3, 'Nouvelle demande d\'intervention externe — DEM-00005', 'Véhicule FM 610 AA · Vidange · priorité haute. Validation ou rejet attendu du DAAL.', 'FM 610 AA', '{\"demande_id\":5,\"reference\":\"DEM-00005\",\"nature\":\"externe\"}', '/Admin/Navigation/DemandesIntervention', '2026-10-14 09:50:02'),
(6, 3, 'Nouvelle demande d\'intervention externe — DEM-00012', 'Véhicule CX 032 AA · Refroidissement · priorité haute. Validation ou rejet attendu du DAAL.', 'CX 032 AA', '{\"demande_id\":12,\"reference\":\"DEM-00012\",\"matricule_demande\":\"DEM-00012\",\"nature\":\"externe\"}', '/Admin/Navigation/DemandesIntervention', '2026-10-15 12:35:08'),
(7, 3, 'Nouvelle demande d\'intervention externe — DEM-00013', 'Véhicule FM 609 AA · Transmission · priorité urgente. Validation ou rejet attendu du DAAL.', 'FM 609 AA', '{\"demande_id\":13,\"reference\":\"DEM-00013\",\"matricule_demande\":\"DEM-00013\",\"nature\":\"externe\"}', '/Admin/Navigation/DemandesIntervention', '2026-10-15 12:37:37'),
(8, 3, 'Nouvelle demande d\'intervention externe — DEM-00014', 'Véhicule JM 562 AA · Courroie distribution · priorité haute. Validation ou rejet attendu du DAAL.', 'JM 562 AA', '{\"demande_id\":14,\"reference\":\"DEM-00014\",\"matricule_demande\":\"DEM-00014\",\"nature\":\"externe\"}', '/Admin/Navigation/DemandesIntervention', '2026-10-15 12:55:13');

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
  `quantite_stock` int(11) NOT NULL DEFAULT 10 COMMENT 'Quantité disponible en stock dans l''atelier',
  `date_dernier_controle` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `outils`
--

INSERT INTO `outils` (`id`, `nom`, `type`, `categorie`, `etat`, `emplacement`, `quantite_stock`, `date_dernier_controle`, `notes`, `est_supprime`, `date_creation`, `date_modification`, `date_suppression`) VALUES
(1, 'Huil de direction', 'Bidon', 'Outillage mécanique', 'OK', 'Armoire A2', 8, '2026-10-05', NULL, 0, '2026-10-05 09:22:35', '2026-10-22 09:47:02', NULL),
(2, 'Pneu', 'pieces', 'Pneumatique', 'OK', 'Amoir A3', 10, NULL, NULL, 0, '2026-10-22 09:30:58', '2026-10-22 09:30:58', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `outils_intervention`
--

CREATE TABLE `outils_intervention` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `intervention_id` bigint(20) UNSIGNED NOT NULL,
  `outil_id` bigint(20) UNSIGNED NOT NULL,
  `quantite` int(11) NOT NULL DEFAULT 1 COMMENT 'Quantité de cet outil utilisée lors de l''intervention',
  `notes` text DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `outils_intervention`
--

INSERT INTO `outils_intervention` (`id`, `intervention_id`, `outil_id`, `quantite`, `notes`, `date_creation`) VALUES
(1, 1, 1, 1, NULL, '2026-10-21 12:43:22'),
(2, 3, 1, 1, 'Une seule bouteille prise', '2026-10-22 09:47:02');

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
  `id` bigint(20) UNSIGNED NOT NULL,
  `valeur` varchar(100) NOT NULL COMMENT 'Nom du thème actif ex: orange, blue, green...',
  `couleur` varchar(20) NOT NULL COMMENT 'Couleur hex principale ex: #ffc400',
  `primaryLight` varchar(20) DEFAULT NULL,
  `primaryDark` varchar(20) DEFAULT NULL,
  `modifie_par_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `est_applique` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `parametres_systeme`
--

INSERT INTO `parametres_systeme` (`id`, `valeur`, `couleur`, `primaryLight`, `primaryDark`, `modifie_par_user_id`, `date_creation`, `date_modification`, `est_applique`) VALUES
(1, '#ffc400', 'Orange Classique', '#ffe066', '#e6a800', 1, '2026-05-19 13:34:15', '2026-10-13 14:21:52', 0),
(12, '#64748b', 'Ardoise Sobre', '#cbd5e1', '#475569', 1, '2026-05-19 12:35:43', '2026-10-13 14:21:52', 0),
(13, '#14b8a6', 'Turquoise Frais', '#99f6e4', '#0d9488', 1, '2026-05-19 12:36:02', '2026-10-13 14:21:52', 0),
(14, '#f59e0b', 'Ambre Chaleureux', '#fde68a', '#d97706', 1, '2026-05-19 12:37:55', '2026-10-13 14:21:52', 0),
(15, '#10b981', 'Vert Nature', '#a7f3d0', '#059669', 1, '2026-05-19 12:39:05', '2026-10-13 14:21:52', 0),
(16, '#8b5cf6', 'Violet Moderne', '#ddd6fe', '#6d28d9', 1, '2026-05-19 12:39:20', '2026-10-13 14:21:52', 0),
(18, '#ffd851', 'Thème Personnalisé', '#ffcd06', '#e6a800', 1, '2026-05-19 12:42:29', '2026-10-13 14:21:52', 0),
(19, '#06b6d4', 'Cyan Technologique', '#a5f3fc', '#0891b2', 1, '2026-05-19 13:03:24', '2026-10-13 14:21:52', 0),
(20, '#ffc400', 'Orange Classique', '#ffe066', '#e6a800', 1, '2026-07-15 13:02:13', '2026-10-13 14:21:52', 0),
(21, '#14b8a6', 'Turquoise Frais', '#99f6e4', '#0d9488', 1, '2026-08-05 13:32:56', '2026-10-13 14:21:52', 1),
(23, '#ffc400', 'Orange Classique', '#ffe066', '#e6a800', 1, '2026-08-13 11:24:36', '2026-10-13 14:21:52', 0),
(24, '#004040', 'Thème Personnalisé', '#008080', '#0d9488', 1, '2026-08-28 09:50:10', '2026-10-13 14:21:52', 0);

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
  `checklist_avant` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `photos_avant` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `observations_depart` text DEFAULT NULL,
  `date_heure_retour` datetime DEFAULT NULL,
  `km_retour` bigint(20) UNSIGNED DEFAULT NULL,
  `niveau_carburant_retour` varchar(50) DEFAULT NULL,
  `checklist_apres` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `photos_apres` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
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

-- --------------------------------------------------------

--
-- Structure de la table `periodes_caisse`
--

CREATE TABLE `periodes_caisse` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `annee` smallint(5) UNSIGNED NOT NULL,
  `mois` tinyint(3) UNSIGNED NOT NULL,
  `solde_ouverture` decimal(14,2) NOT NULL DEFAULT 0.00,
  `solde_cloture` decimal(14,2) DEFAULT NULL COMMENT 'Calculé à la clôture du mois',
  `est_cloture` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `periodes_caisse`
--

INSERT INTO `periodes_caisse` (`id`, `annee`, `mois`, `solde_ouverture`, `solde_cloture`, `est_cloture`, `date_creation`, `date_modification`) VALUES
(2, 2026, 10, 0.00, NULL, 0, '2026-10-21 08:44:03', '2026-10-21 08:44:03');

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
(154, 'App\\Models\\Utilisateur', 14, 'auth_token', '13124681bc22b4a8b7a48cc2d5dede34d14894f5368c2d527c0637662a230e5a', '[\"*\"]', '2026-04-29 13:24:48', '2026-04-29 15:17:43', '2026-04-29 13:17:43', '2026-04-29 13:24:48'),
(156, 'App\\Models\\Utilisateur', 14, 'auth_token', 'e58d25dc45ca04bc4035605148da8fa036064bba721eeb096f42f1e6cfe1f9d9', '[\"*\"]', '2026-05-02 08:56:15', '2026-05-02 10:53:33', '2026-05-02 08:53:33', '2026-05-02 08:56:15'),
(165, 'App\\Models\\Utilisateur', 15, 'auth_token', '0484d70d2b585d7af7acc09d7d570a6cee85f9de1eb30274cc5ad7cd7b3a9e50', '[\"*\"]', '2026-05-06 07:17:41', '2026-05-06 09:16:57', '2026-05-06 07:16:57', '2026-05-06 07:17:41'),
(170, 'App\\Models\\Utilisateur', 16, 'auth_token', '0e357fd1e005b21e8a1e49eb99c7eb533421f20895700d0326379acf79d308a8', '[\"*\"]', '2026-05-06 09:09:19', '2026-05-06 10:49:01', '2026-05-06 08:49:01', '2026-05-06 09:09:19'),
(172, 'App\\Models\\Utilisateur', 16, 'auth_token', 'd9c470088ee01e6eebcbb8944a29d781817bb09109163b06b3b1edfa0af4fea7', '[\"*\"]', '2026-05-07 09:16:18', '2026-05-07 09:20:58', '2026-05-07 07:20:58', '2026-05-07 09:16:18'),
(174, 'App\\Models\\Utilisateur', 16, 'auth_token', '1c9224f96a6210e43b7d078c578ea35e3e986cbc4636b671ff3d363e96042355', '[\"*\"]', '2026-05-07 09:39:27', '2026-05-07 11:27:49', '2026-05-07 09:27:49', '2026-05-07 09:39:27'),
(229, 'App\\Models\\Utilisateur', 4, 'auth_token', '7cda489a60347081ff926d593d35b2ed9c879d4d032732bb7fea28af86ed3cd9', '[\"*\"]', '2026-06-15 11:02:30', '2026-06-15 13:00:51', '2026-06-15 11:00:51', '2026-06-15 11:02:30'),
(233, 'App\\Models\\Utilisateur', 4, 'auth_token', 'e26f2e1e813ffda9ed851d6a70b69844a372ae73a3b2a825d0b80a709f62fa29', '[\"*\"]', '2026-06-22 13:17:13', '2026-06-22 15:12:10', '2026-06-22 13:12:10', '2026-06-22 13:17:13'),
(374, 'App\\Models\\Utilisateur', 5, 'auth_token', 'ed596094a3d7a41f713632cb6b7f5400fed0a68cfebea09cfafa48db85454d0a', '[\"*\"]', '2026-10-23 09:35:59', '2026-10-23 11:35:49', '2026-10-23 09:35:49', '2026-10-23 09:35:59');

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
-- Déchargement des données de la table `pieces_detachees`
--

INSERT INTO `pieces_detachees` (`id`, `sku`, `nom`, `type_piece`, `description`, `quantite_stock`, `seuil_alerte`, `unite`, `prix_unitaire`, `fournisseur_id`, `emplacement`, `est_actif`, `est_supprime`, `date_creation`, `date_modification`, `date_suppression`) VALUES
(1, 'FLT-012', 'Filtre à huils', 'Filtre', 'ddsdds', 70.00, 5.00, 'litre', 500.00, 1, 'Magazin', 1, 0, '2026-10-05 09:24:13', '2026-10-05 09:31:27', NULL);

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
                    CONCAT("La pièce "", NEW.nom, "" a atteint le seuil d'alerte. Stock actuel: ", NEW.quantite_stock, " ", NEW.unite),
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
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
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
(1, 'admin', 'Administrateur', 'Accès complet aux systèmes', 0, '2026-01-07 09:11:16', '2026-04-09 13:53:24', NULL),
(2, 'chef_parc', 'Gestionnaire du Parc', 'Gestion globale parc automobile', 0, '2026-01-07 09:11:16', '2026-01-07 09:11:16', NULL),
(3, 'chef_tf', 'Chef Transport de Fonds', 'Gestion missions TF + chauffeurs TF', 0, '2026-01-07 09:11:16', '2026-01-07 09:11:16', NULL),
(4, 'agent_pc_radio', 'Agent PC Radio', 'Traçabilité remise/retour clés véhicules', 0, '2026-01-07 09:11:16', '2026-01-07 09:11:16', NULL),
(5, 'mecanicien', 'Mécanicien / Technicien', 'Interventions + Inspections techniques', 0, '2026-01-07 09:11:16', '2026-05-07 12:41:47', '2026-04-08 09:09:17'),
(6, 'chauffeur', 'Chauffeur', 'Exécution missions + signalement anomaliesrr', 0, '2026-01-07 09:11:16', '2026-05-07 12:41:41', NULL),
(7, 'daal', 'Daal', NULL, 0, '2026-10-12 11:41:29', '2026-10-13 09:59:39', NULL);

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
(1, 'Quotidienne', 'Inspection Quotidienne', NULL, NULL, 0, 0, 1, 0, '2026-03-30 09:15:58', '2026-05-12 09:48:04', NULL),
(2, 'Mensuelle', 'Inspection Mensuelle', NULL, NULL, 0, 0, 1, 0, '2026-05-12 09:36:52', '2026-05-12 09:36:52', NULL);

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
(1, 'Mécanicien', 'Mécanicien interne', 'Réparations moteur, transmission, freins', NULL, 1, 1, 0, '2026-03-25 10:23:16', '2026-05-12 09:46:34', NULL),
(2, 'Prestataire', 'Prestataire externe', 'Câblage, batterie, alternateur, électronique', NULL, 2, 1, 0, '2026-03-25 10:23:16', '2026-05-12 09:47:01', NULL),
(3, 'carrossier', 'Carrossier', 'Réparation et peinture carrosserie', NULL, 3, 0, 1, '2026-03-25 10:23:16', '2026-05-12 09:38:55', '2026-05-12 08:38:55'),
(4, 'pneumaticien', 'Pneumaticien', 'Montage, équilibrage et réparation pneus', NULL, 4, 0, 1, '2026-03-25 10:23:16', '2026-05-12 09:38:45', '2026-05-12 08:38:45'),
(5, 'climatiseur', 'Technicien Climatisation', 'Entretien et réparation climatisation', NULL, 5, 0, 1, '2026-03-25 10:23:16', '2026-05-12 09:37:24', '2026-05-12 08:37:24');

-- --------------------------------------------------------

--
-- Structure de la table `utilisateurs`
--

CREATE TABLE `utilisateurs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `date_changement_mdp` timestamp NULL DEFAULT NULL COMMENT 'Date du dernier changement de mot de passe. NULL = jamais changé.',
  `role_id` int(10) UNSIGNED NOT NULL,
  `direction_id` int(10) UNSIGNED DEFAULT NULL,
  `date_embauche` date DEFAULT NULL,
  `categories_permis` varchar(50) DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `derniere_connexion` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL,
  `mot_de_passe_expire_le` date NOT NULL DEFAULT '2025-01-01'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `utilisateurs`
--

INSERT INTO `utilisateurs` (`id`, `nom`, `email`, `mot_de_passe`, `date_changement_mdp`, `role_id`, `direction_id`, `date_embauche`, `categories_permis`, `est_actif`, `est_supprime`, `derniere_connexion`, `date_creation`, `date_modification`, `date_suppression`, `mot_de_passe_expire_le`) VALUES
(1, 'DJYEMBI Hulas Brily', 'hulas.djyembi@sgs-gabon.com', '$2y$12$bL.rWkDRvqhsVgyWknHxye4iBjbR2/BBbOd989jNy9KwcMzGfdNRu', '2026-08-25 07:17:37', 2, 1, NULL, NULL, 1, 0, '2026-10-22 12:45:49', '2026-01-07 11:05:58', '2026-10-22 13:44:26', NULL, '2026-04-20'),
(2, 'Claude BOULINGUI', 'priest.boulingui@sgs-gabon.com', '$2y$12$bL.rWkDRvqhsVgyWknHxye4iBjbR2/BBbOd989jNy9KwcMzGfdNRu', '2026-05-06 07:16:42', 2, 2, NULL, NULL, 1, 0, '2026-10-14 12:51:28', '2026-05-05 11:38:21', '2026-10-15 12:32:18', '2026-09-24 09:54:36', '2026-05-06'),
(3, 'MEKONTSO BEKALE Falone', 'f.mekontso@sgs-gabon.com', '$2y$12$rNW747Trvl7AXRc5S1ewlezcKbLJsQ/IjUfyiGDIQ4UqDxnnrqEnW', '2026-07-28 13:47:35', 2, 15, NULL, NULL, 1, 0, '2026-07-28 12:57:28', '2026-05-06 08:37:57', '2026-10-15 12:31:13', '2026-09-24 09:54:29', '2026-07-29'),
(4, 'Delprat DOUMATSANGA', 'd.doumatsanga@sgs-gabon.com', '$2y$12$8jrg1I69MjFriIjZ76CYaeLWvuZgYNN2Kw7smtrUrDNEZdF5A9RmC', '2026-05-07 10:02:05', 2, 15, NULL, NULL, 1, 0, '2026-06-22 13:12:10', '2026-05-07 09:54:57', '2026-09-25 07:42:28', '2026-09-24 09:54:22', '2026-05-08'),
(5, 'Boris LIPOT', 'b.lipot@sgs-gabon.com', '$2y$12$bL.rWkDRvqhsVgyWknHxye4iBjbR2/BBbOd989jNy9KwcMzGfdNRu', '2026-09-08 09:23:01', 1, 1, NULL, NULL, 1, 0, '2026-10-23 09:35:49', '2026-07-28 12:42:09', '2026-10-23 09:35:49', '2026-09-24 09:54:16', '2026-08-25');

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
  `ville` varchar(100) DEFAULT NULL COMMENT 'Ville d''affectation ou de stationnement du véhicule',
  `affectation_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'FK vers affectations.id',
  `affectation` text DEFAULT NULL,
  `responsable_du_vehicule` varchar(150) DEFAULT NULL,
  `kilometrage` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
  `date_maj_km` date DEFAULT NULL,
  `km_prochaine_vidange` bigint(20) UNSIGNED DEFAULT NULL,
  `km_prochaine_revision` bigint(20) UNSIGNED DEFAULT NULL,
  `statut` varchar(50) NOT NULL DEFAULT 'disponible' COMMENT 'disponible, en_mission, en_maintenance, immobilisation court,\r\nimmobilisation longue',
  `date_immobilisation` datetime DEFAULT NULL,
  `consommation_moyenne` decimal(10,2) DEFAULT NULL COMMENT 'L/100km',
  `date_acquisition` date DEFAULT NULL,
  `date_expiration_assurance` date DEFAULT NULL,
  `date_expiration_visite_technique` date DEFAULT NULL,
  `cout_acquisition` decimal(14,2) NOT NULL DEFAULT 0.00,
  `valeur_residuelle` decimal(14,2) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `couleur` text DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT 0,
  `est_supprime` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_suppression` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `vehicules`
--

INSERT INTO `vehicules` (`immatriculation`, `numero_chassis`, `marque_id`, `modele_id`, `categorie_id`, `annee_id`, `nb_places`, `direction_id`, `ville`, `affectation_id`, `affectation`, `responsable_du_vehicule`, `kilometrage`, `date_maj_km`, `km_prochaine_vidange`, `km_prochaine_revision`, `statut`, `date_immobilisation`, `consommation_moyenne`, `date_acquisition`, `date_expiration_assurance`, `date_expiration_visite_technique`, `cout_acquisition`, `valeur_residuelle`, `photo`, `couleur`, `est_actif`, `est_supprime`, `date_creation`, `date_modification`, `date_suppression`) VALUES
('ABG-325 AA', '49809FG98CN00X', 18, 31, 20, 15, 5, 1, 'LIBREVILLE', 33, 'ESCORTE/TF', 'Boris LIPOT DSI', 43490, '2026-10-20', 130000, NULL, 'disponible', NULL, 25.00, '2024-09-03', NULL, NULL, 1445000.00, NULL, 'upload/admin/images/vehicules/717b2e86-8372-46d6-b806-446f4c2a1207.png', 'Blanche', 1, 0, '2026-09-24 06:59:34', '2026-10-20 19:07:17', '2026-09-24 08:14:27'),
('AFG-650 AA', 'GR67SKJI9009X', 11, 21, 18, 13, 6, 1, 'LIBREVILLE', 14, 'DOP', NULL, 0, '2026-09-23', NULL, NULL, 'disponible', NULL, 50.00, '2022-03-22', NULL, NULL, 0.00, NULL, NULL, 'Blanche', 1, 0, '2026-09-23 06:37:31', '2026-09-23 08:40:52', NULL),
('CX 032 AA', 'AHTYK59GX00009981', 12, 16, 18, 4, 5, 8, 'LIBREVILLE', NULL, NULL, 'MR BABIRI', 134700, '2026-10-20', NULL, NULL, 'disponible', '2026-06-23 23:05:00', NULL, '2013-09-25', NULL, NULL, 0.00, NULL, NULL, 'Bleu', 1, 0, '2026-05-29 13:19:25', '2026-10-21 12:43:22', NULL),
('CX 032 AACX 032 AA', NULL, 15, 18, 18, 17, 5, 5, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-08-28 06:09:08', '2026-09-24 09:27:12', '2026-08-28 06:09:43'),
('DW 651 AA', 'AHTFR22G806080704', 12, 11, 15, 5, 5, 2, 'LIBREVILLE', NULL, NULL, NULL, 0, '2026-07-24', NULL, NULL, 'immobilisation longue', NULL, NULL, '2014-04-29', NULL, NULL, 0.00, NULL, NULL, 'JAUNE', 1, 0, '2026-05-29 13:07:41', '2026-08-28 09:36:15', NULL),
('DX-309-AA', 'JDAJ210G003007210', 18, 31, 20, 5, 5, 3, 'LIBREVILLE', 9, 'RECOUVREMENT', NULL, 235000, '2026-10-14', NULL, NULL, 'En panne', NULL, NULL, '2014-05-15', NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-08-28 08:48:50', '2026-10-15 10:13:24', NULL),
('FL 815 AA', 'JTMBD9EV80J028841', 12, 15, 18, 7, 5, 9, 'LIBREVILLE', NULL, NULL, 'CHEF DE ZONE', 0, '2026-06-01', NULL, NULL, 'immobilisation longue', '2026-06-10 10:45:00', NULL, '2016-10-31', NULL, NULL, 0.00, NULL, NULL, 'BLANCHE', 1, 0, '2026-05-29 13:14:40', '2026-06-24 11:53:13', NULL),
('FM 609 AA', 'VF1HSRC9N56092948', 14, 17, 18, 7, 5, 9, 'LIBREVILLE', NULL, NULL, 'CHEF DE ZONE', 346790, '2026-10-13', NULL, NULL, 'disponible', NULL, NULL, '2016-12-12', NULL, NULL, 0.00, NULL, NULL, 'GRISE', 1, 0, '2026-05-29 13:04:58', '2026-10-22 09:47:04', NULL),
('FM 610 AA', 'VF17SREB45598692', 14, 20, 18, 7, 5, 15, 'LIBREVILLE', NULL, NULL, NULL, 123000, '2026-10-14', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 'upload/admin/images/vehicules/2f297754-801f-4b0e-9f91-94ba883c1dff.jpg', 'BLEU', 1, 0, '2026-05-18 09:35:32', '2026-10-20 10:45:51', NULL),
('FM 612 AA', 'VF1HSRC9N56092960', 14, 17, 18, 7, 5, 4, 'LIBREVILLE', NULL, NULL, 'CHEF DU PERSONNEL', 138006, '2026-10-14', NULL, NULL, 'en_panne', NULL, NULL, '2016-12-06', NULL, NULL, 0.00, NULL, NULL, 'GRISE', 1, 0, '2026-05-29 12:55:18', '2026-10-14 09:39:15', NULL),
('FM 643 AA', NULL, 12, 15, 18, 17, 5, 15, 'LIBREVILLE', NULL, NULL, 'DAAL', 0, '2026-09-08', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 'upload/admin/images/vehicules/32116c59-ccdf-4fe0-8b8b-7706f41ba801.PNG', 'GRISE', 1, 0, '2026-05-29 13:23:43', '2026-09-08 09:41:26', NULL),
('FM 649 AA', 'AHTFS6CD91246189', 12, 11, 15, 7, 5, 9, 'LIBREVILLE', NULL, NULL, NULL, 748000, '2026-09-22', NULL, NULL, 'immobilisation longue', NULL, NULL, '2016-12-07', NULL, NULL, 0.00, NULL, NULL, 'Blanche', 1, 0, '2026-05-19 09:30:17', '2026-09-22 13:26:29', NULL),
('FM 651 AA', 'AHTFS6CD201246180', 12, 11, 15, 7, 5, 2, 'LIBREVILLE', NULL, NULL, NULL, 0, '2026-07-28', NULL, NULL, 'immobilisation longue', NULL, NULL, '2016-12-07', NULL, NULL, 0.00, NULL, NULL, 'BLANCHE', 1, 0, '2026-05-29 12:38:59', '2026-07-28 13:15:35', NULL),
('GW 363 AA', 'KNAPC811DD7415287', 11, 21, 18, 4, 5, 3, 'LIBREVILLE', NULL, NULL, 'DAF', 0, '2026-09-08', NULL, NULL, 'disponible', NULL, NULL, '2018-03-19', NULL, NULL, 0.00, NULL, 'upload/admin/images/vehicules/021048a4-f509-48d9-bf01-8740d5ffdfa8.PNG', 'GRISE', 1, 0, '2026-05-29 12:45:38', '2026-09-08 09:41:59', NULL),
('GW 365 AA', 'VF1HSRC8N49562835', 11, 21, 18, 4, 5, 3, 'LIBREVILLE', NULL, NULL, 'DAF', 0, NULL, NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 'GRISE', 1, 0, '2026-07-28 13:26:30', '2026-08-28 09:36:15', NULL),
('GW 369 AA', 'JSAJTDA4V00273596', 10, 24, 18, 4, 5, 9, 'LIBREVILLE', NULL, NULL, 'MR KING', 0, '2026-09-08', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 'upload/admin/images/vehicules/fef79877-6f91-410d-9e50-e0743db07366.PNG', 'BLANCHE', 1, 0, '2026-07-28 13:24:52', '2026-09-08 09:42:41', NULL),
('HA 010 AA', 'JTMBD9EV70J029396', 12, 15, 18, 8, 5, 8, 'LIBREVILLE', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 'GRISE', 1, 0, '2026-07-28 13:23:23', '2026-07-28 13:23:23', NULL),
('HB 889 AA', 'VF1RZG002HC248197', 14, 28, 18, 8, 5, 5, 'LIBREVILLE', NULL, NULL, 'DIRECTEUR COMMERCIAL', 0, '2026-09-08', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 'upload/admin/images/vehicules/d989949d-f23b-4ed7-a3fb-57596588e7c0.PNG', 'NOIRE', 1, 0, '2026-07-28 13:18:52', '2026-09-08 09:43:03', NULL),
('HK 598 AA', 'JSAJTDA4V00275321', 10, 24, 18, 17, 5, 9, 'LIBREVILLE', NULL, NULL, 'CHEF DE ZONE3', 0, NULL, NULL, NULL, 'immobilisation longue', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 'NOIRE', 1, 0, '2026-07-28 13:31:23', '2026-07-28 13:31:23', NULL),
('HN 810 AA', 'ZFAKVJN30H9012969', 17, 29, 15, 9, 5, 2, 'LIBREVILLE', NULL, NULL, 'DOP', 0, '2026-07-28', NULL, NULL, 'immobilisation longue', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 'BLANCHE', 1, 0, '2026-07-28 13:34:29', '2026-07-28 13:35:05', NULL),
('JM 093 AA', 'LTA12H3L2L2004906', 13, 13, 15, 12, 5, 9, 'LIBREVILLE', NULL, NULL, 'CHEF DE ZONE', 0, NULL, NULL, NULL, 'hors_service', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 'BLANCHE', 1, 0, '2026-07-28 13:37:00', '2026-08-28 09:36:15', NULL),
('JM 096 AA', 'LTA12H2L9L2003543', 13, 13, 15, 12, 5, 9, 'LIBREVILLE', NULL, NULL, 'CHEF DE ZONE', 0, NULL, NULL, NULL, 'immobilisation longue', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 'BLANCHE', 1, 0, '2026-07-28 13:40:57', '2026-07-28 13:40:57', NULL),
('JM 098 AA', 'MMBGYKS30LH014445', 16, 30, 18, 12, 5, 6, 'LIBREVILLE', NULL, NULL, 'DT', 0, '2026-07-28', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 'GRISE', 1, 0, '2026-07-28 13:43:04', '2026-07-28 13:45:30', NULL),
('JM 107 AA', 'VF1HJD400MA858178', 14, 17, 18, 12, 5, 2, 'LIBREVILLE', NULL, NULL, 'Mme OYANE', 0, '2026-07-28', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-28 12:59:30', '2026-07-28 13:11:55', NULL),
('JM 110 AA', 'VF1HJD402MA858179', 14, 17, 18, 12, 5, 9, 'LIBREVILLE', NULL, NULL, 'MR CARNOT', 0, NULL, NULL, NULL, 'immobilisation longue', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 'BLANCHE', 1, 0, '2026-07-28 13:44:59', '2026-07-28 13:44:59', NULL),
('JM 562 AA', 'LTA12HL9M2000756', 13, 13, 15, 12, 5, 2, 'LIBREVILLE', NULL, NULL, 'DOP', 4564690, '2026-10-15', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 'BLANCHE', 1, 0, '2026-07-28 13:09:43', '2026-10-21 12:53:48', NULL),
('JM 563 AA', 'LTRA12H2L0M2000757', 13, 13, 15, 12, 5, 9, 'LIBREVILLE', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'immobilisation longue', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 'BLANCHE', 1, 0, '2026-07-28 13:15:16', '2026-08-28 09:36:15', NULL),
('JM 815 AA', '93Y9SR5A3MJ858213', 14, 27, 15, 12, 5, 15, 'LIBREVILLE', NULL, NULL, 'DAAL', 42500, '2026-10-15', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 'upload/admin/images/vehicules/779107d9-8bdf-4fde-8848-fe2a40fa02bb.PNG', 'GRISE', 1, 0, '2026-07-28 13:02:53', '2026-10-15 16:16:52', NULL),
('JM 816 AA', '93Y9SR5A3MJ858212', 14, 27, 15, 12, 5, 9, NULL, NULL, NULL, 'MR CARNOT', 0, '2026-07-28', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 'GRISE', 1, 0, '2026-07-28 13:05:16', '2026-07-28 13:12:39', NULL),
('JM-156-AA', 'VF1HJD408MA789263', 14, 17, 19, 12, 5, 5, 'LIBREVILLE', NULL, NULL, 'Mr MBENGUE Alain', 0, '2026-09-08', NULL, NULL, 'disponible', NULL, NULL, '2021-05-05', NULL, NULL, 0.00, NULL, 'upload/admin/images/vehicules/f38c8a30-56ff-490c-89b9-6354945b2503.PNG', NULL, 1, 0, '2026-08-28 09:09:36', '2026-09-08 09:43:38', NULL),
('JM-157-AA', 'VF1HJD40XMA789273', 14, 17, 19, 12, 5, 2, 'LIBREVILLE', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'disponible', NULL, NULL, '2021-05-25', NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-08-28 06:18:13', '2026-08-28 09:36:15', NULL),
('JN 116 AA', 'LTA12H2L5M2000754', 13, 13, 15, 12, 5, 2, 'LIBREVILLE', NULL, NULL, 'DOP', 0, '2026-07-28', NULL, NULL, 'immobilisation longue', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 'BLANCHE', 1, 0, '2026-07-24 08:32:42', '2026-08-28 09:36:15', NULL),
('JN 580 AA', NULL, 11, 12, 18, 12, 5, 3, 'LIBREVILLE', NULL, NULL, 'MR MOUNGUENGUI BOULINGUI BENJAMIN', 0, '2026-05-19', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 'NOIR', 1, 0, '2026-05-07 09:31:13', '2026-08-28 09:36:15', NULL),
('JN-712-AA', 'VF1HJD402JA417196', 14, 17, 19, 12, 5, 4, 'LIBREVILLE', 11, 'D R H', NULL, 0, NULL, NULL, NULL, 'disponible', NULL, NULL, '2021-07-29', NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-08-28 09:02:33', '2026-08-28 09:02:33', NULL),
('JP-447-AA', 'LTA12H2L4M2001541', 13, 13, 15, 12, 5, 6, 'LIBREVILLE', 54, 'DNT', NULL, 0, '2026-08-28', NULL, NULL, 'disponible', NULL, NULL, '2021-08-26', NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-08-28 08:54:08', '2026-08-28 08:58:32', NULL),
('JP-449-AA', 'LTA12H2L6M2001539', 13, 13, 15, 12, 5, 9, 'LIBREVILLE', 31, 'BRIGADE CANINE', NULL, 0, '2026-08-28', NULL, NULL, 'disponible', NULL, NULL, '2021-08-26', NULL, NULL, 0.00, NULL, NULL, 'Blanche', 1, 0, '2026-08-28 06:38:20', '2026-08-28 08:55:11', NULL),
('JQ-850-AA', 'MA3RFL41500248541', 15, 18, 18, 12, 5, 8, 'LIBREVILLE', NULL, NULL, 'Pacome  BONGO', 0, NULL, NULL, NULL, 'disponible', NULL, NULL, '2021-10-15', NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-08-28 06:27:40', '2026-08-28 06:27:40', NULL),
('JR 262 AA', 'VF1HJD406NA053996', 14, 17, 18, 12, 5, 6, NULL, NULL, NULL, 'MR TOUSSAINT', 0, '2026-07-28', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 'BLANCHE', 1, 0, '2026-07-28 13:08:01', '2026-08-28 09:36:15', NULL),
('JU-360-AA', 'LTA12H2U9N9101605', 13, 14, 15, 13, 5, 2, 'LIBREVILLE', 32, 'TF/OPS', NULL, 0, '2026-08-28', NULL, NULL, 'disponible', NULL, NULL, '2022-03-23', NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-08-27 13:58:07', '2026-08-28 08:40:33', NULL),
('JU-364-AA', 'LTA12H2U7N9101604', 13, 14, 15, 13, 5, 2, 'LIBREVILLE', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'disponible', NULL, NULL, '2022-03-23', NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-08-27 14:00:35', '2026-08-28 09:36:15', NULL),
('JU-366-AA', 'LTA12H2U5N9101603', 13, 14, 15, 13, 5, 2, 'LIBREVILLE', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'disponible', NULL, NULL, '2022-03-23', NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-08-27 14:02:40', '2026-08-27 14:02:40', NULL),
('JU-368-AA', 'LTA12H2U5M9100773', 13, 14, 15, 13, 5, 2, 'LIBREVILLE', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'disponible', NULL, NULL, '2022-03-23', NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-08-27 14:06:39', '2026-08-27 14:06:39', NULL),
('JU-370-AA', 'LTA12H2U2N9101607', 13, 14, 15, 13, 5, 2, 'LIBREVILLE', 32, 'TF/OPS', NULL, 0, '2026-08-28', NULL, NULL, 'disponible', NULL, NULL, '2022-03-23', NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-08-28 08:29:45', '2026-08-28 08:43:14', NULL),
('JW-164-AA', 'LTA12H2L7N2000238', 13, 13, 15, 13, 5, 9, 'LIBREVILLE', NULL, NULL, NULL, 185680, '2026-10-14', NULL, NULL, 'En reparation', NULL, NULL, '2022-06-09', NULL, NULL, 0.00, NULL, NULL, 'Blanche', 1, 0, '2026-08-24 10:12:47', '2026-10-15 15:47:46', NULL),
('JW-688-AA', 'LTA12H2L8N2000376', 13, 13, 15, 13, 5, 9, 'LIBREVILLE', 23, 'DEX - ZONE 2', NULL, 0, NULL, NULL, NULL, 'disponible', NULL, NULL, '2022-06-30', NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-09-07 13:53:21', '2026-09-07 13:53:21', NULL),
('KH-756-AA', '005640083', 12, 23, 15, 14, 5, 2, 'LIBREVILLE', 26, 'DOP - TF', NULL, 0, NULL, NULL, NULL, 'disponible', NULL, NULL, '2023-09-08', NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-09-07 13:47:52', '2026-09-07 13:47:52', NULL),
('KH-757-AA', 'AHTDB9CD905640082', 12, 23, 15, 14, 5, 2, 'LIBREVILLE', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'disponible', NULL, NULL, '2023-09-08', NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-09-07 13:46:02', '2026-09-07 13:46:02', NULL),
('KH-758-AA', '105640027', 12, 23, 15, 14, 5, 2, 'LIBREVILLE', 26, 'DOP - TF', NULL, 346000, '2026-10-13', NULL, NULL, 'En reparation', NULL, NULL, '2023-09-08', NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-09-07 13:43:27', '2026-10-15 15:28:04', NULL),
('KW-873-AA', 'AHTDB9CD105641937', 12, 23, 15, 15, 5, 2, 'LIBREVILLE', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'disponible', NULL, NULL, '2024-08-12', NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-09-07 13:57:44', '2026-09-07 13:57:44', NULL),
('KW-874-AA', 'AHTDB9CD105641839', 12, 23, 15, 15, 5, 2, 'LIBREVILLE', 7, 'EBOMAF', NULL, 0, NULL, NULL, NULL, 'disponible', NULL, NULL, '2024-07-31', NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-09-07 14:00:21', '2026-09-07 14:00:21', NULL),
('KW-875-AA', 'X05641970', 12, 23, 15, 15, 5, 2, 'LIBREVILLE', 16, 'DOP - ESCORTE - TF', NULL, 0, NULL, NULL, NULL, 'disponible', NULL, NULL, '2024-08-12', NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-09-07 14:02:37', '2026-09-07 14:02:37', NULL),
('KW-876-AA', 'AHTDB9CD305641938', 12, 11, 15, 15, 5, 2, 'LIBREVILLE', 26, 'DOP - TF', NULL, 0, NULL, NULL, NULL, 'disponible', NULL, NULL, '2024-07-31', NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-09-07 13:36:11', '2026-09-07 13:36:11', NULL),
('LK 797AA', 'AHTDB9CD905642012', 12, 11, 15, 16, 5, 2, 'PORT GENTIL', NULL, NULL, NULL, 0, '2026-05-19', NULL, NULL, 'disponible', NULL, NULL, '2025-04-04', NULL, NULL, 27000001.00, NULL, NULL, 'BLANCHE', 1, 0, '2026-05-11 09:11:59', '2026-08-28 09:36:15', NULL),
('LK 848 AA', 'AHTDB9CD505642007', 12, 11, 15, 16, 5, 2, 'MOANDA', NULL, NULL, NULL, 0, '2026-05-19', NULL, NULL, 'disponible', NULL, NULL, '2025-04-02', NULL, NULL, 27000001.00, NULL, NULL, 'BLANCHE', 1, 0, '2026-05-15 08:52:21', '2026-08-28 09:36:15', NULL),
('LK 849 AA', 'AHTDB9CD705642008', 12, 11, 15, 16, 5, 9, 'LIBREVILLE', NULL, NULL, NULL, 0, '2026-05-19', NULL, NULL, 'disponible', NULL, NULL, '2025-04-04', NULL, NULL, 27000001.00, NULL, NULL, 'BLANCHE', 1, 0, '2026-05-15 08:40:47', '2026-08-28 09:36:15', NULL),
('LK 850 AA', 'AHTDB9CD905642009', 12, 11, 15, 17, 5, 9, NULL, NULL, NULL, NULL, 0, '2026-05-19', NULL, NULL, 'disponible', NULL, NULL, '2025-04-02', NULL, NULL, 27000001.00, NULL, NULL, 'BLANCHE', 1, 0, '2026-05-15 09:06:14', '2026-08-28 09:36:15', NULL),
('LK 851 AA', 'AHTDB9CD505642010', 12, 11, 15, 16, 5, 2, 'LIBREVILLE', NULL, NULL, NULL, 0, '2026-05-19', NULL, NULL, 'disponible', NULL, NULL, '2025-04-04', NULL, NULL, 27000001.00, NULL, NULL, 'BLANCHE', 1, 0, '2026-05-07 09:14:10', '2026-08-28 09:36:15', NULL),
('LU 195 AA', 'JTDJWCA3SRG782448', 12, 19, 18, 16, 5, 5, 'LIBREVILLE', NULL, NULL, NULL, 0, '2026-05-19', NULL, NULL, 'disponible', NULL, NULL, '2025-04-09', NULL, NULL, 1200000.00, NULL, NULL, 'BLANCHE', 1, 0, '2026-05-15 08:14:06', '2026-08-28 09:36:15', NULL),
('LU 196 AA', 'JTDJWCA3SSG819410', 12, 19, 18, 16, 5, 3, 'LIBREVILLE', NULL, NULL, NULL, 0, '2026-05-19', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 'ROUGE', 1, 0, '2026-05-15 09:12:16', '2026-08-28 09:36:15', NULL),
('MK  503 AA', 'MMBJNLC10SH082430', 16, 22, 15, 17, 5, 9, 'LIBREVILLE', NULL, NULL, 'CHEF DE ZONE 3', 0, '2026-09-08', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 'upload/admin/images/vehicules/bbb9e57e-f849-4c42-b001-ff2b0eeb5fac.PNG', NULL, 1, 0, '2026-07-22 12:02:54', '2026-09-08 09:45:44', NULL),
('MK 494 AA', 'MMBJNLC10SH081759', 16, 22, 15, 17, 5, 2, NULL, NULL, NULL, 'DOP', 0, NULL, NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-22 11:48:02', '2026-07-22 11:48:02', NULL),
('MK 496 AA', 'MMBJNLC10SH081728', 16, 22, 15, 17, 5, 2, 'LIBREVILLE', NULL, NULL, 'DOP', 0, NULL, NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-22 11:51:45', '2026-07-22 11:51:45', NULL),
('MK 497 AA', 'MMBJNLC10SH082445', 16, 22, 15, 17, 5, 2, 'LIBREVILLE', NULL, NULL, 'DOP', 0, NULL, NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-22 11:54:14', '2026-07-22 11:54:14', NULL),
('MK 498 AA', 'MMBJNLC10SH082417', 16, 22, 15, 17, 5, 2, 'MOANDA', NULL, NULL, 'DIRECTEUR REGIONAL', 0, NULL, NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-22 11:56:25', '2026-07-22 11:56:25', NULL),
('MK 499 AA', 'MMBJNLC10SH081842', 16, 22, 15, 17, 5, 9, 'FRANCEVILLE', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-22 11:57:45', '2026-07-22 11:57:45', NULL),
('MK 500 AA', 'MMBJNLC10SH082468', 16, 22, 15, 17, 5, 2, 'OWENDO', NULL, NULL, 'MR HAKIM', 0, NULL, NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-22 11:59:31', '2026-07-22 11:59:31', NULL),
('MK 501 AA', 'MMBJNLC10SH082446', 16, 22, 15, 17, 5, 9, 'LIBREVILLE', NULL, NULL, 'CHEF DE ZONE 1', 0, NULL, NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-22 12:01:33', '2026-08-28 09:36:15', NULL),
('MK 504 AA', 'MMBJNLC10SH081791', 16, 22, 15, 17, 5, 9, 'LIBREVILLE', NULL, NULL, 'CHEF DE ZONE 2', 0, '2026-09-08', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 'upload/admin/images/vehicules/f579488d-8bfb-483e-82b0-68b76ba21ae1.PNG', NULL, 1, 0, '2026-07-22 12:04:25', '2026-09-08 09:46:18', NULL),
('MK 507 AA', 'MMBJNLC10SH081874', 16, 22, 15, 17, 5, 2, 'PORT-GENTIL', NULL, NULL, 'DIRECTEUR REGIONAL', 0, '2026-07-22', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-22 12:06:58', '2026-08-28 09:36:15', NULL),
('MK 508 AA', 'MMBJNLC10SH082472', 16, 22, 15, 17, 5, 2, 'PORT-GENTIL', NULL, NULL, 'DIRECTEUR REGIONAL', 0, '2026-07-22', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-22 12:08:29', '2026-08-28 09:36:15', NULL),
('MK 510 AA', 'MMBJNLC10SH081752', 16, 22, 15, 17, 5, 2, 'LAMBARÉNÉ', NULL, NULL, 'DIRECTEUR AGENCE', 0, NULL, NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-22 12:09:51', '2026-08-28 09:36:15', NULL),
('MK 511 AA', 'MMBJNLC10SH082418', 16, 22, 15, 17, 5, 9, 'LIBREVILLE', NULL, NULL, 'CHEF DE ZONE 1', 0, '2026-09-08', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 'upload/admin/images/vehicules/a1dba9b9-d3e8-475c-a842-2011b7563ffe.PNG', NULL, 1, 0, '2026-07-22 12:11:59', '2026-09-08 09:48:17', NULL),
('MK 551 AA', 'LJD3BA1DAT0080019', 11, 26, 18, 17, 5, 1, 'LIBREVILLE', NULL, NULL, 'MR LIPOT', 0, '2026-09-08', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 'upload/admin/images/vehicules/f10a7609-b596-4f1a-a0b7-470f6111d18e.PNG', NULL, 1, 0, '2026-07-24 08:02:04', '2026-09-08 09:40:22', NULL),
('MK 591 AA', 'AHTKB8CD802993965', 12, 23, 15, 17, 5, 2, 'LIBREVILLE', NULL, NULL, 'DOP', 0, NULL, NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-22 12:13:37', '2026-08-28 09:36:15', NULL),
('MK 592 AA', 'AHTKB8CD402993994', 12, 23, 15, 17, 5, 2, 'LIBREVILLE', NULL, NULL, 'DOP', 0, '2026-09-08', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 'upload/admin/images/vehicules/717b5765-fb5f-4707-affe-560d9270aa0f.PNG', NULL, 1, 0, '2026-07-24 07:21:56', '2026-09-08 09:48:58', NULL),
('MK 593 AA', 'AHTKB8CDX02993983', 12, 23, 15, 17, 5, 2, 'LIBREVILLE', NULL, NULL, 'DOP', 0, NULL, NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-24 07:23:19', '2026-08-28 09:36:15', NULL),
('MK 594 AA', 'AHTKB8CD202994836', 12, 23, 15, 17, 5, 2, 'LIBREVILLE', NULL, NULL, 'DOP', 0, '2026-07-24', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-24 07:24:55', '2026-08-28 09:36:15', NULL),
('MK 595 AA', 'AHTKB8CD702994945', 12, 23, 15, 17, 5, 2, 'LIBREVILLE', NULL, NULL, 'DOP', 0, '2026-07-24', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-24 07:26:41', '2026-08-28 09:36:15', NULL),
('MK 596 AA', 'AHTKB8CD302994716', 12, 23, 15, 17, 5, 2, 'LIBREVILLE', NULL, NULL, 'DOP', 0, NULL, NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-24 07:28:38', '2026-08-28 09:36:15', NULL),
('MK 597 AA', 'AHTKB8CD50299484', 12, 23, 15, 17, 5, 2, 'PORT-GENTIL', NULL, NULL, 'DIRECTEUR REGIONAL', 0, '2026-07-24', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-24 07:30:28', '2026-08-28 09:36:15', NULL),
('MK 598 AA', 'AHTKB8CD602994855', 12, 23, 15, 17, 5, 2, 'MOANDA', NULL, NULL, 'DIRECTEUR REGIONAL', 0, NULL, NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-24 07:32:19', '2026-08-28 09:36:15', NULL),
('MK 599 AA', 'AHTKB8CD902994753', 12, 23, 15, 17, 5, 2, 'OYEM', NULL, NULL, 'RESPONSABLE REGIONAL', 0, NULL, NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-24 07:33:50', '2026-08-28 09:36:15', NULL),
('MK 600 AA', 'AHTKB8CD102994763', 12, 23, 15, 17, 5, 9, 'OYEM', NULL, NULL, 'DIRECTEUR REGIONAL', 0, NULL, NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-24 07:35:23', '2026-08-28 09:36:15', NULL),
('MK 610 AA', 'AHTKB8CD302994733', 12, 23, 15, 17, 5, 2, 'LIBREVILLE', NULL, NULL, 'CHEF DE ZONE', 0, NULL, NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-24 07:37:06', '2026-08-28 09:36:15', NULL),
('MK 611 AA', 'AHTKB8CD102993919', 12, 23, 15, 17, 5, 15, 'LIBREVILLE', NULL, NULL, 'DAAL', 0, NULL, NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-24 07:38:26', '2026-08-28 09:36:15', NULL),
('ML 173 AA', 'MA3TYKJ1SST103379', 10, 24, 18, 17, 5, 4, 'LIBREVILLE', NULL, NULL, 'DRH', 0, '2026-07-24', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-24 07:45:39', '2026-08-28 09:36:15', NULL),
('ML 174 AA', 'MA3TYKJ1SST103381', 10, 24, 18, 17, 5, 15, 'LIBREVILLE', NULL, NULL, 'DAAL', 0, NULL, NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-24 07:46:57', '2026-08-28 09:36:15', NULL),
('ML 553 AA', 'LJD3BA1DET0080022', 11, 26, 18, 17, 5, 2, 'LIBREVILLE', NULL, NULL, 'DOP', 0, '2026-09-08', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 'upload/admin/images/vehicules/49c1b0b5-8ca7-4290-bcfd-3756c63b16bd.PNG', NULL, 1, 0, '2026-07-24 08:00:24', '2026-09-08 09:38:56', NULL),
('ML 554 AA', 'MBHZCDESHTG519933', 10, 25, 18, 17, 5, 3, 'LIBREVILLE', NULL, NULL, 'DAF', 0, NULL, NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 1, 0, '2026-07-24 07:58:33', '2026-08-28 09:36:15', NULL),
('ML 556 AA', 'MBHZCDESHTG526761', 10, 25, 18, 17, 5, 5, 'LIBREVILLE', NULL, NULL, 'DIRECTEUR COMMERCIAL', 0, '2026-09-08', NULL, NULL, 'disponible', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 'upload/admin/images/vehicules/44472559-4caf-48b4-ab08-9b2e836895f3.PNG', NULL, 1, 0, '2026-07-24 07:49:36', '2026-09-08 09:39:54', NULL);

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `accessoires`
--
ALTER TABLE `accessoires`
  ADD PRIMARY KEY (`id`);

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
-- Index pour la table `affectations`
--
ALTER TABLE `affectations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `affectations_nom_unique` (`nom`),
  ADD UNIQUE KEY `affectations_code_unique` (`code`);

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
  ADD UNIQUE KEY `uq_demande_matricule` (`matricule_demande`),
  ADD KEY `idx_demande_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_demande_demandeur` (`demandeur_user_id`),
  ADD KEY `idx_demande_anomalie` (`anomalie_id`),
  ADD KEY `idx_demande_statut` (`statut`),
  ADD KEY `idx_demande_priorite` (`priorite`),
  ADD KEY `idx_demande_actives` (`est_supprime`),
  ADD KEY `fk_demande_validee_par` (`validee_par_user_id`),
  ADD KEY `idx_demande_nature` (`nature_intervention`),
  ADD KEY `idx_demande_direction` (`direction_id`),
  ADD KEY `idx_demande_affectation` (`affectation_id`);

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
-- Index pour la table `historique_affectations`
--
ALTER TABLE `historique_affectations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `historique_affectations_affectation_origine_id_foreign` (`affectation_origine_id`),
  ADD KEY `historique_affectations_affectation_emprunt_id_foreign` (`affectation_emprunt_id`),
  ADD KEY `historique_affectations_demande_par_user_id_foreign` (`demande_par_user_id`),
  ADD KEY `historique_affectations_valide_par_user_id_foreign` (`valide_par_user_id`),
  ADD KEY `historique_affectations_cloture_par_user_id_foreign` (`cloture_par_user_id`),
  ADD KEY `idx_histaffect_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_histaffect_dir_origine` (`direction_origine_id`),
  ADD KEY `idx_histaffect_dir_emprunt` (`direction_emprunt_id`),
  ADD KEY `idx_histaffect_statut` (`statut`),
  ADD KEY `idx_histaffect_date_debut` (`date_debut`),
  ADD KEY `idx_histaffect_actifs` (`est_supprime`),
  ADD KEY `idx_histaffect_veh_statut` (`vehicule_immatriculation`,`statut`,`est_supprime`);

--
-- Index pour la table `historique_connexions`
--
ALTER TABLE `historique_connexions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `historique_connexions_user_id_login_at_index` (`user_id`,`login_at`);

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
  ADD KEY `idx_inspections_actives` (`est_supprime`),
  ADD KEY `idx_inspections_vehicule` (`vehicule_immatriculation`);

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
-- Index pour la table `inspection_elements`
--
ALTER TABLE `inspection_elements`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_insp_elem_accessoire` (`inspection_vehicule_id`,`accessoire_id`),
  ADD KEY `idx_insp_elem_insp_veh` (`inspection_vehicule_id`),
  ADD KEY `idx_insp_elem_accessoire` (`accessoire_id`),
  ADD KEY `idx_insp_elem_statut` (`statut`);

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
  ADD KEY `idx_interventions_vehicule_statut` (`vehicule_immatriculation`,`statut`),
  ADD KEY `idx_interv_matricule_demande` (`matricule_demande`),
  ADD KEY `idx_interv_nature` (`nature_intervention`),
  ADD KEY `idx_interv_entree_garage` (`date_entree_garage`),
  ADD KEY `idx_interv_sortie_garage` (`date_sortie_garage`);

--
-- Index pour la table `intervention_demandes`
--
ALTER TABLE `intervention_demandes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_interv_dem` (`intervention_id`,`demande_id`),
  ADD KEY `idx_intdem_intervention` (`intervention_id`),
  ADD KEY `idx_intdem_demande` (`demande_id`);

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
-- Index pour la table `mouvements_caisse`
--
ALTER TABLE `mouvements_caisse`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_mvcaisse_type` (`type_mouvement`),
  ADD KEY `idx_mvcaisse_vehicule` (`vehicule_immatriculation`),
  ADD KEY `idx_mvcaisse_intervention` (`intervention_id`),
  ADD KEY `idx_mvcaisse_periode` (`periode_caisse_id`),
  ADD KEY `idx_mvcaisse_date` (`date_mouvement`),
  ADD KEY `fk_mvcaisse_user` (`cree_par_user_id`);

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
-- Index pour la table `outils_intervention`
--
ALTER TABLE `outils_intervention`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_outil_interv` (`intervention_id`,`outil_id`),
  ADD KEY `idx_outinterv_intervention` (`intervention_id`),
  ADD KEY `idx_outinterv_outil` (`outil_id`);

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
-- Index pour la table `periodes_caisse`
--
ALTER TABLE `periodes_caisse`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_periode_caisse` (`annee`,`mois`),
  ADD KEY `idx_periode_caisse_ym` (`annee`,`mois`);

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
  ADD KEY `idx_vehicules_annee` (`annee_id`),
  ADD KEY `idx_vehicules_affectation` (`affectation_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `accessoires`
--
ALTER TABLE `accessoires`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT pour la table `accidents`
--
ALTER TABLE `accidents`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `affectations`
--
ALTER TABLE `affectations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT pour la table `alertes_kilometrage`
--
ALTER TABLE `alertes_kilometrage`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `annees`
--
ALTER TABLE `annees`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT pour la table `categories_notifications`
--
ALTER TABLE `categories_notifications`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `categories_vehicules`
--
ALTER TABLE `categories_vehicules`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT pour la table `checklists`
--
ALTER TABLE `checklists`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `demandes_intervention`
--
ALTER TABLE `demandes_intervention`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT pour la table `directions`
--
ALTER TABLE `directions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT pour la table `documents_chauffeurs`
--
ALTER TABLE `documents_chauffeurs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `documents_vehicules`
--
ALTER TABLE `documents_vehicules`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT pour la table `envois_notifications`
--
ALTER TABLE `envois_notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT pour la table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `fournisseurs`
--
ALTER TABLE `fournisseurs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `historique_affectations`
--
ALTER TABLE `historique_affectations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `historique_connexions`
--
ALTER TABLE `historique_connexions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=72;

--
-- AUTO_INCREMENT pour la table `historique_kilometrage`
--
ALTER TABLE `historique_kilometrage`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `inspections`
--
ALTER TABLE `inspections`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `inspections_vehicules`
--
ALTER TABLE `inspections_vehicules`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `inspection_elements`
--
ALTER TABLE `inspection_elements`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pour la table `intervenants`
--
ALTER TABLE `intervenants`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `interventions`
--
ALTER TABLE `interventions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `intervention_demandes`
--
ALTER TABLE `intervention_demandes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT pour la table `journaux_audit`
--
ALTER TABLE `journaux_audit`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=146;

--
-- AUTO_INCREMENT pour la table `kpi_vehicules`
--
ALTER TABLE `kpi_vehicules`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `marques`
--
ALTER TABLE `marques`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT pour la table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=72;

--
-- AUTO_INCREMENT pour la table `missions`
--
ALTER TABLE `missions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `modeles`
--
ALTER TABLE `modeles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT pour la table `mouvements_caisse`
--
ALTER TABLE `mouvements_caisse`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pour la table `mouvements_stock`
--
ALTER TABLE `mouvements_stock`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `outils`
--
ALTER TABLE `outils`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `outils_intervention`
--
ALTER TABLE `outils_intervention`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `parametres_alertes`
--
ALTER TABLE `parametres_alertes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `parametres_systeme`
--
ALTER TABLE `parametres_systeme`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT pour la table `pc_radio`
--
ALTER TABLE `pc_radio`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `performances_chauffeurs`
--
ALTER TABLE `performances_chauffeurs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `periodes_caisse`
--
ALTER TABLE `periodes_caisse`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=375;

--
-- AUTO_INCREMENT pour la table `pieces_detachees`
--
ALTER TABLE `pieces_detachees`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

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
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `types_inspection`
--
ALTER TABLE `types_inspection`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `types_intervenant`
--
ALTER TABLE `types_intervenant`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

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
  ADD CONSTRAINT `fk_demande_affectation` FOREIGN KEY (`affectation_id`) REFERENCES `affectations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_demande_anomalie` FOREIGN KEY (`anomalie_id`) REFERENCES `anomalies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_demande_demandeur` FOREIGN KEY (`demandeur_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_demande_direction` FOREIGN KEY (`direction_id`) REFERENCES `directions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
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
-- Contraintes pour la table `envois_notifications`
--
ALTER TABLE `envois_notifications`
  ADD CONSTRAINT `fk_envoi_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_envoi_user` FOREIGN KEY (`user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `historique_affectations`
--
ALTER TABLE `historique_affectations`
  ADD CONSTRAINT `historique_affectations_affectation_emprunt_id_foreign` FOREIGN KEY (`affectation_emprunt_id`) REFERENCES `affectations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `historique_affectations_affectation_origine_id_foreign` FOREIGN KEY (`affectation_origine_id`) REFERENCES `affectations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `historique_affectations_cloture_par_user_id_foreign` FOREIGN KEY (`cloture_par_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `historique_affectations_demande_par_user_id_foreign` FOREIGN KEY (`demande_par_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `historique_affectations_direction_emprunt_id_foreign` FOREIGN KEY (`direction_emprunt_id`) REFERENCES `directions` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `historique_affectations_direction_origine_id_foreign` FOREIGN KEY (`direction_origine_id`) REFERENCES `directions` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `historique_affectations_valide_par_user_id_foreign` FOREIGN KEY (`valide_par_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `historique_affectations_vehicule_immatriculation_foreign` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `historique_connexions`
--
ALTER TABLE `historique_connexions`
  ADD CONSTRAINT `historique_connexions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE CASCADE;

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
  ADD CONSTRAINT `fk_inspections_type` FOREIGN KEY (`type_inspection_id`) REFERENCES `types_inspection` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inspections_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `inspections_vehicules`
--
ALTER TABLE `inspections_vehicules`
  ADD CONSTRAINT `fk_inspveh_anomalie` FOREIGN KEY (`anomalie_creee_id`) REFERENCES `anomalies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inspveh_inspection` FOREIGN KEY (`inspection_id`) REFERENCES `inspections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inspveh_vehicule` FOREIGN KEY (`vehicule_immatriculation`) REFERENCES `vehicules` (`immatriculation`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `inspection_elements`
--
ALTER TABLE `inspection_elements`
  ADD CONSTRAINT `fk_insp_elem_accessoire` FOREIGN KEY (`accessoire_id`) REFERENCES `accessoires` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_insp_elem_insp_veh` FOREIGN KEY (`inspection_vehicule_id`) REFERENCES `inspections_vehicules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
-- Contraintes pour la table `intervention_demandes`
--
ALTER TABLE `intervention_demandes`
  ADD CONSTRAINT `fk_intdem_demande` FOREIGN KEY (`demande_id`) REFERENCES `demandes_intervention` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_intdem_intervention` FOREIGN KEY (`intervention_id`) REFERENCES `interventions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
-- Contraintes pour la table `mouvements_caisse`
--
ALTER TABLE `mouvements_caisse`
  ADD CONSTRAINT `fk_mvcaisse_intervention` FOREIGN KEY (`intervention_id`) REFERENCES `interventions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mvcaisse_periode` FOREIGN KEY (`periode_caisse_id`) REFERENCES `periodes_caisse` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mvcaisse_user` FOREIGN KEY (`cree_par_user_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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
-- Contraintes pour la table `outils_intervention`
--
ALTER TABLE `outils_intervention`
  ADD CONSTRAINT `fk_outinterv_intervention` FOREIGN KEY (`intervention_id`) REFERENCES `interventions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_outinterv_outil` FOREIGN KEY (`outil_id`) REFERENCES `outils` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
  ADD CONSTRAINT `fk_vehicules_affectation` FOREIGN KEY (`affectation_id`) REFERENCES `affectations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_vehicules_direction` FOREIGN KEY (`direction_id`) REFERENCES `directions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `vehicules_annee_id_foreign` FOREIGN KEY (`annee_id`) REFERENCES `annees` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `vehicules_categorie_id_foreign` FOREIGN KEY (`categorie_id`) REFERENCES `categories_vehicules` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `vehicules_marque_id_foreign` FOREIGN KEY (`marque_id`) REFERENCES `marques` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `vehicules_modele_id_foreign` FOREIGN KEY (`modele_id`) REFERENCES `modeles` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
