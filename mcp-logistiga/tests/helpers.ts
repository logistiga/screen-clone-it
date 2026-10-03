import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app.js";
import { StaticKeyAuthenticator } from "../src/auth.js";
import { LogistigaApiClient } from "../src/services/logistiga-api.js";

export const UPSTREAM_TOKEN = "upstream-secret-token-0123456789abcdef";
export const ACCESS_KEY = "mcp-access-key-0123456789abcdef";

export interface Recorded { method: string; url: string; auth?: string; body?: unknown }

/** Faux Laravel /api/gpt : reproduit les réponses documentées. */
export function startMockLaravel(opts: { delayMs?: number; rateLimited?: boolean } = {}) {
  const calls: Recorded[] = [];
  const server: Server = createServer((req: IncomingMessage, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const body = raw ? JSON.parse(raw) : undefined;
      calls.push({ method: req.method ?? "", url: req.url ?? "", auth: req.headers.authorization, body });
      const send = (status: number, json: unknown) => {
        setTimeout(() => {
          res.writeHead(status, { "Content-Type": "application/json" });
          res.end(JSON.stringify(json));
        }, opts.delayMs ?? 0);
      };
      if (req.headers.authorization !== `Bearer ${UPSTREAM_TOKEN}`) {
        return send(401, { success: false, error: { code: "UNAUTHENTICATED", message: "Token invalide." } });
      }
      if (opts.rateLimited) return send(429, { success: false, error: { code: "RATE_LIMITED", message: "Trop de requêtes." } });
      const url = new URL(req.url ?? "/", "http://x");
      const p = url.pathname.replace(/^\/api\/gpt/, "");
      if (p === "/schema") return send(200, { success: true, data: { resources: { clients: {} } }, meta: {} });
      if (p === "/search") return send(200, { success: true, data: [{ resource: "factures", count: 1, items: [{ numero: url.searchParams.get("q") }] }], meta: { q: url.searchParams.get("q") } });
      if (p === "/query") {
        if (body?.resource === "users") return send(404, { success: false, error: { code: "INVALID_RESOURCE", message: "Ressource inconnue." } });
        const bad = (body?.filters ?? []).find((f: { field: string }) => f.field === "password");
        if (bad) return send(422, { success: false, error: { code: "INVALID_FIELD", message: "Champ 'password' non autorisé." } });
        return send(200, { success: true, data: [{ statut: "brouillon", count_id: 16 }], meta: { groups: 1, resource: body?.resource } });
      }
      if (/^\/resources\/[a-z_]+$/.test(p)) return send(200, { success: true, data: [{ id: 1 }], meta: { page: 1, limit: 50, total: 1 } });
      if (/^\/clients\/\d+\/summary$/.test(p)) return send(200, { success: true, data: { client: { id: 1, nom: "OLAM" } }, meta: {} });
      if (p === "/factures/impayees") return send(200, { success: true, data: [], meta: { total: 454, reste_a_payer_total: 481576697 } });
      if (p === "/stats/chiffre-affaires") return send(200, { success: true, data: [{ periode: "2026-01", sum_montant_ttc: 84334358 }], meta: {} });
      return send(404, { success: false, error: { code: "NOT_FOUND", message: "?" } });
    });
  });
  return new Promise<{ url: string; calls: Recorded[]; close: () => void }>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const port = (server.address() as AddressInfo).port;
      resolve({ url: `http://127.0.0.1:${port}/api/gpt`, calls, close: () => server.close() });
    });
  });
}

export function startMcp(upstreamUrl: string, o: { token?: string; timeoutMs?: number; rate?: number } = {}) {
  const api = new LogistigaApiClient({ apiBaseUrl: upstreamUrl, apiToken: o.token ?? UPSTREAM_TOKEN, apiTimeoutMs: o.timeoutMs ?? 2000 });
  const app = createApp({ api, auth: new StaticKeyAuthenticator([ACCESS_KEY]), rateLimitPerMinute: o.rate ?? 1000, basePath: "/mcp-logistiga" });
  return new Promise<{ base: string; close: () => void }>((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => {
      resolve({ base: `http://127.0.0.1:${(s.address() as AddressInfo).port}/mcp-logistiga`, close: () => s.close() });
    });
  });
}

let id = 0;
export async function rpc(base: string, method: string, params: unknown = {}, headers: Record<string, string> = { Authorization: `Bearer ${ACCESS_KEY}` }, path = "/mcp") {
  const res = await fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...headers },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
  });
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : null, text };
}

export async function callTool(base: string, name: string, args: unknown) {
  const r = await rpc(base, "tools/call", { name, arguments: args });
  const result = r.json?.result;
  const raw: string | undefined = result?.content?.[0]?.text;
  let payload: any = null;
  try { payload = raw ? JSON.parse(raw) : null; } catch { payload = { text: raw }; }
  return { ...r, result, payload, isError: Boolean(result?.isError) };
}
