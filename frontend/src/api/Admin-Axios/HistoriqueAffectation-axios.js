// ============================================================
// src/api/Admin-Axios/HistoriqueAffectation-axios.js
// ============================================================
// baseURL = VITE_API_URL = http://127.0.0.1:8000/api
// VITE_LARAVEL_URL sert uniquement à construire les URLs de
// stockage (photos, logos) — pas pour les appels API.
// ============================================================

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // http://127.0.0.1:8000/api
  headers: { Accept: 'application/json' },
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

// =============================================================================
// LISTE (paginée + filtres)
// =============================================================================
export const getHistoriqueAffectations = (params = {}) =>
  api.get('/admin/historique-affectations', { params }).then((r) => r.data);

// =============================================================================
// DÉTAIL
// =============================================================================
export const getHistoriqueAffectation = (id) =>
  api.get(`/admin/historique-affectations/${id}`).then((r) => r.data);

// =============================================================================
// CRÉER
// =============================================================================
export const createHistoriqueAffectation = (data) =>
  api.post('/admin/historique-affectations', data).then((r) => r.data);

// =============================================================================
// MODIFIER
// =============================================================================
export const updateHistoriqueAffectation = (id, data) =>
  api.put(`/admin/historique-affectations/${id}`, data).then((r) => r.data);

// =============================================================================
// CLÔTURER
// =============================================================================
export const cloturerHistoriqueAffectation = (id, data = {}) =>
  api.post(`/admin/historique-affectations/${id}/cloturer`, data).then((r) => r.data);

// =============================================================================
// SUPPRIMER (soft delete)
// =============================================================================
export const deleteHistoriqueAffectation = (id) =>
  api.delete(`/admin/historique-affectations/${id}`).then((r) => r.data);

// =============================================================================
// RÉFÉRENCES (pour les formulaires)
// NOTE : cette route est déclarée AVANT /{id} dans api.php
// =============================================================================
export const getReferencesHistorique = () =>
  api.get('/admin/historique-affectations/references').then((r) => r.data);

// =============================================================================
// STATISTIQUES
// =============================================================================
export const getStatsHistoriqueAffectations = () =>
  api.get('/admin/historique-affectations/statistiques').then((r) => r.data);

export default api;