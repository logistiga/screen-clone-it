import { getDB, EntityType, generateTempId } from './db';
import type { SyncQueueItem } from './db';
export type { SyncQueueItem } from './db';

// Ajouter une opération à la queue de synchronisation
export async function addToSyncQueue(
  params: Omit<SyncQueueItem, 'id' | 'attempts' | 'status'>
): Promise<string> {
  const db = await getDB();
  
  const item: SyncQueueItem = {
    id: generateTempId(),
    entity: params.entity,
    action: params.action,
    data: params.data,
    tempId: params.tempId,
    timestamp: params.timestamp || Date.now(),
    userId: params.userId,
    attempts: 0,
    status: 'pending',
  };
  
  await db.put('sync_queue', item);
  
  console.log(`[SyncQueue] Ajouté à la queue: ${item.action} ${item.entity}`, item);
  
  return item.id;
}

// Récupérer toutes les opérations en attente, triées par timestamp
export async function getPendingOperations(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('sync_queue', 'by-status', 'pending');
  
  // Trier par timestamp (ordre chronologique)
  return all.sort((a, b) => a.timestamp - b.timestamp);
}

// Récupérer les opérations échouées
export async function getFailedOperations(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('sync_queue', 'by-status', 'failed');
}

// Récupérer toutes les opérations (pour affichage)
export async function getAllOperations(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  const all = await db.getAll('sync_queue');
  return all.sort((a, b) => a.timestamp - b.timestamp);
}

// Mettre à jour le statut d'une opération
export async function updateOperationStatus(
  id: string,
  status: SyncQueueItem['status'],
  error?: string
): Promise<void> {
  const db = await getDB();
  const item = await db.get('sync_queue', id);
  
  if (item) {
    item.status = status;
    item.attempts += status === 'failed' ? 1 : 0;
    if (error) {
      item.lastError = error;
    }
    await db.put('sync_queue', item);
  }
}

// Marquer une opération comme en cours de synchronisation
export async function markAsSyncing(id: string): Promise<void> {
  await updateOperationStatus(id, 'syncing');
}

// Marquer une opération comme réussie et la supprimer
export async function markAsSuccess(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sync_queue', id);
  console.log(`[SyncQueue] Opération ${id} synchronisée avec succès`);
}

// Marquer une opération comme échouée
export async function markAsFailed(id: string, error: string): Promise<void> {
  await updateOperationStatus(id, 'failed', error);
  console.error(`[SyncQueue] Opération ${id} échouée: ${error}`);
}

// Réessayer une opération échouée
export async function retryOperation(id: string): Promise<void> {
  await updateOperationStatus(id, 'pending');
}

// Réessayer toutes les opérations échouées
export async function retryAllFailed(): Promise<void> {
  const failed = await getFailedOperations();
  for (const op of failed) {
    await retryOperation(op.id);
  }
}

// Supprimer une opération de la queue
export async function removeFromQueue(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sync_queue', id);
  console.log(`[SyncQueue] Opération ${id} supprimée de la queue`);
}

// Compter les opérations par statut
export async function getQueueStats(): Promise<{
  pending: number;
  syncing: number;
  failed: number;
  total: number;
}> {
  const db = await getDB();
  const all = await db.getAll('sync_queue');
  
  return {
    pending: all.filter((item) => item.status === 'pending').length,
    syncing: all.filter((item) => item.status === 'syncing').length,
    failed: all.filter((item) => item.status === 'failed').length,
    total: all.length,
  };
}

// Récupérer les opérations par entité
export async function getOperationsByEntity(entity: EntityType): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('sync_queue', 'by-entity', entity);
}

// Vérifier si une entité a des opérations en attente
export async function hasUnsyncedChanges(entity: EntityType, entityId: string): Promise<boolean> {
  const operations = await getOperationsByEntity(entity);
  return operations.some(
    (op) => op.tempId === entityId || op.data?.id === entityId
  );
}

// Nettoyer les opérations anciennes (plus de 7 jours)
export async function cleanOldOperations(maxAgeDays: number = 7): Promise<number> {
  const db = await getDB();
  const all = await db.getAll('sync_queue');
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  
  let cleaned = 0;
  for (const item of all) {
    if (item.status === 'success' && item.timestamp < cutoff) {
      await db.delete('sync_queue', item.id);
      cleaned++;
    }
  }
  
  return cleaned;
}

// Exporter les opérations pour debug/backup
export async function exportQueue(): Promise<SyncQueueItem[]> {
  return getAllOperations();
}

// Importer des opérations (pour restauration)
export async function importQueue(operations: SyncQueueItem[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('sync_queue', 'readwrite');
  
  for (const op of operations) {
    await tx.store.put(op);
  }
  
  await tx.done;
}
