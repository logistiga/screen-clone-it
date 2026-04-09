import { create } from 'zustand';

export type NotificationType =
  | 'conteneur.synced'
  | 'facture.created'
  | 'caisse.mouvement'
  | 'anomalie.detectee'
  | 'armateur.synced'
  | 'sync.error';

export interface RealtimeNotification {
  id: string;
  type: NotificationType;
  message: string;
  data?: Record<string, any>;
  timestamp: Date;
  read: boolean;
}

interface NotificationStore {
  notifications: RealtimeNotification[];
  addNotification: (type: NotificationType, message: string, data?: Record<string, any>) => void;
  markAllRead: () => void;
  clearAll: () => void;
  unreadCount: () => number;
}

const MAX_NOTIFICATIONS = 100;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  addNotification: (type, message, data) => {
    const notif: RealtimeNotification = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      message,
      data,
      timestamp: new Date(),
      read: false,
    };
    set(state => ({
      notifications: [notif, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
    }));
  },

  markAllRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
    }));
  },

  clearAll: () => set({ notifications: [] }),

  unreadCount: () => get().notifications.filter(n => !n.read).length,
}));
