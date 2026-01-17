const DEFAULT_API_URL = "https://facturation.logistiga.com/backend/public/api";

const isTryCloudflareUrl = (url: string): boolean => url.includes("trycloudflare.com");

/**
 * Résout l'URL API de manière robuste.
 *
 * Note: En preview/production, on ignore les anciennes URLs Cloudflare Tunnel
 * qui peuvent expirer et casser l'app (ERR_NAME_NOT_RESOLVED).
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

/** Base backend sans le suffixe /api (utilisé pour /sanctum/csrf-cookie). */
export const getBackendBaseUrl = (): string => {
  return getApiUrl().replace(/\/api\/?$/, "");
};
