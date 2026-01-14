import api from '@/lib/api';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  date: string;
  read: boolean;
  link?: string;
  icon?: 'facture' | 'credit' | 'devis' | 'client' | 'paiement' | 'ordre';
  metadata?: Record<string, any>;
}

export interface NotificationsResponse {
  data: Notification[];
  unread_count: number;
  total: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_type: {
    info: number;
    warning: number;
    success: number;
    error: number;
  };
}

const safeNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeNotification = (raw: any): Notification => ({
  id: String(raw?.id ?? ''),
  type: ['info', 'warning', 'success', 'error'].includes(raw?.type) ? raw.type : 'info',
  title: String(raw?.title ?? raw?.titre ?? ''),
  message: String(raw?.message ?? raw?.contenu ?? ''),
  date: String(raw?.date ?? raw?.created_at ?? new Date().toISOString()),
  read: Boolean(raw?.read ?? raw?.lu ?? false),
  link: raw?.link ?? raw?.lien ?? undefined,
  icon: raw?.icon ?? raw?.icone ?? undefined,
  metadata: raw?.metadata ?? raw?.meta ?? undefined,
});

export const notificationsService = {
  // Récupérer toutes les notifications
  getAll: async (params?: { 
    page?: number; 
    per_page?: number; 
    unread_only?: boolean 
  }): Promise<NotificationsResponse> => {
    try {
      const response = await api.get('/notifications', { params });
      const data = response.data;
      
      return {
        data: Array.isArray(data?.data) 
          ? data.data.map(normalizeNotification)
          : Array.isArray(data) 
            ? data.map(normalizeNotification) 
            : [],
        unread_count: safeNumber(data?.unread_count ?? data?.non_lues),
        total: safeNumber(data?.total ?? data?.data?.length ?? 0),
      };
    } catch (error) {
      // Si l'endpoint n'existe pas, retourner une liste vide
      console.warn('Notifications API not available, using empty list');
      return { data: [], unread_count: 0, total: 0 };
    }
  },

  // Récupérer le nombre de notifications non lues
  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await api.get('/notifications/unread-count');
      return safeNumber(response.data?.count ?? response.data?.unread_count ?? response.data);
    } catch {
      return 0;
    }
  },

  // Marquer une notification comme lue
  markAsRead: async (id: string): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
  },

  // Marquer toutes les notifications comme lues
  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/mark-all-read');
  },

  // Supprimer une notification
  delete: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },

  // Supprimer toutes les notifications
  deleteAll: async (): Promise<void> => {
    await api.delete('/notifications');
  },

  // Récupérer les alertes système (factures en retard, échéances, etc.)
  getAlerts: async (): Promise<Notification[]> => {
    try {
      const response = await api.get('/notifications/alerts');
      const data = response.data;
      return Array.isArray(data?.data) 
        ? data.data.map(normalizeNotification)
        : Array.isArray(data) 
          ? data.map(normalizeNotification) 
          : [];
    } catch {
      return [];
    }
  },

  // Statistiques des notifications
  getStats: async (): Promise<NotificationStats> => {
    try {
      const response = await api.get('/notifications/stats');
      const data = response.data;
      return {
        total: safeNumber(data?.total),
        unread: safeNumber(data?.unread ?? data?.non_lues),
        by_type: {
          info: safeNumber(data?.by_type?.info ?? data?.par_type?.info),
          warning: safeNumber(data?.by_type?.warning ?? data?.par_type?.warning),
          success: safeNumber(data?.by_type?.success ?? data?.par_type?.success),
          error: safeNumber(data?.by_type?.error ?? data?.par_type?.error),
        },
      };
    } catch {
      return { total: 0, unread: 0, by_type: { info: 0, warning: 0, success: 0, error: 0 } };
    }
  },
};
