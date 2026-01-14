import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useState, useRef } from 'react';
import { notificationsService, Notification } from '@/services/notificationsService';
import { toast } from 'sonner';

export const NOTIFICATIONS_KEY = ['notifications'];
const POLLING_INTERVAL = 30000; // 30 secondes

// Hook pour récupérer les notifications avec polling
export function useNotifications(params?: { 
  page?: number; 
  per_page?: number; 
  unread_only?: boolean 
}) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, params],
    queryFn: () => notificationsService.getAll(params),
    staleTime: 10000, // 10 secondes
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
  });
}

// Hook pour récupérer le nombre de notifications non lues avec polling
export function useUnreadCount() {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, 'unread-count'],
    queryFn: notificationsService.getUnreadCount,
    staleTime: 10000,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
  });
}

// Hook pour les alertes système
export function useAlerts() {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, 'alerts'],
    queryFn: notificationsService.getAlerts,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000,
  });
}

// Hook pour marquer une notification comme lue
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
}

// Hook pour marquer toutes les notifications comme lues
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      toast.success('Toutes les notifications ont été marquées comme lues');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour des notifications');
    },
  });
}

// Hook pour supprimer une notification
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
}

// Hook pour supprimer toutes les notifications
export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsService.deleteAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      toast.success('Toutes les notifications ont été supprimées');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression des notifications');
    },
  });
}

// Hook pour détecter les nouvelles notifications
export function useNewNotificationDetector(onNewNotification?: (notification: Notification) => void) {
  const previousCountRef = useRef<number | null>(null);
  const { data: notifications } = useNotifications({ per_page: 10 });
  
  useEffect(() => {
    if (!notifications) return;
    
    const currentCount = notifications.unread_count;
    
    // Si c'est la première fois, on initialise juste le compteur
    if (previousCountRef.current === null) {
      previousCountRef.current = currentCount;
      return;
    }
    
    // Si on a plus de notifications non lues qu'avant
    if (currentCount > previousCountRef.current) {
      const newCount = currentCount - previousCountRef.current;
      
      // Notifier l'utilisateur
      toast.info(`${newCount} nouvelle${newCount > 1 ? 's' : ''} notification${newCount > 1 ? 's' : ''}`, {
        description: 'Cliquez sur la cloche pour voir les détails',
      });
      
      // Si callback fourni, appeler avec la dernière notification
      if (onNewNotification && notifications.data.length > 0) {
        const latestUnread = notifications.data.find(n => !n.read);
        if (latestUnread) {
          onNewNotification(latestUnread);
        }
      }
    }
    
    previousCountRef.current = currentCount;
  }, [notifications, onNewNotification]);
}

// Hook combiné pour le centre de notifications avec state local pour fallback
export function useNotificationCenter() {
  const queryClient = useQueryClient();
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);
  const [useLocal, setUseLocal] = useState(false);
  
  const { data, isLoading, error } = useNotifications({ per_page: 50 });
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteMutation = useDeleteNotification();
  const deleteAllMutation = useDeleteAllNotifications();
  
  // Si l'API échoue, utiliser les données locales avec des notifications de démo
  useEffect(() => {
    if (error || (!isLoading && !data?.data?.length && localNotifications.length === 0)) {
      setUseLocal(true);
      // Générer des notifications de démo basées sur la date actuelle
      const now = new Date();
      setLocalNotifications([
        {
          id: '1',
          type: 'warning',
          title: 'Factures en retard',
          message: 'Vous avez des factures impayées depuis plus de 30 jours.',
          date: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          read: false,
          icon: 'facture',
        },
        {
          id: '2',
          type: 'info',
          title: 'Échéance crédit à venir',
          message: 'Une échéance de crédit arrive à terme dans 5 jours.',
          date: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
          read: false,
          icon: 'credit',
        },
        {
          id: '3',
          type: 'success',
          title: 'Paiement reçu',
          message: 'Un nouveau paiement a été enregistré sur la facture FAC-2026-0012.',
          date: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          icon: 'paiement',
        },
      ]);
    }
  }, [error, isLoading, data, localNotifications.length]);
  
  const notifications = useLocal ? localNotifications : (data?.data ?? []);
  const unreadCount = useLocal 
    ? localNotifications.filter(n => !n.read).length 
    : (data?.unread_count ?? 0);
  
  const markAsRead = useCallback((id: string) => {
    if (useLocal) {
      setLocalNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } else {
      markAsReadMutation.mutate(id);
    }
  }, [useLocal, markAsReadMutation]);
  
  const markAllAsRead = useCallback(() => {
    if (useLocal) {
      setLocalNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } else {
      markAllAsReadMutation.mutate();
    }
  }, [useLocal, markAllAsReadMutation]);
  
  const deleteNotification = useCallback((id: string) => {
    if (useLocal) {
      setLocalNotifications(prev => prev.filter(n => n.id !== id));
    } else {
      deleteMutation.mutate(id);
    }
  }, [useLocal, deleteMutation]);
  
  const clearAll = useCallback(() => {
    if (useLocal) {
      setLocalNotifications([]);
    } else {
      deleteAllMutation.mutate();
    }
  }, [useLocal, deleteAllMutation]);
  
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
  }, [queryClient]);
  
  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refresh,
    isUsingLocalData: useLocal,
  };
}
