// ============================================================
// src/api/Dashboard-axios.js
// ============================================================

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Injecte automatiquement le token Sanctum à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─────────────────────────────────────────────────────────────
// APPEL UNIQUE  →  toutes les données dashboard en une requête
// ─────────────────────────────────────────────────────────────
export const getDashboardData = () =>
  api.get('/admin/dashboard').then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// KPI VÉHICULES DÉTAILLÉ  →  GET /admin/dashboard/kpi-vehicules
// Paramètres : { periode, search, page, per_page }
// ─────────────────────────────────────────────────────────────
export const getKpiVehicules = (params = {}) =>
  api.get('/admin/dashboard/kpi-vehicules', { params }).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// COULEURS PAR DÉFAUT
// ─────────────────────────────────────────────────────────────
export const ROLE_COLORS = {
  admin:          '#ef4444',
  chef_parc:      '#f59e0b',
  chauffeur:      '#10b981',
  chef_tf:        '#3b82f6',
  mecanicien:     '#8b5cf6',
  agent_pc_radio: '#ec4899',
};

export const BADGE_COLORS = {
  excellent: 'bg-green-100 text-green-700',
  bon:       'bg-blue-100 text-blue-700',
  moyen:     'bg-yellow-100 text-yellow-700',
  faible:    'bg-red-100 text-red-700',
};