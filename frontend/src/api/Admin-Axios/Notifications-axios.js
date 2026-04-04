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
// 📡 API NOTIFICATIONS (COMPLETE)
// ──────────────────────────────────────────────────────────────────────

/**
 * Récupérer la liste des notifications (paginated)
 * @param {number} page - Numéro de la page (défaut: 1)
 * @param {number} perPage - Nombre d'éléments par page (défaut: 10)
 * @returns {Promise}
 */
export const getNotifications = (page = 1, perPage = 10) => 
  notificationsApi.get(`/admin/notifications?page=${page}&per_page=${perPage}`);

/**
 * Marquer une notification comme lue
 * @param {number} id - ID de la notification
 * @returns {Promise}
 */
export const readNotification = (id) => 
  notificationsApi.post(`/admin/notifications/${id}/read`);

/**
 * Marquer toutes les notifications comme lues
 * @returns {Promise}
 */
export const readAllNotifications = () => 
  notificationsApi.post('/admin/notifications/read-all');

/**
 * Supprimer une notification
 * @param {number} id - ID de la notification
 * @returns {Promise}
 */
export const deleteNotification = (id) => 
  notificationsApi.delete(`/admin/notifications/${id}`);

/**
 * Supprimer toutes les notifications lues
 * @returns {Promise}
 */
export const deleteAllReadNotifications = () => 
  notificationsApi.delete('/admin/notifications/read/all');

/**
 * Obtenir le nombre de notifications non lues
 * @returns {Promise}
 */
export const getUnreadNotificationsCount = () => 
  notificationsApi.get('/admin/notifications/unread/count');

/**
 * Récupérer uniquement le compteur non lu (alias)
 * @returns {Promise}
 */
export const getUnreadCount = () => getUnreadNotificationsCount();

/**
 * Synchroniser les notifications (créer les entrées manquantes)
 * @returns {Promise}
 */
export const syncNotifications = () => 
  notificationsApi.post('/admin/notifications/sync');

// ──────────────────────────────────────────────────────────────────────
// 📦 EXPORT PAR DÉFAUT
// ──────────────────────────────────────────────────────────────────────
export default notificationsApi;