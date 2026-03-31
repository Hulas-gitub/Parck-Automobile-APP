import React, { useState, useEffect, useRef, useReducer } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

// ============================================================================
// DONNÉES DE RÉFÉRENCE — ALIGNÉES BDD
// ============================================================================

// table: types_intervenant
const TYPES_INTERVENANT = [
  { id: 1, code: 'mecanicien',    libelle: 'Mécanicien',    color: '#3b82f6', icon: 'bi-wrench-adjustable-circle-fill' },
  { id: 2, code: 'electricien',   libelle: 'Électricien',   color: '#f59e0b', icon: 'bi-lightning-charge-fill'         },
  { id: 3, code: 'carrossier',    libelle: 'Carrossier',    color: '#10b981', icon: 'bi-hammer'                        },
  { id: 4, code: 'pneumaticien',  libelle: 'Pneumaticien',  color: '#8b5cf6', icon: 'bi-circle-fill'                   },
  { id: 5, code: 'hydraulicien',  libelle: 'Hydraulicien',  color: '#06b6d4', icon: 'bi-droplet-fill'                  },
  { id: 6, code: 'informaticien', libelle: 'Informaticien', color: '#ec4899', icon: 'bi-cpu-fill'                      },
];

// table: intervenants
const INTERVENANTS = [
  { id:1, type_intervenant_id:1, user_id:7,   nom_externe:null,              telephone:'+241 77 123 456', email:'jpm@fleet.ga',      est_externe:false, tarif_horaire:25000, specialisation:'Moteur & Transmission' },
  { id:2, type_intervenant_id:1, user_id:null, nom_externe:'Garaplus Sarl',   telephone:'+241 01 234 567', email:'garaplus@sarl.ga',  est_externe:true,  tarif_horaire:35000, specialisation:'Mécanique générale'     },
  { id:3, type_intervenant_id:2, user_id:null, nom_externe:'André Bekale',    telephone:'+241 66 987 654', email:'bekale@fleet.ga',   est_externe:false, tarif_horaire:28000, specialisation:'Électricité auto'        },
  { id:4, type_intervenant_id:2, user_id:null, nom_externe:'Auto Élec Lib',   telephone:'+241 01 345 678', email:'autoelec@lib.ga',   est_externe:true,  tarif_horaire:40000, specialisation:'Diagnostics électroniques'},
  { id:5, type_intervenant_id:3, user_id:null, nom_externe:'Serge Nguema',    telephone:'+241 74 654 321', email:'snguema@fleet.ga',  est_externe:false, tarif_horaire:22000, specialisation:'Carrosserie & Peinture'  },
  { id:6, type_intervenant_id:3, user_id:null, nom_externe:'Carrosse Express',telephone:'+241 01 456 789', email:'carrosse@exp.ga',   est_externe:true,  tarif_horaire:45000, specialisation:'Carrosserie lourde'      },
  { id:7, type_intervenant_id:4, user_id:null, nom_externe:'Paul Ondo',       telephone:'+241 62 111 222', email:'pondo@fleet.ga',    est_externe:false, tarif_horaire:20000, specialisation:'Pneumatiques & Jantes'   },
  { id:8, type_intervenant_id:5, user_id:null, nom_externe:'Sébastien Mba',   telephone:'+241 65 333 444', email:'smba@fleet.ga',     est_externe:false, tarif_horaire:30000, specialisation:'Hydraulique & Freinage'  },
];

// table: vehicules
const VEHICULES = [
  { immatriculation:'GA-1234-AB', marque:'Toyota',     modele:'Land Cruiser', kilometrage:145000, statut:'disponible'    },
  { immatriculation:'GA-5678-CD', marque:'Ford',       modele:'Ranger',       kilometrage:89000,  statut:'disponible'    },
  { immatriculation:'GA-9012-EF', marque:'Nissan',     modele:'Patrol',       kilometrage:210000, statut:'en_maintenance' },
  { immatriculation:'GA-3456-GH', marque:'Toyota',     modele:'Hilux',        kilometrage:67000,  statut:'disponible'    },
  { immatriculation:'GA-7890-IJ', marque:'Mitsubishi', modele:'L200',         kilometrage:112000, statut:'disponible'    },
  { immatriculation:'GA-2345-KL', marque:'Mercedes',   modele:'Sprinter',     kilometrage:55000,  statut:'disponible'    },
  { immatriculation:'GA-6789-MN', marque:'Hyundai',    modele:'H350',         kilometrage:78000,  statut:'immobilise'    },
  { immatriculation:'GA-1122-TF', marque:'Toyota',     modele:'HiAce',        kilometrage:33000,  statut:'disponible'    },
];

// table: utilisateurs (ceux qui peuvent saisir une intervention)
const UTILISATEURS = [
  { id:1, nom:'Hulas Djyembi', role_code:'admin',     role_libelle:'Administrateur'       },
  { id:2, nom:'Chef du Parc',  role_code:'chef_parc', role_libelle:'Gestionnaire du Parc' },
  { id:7, nom:'Jean Mékamé',   role_code:'mecanicien',role_libelle:'Mécanicien'            },
];

// table: pieces_detachees (avec quantite_stock simulée)
const INIT_PIECES = [
  { id:1, sku:'FH-001', nom:'Filtre à huile',          type_piece:'filtration',    unite:'unité', prix_unitaire:8500,  quantite_stock:45, seuil_alerte:5,  emplacement:'Rayon A1' },
  { id:2, sku:'PF-002', nom:'Plaquettes de frein AV',  type_piece:'freinage',      unite:'jeu',   prix_unitaire:45000, quantite_stock:12, seuil_alerte:3,  emplacement:'Rayon B2' },
  { id:3, sku:'HM-003', nom:'Huile moteur 5W40 (5L)',  type_piece:'lubrification', unite:'bidon', prix_unitaire:15000, quantite_stock:30, seuil_alerte:5,  emplacement:'Rayon A2' },
  { id:4, sku:'FA-004', nom:'Filtre à air',            type_piece:'filtration',    unite:'unité', prix_unitaire:12000, quantite_stock:8,  seuil_alerte:3,  emplacement:'Rayon A1' },
  { id:5, sku:'BA-005', nom:'Batterie 12V 70Ah',       type_piece:'electricite',   unite:'unité', prix_unitaire:85000, quantite_stock:4,  seuil_alerte:2,  emplacement:'Rayon C1' },
  { id:6, sku:'CD-006', nom:'Courroie distribution',   type_piece:'moteur',        unite:'unité', prix_unitaire:35000, quantite_stock:6,  seuil_alerte:2,  emplacement:'Rayon D1' },
  { id:7, sku:'PN-007', nom:'Pneu 265/70 R16',         type_piece:'pneumatique',   unite:'unité', prix_unitaire:95000, quantite_stock:3,  seuil_alerte:4,  emplacement:'Rayon E1' },
  { id:8, sku:'AM-008', nom:'Amortisseur AV droit',    type_piece:'suspension',    unite:'unité', prix_unitaire:75000, quantite_stock:2,  seuil_alerte:2,  emplacement:'Rayon D2' },
  { id:9, sku:'LF-009', nom:'Liquide de frein DOT4',   type_piece:'freinage',      unite:'litre', prix_unitaire:5000,  quantite_stock:20, seuil_alerte:5,  emplacement:'Rayon B1' },
  { id:10,sku:'AF-010', nom:'Antigel concentré',       type_piece:'refroidissement',unite:'litre',prix_unitaire:4500,  quantite_stock:15, seuil_alerte:4,  emplacement:'Rayon A3' },
];

// table: outils
const INIT_OUTILS = [
  { id:1, nom:'Clé dynamométrique 1/2"',   type:'outillage_main',   categorie:'serrage',       etat:'OK',     emplacement:'Atelier principal' },
  { id:2, nom:'Valise de diagnostic OBD2', type:'electronique',     categorie:'diagnostic',    etat:'OK',     emplacement:'Bureau technicien' },
  { id:3, nom:'Cric hydraulique 3T',       type:'levage',           categorie:'manutention',   etat:'OK',     emplacement:'Atelier principal' },
  { id:4, nom:'Clé à choc pneumatique',    type:'outillage_main',   categorie:'serrage',       etat:'OK',     emplacement:'Atelier principal' },
  { id:5, nom:'Manomètre pression pneus',  type:'mesure',           categorie:'pneumatiques',  etat:'OK',     emplacement:'Entrée atelier'    },
  { id:6, nom:'Extracteur de roulements',  type:'outillage_special',categorie:'démontage',     etat:'defaut', emplacement:'Armoire B'         },
  { id:7, nom:'Presse hydraulique 10T',    type:'levage',           categorie:'manutention',   etat:'OK',     emplacement:'Fond atelier'      },
  { id:8, nom:'Lampe inspection LED',      type:'eclairage',        categorie:'inspection',    etat:'OK',     emplacement:'Atelier principal' },
];

// table: demandes_intervention approuvées (sans intervention liée encore)
const DEMANDES_APPROUVEES = [
  { id:1,  reference:'DEM-00001', vehicule_immatriculation:'GA-1234-AB', type_intervention:'moteur',    type_maintenance:'corrective', priorite:'haute',   commentaire:'Fuite huile constatée'         },
  { id:2,  reference:'DEM-00002', vehicule_immatriculation:'GA-5678-CD', type_intervention:'freinage',  type_maintenance:'corrective', priorite:'urgente', commentaire:'Pédale de frein molle'         },
  { id:18, reference:'DEM-00018', vehicule_immatriculation:'GA-5678-CD', type_intervention:'freinage',  type_maintenance:'corrective', priorite:'haute',   commentaire:'Disques avant usés'            },
];

// Valeurs enum BDD
const TYPES_INTERVENTION = [
  { code:'revision_generale',     libelle:'Révision générale',       categorie:'preventive' },
  { code:'vidange',               libelle:'Vidange',                  categorie:'preventive' },
  { code:'freinage',              libelle:'Freinage',                 categorie:'corrective' },
  { code:'moteur',                libelle:'Moteur',                   categorie:'corrective' },
  { code:'transmission',          libelle:'Transmission',             categorie:'corrective' },
  { code:'electricite',           libelle:'Électricité',              categorie:'corrective' },
  { code:'carrosserie',           libelle:'Carrosserie',              categorie:'corrective' },
  { code:'pneumatiques',          libelle:'Pneumatiques',             categorie:'corrective' },
  { code:'climatisation',         libelle:'Climatisation',            categorie:'corrective' },
  { code:'suspension',            libelle:'Suspension',               categorie:'corrective' },
  { code:'batterie',              libelle:'Batterie',                 categorie:'corrective' },
  { code:'echappement',           libelle:'Échappement',              categorie:'corrective' },
  { code:'direction',             libelle:'Direction',                categorie:'corrective' },
  { code:'refroidissement',       libelle:'Refroidissement',          categorie:'preventive' },
  { code:'courroie_distribution', libelle:'Courroie de distribution', categorie:'preventive' },
];

const SEVERITES = [
  { code:'faible',   libelle:'Faible',   color:'#10b981', bg:'bg-green-100 text-green-700',   icon:'bi-arrow-down-circle-fill' },
  { code:'normale',  libelle:'Normale',  color:'#6366f1', bg:'bg-indigo-100 text-indigo-700', icon:'bi-dash-circle-fill'       },
  { code:'haute',    libelle:'Haute',    color:'#f59e0b', bg:'bg-yellow-100 text-yellow-700', icon:'bi-arrow-up-circle-fill'   },
  { code:'critique', libelle:'Critique', color:'#ef4444', bg:'bg-red-100 text-red-700',       icon:'bi-exclamation-circle-fill'},
];

const STATUTS_INTERV = [
  { code:'planifiee', libelle:'Planifiée', color:'#6366f1', bg:'bg-indigo-100 text-indigo-700', icon:'bi-calendar-check-fill' },
  { code:'en_cours',  libelle:'En cours',  color:'#f59e0b', bg:'bg-yellow-100 text-yellow-700', icon:'bi-tools'               },
  { code:'terminee',  libelle:'Terminée',  color:'#10b981', bg:'bg-green-100 text-green-700',   icon:'bi-check-circle-fill'   },
  { code:'annulee',   libelle:'Annulée',   color:'#ef4444', bg:'bg-red-100 text-red-700',       icon:'bi-x-circle-fill'       },
];

const RESULTATS = [
  { code:'en_attente', libelle:'En attente', color:'#94a3b8' },
  { code:'resolu',     libelle:'Résolu',     color:'#10b981' },
  { code:'partiel',    libelle:'Partiel',    color:'#f59e0b' },
  { code:'echec',      libelle:'Échec',      color:'#ef4444' },
  { code:'reporte',    libelle:'Reporté',    color:'#6366f1' },
];

// ============================================================================
// DONNÉES DEMO — 15 INTERVENTIONS
// ============================================================================
const INIT_INTERVENTIONS = [
  { id:1,  demande_id:3,  vehicule_immatriculation:'GA-9012-EF', intervenant_id:1, type_intervention:'vidange',           severite:'faible',   date_debut:'2025-11-19T08:00:00Z', date_fin:'2025-11-19T09:50:00Z', duree_minutes:110, duree_estimee_heures:2, km_au_moment_intervention:210000, diagnostic:'Huile moteur très dégradée, niveau critique.', resultat:'resolu',   cout_main_oeuvre:50000,  cout_pieces:23500, notes:null, statut:'terminee', date_creation:'2025-11-19T07:00:00Z', date_modification:'2025-11-19T09:50:00Z' },
  { id:2,  demande_id:6,  vehicule_immatriculation:'GA-2345-KL', intervenant_id:2, type_intervention:'revision_generale', severite:'normale',  date_debut:'2025-10-11T08:00:00Z', date_fin:'2025-10-11T12:50:00Z', duree_minutes:290, duree_estimee_heures:5, km_au_moment_intervention:55000,  diagnostic:null,                                           resultat:'resolu',   cout_main_oeuvre:175000, cout_pieces:20500, notes:null, statut:'terminee', date_creation:'2025-10-11T07:00:00Z', date_modification:'2025-10-11T12:50:00Z' },
  { id:3,  demande_id:9,  vehicule_immatriculation:'GA-1234-AB', intervenant_id:2, type_intervention:'courroie_distribution',severite:'haute', date_debut:'2025-09-14T08:30:00Z', date_fin:'2025-09-14T12:20:00Z', duree_minutes:230, duree_estimee_heures:4, km_au_moment_intervention:145000, diagnostic:'Courroie proche limite kilométrique.',          resultat:'resolu',   cout_main_oeuvre:140000, cout_pieces:35000, notes:null, statut:'terminee', date_creation:'2025-09-14T07:00:00Z', date_modification:'2025-09-14T12:20:00Z' },
  { id:4,  demande_id:11, vehicule_immatriculation:'GA-9012-EF', intervenant_id:1, type_intervention:'echappement',       severite:'faible',   date_debut:'2025-11-01T09:30:00Z', date_fin:'2025-11-01T11:25:00Z', duree_minutes:115, duree_estimee_heures:2, km_au_moment_intervention:210200, diagnostic:null,                                           resultat:'resolu',   cout_main_oeuvre:50000,  cout_pieces:0,     notes:null, statut:'terminee', date_creation:'2025-11-01T09:00:00Z', date_modification:'2025-11-01T11:25:00Z' },
  { id:5,  demande_id:13, vehicule_immatriculation:'GA-7890-IJ', intervenant_id:1, type_intervention:'refroidissement',   severite:'normale',  date_debut:'2025-08-19T08:30:00Z', date_fin:'2025-08-19T11:30:00Z', duree_minutes:180, duree_estimee_heures:3, km_au_moment_intervention:112000, diagnostic:null,                                           resultat:'resolu',   cout_main_oeuvre:75000,  cout_pieces:0,     notes:null, statut:'terminee', date_creation:'2025-08-19T07:00:00Z', date_modification:'2025-08-19T11:30:00Z' },
  { id:6,  demande_id:16, vehicule_immatriculation:'GA-1122-TF', intervenant_id:1, type_intervention:'vidange',           severite:'faible',   date_debut:'2025-06-04T07:30:00Z', date_fin:'2025-06-04T09:10:00Z', duree_minutes:100, duree_estimee_heures:2, km_au_moment_intervention:33000,  diagnostic:null,                                           resultat:'resolu',   cout_main_oeuvre:50000,  cout_pieces:23500, notes:null, statut:'terminee', date_creation:'2025-06-04T07:00:00Z', date_modification:'2025-06-04T09:10:00Z' },
  { id:7,  demande_id:18, vehicule_immatriculation:'GA-5678-CD', intervenant_id:8, type_intervention:'freinage',          severite:'haute',    date_debut:'2026-01-09T08:30:00Z', date_fin:'2026-01-09T11:15:00Z', duree_minutes:165, duree_estimee_heures:3, km_au_moment_intervention:90000,  diagnostic:'Disques et plaquettes avant très usés.',       resultat:'resolu',   cout_main_oeuvre:90000,  cout_pieces:45000, notes:null, statut:'terminee', date_creation:'2026-01-09T08:00:00Z', date_modification:'2026-01-09T11:15:00Z' },
  { id:8,  demande_id:null,vehicule_immatriculation:'GA-3456-GH',intervenant_id:3, type_intervention:'carrosserie',       severite:'faible',   date_debut:null,                   date_fin:null,                   duree_minutes:null,duree_estimee_heures:6, km_au_moment_intervention:67000,  diagnostic:null,                                           resultat:'en_attente',cout_main_oeuvre:132000, cout_pieces:0,     notes:'Attente pièces carrosserie.', statut:'planifiee', date_creation:'2026-01-15T09:00:00Z', date_modification:'2026-01-15T09:00:00Z' },
  { id:9,  demande_id:4,  vehicule_immatriculation:'GA-3456-GH', intervenant_id:3, type_intervention:'electricite',       severite:'haute',    date_debut:'2026-01-20T09:00:00Z', date_fin:null,                   duree_minutes:null,duree_estimee_heures:4, km_au_moment_intervention:67200,  diagnostic:'Court-circuit faisceau alternateur détecté.', resultat:'en_attente',cout_main_oeuvre:112000, cout_pieces:0,     notes:null, statut:'en_cours', date_creation:'2026-01-20T08:00:00Z', date_modification:'2026-01-20T09:00:00Z' },
  { id:10, demande_id:null,vehicule_immatriculation:'GA-7890-IJ',intervenant_id:7, type_intervention:'pneumatiques',      severite:'haute',    date_debut:'2026-01-22T07:00:00Z', date_fin:null,                   duree_minutes:null,duree_estimee_heures:2, km_au_moment_intervention:112500, diagnostic:'Pneus avant usure irrégulière.',               resultat:'en_attente',cout_main_oeuvre:40000,  cout_pieces:95000, notes:null, statut:'en_cours', date_creation:'2026-01-22T07:00:00Z', date_modification:'2026-01-22T07:00:00Z' },
  { id:11, demande_id:null,vehicule_immatriculation:'GA-1234-AB',intervenant_id:1, type_intervention:'moteur',            severite:'critique', date_debut:'2026-01-25T08:00:00Z', date_fin:null,                   duree_minutes:null,duree_estimee_heures:7, km_au_moment_intervention:146000, diagnostic:'Fuite huile moteur, perte de puissance.',      resultat:'en_attente',cout_main_oeuvre:245000, cout_pieces:0,     notes:null, statut:'en_cours', date_creation:'2026-01-25T07:00:00Z', date_modification:'2026-01-25T08:00:00Z' },
  { id:12, demande_id:null,vehicule_immatriculation:'GA-2345-KL',intervenant_id:2, type_intervention:'suspension',        severite:'haute',    date_debut:null,                   date_fin:null,                   duree_minutes:null,duree_estimee_heures:5, km_au_moment_intervention:55200,  diagnostic:null,                                           resultat:'en_attente',cout_main_oeuvre:150000, cout_pieces:75000, notes:null, statut:'planifiee', date_creation:'2026-01-28T10:00:00Z', date_modification:'2026-01-28T10:00:00Z' },
  { id:13, demande_id:null,vehicule_immatriculation:'GA-6789-MN',intervenant_id:5, type_intervention:'direction',         severite:'critique', date_debut:'2026-02-01T08:30:00Z', date_fin:null,                   duree_minutes:null,duree_estimee_heures:5, km_au_moment_intervention:78200,  diagnostic:'Direction assistée HS.',                       resultat:'en_attente',cout_main_oeuvre:150000, cout_pieces:0,     notes:null, statut:'en_cours', date_creation:'2026-02-01T08:00:00Z', date_modification:'2026-02-01T08:30:00Z' },
  { id:14, demande_id:null,vehicule_immatriculation:'GA-1122-TF',intervenant_id:1, type_intervention:'revision_generale', severite:'normale',  date_debut:null,                   date_fin:null,                   duree_minutes:null,duree_estimee_heures:5, km_au_moment_intervention:33000,  diagnostic:null,                                           resultat:'en_attente',cout_main_oeuvre:175000, cout_pieces:20500, notes:'Révision 35 000 km.', statut:'planifiee', date_creation:'2026-02-05T07:00:00Z', date_modification:'2026-02-05T07:00:00Z' },
  { id:15, demande_id:null,vehicule_immatriculation:'GA-9012-EF',intervenant_id:4, type_intervention:'batterie',          severite:'haute',    date_debut:null,                   date_fin:null,                   duree_minutes:null,duree_estimee_heures:1, km_au_moment_intervention:211000, diagnostic:'Alternateur suspect, batterie en baisse.',     resultat:'en_attente',cout_main_oeuvre:28000,  cout_pieces:85000, notes:null, statut:'planifiee', date_creation:'2026-02-10T09:00:00Z', date_modification:'2026-02-10T09:00:00Z' },
];

// prelevements_pieces liés aux interventions
const INIT_PRELEVEMENTS = [
  { id:1, intervention_id:1, piece_id:1, quantite:1, prix_unitaire:8500,  preleve_par_user_id:2, date_prelevement:'2025-11-19T08:30:00Z', notes:null },
  { id:2, intervention_id:1, piece_id:3, quantite:1, prix_unitaire:15000, preleve_par_user_id:2, date_prelevement:'2025-11-19T08:30:00Z', notes:null },
  { id:3, intervention_id:2, piece_id:1, quantite:1, prix_unitaire:8500,  preleve_par_user_id:2, date_prelevement:'2025-10-11T09:00:00Z', notes:null },
  { id:4, intervention_id:2, piece_id:4, quantite:1, prix_unitaire:12000, preleve_par_user_id:2, date_prelevement:'2025-10-11T09:00:00Z', notes:null },
  { id:5, intervention_id:3, piece_id:6, quantite:1, prix_unitaire:35000, preleve_par_user_id:2, date_prelevement:'2025-09-14T09:00:00Z', notes:null },
  { id:6, intervention_id:6, piece_id:1, quantite:1, prix_unitaire:8500,  preleve_par_user_id:2, date_prelevement:'2025-06-04T08:00:00Z', notes:null },
  { id:7, intervention_id:6, piece_id:3, quantite:1, prix_unitaire:15000, preleve_par_user_id:2, date_prelevement:'2025-06-04T08:00:00Z', notes:null },
  { id:8, intervention_id:7, piece_id:2, quantite:1, prix_unitaire:45000, preleve_par_user_id:2, date_prelevement:'2026-01-09T09:00:00Z', notes:null },
];

// outils utilisés par intervention (table de liaison simulée)
const INIT_OUTILS_INTERVENTION = [
  { id:1, intervention_id:1, outil_id:1, notes:null },
  { id:2, intervention_id:1, outil_id:3, notes:null },
  { id:3, intervention_id:2, outil_id:1, notes:null },
  { id:4, intervention_id:2, outil_id:2, notes:'Diagnostic complet effectué' },
  { id:5, intervention_id:7, outil_id:4, notes:null },
  { id:6, intervention_id:7, outil_id:3, notes:null },
  { id:7, intervention_id:9, outil_id:2, notes:'OBD utilisé pour scan complet' },
  { id:8, intervention_id:11,outil_id:2, notes:null },
];

// mouvements_stock générés (log lecture seule)
const INIT_MOUVEMENTS = INIT_PRELEVEMENTS.map((p, i) => ({
  id: i + 1,
  piece_id: p.piece_id,
  type_mouvement: 'sortie',
  quantite: -p.quantite,
  prix_unitaire: p.prix_unitaire,
  type_reference: 'intervention',
  reference_id: p.intervention_id,
  effectue_par_user_id: p.preleve_par_user_id,
  date_creation: p.date_prelevement,
}));

// ============================================================================
// UTILITAIRES
// ============================================================================
const getInterv     = (id) => INTERVENANTS.find(i => i.id === id);
const getTypeInterv = (id) => TYPES_INTERVENANT.find(t => t.id === id);
const getVeh        = (im) => VEHICULES.find(v => v.immatriculation === im);
const getSeverite   = (c)  => SEVERITES.find(s => s.code === c) || { libelle:c, color:'#94a3b8', bg:'bg-gray-100 text-gray-600', icon:'bi-circle' };
const getStatutI    = (c)  => STATUTS_INTERV.find(s => s.code === c) || { libelle:c, color:'#94a3b8', bg:'bg-gray-100 text-gray-600', icon:'bi-circle' };
const getResultat   = (c)  => RESULTATS.find(r => r.code === c) || { libelle:c, color:'#94a3b8' };
const getTypeIntLib = (c)  => TYPES_INTERVENTION.find(t => t.code === c)?.libelle || c;
const getUser       = (id) => UTILISATEURS.find(u => u.id === id);
const getPiece      = (id) => INIT_PIECES.find(p => p.id === id); // reference only

const getNomIntervenant = (inv) => {
  if (!inv) return '—';
  if (!inv.est_externe && inv.user_id) {
    const u = UTILISATEURS.find(u => u.id === inv.user_id);
    return u?.nom || inv.nom_externe || '—';
  }
  return inv.nom_externe || '—';
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
};
const formatDateTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
};
const formatDuree = (min) => {
  if (!min) return '—';
  return min < 60 ? `${min} min` : `${Math.floor(min/60)}h${String(min%60).padStart(2,'0')}`;
};
const formatCFA = (v) => v == null ? '—' : new Intl.NumberFormat('fr-FR').format(v) + ' FCFA';
const formatRelative = (iso) => {
  if (!iso) return '—';
  const diff = (new Date() - new Date(iso)) / 1000;
  if (diff < 3600) return `Il y a ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff/3600)}h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff/86400)} j`;
  return formatDate(iso);
};

// ============================================================================
// TOAST
// ============================================================================
const Toast = ({ msg, type, onClose, theme }) => {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, [onClose]);
  const c = { success:'#10b981', error:'#ef4444', warning:'#f97316', info: theme?.primary||'#3b82f6' };
  const ic = { success:'bi-check-circle-fill', error:'bi-x-circle-fill', warning:'bi-exclamation-triangle-fill', info:'bi-info-circle-fill' };
  return (
    <div className="fixed top-4 right-4 z-[9999] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px] text-white"
      style={{ background: c[type]||c.info, animation:'fadeInDown .3s ease-out' }}>
      <i className={`bi ${ic[type]||ic.info} text-xl`}></i>
      <span className="font-semibold text-sm flex-1">{msg}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100"><i className="bi bi-x-lg text-sm"></i></button>
    </div>
  );
};

// ============================================================================
// HOOK COUNTER
// ============================================================================
const useCountUp = (target, dur = 1200) => {
  const [v, setV] = useState(0);
  const raf = useRef(null); const t0 = useRef(null);
  useEffect(() => {
    if (!target) { setV(0); return; }
    t0.current = null;
    const step = ts => {
      if (!t0.current) t0.current = ts;
      const p = Math.min((ts - t0.current) / dur, 1);
      setV(Math.round((1 - Math.pow(2,-10*p)) * target));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, dur]);
  return v;
};

// ============================================================================
// DONUT CHART
// ============================================================================
const Donut = ({ data, size=110, sw=13, center, dark }) => {
  const [hov, setHov] = useState(null);
  const r = (size-sw)/2, c = 2*Math.PI*r;
  const tot = data.reduce((s,d)=>s+d.v,0)||1;
  let off=0;
  const segs = data.map((d,i) => { const l=(d.v/tot)*c; const s={...d,i,l,off}; off+=l; return s; });
  return (
    <div className="relative inline-block">
      <svg width={size} height={size} style={{transform:'rotate(-90deg)',display:'block'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={dark?'#1f2937':'#f1f5f9'} strokeWidth={sw}/>
        {segs.map(s=>(
          <circle key={s.i} cx={size/2} cy={size/2} r={r} fill="none" stroke={s.color}
            strokeWidth={hov===s.i?sw+3:sw} strokeDasharray={`${s.l} ${c-s.l}`} strokeDashoffset={-s.off} strokeLinecap="round"
            style={{transition:'stroke-width .15s',cursor:'pointer'}}
            onMouseEnter={()=>setHov(s.i)} onMouseLeave={()=>setHov(null)}/>
        ))}
      </svg>
      {center && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className={`text-xl font-black ${dark?'text-white':'text-gray-900'}`}>{center.v}</span>
          <span className={`text-[10px] ${dark?'text-gray-500':'text-gray-400'}`}>{center.l}</span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// KPI CARD
// ============================================================================
const KPI = ({ label, target, icon, color, sub, delay, dark, animate }) => {
  const v = useCountUp(target);
  return (
    <div className={`${dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-2xl border shadow-sm p-5`}
      style={{animation:animate?`fadeInUp .5s ease-out ${delay}s both`:'none'}}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{background:`${color}22`}}>
        <i className={`${icon} text-lg`} style={{color}}></i>
      </div>
      <p className={`text-3xl font-black tabular-nums ${dark?'text-white':'text-gray-900'}`}>{v}</p>
      <p className={`text-sm font-semibold mt-0.5 ${dark?'text-gray-300':'text-gray-700'}`}>{label}</p>
      <p className={`text-xs mt-0.5 ${dark?'text-gray-500':'text-gray-400'}`}>{sub}</p>
    </div>
  );
};

// ============================================================================
// BADGE STOCK
// ============================================================================
const StockBadge = ({ piece, dark }) => {
  if (!piece) return null;
  const low = piece.quantite_stock <= piece.seuil_alerte;
  const out = piece.quantite_stock === 0;
  if (out)  return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold"><i className="bi bi-x-circle-fill mr-0.5"></i>Rupture</span>;
  if (low)  return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold"><i className="bi bi-exclamation-triangle-fill mr-0.5"></i>Stock bas</span>;
  return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">{piece.quantite_stock} {piece.unite}</span>;
};

// ============================================================================
// MODAL — DÉTAIL INTERVENTION
// ============================================================================
const DetailModal = ({ item, prelevements, outilsUtilises, allPieces, allOutils, dark, theme, onClose, onEdit, onDelete, onChangeStatut }) => {
  const inv = getInterv(item.intervenant_id);
  const typeInv = inv ? getTypeInterv(inv.type_intervenant_id) : null;
  const veh = getVeh(item.vehicule_immatriculation);
  const sev = getSeverite(item.severite);
  const stat = getStatutI(item.statut);
  const res = getResultat(item.resultat);
  const prelev = prelevements.filter(p => p.intervention_id === item.id);
  const outilsItem = outilsUtilises.filter(o => o.intervention_id === item.id);
  const demande = DEMANDES_APPROUVEES.find(d => d.id === item.demande_id);
  const coutTotal = (item.cout_main_oeuvre||0) + (item.cout_pieces||0);

  const card = `${dark?'bg-gray-800 border-gray-700':'bg-gray-50 border-gray-200'} rounded-xl border p-5`;
  const secT = `text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${dark?'text-gray-400':'text-gray-500'}`;
  const row = (l,v,ic,vc) => (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className={`flex items-center gap-2 text-xs shrink-0 ${dark?'text-gray-500':'text-gray-400'}`}>
        {ic&&<i className={`bi ${ic}`}></i>}{l}
      </div>
      <span className={`text-xs font-semibold text-right ${vc||''} ${dark?'text-gray-200':'text-gray-800'}`}>{v||'—'}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-3">
      <div className={`${dark?'bg-gray-900':'bg-white'} rounded-2xl w-[96vw] h-[94vh] overflow-hidden flex flex-col shadow-2xl`}>
        {/* HEADER */}
        <div className={`p-6 border-b ${dark?'border-gray-800':'border-gray-200'} flex items-start justify-between shrink-0`}
          style={{background:`linear-gradient(135deg, ${theme.primary}15, transparent)`}}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"
              style={{background:`linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`}}>
              {typeInv && <i className={`bi ${typeInv.icon} text-xl`}></i>}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-lg font-bold ${dark?'text-white':'text-gray-900'}`}>INT-{String(item.id).padStart(5,'0')}</h2>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${stat.bg}`}><i className={`bi ${stat.icon} mr-1`}></i>{stat.libelle}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${sev.bg}`}>{sev.libelle}</span>
                {typeInv && <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{background:`${typeInv.color}22`,color:typeInv.color}}><i className={`bi ${typeInv.icon} mr-1`}></i>{typeInv.libelle}</span>}
              </div>
              <p className={`text-sm mt-0.5 ${dark?'text-gray-400':'text-gray-500'}`}>
                {getTypeIntLib(item.type_intervention)} · {formatDateTime(item.date_creation)}
                {demande && <span className="ml-2 text-xs opacity-70">← {demande.reference}</span>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${dark?'hover:bg-gray-800 text-gray-400':'hover:bg-gray-100 text-gray-500'}`}>
            <i className="bi bi-x-lg text-lg"></i>
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-5">

            {/* COL 1 */}
            <div className="space-y-4">
              <div className={card}>
                <p className={secT}><i className="bi bi-car-front-fill text-blue-400"></i>Véhicule</p>
                {row('Immatriculation', item.vehicule_immatriculation, 'bi-card-text')}
                {row('Modèle', veh?`${veh.marque} ${veh.modele}`:'—', 'bi-car-front')}
                {row('Km intervention', item.km_au_moment_intervention?`${item.km_au_moment_intervention.toLocaleString('fr-FR')} km`:'—', 'bi-speedometer2')}
                {row('Statut véhicule', veh?.statut?.replace(/_/g,' ')||'—', 'bi-circle-fill')}
              </div>

              <div className={card}>
                <p className={secT}><i className="bi bi-person-fill-gear text-indigo-400"></i>Intervenant</p>
                <div className="flex items-center gap-3 pb-3 mb-3" style={{borderBottom:`1px solid ${dark?'#374151':'#e5e7eb'}`}}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm shrink-0"
                    style={{background:typeInv?.color||'#94a3b8'}}>
                    <i className={`bi ${typeInv?.icon||'bi-person'}`}></i>
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${dark?'text-gray-100':'text-gray-900'}`}>{getNomIntervenant(inv)}</p>
                    <p className={`text-xs ${dark?'text-gray-500':'text-gray-400'}`}>{typeInv?.libelle||'—'}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${inv?.est_externe?'bg-orange-100 text-orange-700':'bg-blue-100 text-blue-700'}`}>
                      {inv?.est_externe?'Externe':'Interne'}
                    </span>
                  </div>
                </div>
                {row('Téléphone', inv?.telephone||'—', 'bi-telephone-fill')}
                {row('Tarif horaire', inv?formatCFA(inv.tarif_horaire):'—', 'bi-clock-fill')}
                {row('Spécialisation', inv?.specialisation||'—', 'bi-award-fill')}
              </div>

              <div className={card}>
                <p className={secT}><i className="bi bi-calendar3 text-orange-400"></i>Planification</p>
                {row('Date début', formatDateTime(item.date_debut), 'bi-play-circle-fill', item.date_debut?'text-green-500':'')}
                {row('Date fin', formatDateTime(item.date_fin), 'bi-stop-circle-fill', item.date_fin?'text-green-500':'')}
                {row('Durée estimée', item.duree_estimee_heures?`${item.duree_estimee_heures}h`:'—', 'bi-hourglass')}
                {row('Durée réelle', formatDuree(item.duree_minutes), 'bi-stopwatch-fill')}
                {row('Résultat', res.libelle, 'bi-clipboard2-check-fill')}
              </div>
            </div>

            {/* COL 2 */}
            <div className="space-y-4">
              <div className={card}>
                <p className={secT}><i className="bi bi-search text-cyan-400"></i>Diagnostic & Notes</p>
                <p className={`text-sm leading-relaxed mb-3 ${dark?'text-gray-300':'text-gray-700'}`}>{item.diagnostic||<span className="italic opacity-50">Aucun diagnostic renseigné.</span>}</p>
                {item.notes && <p className={`text-xs italic pt-3 border-t ${dark?'border-gray-700 text-gray-500':'border-gray-200 text-gray-400'}`}><i className="bi bi-sticky-fill mr-1"></i>{item.notes}</p>}
              </div>

              {/* Pièces utilisées — prelevements_pieces */}
              <div className={card}>
                <p className={secT}>
                  <i className="bi bi-box-seam-fill text-yellow-400"></i>Pièces prélevées
                  {prelev.length>0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{background:`${theme.primary}22`,color:theme.primary}}>{prelev.length}</span>}
                  <span className={`ml-auto text-[10px] font-normal normal-case ${dark?'text-gray-600':'text-gray-400'}`}>→ mouvements_stock</span>
                </p>
                {prelev.length===0 ? (
                  <p className={`text-xs italic ${dark?'text-gray-600':'text-gray-400'}`}>Aucune pièce prélevée.</p>
                ) : (
                  <div className="space-y-2">
                    {prelev.map((p,i) => {
                      const piece = allPieces.find(pc=>pc.id===p.piece_id);
                      return (
                        <div key={i} className={`flex items-center justify-between gap-2 p-2.5 rounded-lg ${dark?'bg-gray-700/60':'bg-white'} shadow-sm`}>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${dark?'text-gray-200':'text-gray-800'}`}>{piece?.nom||'—'}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className={`text-[10px] ${dark?'text-gray-500':'text-gray-400'}`}>{piece?.sku} · x{p.quantite}</p>
                              {piece && <StockBadge piece={piece} dark={dark}/>}
                            </div>
                          </div>
                          <span className={`text-xs font-bold shrink-0 ${dark?'text-gray-300':'text-gray-700'}`}>{formatCFA(p.quantite*p.prix_unitaire)}</span>
                        </div>
                      );
                    })}
                    <div className={`flex justify-between pt-2 border-t ${dark?'border-gray-700':'border-gray-200'}`}>
                      <span className={`text-xs font-semibold ${dark?'text-gray-400':'text-gray-500'}`}>Total pièces</span>
                      <span className="text-xs font-black" style={{color:theme.primary}}>{formatCFA(prelev.reduce((s,p)=>s+p.quantite*p.prix_unitaire,0))}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Outils utilisés — outils */}
              <div className={card}>
                <p className={secT}><i className="bi bi-tools text-slate-400"></i>Outils utilisés
                  {outilsItem.length>0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{background:`${theme.primary}22`,color:theme.primary}}>{outilsItem.length}</span>}
                </p>
                {outilsItem.length===0 ? (
                  <p className={`text-xs italic ${dark?'text-gray-600':'text-gray-400'}`}>Aucun outil renseigné.</p>
                ) : (
                  <div className="space-y-2">
                    {outilsItem.map((ou,i) => {
                      const outil = allOutils.find(o=>o.id===ou.outil_id);
                      return (
                        <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${dark?'bg-gray-700/60':'bg-white'} shadow-sm`}>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${outil?.etat==='defaut'?'bg-red-100':'bg-slate-100'}`}>
                            <i className={`bi bi-wrench text-xs ${outil?.etat==='defaut'?'text-red-500':'text-slate-500'}`}></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${dark?'text-gray-200':'text-gray-800'}`}>{outil?.nom||'—'}</p>
                            {outil?.etat==='defaut' && <span className="text-[10px] text-red-500"><i className="bi bi-exclamation-triangle-fill mr-0.5"></i>Défaut signalé</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* COL 3 */}
            <div className="space-y-4">
              {/* Coûts */}
              <div className={`${dark?'bg-gray-800 border-gray-700':'bg-green-50 border-green-200'} rounded-xl border p-5`}>
                <p className={secT}><i className="bi bi-cash-stack text-green-400"></i>Coûts (FCFA)</p>
                <div className="space-y-3">
                  {[
                    {l:'Main d\'œuvre', v:item.cout_main_oeuvre, ic:'bi-person-fill-gear', c:'#06b6d4'},
                    {l:'Pièces (auto)', v:item.cout_pieces,      ic:'bi-box-seam-fill',   c:'#f59e0b'},
                  ].map((k,i)=>(
                    <div key={i} className={`${dark?'bg-gray-700/60':'bg-white'} rounded-xl p-3 flex items-center gap-3 shadow-sm`}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{background:`${k.c}22`}}>
                        <i className={`bi ${k.ic} text-sm`} style={{color:k.c}}></i>
                      </div>
                      <div>
                        <p className={`text-[10px] font-semibold ${dark?'text-gray-400':'text-gray-500'}`}>{k.l}</p>
                        <p className={`text-sm font-bold ${dark?'text-white':'text-gray-900'}`}>{formatCFA(k.v)}</p>
                      </div>
                    </div>
                  ))}
                  <div className={`${dark?'bg-gray-700':'bg-white'} rounded-xl p-3 flex items-center gap-3 shadow border-2`} style={{borderColor:theme.primary}}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{background:`${theme.primary}22`}}>
                      <i className="bi bi-calculator-fill text-sm" style={{color:theme.primary}}></i>
                    </div>
                    <div>
                      <p className={`text-[10px] font-semibold ${dark?'text-gray-400':'text-gray-500'}`}>Total intervention</p>
                      <p className="text-sm font-black" style={{color:theme.primary}}>{formatCFA(coutTotal)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Changer statut */}
              <div className={card}>
                <p className={secT}><i className="bi bi-arrow-repeat text-purple-400"></i>Changer le statut</p>
                <div className="grid grid-cols-2 gap-2">
                  {STATUTS_INTERV.map(s=>(
                    <button key={s.code} onClick={()=>onChangeStatut(item.id,s.code)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5
                        ${item.statut===s.code?`${s.bg} border-transparent shadow-sm`
                          :dark?'border-gray-700 text-gray-400 hover:bg-gray-700':'border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                      <i className={`bi ${s.icon}`}></i>{s.libelle}
                    </button>
                  ))}
                </div>
              </div>

              {/* Demande liée */}
              {demande && (
                <div className={`${dark?'bg-blue-900/20 border-blue-800':'bg-blue-50 border-blue-200'} rounded-xl border p-4`}>
                  <p className={`text-xs font-bold mb-2 ${dark?'text-blue-300':'text-blue-700'}`}><i className="bi bi-link-45deg mr-1"></i>Demande d'origine</p>
                  <p className={`text-sm font-bold ${dark?'text-blue-200':'text-blue-800'}`}>{demande.reference}</p>
                  <p className={`text-xs ${dark?'text-blue-400':'text-blue-600'}`}>{getTypeIntLib(demande.type_intervention)} · {demande.priorite}</p>
                </div>
              )}

              {/* Traçabilité */}
              <div className={card}>
                <p className={secT}><i className="bi bi-clock-history text-gray-400"></i>Traçabilité</p>
                {row('Créée le',    formatDateTime(item.date_creation),    'bi-plus-circle-fill')}
                {row('Modifiée le', formatDateTime(item.date_modification), 'bi-pencil-fill')}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className={`p-5 border-t ${dark?'border-gray-800':'border-gray-200'} flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-2">
            <button onClick={()=>onEdit(item)}
              className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 shadow-sm hover:opacity-90"
              style={{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}}>
              <i className="bi bi-pencil-fill"></i> Modifier
            </button>
            <button onClick={()=>{if(window.confirm('Supprimer ?')){onDelete(item.id);onClose();}}}
              className="px-4 py-2.5 rounded-xl border border-red-300 text-red-500 text-sm font-semibold hover:bg-red-50 flex items-center gap-2">
              <i className="bi bi-trash3-fill"></i>
            </button>
          </div>
          <button onClick={onClose} className={`px-5 py-2.5 rounded-xl text-sm font-semibold ${dark?'bg-gray-800 text-gray-300 hover:bg-gray-700':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL FORMULAIRE — SAISIE D'INTERVENTION
// Touche: interventions + prelevements_pieces + outils_intervention
// ============================================================================
const FormModal = ({ item, allPieces, allOutils, dark, theme, onClose, onSave }) => {
  const isEdit = !!item;

  const [form, setForm] = useState({
    demande_id:                item?.demande_id                || '',
    vehicule_immatriculation:  item?.vehicule_immatriculation  || '',
    intervenant_id:            item?.intervenant_id            || '',
    type_intervention:         item?.type_intervention         || '',
    severite:                  item?.severite                  || 'normale',
    statut:                    item?.statut                    || 'planifiee',
    resultat:                  item?.resultat                  || 'en_attente',
    date_debut:                item?.date_debut  ? new Date(item.date_debut).toISOString().slice(0,16)  : '',
    date_fin:                  item?.date_fin    ? new Date(item.date_fin).toISOString().slice(0,16)    : '',
    duree_estimee_heures:      item?.duree_estimee_heures      || '',
    km_au_moment_intervention: item?.km_au_moment_intervention || '',
    diagnostic:                item?.diagnostic                || '',
    cout_main_oeuvre:          item?.cout_main_oeuvre          || '',
    notes:                     item?.notes                     || '',
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  // Prélèvements — prelevements_pieces
  const [prelev, setPrelev] = useState(
    item ? [] : [] // en edit on les recharge depuis le state parent via onSave
  );
  const [newPrelev, setNewPrelev] = useState({ piece_id:'', quantite:1 });

  // Outils utilisés
  const [outilsUtilises, setOutilsUtilises] = useState([]);
  const [newOutil, setNewOutil] = useState('');

  // Alerte stock bas temps réel
  const [stockAlertes, setStockAlertes] = useState([]);

  const addPrelev = () => {
    const piece = allPieces.find(p=>String(p.id)===String(newPrelev.piece_id));
    if (!piece || newPrelev.quantite < 1) return;
    const qty = Number(newPrelev.quantite);
    if (piece.quantite_stock < qty) {
      setStockAlertes(prev => [...prev, `Stock insuffisant pour "${piece.nom}" : ${piece.quantite_stock} ${piece.unite} disponible(s)`]);
      return;
    }
    setPrelev(prev => [...prev, { piece_id:piece.id, piece_nom:piece.nom, piece_sku:piece.sku, piece_unite:piece.unite, quantite:qty, prix_unitaire:piece.prix_unitaire, stock_avant:piece.quantite_stock }]);
    setNewPrelev({ piece_id:'', quantite:1 });
  };

  const addOutil = () => {
    const outil = allOutils.find(o=>String(o.id)===String(newOutil));
    if (!outil || outilsUtilises.find(o=>o.outil_id===outil.id)) return;
    if (outil.etat === 'defaut') {
      setStockAlertes(prev => [...prev, `⚠️ Outil "${outil.nom}" a un défaut signalé ! Vérifier avant utilisation.`]);
    }
    setOutilsUtilises(prev => [...prev, { outil_id:outil.id, nom:outil.nom, etat:outil.etat, notes:'' }]);
    setNewOutil('');
  };

  const coutPieces = prelev.reduce((s,p)=>s+p.quantite*p.prix_unitaire, 0);
  const coutTotal  = (Number(form.cout_main_oeuvre)||0) + coutPieces;

  // Si demande liée sélectionnée → pré-remplir
  useEffect(() => {
    if (form.demande_id) {
      const d = DEMANDES_APPROUVEES.find(d=>String(d.id)===String(form.demande_id));
      if (d) {
        set('vehicule_immatriculation', d.vehicule_immatriculation);
        set('type_intervention', d.type_intervention);
      }
    }
  }, [form.demande_id]);

  const handleSubmit = () => {
    if (!form.vehicule_immatriculation || !form.intervenant_id || !form.type_intervention) return;
    onSave({ form, prelev, outilsUtilises, isEdit, id: item?.id });
  };

  const inp = `w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30
    ${dark?'bg-gray-800 border-gray-700 text-white placeholder-gray-500':'bg-gray-50 border-gray-200 text-gray-900'}`;
  const lbl = `block text-xs font-bold mb-1.5 uppercase tracking-wider ${dark?'text-gray-400':'text-gray-500'}`;
  const blk = `${dark?'bg-gray-800 border-gray-700':'bg-gray-50 border-gray-200'} rounded-2xl border p-5`;
  const sec = `text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${dark?'text-gray-400':'text-gray-500'}`;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-3">
      <div className={`${dark?'bg-gray-900':'bg-white'} rounded-2xl w-[96vw] h-[94vh] overflow-hidden flex flex-col shadow-2xl`}>

        {/* HEADER */}
        <div className={`p-6 border-b ${dark?'border-gray-800':'border-gray-200'} flex items-center justify-between shrink-0`}
          style={{background:`linear-gradient(135deg, ${theme.primary}15, transparent)`}}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow"
              style={{background:`linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`}}>
              <i className={`bi ${isEdit?'bi-pencil-fill':'bi-plus-lg'} text-lg`}></i>
            </div>
            <div>
              <h2 className={`text-xl font-bold ${dark?'text-white':'text-gray-900'}`}>
                {isEdit?'Modifier l\'intervention':'Nouvelle saisie d\'intervention'}
              </h2>
              <p className={`text-xs ${dark?'text-gray-500':'text-gray-400'}`}>
                Touche: <code className="font-mono">interventions · prelevements_pieces · mouvements_stock · pieces_detachees</code>
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${dark?'hover:bg-gray-800 text-gray-400':'hover:bg-gray-100 text-gray-500'}`}>
            <i className="bi bi-x-lg text-xl"></i>
          </button>
        </div>

        {/* ALERTES STOCK */}
        {stockAlertes.length>0 && (
          <div className="px-6 pt-4 shrink-0 space-y-2">
            {stockAlertes.map((a,i) => (
              <div key={i} className="bg-orange-100 border border-orange-300 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill text-orange-500"></i>
                <span className="text-xs font-semibold text-orange-700">{a}</span>
                <button onClick={()=>setStockAlertes(prev=>prev.filter((_,j)=>j!==i))} className="ml-auto text-orange-400 hover:text-orange-600">
                  <i className="bi bi-x-lg text-xs"></i>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-6">

            {/* GAUCHE */}
            <div className="space-y-5">

              {/* Demande liée + véhicule + intervenant */}
              <div className={blk}>
                <p className={sec}><i className="bi bi-link-45deg text-blue-400"></i>Contexte</p>
                <div className="space-y-3">
                  <div>
                    <label className={lbl}>Demande approuvée liée <span className="font-normal normal-case opacity-60">(optionnel)</span></label>
                    <select value={form.demande_id} onChange={e=>set('demande_id',e.target.value)} className={inp}>
                      <option value="">Aucune demande liée — intervention directe</option>
                      {DEMANDES_APPROUVEES.map(d=>(
                        <option key={d.id} value={d.id}>{d.reference} · {d.vehicule_immatriculation} · {getTypeIntLib(d.type_intervention)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Véhicule *</label>
                    <select value={form.vehicule_immatriculation} onChange={e=>set('vehicule_immatriculation',e.target.value)} className={inp}>
                      <option value="">Sélectionner un véhicule</option>
                      {VEHICULES.map(v=>(
                        <option key={v.immatriculation} value={v.immatriculation}>
                          {v.immatriculation} — {v.marque} {v.modele} ({v.kilometrage.toLocaleString('fr-FR')} km)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Intervenant * <span className={`font-normal normal-case ml-1 ${dark?'text-gray-500':'text-gray-400'}`}>(table: intervenants)</span></label>
                    <select value={form.intervenant_id} onChange={e=>set('intervenant_id',e.target.value)} className={inp}>
                      <option value="">Sélectionner un intervenant</option>
                      <optgroup label="Internes">
                        {INTERVENANTS.filter(i=>!i.est_externe).map(i=>{
                          const t=getTypeInterv(i.type_intervenant_id);
                          return <option key={i.id} value={i.id}>[{t?.libelle}] {getNomIntervenant(i)} — {formatCFA(i.tarif_horaire)}/h</option>
                        })}
                      </optgroup>
                      <optgroup label="Externes">
                        {INTERVENANTS.filter(i=>i.est_externe).map(i=>{
                          const t=getTypeInterv(i.type_intervenant_id);
                          return <option key={i.id} value={i.id}>[{t?.libelle}] {getNomIntervenant(i)} — {formatCFA(i.tarif_horaire)}/h</option>
                        })}
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Km au moment de l'intervention</label>
                    <input type="number" value={form.km_au_moment_intervention} onChange={e=>set('km_au_moment_intervention',e.target.value)}
                      placeholder={form.vehicule_immatriculation?`Actuel: ${getVeh(form.vehicule_immatriculation)?.kilometrage?.toLocaleString('fr-FR')||'—'} km`:'Ex: 145000'} className={inp}/>
                  </div>
                </div>
              </div>

              {/* Type, sévérité, statut */}
              <div className={blk}>
                <p className={sec}><i className="bi bi-tools text-amber-400"></i>Classification</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={lbl}>Type d'intervention *</label>
                    <select value={form.type_intervention} onChange={e=>set('type_intervention',e.target.value)} className={inp}>
                      <option value="">Sélectionner</option>
                      <optgroup label="Corrective">
                        {TYPES_INTERVENTION.filter(t=>t.categorie==='corrective').map(t=><option key={t.code} value={t.code}>{t.libelle}</option>)}
                      </optgroup>
                      <optgroup label="Préventive">
                        {TYPES_INTERVENTION.filter(t=>t.categorie==='preventive').map(t=><option key={t.code} value={t.code}>{t.libelle}</option>)}
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Sévérité</label>
                    <select value={form.severite} onChange={e=>set('severite',e.target.value)} className={inp}>
                      {SEVERITES.map(s=><option key={s.code} value={s.code}>{s.libelle}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Statut</label>
                    <select value={form.statut} onChange={e=>set('statut',e.target.value)} className={inp}>
                      {STATUTS_INTERV.map(s=><option key={s.code} value={s.code}>{s.libelle}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Résultat</label>
                    <select value={form.resultat} onChange={e=>set('resultat',e.target.value)} className={inp}>
                      {RESULTATS.map(r=><option key={r.code} value={r.code}>{r.libelle}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Durée estimée (h)</label>
                    <input type="number" value={form.duree_estimee_heures} onChange={e=>set('duree_estimee_heures',e.target.value)} placeholder="Ex: 4" className={inp}/>
                  </div>
                  <div>
                    <label className={lbl}>Date début</label>
                    <input type="datetime-local" value={form.date_debut} onChange={e=>set('date_debut',e.target.value)} className={inp}/>
                  </div>
                  <div>
                    <label className={lbl}>Date fin</label>
                    <input type="datetime-local" value={form.date_fin} onChange={e=>set('date_fin',e.target.value)} className={inp}/>
                  </div>
                </div>
              </div>

              {/* Diagnostic & coût MO */}
              <div className={blk}>
                <p className={sec}><i className="bi bi-search text-cyan-400"></i>Diagnostic & Coûts</p>
                <div className="space-y-3">
                  <div>
                    <label className={lbl}>Diagnostic</label>
                    <textarea rows={4} value={form.diagnostic} onChange={e=>set('diagnostic',e.target.value)}
                      placeholder="Description technique du problème constaté..." className={inp+' resize-none'}/>
                  </div>
                  <div>
                    <label className={lbl}>Coût main d'œuvre (FCFA)</label>
                    <input type="number" value={form.cout_main_oeuvre} onChange={e=>set('cout_main_oeuvre',e.target.value)} placeholder="0" className={inp}/>
                  </div>
                  <div>
                    <label className={lbl}>Notes internes</label>
                    <textarea rows={2} value={form.notes} onChange={e=>set('notes',e.target.value)}
                      placeholder="Observations, recommandations..." className={inp+' resize-none'}/>
                  </div>
                </div>
              </div>
            </div>

            {/* DROITE */}
            <div className="space-y-5">

              {/* PRÉLÈVEMENTS PIÈCES — touche pieces_detachees + prelevements_pieces + mouvements_stock */}
              <div className={blk}>
                <p className={sec}>
                  <i className="bi bi-box-seam-fill text-yellow-400"></i>Pièces prélevées
                  <span className={`ml-auto text-[10px] font-normal normal-case ${dark?'text-gray-600':'text-gray-400'}`}>→ décrémente pieces_detachees.quantite_stock</span>
                </p>
                {/* Sélecteur pièce */}
                <div className="flex gap-2 mb-3">
                  <div className="flex-1">
                    <select value={newPrelev.piece_id} onChange={e=>setNewPrelev(p=>({...p,piece_id:e.target.value}))} className={inp}>
                      <option value="">Sélectionner une pièce du stock</option>
                      {allPieces.map(p=>(
                        <option key={p.id} value={p.id} disabled={p.quantite_stock===0}>
                          [{p.sku}] {p.nom} — Stock: {p.quantite_stock} {p.unite} {p.quantite_stock<=p.seuil_alerte?'⚠️':''} — {formatCFA(p.prix_unitaire)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input type="number" min="1" value={newPrelev.quantite} onChange={e=>setNewPrelev(p=>({...p,quantite:e.target.value}))}
                    className={inp+' w-16 shrink-0'} placeholder="Qté"/>
                  <button type="button" onClick={addPrelev}
                    className="px-3 py-2.5 rounded-xl text-white text-sm font-bold shrink-0 hover:opacity-90"
                    style={{background:theme.primary}}>
                    <i className="bi bi-plus-lg"></i>
                  </button>
                </div>
                {/* Liste des pièces ajoutées */}
                {prelev.length>0 ? (
                  <div className="space-y-2">
                    {prelev.map((p,i) => (
                      <div key={i} className={`flex items-center gap-2 p-2.5 rounded-xl ${dark?'bg-gray-700/60':'bg-white'} shadow-sm`}>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold truncate ${dark?'text-gray-200':'text-gray-800'}`}>{p.piece_nom}</p>
                          <p className={`text-[10px] ${dark?'text-gray-500':'text-gray-400'}`}>
                            {p.piece_sku} · x{p.quantite} {p.piece_unite} · Stock avant: {p.stock_avant}
                          </p>
                        </div>
                        <span className={`text-xs font-bold shrink-0 ${dark?'text-gray-300':'text-gray-700'}`}>{formatCFA(p.quantite*p.prix_unitaire)}</span>
                        <button onClick={()=>setPrelev(prev=>prev.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-600">
                          <i className="bi bi-x-lg text-xs"></i>
                        </button>
                      </div>
                    ))}
                    <div className={`flex items-center justify-between pt-2 border-t ${dark?'border-gray-700':'border-gray-200'}`}>
                      <div className="flex items-center gap-1.5">
                        <i className={`bi bi-arrow-down-circle-fill text-xs text-orange-400`}></i>
                        <span className={`text-xs ${dark?'text-gray-500':'text-gray-400'}`}>Sortie stock automatique à la validation</span>
                      </div>
                      <span className="text-sm font-black" style={{color:theme.primary}}>{formatCFA(coutPieces)}</span>
                    </div>
                  </div>
                ) : (
                  <p className={`text-xs italic ${dark?'text-gray-600':'text-gray-400'}`}>Aucune pièce ajoutée.</p>
                )}
              </div>

              {/* OUTILS UTILISÉS — table: outils */}
              <div className={blk}>
                <p className={sec}><i className="bi bi-tools text-slate-400"></i>Outils utilisés <span className={`font-normal normal-case ml-auto text-[10px] ${dark?'text-gray-600':'text-gray-400'}`}>(table: outils)</span></p>
                <div className="flex gap-2 mb-3">
                  <select value={newOutil} onChange={e=>setNewOutil(e.target.value)} className={inp+' flex-1'}>
                    <option value="">Sélectionner un outil</option>
                    {allOutils.map(o=>(
                      <option key={o.id} value={o.id} disabled={!!outilsUtilises.find(ou=>ou.outil_id===o.id)}>
                        {o.nom} — {o.categorie} {o.etat==='defaut'?'⚠️ DÉFAUT':''} · {o.emplacement}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={addOutil}
                    className="px-3 py-2.5 rounded-xl text-white text-sm font-bold shrink-0 hover:opacity-90"
                    style={{background:theme.primary}}>
                    <i className="bi bi-plus-lg"></i>
                  </button>
                </div>
                {outilsUtilises.length>0 ? (
                  <div className="space-y-2">
                    {outilsUtilises.map((ou,i) => (
                      <div key={i} className={`flex items-center gap-2 p-2.5 rounded-xl ${dark?'bg-gray-700/60':'bg-white'} shadow-sm`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${ou.etat==='defaut'?'bg-red-100':'bg-slate-100'}`}>
                          <i className={`bi bi-wrench text-xs ${ou.etat==='defaut'?'text-red-500':'text-slate-500'}`}></i>
                        </div>
                        <p className={`text-xs font-semibold flex-1 truncate ${dark?'text-gray-200':'text-gray-800'}`}>{ou.nom}</p>
                        {ou.etat==='defaut' && <span className="text-[10px] text-red-500 shrink-0"><i className="bi bi-exclamation-triangle-fill"></i></span>}
                        <button onClick={()=>setOutilsUtilises(prev=>prev.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-600 shrink-0">
                          <i className="bi bi-x-lg text-xs"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-xs italic ${dark?'text-gray-600':'text-gray-400'}`}>Aucun outil sélectionné.</p>
                )}
              </div>

              {/* RÉCAP COÛTS */}
              {(coutTotal > 0 || form.cout_main_oeuvre) && (
                <div className={`${dark?'bg-green-900/20 border-green-800':'bg-green-50 border-green-200'} rounded-2xl border p-5`}>
                  <p className={sec}><i className="bi bi-calculator-fill text-green-400"></i>Récapitulatif coûts</p>
                  <div className="space-y-2">
                    {[
                      ['Main d\'œuvre', Number(form.cout_main_oeuvre)||0],
                      ['Pièces',        coutPieces],
                    ].map(([l,v],i)=>(
                      <div key={i} className="flex justify-between items-center">
                        <span className={`text-xs ${dark?'text-gray-400':'text-gray-500'}`}>{l}</span>
                        <span className={`text-xs font-semibold ${dark?'text-gray-300':'text-gray-700'}`}>{formatCFA(v)}</span>
                      </div>
                    ))}
                    <div className={`flex justify-between items-center pt-2 border-t ${dark?'border-green-800':'border-green-200'}`}>
                      <span className={`text-sm font-bold ${dark?'text-green-300':'text-green-700'}`}>Total</span>
                      <span className="text-sm font-black text-green-600">{formatCFA(coutTotal)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* INFO WORKFLOW */}
              <div className={`${dark?'bg-blue-900/20 border-blue-800':'bg-blue-50 border-blue-200'} rounded-2xl border p-4 flex items-start gap-3`}>
                <i className="bi bi-info-circle-fill text-blue-400 text-lg mt-0.5 shrink-0"></i>
                <div>
                  <p className={`text-xs font-bold ${dark?'text-blue-300':'text-blue-700'}`}>Effets automatiques à la validation</p>
                  <ul className={`text-xs mt-1 space-y-1 ${dark?'text-blue-400':'text-blue-600'}`}>
                    <li><i className="bi bi-arrow-right-short"></i> Stock <code>pieces_detachees.quantite_stock</code> décrémenté</li>
                    <li><i className="bi bi-arrow-right-short"></i> Entrée dans <code>mouvements_stock</code> (type: sortie)</li>
                    <li><i className="bi bi-arrow-right-short"></i> Statut véhicule → <code>en_maintenance</code> si statut = en_cours</li>
                    <li><i className="bi bi-arrow-right-short"></i> Statut véhicule → <code>disponible</code> si terminée</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className={`p-5 border-t ${dark?'border-gray-800':'border-gray-200'} flex items-center justify-end gap-3 shrink-0`}>
          <button onClick={onClose} className={`px-5 py-2.5 rounded-xl text-sm font-semibold ${dark?'bg-gray-800 text-gray-300 hover:bg-gray-700':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            Annuler
          </button>
          <button onClick={handleSubmit}
            disabled={!form.vehicule_immatriculation||!form.intervenant_id||!form.type_intervention}
            className="px-6 py-2.5 rounded-xl text-white text-sm font-bold flex items-center gap-2 shadow-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}}>
            <i className={`bi ${isEdit?'bi-check-lg':'bi-floppy-fill'}`}></i>
            {isEdit?'Enregistrer':'Valider l\'intervention'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MENU 3 POINTS
// ============================================================================
const Menu3 = ({ item, dark, theme, onView, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({top:0,left:0});
  const ref = useRef(null);
  const toggle = e => {
    e.stopPropagation();
    if (!open) { const r=ref.current.getBoundingClientRect(); setPos({top:r.bottom+4,left:r.right-220}); }
    setOpen(o=>!o);
  };
  useEffect(()=>{ if(!open)return; const c=()=>setOpen(false); const t=setTimeout(()=>document.addEventListener('click',c,{once:true}),0); return()=>{clearTimeout(t);document.removeEventListener('click',c);}; },[open]);
  const mi = (l,ic,c,fn) => (
    <button onClick={e=>{e.stopPropagation();fn();setOpen(false);}}
      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 ${dark?'text-gray-300 hover:bg-gray-700':'text-gray-700 hover:bg-gray-50'}`}>
      <i className={`bi ${ic} text-base`} style={{color:c}}></i>{l}
    </button>
  );
  return (
    <>
      <button ref={ref} onClick={toggle}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${open?'text-white':dark?'text-gray-400 hover:bg-gray-700':'text-gray-400 hover:bg-gray-100'}`}
        style={open?{background:`linear-gradient(135deg,${theme.primary},${theme.primaryDark})`}:{}}>
        <i className="bi bi-three-dots-vertical text-sm"></i>
      </button>
      {open && ReactDOM.createPortal(
        <div onClick={e=>e.stopPropagation()}
          className={`fixed z-[9999] rounded-xl shadow-2xl border py-1.5 w-52 ${dark?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}
          style={{top:pos.top,left:pos.left,animation:'fadeInDown .15s ease-out'}}>
          {mi('Voir détails','bi-eye-fill',theme.primary,()=>onView(item))}
          {mi('Modifier','bi-pencil-fill',theme.primary,()=>onEdit(item))}
          <div className={`my-1 mx-3 border-t ${dark?'border-gray-700':'border-gray-100'}`}/>
          {mi('Supprimer','bi-trash3-fill','#ef4444',()=>{if(window.confirm('Supprimer cette intervention ?'))onDelete(item.id);})}
        </div>, document.body
      )}
    </>
  );
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
const InterventionsVehicules= () => {
  const [dark, setDark] = useState(()=>{try{const s=localStorage.getItem('fleetify_darkMode');return s!==null?s==='true':true;}catch{return true;}});
  useEffect(()=>{try{localStorage.setItem('fleetify_darkMode',String(dark));}catch{}}, [dark]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotif, setShowNotif]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [anim, setAnim] = useState(false);
  const { theme } = useTheme();
  const navigate  = useNavigate();

  useEffect(()=>{ const id=requestAnimationFrame(()=>requestAnimationFrame(()=>setAnim(true))); return()=>cancelAnimationFrame(id); },[]);

  // ── STATE ──
  const [interventions, setInterventions]     = useState(INIT_INTERVENTIONS);
  const [pieces, setPieces]                   = useState(INIT_PIECES);
  const [outils]                              = useState(INIT_OUTILS);
  const [prelevements, setPrelevements]       = useState(INIT_PRELEVEMENTS);
  const [outilsInterv, setOutilsInterv]       = useState(INIT_OUTILS_INTERVENTION);
  const [mouvements, setMouvements]           = useState(INIT_MOUVEMENTS);

  // ── FILTRES ──
  const [search, setSearch]         = useState('');
  const [fStatut, setFStatut]       = useState('');
  const [fVehicule, setFVehicule]   = useState('');
  const [fSeverite, setFSeverite]   = useState('');
  const [sortBy, setSortBy]         = useState('date_creation');
  const [sortDir, setSortDir]       = useState('desc');
  const [page, setPage]             = useState(1);
  const [vue, setVue]               = useState('table');

  // ── MODALS ──
  const [detailItem, setDetailItem] = useState(null);
  const [editItem, setEditItem]     = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [toast, setToast]           = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const expRef = useRef(null);
  const showToast = (msg, type='success') => setToast({msg,type});

  useEffect(()=>{ const h=e=>{if(expRef.current&&!expRef.current.contains(e.target))setExportOpen(false);}; document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h); },[]);

  const IPPG = 10;
  const filtered = interventions.filter(i=>{
    if (fStatut   && i.statut   !== fStatut)   return false;
    if (fVehicule && i.vehicule_immatriculation !== fVehicule) return false;
    if (fSeverite && i.severite !== fSeverite)  return false;
    if (search) {
      const q = search.toLowerCase();
      const inv = getInterv(i.intervenant_id);
      return `INT-${String(i.id).padStart(5,'0')}`.toLowerCase().includes(q)
        || i.vehicule_immatriculation.toLowerCase().includes(q)
        || getNomIntervenant(inv).toLowerCase().includes(q)
        || getTypeIntLib(i.type_intervention).toLowerCase().includes(q);
    }
    return true;
  });

  const sorted = [...filtered].sort((a,b)=>{
    let va=a[sortBy], vb=b[sortBy];
    if (['date_creation','date_debut'].includes(sortBy)) { va=new Date(va||0); vb=new Date(vb||0); }
    if (va<vb) return sortDir==='asc'?-1:1;
    if (va>vb) return sortDir==='asc'?1:-1;
    return 0;
  });
  const totalPages = Math.ceil(sorted.length/IPPG);
  const paginated  = sorted.slice((page-1)*IPPG, page*IPPG);

  useEffect(()=>setPage(1),[fStatut,fVehicule,fSeverite,search]);

  const handleSort = col => { if(sortBy===col) setSortDir(d=>d==='asc'?'desc':'asc'); else{setSortBy(col);setSortDir('desc');} };
  const hasF = fStatut||fVehicule||fSeverite||search;
  const resetF = ()=>{setFStatut('');setFVehicule('');setFSeverite('');setSearch('');};

  // STATS
  const nbPlanifie  = filtered.filter(i=>i.statut==='planifiee').length;
  const nbEnCours   = filtered.filter(i=>i.statut==='en_cours').length;
  const nbTerminee  = filtered.filter(i=>i.statut==='terminee').length;
  const coutTotal   = filtered.reduce((s,i)=>s+(i.cout_main_oeuvre||0)+(i.cout_pieces||0),0);
  const alertesStock = pieces.filter(p=>p.quantite_stock<=p.seuil_alerte);

  // ── CRUD ──
  const handleSave = ({ form, prelev, outilsUtilises, isEdit, id }) => {
    const inv  = getInterv(Number(form.intervenant_id));
    const typeInv = inv?getTypeInterv(inv.type_intervenant_id):null;
    const veh  = getVeh(form.vehicule_immatriculation);
    const coutPieces = prelev.reduce((s,p)=>s+p.quantite*p.prix_unitaire,0);

    // Calculer duree_minutes si dates présentes
    let dureeMin = null;
    if (form.date_debut && form.date_fin) {
      dureeMin = Math.round((new Date(form.date_fin)-new Date(form.date_debut))/60000);
    }

    const intervention = {
      id: isEdit ? id : Math.max(...interventions.map(i=>i.id))+1,
      demande_id:                form.demande_id || null,
      vehicule_immatriculation:  form.vehicule_immatriculation,
      intervenant_id:            Number(form.intervenant_id),
      type_intervention:         form.type_intervention,
      severite:                  form.severite,
      statut:                    form.statut,
      resultat:                  form.resultat,
      date_debut:                form.date_debut||null,
      date_fin:                  form.date_fin||null,
      duree_minutes:             dureeMin,
      duree_estimee_heures:      Number(form.duree_estimee_heures)||null,
      km_au_moment_intervention: Number(form.km_au_moment_intervention)||null,
      diagnostic:                form.diagnostic||null,
      cout_main_oeuvre:          Number(form.cout_main_oeuvre)||0,
      cout_pieces:               coutPieces,
      notes:                     form.notes||null,
      date_creation:             isEdit ? (interventions.find(i=>i.id===id)?.date_creation||new Date().toISOString()) : new Date().toISOString(),
      date_modification:         new Date().toISOString(),
    };

    // MAJ interventions
    if (isEdit) {
      setInterventions(prev=>prev.map(i=>i.id===id?intervention:i));
    } else {
      setInterventions(prev=>[intervention,...prev]);
    }

    // TRIGGER: prelevements_pieces → décrémente quantite_stock + ajoute mouvements_stock
    if (!isEdit && prelev.length > 0) {
      const newPrelevs = prelev.map((p,i)=>({
        id: Math.max(...prelevements.map(pr=>pr.id),0)+i+1,
        intervention_id: intervention.id,
        piece_id: p.piece_id,
        quantite: p.quantite,
        prix_unitaire: p.prix_unitaire,
        preleve_par_user_id: 1,
        date_prelevement: new Date().toISOString(),
        notes: null,
      }));
      setPrelevements(prev=>[...prev,...newPrelevs]);

      // Décrémente stock (simule trigger trg_maj_stock_apres_prelevement)
      setPieces(prev=>prev.map(pc=>{
        const taken = prelev.filter(p=>p.piece_id===pc.id).reduce((s,p)=>s+p.quantite,0);
        if (taken===0) return pc;
        const newStock = pc.quantite_stock - taken;
        if (newStock <= pc.seuil_alerte) {
          setTimeout(()=>showToast(`⚠️ Stock bas: ${pc.nom} (${newStock} ${pc.unite} restant(s))`, 'warning'), 500);
        }
        return {...pc, quantite_stock: newStock};
      }));

      // Ajoute mouvements_stock
      const newMouv = prelev.map((p,i)=>({
        id: Math.max(...mouvements.map(m=>m.id),0)+i+1,
        piece_id: p.piece_id,
        type_mouvement: 'sortie',
        quantite: -p.quantite,
        prix_unitaire: p.prix_unitaire,
        type_reference: 'intervention',
        reference_id: intervention.id,
        effectue_par_user_id: 1,
        date_creation: new Date().toISOString(),
      }));
      setMouvements(prev=>[...prev,...newMouv]);
    }

    // Outils utilisés
    if (!isEdit && outilsUtilises.length>0) {
      const newOutils = outilsUtilises.map((o,i)=>({
        id: Math.max(...outilsInterv.map(ou=>ou.id),0)+i+1,
        intervention_id: intervention.id,
        outil_id: o.outil_id,
        notes: o.notes||null,
      }));
      setOutilsInterv(prev=>[...prev,...newOutils]);
    }

    showToast(isEdit?'Intervention mise à jour':'Intervention enregistrée — stock mis à jour', 'success');
    setShowForm(false); setEditItem(null);
  };

  const handleDelete = id => {
    setInterventions(prev=>prev.filter(i=>i.id!==id));
    setPrelevements(prev=>prev.filter(p=>p.intervention_id!==id));
    setOutilsInterv(prev=>prev.filter(o=>o.intervention_id!==id));
    showToast('Intervention supprimée', 'warning');
  };

  const handleChangeStatut = (id, statut) => {
    setInterventions(prev=>prev.map(i=>i.id===id?{...i,statut,date_modification:new Date().toISOString()}:i));
    if (detailItem?.id===id) setDetailItem(prev=>({...prev,statut}));
    showToast(`Statut: ${getStatutI(statut).libelle}`, 'info');
  };

  const SortIc = ({col}) => <i className={`bi bi-arrow-${sortBy===col?(sortDir==='asc'?'up':'down'):'down-up'} text-[10px] ml-1 opacity-60`}></i>;

  const Pagination = () => totalPages<=1 ? null : (
    <div className={`px-6 py-4 border-t ${dark?'border-gray-800':'border-gray-100'} flex items-center justify-between`}>
      <p className={`text-sm ${dark?'text-gray-400':'text-gray-500'}`}>{(page-1)*IPPG+1}–{Math.min(page*IPPG,sorted.length)} / {sorted.length}</p>
      <div className="flex items-center gap-1.5">
        <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
          className={`p-2 rounded-lg ${dark?'text-gray-400 hover:bg-gray-800 disabled:opacity-30':'text-gray-600 hover:bg-gray-100 disabled:opacity-30'}`}>
          <i className="bi bi-chevron-left"></i>
        </button>
        {Array.from({length:Math.min(5,totalPages)},(_,i)=>{
          let p; if(totalPages<=5)p=i+1; else if(page<=3)p=i+1; else if(page>=totalPages-2)p=totalPages-4+i; else p=page-2+i;
          return <button key={p} onClick={()=>setPage(p)}
            className={`w-8 h-8 rounded-lg text-sm font-semibold ${page===p?'text-white':dark?'text-gray-400 hover:bg-gray-800':'text-gray-600 hover:bg-gray-100'}`}
            style={page===p?{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}:{}}>{p}</button>;
        })}
        <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
          className={`p-2 rounded-lg ${dark?'text-gray-400 hover:bg-gray-800 disabled:opacity-30':'text-gray-600 hover:bg-gray-100 disabled:opacity-30'}`}>
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>
  );

  return (
    <div className={`${dark?'bg-gray-950':'bg-gray-50'} min-h-screen transition-colors duration-300`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"/>
      <style>{`
        @keyframes fadeInUp   {from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeInDown {from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:translateY(0)}}
        .rh:hover{filter:brightness(1.06);cursor:pointer}
        .ch{transition:transform .15s,box-shadow .15s}.ch:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.13)}
      `}</style>

      <Sidebar darkMode={dark} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} theme={theme} navigate={navigate}/>
      <Header  darkMode={dark} setDarkMode={setDark} sidebarCollapsed={sidebarCollapsed} theme={theme}
        showNotifications={showNotif} setShowNotifications={setShowNotif} showProfile={showProfile} setShowProfile={setShowProfile}/>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} theme={theme}/>}
      {(showNotif||showProfile) && <div className="fixed inset-0 z-30" onClick={()=>{setShowNotif(false);setShowProfile(false);}}/>}

      <main className="transition-all duration-300 pt-24 px-6 pb-10" style={{marginLeft:sidebarCollapsed?'5rem':'18rem'}}>

        {/* ALERTE STOCK BAS */}
        {alertesStock.length>0 && (
          <div className={`mb-5 p-4 rounded-2xl border flex items-start gap-3 ${dark?'bg-orange-900/20 border-orange-800':'bg-orange-50 border-orange-200'}`}
            style={{animation:anim?'fadeInUp .4s ease-out both':'none'}}>
            <i className="bi bi-exclamation-triangle-fill text-orange-400 text-xl mt-0.5 shrink-0"></i>
            <div>
              <p className={`text-sm font-bold ${dark?'text-orange-300':'text-orange-700'}`}>
                {alertesStock.length} pièce(s) en alerte de stock bas
              </p>
              <p className={`text-xs mt-0.5 ${dark?'text-orange-400':'text-orange-600'}`}>
                {alertesStock.map(p=>`${p.nom} (${p.quantite_stock}/${p.seuil_alerte} ${p.unite})`).join(' · ')}
              </p>
            </div>
          </div>
        )}

       
        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KPI label="Total"       target={filtered.length} icon="bi-clipboard-check-fill"  color={theme.primary} sub="interventions"    delay={0}    dark={dark} animate={anim}/>
          <KPI label="En cours"    target={nbEnCours}        icon="bi-tools"                  color="#f59e0b"        sub="en progression"  delay={0.07} dark={dark} animate={anim}/>
          <KPI label="Terminées"   target={nbTerminee}       icon="bi-check-circle-fill"      color="#10b981"        sub="réalisées"       delay={0.14} dark={dark} animate={anim}/>
          <KPI label="Coût total"  target={Math.round(coutTotal/1000)} icon="bi-cash-stack"  color="#8b5cf6"        sub="k FCFA engagés"  delay={0.21} dark={dark} animate={anim}/>
        </div>
{/* GRAPHIQUES */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

  {/* Statuts — Barres horizontales */}
  <div className={`${dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-2xl border shadow-sm p-6`}
    style={{animation:anim?'fadeInUp .5s ease-out .28s both':'none'}}>
    <div className="flex items-center gap-2 mb-5">
      <div className="w-1 h-5 rounded-full" style={{background:theme.primary}}></div>
      <h3 className={`font-bold ${dark?'text-white':'text-gray-900'}`}>Statuts</h3>
      <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${dark?'bg-gray-800 text-gray-400':'bg-gray-100 text-gray-500'}`}>
        {filtered.length} total
      </span>
    </div>
    <div className="space-y-3">
      {STATUTS_INTERV.map(s => {
        const n = filtered.filter(i => i.statut === s.code).length;
        const pct = filtered.length ? Math.round((n / filtered.length) * 100) : 0;
        return (
          <div key={s.code} className="group relative">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{background:s.color}}></div>
                <span className={`text-xs font-medium ${dark?'text-gray-300':'text-gray-600'}`}>{s.libelle}</span>
              </div>
              <span className={`text-xs font-bold ${dark?'text-white':'text-gray-900'}`}>{n}</span>
            </div>
            <div className={`relative h-2.5 rounded-full overflow-hidden ${dark?'bg-gray-800':'bg-gray-100'}`}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{width:`${pct}%`, background:s.color}}
              ></div>
            </div>
            {/* Tooltip */}
            <div className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-xs font-semibold text-white shadow-lg
              opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10`}
              style={{background:s.color}}>
              {n} intervention{n>1?'s':''} · {pct}%
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{borderTopColor:s.color}}></div>
            </div>
          </div>
        );
      })}
    </div>
  </div>

  {/* Sévérités — Barres horizontales */}
  <div className={`${dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-2xl border shadow-sm p-6`}
    style={{animation:anim?'fadeInUp .5s ease-out .35s both':'none'}}>
    <div className="flex items-center gap-2 mb-5">
      <div className="w-1 h-5 rounded-full" style={{background:theme.primary}}></div>
      <h3 className={`font-bold ${dark?'text-white':'text-gray-900'}`}>Sévérités</h3>
      <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${dark?'bg-gray-800 text-gray-400':'bg-gray-100 text-gray-500'}`}>
        {filtered.filter(i=>i.severite==='critique').length} critique{filtered.filter(i=>i.severite==='critique').length>1?'s':''}
      </span>
    </div>
    <div className="space-y-3">
      {SEVERITES.map(s => {
        const n = filtered.filter(i => i.severite === s.code).length;
        const pct = filtered.length ? Math.round((n / filtered.length) * 100) : 0;
        return (
          <div key={s.code} className="group relative">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{background:s.color}}></div>
                <span className={`text-xs font-medium ${dark?'text-gray-300':'text-gray-600'}`}>{s.libelle}</span>
              </div>
              <span className={`text-xs font-bold ${dark?'text-white':'text-gray-900'}`}>{n}</span>
            </div>
            <div className={`relative h-2.5 rounded-full overflow-hidden ${dark?'bg-gray-800':'bg-gray-100'}`}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{width:`${pct}%`, background:s.color}}
              ></div>
            </div>
            {/* Tooltip */}
            <div className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-xs font-semibold text-white shadow-lg
              opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10`}
              style={{background:s.color}}>
              {n} intervention{n>1?'s':''} · {pct}%
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{borderTopColor:s.color}}></div>
            </div>
          </div>
        );
      })}
    </div>
  </div>

  {/* Synthèse stock + outils — inchangée */}
  <div className={`${dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-2xl border shadow-sm p-6`}
    style={{animation:anim?'fadeInUp .5s ease-out .42s both':'none'}}>
    <div className="flex items-center gap-2 mb-5">
      <div className="w-1 h-5 rounded-full" style={{background:theme.primary}}></div>
      <h3 className={`font-bold ${dark?'text-white':'text-gray-900'}`}>Stock & Outils</h3>
    </div>
    <div className="space-y-3">
      {[
        {l:'Pièces OK en stock',  v:`${pieces.filter(p=>p.quantite_stock>p.seuil_alerte).length}/${pieces.length}`, c:'#10b981', ic:'bi-box-seam-fill'},
        {l:'Alertes stock bas',   v:alertesStock.length,                                                              c:'#f97316', ic:'bi-exclamation-triangle-fill'},
        {l:'Outils disponibles', v:`${outils.filter(o=>o.etat==='OK').length}/${outils.length}`,                     c:'#3b82f6', ic:'bi-tools'},
        {l:'Outils avec défaut', v:outils.filter(o=>o.etat==='defaut').length,                                       c:'#ef4444', ic:'bi-wrench'},
        {l:'Prélèvements total', v:prelevements.length,                                                               c:theme.primary, ic:'bi-box-arrow-up-right'},
      ].map((k,i)=>(
        <div key={i} className={`flex items-center justify-between gap-3 p-3 rounded-xl ${dark?'bg-gray-800':'bg-gray-50'}`}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{background:`${k.c}22`}}>
              <i className={`bi ${k.ic} text-xs`} style={{color:k.c}}></i>
            </div>
            <span className={`text-xs font-medium ${dark?'text-gray-300':'text-gray-700'}`}>{k.l}</span>
          </div>
          <span className={`text-sm font-bold ${dark?'text-white':'text-gray-900'}`}>{k.v}</span>
        </div>
      ))}
    </div>
  </div>

</div>
 {/* EN-TÊTE */}
        <div className="flex items-center justify-between mb-6" style={{animation:anim?'fadeInUp .4s ease-out .05s both':'none'}}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
              style={{background:`linear-gradient(135deg,${theme.primary},${theme.primaryDark})`}}>
              <i className="bi bi-tools text-white text-xl"></i>
            </div>
            <div>
              <h1 className={`text-2xl font-extrabold tracking-tight ${dark?'text-white':'text-gray-900'}`}>Interventions</h1>
              <p className={`text-sm ${dark?'text-gray-400':'text-gray-500'}`}>
                Saisie et suivi · <code className="text-xs font-mono opacity-60">interventions · prelevements_pieces · mouvements_stock · outils</code>
              </p>
            </div>
          </div>
          <button onClick={()=>{setEditItem(null);setShowForm(true);}}
            className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2 shadow-lg hover:opacity-90"
            style={{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}}>
            <i className="bi bi-plus-circle-fill"></i> Nouvelle intervention
          </button>
        </div>

        {/* TOOLBAR */}
        <div className={`${dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-2xl border shadow-sm p-4 mb-6`}
          style={{animation:anim?'fadeInUp .5s ease-out .5s both':'none'}}>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              {[
                [fStatut,   setFStatut,   STATUTS_INTERV.map(s=>({value:s.code,label:s.libelle})), 'Tous statuts',    'bi-circle-half'],
                [fVehicule, setFVehicule, VEHICULES.map(v=>({value:v.immatriculation,label:v.immatriculation})), 'Tous véhicules', 'bi-car-front-fill'],
                [fSeverite, setFSeverite, SEVERITES.map(s=>({value:s.code,label:s.libelle})), 'Toutes sévérités','bi-exclamation-diamond-fill'],
              ].map(([val,setter,opts,ph,ic],i)=>(
                <div key={i} className="relative">
                  <i className={`bi ${ic} absolute left-2.5 top-1/2 -translate-y-1/2 text-xs ${dark?'text-gray-500':'text-gray-400'} pointer-events-none`}></i>
                  <select value={val} onChange={e=>setter(e.target.value)}
                    className={`pl-7 pr-3 py-2 rounded-xl border text-sm font-medium appearance-none ${dark?'bg-gray-800 border-gray-700 text-white':'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
                    <option value="">{ph}</option>
                    {opts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              ))}
              {hasF && <button onClick={resetF} className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 ${dark?'text-red-400 hover:bg-gray-800':'text-red-500 hover:bg-red-50'}`}><i className="bi bi-x-lg text-xs"></i>Effacer</button>}
            </div>
            <div className="flex items-center gap-2">
              {/* Vue toggle */}
              <div className={`flex rounded-xl border overflow-hidden ${dark?'border-gray-700':'border-gray-200'}`}>
                {[['table','bi-table'],['cards','bi-grid-3x3-gap-fill']].map(([v,ic])=>(
                  <button key={v} onClick={()=>setVue(v)}
                    className={`p-2 text-sm transition-colors ${vue===v?'text-white':dark?'text-gray-400 hover:bg-gray-800':'text-gray-500 hover:bg-gray-50'}`}
                    style={vue===v?{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}:{}}>
                    <i className={`bi ${ic}`}></i>
                  </button>
                ))}
              </div>
              {/* Recherche */}
              <div className="relative">
                <i className={`bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs ${dark?'text-gray-500':'text-gray-400'}`}></i>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Réf, véhicule, intervenant..."
                  className={`pl-8 pr-4 py-2 rounded-xl border text-sm w-52 ${dark?'bg-gray-800 border-gray-700 text-white placeholder-gray-500':'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}/>
              </div>
            </div>
          </div>
          <p className={`text-xs ${dark?'text-gray-600':'text-gray-400'}`}>{sorted.length} intervention(s)</p>
        </div>

        {/* TABLEAU */}
        {vue==='table' && (
          <div className={`${dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-2xl border shadow-sm overflow-hidden`}
            style={{animation:anim?'fadeInUp .5s ease-out .55s both':'none'}}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{background:`linear-gradient(135deg,${theme.primary},${theme.primaryDark})`}}>
                    {[['Réf.','id'],['Véhicule','vehicule_immatriculation'],['Intervenant',null],['Type',null],['Sévérité','severite'],['Statut','statut'],['Début','date_debut'],['Durée',null],['Coût total',null],['Actions',null]].map(([h,col],i)=>(
                      <th key={i} onClick={()=>col&&handleSort(col)}
                        className={`px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap ${col?'cursor-pointer hover:bg-white/10 select-none':''}`}>
                        {h}{col&&<SortIc col={col}/>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length===0 ? (
                    <tr><td colSpan={10} className={`text-center py-16 ${dark?'text-gray-500':'text-gray-400'}`}>
                      <i className="bi bi-clipboard-x text-5xl block mb-3 opacity-30"></i>
                      <p className="text-sm">Aucune intervention trouvée</p>
                    </td></tr>
                  ) : paginated.map((item,idx)=>{
                    const inv = getInterv(item.intervenant_id);
                    const tInv = inv?getTypeInterv(inv.type_intervenant_id):null;
                    const veh  = getVeh(item.vehicule_immatriculation);
                    const sev  = getSeverite(item.severite);
                    const stat = getStatutI(item.statut);
                    const coutTot = (item.cout_main_oeuvre||0)+(item.cout_pieces||0);
                    const prelev  = prelevements.filter(p=>p.intervention_id===item.id);
                    return (
                      <tr key={item.id} className="rh transition-all duration-100"
                        style={{backgroundColor:idx%2===0?(dark?'#0c1929':'#fafafa'):(dark?'#111827':'#ffffff'),animation:anim?`fadeInUp .35s ease-out ${idx*.04}s both`:''}}
                        onClick={()=>setDetailItem(item)}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`text-xs font-mono font-bold ${dark?'text-gray-400':'text-gray-500'}`}>INT-{String(item.id).padStart(5,'0')}</span>
                          {item.demande_id && <p className={`text-[10px] ${dark?'text-gray-600':'text-gray-400'}`}>← DEM-{String(item.demande_id).padStart(5,'0')}</p>}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className={`text-sm font-bold ${dark?'text-gray-100':'text-gray-900'}`}>{item.vehicule_immatriculation}</p>
                          <p className={`text-xs ${dark?'text-gray-500':'text-gray-400'}`}>{veh?`${veh.marque} ${veh.modele}`:'—'}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shrink-0"
                              style={{background:tInv?.color||'#94a3b8'}}>
                              <i className={`bi ${tInv?.icon||'bi-person'}`}></i>
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${dark?'text-gray-100':'text-gray-900'}`}>{getNomIntervenant(inv)}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${inv?.est_externe?'bg-orange-100 text-orange-700':'bg-blue-100 text-blue-700'}`}>
                                {inv?.est_externe?'Ext.':'Int.'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className={`text-xs font-semibold ${dark?'text-gray-200':'text-gray-800'}`}>{getTypeIntLib(item.type_intervention)}</p>
                          {prelev.length>0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold"><i className="bi bi-box-seam-fill mr-0.5"></i>{prelev.length} pièce(s)</span>}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${sev.bg}`}><i className={`bi ${sev.icon} mr-1`}></i>{sev.libelle}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${stat.bg}`}><i className={`bi ${stat.icon} mr-1`}></i>{stat.libelle}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className={`text-sm font-semibold ${dark?'text-gray-100':'text-gray-900'}`}>{formatDate(item.date_debut)}</p>
                          <p className={`text-xs ${dark?'text-gray-500':'text-gray-400'}`}>{formatRelative(item.date_debut||item.date_creation)}</p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className={`text-xs font-semibold ${dark?'text-gray-200':'text-gray-700'}`}>{formatDuree(item.duree_minutes)||`${item.duree_estimee_heures||'?'}h est.`}</p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className={`text-sm font-bold ${dark?'text-gray-100':'text-gray-900'}`}>{coutTot?(coutTot/1000).toFixed(0)+'k':'—'}</p>
                          <p className={`text-[10px] ${dark?'text-gray-600':'text-gray-400'}`}>FCFA</p>
                        </td>
                        <td className="px-4 py-4 text-center" onClick={e=>e.stopPropagation()}>
                          <Menu3 item={item} dark={dark} theme={theme}
                            onView={it=>setDetailItem(it)}
                            onEdit={it=>{setEditItem(it);setShowForm(true);}}
                            onDelete={handleDelete}/>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination/>
          </div>
        )}

        {/* CARDS */}
        {vue==='cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" style={{animation:anim?'fadeInUp .5s ease-out .55s both':'none'}}>
            {paginated.map((item,idx)=>{
              const inv  = getInterv(item.intervenant_id);
              const tInv = inv?getTypeInterv(inv.type_intervenant_id):null;
              const veh  = getVeh(item.vehicule_immatriculation);
              const sev  = getSeverite(item.severite);
              const stat = getStatutI(item.statut);
              const coutTot = (item.cout_main_oeuvre||0)+(item.cout_pieces||0);
              const prelev  = prelevements.filter(p=>p.intervention_id===item.id);
              const nOutils = outilsInterv.filter(o=>o.intervention_id===item.id).length;
              return (
                <div key={item.id} onClick={()=>setDetailItem(item)}
                  className={`${dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-2xl border shadow-sm p-5 cursor-pointer ch`}
                  style={{animation:anim?`fadeInUp .4s ease-out ${idx*.04}s both`:'none'}}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className={`text-xs font-mono font-bold ${dark?'text-gray-500':'text-gray-400'}`}>INT-{String(item.id).padStart(5,'0')}</span>
                      <p className={`text-sm font-bold mt-0.5 ${dark?'text-gray-100':'text-gray-900'}`}>{getTypeIntLib(item.type_intervention)}</p>
                    </div>
                    <div onClick={e=>e.stopPropagation()}>
                      <Menu3 item={item} dark={dark} theme={theme}
                        onView={it=>setDetailItem(it)} onEdit={it=>{setEditItem(it);setShowForm(true);}} onDelete={handleDelete}/>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${stat.bg}`}><i className={`bi ${stat.icon} mr-0.5`}></i>{stat.libelle}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sev.bg}`}>{sev.libelle}</span>
                    {item.demande_id && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700"><i className="bi bi-link-45deg mr-0.5"></i>DEM</span>}
                  </div>
                  <div className={`${dark?'bg-gray-800':'bg-gray-50'} rounded-xl p-3 space-y-1.5 mb-3`}>
                    <div className="flex items-center gap-2">
                      <i className={`bi bi-car-front-fill text-xs ${dark?'text-gray-500':'text-gray-400'}`}></i>
                      <span className={`text-xs font-semibold ${dark?'text-gray-300':'text-gray-700'}`}>{item.vehicule_immatriculation}</span>
                      <span className={`text-xs ${dark?'text-gray-500':'text-gray-400'}`}>{veh?`— ${veh.marque}`:''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{background:tInv?.color||'#94a3b8'}}>
                        <i className={`bi ${tInv?.icon||'bi-person'} text-[8px] text-white`}></i>
                      </div>
                      <span className={`text-xs ${dark?'text-gray-300':'text-gray-700'}`}>{getNomIntervenant(inv)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {prelev.length>0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold"><i className="bi bi-box-seam-fill mr-0.5"></i>{prelev.length}</span>}
                      {nOutils>0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold"><i className="bi bi-tools mr-0.5"></i>{nOutils}</span>}
                      {coutTot>0 && <span className={`text-xs font-bold ${dark?'text-gray-400':'text-gray-600'}`}>{(coutTot/1000).toFixed(0)}k FCFA</span>}
                    </div>
                    <p className={`text-[10px] ${dark?'text-gray-600':'text-gray-400'}`}>{formatRelative(item.date_debut||item.date_creation)}</p>
                  </div>
                </div>
              );
            })}
            {totalPages>1 && (
              <div className="col-span-full">
                <div className={`rounded-2xl border ${dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} shadow-sm`}><Pagination/></div>
              </div>
            )}
          </div>
        )}

        <div className={`mt-8 py-6 border-t ${dark?'border-gray-800':'border-gray-200'} text-center`}>
          <p className={`text-sm ${dark?'text-gray-600':'text-gray-400'}`}>
            © 2026 SGS — Interventions — Fleetify · <code className="font-mono text-xs">interventions · prelevements_pieces · mouvements_stock · pieces_detachees · outils</code>
          </p>
        </div>
      </main>

      {/* MODALS */}
      {detailItem && (
        <DetailModal item={detailItem} prelevements={prelevements} outilsUtilises={outilsInterv}
          allPieces={pieces} allOutils={outils} dark={dark} theme={theme}
          onClose={()=>setDetailItem(null)} onEdit={it=>{setEditItem(it);setShowForm(true);}}
          onDelete={handleDelete} onChangeStatut={handleChangeStatut}/>
      )}
      {showForm && (
        <FormModal item={editItem} allPieces={pieces} allOutils={outils} dark={dark} theme={theme}
          onClose={()=>{setShowForm(false);setEditItem(null);}} onSave={handleSave}/>
      )}
    </div>
  );
};

export default InterventionsVehicules;
