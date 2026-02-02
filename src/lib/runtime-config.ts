// URLs de production avec /backend/public (point d'entrée Laravel)
const DEFAULT_BACKEND_BASE_URL = "https://facturation.logistiga.pro/backend/public";
const DEFAULT_API_URL = `${DEFAULT_BACKEND_BASE_URL}/api`;

const isTryCloudflareUrl = (url: string): boolean => url.includes("trycloudflare.com");

/**
 * Résout l'URL de base du backend (pour Sanctum CSRF).
 * DOIT pointer vers /backend/public où Laravel est accessible.
 */
export const getBackendBaseUrl = (): string => {
  const mode = import.meta.env.MODE;
  const envUrl = (import.meta.env.VITE_BACKEND_BASE_URL as string | undefined)?.trim();

  if (!envUrl) return DEFAULT_BACKEND_BASE_URL;

  // Les tunnels Cloudflare sont pratiques en dev, mais souvent expirés en preview/prod.
  if (mode !== "development" && isTryCloudflareUrl(envUrl)) {
    return DEFAULT_BACKEND_BASE_URL;
  }

  return envUrl;
};

/**
 * Résout l'URL API de manière robuste.
 * Basée sur BACKEND_BASE_URL + /api
 */
export const getApiUrl = (): string => {
  const mode = import.meta.env.MODE;
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

  if (!envUrl) return DEFAULT_API_URL;

  // Les tunnels Cloudflare sont pratiques en dev, mais souvent expirés en preview/prod.
  if (mode !== "development" && isTryCloudflareUrl(envUrl)) {
    return DEFAULT_API_URL;
  }

  return envUrl;
};
