import api from '@/lib/api';

export interface CreatePaiementFournisseurPayload {
  fournisseur: string;
  reference: string;
  description?: string;
  montant_total: number;
  date_facture: string;
}

export interface AvancePaiementFournisseurPayload {
  montant: number;
  mode_paiement: string;
  reference?: string;
  notes?: string;
}

export async function fetchPaiementsFournisseurs<T = unknown>(
  params: Record<string, string | number>,
): Promise<T> {
  const response = await api.get('/paiements-fournisseurs', { params });
  return response.data as T;
}

export async function fetchPaiementsFournisseursStats<T = unknown>(): Promise<T> {
  const response = await api.get('/paiements-fournisseurs/stats');
  return response.data as T;
}

export async function fetchPaiementFournisseurDetail<T = unknown>(id: number | string): Promise<T> {
  const response = await api.get(`/paiements-fournisseurs/${id}`);
  return response.data as T;
}

export async function createPaiementFournisseur<T = unknown>(
  payload: CreatePaiementFournisseurPayload,
): Promise<T> {
  const response = await api.post('/paiements-fournisseurs', payload);
  return response.data as T;
}

export async function avancerPaiementFournisseur<T = unknown>(
  id: number | string,
  payload: AvancePaiementFournisseurPayload,
): Promise<T> {
  const response = await api.post(`/paiements-fournisseurs/${id}/avancer`, payload);
  return response.data as T;
}
