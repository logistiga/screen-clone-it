import api from '@/lib/api';

export interface Session {
  id: number;
  name: string;
  ip_address: string | null;
  device_type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  browser: string;
  platform: string;
  location: string | null;
  last_active_at: string | null;
  created_at: string;
  is_current: boolean;
  is_expired: boolean;
}

export interface SessionStats {
  total_sessions: number;
  max_sessions: number;
  idle_timeout_minutes: number;
  expired_sessions: number;
}

export interface SessionsResponse {
  sessions: Session[];
  stats: SessionStats;
}

/**
 * Récupérer toutes les sessions actives
 */
export const getSessions = async (): Promise<SessionsResponse> => {
  const response = await api.get('/sessions');
  return response.data;
};

/**
 * Récupérer la session actuelle
 */
export const getCurrentSession = async (): Promise<{ session: Session }> => {
  const response = await api.get('/sessions/current');
  return response.data;
};

/**
 * Révoquer une session spécifique
 */
export const revokeSession = async (sessionId: number): Promise<{ message: string }> => {
  const response = await api.delete(`/sessions/${sessionId}`);
  return response.data;
};

/**
 * Révoquer toutes les autres sessions
 */
export const revokeOtherSessions = async (): Promise<{ message: string; revoked_count: number }> => {
  const response = await api.post('/sessions/revoke-others');
  return response.data;
};

/**
 * Révoquer toutes les sessions (déconnexion globale)
 */
export const revokeAllSessions = async (): Promise<{ message: string; revoked_count: number }> => {
  const response = await api.post('/sessions/revoke-all');
  return response.data;
};
