import api from '@/lib/api';

export type McpKeyStatut = 'active' | 'revoquee' | 'expiree';

export interface McpKey {
  id: number;
  name: string;
  description: string | null;
  key_prefix: string;
  statut: McpKeyStatut;
  created_at: string | null;
  expires_at: string | null;
  last_used_at: string | null;
  revoked_at: string | null;
}

export interface McpKeysMeta {
  server_url: string;
  health_url: string;
  chatgpt_url_template: string;
}

export interface CreateMcpKeyInput {
  name: string;
  description?: string;
  expires_in_days?: 30 | 90 | 180 | 365;
}

export async function fetchMcpKeys(): Promise<{ data: McpKey[]; meta: McpKeysMeta }> {
  const res = await api.get('/ai/mcp-keys');
  return res.data;
}

export async function createMcpKey(input: CreateMcpKeyInput): Promise<{ data: McpKey; plain_key: string; meta: McpKeysMeta }> {
  const res = await api.post('/ai/mcp-keys', input);
  return res.data;
}

export async function revokeMcpKey(id: number): Promise<{ data: McpKey }> {
  const res = await api.post(`/ai/mcp-keys/${id}/revoke`);
  return res.data;
}
