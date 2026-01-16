import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // IMPORTANT: Permettre l'envoi des cookies HttpOnly avec chaque requête
  withCredentials: true,
});

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Diagnostics ciblées (utile quand l'API distante n'est pas à jour)
    try {
      const status = error?.response?.status;
      const url: string | undefined = error?.config?.url;
      const baseURL: string | undefined = error?.config?.baseURL;
      const data = error?.response?.data;

      if (typeof status === 'number' && status >= 500) {
        // eslint-disable-next-line no-console
        console.error('[API] Erreur serveur', { status, baseURL, url, data });
      } else if (!status) {
        // eslint-disable-next-line no-console
        console.error('[API] Erreur réseau / CORS', {
          baseURL,
          url,
          message: error?.message,
        });
      }

      if (
        status === 404 &&
        typeof url === 'string' &&
        url.includes('/annulations/') &&
        (url.includes('/rembourser') || url.includes('/generer-avoir') || url.includes('/utiliser-avoir'))
      ) {
        // eslint-disable-next-line no-console
        console.warn(
          '[API] Route annulations introuvable (404). Le backend derrière VITE_API_URL n\'est probablement pas déployé/à jour.',
          { baseURL, url }
        );
      }
    } catch {
      // ignore
    }

    if (error.response?.status === 401) {
      // Ne pas supprimer le localStorage car le token n'y est plus stocké
      // Rediriger seulement si on n'est pas déjà sur la page de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
