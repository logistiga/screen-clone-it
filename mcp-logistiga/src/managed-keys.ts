import { createHash } from "node:crypto";
import type { Request } from "express";
import { extractKey, type Authenticator, type Caller } from "./auth.js";
import { log } from "./logger.js";

/** Vérifie une clé auprès de LOGISTIGA ; renvoie un identifiant non sensible ou null. */
export type KeyVerifier = (key: string) => Promise<string | null>;

const PREFIX = "lgmcp_";
const digest = (s: string) => createHash("sha256").update(s).digest("hex");

/**
 * Clés créées dans l'application (Assistant IA → Clés MCP), vérifiées par Laravel.
 * Cache court : une révocation prend effet en moins d'une minute.
 */
export class ManagedKeyAuthenticator implements Authenticator {
  private readonly cache = new Map<string, { id: string | null; until: number }>();

  constructor(private readonly verify: KeyVerifier, private readonly ttlMs = 60_000) {}

  async authenticate(req: Request): Promise<Caller | null> {
    const { key, method } = extractKey(req);
    if (!key.startsWith(PREFIX) || key.length > 256) return null;
    const h = digest(key);
    const now = Date.now();
    const hit = this.cache.get(h);
    if (hit && hit.until > now) return hit.id ? { id: hit.id, method } : null;
    let id: string | null = null;
    try {
      id = await this.verify(key);
    } catch {
      log("warn", "managed_key_verify_failed");
      return null; // pas de mise en cache d'une panne
    }
    if (this.cache.size > 1000) this.cache.clear();
    this.cache.set(h, { id, until: now + (id ? this.ttlMs : this.ttlMs / 2) });
    return id ? { id, method } : null;
  }
}

/** Essaie chaque mécanisme dans l'ordre (clés du .env puis clés de l'application). */
export class ChainAuthenticator implements Authenticator {
  constructor(private readonly chain: Authenticator[]) {}

  async authenticate(req: Request): Promise<Caller | null> {
    for (const a of this.chain) {
      const c = await a.authenticate(req);
      if (c) return c;
    }
    return null;
  }
}
