import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Types pour les entités
export type EntityType = 'clients' | 'devis' | 'ordres' | 'factures' | 'paiements' | 'notes';

export interface SyncQueueItem {
  id: string;
  entity: EntityType;
  action: 'create' | 'update' | 'delete';
  data: any;
  tempId: string | null;
  timestamp: number;
  userId: string;
  attempts: number;
  lastError?: string;
  status: 'pending' | 'syncing' | 'failed' | 'success';
}

export interface CachedEntity {
  id: string;
  data: any;
  lastModified: number;
  isOffline: boolean;
  tempId?: string;
}

// Schéma de la base de données IndexedDB
interface OfflineDBSchema extends DBSchema {
  clients: {
    key: string;
    value: CachedEntity;
    indexes: { 'by-lastModified': number; 'by-isOffline': number };
  };
  devis: {
    key: string;
    value: CachedEntity;
    indexes: { 'by-lastModified': number; 'by-isOffline': number };
  };
  ordres: {
    key: string;
    value: CachedEntity;
    indexes: { 'by-lastModified': number; 'by-isOffline': number };
  };
  factures: {
    key: string;
    value: CachedEntity;
    indexes: { 'by-lastModified': number; 'by-isOffline': number };
  };
  paiements: {
    key: string;
    value: CachedEntity;
    indexes: { 'by-lastModified': number; 'by-isOffline': number };
  };
  notes: {
    key: string;
    value: CachedEntity;
    indexes: { 'by-lastModified': number; 'by-isOffline': number };
  };
  sync_queue: {
    key: string;
    value: SyncQueueItem;
    indexes: { 'by-timestamp': number; 'by-status': string; 'by-entity': string };
  };
  metadata: {
    key: string;
    value: { key: string; value: any };
  };
}

const DB_NAME = 'commercial-offline-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<OfflineDBSchema> | null = null;

export async function getDB(): Promise<IDBPDatabase<OfflineDBSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store pour les clients
      if (!db.objectStoreNames.contains('clients')) {
        const clientStore = db.createObjectStore('clients', { keyPath: 'id' });
        clientStore.createIndex('by-lastModified', 'lastModified');
        clientStore.createIndex('by-isOffline', 'isOffline');
      }

      // Store pour les devis
      if (!db.objectStoreNames.contains('devis')) {
        const devisStore = db.createObjectStore('devis', { keyPath: 'id' });
        devisStore.createIndex('by-lastModified', 'lastModified');
        devisStore.createIndex('by-isOffline', 'isOffline');
      }

      // Store pour les ordres de travail
      if (!db.objectStoreNames.contains('ordres')) {
        const ordreStore = db.createObjectStore('ordres', { keyPath: 'id' });
        ordreStore.createIndex('by-lastModified', 'lastModified');
        ordreStore.createIndex('by-isOffline', 'isOffline');
      }

      // Store pour les factures
      if (!db.objectStoreNames.contains('factures')) {
        const factureStore = db.createObjectStore('factures', { keyPath: 'id' });
        factureStore.createIndex('by-lastModified', 'lastModified');
        factureStore.createIndex('by-isOffline', 'isOffline');
      }

      // Store pour les paiements
      if (!db.objectStoreNames.contains('paiements')) {
        const paiementStore = db.createObjectStore('paiements', { keyPath: 'id' });
        paiementStore.createIndex('by-lastModified', 'lastModified');
        paiementStore.createIndex('by-isOffline', 'isOffline');
      }

      // Store pour les notes d'honoraires
      if (!db.objectStoreNames.contains('notes')) {
        const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
        noteStore.createIndex('by-lastModified', 'lastModified');
        noteStore.createIndex('by-isOffline', 'isOffline');
      }

      // Queue de synchronisation
      if (!db.objectStoreNames.contains('sync_queue')) {
        const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
        syncStore.createIndex('by-timestamp', 'timestamp');
        syncStore.createIndex('by-status', 'status');
        syncStore.createIndex('by-entity', 'entity');
      }

      // Métadonnées (dernière sync, version, etc.)
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

// Générer un ID temporaire unique
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Vérifier si un ID est temporaire
export function isTempId(id: string): boolean {
  return typeof id === 'string' && id.startsWith('temp_');
}

// Sauvegarder une entité localement
export async function saveLocally(
  entity: EntityType,
  data: any,
  isOffline: boolean = false
): Promise<void> {
  const db = await getDB();
  const id = data.id?.toString() || generateTempId();
  
  await db.put(entity, {
    id,
    data: { ...data, id },
    lastModified: Date.now(),
    isOffline,
    tempId: isOffline ? id : undefined,
  });
}

// Récupérer une entité depuis le cache local
export async function getFromLocal(
  entity: EntityType,
  id: string
): Promise<any | null> {
  const db = await getDB();
  const cached = await db.get(entity, id);
  return cached?.data || null;
}

// Récupérer toutes les entités d'un type
export async function getAllFromLocal(entity: EntityType): Promise<any[]> {
  const db = await getDB();
  const all = await db.getAll(entity);
  return all.map((item) => item.data);
}

// Récupérer les entités créées hors-ligne
export async function getOfflineEntities(entity: EntityType): Promise<any[]> {
  const db = await getDB();
  const all = await db.getAll(entity);
  return all.filter((item) => item.isOffline).map((item) => item.data);
}

// Supprimer une entité du cache local
export async function deleteFromLocal(entity: EntityType, id: string): Promise<void> {
  const db = await getDB();
  await db.delete(entity, id);
}

// Mettre à jour le cache avec les données du serveur
export async function syncFromServer(entity: EntityType, items: any[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(entity, 'readwrite');
  
  for (const item of items) {
    const id = item.id?.toString();
    if (id) {
      await tx.store.put({
        id,
        data: item,
        lastModified: Date.now(),
        isOffline: false,
      });
    }
  }
  
  await tx.done;
}

// Remplacer un ID temporaire par l'ID réel après synchronisation
export async function replaceTempId(
  entity: EntityType,
  tempId: string,
  realId: string
): Promise<void> {
  const db = await getDB();
  const cached = await db.get(entity, tempId);
  
  if (cached) {
    // Supprimer l'entrée avec l'ID temporaire
    await db.delete(entity, tempId);
    
    // Créer une nouvelle entrée avec l'ID réel
    await db.put(entity, {
      id: realId,
      data: { ...cached.data, id: realId, _wasOffline: true },
      lastModified: Date.now(),
      isOffline: false,
    });
  }
}

// Compter les éléments non synchronisés
export async function countPendingSync(): Promise<number> {
  const db = await getDB();
  const queue = await db.getAllFromIndex('sync_queue', 'by-status', 'pending');
  return queue.length;
}

// Métadonnées
export async function setMetadata(key: string, value: any): Promise<void> {
  const db = await getDB();
  await db.put('metadata', { key, value });
}

export async function getMetadata(key: string): Promise<any> {
  const db = await getDB();
  const item = await db.get('metadata', key);
  return item?.value;
}

// Nettoyer la base de données
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const stores: EntityType[] = ['clients', 'devis', 'ordres', 'factures', 'paiements', 'notes'];
  
  for (const store of stores) {
    await db.clear(store);
  }
  await db.clear('sync_queue');
  await db.clear('metadata');
}

// Exporter pour tests
export { DB_NAME, DB_VERSION };
