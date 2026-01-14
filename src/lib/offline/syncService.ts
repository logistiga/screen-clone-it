import api from '@/lib/api';
import { EntityType, replaceTempId, isTempId, saveLocally, deleteFromLocal } from './db';
import {
  getPendingOperations,
  markAsSyncing,
  markAsSuccess,
  markAsFailed,
  retryAllFailed,
  getQueueStats,
  SyncQueueItem,
} from './syncQueue';
import { isOnline, setGlobalNetworkStatus, getGlobalNetworkStatus } from '@/hooks/use-network-status';

// Configuration
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 1000; // 1 seconde, puis exponential backoff

// Mapping des entités vers leurs endpoints API
const ENTITY_ENDPOINTS: Record<EntityType, string> = {
  clients: '/clients',
  devis: '/devis',
  ordres: '/ordres-travail',
  factures: '/factures',
  paiements: '/paiements',
  notes: '/notes-honoraires',
};

// État de synchronisation
let isSyncing = false;
let syncPromise: Promise<SyncResult> | null = null;

export interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{ operation: SyncQueueItem; error: string }>;
  mappings: Array<{ tempId: string; realId: string; entity: EntityType }>;
}

// Synchroniser toutes les opérations en attente
export async function syncAll(): Promise<SyncResult> {
  // Éviter les synchronisations concurrentes
  if (isSyncing && syncPromise) {
    console.log('[SyncService] Synchronisation déjà en cours, attente...');
    return syncPromise;
  }

  if (!isOnline()) {
    console.log('[SyncService] Hors-ligne, synchronisation impossible');
    return { success: false, processed: 0, failed: 0, errors: [], mappings: [] };
  }

  isSyncing = true;
  syncPromise = performSync();

  try {
    return await syncPromise;
  } finally {
    isSyncing = false;
    syncPromise = null;
  }
}

async function performSync(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    processed: 0,
    failed: 0,
    errors: [],
    mappings: [],
  };

  const operations = await getPendingOperations();
  console.log(`[SyncService] Début synchronisation: ${operations.length} opérations`);

  // Mapping des IDs temporaires vers les IDs réels
  const tempIdMappings: Map<string, string> = new Map();

  for (const op of operations) {
    try {
      // Marquer comme en cours
      await markAsSyncing(op.id);

      // Remplacer les références aux IDs temporaires dans les données
      const processedData = replaceTempReferences(op.data, tempIdMappings);

      // Exécuter l'opération
      const realId = await executeOperation(op.entity, op.action, processedData, op.tempId);

      // Si c'était une création avec un ID temporaire, stocker le mapping
      if (op.action === 'create' && op.tempId && isTempId(op.tempId) && realId) {
        tempIdMappings.set(op.tempId, realId);
        result.mappings.push({ tempId: op.tempId, realId, entity: op.entity });

        // Mettre à jour le cache local
        await replaceTempId(op.entity, op.tempId, realId);
      }

      // Marquer comme réussie
      await markAsSuccess(op.id);
      result.processed++;

      console.log(`[SyncService] ✓ ${op.action} ${op.entity} synchronisé`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      // Vérifier si c'est une erreur récupérable
      if (isRecoverableError(error)) {
        await markAsFailed(op.id, errorMessage);
        result.failed++;
        result.errors.push({ operation: op, error: errorMessage });
        result.success = false;
        
        console.error(`[SyncService] ✗ ${op.action} ${op.entity} échoué:`, errorMessage);
      } else {
        // Erreur critique (ex: validation), marquer comme échoué définitivement
        await markAsFailed(op.id, `FATAL: ${errorMessage}`);
        result.failed++;
        result.errors.push({ operation: op, error: `FATAL: ${errorMessage}` });
        
        console.error(`[SyncService] ✗ ${op.action} ${op.entity} erreur fatale:`, errorMessage);
      }
    }
  }

  console.log(`[SyncService] Synchronisation terminée: ${result.processed} réussies, ${result.failed} échouées`);
  
  return result;
}

// Exécuter une opération individuelle
async function executeOperation(
  entity: EntityType,
  action: 'create' | 'update' | 'delete',
  data: any,
  tempId: string | null
): Promise<string | null> {
  const endpoint = ENTITY_ENDPOINTS[entity];

  switch (action) {
    case 'create': {
      // Nettoyer les champs internes
      const { id, _offline, _wasOffline, ...cleanData } = data;
      const response = await api.post(endpoint, cleanData);
      
      // Sauvegarder dans le cache local avec le vrai ID
      await saveLocally(entity, response.data, false);
      
      return response.data.id?.toString() || null;
    }

    case 'update': {
      const { _offline, _wasOffline, ...cleanData } = data;
      const entityId = cleanData.id;
      await api.put(`${endpoint}/${entityId}`, cleanData);
      
      // Mettre à jour le cache local
      await saveLocally(entity, { ...cleanData, id: entityId }, false);
      
      return entityId?.toString() || null;
    }

    case 'delete': {
      const entityId = data.id;
      await api.delete(`${endpoint}/${entityId}`);
      
      // Supprimer du cache local
      await deleteFromLocal(entity, entityId);
      
      return entityId?.toString() || null;
    }

    default:
      throw new Error(`Action non supportée: ${action}`);
  }
}

// Remplacer les références aux IDs temporaires dans les données
function replaceTempReferences(data: any, mappings: Map<string, string>): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => replaceTempReferences(item, mappings));
  }

  const result: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && isTempId(value) && mappings.has(value)) {
      // Remplacer l'ID temporaire par l'ID réel
      result[key] = mappings.get(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = replaceTempReferences(value, mappings);
    } else {
      result[key] = value;
    }
  }

  return result;
}

// Vérifier si une erreur est récupérable (peut être réessayée)
function isRecoverableError(error: any): boolean {
  // Erreurs réseau ou serveur temporaires
  if (!error?.response) {
    return true; // Erreur réseau
  }

  const status = error.response?.status;
  
  // Erreurs serveur (5xx) sont récupérables
  if (status >= 500 && status < 600) {
    return true;
  }

  // Timeout, rate limiting
  if (status === 408 || status === 429) {
    return true;
  }

  // Erreurs client (4xx) ne sont généralement pas récupérables
  // sauf les conflits qui peuvent se résoudre
  if (status === 409) {
    return true;
  }

  return false;
}

// Retenter les opérations échouées avec backoff exponentiel
export async function retryFailedWithBackoff(): Promise<void> {
  if (!isOnline()) return;

  const stats = await getQueueStats();
  if (stats.failed === 0) return;

  console.log(`[SyncService] Réessai de ${stats.failed} opérations échouées`);
  
  await retryAllFailed();
  await syncAll();
}

// Démarrer la synchronisation automatique quand la connexion revient
export function startAutoSync(intervalMs: number = 60000): () => void {
  let intervalId: NodeJS.Timeout | null = null;

  const handleOnline = async () => {
    console.log('[SyncService] Connexion rétablie, démarrage synchronisation...');
    await syncAll();
  };

  window.addEventListener('online', handleOnline);

  // Synchronisation périodique
  intervalId = setInterval(async () => {
    if (isOnline()) {
      const stats = await getQueueStats();
      if (stats.pending > 0 || stats.failed > 0) {
        await syncAll();
      }
    }
  }, intervalMs);

  // Retourner une fonction de nettoyage
  return () => {
    window.removeEventListener('online', handleOnline);
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
}

// Forcer une synchronisation immédiate
export async function forceSyncNow(): Promise<SyncResult> {
  // Réessayer d'abord les échoués
  await retryAllFailed();
  return syncAll();
}

// Obtenir l'état de synchronisation
export function isSyncInProgress(): boolean {
  return isSyncing;
}

// Export pour tests
export { ENTITY_ENDPOINTS, MAX_RETRY_ATTEMPTS };
