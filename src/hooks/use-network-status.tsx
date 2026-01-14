import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';

export interface NetworkStatus {
  isOnline: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
}

interface NetworkInfo {
  type?: string;
  effectiveType?: string;
}

const CHECK_INTERVAL = 30000; // Vérifier toutes les 30 secondes
const PING_TIMEOUT = 5000; // Timeout de 5 secondes pour le ping

export function useNetworkStatus(): NetworkStatus & {
  checkConnection: () => Promise<boolean>;
} {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isChecking: false,
    lastChecked: null,
    connectionType: 'unknown',
    effectiveType: 'unknown',
  });
  
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Obtenir les informations de connexion
  const getConnectionInfo = useCallback((): Partial<NetworkStatus> => {
    if (typeof navigator === 'undefined') {
      return { connectionType: 'unknown', effectiveType: 'unknown' };
    }

    const connection = (navigator as any).connection as NetworkInfo | undefined;
    
    if (connection) {
      let connectionType: NetworkStatus['connectionType'] = 'unknown';
      if (connection.type === 'wifi') connectionType = 'wifi';
      else if (connection.type === 'cellular') connectionType = 'cellular';
      else if (connection.type === 'ethernet') connectionType = 'ethernet';

      let effectiveType: NetworkStatus['effectiveType'] = 'unknown';
      if (connection.effectiveType === '4g') effectiveType = '4g';
      else if (connection.effectiveType === '3g') effectiveType = '3g';
      else if (connection.effectiveType === '2g') effectiveType = '2g';
      else if (connection.effectiveType === 'slow-2g') effectiveType = 'slow-2g';

      return { connectionType, effectiveType };
    }

    return { connectionType: 'unknown', effectiveType: 'unknown' };
  }, []);

  // Vérifier la connexion réelle avec un ping API
  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!isMountedRef.current) return false;
    
    setStatus((prev) => ({ ...prev, isChecking: true }));

    try {
      // Créer un contrôleur d'abandon pour le timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT);

      // Essayer de pinguer le serveur
      await api.get('/ping', { 
        signal: controller.signal,
        timeout: PING_TIMEOUT 
      });
      
      clearTimeout(timeoutId);

      if (isMountedRef.current) {
        const connectionInfo = getConnectionInfo();
        setStatus((prev) => ({
          ...prev,
          isOnline: true,
          isChecking: false,
          lastChecked: new Date(),
          ...connectionInfo,
        }));
      }
      
      return true;
    } catch (error) {
      // Si l'erreur est due au navigateur hors-ligne ou timeout
      const isOffline = !navigator.onLine || 
        (error as any)?.code === 'ERR_NETWORK' ||
        (error as any)?.name === 'AbortError';

      if (isMountedRef.current) {
        const connectionInfo = getConnectionInfo();
        setStatus((prev) => ({
          ...prev,
          isOnline: !isOffline && navigator.onLine,
          isChecking: false,
          lastChecked: new Date(),
          ...connectionInfo,
        }));
      }
      
      return !isOffline && navigator.onLine;
    }
  }, [getConnectionInfo]);

  // Gestionnaire d'événements online/offline
  const handleOnline = useCallback(() => {
    console.log('[Network] Navigateur en ligne');
    setStatus((prev) => ({ ...prev, isOnline: true }));
    // Vérifier la vraie connexion après un court délai
    setTimeout(() => checkConnection(), 1000);
  }, [checkConnection]);

  const handleOffline = useCallback(() => {
    console.log('[Network] Navigateur hors-ligne');
    setStatus((prev) => ({ 
      ...prev, 
      isOnline: false, 
      lastChecked: new Date() 
    }));
  }, []);

  // Gestionnaire de changement de connexion
  const handleConnectionChange = useCallback(() => {
    const connectionInfo = getConnectionInfo();
    setStatus((prev) => ({ ...prev, ...connectionInfo }));
    checkConnection();
  }, [getConnectionInfo, checkConnection]);

  useEffect(() => {
    isMountedRef.current = true;

    // Écouter les événements de connectivité du navigateur
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Écouter les changements de type de connexion
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Vérification initiale
    checkConnection();

    // Vérification périodique
    checkIntervalRef.current = setInterval(() => {
      if (navigator.onLine) {
        checkConnection();
      }
    }, CHECK_INTERVAL);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
      
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [handleOnline, handleOffline, handleConnectionChange, checkConnection]);

  return { ...status, checkConnection };
}

// Export d'un singleton pour l'état réseau global
let globalNetworkStatus: NetworkStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isChecking: false,
  lastChecked: null,
  connectionType: 'unknown',
  effectiveType: 'unknown',
};

export function getGlobalNetworkStatus(): NetworkStatus {
  return globalNetworkStatus;
}

export function setGlobalNetworkStatus(status: NetworkStatus): void {
  globalNetworkStatus = status;
}

export function isOnline(): boolean {
  return globalNetworkStatus.isOnline;
}
