// ============================================================
// src/api/Admin-Axios/Accidents-axios.js
// ============================================================
// Toutes les fonctions axios dédiées au registre des accidents.
//
// Usage dans un composant React :
//   import {
//     getAccidents,
//     getAccident,
//     getAccidentFormData,
//     getAccidentStatistiques,
//     createAccident,
//     updateAccident,
//     updateAccidentStatut,
//     deleteAccident,
//   } from '../../api/Admin-Axios/Accidents-axios';
// ============================================================

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Ne pas forcer Content-Type sur FormData (le navigateur le gère avec boundary)
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────
// HELPER — construction FormData pour les requêtes multipart
// (photos + rapport de police en fichiers)
// ─────────────────────────────────────────────────────────────

/**
 * Transforme un objet JS en FormData en gérant :
 *   - les tableaux de fichiers (photos[])
 *   - les booléens → "1" / "0"
 *   - les null/undefined → ignorés
 *   - les autres valeurs → String()
 *
 * @param {Object} data
 * @returns {FormData}
 */
const buildFormData = (data) => {
  const fd = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) return;

    // Tableau de fichiers (photos[])
    if (key === 'photos' && Array.isArray(value)) {
      value.forEach((file) => {
        if (file instanceof File) fd.append('photos[]', file);
      });
      return;
    }

    // Tableau d'IDs (photos_supprimer[])
    if (key === 'photos_supprimer' && Array.isArray(value)) {
      fd.append('photos_supprimer', JSON.stringify(value));
      return;
    }

    // Fichier unique (rapport_police_fichier)
    if (value instanceof File) {
      fd.append(key, value);
      return;
    }

    // Booléens → "1" / "0" pour PHP
    if (typeof value === 'boolean') {
      fd.append(key, value ? '1' : '0');
      return;
    }

    fd.append(key, String(value));
  });

  return fd;
};

/**
 * Indique si un payload nécessite un envoi multipart (photos ou rapport police).
 * @param {Object} data
 * @returns {boolean}
 */
const needsMultipart = (data) =>
  data.rapport_police_fichier instanceof File ||
  (Array.isArray(data.photos) && data.photos.some((f) => f instanceof File));

// ─────────────────────────────────────────────────────────────
// LISTE DES ACCIDENTS (paginée + filtrée)
// ─────────────────────────────────────────────────────────────

/**
 * Retourne la liste paginée des accidents avec tous les filtres disponibles.
 *
 * @param {Object} params
 * @param {number}  [params.jours]                  Période en jours (7, 30, 90, 180, 365)
 * @param {string}  [params.date_debut]             Format YYYY-MM-DD
 * @param {string}  [params.date_fin]               Format YYYY-MM-DD
 * @param {string}  [params.niveau_degats]          leger | modere | grave | critique
 * @param {string}  [params.statut]                 declare | en_cours | en_reparation | assurance | cloture | litige
 * @param {string}  [params.type_responsabilite]    responsable | tiers_responsable | ...
 * @param {number}  [params.chauffeur_user_id]
 * @param {string}  [params.vehicule_immatriculation]
 * @param {boolean} [params.vehicule_immobilise]
 * @param {string}  [params.search]                 Recherche libre (lieu, chauffeur, immat, description)
 * @param {string}  [params.sort_by]                date_accident | niveau_degats | statut | cout_estime
 * @param {string}  [params.sort_dir]               asc | desc
 * @param {number}  [params.per_page]               Défaut : 10, max : 100
 * @param {number}  [params.page]
 *
 * @returns {Promise<{ success: boolean, data: PaginatedAccidents }>}
 *
 * Chaque accident retourné :
 *   { id, ref, vehicule_immatriculation, vehicule_statut,
 *     chauffeur_id, chauffeur_nom, chauffeur_direction, chauffeur_externe,
 *     mission_id, mission_reference,
 *     date_accident, lieu, position_gps, description,
 *     type_responsabilite, niveau_degats,
 *     rapport_police, rapport_police_url,
 *     photos: [{ id, nom, url, chemin }], photos_count,
 *     vehicule_immobilise, jours_immobilisation,
 *     km_au_moment_accident,
 *     assure, cout_estime, cout_reparation_final,
 *     montant_reclame_assurance, montant_verse_assurance,
 *     montant_perte, taux_couverture_assurance,
 *     statut, notes, date_creation, date_modification }
 */
export const getAccidents = (params = {}) =>
  api.get('/admin/accidents', { params }).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// DÉTAIL D'UN ACCIDENT
// ─────────────────────────────────────────────────────────────

/**
 * @param {number} id
 * @returns {Promise<{ success: boolean, data: Accident }>}
 */
export const getAccident = (id) =>
  api.get(`/admin/accidents/${id}`).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// DONNÉES POUR LES LISTES DÉROULANTES DU FORMULAIRE
// ─────────────────────────────────────────────────────────────

/**
 * À appeler à l'ouverture du formulaire (create ou edit).
 *
 * @returns {Promise<{
 *   success: boolean,
 *   data: {
 *     chauffeurs: [{ id, nom, direction, direction_id }],
 *     vehicules:  [{ immatriculation, marque, modele, statut, statut_libelle }],
 *     missions:   [{ id, reference, vehicule }],
 *     statuts_vehicule:    { [code]: libelle },
 *     niveaux_degats:      string[],
 *     types_responsabilite: string[],
 *     statuts_accident:    string[],
 *   }
 * }>}
 */
export const getAccidentFormData = () =>
  api.get('/admin/accidents/form-data').then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// STATISTIQUES / KPIs
// ─────────────────────────────────────────────────────────────

/**
 * @param {Object} params
 * @param {number} [params.jours=365] Période en jours
 *
 * @returns {Promise<{
 *   success: boolean,
 *   data: {
 *     total: number,
 *     nb_immobilises: number,
 *     nb_critiques: number,
 *     cout_total: number,
 *     par_niveau:         { [code]: number },
 *     par_statut:         { [code]: number },
 *     par_responsabilite: { [code]: number },
 *     top_chauffeurs: [{ chauffeur_id, nom, direction, nb_accidents }],
 *     periode_jours: number,
 *   }
 * }>}
 */
export const getAccidentStatistiques = (params = {}) =>
  api.get('/admin/accidents/statistiques', { params }).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// CRÉER UN ACCIDENT
// ─────────────────────────────────────────────────────────────

/**
 * Crée un nouvel accident. Envoie en multipart si des fichiers sont présents.
 *
 * @param {Object} data
 *
 * -- Véhicule --
 * @param {string}  data.vehicule_immatriculation   Requis
 *
 * -- Chauffeur --
 * @param {string}  [data.chauffeur_type]           "registre" | "autre"
 * @param {number}  [data.chauffeur_user_id]        Si chauffeur_type = "registre"
 * @param {string}  [data.chauffeur_nom_libre]      Si chauffeur_type = "autre"
 * @param {string}  [data.direction_nom_libre]      Si chauffeur_type = "autre"
 *
 * -- Mission --
 * @param {number}  [data.mission_id]               Optionnel
 *
 * -- Accident --
 * @param {string}  data.date_accident              Requis — format ISO ou datetime-local
 * @param {string}  [data.lieu]
 * @param {string}  [data.position_gps]
 * @param {string}  [data.description]
 * @param {string}  [data.type_responsabilite]      responsable | tiers_responsable | responsabilite_partagee | indetermine | force_majeure
 * @param {string}  [data.niveau_degats]            leger | modere | grave | critique
 *
 * -- Fichiers --
 * @param {File}    [data.rapport_police_fichier]   PDF ou image du rapport de police
 * @param {File[]}  [data.photos]                   Tableau de File (images)
 *
 * -- Véhicule immobilisé --
 * @param {boolean} [data.vehicule_immobilise]
 * @param {number}  [data.jours_immobilisation]
 * @param {string}  [data.nouveau_statut_vehicule]  Code statut → met à jour vehicules.statut
 *
 * -- KM --
 * @param {number}  [data.km_au_moment_accident]
 *
 * -- Assurance & coûts (en FCFA) --
 * @param {boolean} [data.assure]
 * @param {number}  [data.cout_estime]
 * @param {number}  [data.cout_reparation_final]
 * @param {number}  [data.montant_reclame_assurance]
 * @param {number}  [data.montant_verse_assurance]
 *
 * -- Divers --
 * @param {string}  [data.statut]                   declare (défaut) | en_cours | ...
 * @param {string}  [data.notes]
 *
 * @returns {Promise<{ success: boolean, message: string, data: Accident }>}
 */
export const createAccident = (data) => {
  if (needsMultipart(data)) {
    return api.post('/admin/accidents', buildFormData(data)).then((r) => r.data);
  }
  return api.post('/admin/accidents', data).then((r) => r.data);
};

// ─────────────────────────────────────────────────────────────
// MODIFIER UN ACCIDENT
// ─────────────────────────────────────────────────────────────

/**
 * Met à jour un accident existant. Tous les champs sont optionnels.
 * Envoie en multipart si des fichiers sont présents.
 *
 * Gestion des photos :
 *   - data.photos       → File[] : nouvelles photos à ajouter
 *   - data.photos_supprimer → string[] d'IDs : photos existantes à supprimer
 *
 * Gestion du rapport de police :
 *   - data.rapport_police_fichier  → File : remplace l'existant
 *   - data.rapport_police_supprimer → true : supprime sans remplacer
 *
 * @param {number} id
 * @param {Object} data  Mêmes champs que createAccident (tous optionnels)
 * @returns {Promise<{ success: boolean, message: string, data: Accident }>}
 */
export const updateAccident = (id, data) => {
  if (needsMultipart(data)) {
    const fd = buildFormData(data);
    fd.append('_method', 'PUT'); // Laravel method spoofing
    return api.post(`/admin/accidents/${id}`, fd).then((r) => r.data);
  }
  return api.put(`/admin/accidents/${id}`, data).then((r) => r.data);
};

// ─────────────────────────────────────────────────────────────
// CHANGER LE STATUT D'UN ACCIDENT (action rapide depuis le modal)
// ─────────────────────────────────────────────────────────────

/**
 * Met à jour uniquement le statut du dossier accident.
 * Correspond aux boutons de changement de statut dans AccidentModal.
 *
 * @param {number} id
 * @param {string} statut  declare | en_cours | en_reparation | assurance | cloture | litige
 * @returns {Promise<{ success: boolean, message: string, data: { id, statut } }>}
 */
export const updateAccidentStatut = (id, statut) =>
  api.patch(`/admin/accidents/${id}/statut`, { statut }).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// SUPPRIMER UN ACCIDENT (suppression logique)
// ─────────────────────────────────────────────────────────────

/**
 * @param {number} id
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const deleteAccident = (id) =>
  api.delete(`/admin/accidents/${id}`).then((r) => r.data);

export default api;