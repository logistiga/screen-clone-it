import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Diagnostics ciblées (utile quand l'API distante n'est pas à jour)
    try {
      const status = error?.response?.status;
      const url: string | undefined = error?.config?.url;
      const baseURL: string | undefined = error?.config?.baseURL;

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
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
