import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { READ_ONLY_ANNOTATIONS, runTool, type ToolDeps } from "./common.js";

export function registerGetSchema(server: McpServer, { api }: ToolDeps): void {
  server.registerTool("logistiga_get_schema", {
    title: "Schéma LOGISTIGA",
    description:
      "Retourne les ressources LOGISTIGA disponibles (clients, factures, ordres de travail, devis, paiements, caisse, " +
      "notes de début, conteneurs, annulations, banques, partenaires), leurs champs interrogeables, relations, " +
      "opérateurs de filtre, agrégations et périodes supportés. À appeler en premier avant logistiga_query.",
    inputSchema: {},
    annotations: READ_ONLY_ANNOTATIONS,
  }, () => runTool("logistiga_get_schema", () => api.get("/schema", {}, "logistiga_get_schema")));
}
