import api from '@/lib/api';
import type { Client, Devis, OrdreTravail, Facture, PaginatedResponse, OrdresStats } from './types';

// Helper to unwrap API responses (handles both { data: ... } and direct object)
const unwrapResponse = <T>(response: any): T => {
  const payload = response.data;
  const result = payload?.data ?? payload;
  if (result === undefined || result === null) {
    throw new Error('API returned undefined data');
  }
  return result as T;
};

// Clients API
export const clientsApi = {
  getAll: async (params?: { search?: string; page?: number; per_page?: number }) => {
    const response = await api.get<PaginatedResponse<Client>>('/clients', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/clients/${id}`);
    const payload = response.data;
    return (payload?.data ?? payload) as Client;
  },
  
  create: async (data: Partial<Client>) => {
    const response = await api.post('/clients', data);
    const payload = response.data;
    return (payload?.data ?? payload) as Client;
  },
  
  update: async (id: string, data: Partial<Client>) => {
    const response = await api.put(`/clients/${id}`, data);
    const payload = response.data;
    return (payload?.data ?? payload) as Client;
  },
  
  delete: async (id: string) => {
    await api.delete(`/clients/${id}`);
  },
};

// Devis API
export const devisApi = {
  getAll: async (params?: { search?: string; statut?: string; client_id?: string; date_debut?: string; date_fin?: string; page?: number; per_page?: number }) => {
    const response = await api.get<PaginatedResponse<Devis>>('/devis', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/devis/${id}`);
    return unwrapResponse<Devis>(response);
  },
  
  create: async (data: any) => {
    const response = await api.post('/devis', data);
    return unwrapResponse<Devis>(response);
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/devis/${id}`, data);
    return unwrapResponse<Devis>(response);
  },
  
  delete: async (id: string) => {
    await api.delete(`/devis/${id}`);
  },
  
  convertToOrdre: async (id: string) => {
    const response = await api.post<{ data: OrdreTravail; message: string }>(`/devis/${id}/convert-ordre`);
    return response.data;
  },
  
  convertToFacture: async (id: string) => {
    const response = await api.post<{ data: Facture; message: string }>(`/devis/${id}/convert-facture`);
    return response.data;
  },
  
  duplicate: async (id: string) => {
    const response = await api.post(`/devis/${id}/duplicate`);
    return unwrapResponse<Devis>(response);
  },
  
  sendEmail: async (id: string, data: { destinataire: string; sujet: string; message: string }) => {
    const response = await api.post(`/devis/${id}/send-email`, data);
    return response.data;
  },
};

// Ordres de Travail API
export const ordresApi = {
  getAll: async (params?: { search?: string; statut?: string; categorie?: string; client_id?: string; date_debut?: string; date_fin?: string; page?: number; per_page?: number }) => {
    const response = await api.get<PaginatedResponse<OrdreTravail>>('/ordres-travail', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/ordres-travail/${id}`);
    const payload = response.data;
    return (payload?.data ?? payload) as OrdreTravail;
  },
  
  getStats: async (params?: { search?: string; statut?: string; categorie?: string; client_id?: string; date_debut?: string; date_fin?: string }) => {
    const response = await api.get<OrdresStats>('/ordres-travail/stats', { params });
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/ordres-travail', data);
    const payload = response.data;
    return (payload?.data ?? payload) as OrdreTravail;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/ordres-travail/${id}`, data);
    const payload = response.data;
    return (payload?.data ?? payload) as OrdreTravail;
  },
  
  delete: async (id: string) => {
    await api.delete(`/ordres-travail/${id}`);
  },
  
  convertToFacture: async (id: string) => {
    const response = await api.post<{ data: Facture; message: string }>(`/ordres-travail/${id}/convert-facture`);
    return response.data;
  },
  
  checkConteneur: async (numero: string) => {
    const response = await api.get<{
      exists: boolean;
      message: string;
      details?: { ordre_numero: string; ordre_date: string; client: string };
    }>('/ordres-travail/check-conteneur', { params: { numero } });
    return response.data;
  },
  
  checkBL: async (numero: string) => {
    const response = await api.get<{
      exists: boolean;
      message: string;
      details?: { ordre_numero: string; ordre_date: string; client: string };
    }>('/ordres-travail/check-bl', { params: { numero } });
    return response.data;
  },
  
  getDescriptionSuggestions: async (search?: string) => {
    const response = await api.get<{ suggestions: string[] }>('/ordres-travail/description-suggestions', { params: { search } });
    return response.data.suggestions;
  },
};

// Factures API
export const facturesApi = {
  getAll: async (params?: { search?: string; statut?: string; client_id?: string; date_debut?: string; date_fin?: string; page?: number; per_page?: number }) => {
    const response = await api.get<PaginatedResponse<Facture>>('/factures', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/factures/${id}`);
    const payload = response.data;
    return (payload?.data ?? payload) as Facture;
  },
  
  create: async (data: any) => {
    const response = await api.post('/factures', data);
    const payload = response.data;
    return (payload?.data ?? payload) as Facture;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/factures/${id}`, data);
    const payload = response.data;
    return (payload?.data ?? payload) as Facture;
  },
  
  delete: async (id: string) => {
    await api.delete(`/factures/${id}`);
  },
  
  annuler: async (id: string, data: { motif: string; avoir?: boolean }) => {
    const response = await api.post(`/factures/${id}/annuler`, data);
    return response.data;
  },
  
  duplicate: async (id: string) => {
    const response = await api.post(`/factures/${id}/duplicate`);
    const payload = response.data;
    return (payload?.data ?? payload) as Facture;
  },
  
  sendEmail: async (id: string, data: { destinataire: string; sujet: string; message: string }) => {
    const response = await api.post(`/factures/${id}/send-email`, data);
    return response.data;
  },
  
  getImpayes: async (clientId?: string) => {
    const response = await api.get<{ data: Facture[] }>('/factures/impayes', { params: { client_id: clientId } });
    const payload = response.data;
    return (payload?.data ?? payload) as Facture[];
  },
};
