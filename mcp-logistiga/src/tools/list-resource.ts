import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  READ_ONLY_ANNOTATIONS, isoDate, limitSchema, pageSchema, resourceSchema, runTool, type ToolDeps,
} from "./common.js";

export function registerListResource(server: McpServer, { api }: ToolDeps): void {
  server.registerTool("logistiga_list_resource", {
    title: "Lister une ressource LOGISTIGA",
    description:
      "Liste paginée simple d'une ressource LOGISTIGA, filtrable par période sur son champ date principal " +
      "(date_creation pour les documents, date pour paiements/caisse). Pour des filtres plus fins ou des totaux, " +
      "utiliser logistiga_query.",
    inputSchema: {
      resource: resourceSchema,
      date_from: isoDate.optional().describe("Date de début incluse (AAAA-MM-JJ)."),
      date_to: isoDate.optional().describe("Date de fin incluse (AAAA-MM-JJ)."),
      sort: z.string().regex(/^-?[a-z][a-z0-9_]{0,63}$/).optional().describe("Tri, ex. '-date_creation'."),
      limit: limitSchema,
      page: pageSchema,
    },
    annotations: READ_ONLY_ANNOTATIONS,
  }, ({ resource, date_from, date_to, sort, limit, page }) => runTool("logistiga_list_resource", () =>
    api.get(`/resources/${resource}`, { date_from, date_to, sort, limit, page }, "logistiga_list_resource")));
}
