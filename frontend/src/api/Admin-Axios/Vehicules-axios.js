// ============================================================
// src/api/Admin-Axios/Vehicules-axios.js
// ============================================================
// Toutes les fonctions axios pour la gestion du parc véhicules
// Backend : GET/POST/PUT/DELETE /api/admin/vehicules/...
// ============================================================

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ,
  // Ne pas forcer Content-Type ici pour laisser axios gérer multipart/form-data automatiquement
});

// Injecte automatiquement le token Sanctum
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Laisser axios définir Content-Type automatiquement (important pour FormData)
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

// Intercepteur de réponse pour gestion globale des erreurs
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
// HELPER : convertit un objet JS en FormData (pour uploads)
// ─────────────────────────────────────────────────────────────
export const toFormData = (data) => {
  const fd = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (value instanceof File || value instanceof Blob) {
        fd.append(key, value);
      } else {
        fd.append(key, String(value));
      }
    }
  });
  return fd;
};

// ─────────────────────────────────────────────────────────────
// VÉHICULES — CRUD principal
// ─────────────────────────────────────────────────────────────

/**
 * Liste paginée avec filtres optionnels
 * params: { search, categorie, marque, modele, statut, page, per_page }
 */
export const getVehicules = (params = {}) =>
  api.get('/admin/vehicules', { params }).then((r) => r.data);

/** Détail complet d'un véhicule */
export const getVehicule = (immatriculation) =>
  api.get(`/admin/vehicules/${immatriculation}`).then((r) => r.data);

/**
 * Créer un nouveau véhicule
 * data peut contenir un champ "image" de type File pour upload
 */
export const createVehicule = (data) => {
  if (data.image instanceof File) {
    const fd = toFormData(data);
    return api.post('/admin/vehicules', fd).then((r) => r.data);
  }
  return api.post('/admin/vehicules', data).then((r) => r.data);
};

/**
 * Modifier un véhicule
 * data peut contenir un champ "image" de type File pour upload
 */
export const updateVehicule = (immatriculation, data) => {
  if (data.image instanceof File) {
    const fd = toFormData(data);
    // Laravel ne supporte pas PUT avec multipart, on utilise POST + _method
    fd.append('_method', 'PUT');
    return api.post(`/admin/vehicules/${immatriculation}`, fd).then((r) => r.data);
  }
  return api.put(`/admin/vehicules/${immatriculation}`, data).then((r) => r.data);
};

/** Supprimer un véhicule (soft delete) */
export const deleteVehicule = (immatriculation) =>
  api.delete(`/admin/vehicules/${immatriculation}`).then((r) => r.data);

/** Changer uniquement le statut */
export const updateStatutVehicule = (immatriculation, statut) =>
  api.patch(`/admin/vehicules/${immatriculation}/statut`, { statut }).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// DOCUMENTS D'UN VÉHICULE
// ─────────────────────────────────────────────────────────────

export const getDocumentsVehicule = (immatriculation) =>
  api.get(`/admin/vehicules/${immatriculation}/documents`).then((r) => r.data);

/**
 * Créer un document (upload fichier obligatoire)
 * data doit contenir : fichier (File), type_document, et champs optionnels
 */
export const createDocumentVehicule = (immatriculation, data) => {
  const fd = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      fd.append(key, value instanceof File ? value : String(value));
    }
  });
  return api.post(`/admin/vehicules/${immatriculation}/documents`, fd).then((r) => r.data);
};

/**
 * Modifier un document existant
 * data peut contenir : type_document, nom_document, date_emission, date_expiration,
 *                      compagnie_assurance, numero_contrat, type_couverture, montant_prime, notes
 *                      et optionnellement fichier (File) pour remplacer le fichier
 */
export const updateDocumentVehicule = (immatriculation, documentId, data) => {
  // Si un nouveau fichier est fourni, on utilise FormData + _method PUT
  if (data.fichier instanceof File) {
    const fd = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        fd.append(key, value instanceof File ? value : String(value));
      }
    });
    fd.append('_method', 'PUT');
    return api.post(`/admin/vehicules/${immatriculation}/documents/${documentId}`, fd).then((r) => r.data);
  }
  return api.put(`/admin/vehicules/${immatriculation}/documents/${documentId}`, data).then((r) => r.data);
};

export const deleteDocumentVehicule = (immatriculation, documentId) =>
  api.delete(`/admin/vehicules/${immatriculation}/documents/${documentId}`).then((r) => r.data);

/** Ouvrir/obtenir l'URL d'un document */
export const openDocumentVehicule = (immatriculation, documentId) =>
  api.get(`/admin/vehicules/${immatriculation}/documents/${documentId}/open`).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// MAINTENANCES D'UN VÉHICULE
// ─────────────────────────────────────────────────────────────

export const getMaintenancesVehicule = (immatriculation) =>
  api.get(`/admin/vehicules/${immatriculation}/maintenances`).then((r) => r.data);

export const createMaintenanceVehicule = (immatriculation, data) =>
  api.post(`/admin/vehicules/${immatriculation}/maintenances`, data).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// MISSIONS D'UN VÉHICULE
// ─────────────────────────────────────────────────────────────

export const getMissionsVehicule = (immatriculation) =>
  api.get(`/admin/vehicules/${immatriculation}/missions`).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// CARBURANT D'UN VÉHICULE — CRUD COMPLET
// ─────────────────────────────────────────────────────────────

/** Liste tous les pleins d'un véhicule */
export const getCarburantVehicule = (immatriculation) =>
  api.get(`/admin/vehicules/${immatriculation}/carburant`).then((r) => r.data);

/** Détail d'un plein */
export const getCarburantDetail = (immatriculation, id) =>
  api.get(`/admin/vehicules/${immatriculation}/carburant/${id}`).then((r) => r.data);

/**
 * Créer un nouveau plein de carburant
 * data: { date_plein, litres, prix_unitaire?, station?, kilometrage?, notes? }
 */
export const createCarburantVehicule = (immatriculation, data) =>
  api.post(`/admin/vehicules/${immatriculation}/carburant`, data).then((r) => r.data);

/**
 * Modifier un plein de carburant existant
 * data: { date_plein?, litres?, prix_unitaire?, station?, kilometrage?, notes? }
 */
export const updateCarburantVehicule = (immatriculation, id, data) =>
  api.put(`/admin/vehicules/${immatriculation}/carburant/${id}`, data).then((r) => r.data);

/** Supprimer un plein de carburant */
export const deleteCarburantVehicule = (immatriculation, id) =>
  api.delete(`/admin/vehicules/${immatriculation}/carburant/${id}`).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// STATISTIQUES D'UN VÉHICULE
// ─────────────────────────────────────────────────────────────

export const getStatsVehicule = (immatriculation) =>
  api.get(`/admin/vehicules/${immatriculation}/stats`).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// DONNÉES DE RÉFÉRENCE (filtres + formulaires)
// ─────────────────────────────────────────────────────────────

/** Retourne { categories, marques, modeles, directions } */
export const getReferences = () =>
  api.get('/admin/vehicules/references').then((r) => r.data);

/** CRUD Catégories */
export const createCategorie = (nom) =>
  api.post('/admin/vehicules/references/categories', { nom }).then((r) => r.data);

export const deleteCategorie = (id) =>
  api.delete(`/admin/vehicules/references/categories/${id}`).then((r) => r.data);

/** CRUD Marques */
export const createMarque = (nom) =>
  api.post('/admin/vehicules/references/marques', { nom }).then((r) => r.data);

export const deleteMarque = (id) =>
  api.delete(`/admin/vehicules/references/marques/${id}`).then((r) => r.data);

/** CRUD Modèles */
export const createModele = (marqueId, nom) =>
  api.post('/admin/vehicules/references/modeles', { marque_id: marqueId, nom }).then((r) => r.data);

export const deleteModele = (id) =>
  api.delete(`/admin/vehicules/references/modeles/${id}`).then((r) => r.data);

export default api;