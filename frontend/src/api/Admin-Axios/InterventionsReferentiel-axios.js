/**
 * interventions-axios.js
 * Instance Axios dédiée aux appels des référentiels d'interventions.
 * Gère : types-intervention, types-inspection, types-intervenant, checklists
 *
 * Toutes les routes sont sous /api/admin/interventions/referentiels
 */

import axios from 'axios';

const interventionsApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: {
    'Accept': 'application/json',
  },
});

// ─────────────────────────────────────────────────────────────
// 📤 INTERCEPTEUR REQUÊTE — Injecte le Bearer token
// ─────────────────────────────────────────────────────────────
interventionsApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else {
      config.headers['Content-Type'] = 'application/json';
    }

    console.log('📤 [Interventions] Requête:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ [Interventions] Erreur de requête:', error);
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────
// 📥 INTERCEPTEUR RÉPONSE — Gestion centralisée des erreurs
// ─────────────────────────────────────────────────────────────
interventionsApi.interceptors.response.use(
  (response) => {
    console.log('✅ [Interventions] Réponse:', response.status, response.config.url);
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      console.error('❌ [Interventions] Erreur serveur:', status, data);

      switch (status) {
        case 401:
          if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
            console.warn('⏰ [Interventions] Session expirée, redirection vers login.');
            _clearSessionAndRedirect();
          }
          break;
        case 403:
          console.error('🚫 [Interventions] Accès refusé — permissions insuffisantes.');
          break;
        case 404:
          console.error('🔍 [Interventions] Ressource introuvable:', data?.message);
          break;
        case 409:
          console.error('🔗 [Interventions] Conflit d\'intégrité référentielle:', data?.message);
          break;
        case 422:
          console.error('📝 [Interventions] Erreurs de validation:', data?.errors || data?.message);
          break;
        case 500:
          console.error('💥 [Interventions] Erreur serveur interne.');
          break;
        default:
          console.error('⚠️ [Interventions] Erreur HTTP:', status);
      }
    } else if (error.request) {
      console.error('❌ [Interventions] Pas de réponse du serveur. Laravel démarré ?', {
        url:     error.config?.url,
        method:  error.config?.method,
        baseURL: error.config?.baseURL,
      });
    } else {
      console.error('❌ [Interventions] Erreur de configuration Axios:', error.message);
    }

    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────
// 🔒 HELPER PRIVÉ
// ─────────────────────────────────────────────────────────────
function _clearSessionAndRedirect() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

// ─────────────────────────────────────────────────────────────
// 📦 API METHODS
// ─────────────────────────────────────────────────────────────

const BASE = '/admin/interventions/referentiels';

// ── Init global (toutes les listes en un appel) ──────────────
export const fetchAllReferentiels = () =>
  interventionsApi.get(`${BASE}`);

// ── Types Intervention ────────────────────────────────────────
export const fetchTypesIntervention = (params = {}) =>
  interventionsApi.get(`${BASE}/types-intervention`, { params });

export const createTypeIntervention = (data) =>
  interventionsApi.post(`${BASE}/types-intervention`, data);

export const updateTypeIntervention = (id, data) =>
  interventionsApi.put(`${BASE}/types-intervention/${id}`, data);

export const deleteTypeIntervention = (id) =>
  interventionsApi.delete(`${BASE}/types-intervention/${id}`);

export const toggleStatutTypeIntervention = (id) =>
  interventionsApi.patch(`${BASE}/types-intervention/${id}/statut`);

// ── Types Inspection ──────────────────────────────────────────
export const fetchTypesInspection = (params = {}) =>
  interventionsApi.get(`${BASE}/types-inspection`, { params });

export const createTypeInspection = (data) =>
  interventionsApi.post(`${BASE}/types-inspection`, data);

export const updateTypeInspection = (id, data) =>
  interventionsApi.put(`${BASE}/types-inspection/${id}`, data);

export const deleteTypeInspection = (id) =>
  interventionsApi.delete(`${BASE}/types-inspection/${id}`);

export const toggleStatutTypeInspection = (id) =>
  interventionsApi.patch(`${BASE}/types-inspection/${id}/statut`);

// ── Types Intervenant ─────────────────────────────────────────
export const fetchTypesIntervenant = (params = {}) =>
  interventionsApi.get(`${BASE}/types-intervenant`, { params });

export const createTypeIntervenant = (data) =>
  interventionsApi.post(`${BASE}/types-intervenant`, data);

export const updateTypeIntervenant = (id, data) =>
  interventionsApi.put(`${BASE}/types-intervenant/${id}`, data);

export const deleteTypeIntervenant = (id) =>
  interventionsApi.delete(`${BASE}/types-intervenant/${id}`);

export const toggleStatutTypeIntervenant = (id) =>
  interventionsApi.patch(`${BASE}/types-intervenant/${id}/statut`);

// ── Checklists ────────────────────────────────────────────────
export const fetchChecklists = (params = {}) =>
  interventionsApi.get(`${BASE}/checklists`, { params });

export const createChecklist = (data) =>
  interventionsApi.post(`${BASE}/checklists`, data);

export const updateChecklist = (id, data) =>
  interventionsApi.put(`${BASE}/checklists/${id}`, data);

export const deleteChecklist = (id) =>
  interventionsApi.delete(`${BASE}/checklists/${id}`);

export const toggleStatutChecklist = (id) =>
  interventionsApi.patch(`${BASE}/checklists/${id}/statut`);

export default interventionsApi;