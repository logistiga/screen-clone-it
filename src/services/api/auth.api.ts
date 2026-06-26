import api from '@/lib/api';

// Re-export des helpers de session (manipulation locale, pas HTTP)
export {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  initializeCsrf,
  resetCsrf,
  isCookieAuthEnabled,
} from '@/lib/api';

export interface AuthUserPayload {
  id: number;
  nom: string;
  email: string;
  telephone?: string;
  role: string;
  actif: boolean;
  roles?: Array<{ name: string }> | string[];
  permissions?: Array<{ name: string }> | string[];
}

export interface LoginPayload {
  token?: string;
  access_token?: string;
  plainTextToken?: string;
  plain_text_token?: string;
  data?: { token?: string; access_token?: string };
  security?: {
    suspicious?: boolean;
    reasons?: string[];
    location?: string;
  };
  suspicious_login_id?: number;
}

export async function fetchCurrentUser(): Promise<AuthUserPayload> {
  const response = await api.get('/auth/user');
  return response.data as AuthUserPayload;
}

export async function loginRequest(email: string, password: string) {
  const response = await api.post('/auth/login', { email, password });
  return response.data as LoginPayload;
}

export async function logoutRequest(): Promise<void> {
  await api.post('/auth/logout');
}

export async function refreshTokenRequest(): Promise<{ token?: string }> {
  const response = await api.post('/auth/refresh');
  return response.data as { token?: string };
}
