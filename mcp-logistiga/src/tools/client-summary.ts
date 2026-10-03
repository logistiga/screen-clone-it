import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { READ_ONLY_ANNOTATIONS, runTool, type ToolDeps } from "./common.js";

export function registerClientSummary(server: McpServer, { api }: ToolDeps): void {
  server.registerTool("logistiga_client_summary", {
    title: "Situation d'un client",
    description:
      "Vue consolidée d'un client LOGISTIGA par son identifiant numérique : coordonnées, solde, nombre de factures, " +
      "total facturé TTC, total payé, nombre de factures impayées, reste à payer, dernière facture et total des paiements. " +
      "Si seul le nom est connu (ex. OLAM), appeler d'abord logistiga_search avec resources=['clients'] pour obtenir l'id.",
    inputSchema: {
      client_id: z.number().int().positive().max(2_147_483_647).describe("Identifiant numérique du client."),
    },
    annotations: READ_ONLY_ANNOTATIONS,
  }, ({ client_id }) => runTool("logistiga_client_summary", () =>
    api.get(`/clients/${client_id}/summary`, {}, "logistiga_client_summary")));
}
