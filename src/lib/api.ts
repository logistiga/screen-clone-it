import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getApiUrl } from "@/lib/runtime-config";

// Configuration de l'API - Production: https://facturation.logistiga.com/backend/public/api
const API_URL = getApiUrl();
const IS_PRODUCTION = import.meta.env.PROD;

// Clé de stockage du token
const TOKEN_STORAGE_KEY = 'auth_token';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  // Désactiver les cookies pour l'auth cross-domain (on utilise Bearer token)
  withCredentials: false,
  timeout: 30000,
});

// ============================================
// Token Management
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
// Request Interceptor
// ============================================

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Ajouter le token Bearer à toutes les requêtes si disponible
    const token = getAuthToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

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
    if (error.response?.status === 401) {
      // Supprimer le token invalide
      removeAuthToken();
      
      // Rediriger seulement si on n'est pas déjà sur la page de login
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

// ============================================
// Exports (compatibilité avec l'ancien code)
// ============================================

/**
 * @deprecated Plus nécessaire avec Bearer token
 */
export const initializeCsrf = async (): Promise<void> => {
  // No-op: Plus de CSRF avec Bearer token
};

/**
 * @deprecated Plus nécessaire avec Bearer token
 */
export const resetCsrf = (): void => {
  // No-op: Plus de CSRF avec Bearer token
};

export default api;
