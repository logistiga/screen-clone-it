import type { AppConfig } from "../config.js";
import { LogistigaError, mapUpstreamCode } from "../errors.js";
import { log } from "../logger.js";

/** Chemins Laravel autorisés (aucune URL ne vient des arguments des outils). */
const ALLOWED_PATHS: RegExp[] = [
  /^\/schema$/, /^\/search$/, /^\/query$/, /^\/resources\/[a-z_]+$/,
  /^\/clients\/\d+\/summary$/, /^\/factures\/impayees$/, /^\/stats\/chiffre-affaires$/,
];
const MAX_BODY_BYTES = 2_000_000;

export interface ApiResult {
  success: true;
  data: unknown;
  meta: Record<string, unknown>;
}

type Query = Record<string, string | number | undefined>;

export class LogistigaApiClient {
  constructor(private readonly cfg: Pick<AppConfig, "apiBaseUrl" | "apiToken" | "apiTimeoutMs">,
              private readonly fetchImpl: typeof fetch = fetch) {}

  get(path: string, query: Query = {}, tool = "unknown"): Promise<ApiResult> {
    return this.request("GET", path, query, undefined, tool);
  }

  /** Seul POST autorisé : /query, qui est une lecture structurée côté Laravel. */
  postQuery(body: Record<string, unknown>, tool = "logistiga_query"): Promise<ApiResult> {
    return this.request("POST", "/query", {}, body, tool);
  }

  private buildUrl(path: string, query: Query): URL {
    if (!ALLOWED_PATHS.some((re) => re.test(path))) {
      throw new LogistigaError("RESOURCE_NOT_ALLOWED", "Chemin non autorisé.");
    }
    const base = new URL(this.cfg.apiBaseUrl);
    const url = new URL(base.toString() + path);
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) {
      throw new LogistigaError("RESOURCE_NOT_ALLOWED", "Destination non autorisée.");
    }
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    }
    return url;
  }

  private async request(method: "GET" | "POST", path: string, query: Query,
                        body: Record<string, unknown> | undefined, tool: string): Promise<ApiResult> {
    if (!this.cfg.apiToken) {
      throw new LogistigaError("AUTHENTICATION_FAILED", "Accès LOGISTIGA non configuré sur le serveur MCP.");
    }
    const url = this.buildUrl(path, query);
    const attempts = method === "GET" ? 2 : 1;
    let lastError: LogistigaError | undefined;

    for (let i = 0; i < attempts; i++) {
      const start = Date.now();
      try {
        const res = await this.fetchImpl(url, {
          method,
          redirect: "error",
          signal: AbortSignal.timeout(this.cfg.apiTimeoutMs),
          headers: {
            Authorization: `Bearer ${this.cfg.apiToken}`,
            Accept: "application/json",
            ...(body ? { "Content-Type": "application/json" } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
        });
        const text = await res.text();
        const result = this.parse(res.status, text);
        const count = Array.isArray(result.data) ? result.data.length : 1;
        log("info", "upstream_call", { tool, path, status: res.status, duration_ms: Date.now() - start, results: count });
        return result;
      } catch (err) {
        lastError = this.normalize(err);
        log("warn", "upstream_error", { tool, path, code: lastError.code, status: lastError.upstreamStatus, duration_ms: Date.now() - start });
        const retryable = lastError.code === "UPSTREAM_TIMEOUT" || lastError.upstreamStatus === 502 || lastError.upstreamStatus === 503;
        if (!retryable) break;
      }
    }
    throw lastError ?? new LogistigaError("LOGISTIGA_API_ERROR", "Erreur inconnue.");
  }

  private parse(status: number, text: string): ApiResult {
    if (text.length > MAX_BODY_BYTES) {
      throw new LogistigaError("LOGISTIGA_API_ERROR", "Réponse trop volumineuse, réduisez la limite.", status);
    }
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new LogistigaError(status === 429 ? "RATE_LIMITED" : "LOGISTIGA_API_ERROR",
        `Réponse invalide de LOGISTIGA (HTTP ${status}).`, status);
    }
    const obj = json as { success?: boolean; data?: unknown; meta?: Record<string, unknown>; error?: { code?: string; message?: string } };
    if (status >= 200 && status < 300 && obj.success === true) {
      return { success: true, data: obj.data ?? null, meta: obj.meta ?? {} };
    }
    const code = mapUpstreamCode(obj.error?.code, status);
    const message = typeof obj.error?.message === "string" ? obj.error.message.slice(0, 300) : `Erreur LOGISTIGA (HTTP ${status}).`;
    throw new LogistigaError(code, message, status);
  }

  private normalize(err: unknown): LogistigaError {
    if (err instanceof LogistigaError) return err;
    const name = (err as { name?: string })?.name;
    if (name === "TimeoutError" || name === "AbortError") {
      return new LogistigaError("UPSTREAM_TIMEOUT", "LOGISTIGA n'a pas répondu à temps.");
    }
    return new LogistigaError("LOGISTIGA_API_ERROR", "LOGISTIGA est injoignable pour le moment.");
  }
}
