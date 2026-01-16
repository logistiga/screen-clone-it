import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Extraire l'URL de base (sans /api) pour le cookie CSRF
const getBaseUrl = (): string => {
  const url = API_URL.replace(/\/api\/?$/, '');
  return url || 'http://localhost:8000';
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // IMPORTANT: Permettre l'envoi des cookies HttpOnly avec chaque requête
  withCredentials: true,
});

// ============================================
// CSRF Token Management
// ============================================

let csrfInitialized = false;
let csrfPromise: Promise<void> | null = null;

/**
 * Récupère le cookie XSRF-TOKEN depuis Laravel Sanctum
 * Ce cookie est automatiquement défini par Laravel et sera lu par Axios
 */
const fetchCsrfToken = async (): Promise<void> => {
  if (csrfInitialized) return;
  
  // Éviter les appels multiples simultanés
  if (csrfPromise) {
    return csrfPromise;
  }

  csrfPromise = (async () => {
    try {
      const baseUrl = getBaseUrl();
      await axios.get(`${baseUrl}/sanctum/csrf-cookie`, {
        withCredentials: true,
      });
      csrfInitialized = true;
      console.log('[CSRF] Token initialisé');
    } catch (error) {
      console.error('[CSRF] Erreur lors de la récupération du token:', error);
      // Ne pas bloquer l'application en cas d'erreur
    } finally {
      csrfPromise = null;
    }
  })();

  return csrfPromise;
};

/**
 * Récupère la valeur du cookie XSRF-TOKEN
 */
const getXsrfToken = (): string | null => {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  if (match) {
    // Le cookie est encodé en URI, il faut le décoder
    return decodeURIComponent(match[1]);
  }
  return null;
};

/**
 * Vérifie si la requête nécessite un token CSRF
 * Les requêtes GET, HEAD, OPTIONS ne modifient pas l'état et n'ont pas besoin de CSRF
 */
const requiresCsrf = (method: string | undefined): boolean => {
  if (!method) return false;
  const safeMethodsPattern = /^(GET|HEAD|OPTIONS)$/i;
  return !safeMethodsPattern.test(method);
};

// ============================================
// Request Interceptor
// ============================================

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Pour les requêtes qui modifient l'état (POST, PUT, DELETE, PATCH)
    if (requiresCsrf(config.method)) {
      // S'assurer que le cookie CSRF est initialisé
      await fetchCsrfToken();
      
      // Ajouter le token XSRF à l'en-tête
      const xsrfToken = getXsrfToken();
      if (xsrfToken) {
        config.headers['X-XSRF-TOKEN'] = xsrfToken;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================
// Response Interceptor
// ============================================

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Si erreur 419 (CSRF token mismatch), réessayer avec un nouveau token
    if (error.response?.status === 419 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.warn('[CSRF] Token expiré, renouvellement...');
      
      // Forcer le renouvellement du token CSRF
      csrfInitialized = false;
      await fetchCsrfToken();
      
      // Mettre à jour le header avec le nouveau token
      const newXsrfToken = getXsrfToken();
      if (newXsrfToken) {
        originalRequest.headers['X-XSRF-TOKEN'] = newXsrfToken;
      }
      
      // Réessayer la requête
      return api(originalRequest);
    }

    // Diagnostics ciblées
    try {
      const status = error?.response?.status;
      const url: string | undefined = error?.config?.url;
      const baseURL: string | undefined = error?.config?.baseURL;
      const data = error?.response?.data;

      if (typeof status === 'number' && status >= 500) {
        console.error('[API] Erreur serveur', { status, baseURL, url, data });
      } else if (!status) {
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
        console.warn(
          '[API] Route annulations introuvable (404). Le backend derrière VITE_API_URL n\'est probablement pas déployé/à jour.',
          { baseURL, url }
        );
      }
    } catch {
      // ignore
    }

    // Gestion de l'erreur 401 (non authentifié)
    if (error.response?.status === 401) {
      // Rediriger seulement si on n'est pas déjà sur la page de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// Exports
// ============================================

/**
 * Initialise le token CSRF au démarrage de l'application
 * Appelé une fois lors du chargement de l'app
 */
export const initializeCsrf = async (): Promise<void> => {
  await fetchCsrfToken();
};

/**
 * Réinitialise le token CSRF (utile après une déconnexion)
 */
export const resetCsrf = (): void => {
  csrfInitialized = false;
};

export default api;
