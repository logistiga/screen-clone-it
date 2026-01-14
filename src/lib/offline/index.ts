// Export centralisé des fonctionnalités offline
export { getDB, generateTempId, isTempId, saveLocally, getFromLocal, getAllFromLocal, 
         getOfflineEntities, deleteFromLocal, syncFromServer, replaceTempId, 
         countPendingSync, setMetadata, getMetadata, clearAllData } from './db';
export type { EntityType, SyncQueueItem, CachedEntity } from './db';

export { addToSyncQueue, getPendingOperations, getFailedOperations, getAllOperations,
         updateOperationStatus, markAsSyncing, markAsSuccess, markAsFailed,
         retryOperation, retryAllFailed, removeFromQueue, getQueueStats,
         getOperationsByEntity, hasUnsyncedChanges, cleanOldOperations,
         exportQueue, importQueue } from './syncQueue';

export { syncAll, forceSyncNow, startAutoSync, isSyncInProgress,
         retryFailedWithBackoff } from './syncService';
export type { SyncResult } from './syncService';

export { createOfflineEntityApi, clientsOfflineApi, devisOfflineApi, 
         ordresOfflineApi, facturesOfflineApi, paiementsOfflineApi, 
         notesOfflineApi, offlineApis } from './offlineApi';
