import api from './api';

// ============================================
// TYPES
// ============================================

export interface LockoutInfo {
  id: number;
  email: string;
  failed_attempts: number;
  locked_until: string;
  remaining_formatted: string;
  last_failed_attempt: string | null;
}

export interface LoginAttempt {
  id: number;
  email: string;
  ip_address: string;
  user_agent: string | null;
  successful: boolean;
  attempted_at: string;
}

export interface AttemptStats {
  recent_attempts: number;
  recent_failures: number;
  recent_successes: number;
  total_failed_attempts: number;
  is_locked: boolean;
  locked_until: string | null;
  window_minutes: number;
}

export interface LockoutStats {
  currently_locked: number;
  today: {
    total_attempts: number;
    failed_attempts: number;
    success_rate: number;
  };
  this_week: {
    total_attempts: number;
    failed_attempts: number;
    success_rate: number;
  };
  top_failed_ips: Array<{ ip_address: string; count: number }>;
  top_failed_emails: Array<{ email: string; count: number }>;
}

// ============================================
// API CLIENT - ADMIN
// ============================================

/**
 * Récupérer la liste des comptes verrouillés (Admin)
 */
export const getLockedAccounts = async (): Promise<{ lockouts: LockoutInfo[]; total: number }> => {
  const response = await api.get('/lockouts');
  return response.data;
};

/**
 * Récupérer les statistiques de verrouillage (Admin)
 */
export const getLockoutStats = async (): Promise<LockoutStats> => {
  const response = await api.get('/lockouts/stats');
  return response.data;
};

/**
 * Récupérer l'historique des tentatives pour un email (Admin)
 */
export const getLoginAttempts = async (
  email: string,
  limit: number = 50
): Promise<{ attempts: LoginAttempt[]; stats: AttemptStats }> => {
  const response = await api.post('/lockouts/attempts', { email, limit });
  return response.data;
};

/**
 * Débloquer un compte manuellement (Admin)
 */
export const unlockAccount = async (email: string): Promise<{ message: string }> => {
  const response = await api.post('/lockouts/unlock', { email });
  return response.data;
};

/**
 * Nettoyer les anciennes données (Admin)
 */
export const cleanupLockoutData = async (
  days: number = 30
): Promise<{ message: string; deleted_attempts: number }> => {
  const response = await api.post('/lockouts/cleanup', { days });
  return response.data;
};

// ============================================
// API CLIENT - PUBLIC (self-service)
// ============================================

/**
 * Vérifier le statut de verrouillage d'un compte
 */
export const checkLockoutStatus = async (
  email: string
): Promise<{ locked: boolean; remaining_seconds?: number; remaining_formatted?: string }> => {
  const response = await api.post('/auth/lockout-status', { email });
  return response.data;
};

/**
 * Demander un email de déblocage
 */
export const requestUnlockEmail = async (email: string): Promise<{ message: string }> => {
  const response = await api.post('/auth/request-unlock', { email });
  return response.data;
};

/**
 * Débloquer un compte avec un token
 */
export const unlockWithToken = async (
  email: string,
  token: string
): Promise<{ message: string }> => {
  const response = await api.post('/auth/unlock-account', { email, token });
  return response.data;
};
