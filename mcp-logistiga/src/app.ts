import express, { type Request, type Response, type Router } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { RateLimiter, type Authenticator } from "./auth.js";
import { log } from "./logger.js";
import { createMcpServer } from "./mcp.js";
import type { LogistigaApiClient } from "./services/logistiga-api.js";

export interface AppDeps {
  api: LogistigaApiClient;
  auth: Authenticator;
  rateLimitPerMinute: number;
  basePath: string;
}

const rpcError = (res: Response, status: number, code: number, message: string) =>
  res.status(status).json({ jsonrpc: "2.0", error: { code, message }, id: null });

export function createApp(deps: AppDeps): express.Express {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", true);
  const limiter = new RateLimiter(deps.rateLimitPerMinute);

  const router: Router = express.Router({ mergeParams: true });
  router.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");
    next();
  });

  router.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "mcp-logistiga", version: "1.0.0" });
  });

  const handleMcp = async (req: Request, res: Response) => {
    const caller = deps.auth.authenticate(req);
    if (!caller) {
      log("warn", "mcp_auth_failed", { ip: req.ip });
      return rpcError(res, 401, -32001, "AUTHENTICATION_FAILED");
    }
    if (!limiter.allow(caller.id)) {
      return rpcError(res, 429, -32002, "RATE_LIMITED: trop de requêtes, réessayez dans une minute.");
    }
    if (req.method !== "POST") {
      return rpcError(res, 405, -32000, "Méthode non autorisée (transport Streamable HTTP sans session).");
    }
    const server = createMcpServer(deps.api);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on("close", () => {
      void transport.close();
      void server.close();
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      const method = (req.body as { method?: string } | undefined)?.method;
      log("info", "mcp_request", { caller: caller.id, auth: caller.method, method });
    } catch {
      log("error", "mcp_internal_error", { caller: caller.id });
      if (!res.headersSent) rpcError(res, 500, -32603, "Erreur interne.");
    }
  };

  const json = express.json({ limit: "64kb" });
  router.all("/mcp", json, handleMcp);
  router.all("/k/:key/mcp", json, handleMcp);

  // Corps JSON invalide ou trop gros → erreur propre, sans stack.
  router.use((err: unknown, _req: Request, res: Response, _next: unknown) => {
    const status = (err as { status?: number })?.status ?? 400;
    rpcError(res, status === 413 ? 413 : 400, -32700, status === 413 ? "Requête trop volumineuse." : "JSON invalide.");
  });

  if (deps.basePath) app.use(deps.basePath, router);
  app.use("/", router);
  app.use((_req, res) => res.status(404).json({ error: "not_found" }));
  return app;
}
