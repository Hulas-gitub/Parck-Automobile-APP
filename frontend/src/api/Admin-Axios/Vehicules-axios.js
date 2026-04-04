// ============================================================
// src/api/Admin-Axios/Vehicules-axios.js
// ============================================================
// Fonctions axios pour la gestion du parc véhicules.
// Le carnet carburant est géré dans CarnetCarburant-axios.js
// ============================================================

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
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

export const toFormData = (data) => {
  const fd = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      fd.append(key, value instanceof File || value instanceof Blob ? value : String(value));
    }
  });
  return fd;
};

// ─────────────────────────────────────────────────────────────
// VÉHICULES — CRUD principal
// ─────────────────────────────────────────────────────────────

export const getVehicules = (params = {}) =>
  api.get('/admin/vehicules', { params }).then((r) => r.data);

export const getVehicule = (immatriculation) =>
  api.get(`/admin/vehicules/${immatriculation}`).then((r) => r.data);

export const createVehicule = (data) => {
  if (data.image instanceof File) {
    return api.post('/admin/vehicules', toFormData(data)).then((r) => r.data);
  }
  return api.post('/admin/vehicules', data).then((r) => r.data);
};

export const updateVehicule = (immatriculation, data) => {
  if (data.image instanceof File) {
    const fd = toFormData(data);
    fd.append('_method', 'PUT');
    return api.post(`/admin/vehicules/${immatriculation}`, fd).then((r) => r.data);
  }
  return api.put(`/admin/vehicules/${immatriculation}`, data).then((r) => r.data);
};

export const deleteVehicule = (immatriculation) =>
  api.delete(`/admin/vehicules/${immatriculation}`).then((r) => r.data);

export const updateStatutVehicule = (immatriculation, statut) =>
  api.patch(`/admin/vehicules/${immatriculation}/statut`, { statut }).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// DOCUMENTS D'UN VÉHICULE
// ─────────────────────────────────────────────────────────────

export const getDocumentsVehicule = (immatriculation) =>
  api.get(`/admin/vehicules/${immatriculation}/documents`).then((r) => r.data);

export const createDocumentVehicule = (immatriculation, data) => {
  const fd = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      fd.append(key, value instanceof File ? value : String(value));
    }
  });
  return api.post(`/admin/vehicules/${immatriculation}/documents`, fd).then((r) => r.data);
};

export const updateDocumentVehicule = (immatriculation, documentId, data) => {
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
// STATISTIQUES D'UN VÉHICULE
// ─────────────────────────────────────────────────────────────

export const getStatsVehicule = (immatriculation) =>
  api.get(`/admin/vehicules/${immatriculation}/stats`).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// DONNÉES DE RÉFÉRENCE
// ─────────────────────────────────────────────────────────────

export const getReferences = () =>
  api.get('/admin/vehicules/references').then((r) => r.data);

export const createCategorie = (nom, description = null) =>
  api.post('/admin/vehicules/references/categories', { nom, description }).then((r) => r.data);

export const updateCategorie = (id, nom, description = null) =>
  api.put(`/admin/vehicules/references/categories/${id}`, { nom, description }).then((r) => r.data);

export const deleteCategorie = (id) =>
  api.delete(`/admin/vehicules/references/categories/${id}`).then((r) => r.data);

export const createMarque = (nom, pays_origine = null) =>
  api.post('/admin/vehicules/references/marques', { nom, pays_origine }).then((r) => r.data);

export const updateMarque = (id, nom, pays_origine = null) =>
  api.put(`/admin/vehicules/references/marques/${id}`, { nom, pays_origine }).then((r) => r.data);

export const deleteMarque = (id) =>
  api.delete(`/admin/vehicules/references/marques/${id}`).then((r) => r.data);

export const createModele = (data) =>
  api.post('/admin/vehicules/references/modeles', data).then((r) => r.data);

export const updateModele = (id, data) =>
  api.put(`/admin/vehicules/references/modeles/${id}`, data).then((r) => r.data);

export const deleteModele = (id) =>
  api.delete(`/admin/vehicules/references/modeles/${id}`).then((r) => r.data);

export const createAnnee = (annee) =>
  api.post('/admin/vehicules/references/annees', { annee }).then((r) => r.data);

export const deleteAnnee = (id) =>
  api.delete(`/admin/vehicules/references/annees/${id}`).then((r) => r.data);

export default api;


// ============================================================
// src/api/Admin-Axios/CarnetCarburant-axios.js
// ============================================================
// Toutes les fonctions axios dédiées au carnet de carburant.
// À importer séparément dans les composants carburant.
//
// Usage dans un composant React :
//   import {
//     getMissionsDisponibles,
//     getCarburant,
//     getCarburantDetail,
//     createCarburant,
//     updateCarburant,
//     deleteCarburant,
//     exportCarburantPdf,
//     exportCarburantExcel,
//   } from '../../api/Admin-Axios/CarnetCarburant-axios';
// ============================================================

// NOTE : cet export utilise la même instance `api` définie plus haut
// dans ce fichier. En production, déplace ce bloc dans son propre fichier
// CarnetCarburant-axios.js et réimporte `api` depuis un fichier partagé.

// ─────────────────────────────────────────────────────────────
// HELPER interne : déclenche le téléchargement d'un blob
// ─────────────────────────────────────────────────────────────
const _download = (blob, filename, mime) => {
  const url = URL.createObjectURL(new Blob([blob], { type: mime }));
  const a   = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ─────────────────────────────────────────────────────────────
// MISSIONS DISPONIBLES (dropdown du formulaire)
// ─────────────────────────────────────────────────────────────

/**
 * Retourne les missions du véhicule (planifiées, en cours, terminées)
 * pour alimenter le <select> "Mission" du formulaire carburant.
 *
 * Chaque entrée :
 *   { id, label, reference_mission, destination, type_mission, statut,
 *     date_depart_prevue, date_depart_reelle, date_retour_reelle,
 *     km_depart, km_retour, distance_km,
 *     carburant_consomme, cout_carburant,
 *     chauffeur: { id, nom, email } | null }
 *
 * Utilisé pour pré-remplir les champs de contexte (lecture seule)
 * quand l'utilisateur sélectionne une mission → CAS 1.
 */
export const getMissionsDisponibles = (immatriculation) =>
  api.get(`/admin/vehicules/${immatriculation}/carburant/missions-disponibles`).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// LISTE DES CARNETS CARBURANT
// ─────────────────────────────────────────────────────────────

/**
 * Retourne tous les pleins du véhicule enrichis.
 *
 * Chaque entrée :
 *   { id, vehicule_immatriculation,
 *     cas: 'avec_mission' | 'sans_mission',
 *     mission_id, reference_mission, mission_destination, type_mission,
 *     mission_statut, mission_carburant_consomme, mission_cout_carburant,
 *     chauffeur_id, chauffeur_nom,
 *     date_plein, kilometrage, litres, prix_unitaire, cout_total,
 *     station, km_depuis_dernier_plein, consommation_calculee, notes,
 *     date_creation }
 */
export const getCarburant = (immatriculation) =>
  api.get(`/admin/vehicules/${immatriculation}/carburant`).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// DÉTAIL SIMPLE (pré-remplir le formulaire d'édition)
// ─────────────────────────────────────────────────────────────

export const getCarburantSimple = (immatriculation, id) =>
  api.get(`/admin/vehicules/${immatriculation}/carburant/${id}`).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// DÉTAIL COMPLET — MODAL "VOIR"
// ─────────────────────────────────────────────────────────────

/**
 * Toutes les jointures résolues côté backend.
 *
 * CAS 1 (avec_mission) :
 * {
 *   id, cas: 'avec_mission',
 *   vehicule: { immatriculation, kilometrage, marque, modele, categorie },
 *   carburant: { date_plein, station, litres, prix_unitaire, cout_total,
 *                kilometrage_au_plein, km_depuis_dernier_plein,
 *                consommation_calculee (null), notes, recu_url, date_creation },
 *   mission: { id, reference_mission, destination, type_mission, statut,
 *              date_depart_prevue, date_depart_reelle, date_retour_reelle,
 *              km_depart, km_retour, carburant_consomme, cout_carburant },
 *   chauffeur: { id, nom, email, role } | null
 * }
 *
 * CAS 2 (sans_mission) :
 * {
 *   id, cas: 'sans_mission',
 *   vehicule: { immatriculation, kilometrage, marque, modele, categorie },
 *   carburant: { date_plein, station, litres, prix_unitaire, cout_total,
 *                kilometrage_au_plein, km_depuis_dernier_plein,
 *                consommation_calculee (= litres × prix_unitaire),
 *                notes, recu_url, date_creation }
 * }
 */
export const getCarburantDetail = (immatriculation, id) =>
  api.get(`/admin/vehicules/${immatriculation}/carburant/${id}/detail`).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// CRÉER UN PLEIN
// ─────────────────────────────────────────────────────────────

/**
 * CAS 1 (avec mission) :
 *   { mission_id, date_plein*, litres*, station?, prix_unitaire?, kilometrage?, notes? }
 *   Kilométrage : priorité → saisie > km_depart mission > km actuel véhicule
 *   consommation_calculee = null (syncMission gère les agrégats)
 *
 * CAS 2 (sans mission) :
 *   { date_plein*, litres*, prix_unitaire?, station?, kilometrage?, notes? }
 *   consommation_calculee = litres × prix_unitaire (prix total du plein)
 *
 * Effets auto (les 2 cas) :
 *   - Calcule km_depuis_dernier_plein
 *   - Met à jour vehicule.kilometrage si > km actuel
 * Effets supplémentaires CAS 1 :
 *   - Synchronise missions.carburant_consomme + missions.cout_carburant
 *
 * Retourne le détail complet formaté (même structure que getCarburantDetail).
 */
export const createCarburant = (immatriculation, data) =>
  api.post(`/admin/vehicules/${immatriculation}/carburant`, data).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// MODIFIER UN PLEIN
// ─────────────────────────────────────────────────────────────

/**
 * Tous les champs sont optionnels.
 * mission_id: null → dissociation (passage CAS 1 → CAS 2)
 *
 * Effets auto :
 *   - Recalcul km_depuis_dernier_plein si kilometrage modifié
 *   - CAS 2 : recalcul consommation_calculee = litres × prix_unitaire
 *   - CAS 1 : resync agrégats sur l'ancienne ET la nouvelle mission
 *
 * Retourne le détail complet formaté.
 */
export const updateCarburant = (immatriculation, id, data) =>
  api.put(`/admin/vehicules/${immatriculation}/carburant/${id}`, data).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// SUPPRIMER UN PLEIN
// ─────────────────────────────────────────────────────────────

/**
 * Soft delete. Resynchronise la mission liée (CAS 1).
 */
export const deleteCarburant = (immatriculation, id) =>
  api.delete(`/admin/vehicules/${immatriculation}/carburant/${id}`).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────

/**
 * Télécharge le carnet en PDF et déclenche le téléchargement navigateur.
 *
 * @param {string} immatriculation
 * @param {{ mission_id?: number, date_debut?: string, date_fin?: string }} params
 *
 * @example
 *   await exportCarburantPdf('LBV-001-A');
 *   await exportCarburantPdf('LBV-001-A', { date_debut: '2026-01-01', date_fin: '2026-03-31' });
 */
export const exportCarburantPdf = async (immatriculation, params = {}) => {
  const blob = await api
    .get(`/admin/vehicules/${immatriculation}/carburant/export/pdf`, {
      params,
      responseType: 'blob',
    })
    .then((r) => r.data);

  _download(blob,
    `carnet_carburant_${immatriculation}_${new Date().toISOString().slice(0, 10)}.pdf`,
    'application/pdf'
  );
};

/**
 * Télécharge le carnet en Excel (.xlsx) et déclenche le téléchargement navigateur.
 *
 * @param {string} immatriculation
 * @param {{ mission_id?: number, date_debut?: string, date_fin?: string }} params
 *
 * @example
 *   await exportCarburantExcel('LBV-001-A');
 *   await exportCarburantExcel('LBV-001-A', { mission_id: 3 });
 */
export const exportCarburantExcel = async (immatriculation, params = {}) => {
  const blob = await api
    .get(`/admin/vehicules/${immatriculation}/carburant/export/excel`, {
      params,
      responseType: 'blob',
    })
    .then((r) => r.data);

  _download(blob,
    `carnet_carburant_${immatriculation}_${new Date().toISOString().slice(0, 10)}.xlsx`,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
};