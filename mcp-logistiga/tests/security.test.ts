import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { configureLogger } from "../src/logger.js";
import { LogistigaApiClient } from "../src/services/logistiga-api.js";
import { ACCESS_KEY, UPSTREAM_TOKEN, callTool, rpc, startMcp, startMockLaravel } from "./helpers.js";

const logs: string[] = [];
configureLogger("debug", [UPSTREAM_TOKEN, ACCESS_KEY], (l) => logs.push(l));

let laravel: Awaited<ReturnType<typeof startMockLaravel>>;
let mcp: Awaited<ReturnType<typeof startMcp>>;
beforeAll(async () => { laravel = await startMockLaravel(); mcp = await startMcp(laravel.url); });
afterAll(() => { mcp.close(); laravel.close(); });

describe("validation et erreurs", () => {
  it("10. mauvais paramètre refusé avant Laravel", async () => {
    const before = laravel.calls.length;
    const r = await callTool(mcp.base, "logistiga_client_summary", { client_id: "abc" });
    expect(r.result?.isError ?? r.json.error).toBeTruthy();
    expect(laravel.calls.length).toBe(before);
  });
  it("11. ressource interdite refusée", async () => {
    const r = await callTool(mcp.base, "logistiga_list_resource", { resource: "users" });
    expect(r.result?.isError ?? r.json.error).toBeTruthy();
  });
  it("champ interdit → INVALID_FILTER", async () => {
    const r = await callTool(mcp.base, "logistiga_query", { resource: "clients", filters: [{ field: "password", value: 1 }] });
    expect(r.isError).toBe(true);
    expect(r.payload.error.code).toBe("INVALID_FILTER");
  });
  it("accès MCP sans clé ou avec mauvaise clé → 401", async () => {
    expect((await rpc(mcp.base, "tools/list", {}, {})).status).toBe(401);
    expect((await rpc(mcp.base, "tools/list", {}, { Authorization: "Bearer mauvaise-cle-xxxxxxxxxx" })).status).toBe(401);
    expect((await rpc(mcp.base, "tools/list", {}, {}, "/k/mauvaise-cle-xxxxxxxx/mcp")).status).toBe(401);
  });
  it("accès par clé dans le chemin (ChatGPT)", async () => {
    const r = await rpc(mcp.base, "tools/list", {}, {}, `/k/${ACCESS_KEY}/mcp`);
    expect(r.json.result.tools).toHaveLength(7);
  });
});

describe("amont Laravel", () => {
  it("12. sans credential amont → AUTHENTICATION_FAILED sans appel", async () => {
    const m = await startMcp(laravel.url, { token: "" });
    const r = await callTool(m.base, "logistiga_get_schema", {});
    expect(r.payload.error.code).toBe("AUTHENTICATION_FAILED");
    m.close();
  });
  it("13. mauvais token amont → AUTHENTICATION_FAILED", async () => {
    const m = await startMcp(laravel.url, { token: "mauvais-token-amont-0000000000" });
    const r = await callTool(m.base, "logistiga_get_schema", {});
    expect(r.payload.error.code).toBe("AUTHENTICATION_FAILED");
    m.close();
  });
  it("14. timeout Laravel → UPSTREAM_TIMEOUT", async () => {
    const slow = await startMockLaravel({ delayMs: 800 });
    const m = await startMcp(slow.url, { timeoutMs: 1000 - 700 });
    const r = await callTool(m.base, "logistiga_get_schema", {});
    expect(r.payload.error.code).toBe("UPSTREAM_TIMEOUT");
    m.close(); slow.close();
  });
  it("15a. rate limit Laravel → RATE_LIMITED", async () => {
    const rl = await startMockLaravel({ rateLimited: true });
    const m = await startMcp(rl.url);
    const r = await callTool(m.base, "logistiga_get_schema", {});
    expect(r.payload.error.code).toBe("RATE_LIMITED");
    m.close(); rl.close();
  });
  it("15b. rate limit MCP → 429", async () => {
    const m = await startMcp(laravel.url, { rate: 2 });
    await rpc(m.base, "tools/list"); await rpc(m.base, "tools/list");
    expect((await rpc(m.base, "tools/list")).status).toBe(429);
    m.close();
  });
});

describe("attaques", () => {
  it("16. injection SQL : refusée par la validation des noms de champ", async () => {
    const before = laravel.calls.length;
    const r = await callTool(mcp.base, "logistiga_query", { resource: "clients", sort: ["nom; DROP TABLE clients"] });
    expect(r.result?.isError ?? r.json.error).toBeTruthy();
    expect(laravel.calls.length).toBe(before);
  });
  it("16b. valeur malveillante transmise comme donnée seulement", async () => {
    const r = await callTool(mcp.base, "logistiga_search", { q: "x' OR '1'='1" });
    expect(r.isError).toBe(false);
    expect(laravel.calls.at(-1)?.url).toContain("q=x%27+OR");
  });
  it("17. SSRF : impossible d'atteindre une autre URL", async () => {
    const before = laravel.calls.length;
    await callTool(mcp.base, "logistiga_list_resource", { resource: "http://evil.example/x" });
    await callTool(mcp.base, "logistiga_search", { q: "abc", url: "http://169.254.169.254/" });
    const api = new LogistigaApiClient({ apiBaseUrl: laravel.url, apiToken: UPSTREAM_TOKEN, apiTimeoutMs: 1000 });
    await expect(api.get("/../../admin")).rejects.toMatchObject({ code: "RESOURCE_NOT_ALLOWED" });
    await expect(api.get("//evil.example/schema")).rejects.toMatchObject({ code: "RESOURCE_NOT_ALLOWED" });
    const evil = laravel.calls.slice(before).filter((c) => c.url.includes("evil") || c.url.includes("169.254"));
    expect(evil).toHaveLength(0);
  });
  it("18. aucune mutation : outil inconnu refusé, pas d'outil d'écriture", async () => {
    const r = await callTool(mcp.base, "create_devis", { client_id: 1 });
    expect(r.result?.isError ?? r.json.error).toBeTruthy();
    const names = (await rpc(mcp.base, "tools/list")).json.result.tools.map((t: { name: string }) => t.name).join(" ");
    expect(names).not.toMatch(/create|update|delete|execute|run|sql|raw|http/);
    expect(laravel.calls.every((c) => c.method === "GET" || (c.method === "POST" && c.url.endsWith("/query")))).toBe(true);
  });
  it("19. aucun secret dans les logs ni les réponses", async () => {
    const m = await startMcp(laravel.url, { token: "mauvais-token-amont-0000000000" });
    const r = await callTool(m.base, "logistiga_get_schema", {});
    m.close();
    const all = logs.join("\n") + r.text;
    expect(all).not.toContain(UPSTREAM_TOKEN);
    expect(all).not.toContain(ACCESS_KEY);
    expect(all).not.toContain("mauvais-token-amont-0000000000");
    expect(all).not.toMatch(/at .*\.ts:\d+/);
  });
});
