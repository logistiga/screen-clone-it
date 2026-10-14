import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';
import { syncArmateursOps, syncConteneursOps, type SyncResult } from '@/services/api';
import { toast } from 'sonner';
import { useNotificationStore } from '@/stores/notificationStore';

const CONTENEURS_INTERVAL_MS = 5 * 60 * 1000; // 5 min
const ARMATEURS_INTERVAL_MS = 60 * 60 * 1000; // 1 h
const TICK_MS = 60 * 1000;
const INITIAL_DELAY_MS = 15_000;
const LS_CONTENEURS = 'autosync:last-conteneurs';
const LS_ARMATEURS = 'autosync:last-armateurs';

type SyncOutcome = { data: SyncResult | null; stop: boolean };

function getStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } })?.response?.status;
}

/** Partagé entre onglets : un seul onglet lance la synchro pendant l'intervalle. */
function isDue(key: string, interval: number): boolean {
  const last = Number(localStorage.getItem(key) ?? 0);
  return Date.now() - last >= interval;
}

async function callSync(fn: () => Promise<SyncResult>, key: string): Promise<SyncOutcome> {
  localStorage.setItem(key, String(Date.now()));
  try {
    return { data: await fn(), stop: false };
  } catch (error) {
    const status = getStatus(error);
    // 401/403 : session expirée ou droits absents → on arrête l'auto-sync
    // 409 (synchro déjà en cours) / 429 (limite) : on ignore silencieusement
    return { data: null, stop: status === 401 || status === 403 };
  }
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendBrowserNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(title, { body, icon: '/favicon.ico', tag: `sync-${Date.now()}` }); } catch { /* silencieux */ }
  }
}

/**
 * Synchro OPS en arrière-plan, économe : conteneurs toutes les 5 min, armateurs toutes les heures,
 * un seul onglet à la fois, rien si l'onglet est masqué, arrêt définitif sur 401/403.
 */
export function useAutoSync() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const busyRef = useRef(false);
  const stoppedRef = useRef(false);
  const addNotification = useNotificationStore(s => s.addNotification);

  const runSync = useCallback(async () => {
    if (busyRef.current || stoppedRef.current || !isAuthenticated || document.hidden) return;
    busyRef.current = true;
    try {
      let hasChanges = false;

      if (isDue(LS_ARMATEURS, ARMATEURS_INTERVAL_MS)) {
        const arm = await callSync(syncArmateursOps, LS_ARMATEURS);
        if (arm.stop) { stoppedRef.current = true; return; }
        const newArm = arm.data?.created ?? arm.data?.nouveaux ?? 0;
        if (newArm > 0) {
          hasChanges = true;
          const msg = `${newArm} nouvel${newArm > 1 ? 'les' : ''} armateur${newArm > 1 ? 's' : ''} synchronisé${newArm > 1 ? 's' : ''} depuis OPS`;
          addNotification('armateur.synced', msg, { count: newArm });
          toast.success('🚢 Nouveaux armateurs', { description: msg, duration: 6000 });
          sendBrowserNotification('🚢 Nouveaux armateurs détectés', msg);
        }
      }

      if (isDue(LS_CONTENEURS, CONTENEURS_INTERVAL_MS)) {
        const cnt = await callSync(syncConteneursOps, LS_CONTENEURS);
        if (cnt.stop) { stoppedRef.current = true; return; }
        const d = cnt.data as (SyncResult & { data?: { conteneurs_importes?: number; conteneurs_mis_a_jour?: number } }) | null;
        const newCnt = d?.data?.conteneurs_importes ?? d?.created ?? d?.nouveaux ?? 0;
        const updCnt = d?.data?.conteneurs_mis_a_jour ?? 0;
        if (newCnt > 0) {
          const msg = `${newCnt} nouveau${newCnt > 1 ? 'x' : ''} conteneur${newCnt > 1 ? 's' : ''} importé${newCnt > 1 ? 's' : ''} depuis OPS`;
          addNotification('conteneur.synced', msg, { count: newCnt });
          toast.success('📦 Nouveaux conteneurs', { description: msg, duration: 6000 });
          sendBrowserNotification('📦 Nouveaux conteneurs détectés', msg);
        }
        if (newCnt > 0 || updCnt > 0) hasChanges = true;
      }

      if (hasChanges) {
        ['conteneurs-traites', 'conteneurs-traites-stats', 'conteneurs-anomalies', 'conteneurs-anomalies-stats', 'armateurs']
          .forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));
      }
    } finally {
      busyRef.current = false;
    }
  }, [isAuthenticated, queryClient, addNotification]);

  useEffect(() => {
    if (!isAuthenticated) return;
    stoppedRef.current = false;
    requestNotificationPermission();
    const t = setTimeout(runSync, INITIAL_DELAY_MS);
    const i = setInterval(runSync, TICK_MS);
    return () => { clearTimeout(t); clearInterval(i); };
  }, [isAuthenticated, runSync]);
}
