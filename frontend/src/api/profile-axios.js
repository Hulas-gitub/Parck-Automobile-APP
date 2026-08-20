/**
 * profile-axios.js
 * Instance Axios dédiée aux appels de l'espace Profil utilisateur.
 * Inspirée de axios-login.js avec gestion spécifique :
 *  - Déconnexion automatique sur réponse logout:true (changement de mdp)
 *  - Alerte d'expiration de session (401 avec session_expired)
 *  - Pas de redirection sur 401 si on est déjà sur /login
 */

import axios from 'axios';

const profileApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ─────────────────────────────────────────────────────────────
// 📤 INTERCEPTEUR REQUÊTE — Injecte le Bearer token
// ─────────────────────────────────────────────────────────────
profileApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📤 [Profile] Requête:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ [Profile] Erreur de requête:', error);
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────
// 📥 INTERCEPTEUR RÉPONSE — Gestion des erreurs + logout auto
// ─────────────────────────────────────────────────────────────
profileApi.interceptors.response.use(
  (response) => {
    console.log('✅ [Profile] Réponse:', response.status, response.config.url);
    // La déconnexion après changement de mot de passe est gérée
    // directement dans le composant MonProfile (séquence SweetAlert → redirect)
    // pour garantir que l'alerte s'affiche AVANT la redirection.
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      console.error('❌ [Profile] Erreur serveur:', status, data);

      switch (status) {
        case 401:
          // Session expirée ou token révoqué
          if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
            if (data?.session_expired) {
              console.warn('⏰ [Profile] Session de 2h expirée, redirection vers login.');
            } else {
              console.warn('⚠️ [Profile] Non authentifié, redirection vers login.');
            }
            _clearSessionAndRedirect();
          }
          break;

        case 403:
          console.error('🚫 [Profile] Accès refusé — compte désactivé ou supprimé.');
          break;

        case 404:
          console.error('🔍 [Profile] Ressource introuvable.');
          break;

        case 422:
          // Erreurs de validation — gérées dans le composant via err.response.data.message
          console.error('📝 [Profile] Erreurs de validation:', data.errors || data.message);
          break;

        case 500:
          console.error('💥 [Profile] Erreur serveur interne.');
          break;

        default:
          console.error('⚠️ [Profile] Erreur HTTP:', status);
      }
    } else if (error.request) {
      console.error('❌ [Profile] Pas de réponse du serveur. Laravel démarré ?', {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
      });
    } else {
      console.error('❌ [Profile] Erreur de configuration Axios:', error.message);
    }

    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────
// 🔒 HELPER PRIVÉ — Vide la session et redirige vers /login
// ─────────────────────────────────────────────────────────────
function _clearSessionAndRedirect() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

export default profileApi;