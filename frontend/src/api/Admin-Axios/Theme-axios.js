import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Récupérer le thème actif + la liste de tous les thèmes.
 * Retourne :
 * {
 *   valeur: '#ffc400',     <- code hex du thème actif
 *   couleur: 'Orange',     <- nom du thème actif
 *   id_actif: 1,
 *   est_applique: true,
 *   themes: [
 *     { id, valeur: '#ffc400', couleur: 'Orange', est_applique: 1, ... },
 *     { id, valeur: '#a855f7', couleur: 'Violet Custom', est_applique: 0, ... },
 *   ]
 * }
 */
export const getTheme = async () => {
  const response = await api.get('/parametres/theme');
  return response.data;
};

/**
 * Créer un nouveau thème custom (l'ajouter à la liste sans l'appliquer).
 * @param {string} valeur       - Code hex  ex: '#a855f7'
 * @param {string} couleur      - Nom       ex: 'Violet Custom'
 * @param {string} primaryLight - Hex clair ex: '#d8b4fe' (optionnel)
 * @param {string} primaryDark  - Hex foncé ex: '#7e22ce' (optionnel)
 */
export const createTheme = async (valeur, couleur, primaryLight = null, primaryDark = null) => {
  const payload = { valeur, couleur };
  if (primaryLight) payload.primaryLight = primaryLight;
  if (primaryDark)  payload.primaryDark  = primaryDark;
  const response = await api.post('/admin/parametres/theme', payload);
  return response.data; // { id, valeur, couleur, est_applique: false }
};

/**
 * Appliquer un thème existant (le marquer est_applique=1 en BDD).
 * @param {number} id - L'id du thème dans parametres_systeme
 */
export const appliquerTheme = async (id) => {
  const response = await api.put(`/admin/parametres/theme/${id}/appliquer`);
  return response.data;
};

/**
 * Supprimer un thème (impossible s'il est actif).
 * @param {number} id
 */
export const deleteTheme = async (id) => {
  const response = await api.delete(`/admin/parametres/theme/${id}`);
  return response.data;
};