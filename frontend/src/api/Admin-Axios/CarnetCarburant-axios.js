// ============================================================
// src/api/Admin-Axios/CarnetCarburant-axios.js
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

const _download = (blob, filename, mime) => {
  const url = URL.createObjectURL(new Blob([blob], { type: mime }));
  const a   = Object.assign(document.createElement('a'), {
    href:     url,
    download: filename,
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Base URL par véhicule
const base = (immat) => `/admin/vehicules/${encodeURIComponent(immat)}/carburant`;

// ============================================================
// MODE GLOBAL — Véhicules (sans immatriculation dans l'URL)
// Utilisés par CarnetCarburant.jsx pour charger le sélecteur
// ============================================================

/**
 * Liste tous les véhicules actifs avec leurs stats carburant agrégées.
 * Remplace le besoin de passer l'immatriculation dans l'URL.
 */
export const getVehiculesCarburant = () =>
  api
    .get('/admin/carburant/vehicules')
    .then((r) => r.data);

/**
 * Détail d'un véhicule spécifique (pour le sélecteur).
 */
export const getVehiculeCarburantDetail = (immatriculation) =>
  api
    .get(`/admin/carburant/vehicules/${encodeURIComponent(immatriculation)}`)
    .then((r) => r.data);

// ============================================================
// MODE PAR VÉHICULE — CRUD carburant
// ============================================================

export const getMissionsDisponibles = (immatriculation) =>
  api
    .get(`${base(immatriculation)}/missions-disponibles`)
    .then((r) => r.data);

export const getCarburant = (immatriculation) =>
  api
    .get(`${base(immatriculation)}`)
    .then((r) => r.data);

export const getCarburantSimple = (immatriculation, id) =>
  api
    .get(`${base(immatriculation)}/${id}`)
    .then((r) => r.data);

export const getCarburantDetail = (immatriculation, id) =>
  api
    .get(`${base(immatriculation)}/${id}/detail`)
    .then((r) => r.data);

export const createCarburant = (immatriculation, data) =>
  api
    .post(`${base(immatriculation)}`, data)
    .then((r) => r.data);

export const updateCarburant = (immatriculation, id, data) =>
  api
    .put(`${base(immatriculation)}/${id}`, data)
    .then((r) => r.data);

export const deleteCarburant = (immatriculation, id) =>
  api
    .delete(`${base(immatriculation)}/${id}`)
    .then((r) => r.data);

export const exportCarburantPdf = async (immatriculation, params = {}) => {
  const blob = await api
    .get(`${base(immatriculation)}/export/pdf`, {
      params,
      responseType: 'blob',
    })
    .then((r) => r.data);

  _download(
    blob,
    `carnet_carburant_${immatriculation}_${new Date().toISOString().slice(0, 10)}.pdf`,
    'application/pdf'
  );
};

export const exportCarburantExcel = async (immatriculation, params = {}) => {
  const blob = await api
    .get(`${base(immatriculation)}/export/excel`, {
      params,
      responseType: 'blob',
    })
    .then((r) => r.data);

  _download(
    blob,
    `carnet_carburant_${immatriculation}_${new Date().toISOString().slice(0, 10)}.xlsx`,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
};

export default api;