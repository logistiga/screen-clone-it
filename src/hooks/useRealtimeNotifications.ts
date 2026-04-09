import { useEffect, useRef } from 'react';
import echo from '@/lib/echo';
import { useAuth } from '@/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useNotificationStore, NotificationType } from '@/stores/notificationStore';

const CHANNEL_NAME = 'logistiga-fac';

/**
 * Hook qui écoute les events Pusher/Echo ET le store partagé.
 * Les events Pusher ajoutent au store + invalident les queries.
 * Fonctionne en complément du polling (use-auto-sync).
 */
export function useRealtimeNotifications() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;
    if (!pusherKey) {
      console.warn('[RealtimeNotifications] VITE_PUSHER_APP_KEY non configurée, Pusher désactivé (polling actif).');
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
        queryClient.invalidateQueries({ queryKey: ['conteneurs-traites'] });
        queryClient.invalidateQueries({ queryKey: ['conteneurs-traites-stats'] });
      });

      channel.listen('.facture.created', (e: any) => {
        const numero = e?.numero ?? '';
        addNotification(
          'facture.created',
          numero ? `Nouvelle facture ${numero} créée` : 'Nouvelle facture créée',
          e
        );
        queryClient.invalidateQueries({ queryKey: ['factures'] });
      });

      channel.listen('.caisse.mouvement', (e: any) => {
        const type = e?.type === 'entree' ? 'Entrée' : 'Sortie';
        const montant = e?.montant ? `${Number(e.montant).toLocaleString('fr-FR')} FCFA` : '';
        addNotification(
          'caisse.mouvement',
          `${type} caisse${montant ? ` : ${montant}` : ''}`,
          e
        );
        queryClient.invalidateQueries({ queryKey: ['mouvements-caisse'] });
      });

      channel.listen('.anomalie.detectee', (e: any) => {
        const count = e?.count ?? 1;
        addNotification(
          'anomalie.detectee',
          `${count} anomalie${count > 1 ? 's' : ''} détectée${count > 1 ? 's' : ''}`,
          e
        );
        queryClient.invalidateQueries({ queryKey: ['conteneurs-anomalies'] });
      });

      console.log('[RealtimeNotifications] Connecté au channel', CHANNEL_NAME);
    } catch (err) {
      console.error('[RealtimeNotifications] Erreur de connexion:', err);
    }

    return () => {
      try { echo.leave(CHANNEL_NAME); } catch {}
      channelRef.current = null;
    };
  }, [isAuthenticated, addNotification, queryClient]);

  // Re-export from store for backward compatibility
  const notifications = useNotificationStore(s => s.notifications);
  const unreadCount = useNotificationStore(s => s.notifications.filter(n => !n.read).length);
  const markAllRead = useNotificationStore(s => s.markAllRead);
  const clearAll = useNotificationStore(s => s.clearAll);

  return { notifications, unreadCount, markAllRead, clearAll };
}

export type { NotificationType };
