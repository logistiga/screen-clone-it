import { z } from "zod";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { LogistigaError } from "../errors.js";
import { log } from "../logger.js";
import type { ApiResult, LogistigaApiClient } from "../services/logistiga-api.js";

/** Ressources exposées par Laravel (/schema). Toute autre valeur est refusée. */
export const RESOURCES = [
  "clients", "factures", "ordres", "devis", "paiements", "caisse", "notes_debut",
  "conteneurs", "annulations", "banques", "transitaires", "representants", "armateurs",
] as const;

export const resourceSchema = z.enum(RESOURCES).describe(
  "Ressource LOGISTIGA : " + RESOURCES.join(", ") + ". Les champs disponibles sont donnés par logistiga_get_schema.",
);

/** Nom de champ : lettres minuscules, chiffres et _ uniquement (validé ensuite par la liste blanche Laravel). */
export const fieldName = z.string().regex(/^[a-z][a-z0-9_]{0,63}$/, "Nom de champ invalide.");
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date au format AAAA-MM-JJ.");
export const limitSchema = z.number().int().min(1).max(200).optional().describe("Lignes par page (1-200, défaut 50).");
export const pageSchema = z.number().int().min(1).max(10000).optional().describe("Numéro de page (défaut 1).");

export const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export interface ToolDeps {
  api: LogistigaApiClient;
}

const MAX_TEXT = 150_000;

/** Exécute un appel, journalise, et renvoie un résultat MCP propre (jamais de stack ni de secret). */
export async function runTool(tool: string, fn: () => Promise<ApiResult>): Promise<CallToolResult> {
  const start = Date.now();
  try {
    const result = await fn();
    let text = JSON.stringify({ data: result.data, meta: result.meta });
    if (text.length > MAX_TEXT) {
      text = text.slice(0, MAX_TEXT) + '... [tronqué : réduisez "limit" ou utilisez des agrégations]';
    }
    log("info", "tool_call", { tool, ok: true, duration_ms: Date.now() - start, bytes: text.length });
    return { content: [{ type: "text", text }] };
  } catch (err) {
    const e = err instanceof LogistigaError ? err : new LogistigaError("LOGISTIGA_API_ERROR", "Erreur interne du serveur MCP.");
    log("warn", "tool_call", { tool, ok: false, code: e.code, status: e.upstreamStatus, duration_ms: Date.now() - start });
    return { isError: true, content: [{ type: "text", text: JSON.stringify({ error: { code: e.code, message: e.message } }) }] };
  }
}
