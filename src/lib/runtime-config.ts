// URLs de production avec /backend/public (point d'entrée Laravel)
const DEFAULT_BACKEND_BASE_URL = "https://facturation.logistiga.pro/backend/public";
const DEFAULT_API_URL = `${DEFAULT_BACKEND_BASE_URL}/api`;

/**
 * Normalise les URLs historiques encore en .com → .pro.
 * Utile si un ancien build / env injecte encore logistiga.com.
 */
const normalizeLogistigaDomain = (url: string): string => {
  // Remplacement ciblé pour éviter des surprises
  return url
    .replace(/facturation\.logistiga\.com/g, "facturation.logistiga.pro")
    .replace(/logistiga\.com/g, "logistiga.pro");
};

const isTryCloudflareUrl = (url: string): boolean => url.includes("trycloudflare.com");

/**
 * Résout l'URL de base du backend (pour Sanctum CSRF).
 * DOIT pointer vers /backend/public où Laravel est accessible.
 */
export const getBackendBaseUrl = (): string => {
  const mode = import.meta.env.MODE;
  const envUrlRaw = (import.meta.env.VITE_BACKEND_BASE_URL as string | undefined)?.trim();

  if (!envUrlRaw) return DEFAULT_BACKEND_BASE_URL;

  const envUrl = normalizeLogistigaDomain(envUrlRaw);

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
  const envUrlRaw = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

  if (!envUrlRaw) return DEFAULT_API_URL;

  const envUrl = normalizeLogistigaDomain(envUrlRaw);

  // Les tunnels Cloudflare sont pratiques en dev, mais souvent expirés en preview/prod.
  if (mode !== "development" && isTryCloudflareUrl(envUrl)) {
    return DEFAULT_API_URL;
  }

  return envUrl;
};
