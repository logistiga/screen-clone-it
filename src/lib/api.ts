import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getApiUrl, getBackendBaseUrl } from "@/lib/runtime-config";

// Configuration de l'API - Production: https://facturation.logistiga.com/backend/public/api
const API_URL = getApiUrl();
const BACKEND_BASE_URL = getBackendBaseUrl();
const IS_PRODUCTION = import.meta.env.PROD;

// Debug: afficher les URLs configurées au démarrage
if (!IS_PRODUCTION) {
  console.log('[API Config]', { API_URL, BACKEND_BASE_URL });
}

// Clé de stockage du token (backup si cookies ne marchent pas)
const TOKEN_STORAGE_KEY = 'auth_token';

// Flag pour savoir si on utilise les cookies (Sanctum SPA) ou Bearer token
let useCookieAuth = true;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest", // Important pour Sanctum
  },
  // IMPORTANT: Activer les cookies pour l'auth Sanctum SPA
  withCredentials: true,
  // Axios gère XSRF-TOKEN -> X-XSRF-TOKEN (utile en cross-origin)
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  timeout: 30000,
});

// ============================================
// Token Management (fallback si cookies échouent)
// ============================================

/**
 * Récupère le token d'authentification depuis localStorage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

/**
 * Sauvegarde le token d'authentification dans localStorage
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

/**
 * Supprime le token d'authentification
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

/**
 * Logger conditionnel (désactivé en production)
 */
const log = {
  info: (...args: unknown[]) => !IS_PRODUCTION && console.log(...args),
  warn: (...args: unknown[]) => !IS_PRODUCTION && console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};

// ============================================
// CSRF Token Management (Sanctum SPA)
// ============================================

let csrfInitialized = false;
let csrfInitializing: Promise<void> | null = null;

/**
 * Désactive l'auth par cookies (Sanctum SPA) et bascule en Bearer token.
 * Utile quand les cookies provoquent des erreurs (ex: 431 header too large).
 */
const disableCookieAuth = (reason?: string) => {
  useCookieAuth = false;
  csrfInitialized = false;
  csrfInitializing = null;

  // IMPORTANT: en cross-origin, si withCredentials=true le navigateur enverra les cookies
  // (et donc peut déclencher 431 si les cookies sont trop gros). On coupe donc les cookies.
  api.defaults.withCredentials = false;

  if (reason) {
    log.warn(`[Auth] Cookie auth désactivée: ${reason}`);
  } else {
    log.warn('[Auth] Cookie auth désactivée');
  }
};

/**
 * Récupère le cookie XSRF-TOKEN et initialise la session CSRF
 * Doit être appelé AVANT le login
 */
export const initializeCsrf = async (): Promise<void> => {
  // Si on a déjà basculé en mode Bearer, ne pas tenter le CSRF cookie.
  if (!useCookieAuth) return;

  // Éviter les appels multiples simultanés
  if (csrfInitializing) {
    return csrfInitializing;
  }

  // Si déjà initialisé, ne rien faire
  if (csrfInitialized) {
    return;
  }

  csrfInitializing = (async () => {
    try {
      // Appel à /sanctum/csrf-cookie pour obtenir le cookie XSRF-TOKEN
      // On essaie d'abord sans /public (proxy htaccess), puis avec /public si échec
      const csrfUrlPrimary = BACKEND_BASE_URL.replace(/\/public\/?$/, '') + '/sanctum/csrf-cookie';
      const csrfUrlFallback = `${BACKEND_BASE_URL}/sanctum/csrf-cookie`;

      log.info('[Auth] Initialisation CSRF (primary):', csrfUrlPrimary);

      try {
        await axios.get(csrfUrlPrimary, { withCredentials: true });
      } catch (primaryErr) {
        log.warn('[Auth] CSRF primary failed, trying fallback:', csrfUrlFallback);
        await axios.get(csrfUrlFallback, { withCredentials: true });
      }

      csrfInitialized = true;
      log.info('[Auth] CSRF cookie initialisé avec succès');
    } catch (error) {
      log.error('[Auth] Erreur lors de l\'initialisation CSRF:', error);
      // En cas d'échec, on bascule sur Bearer token
      disableCookieAuth('échec /sanctum/csrf-cookie');
      throw error;
    } finally {
      csrfInitializing = null;
    }
  })();

  return csrfInitializing;
};

/**
 * Réinitialise l'état CSRF (après logout par exemple)
 */
export const resetCsrf = (): void => {
  csrfInitialized = false;
  csrfInitializing = null;
};

/**
 * Vérifie si l'auth par cookies est active
 */
export const isCookieAuthEnabled = (): boolean => useCookieAuth;

// ============================================
// Request Interceptor
// ============================================

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // TOUJOURS ajouter le Bearer token si disponible (fonctionne avec session OU token)
    // Le backend Sanctum accepte les deux méthodes
    const token = getAuthToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // Le header X-XSRF-TOKEN est automatiquement ajouté par le navigateur
    // grâce au cookie XSRF-TOKEN défini par Sanctum

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ============================================
// Response Interceptor
// ============================================

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Gestion 431 (headers trop gros) — généralement cookies trop volumineux/dupliqués.
    // On bascule automatiquement en Bearer token pour éviter d'envoyer les cookies.
    if (error.response?.status === 431) {
      disableCookieAuth('431 Request Header Fields Too Large');
    }

    // Diagnostics (uniquement en développement)
    if (!IS_PRODUCTION) {
      try {
        const status = error?.response?.status;
        const url: string | undefined = error?.config?.url;
        const baseURL: string | undefined = error?.config?.baseURL;
        const data = error?.response?.data;

        if (typeof status === "number" && status >= 500) {
          log.error("[API] Erreur serveur", { status, baseURL, url, data });
        } else if (!status) {
          log.error("[API] Erreur réseau / CORS", {
            baseURL,
            url,
            message: error?.message,
          });
        }

        if (
          status === 404 &&
          typeof url === "string" &&
          url.includes("/annulations/") &&
          (url.includes("/rembourser") || url.includes("/generer-avoir") || url.includes("/utiliser-avoir"))
        ) {
          log.warn("[API] Route annulations introuvable (404). Le backend n'est probablement pas déployé/à jour.", {
            baseURL,
            url,
          });
        }
      } catch {
        // ignore
      }
    }

    // Gestion de l'erreur 401 (non authentifié)
    // NOTE: Ne pas rediriger automatiquement ici car cela crée des boucles.
    // La redirection est gérée par ProtectedRoute et le contexte Auth.
    if (error.response?.status === 401) {
      // Reset CSRF state
      resetCsrf();
      
      // Ne supprimer le token que si on est en mode Bearer (pas cookie auth)
      // Évite de casser l'auth pendant l'initialisation CSRF
      if (!isCookieAuthEnabled()) {
        removeAuthToken();
      }
      // Laisser l'erreur remonter - le composant appelant gère la redirection
    }

    // Gestion de l'erreur 419 (CSRF token mismatch)
    if (error.response?.status === 419) {
      log.warn("[API] CSRF token expiré, réinitialisation...");
      resetCsrf();
      // Ne pas rediriger, le prochain appel ré-initialisera le CSRF
    }

    return Promise.reject(error);
  },
);

export default api;
