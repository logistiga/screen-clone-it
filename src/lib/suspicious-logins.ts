import api from '@/lib/api';

export interface SuspiciousLogin {
  id: number;
  user_id: number;
  user?: {
    id: number;
    nom: string;
    email: string;
  };
  ip_address: string;
  country_code: string | null;
  country_name: string | null;
  city: string | null;
  region: string | null;
  user_agent: string | null;
  reasons: string[];
  status: 'pending' | 'approved' | 'blocked';
  reviewed_by: number | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  token_expires_at: string;
}

export interface SuspiciousLoginStats {
  total: number;
  pending: number;
  approved: number;
  blocked: number;
  last_24h: number;
}

export interface SuspiciousLoginsResponse {
  data: SuspiciousLogin[];
  stats: SuspiciousLoginStats;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/**
 * Récupérer toutes les connexions suspectes (admin)
 */
export const getSuspiciousLogins = async (params?: {
  status?: string;
  page?: number;
  per_page?: number;
}): Promise<SuspiciousLoginsResponse> => {
  const response = await api.get('/suspicious-logins', { params });
  return response.data;
};

/**
 * Récupérer les statistiques des connexions suspectes
 */
export const getSuspiciousLoginStats = async (): Promise<{ stats: SuspiciousLoginStats }> => {
  const response = await api.get('/suspicious-logins/stats');
  return response.data;
};
