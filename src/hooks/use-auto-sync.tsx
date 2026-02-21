import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import api from '@/lib/api';
import { toast } from 'sonner';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

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

// Envoyer une notification browser + toast
function notifyUser(title: string, body: string, type: 'success' | 'info' = 'info') {
  // Toast in-app
  toast[type](title, { description: body, duration: 8000 });

  // Notification browser/mobile (si autorisé)
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const options: NotificationOptions & { vibrate?: number[] } = {
        body,
        icon: '/favicon.ico',
        tag: `sync-${Date.now()}`,
      };
      new Notification(title, options);
    } catch {
      // Fallback silencieux si la notification échoue
    }
  }
}

async function syncArmateurs(): Promise<SyncResult | null> {
  try {
    const response = await api.post('/sync-diagnostic/sync-armateurs');
    return response.data;
  } catch {
    return null;
  }
}

async function syncConteneurs(): Promise<SyncResult | null> {
  try {
    const response = await api.post('/sync-diagnostic/sync-conteneurs');
    return response.data;
  } catch {
    return null;
  }
}

/**
 * Hook global : synchronise armateurs et conteneurs toutes les 5 minutes.
 * Affiche une notification (toast + browser push) quand de nouveaux éléments sont détectés.
 */
export function useAutoSync() {
  const { isAuthenticated } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSyncingRef = useRef(false);

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

      // Notifications pour les nouveaux armateurs
      const newArm = arm?.created ?? arm?.nouveaux ?? 0;
      if (newArm > 0) {
        notifyUser(
          '🚢 Nouveaux armateurs détectés',
          `${newArm} nouvel${newArm > 1 ? 'les' : ''} armateur${newArm > 1 ? 's' : ''} synchronisé${newArm > 1 ? 's' : ''} depuis OPS.`,
          'success'
        );
      }

      // Notifications pour les nouveaux conteneurs
      const newCnt = cnt?.created ?? cnt?.nouveaux ?? 0;
      if (newCnt > 0) {
        notifyUser(
          '📦 Nouveaux conteneurs détectés',
          `${newCnt} nouveau${newCnt > 1 ? 'x' : ''} conteneur${newCnt > 1 ? 's' : ''} importé${newCnt > 1 ? 's' : ''} depuis OPS.`,
          'success'
        );
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Demander la permission pour les notifications push
    requestNotificationPermission();

    // Première sync après 10s (laisser l'app se charger)
    const initialTimeout = setTimeout(runSync, 10_000);

    // Puis toutes les 5 minutes
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
