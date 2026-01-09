export type ApiErrorInfo = {
  message: string;
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
  const method: string | undefined = (config?.method || response?.config?.method)?.toString()?.toUpperCase?.();

  const baseURL: string | undefined = config?.baseURL || response?.config?.baseURL;
  const urlPath: string | undefined = config?.url || response?.config?.url;
  const url = baseURL && urlPath ? `${baseURL.replace(/\/$/, "")}${urlPath}` : urlPath;

  const responseData = response?.data;

  // Essayer d'extraire un message utile depuis la réponse backend
  const backendMessage =
    (typeof responseData === "string" ? responseData : responseData?.message || responseData?.error) || undefined;

  // Quand la requête est bloquée (CORS) ou que le serveur est injoignable, Axios remonte souvent un "Network Error"
  const isNetworkError = !response && (anyErr?.message === "Network Error" || anyErr?.code === "ERR_NETWORK");

  const message =
    backendMessage ||
    (isNetworkError ? "Erreur réseau (CORS ou serveur inaccessible)" : undefined) ||
    anyErr?.message ||
    "Erreur inconnue";

  return {
    message,
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
    status: info.status,
    code: info.code,
    method: info.method,
    url: info.url,
    responseData: info.responseData,
  };

  return safeJsonStringify(parts);
}
