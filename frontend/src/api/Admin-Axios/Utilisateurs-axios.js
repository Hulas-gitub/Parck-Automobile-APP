import axios from 'axios';

const utilisateursApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Intercepteur : ajoute le token Bearer automatiquement
utilisateursApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur : redirige vers /login en cas de 401
utilisateursApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('remember_me');
      localStorage.removeItem('expires_at');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ──────────────────────────────────────────────────────────────────────
// 👤 UTILISATEURS
// ──────────────────────────────────────────────────────────────────────

/** GET /admin/utilisateurs */
export const getUtilisateurs = (params = {}) =>
  utilisateursApi.get('/admin/utilisateurs', { params });

/** GET /admin/utilisateurs/{id} */
export const getUtilisateur = (id) =>
  utilisateursApi.get(`/admin/utilisateurs/${id}`);

/**
 * POST /admin/utilisateurs/generate-password
 * Corps : { nom: string }
 * Réponse : { success, password }
 */
export const generatePassword = (nom = '') =>
  utilisateursApi.post('/admin/utilisateurs/generate-password', { nom });

/**
 * POST /admin/utilisateurs
 * Corps : { nom, email, role_id, direction_id?, mot_de_passe }
 */
export const createUtilisateur = (data) =>
  utilisateursApi.post('/admin/utilisateurs', data);

/**
 * PUT /admin/utilisateurs/{id}
 * Corps : { nom?, email?, role_id?, direction_id? }
 */
export const updateUtilisateur = (id, data) =>
  utilisateursApi.put(`/admin/utilisateurs/${id}`, data);

/** DELETE /admin/utilisateurs/{id} */
export const deleteUtilisateur = (id) =>
  utilisateursApi.delete(`/admin/utilisateurs/${id}`);

/** PATCH /admin/utilisateurs/{id}/statut */
export const toggleStatutUtilisateur = (id) =>
  utilisateursApi.patch(`/admin/utilisateurs/${id}/statut`);

/** POST /admin/utilisateurs/{id}/reset-password */
export const resetPasswordUtilisateur = (id) =>
  utilisateursApi.post(`/admin/utilisateurs/${id}/reset-password`);

// ──────────────────────────────────────────────────────────────────────
// 🛡️ RÔLES
// ──────────────────────────────────────────────────────────────────────

/** GET /admin/roles */
export const getRoles = (params = {}) =>
  utilisateursApi.get('/admin/roles', { params });

/**
 * POST /admin/roles
 * Corps : { code, libelle, description? }
 */
export const createRole = (data) =>
  utilisateursApi.post('/admin/roles', data);

/**
 * PUT /admin/roles/{id}
 * Corps : { code?, libelle?, description? }
 */
export const updateRole = (id, data) =>
  utilisateursApi.put(`/admin/roles/${id}`, data);

/** DELETE /admin/roles/{id} */
export const deleteRole = (id) =>
  utilisateursApi.delete(`/admin/roles/${id}`);

/** PATCH /admin/roles/{id}/statut */
export const toggleStatutRole = (id) =>
  utilisateursApi.patch(`/admin/roles/${id}/statut`);

// ──────────────────────────────────────────────────────────────────────
// 🏢 DIRECTIONS
// Le champ BDD s'appelle 'reference' — on l'utilise directement partout.
// Plus aucun alias code→reference.
// ──────────────────────────────────────────────────────────────────────

/** GET /admin/directions */
export const getDirections = (params = {}) =>
  utilisateursApi.get('/admin/directions', { params });

/**
 * POST /admin/directions
 * Corps : { nom, reference? }
 */
export const createDirection = (data) =>
  utilisateursApi.post('/admin/directions', data);

/**
 * PUT /admin/directions/{id}
 * Corps : { nom?, reference? }
 */
export const updateDirection = (id, data) =>
  utilisateursApi.put(`/admin/directions/${id}`, data);

/** DELETE /admin/directions/{id} */
export const deleteDirection = (id) =>
  utilisateursApi.delete(`/admin/directions/${id}`);

/** PATCH /admin/directions/{id}/statut */
export const toggleStatutDirection = (id) =>
  utilisateursApi.patch(`/admin/directions/${id}/statut`);

export default utilisateursApi;