import { createApp } from "./app.js";
import { StaticKeyAuthenticator } from "./auth.js";
import { loadConfig } from "./config.js";
import { configureLogger, log } from "./logger.js";
import { LogistigaApiClient } from "./services/logistiga-api.js";

const cfg = loadConfig();
configureLogger(cfg.logLevel, [cfg.apiToken, ...cfg.accessTokens]);

if (!cfg.apiToken) log("warn", "config_missing", { variable: "LOGISTIGA_API_TOKEN" });
if (cfg.accessTokens.length === 0) log("warn", "config_missing", { variable: "MCP_ACCESS_TOKENS" });

const app = createApp({
  api: new LogistigaApiClient(cfg),
  auth: new StaticKeyAuthenticator(cfg.accessTokens),
  rateLimitPerMinute: cfg.rateLimitPerMinute,
  basePath: cfg.basePath,
});

// Passenger (hébergement) intercepte listen() ; en local le port vient de MCP_PORT.
app.listen(cfg.port, () => {
  log("info", "server_started", { port: cfg.port, base_path: cfg.basePath || "/", upstream: new URL(cfg.apiBaseUrl).host });
});

process.on("unhandledRejection", () => log("error", "unhandled_rejection"));
