import api from '../Auth/axios-login';

/**
 * Récupère la liste paginée + filtrée de l'historique des connexions
 * @param {Object} params - { periode, role, navigateur, os, statut, search, sort_by, sort_dir, page, per_page }
 */
export const fetchHistoriqueConnexions = (params = {}) => {
  return api.get('/admin/historique-connexions', { params });
};

/**
 * Récupère le détail d'une session de connexion
 * @param {number|string} id
 */
export const fetchHistoriqueConnexionDetail = (id) => {
  return api.get(`/admin/historique-connexions/${id}`);
};

/**
 * Force la déconnexion d'une session active
 * @param {number|string} id
 */
export const forceLogoutSession = (id) => {
  return api.post(`/admin/historique-connexions/${id}/force-logout`);
};

/**
 * Récupère l'ensemble des sessions correspondant aux filtres, sans pagination,
 * pour permettre un export Excel/PDF complet (et non limité à la page affichée).
 * @param {Object} params - mêmes filtres que fetchHistoriqueConnexions (sans page/per_page)
 */
export const fetchAllHistoriqueConnexionsForExport = (params = {}) => {
  return api.get('/admin/historique-connexions', {
    params: { ...params, per_page: 5000, page: 1 },
  });
};

export default {
  fetchHistoriqueConnexions,
  fetchHistoriqueConnexionDetail,
  forceLogoutSession,
  fetchAllHistoriqueConnexionsForExport,
};