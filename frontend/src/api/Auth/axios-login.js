import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  timeout: 10000,
  // ✅ withCredentials retiré - pas nécessaire pour Bearer token
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// ✅ Intercepteur de requête - Ajouter le token Bearer
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log pour debug (à retirer en production)
    console.log('📤 Requête:', config.method.toUpperCase(), config.url);
    
    return config;
  },
  (error) => {
    console.error('❌ Erreur de requête:', error);
    return Promise.reject(error);
  }
);

// ✅ Intercepteur de réponse - Gestion des erreurs
api.interceptors.response.use(
  (response) => {
    // Log pour debug (à retirer en production)
    console.log('✅ Réponse:', response.status);
    return response;
  },
  (error) => {
    if (error.response) {
      // Le serveur a répondu avec un code d'erreur
      const { status, data } = error.response;
      console.error('❌ Erreur serveur:', status, data);
      
      switch (status) {
        case 401:
          // Non authentifié - Déconnecter uniquement si pas sur la page login
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
      // La requête a été faite mais pas de réponse
      console.error('❌ Pas de réponse du serveur');
      console.error('Vérifiez que le serveur Laravel est démarré sur:', error.config?.baseURL);
      console.error('Détails:', {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
      });
    } else {
      // Erreur de configuration
      console.error('❌ Erreur de configuration Axios:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;