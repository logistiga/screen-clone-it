import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { ManagedKeyAuthenticator } from "../src/managed-keys.js";

const req = (auth: string) => ({ params: {}, get: (h: string) => (h === "authorization" ? auth : undefined) }) as unknown as Request;

describe("clés MCP créées dans l'application", () => {
  it("accepte une clé valide et met en cache la vérification", async () => {
    let calls = 0;
    const a = new ManagedKeyAuthenticator(async (k) => { calls++; return k === "lgmcp_ok" ? "key-1" : null; });
    expect(await a.authenticate(req("Bearer lgmcp_ok"))).toEqual({ id: "key-1", method: "bearer" });
    await a.authenticate(req("Bearer lgmcp_ok"));
    expect(calls).toBe(1);
  });
  it("refuse une clé révoquée ou inconnue", async () => {
    const a = new ManagedKeyAuthenticator(async () => null);
    expect(await a.authenticate(req("Bearer lgmcp_revoquee"))).toBeNull();
  });
  it("ne contacte pas LOGISTIGA pour une clé sans préfixe lgmcp_", async () => {
    let calls = 0;
    const a = new ManagedKeyAuthenticator(async () => { calls++; return "x"; });
    expect(await a.authenticate(req("Bearer autre-cle-0123456789"))).toBeNull();
    expect(calls).toBe(0);
  });
  it("refuse si LOGISTIGA est injoignable", async () => {
    const a = new ManagedKeyAuthenticator(async () => { throw new Error("down"); });
    expect(await a.authenticate(req("Bearer lgmcp_ok"))).toBeNull();
  });
});
