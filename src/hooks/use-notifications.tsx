import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useState, useRef } from 'react';
import { notificationsService } from '@/services/notificationsService';
import type { Notification as AppNotification } from '@/services/notificationsService';
import { toast } from 'sonner';

// Re-export le type pour les autres fichiers
export type { AppNotification };

export const NOTIFICATIONS_KEY = ['notifications'];

// Configuration du polling - intervalle plus court pour temps réel
const POLLING_INTERVAL_ACTIVE = 10000; // 10 secondes quand l'onglet est actif
const POLLING_INTERVAL_BACKGROUND = 60000; // 1 minute en arrière-plan
const ALERTS_POLLING_INTERVAL = 30000; // 30 secondes pour les alertes

// Hook pour détecter si l'onglet est actif
function useTabVisibility() {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  return isVisible;
}

// Hook pour récupérer les notifications avec polling adaptatif
export function useNotifications(params?: { 
  page?: number; 
  per_page?: number; 
  unread_only?: boolean 
}) {
  const isTabVisible = useTabVisibility();
  const pollingInterval = isTabVisible ? POLLING_INTERVAL_ACTIVE : POLLING_INTERVAL_BACKGROUND;
  
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, params],
    queryFn: () => notificationsService.getAll(params),
    staleTime: 5000, // 5 secondes
    refetchInterval: pollingInterval,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
}

// Hook pour récupérer le nombre de notifications non lues avec polling rapide
export function useUnreadCount() {
  const isTabVisible = useTabVisibility();
  const pollingInterval = isTabVisible ? POLLING_INTERVAL_ACTIVE : POLLING_INTERVAL_BACKGROUND;
  
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, 'unread-count'],
    queryFn: notificationsService.getUnreadCount,
    staleTime: 5000,
    refetchInterval: pollingInterval,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
}

// Hook pour les alertes système
export function useAlerts() {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, 'alerts'],
    queryFn: notificationsService.getAlerts,
    staleTime: 30000,
    refetchInterval: ALERTS_POLLING_INTERVAL,
    refetchOnWindowFocus: true,
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

// Configuration des notifications push
interface PushNotificationOptions {
  enableSound?: boolean;
  enableBrowserNotification?: boolean;
  onNewNotification?: (notification: AppNotification) => void;
}

// Hook pour les notifications push en temps réel
export function useRealtimeNotifications(options: PushNotificationOptions = {}) {
  const { enableSound = false, enableBrowserNotification = false, onNewNotification } = options;
  const previousNotificationsRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);
  const { data: notifications, refetch } = useNotifications({ per_page: 20 });
  
  // Demander la permission pour les notifications browser
  useEffect(() => {
    if (enableBrowserNotification && 'Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission();
    }
  }, [enableBrowserNotification]);
  
  // Détecter les nouvelles notifications
  useEffect(() => {
    if (!notifications?.data) return;
    
    const currentIds = new Set(notifications.data.map(n => n.id));
    
    // Première initialisation - juste stocker les IDs
    if (!isInitializedRef.current) {
      previousNotificationsRef.current = currentIds;
      isInitializedRef.current = true;
      return;
    }
    
    // Trouver les nouvelles notifications non lues
    const newNotifications = notifications.data.filter(
      n => !previousNotificationsRef.current.has(n.id) && !n.read
    );
    
    if (newNotifications.length > 0) {
      // Afficher toast pour chaque nouvelle notification
      newNotifications.forEach(notification => {
        const toastType = notification.type === 'error' ? 'error' 
          : notification.type === 'warning' ? 'warning'
          : notification.type === 'success' ? 'success'
          : 'info';
        
        toast[toastType](notification.title, {
          description: notification.message,
          duration: 5000,
          action: notification.link ? {
            label: 'Voir',
            onClick: () => window.location.href = notification.link!,
          } : undefined,
        });
        
        // Callback personnalisé
        onNewNotification?.(notification);
      });
      
      // Jouer un son si activé
      if (enableSound) {
        playNotificationSound();
      }
      
      // Notification browser si activé et autorisé
      if (enableBrowserNotification && 'Notification' in window && window.Notification.permission === 'granted') {
        newNotifications.forEach(notification => {
          new window.Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id,
          });
        });
      }
    }
    
    previousNotificationsRef.current = currentIds;
  }, [notifications, enableSound, enableBrowserNotification, onNewNotification]);
  
  return { refetch };
}

// Jouer un son de notification
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    // Ignorer les erreurs audio
  }
}

// Hook pour détecter les nouvelles notifications (legacy - gardé pour compatibilité)
export function useNewNotificationDetector(onNewNotification?: (notification: AppNotification) => void) {
  useRealtimeNotifications({ onNewNotification });
}

// Hook combiné pour le centre de notifications avec state local pour fallback
export function useNotificationCenter() {
  const queryClient = useQueryClient();
  const [localNotifications, setLocalNotifications] = useState<AppNotification[]>([]);
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
      toast.success('Toutes les notifications ont été marquées comme lues');
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
      toast.success('Toutes les notifications ont été supprimées');
    } else {
      deleteAllMutation.mutate();
    }
  }, [useLocal, deleteAllMutation]);
  
  const refresh = useCallback(() => {
    if (!useLocal) {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    }
  }, [useLocal, queryClient]);
  
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

// Hook pour activer les notifications temps réel dans l'app
export function useEnableRealtimeNotifications() {
  useRealtimeNotifications({
    enableSound: false, // Désactivé par défaut, peut être activé dans les préférences
    enableBrowserNotification: false, // Désactivé par défaut
  });
}
