import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  READ_ONLY_ANNOTATIONS, fieldName, limitSchema, pageSchema, resourceSchema, runTool, type ToolDeps,
} from "./common.js";

const scalar = z.union([z.string().max(200), z.number(), z.boolean(), z.null()]);

const filterSchema = z.object({
  field: fieldName.describe("Champ à filtrer (voir logistiga_get_schema)."),
  op: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "like", "in", "between", "null", "not_null"])
    .optional().describe("Opérateur (défaut eq). like = contient ; in = liste ; between = [min, max]."),
  value: z.union([scalar, z.array(scalar).max(200)]).optional()
    .describe("Valeur. Liste pour in, [min, max] pour between, absente pour null/not_null."),
}).strict();

export function registerQuery(server: McpServer, { api }: ToolDeps): void {
  server.registerTool("logistiga_query", {
    title: "Requête structurée LOGISTIGA",
    description:
      "Requête structurée en lecture seule sur une ressource LOGISTIGA : filtres, champs, relations, tri, pagination, " +
      "et agrégations calculées par le serveur (count, sum, avg, min, max) avec group_by et période (day, month, year). " +
      "Utiliser les agrégations pour tout total (chiffre d'affaires, nombre de factures, montants par statut) au lieu " +
      "de lister des lignes. Montants en FCFA. N'accepte jamais de SQL. " +
      "Exemple : {resource:'factures', filters:[{field:'client_id',value:12},{field:'date_creation',op:'between',value:['2026-01-01','2026-12-31']}], aggregations:[{fn:'sum',field:'montant_ttc'}], period:'month'}.",
    inputSchema: {
      resource: resourceSchema,
      filters: z.array(filterSchema).max(20).optional().describe("Liste de filtres combinés par ET."),
      fields: z.array(fieldName).max(30).optional().describe("Champs à renvoyer (défaut : tous les champs autorisés)."),
      relations: z.array(z.enum(["client", "ordre", "facture"])).max(3).optional()
        .describe("Relations à inclure si la ressource les expose (voir schéma)."),
      sort: z.array(z.string().regex(/^-?[a-z][a-z0-9_]{0,63}$/)).max(3).optional()
        .describe("Tri, ex. ['-date_creation'] (préfixe - = décroissant)."),
      limit: limitSchema,
      page: pageSchema,
      aggregations: z.array(z.object({
        fn: z.enum(["count", "sum", "avg", "min", "max"]),
        field: fieldName.optional().describe("Champ agrégé (défaut id)."),
      }).strict()).max(10).optional().describe("Agrégations calculées côté serveur."),
      group_by: z.array(fieldName).max(3).optional().describe("Regroupement (avec aggregations)."),
      period: z.enum(["day", "month", "year"]).optional().describe("Regroupement par période sur le champ date de la ressource."),
    },
    annotations: READ_ONLY_ANNOTATIONS,
  }, (args) => runTool("logistiga_query", () => {
    const body: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(args)) if (v !== undefined) body[k] = v;
    return api.postQuery(body, "logistiga_query");
  }));
}
