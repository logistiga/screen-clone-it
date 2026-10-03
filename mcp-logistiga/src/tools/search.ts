import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { READ_ONLY_ANNOTATIONS, resourceSchema, runTool, type ToolDeps } from "./common.js";

export function registerSearch(server: McpServer, { api }: ToolDeps): void {
  server.registerTool("logistiga_search", {
    title: "Recherche LOGISTIGA",
    description:
      "Recherche texte transversale dans LOGISTIGA : numéro de facture (ex. FAC-2026-0919), devis, ordre de travail, " +
      "nom de client (ex. OLAM), numéro de conteneur, BL, navire, référence de paiement. Renvoie jusqu'à 10 résultats " +
      "par ressource, groupés par ressource. Utiliser quand on ne sait pas dans quelle ressource se trouve l'information.",
    inputSchema: {
      q: z.string().trim().min(2).max(100).describe("Texte à rechercher (2 à 100 caractères)."),
      resources: z.array(resourceSchema).max(13).optional()
        .describe("Limiter la recherche à ces ressources (facultatif)."),
    },
    annotations: READ_ONLY_ANNOTATIONS,
  }, ({ q, resources }) => runTool("logistiga_search", () =>
    api.get("/search", { q, resources: resources?.join(",") }, "logistiga_search")));
}
