import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { READ_ONLY_ANNOTATIONS, isoDate, runTool, type ToolDeps } from "./common.js";

export function registerRevenue(server: McpServer, { api }: ToolDeps): void {
  server.registerTool("logistiga_revenue", {
    title: "Chiffre d'affaires",
    description:
      "Chiffre d'affaires facturé (hors factures annulées) par période, calculé par le serveur : nombre de factures, " +
      "total HT, total TTC et total encaissé, en FCFA. Période par défaut : mois en cours. Pour comparer deux mois, " +
      "donner une plage couvrant les deux avec period='month'. Filtre possible par client_id.",
    inputSchema: {
      date_from: isoDate.optional().describe("Début (AAAA-MM-JJ), défaut : 1er du mois en cours."),
      date_to: isoDate.optional().describe("Fin (AAAA-MM-JJ), défaut : aujourd'hui."),
      period: z.enum(["day", "month", "year"]).optional().describe("Découpage (défaut month)."),
      client_id: z.number().int().positive().optional().describe("Limiter à un client."),
    },
    annotations: READ_ONLY_ANNOTATIONS,
  }, ({ date_from, date_to, period, client_id }) => runTool("logistiga_revenue", () =>
    api.get("/stats/chiffre-affaires", { date_from, date_to, period, client_id }, "logistiga_revenue")));
}
