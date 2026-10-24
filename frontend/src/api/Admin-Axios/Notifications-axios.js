import axios from 'axios';

const notificationsApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Intercepteur pour ajouter le token Bearer automatiquement
notificationsApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs 401
notificationsApi.interceptors.response.use(
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
// 📡 API NOTIFICATIONS
// ──────────────────────────────────────────────────────────────────────

/**
 * Récupérer la liste des notifications (paginée, filtrée côté serveur)
 * Le backend retourne :
 * { success, data: { notifications, unread_count, stats, current_page, last_page, per_page, total } }
 *
 * Les 3 premiers paramètres gardent leur ordre d'origine (compatible avec les appels existants,
 * ex. le Header qui appelle getNotifications(1, 5)).
 *
 * @param {number} page      - Numéro de la page (défaut: 1)
 * @param {number} perPage   - Nombre d'éléments par page (défaut: 10)
 * @param {string} canal     - 'all' | 'in_app' | 'email' (défaut: 'all')
 * @param {string} etat      - 'all' | 'unread' | 'read' (défaut: 'all')
 * @param {string} categorie - 'all' | 'critique' | 'important' | 'a_surveiller' | 'normal' (défaut: 'all')
 */
export const getNotifications = (page = 1, perPage = 10, canal = 'all', etat = 'all', categorie = 'all') => {
  // Compatibilité : si le 3ème paramètre est un objet (ancien format), ignorer
  if (typeof canal === 'object') {
    return notificationsApi.get('/admin/notifications', {
      params: { page, per_page: perPage },
    });
  }
  return notificationsApi.get('/admin/notifications', {
    params: { page, per_page: perPage, canal, etat, categorie },
  });
};

/**
 * Marquer une notification comme lue
 * Le backend retourne : { success, message }
 */
export const readNotification = (id) =>
  notificationsApi.post(`/admin/notifications/${id}/read`);

/**
 * Marquer toutes les notifications comme lues
 * Le backend retourne : { success, message, updated_count, created_count }
 */
export const readAllNotifications = () =>
  notificationsApi.post('/admin/notifications/read-all');

/**
 * Obtenir le nombre de notifications non lues
 * Le backend retourne : { success, unread_count }
 */
export const getUnreadCount = () =>
  notificationsApi.get('/admin/notifications/unread/count');

/**
 * Synchroniser les notifications (créer les entrées manquantes dans envois_notifications)
 * Le backend retourne : { success, message, synced_count }
 */
export const syncNotifications = () =>
  notificationsApi.post('/admin/notifications/sync');

// ──────────────────────────────────────────────────────────────────────
// 📦 EXPORT PAR DÉFAUT
// ──────────────────────────────────────────────────────────────────────
export default notificationsApi;