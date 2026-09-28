// ============================================================
// src/api/ActivitesSysteme-axios.js
// ============================================================

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
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
// LISTE PAGINÉE  →  GET /admin/activites-systeme
// Paramètres : { periode, role, action, table, user_id, q, page, per_page }
// ─────────────────────────────────────────────────────────────
export const getActivitesSysteme = (params = {}) =>
  api.get('/admin/activites-systeme', { params }).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// DÉTAIL D'UNE ENTRÉE  →  GET /admin/activites-systeme/{id}
// ─────────────────────────────────────────────────────────────
export const getActiviteDetail = (id) =>
  api.get(`/admin/activites-systeme/${id}`).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// STATISTIQUES (KPI + sparkline)  →  GET /admin/activites-systeme/stats
// Mêmes filtres que la liste (hors page/per_page)
// ─────────────────────────────────────────────────────────────
export const getActivitesStats = (params = {}) =>
  api.get('/admin/activites-systeme/stats', { params }).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// UTILISATEURS DISTINCTS (pour le filtre)  →  GET /admin/activites-systeme/utilisateurs
// ─────────────────────────────────────────────────────────────
export const getActivitesUtilisateurs = () =>
  api.get('/admin/activites-systeme/utilisateurs').then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// EXPORT (non paginé, plafonné)  →  GET /admin/activites-systeme/export
// Mêmes filtres que la liste (hors page/per_page)
// ─────────────────────────────────────────────────────────────
export const exportActivitesSysteme = (params = {}) =>
  api.get('/admin/activites-systeme/export', { params }).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// RÉFÉRENTIELS STATIQUES (libellés / couleurs / icônes)
// Le backend ne renvoie que des codes : ces tables font le lien
// visuel côté front, comme dans Activitesysteme.jsx.
// ─────────────────────────────────────────────────────────────
export const ROLES = [
  { code: 'admin',          libelle: 'Super Administrateur',    color: '#ef4444', bg: 'bg-red-500/20 text-red-400' },
  { code: 'chef_parc',      libelle: 'Gestionnaire du Parc',    color: '#6366f1', bg: 'bg-indigo-500/20 text-indigo-400' },
  { code: 'chef_tf',        libelle: 'Chef Transport de Fonds', color: '#f59e0b', bg: 'bg-amber-500/20 text-amber-400' },
  { code: 'agent_pc_radio', libelle: 'Agent PC Radio',          color: '#06b6d4', bg: 'bg-cyan-500/20 text-cyan-400' },
  { code: 'mecanicien',     libelle: 'Mécanicien / Technicien', color: '#10b981', bg: 'bg-emerald-500/20 text-emerald-400' },
  { code: 'chauffeur',      libelle: 'Chauffeur',               color: '#8b5cf6', bg: 'bg-violet-500/20 text-violet-400' },
];

export const ACTIONS = [
  { code: 'CREATE',    libelle: 'Création',     icon: 'bi-plus-circle-fill',    color: '#10b981', bg: 'bg-emerald-500/20 text-emerald-400' },
  { code: 'UPDATE',    libelle: 'Modification', icon: 'bi-pencil-fill',         color: '#3b82f6', bg: 'bg-blue-500/20 text-blue-400' },
  { code: 'DELETE',    libelle: 'Suppression',  icon: 'bi-trash-fill',          color: '#ef4444', bg: 'bg-red-500/20 text-red-400' },
  { code: 'READ',      libelle: 'Consultation', icon: 'bi-eye-fill',            color: '#6366f1', bg: 'bg-indigo-500/20 text-indigo-400' },
  { code: 'BLOQUER',   libelle: 'Blocage',      icon: 'bi-lock-fill',           color: '#f59e0b', bg: 'bg-amber-500/20 text-amber-400' },
  { code: 'DEBLOQUER', libelle: 'Déblocage',    icon: 'bi-unlock-fill',         color: '#06b6d4', bg: 'bg-cyan-500/20 text-cyan-400' },
  { code: 'LOGIN',     libelle: 'Connexion',    icon: 'bi-box-arrow-in-right',  color: '#8b5cf6', bg: 'bg-violet-500/20 text-violet-400' },
  { code: 'LOGOUT',    libelle: 'Déconnexion',  icon: 'bi-box-arrow-right',     color: '#94a3b8', bg: 'bg-slate-500/20 text-slate-400' },
];

export const PERIODES = [
  { code: '7j',          libelle: '7 derniers jours',  jours: 7 },
  { code: '30j',         libelle: '30 derniers jours', jours: 30 },
  { code: 'mensuel',     libelle: 'Mensuel',           jours: 30 },
  { code: 'trimestriel', libelle: 'Trimestriel',       jours: 90 },
  { code: 'semestriel',  libelle: 'Semestriel',        jours: 180 },
  { code: 'annuel',      libelle: 'Annuel',            jours: 365 },
];

export const TABLES = [
  'vehicules', 'missions', 'utilisateurs','inspections_vehiculues', 'interventions', 'accidents',
  'carnets_carburant', 'documents_vehicules', 'inspections', 'planning_maintenance',
  'pieces_detachees', 'fournisseurs', 'intervenants', 'roles', 'sessions',
]; 

export default api;