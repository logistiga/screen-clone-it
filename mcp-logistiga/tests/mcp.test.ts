import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { configureLogger } from "../src/logger.js";
import { LogistigaApiClient } from "../src/services/logistiga-api.js";
import { ACCESS_KEY, UPSTREAM_TOKEN, callTool, rpc, startMcp, startMockLaravel } from "./helpers.js";

const logs: string[] = [];
configureLogger("debug", [UPSTREAM_TOKEN, ACCESS_KEY], (l) => logs.push(l));

let laravel: Awaited<ReturnType<typeof startMockLaravel>>;
let mcp: Awaited<ReturnType<typeof startMcp>>;

beforeAll(async () => {
  laravel = await startMockLaravel();
  mcp = await startMcp(laravel.url);
});
afterAll(() => { mcp.close(); laravel.close(); });

const EXPECTED = ["logistiga_get_schema", "logistiga_search", "logistiga_query", "logistiga_list_resource",
  "logistiga_client_summary", "logistiga_unpaid_invoices", "logistiga_revenue"];

describe("démarrage et découverte", () => {
  it("1. démarre et répond au health check", async () => {
    const r = await fetch(mcp.base + "/health");
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ status: "ok", service: "mcp-logistiga", version: "1.0.0" });
  });
  it("initialize fonctionne", async () => {
    const r = await rpc(mcp.base, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } });
    expect(r.json.result.serverInfo.name).toBe("logistiga");
  });
  it("2. liste exactement les 7 outils, tous en lecture seule", async () => {
    const r = await rpc(mcp.base, "tools/list");
    const tools = r.json.result.tools;
    expect(tools.map((t: { name: string }) => t.name).sort()).toEqual([...EXPECTED].sort());
    for (const t of tools) expect(t.annotations.readOnlyHint).toBe(true);
  });
  it("20. chaque outil a un JSON Schema objet et une description précise", async () => {
    const tools = (await rpc(mcp.base, "tools/list")).json.result.tools;
    for (const t of tools) {
      expect(t.inputSchema.type).toBe("object");
      expect(t.description.length).toBeGreaterThan(80);
    }
    const q = tools.find((t: { name: string }) => t.name === "logistiga_query");
    expect(q.inputSchema.required).toContain("resource");
  });
});

describe("les 7 outils appellent Laravel", () => {
  it("3. get_schema", async () => {
    const r = await callTool(mcp.base, "logistiga_get_schema", {});
    expect(r.payload.data.resources).toBeDefined();
    expect(laravel.calls.at(-1)?.url).toBe("/api/gpt/schema");
    expect(laravel.calls.at(-1)?.auth).toBe(`Bearer ${UPSTREAM_TOKEN}`);
  });
  it("4. search", async () => {
    const r = await callTool(mcp.base, "logistiga_search", { q: "FAC-2026-0919", resources: ["factures"] });
    expect(r.payload.data[0].items[0].numero).toBe("FAC-2026-0919");
    expect(laravel.calls.at(-1)?.url).toContain("resources=factures");
  });
  it("5. query", async () => {
    const r = await callTool(mcp.base, "logistiga_query", { resource: "devis", group_by: ["statut"], aggregations: [{ fn: "count" }] });
    expect(r.payload.meta.resource).toBe("devis");
    expect(laravel.calls.at(-1)?.method).toBe("POST");
  });
  it("6. list_resource", async () => {
    const r = await callTool(mcp.base, "logistiga_list_resource", { resource: "clients", limit: 5 });
    expect(r.payload.meta.total).toBe(1);
    expect(laravel.calls.at(-1)?.url).toBe("/api/gpt/resources/clients?limit=5");
  });
  it("7. client_summary", async () => {
    const r = await callTool(mcp.base, "logistiga_client_summary", { client_id: 1 });
    expect(r.payload.data.client.nom).toBe("OLAM");
  });
  it("8. unpaid_invoices", async () => {
    const r = await callTool(mcp.base, "logistiga_unpaid_invoices", { client_id: 3 });
    expect(r.payload.meta.reste_a_payer_total).toBe(481576697);
  });
  it("9. revenue", async () => {
    const r = await callTool(mcp.base, "logistiga_revenue", { date_from: "2026-01-01", date_to: "2026-10-03" });
    expect(r.payload.data[0].sum_montant_ttc).toBe(84334358);
  });
});
