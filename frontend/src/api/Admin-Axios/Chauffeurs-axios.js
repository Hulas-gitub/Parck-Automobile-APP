/**
 * chauffeur-axios.js
 * Instance Axios dédiée aux appels de la gestion des chauffeurs.
 * Inspirée de profile-axios.js.
 *
 * Toutes les routes chauffeurs sont sous /api/admin/chauffeurs
 */

import axios from 'axios';

const chauffeurApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL ,
  timeout: 15000, // upload de fichiers → timeout plus généreux
  headers: {
    'Accept': 'application/json',
    // Content-Type intentionnellement absent ici :
    // Axios le définit automatiquement selon le type du body
    // (application/json pour les objets, multipart/form-data pour FormData)
  },
});

// ─────────────────────────────────────────────────────────────
// 📤 INTERCEPTEUR REQUÊTE — Injecte le Bearer token
// ─────────────────────────────────────────────────────────────
chauffeurApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Si le body est un FormData, laisser Axios gérer le Content-Type
    // (il ajoutera le bon boundary pour multipart/form-data)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else {
      config.headers['Content-Type'] = 'application/json';
    }

    console.log('📤 [Chauffeur] Requête:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ [Chauffeur] Erreur de requête:', error);
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────
// 📥 INTERCEPTEUR RÉPONSE — Gestion centralisée des erreurs
// ─────────────────────────────────────────────────────────────
chauffeurApi.interceptors.response.use(
  (response) => {
    console.log('✅ [Chauffeur] Réponse:', response.status, response.config.url);
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      console.error('❌ [Chauffeur] Erreur serveur:', status, data);

      switch (status) {
        case 401:
          // Session expirée ou token révoqué → déconnexion automatique
          if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
            if (data?.session_expired) {
              console.warn('⏰ [Chauffeur] Session expirée, redirection vers login.');
            } else {
              console.warn('⚠️ [Chauffeur] Non authentifié, redirection vers login.');
            }
            _clearSessionAndRedirect();
          }
          break;

        case 403:
          console.error('🚫 [Chauffeur] Accès refusé — permissions insuffisantes.');
          break;

        case 404:
          console.error('🔍 [Chauffeur] Ressource introuvable:', data?.message);
          break;

        case 422:
          // Erreurs de validation Laravel — gérées dans le composant
          // via err.response.data.errors
          console.error('📝 [Chauffeur] Erreurs de validation:', data?.errors || data?.message);
          break;

        case 413:
          console.error('📦 [Chauffeur] Fichier trop volumineux (limite serveur dépassée).');
          break;

        case 500:
          console.error('💥 [Chauffeur] Erreur serveur interne.');
          break;

        default:
          console.error('⚠️ [Chauffeur] Erreur HTTP:', status);
      }
    } else if (error.request) {
      console.error('❌ [Chauffeur] Pas de réponse du serveur. Laravel démarré ?', {
        url:     error.config?.url,
        method:  error.config?.method,
        baseURL: error.config?.baseURL,
      });
    } else {
      console.error('❌ [Chauffeur] Erreur de configuration Axios:', error.message);
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

export default chauffeurApi;