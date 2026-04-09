import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useNotificationStore } from '@/stores/notificationStore';

const SYNC_INTERVAL_MS = 60 * 1000; // 1 minute
const INITIAL_DELAY_MS = 10_000; // 10s après chargement

interface SyncResult {
  success: boolean;
  created?: number;
  updated?: number;
  total?: number;
  nouveaux?: number;
  mis_a_jour?: number;
  message?: string;
}

// Demander la permission pour les notifications browser
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Envoyer une notification browser native
function sendBrowserNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: '/favicon.ico', tag: `sync-${Date.now()}` });
    } catch {
      // Silencieux
    }
  }
}

async function syncArmateurs(): Promise<SyncResult | null> {
  try {
    const response = await api.post('/sync-diagnostic/sync-armateurs');
    return response.data;
  } catch (error: any) {
    console.error('[AutoSync] Échec sync armateurs:', error?.response?.status);
    return null;
  }
}

async function syncConteneurs(): Promise<SyncResult | null> {
  try {
    const response = await api.post('/sync-diagnostic/sync-conteneurs');
    return response.data;
  } catch (error: any) {
    console.error('[AutoSync] Échec sync conteneurs:', error?.response?.status);
    return null;
  }
}

/**
 * Hook global : polling court (1 min) pour sync OPS + rafraîchissement automatique des données.
 * Les notifications sont poussées dans le store global (NotificationBell).
 * Les caches React Query sont invalidés automatiquement après chaque sync réussie.
 */
export function useAutoSync() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSyncingRef = useRef(false);
  const addNotification = useNotificationStore(s => s.addNotification);

  const runSync = useCallback(async () => {
    if (isSyncingRef.current || !isAuthenticated) return;
    isSyncingRef.current = true;

    try {
      const [armateursResult, conteneursResult] = await Promise.allSettled([
        syncArmateurs(),
        syncConteneurs(),
      ]);

      const arm = armateursResult.status === 'fulfilled' ? armateursResult.value : null;
      const cnt = conteneursResult.status === 'fulfilled' ? conteneursResult.value : null;

      let hasChanges = false;

      // Nouveaux armateurs
      const newArm = arm?.created ?? arm?.nouveaux ?? 0;
      if (newArm > 0) {
        hasChanges = true;
        const msg = `${newArm} nouvel${newArm > 1 ? 'les' : ''} armateur${newArm > 1 ? 's' : ''} synchronisé${newArm > 1 ? 's' : ''} depuis OPS`;
        addNotification('armateur.synced', msg, { count: newArm });
        toast.success('🚢 Nouveaux armateurs', { description: msg, duration: 6000 });
        sendBrowserNotification('🚢 Nouveaux armateurs détectés', msg);
      }

      // Nouveaux conteneurs
      const newCnt = cnt?.created ?? cnt?.nouveaux ?? 0;
      if (newCnt > 0) {
        hasChanges = true;
        const msg = `${newCnt} nouveau${newCnt > 1 ? 'x' : ''} conteneur${newCnt > 1 ? 's' : ''} importé${newCnt > 1 ? 's' : ''} depuis OPS`;
        addNotification('conteneur.synced', msg, { count: newCnt });
        toast.success('📦 Nouveaux conteneurs', { description: msg, duration: 6000 });
        sendBrowserNotification('📦 Nouveaux conteneurs détectés', msg);
      }

      // Mises à jour
      const updArm = arm?.updated ?? arm?.mis_a_jour ?? 0;
      const updCnt = cnt?.updated ?? cnt?.mis_a_jour ?? 0;
      if (updArm > 0 || updCnt > 0) {
        hasChanges = true;
        const parts = [];
        if (updArm > 0) parts.push(`${updArm} armateur${updArm > 1 ? 's' : ''}`);
        if (updCnt > 0) parts.push(`${updCnt} conteneur${updCnt > 1 ? 's' : ''}`);
        addNotification('conteneur.synced', `Mis à jour : ${parts.join(', ')}`, { updArm, updCnt });
      }

      // Auto-refresh des données affichées si des changements sont détectés
      if (hasChanges) {
        queryClient.invalidateQueries({ queryKey: ['conteneurs-traites'] });
        queryClient.invalidateQueries({ queryKey: ['conteneurs-traites-stats'] });
        queryClient.invalidateQueries({ queryKey: ['conteneurs-anomalies'] });
        queryClient.invalidateQueries({ queryKey: ['conteneurs-anomalies-stats'] });
        queryClient.invalidateQueries({ queryKey: ['armateurs'] });
        queryClient.invalidateQueries({ queryKey: ['ordres'] });
        queryClient.invalidateQueries({ queryKey: ['factures'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }

      // Erreurs de sync → notification d'erreur
      if (armateursResult.status === 'rejected') {
        addNotification('sync.error', 'Échec sync armateurs OPS');
      }
      if (conteneursResult.status === 'rejected') {
        addNotification('sync.error', 'Échec sync conteneurs OPS');
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [isAuthenticated, queryClient, addNotification]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    requestNotificationPermission();

    // Première sync après 10s
    const initialTimeout = setTimeout(runSync, INITIAL_DELAY_MS);

    // Puis toutes les 1 minute
    intervalRef.current = setInterval(runSync, SYNC_INTERVAL_MS);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, runSync]);
}
