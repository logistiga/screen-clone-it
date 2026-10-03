/** Logs JSON structurés. Ne reçoit jamais de secrets : les valeurs sensibles sont masquées par sécurité. */
type Level = "debug" | "info" | "warn" | "error";
const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const SENSITIVE = /(authorization|x-api-key|token|password|secret)/i;

let current: Level = "info";
let secrets: string[] = [];
let sink: (line: string) => void = (line) => process.stdout.write(line + "\n");

export function configureLogger(level: Level, knownSecrets: string[], out?: (line: string) => void): void {
  current = level;
  secrets = knownSecrets.filter((s) => s.length >= 8);
  if (out) sink = out;
}

export function redact(text: string): string {
  let out = text;
  for (const s of secrets) out = out.split(s).join("[REDACTED]");
  return out.replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, "Bearer [REDACTED]");
}

function clean(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = SENSITIVE.test(k) ? "[REDACTED]" : typeof v === "string" ? redact(v) : v;
  }
  return out;
}

export function log(level: Level, event: string, fields: Record<string, unknown> = {}): void {
  if (ORDER[level] < ORDER[current]) return;
  sink(JSON.stringify({ ts: new Date().toISOString(), level, event, ...clean(fields) }));
}
