import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Charge un fichier .env simple (KEY=VALUE) sans écraser l'environnement existant. */
function loadDotEnv(): void {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const file = resolve(root, ".env");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    const value = m[2].replace(/^["']|["']$/g, "");
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}

export interface AppConfig {
  apiBaseUrl: string;
  apiToken: string;
  apiTimeoutMs: number;
  port: number;
  publicUrl: string;
  basePath: string;
  accessTokens: string[];
  rateLimitPerMinute: number;
  logLevel: "debug" | "info" | "warn" | "error";
  production: boolean;
}

const list = (v: string | undefined): string[] =>
  (v ?? "").split(",").map((s) => s.trim()).filter((s) => s.length >= 16);

export function loadConfig(env: NodeJS.ProcessEnv = process.env, useDotEnv = true): AppConfig {
  if (useDotEnv) loadDotEnv();
  const production = (env.NODE_ENV ?? "production") === "production";
  const apiBaseUrl = (env.LOGISTIGA_API_BASE_URL ?? "https://facturation.logistiga.pro/backend/public/api/gpt").replace(/\/+$/, "");
  const parsed = new URL(apiBaseUrl);
  if (production && parsed.protocol !== "https:") {
    throw new Error("LOGISTIGA_API_BASE_URL doit être en HTTPS en production.");
  }
  const basePath = ("/" + (env.MCP_BASE_PATH ?? "").replace(/^\/+|\/+$/g, "")).replace(/^\/$/, "");
  const level = (env.LOG_LEVEL ?? "info") as AppConfig["logLevel"];
  return {
    apiBaseUrl,
    apiToken: env.LOGISTIGA_API_TOKEN ?? "",
    apiTimeoutMs: Math.min(Math.max(Number(env.LOGISTIGA_API_TIMEOUT_MS ?? 15000), 1000), 60000),
    port: Number(env.PORT ?? env.MCP_PORT ?? 3333),
    publicUrl: env.MCP_PUBLIC_URL ?? "",
    basePath,
    accessTokens: list(env.MCP_ACCESS_TOKENS),
    rateLimitPerMinute: Math.max(1, Number(env.MCP_RATE_LIMIT ?? 50)),
    logLevel: ["debug", "info", "warn", "error"].includes(level) ? level : "info",
    production,
  };
}
