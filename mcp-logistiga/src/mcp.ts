import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LogistigaApiClient } from "./services/logistiga-api.js";
import { registerClientSummary } from "./tools/client-summary.js";
import { registerGetSchema } from "./tools/get-schema.js";
import { registerListResource } from "./tools/list-resource.js";
import { registerQuery } from "./tools/query.js";
import { registerRevenue } from "./tools/revenue.js";
import { registerSearch } from "./tools/search.js";
import { registerUnpaidInvoices } from "./tools/unpaid-invoices.js";

export const TOOL_NAMES = [
  "logistiga_get_schema", "logistiga_search", "logistiga_query", "logistiga_list_resource",
  "logistiga_client_summary", "logistiga_unpaid_invoices", "logistiga_revenue",
] as const;

export function createMcpServer(api: LogistigaApiClient): McpServer {
  const server = new McpServer(
    { name: "logistiga", title: "LOGISTIGA", version: "1.0.0" },
    {
      instructions:
        "Accès en LECTURE SEULE aux données de LOGISTIGA (facturation logistique, Gabon). Montants en FCFA. " +
        "Commencer par logistiga_get_schema. Pour un nom de client, utiliser logistiga_search pour trouver son id. " +
        "Pour les totaux, utiliser les agrégations (logistiga_query, logistiga_revenue, logistiga_unpaid_invoices) " +
        "plutôt que de lister des lignes. Aucune création, modification, suppression, validation ou paiement n'est " +
        "possible : si l'utilisateur le demande, répondre que cette capacité n'est pas disponible.",
    },
  );
  const deps = { api };
  registerGetSchema(server, deps);
  registerSearch(server, deps);
  registerQuery(server, deps);
  registerListResource(server, deps);
  registerClientSummary(server, deps);
  registerUnpaidInvoices(server, deps);
  registerRevenue(server, deps);
  return server;
}
