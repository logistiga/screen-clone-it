import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNetworkStatus, setGlobalNetworkStatus, NetworkStatus } from '@/hooks/use-network-status';
import { getQueueStats } from '@/lib/offline/syncQueue';

interface SyncStats {
  pending: number;
  syncing: number;
  failed: number;
  total: number;
}

interface NetworkContextValue {
  isOnline: boolean;
  isChecking: boolean;
  isSyncing: boolean;
  lastChecked: Date | null;
  connectionType: NetworkStatus['connectionType'];
  effectiveType: NetworkStatus['effectiveType'];
  syncStats: SyncStats;
  checkConnection: () => Promise<boolean>;
  refreshSyncStats: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const networkStatus = useNetworkStatus();
  const [syncStats, setSyncStats] = useState<SyncStats>({
    pending: 0,
    syncing: 0,
    failed: 0,
    total: 0,
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Mettre à jour l'état global
  useEffect(() => {
    setGlobalNetworkStatus({
      isOnline: networkStatus.isOnline,
      isChecking: networkStatus.isChecking,
      lastChecked: networkStatus.lastChecked,
      connectionType: networkStatus.connectionType,
      effectiveType: networkStatus.effectiveType,
    });
  }, [networkStatus]);

  // Rafraîchir les statistiques de synchronisation
  const refreshSyncStats = useCallback(async () => {
    try {
      const stats = await getQueueStats();
      setSyncStats(stats);
      setIsSyncing(stats.syncing > 0);
    } catch (error) {
      console.error('[NetworkContext] Erreur refresh stats:', error);
    }
  }, []);

  // Rafraîchir périodiquement les stats
  useEffect(() => {
    refreshSyncStats();
    
    const interval = setInterval(refreshSyncStats, 5000);
    return () => clearInterval(interval);
  }, [refreshSyncStats]);

  // Quand la connexion revient, rafraîchir les stats
  useEffect(() => {
    if (networkStatus.isOnline) {
      refreshSyncStats();
    }
  }, [networkStatus.isOnline, refreshSyncStats]);

  const value: NetworkContextValue = {
    isOnline: networkStatus.isOnline,
    isChecking: networkStatus.isChecking,
    isSyncing,
    lastChecked: networkStatus.lastChecked,
    connectionType: networkStatus.connectionType,
    effectiveType: networkStatus.effectiveType,
    syncStats,
    checkConnection: networkStatus.checkConnection,
    refreshSyncStats,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextValue {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork doit être utilisé dans un NetworkProvider');
  }
  return context;
}

// Hook pour l'état de synchronisation d'une entité spécifique
export function useEntitySyncStatus(entityType: string, entityId: string) {
  const { syncStats, isOnline } = useNetwork();
  const [isUnsynced, setIsUnsynced] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { hasUnsyncedChanges } = await import('@/lib/offline/syncQueue');
        const unsynced = await hasUnsyncedChanges(entityType as any, entityId);
        setIsUnsynced(unsynced);
      } catch (error) {
        console.error('[useEntitySyncStatus] Erreur:', error);
      }
    };

    checkStatus();
  }, [entityType, entityId, syncStats]);

  return { isUnsynced, isOnline };
}
