import { useState, useEffect, useCallback, useRef } from 'react';
import echo from '@/lib/echo';
import { useAuth } from '@/hooks/use-auth';

export type NotificationType =
  | 'conteneur.synced'
  | 'facture.created'
  | 'caisse.mouvement'
  | 'anomalie.detectee';

export interface RealtimeNotification {
  id: string;
  type: NotificationType;
  message: string;
  data?: Record<string, any>;
  timestamp: Date;
  read: boolean;
}

const CHANNEL_NAME = 'logistiga-cnv';

export function useRealtimeNotifications() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const channelRef = useRef<any>(null);

  const addNotification = useCallback((type: NotificationType, message: string, data?: Record<string, any>) => {
    const notif: RealtimeNotification = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      message,
      data,
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [notif, ...prev].slice(0, 50)); // max 50
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;
    if (!pusherKey) {
      console.warn('[RealtimeNotifications] VITE_PUSHER_APP_KEY non configurée, notifications temps réel désactivées.');
      return;
    }

    try {
      const channel = echo.channel(CHANNEL_NAME);
      channelRef.current = channel;

      channel.listen('.conteneur.synced', (e: any) => {
        const count = e?.count ?? e?.total ?? 0;
        addNotification(
          'conteneur.synced',
          count > 0
            ? `${count} conteneur${count > 1 ? 's' : ''} synchronisé${count > 1 ? 's' : ''} depuis OPS`
            : 'Synchronisation conteneurs terminée',
          e
        );
      });

      channel.listen('.facture.created', (e: any) => {
        const numero = e?.numero ?? '';
        addNotification(
          'facture.created',
          numero ? `Nouvelle facture ${numero} créée` : 'Nouvelle facture créée',
          e
        );
      });

      channel.listen('.caisse.mouvement', (e: any) => {
        const type = e?.type === 'entree' ? 'Entrée' : 'Sortie';
        const montant = e?.montant ? `${Number(e.montant).toLocaleString('fr-FR')} FCFA` : '';
        addNotification(
          'caisse.mouvement',
          `${type} caisse${montant ? ` : ${montant}` : ''}`,
          e
        );
      });

      channel.listen('.anomalie.detectee', (e: any) => {
        const count = e?.count ?? 1;
        addNotification(
          'anomalie.detectee',
          `${count} anomalie${count > 1 ? 's' : ''} détectée${count > 1 ? 's' : ''}`,
          e
        );
      });

      console.log('[RealtimeNotifications] Connecté au channel', CHANNEL_NAME);
    } catch (err) {
      console.error('[RealtimeNotifications] Erreur de connexion:', err);
    }

    return () => {
      try {
        echo.leave(CHANNEL_NAME);
      } catch {}
      channelRef.current = null;
    };
  }, [isAuthenticated, addNotification]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return { notifications, unreadCount, markAllRead, clearAll };
}
