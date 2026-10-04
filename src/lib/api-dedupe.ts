import type { AxiosInstance } from "axios";

/**
 * Anti double-soumission : si une requête POST/PUT/PATCH identique
 * (même méthode, URL et contenu) est déjà en cours, on réutilise la même
 * promesse au lieu d'envoyer un second appel au serveur.
 */
export function installMutationDedupe(api: AxiosInstance): void {
  const inFlight = new Map<string, Promise<unknown>>();
  const methods = ["post", "put", "patch"] as const;

  for (const method of methods) {
    const original = api[method].bind(api) as (...args: unknown[]) => Promise<unknown>;
    const wrapped = (url: string, data?: unknown, config?: unknown) => {
      if (data instanceof FormData || data instanceof Blob) {
        return original(url, data, config);
      }
      let body = "";
      try { body = JSON.stringify(data ?? null); } catch { return original(url, data, config); }
      const key = `${method}|${url}|${body}`;
      const existing = inFlight.get(key);
      if (existing) return existing;
      const promise = original(url, data, config).finally(() => inFlight.delete(key));
      inFlight.set(key, promise);
      return promise;
    };
    (api as unknown as Record<string, unknown>)[method] = wrapped;
  }
}
