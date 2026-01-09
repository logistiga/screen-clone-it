export type ApiErrorInfo = {
  message: string;
  /**
   * Indication lisible pour l'utilisateur quand on n'a pas accès à la réponse backend
   * (ex: CORS/serveur indisponible).
   */
  hint?: string;
  /** Vrai si Axios n'a reçu aucune réponse HTTP exploitable (souvent CORS ou panne réseau). */
  isNetworkError?: boolean;
  status?: number;
  code?: string;
  method?: string;
  url?: string;
  baseURL?: string;
  responseData?: unknown;
};

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const safeJsonStringify = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export function extractApiErrorInfo(error: unknown): ApiErrorInfo {
  if (!isObject(error)) {
    return { message: String(error ?? "Erreur inconnue") };
  }

  const anyErr: any = error;
  const response = anyErr?.response;
  const config = anyErr?.config;

  const status: number | undefined = response?.status;
  const code: string | undefined = anyErr?.code;
  const method: string | undefined = (config?.method || response?.config?.method)
    ?.toString?.()
    ?.toUpperCase?.();

  const baseURL: string | undefined = config?.baseURL || response?.config?.baseURL;
  const urlPath: string | undefined = config?.url || response?.config?.url;
  const url = baseURL && urlPath ? `${baseURL.replace(/\/$/, "")}${urlPath}` : urlPath;

  const responseData = response?.data;

  const isNetworkError =
    !response && (anyErr?.message === "Network Error" || anyErr?.code === "ERR_NETWORK");

  const hint = isNetworkError
    ? "Aucune réponse lisible par le navigateur (souvent CORS, certificat, ou serveur indisponible)."
    : undefined;

  // Essayer d'extraire un message utile depuis la réponse backend
  const backendMessage =
    (typeof responseData === "string" ? responseData : responseData?.message || responseData?.error) || undefined;

  const message =
    backendMessage ||
    (isNetworkError
      ? "Erreur réseau — requête bloquée (CORS ?) ou serveur indisponible"
      : anyErr?.message) ||
    "Erreur inconnue";

  return {
    message,
    hint,
    isNetworkError,
    status,
    code,
    method,
    url,
    baseURL,
    responseData,
  };
}

export function formatApiErrorDebug(info: ApiErrorInfo): string {
  const parts: Record<string, unknown> = {
    message: info.message,
    hint: info.hint,
    isNetworkError: info.isNetworkError,
    status: info.status,
    code: info.code,
    method: info.method,
    url: info.url,
    baseURL: info.baseURL,
    responseData: info.responseData,
  };

  return safeJsonStringify(parts);
}
