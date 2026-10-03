import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { READ_ONLY_ANNOTATIONS, limitSchema, pageSchema, runTool, type ToolDeps } from "./common.js";

export function registerUnpaidInvoices(server: McpServer, { api }: ToolDeps): void {
  server.registerTool("logistiga_unpaid_invoices", {
    title: "Factures impayées",
    description:
      "Factures non soldées (montant payé < montant TTC, hors annulées), triées par échéance, avec le client. " +
      "meta.total = nombre de factures impayées, meta.reste_a_payer_total = total restant dû en FCFA calculé par le serveur " +
      "(à utiliser pour « combien nous doit-on »). Filtre possible par client_id uniquement.",
    inputSchema: {
      client_id: z.number().int().positive().optional().describe("Limiter à un client (id via logistiga_search)."),
      limit: limitSchema,
      page: pageSchema,
    },
    annotations: READ_ONLY_ANNOTATIONS,
  }, ({ client_id, limit, page }) => runTool("logistiga_unpaid_invoices", () =>
    api.get("/factures/impayees", { client_id, limit, page }, "logistiga_unpaid_invoices")));
}
