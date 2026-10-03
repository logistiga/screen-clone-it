export type McpErrorCode =
  | "AUTHENTICATION_FAILED"
  | "RESOURCE_NOT_ALLOWED"
  | "INVALID_FILTER"
  | "INVALID_ARGUMENT"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "UPSTREAM_TIMEOUT"
  | "READ_ONLY"
  | "LOGISTIGA_API_ERROR";

export class LogistigaError extends Error {
  constructor(public readonly code: McpErrorCode, message: string, public readonly upstreamStatus?: number) {
    super(message);
  }
}

/** Convertit un code d'erreur Laravel (/api/gpt) en code MCP stable. */
export function mapUpstreamCode(code: string | undefined, status: number): McpErrorCode {
  switch (code) {
    case "UNAUTHENTICATED": return "AUTHENTICATION_FAILED";
    case "INVALID_RESOURCE": return "RESOURCE_NOT_ALLOWED";
    case "INVALID_FIELD":
    case "INVALID_FILTER":
    case "INVALID_RELATION":
    case "INVALID_AGGREGATION":
    case "INVALID_PERIOD": return "INVALID_FILTER";
    case "INVALID_QUERY": return "INVALID_ARGUMENT";
    case "NOT_FOUND": return "NOT_FOUND";
    case "RATE_LIMITED": return "RATE_LIMITED";
    case "READ_ONLY": return "READ_ONLY";
  }
  if (status === 401 || status === 403) return "AUTHENTICATION_FAILED";
  if (status === 404) return "NOT_FOUND";
  if (status === 429) return "RATE_LIMITED";
  return "LOGISTIGA_API_ERROR";
}
