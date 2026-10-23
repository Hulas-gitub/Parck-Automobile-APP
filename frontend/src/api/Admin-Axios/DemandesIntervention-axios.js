// ============================================================
// src/api/Admin-Axios/DemandesIntervention-axios.js
// ============================================================
// Fonctions axios pour les demandes d'intervention.
// Réutilise l'instance `api` de Vehicules-axios.js
// (baseURL = VITE_API_URL, token Bearer, redirection /login sur 401).
//
// Usage dans un composant :
//   import {
//     getReferences, getDemandes, getDemande,
//     createDemande, updateDemande, deleteDemande,
//     validerDemande, rejeterDemande,
//     getApiError,
//   } from '../../api/Admin-Axios/DemandesIntervention-axios';
//
// Toutes les fonctions retournent le corps JSON de la réponse
// (ex. { data: {...}, message: '...' }), comme dans Vehicules-axios.
// ============================================================

import api from './Vehicules-axios';

const BASE = '/admin/demandes-intervention';

// ─────────────────────────────────────────────────────────────
// HELPER : extrait un message lisible d'une erreur axios
// (1re erreur de validation Laravel > message > message générique)
// ─────────────────────────────────────────────────────────────
export const getApiError = (error, fallback = 'Une erreur est survenue.') => {
  const data = error?.response?.data;
  const firstValidation = data?.errors ? Object.values(data.errors).flat()[0] : null;
  return firstValidation || data?.message || (error?.response ? `Erreur ${error.response.status}` : error?.message) || fallback;
};

// ─────────────────────────────────────────────────────────────
// RÉFÉRENCES (véhicules, utilisateurs, directions, affectations,
// anomalies, statuts véhicule, droits de l'utilisateur connecté `me`)
// ─────────────────────────────────────────────────────────────
export const getReferences = () =>
  api.get(`${BASE}/references`).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────────────────────

/** Liste des demandes → { data: [...] } */
export const getDemandes = (params = {}) =>
  api.get(BASE, { params }).then((r) => r.data);

/** Détail d'une demande → { data: {...} } */
export const getDemande = (id) =>
  api.get(`${BASE}/${id}`).then((r) => r.data);

/** Création → { data: {...}, message } */
export const createDemande = (payload) =>
  api.post(BASE, payload).then((r) => r.data);

/**
 * Modification → { data: {...}, message }
 *  • interne : modifiable à tout moment
 *  • externe : modifiable uniquement tant qu'elle est en attente
 */
export const updateDemande = (id, payload) =>
  api.put(`${BASE}/${id}`, payload).then((r) => r.data);

/** Suppression → { message } */
export const deleteDemande = (id) =>
  api.delete(`${BASE}/${id}`).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// TRAITEMENT (demandes EXTERNES uniquement — DAAL)
// en_attente → en_cours   (validation DAAL)
// en_attente → rejetee    (motif obligatoire)
// Une demande INTERNE est directement « en_cours » : aucune validation.
// Les droits sont contrôlés côté serveur.
// ─────────────────────────────────────────────────────────────
export const validerDemande = (id) =>
  api.post(`${BASE}/${id}/valider`).then((r) => r.data);

export const rejeterDemande = (id, motif_rejet) =>
  api.post(`${BASE}/${id}/rejeter`, { motif_rejet }).then((r) => r.data);