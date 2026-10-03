import { createHash, timingSafeEqual } from "node:crypto";
import type { Request } from "express";

/**
 * Authentification ChatGPT → MCP (indépendante de l'accès MCP → Laravel).
 * Interface unique : remplacer cette implémentation (ex. OAuth) ne change pas les outils.
 *
 * Mécanismes acceptés (même liste de clés MCP_ACCESS_TOKENS) :
 *  1. Header  Authorization: Bearer <clé>  (clients MCP génériques, Claude, scripts)
 *  2. Chemin  /k/<clé>/mcp                 (ChatGPT, dont l'interface ne permet que OAuth ou "aucune")
 */
export interface Caller {
  id: string;
  method: "bearer" | "path";
}

export interface Authenticator {
  authenticate(req: Request): Caller | null;
}

const digest = (s: string) => createHash("sha256").update(s).digest();
const fingerprint = (s: string) => digest(s).toString("hex").slice(0, 12);

export class StaticKeyAuthenticator implements Authenticator {
  private readonly keys: Buffer[];
  private readonly raw: string[];

  constructor(keys: string[]) {
    this.raw = keys;
    this.keys = keys.map(digest);
  }

  private match(candidate: string): string | null {
    if (!candidate || candidate.length > 256) return null;
    const d = digest(candidate);
    for (let i = 0; i < this.keys.length; i++) {
      if (timingSafeEqual(d, this.keys[i])) return fingerprint(this.raw[i]);
    }
    return null;
  }

  authenticate(req: Request): Caller | null {
    const pathKey = typeof req.params?.key === "string" ? req.params.key : "";
    if (pathKey) {
      const id = this.match(pathKey);
      return id ? { id, method: "path" } : null;
    }
    const header = req.get("authorization") ?? "";
    const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
    const id = this.match(bearer);
    return id ? { id, method: "bearer" } : null;
  }
}

/** Limiteur simple en mémoire par appelant (fenêtre glissante d'une minute). */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>();
  constructor(private readonly perMinute: number) {}

  allow(id: string, now = Date.now()): boolean {
    const recent = (this.hits.get(id) ?? []).filter((t) => now - t < 60_000);
    if (recent.length >= this.perMinute) {
      this.hits.set(id, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(id, recent);
    return true;
  }
}
