import api from '@/lib/api';

export interface SyncResult {
  success: boolean;
  created?: number;
  updated?: number;
  total?: number;
  nouveaux?: number;
  mis_a_jour?: number;
  message?: string;
}

export async function syncArmateursOps(): Promise<SyncResult> {
  const response = await api.post('/sync-diagnostic/sync-armateurs');
  return response.data as SyncResult;
}

export async function syncConteneursOps(): Promise<SyncResult> {
  const response = await api.post('/sync-diagnostic/sync-conteneurs');
  return response.data as SyncResult;
}
