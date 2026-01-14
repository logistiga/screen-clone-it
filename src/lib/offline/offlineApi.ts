import api from '@/lib/api';
import { isOnline } from '@/hooks/use-network-status';
import { EntityType, saveLocally, getFromLocal, getAllFromLocal, generateTempId, syncFromServer, deleteFromLocal } from './db';
import { addToSyncQueue } from './syncQueue';

// Obtenir l'ID utilisateur courant (à adapter selon votre auth)
function getCurrentUserId(): string {
  // Essayer de récupérer depuis localStorage ou contexte d'auth
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const parsed = JSON.parse(user);
      return parsed.id?.toString() || 'anonymous';
    } catch {
      return 'anonymous';
    }
  }
  return 'anonymous';
}

// Créer un wrapper pour une entité
export function createOfflineEntityApi<T extends { id?: string | number }>(
  entity: EntityType,
  endpoint: string
) {
  return {
    // GET - Liste toutes les entités
    async getAll(params?: Record<string, any>): Promise<T[]> {
      if (isOnline()) {
        try {
          const response = await api.get(endpoint, { params });
          const items = response.data?.data || response.data || [];
          
          // Mettre en cache
          await syncFromServer(entity, items);
          
          return items;
        } catch (error) {
          console.warn(`[OfflineApi] ${entity} getAll échoué, utilisation du cache`);
          return getAllFromLocal(entity) as Promise<T[]>;
        }
      } else {
        // Mode hors-ligne: retourner le cache
        console.log(`[OfflineApi] ${entity} getAll depuis cache local`);
        return getAllFromLocal(entity) as Promise<T[]>;
      }
    },

    // GET - Récupérer une entité par ID
    async getById(id: string | number): Promise<T | null> {
      const stringId = id.toString();
      
      if (isOnline()) {
        try {
          const response = await api.get(`${endpoint}/${id}`);
          const item = response.data;
          
          // Mettre en cache
          await saveLocally(entity, item, false);
          
          return item;
        } catch (error) {
          console.warn(`[OfflineApi] ${entity} getById échoué, utilisation du cache`);
          return getFromLocal(entity, stringId);
        }
      } else {
        // Mode hors-ligne
        console.log(`[OfflineApi] ${entity} getById depuis cache local`);
        return getFromLocal(entity, stringId);
      }
    },

    // POST - Créer une nouvelle entité
    async create(data: Omit<T, 'id'>): Promise<T> {
      if (isOnline()) {
        try {
          const response = await api.post(endpoint, data);
          const item = response.data;
          
          // Mettre en cache
          await saveLocally(entity, item, false);
          
          return item;
        } catch (error) {
          // Si erreur réseau, passer en mode offline
          if (!navigator.onLine) {
            return this.createOffline(data);
          }
          throw error;
        }
      } else {
        return this.createOffline(data);
      }
    },

    // Création hors-ligne
    async createOffline(data: Omit<T, 'id'>): Promise<T> {
      const tempId = generateTempId();
      const offlineItem = {
        ...data,
        id: tempId,
        _offline: true,
        created_at: new Date().toISOString(),
      } as unknown as T;

      // Sauvegarder localement
      await saveLocally(entity, offlineItem, true);

      // Ajouter à la queue de synchronisation
      await addToSyncQueue({
        entity,
        action: 'create',
        data: offlineItem,
        tempId,
        timestamp: Date.now(),
        userId: getCurrentUserId(),
      });

      console.log(`[OfflineApi] ${entity} créé hors-ligne avec tempId: ${tempId}`);
      
      return offlineItem;
    },

    // PUT - Mettre à jour une entité
    async update(id: string | number, data: Partial<T>): Promise<T> {
      const stringId = id.toString();
      const updatedData = { ...data, id: stringId };

      if (isOnline()) {
        try {
          const response = await api.put(`${endpoint}/${id}`, data);
          const item = response.data;
          
          // Mettre en cache
          await saveLocally(entity, item, false);
          
          return item;
        } catch (error) {
          // Si erreur réseau, passer en mode offline
          if (!navigator.onLine) {
            return this.updateOffline(stringId, updatedData as Partial<T>);
          }
          throw error;
        }
      } else {
        return this.updateOffline(stringId, updatedData as Partial<T>);
      }
    },

    // Mise à jour hors-ligne
    async updateOffline(id: string, data: Partial<T>): Promise<T> {
      // Récupérer l'entité existante du cache
      const existing = await getFromLocal(entity, id);
      const updatedItem = {
        ...existing,
        ...data,
        id,
        _offline: true,
        updated_at: new Date().toISOString(),
      } as T;

      // Mettre à jour le cache local
      await saveLocally(entity, updatedItem, true);

      // Ajouter à la queue de synchronisation
      await addToSyncQueue({
        entity,
        action: 'update',
        data: updatedItem,
        tempId: null,
        timestamp: Date.now(),
        userId: getCurrentUserId(),
      });

      console.log(`[OfflineApi] ${entity} ${id} mis à jour hors-ligne`);
      
      return updatedItem;
    },

    // DELETE - Supprimer une entité
    async delete(id: string | number): Promise<void> {
      const stringId = id.toString();

      if (isOnline()) {
        try {
          await api.delete(`${endpoint}/${id}`);
          
          // Supprimer du cache
          await deleteFromLocal(entity, stringId);
        } catch (error) {
          // Si erreur réseau, passer en mode offline
          if (!navigator.onLine) {
            return this.deleteOffline(stringId);
          }
          throw error;
        }
      } else {
        return this.deleteOffline(stringId);
      }
    },

    // Suppression hors-ligne
    async deleteOffline(id: string): Promise<void> {
      // Marquer comme supprimé dans le cache (au lieu de vraiment supprimer)
      const existing = await getFromLocal(entity, id);
      if (existing) {
        await saveLocally(entity, { ...existing, _deleted: true, _offline: true }, true);
      }

      // Ajouter à la queue de synchronisation
      await addToSyncQueue({
        entity,
        action: 'delete',
        data: { id },
        tempId: null,
        timestamp: Date.now(),
        userId: getCurrentUserId(),
      });

      console.log(`[OfflineApi] ${entity} ${id} marqué pour suppression hors-ligne`);
    },

    // Récupérer les entités non synchronisées
    async getUnsyncedItems(): Promise<T[]> {
      const all = await getAllFromLocal(entity);
      return all.filter((item: any) => item._offline === true) as T[];
    },

    // Vérifier si une entité est hors-ligne
    async isOffline(id: string | number): Promise<boolean> {
      const item = await getFromLocal(entity, id.toString());
      return item?._offline === true;
    },
  };
}

// APIs offline pour chaque entité
export const clientsOfflineApi = createOfflineEntityApi<any>('clients', '/clients');
export const devisOfflineApi = createOfflineEntityApi<any>('devis', '/devis');
export const ordresOfflineApi = createOfflineEntityApi<any>('ordres', '/ordres-travail');
export const facturesOfflineApi = createOfflineEntityApi<any>('factures', '/factures');
export const paiementsOfflineApi = createOfflineEntityApi<any>('paiements', '/paiements');
export const notesOfflineApi = createOfflineEntityApi<any>('notes', '/notes-honoraires');

// Exporter toutes les APIs
export const offlineApis = {
  clients: clientsOfflineApi,
  devis: devisOfflineApi,
  ordres: ordresOfflineApi,
  factures: facturesOfflineApi,
  paiements: paiementsOfflineApi,
  notes: notesOfflineApi,
};
