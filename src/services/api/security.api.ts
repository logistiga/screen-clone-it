import api from '@/lib/api';

export type SuspiciousLoginAction = 'approve' | 'block';

export interface SuspiciousLoginActionResponse {
  success: boolean;
  message?: string;
  status?: string;
}

export async function processSuspiciousLoginAction(
  token: string,
  action: SuspiciousLoginAction,
): Promise<SuspiciousLoginActionResponse> {
  const response = await api.get(`/security/suspicious-login/${token}/${action}`);
  return response.data as SuspiciousLoginActionResponse;
}

export async function fetchSuspiciousLoginStatus(
  loginId: number | string,
): Promise<{ status?: 'pending' | 'approved' | 'blocked' } & Record<string, unknown>> {
  const response = await api.get(`/security/suspicious-login/${loginId}/status`);
  return response.data;
}
