import axios from 'axios';

// ─── Instance axios (même config que api.js login) ────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ─── Intercepteur requête : injecte le Bearer token ──────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📤 [InspectionsVehicules]', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Erreur de requête:', error);
    return Promise.reject(error);
  }
);

// ─── Intercepteur réponse : gestion globale des erreurs ──────────────────────
api.interceptors.response.use(
  (response) => {
    console.log('✅ Réponse:', response.status, response.config.url);
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      console.error('❌ Erreur serveur:', status, data);

      switch (status) {
        case 401:
          if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            console.warn('⚠️ Session expirée, redirection vers login');
            window.location.href = '/login';
          }
          break;
        case 403:
          console.error('🚫 Accès refusé - Permissions insuffisantes');
          break;
        case 404:
          console.error('🔍 Ressource introuvable');
          break;
        case 422:
          console.error('📝 Erreurs de validation:', data.errors || data.message);
          break;
        case 500:
          console.error('💥 Erreur serveur interne');
          break;
        default:
          console.error('⚠️ Erreur HTTP:', status);
      }
    } else if (error.request) {
      console.error('❌ Pas de réponse du serveur. Laravel démarré sur:', error.config?.baseURL);
    } else {
      console.error('❌ Erreur de configuration Axios:', error.message);
    }
    console.error('code:', error.code, '| message:', error.message);
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// BASE URL de toutes les routes inspections
// ─────────────────────────────────────────────────────────────────────────────
const BASE = '/admin/inspections-vehicules';

// ═══════════════════════════════════════════════════════════════════════════
// RÉFÉRENTIELS
// GET /api/admin/inspections-vehicules/referentiels
// Retourne : { vehicules, types_inspection, accessoires }
// ═══════════════════════════════════════════════════════════════════════════
export const getReferentiels = () =>
  api.get(`${BASE}/referentiels`);

// ═══════════════════════════════════════════════════════════════════════════
// INSPECTIONS
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/admin/inspections-vehicules
// Retourne : { data: [], stats: { total, conformes, non_conformes, danger } }
export const getInspections = (params = {}) =>
  api.get(BASE, { params });

// GET /api/admin/inspections-vehicules/{id}
export const getInspection = (id) =>
  api.get(`${BASE}/${id}`);

// POST /api/admin/inspections-vehicules
// payload : { vehicule_immatriculation, type_inspection_id, date_inspection,
//             km_au_moment_inspection, nom_verificateurs, statut_global,
//             observations_vehicule, autres_constats, notes, elements[] }
export const createInspection = (payload) =>
  api.post(BASE, payload);

// PUT /api/admin/inspections-vehicules/{id}
export const updateInspection = (id, payload) =>
  api.put(`${BASE}/${id}`, payload);

// DELETE /api/admin/inspections-vehicules/{id}  (soft delete Laravel)
export const deleteInspection = (id) =>
  api.delete(`${BASE}/${id}`);

// ═══════════════════════════════════════════════════════════════════════════
// ACCESSOIRES
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/admin/inspections-vehicules/accessoires
// Retourne : { data: [], stats: { total, actifs, inactifs, categories } }
export const getAccessoires = () =>
  api.get(`${BASE}/accessoires`);

// POST /api/admin/inspections-vehicules/accessoires
// payload : { nom, categorie }
export const createAccessoire = (payload) =>
  api.post(`${BASE}/accessoires`, payload);

// PUT /api/admin/inspections-vehicules/accessoires/{id}
// payload : { nom, categorie }
export const updateAccessoire = (id, payload) =>
  api.put(`${BASE}/accessoires/${id}`, payload);

// PATCH /api/admin/inspections-vehicules/accessoires/{id}/statut
export const toggleStatutAccessoire = (id) =>
  api.patch(`${BASE}/accessoires/${id}/statut`);

// DELETE /api/admin/inspections-vehicules/accessoires/{id}
// Laravel désactive seulement si utilisé dans des inspections, supprime sinon
export const deleteAccessoire = (id) =>
  api.delete(`${BASE}/accessoires/${id}`);