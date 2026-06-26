import api from '@/lib/api';

export interface OpsHealthResponse {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

export async function checkOpsHealth(): Promise<OpsHealthResponse> {
  const response = await api.get('/sync-diagnostic/health-ops');
  return response.data as OpsHealthResponse;
}
