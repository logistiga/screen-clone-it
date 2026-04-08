import api from '@/lib/api';
import type {
  Banque, MouvementsBancairesParams, MouvementsBancairesResponse,
  PaiementData, PaiementsParams, MouvementCaisseData,
  CategorieDepenseData, Prime, PaginatedResponse, PayerPrimeData,
} from './types';

// Helper to unwrap API responses
const unwrapResponse = <T>(response: any): T => {
  const payload = response.data;
  const result = payload?.data ?? payload;
  if (result === undefined || result === null) {
    throw new Error('API returned undefined data');
  }
  return result as T;
};

// Banques API
export const banquesApi = {
  getAll: async (params?: { actif?: boolean; search?: string }) => {
    const response = await api.get('/banques', { params });
    return unwrapResponse<Banque[]>(response);
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/banques/${id}`);
    return response.data.data || response.data;
  },
  
  create: async (data: Partial<Banque>) => {
    const response = await api.post('/banques', data);
    return response.data.data || response.data;
  },
  
  update: async (id: string, data: Partial<Banque>) => {
    const response = await api.put(`/banques/${id}`, data);
    return response.data.data || response.data;
  },
  
  delete: async (id: string) => {
    await api.delete(`/banques/${id}`);
  },
  
  getStats: async (id: string, params?: { date_debut?: string; date_fin?: string }) => {
    const response = await api.get(`/banques/${id}/stats`, { params });
    return response.data;
  },

  getMouvementsUnifies: async (params?: MouvementsBancairesParams): Promise<MouvementsBancairesResponse> => {
    const response = await api.get('/banques/mouvements', { params });
    return response.data;
  },
};

// Paiements API
export const paiementsApi = {
  getAll: async (params?: PaiementsParams) => {
    const response = await api.get('/paiements', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/paiements/${id}`);
    return response.data.data;
  },

  create: async (data: PaiementData) => {
    const response = await api.post('/paiements', data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/paiements/${id}`);
  },

  getStats: async (params?: { date_debut?: string; date_fin?: string }) => {
    const response = await api.get('/paiements/stats', { params });
    return response.data;
  },
  
  createGlobal: async (data: { 
    client_id: string; montant: number; factures: { id: string; montant: number }[]; 
    mode_paiement: string; reference?: string; banque_id?: string 
  }) => {
    const response = await api.post('/paiements/global', data);
    return response.data;
  },
  
  createGlobalOrdres: async (data: { 
    client_id: string; montant: number; ordres: { id: string; montant: number }[]; 
    mode_paiement: string; reference?: string; banque_id?: string 
  }) => {
    const response = await api.post('/paiements/global', data);
    return response.data;
  },
};

// Mouvements Caisse API
export const mouvementsCaisseApi = {
  getAll: async (params?: {
    type?: string; source?: string; banque_id?: string; categorie?: string;
    date_debut?: string; date_fin?: string; search?: string; page?: number; per_page?: number;
  }) => {
    const response = await api.get('/caisse', { params });
    return response.data;
  },

  create: async (data: MouvementCaisseData) => {
    const response = await api.post('/caisse', data);
    return response.data;
  },

  update: async (id: string, data: Partial<MouvementCaisseData>) => {
    const response = await api.put(`/caisse/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/caisse/${id}`);
  },

  getSolde: async () => {
    const response = await api.get('/caisse/solde');
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/caisse/categories');
    return response.data;
  },
};

// Configuration API
export const configurationApi = {
  get: async () => {
    const response = await api.get('/configuration');
    return response.data.data;
  },
  
  getTaxes: async () => {
    const response = await api.get('/configuration/taxes');
    return response.data;
  },
  
  getNumerotation: async () => {
    const response = await api.get('/configuration/numerotation');
    return response.data;
  },

  updateNumerotation: async (data: {
    prefixe_devis?: string; prefixe_ordre?: string; prefixe_facture?: string; prefixe_avoir?: string;
    format_annee?: boolean; prochain_numero_devis?: number; prochain_numero_ordre?: number;
    prochain_numero_facture?: number; prochain_numero_avoir?: number;
  }) => {
    const response = await api.put('/configuration/numerotation', data);
    return response.data;
  },

  syncCompteurs: async () => {
    const response = await api.post('/configuration/numerotation/sync');
    return response.data;
  },
};

// Categories de dépenses API
export const categoriesDepensesApi = {
  getAll: async (params?: { search?: string; type?: string; actif?: boolean; with_stats?: boolean }) => {
    const response = await api.get('/categories-depenses', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/categories-depenses/${id}`);
    return response.data.data;
  },

  create: async (data: CategorieDepenseData) => {
    const response = await api.post('/categories-depenses', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CategorieDepenseData>) => {
    const response = await api.put(`/categories-depenses/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/categories-depenses/${id}`);
  },

  getMouvements: async (id: string, params?: { date_debut?: string; date_fin?: string; source?: string; page?: number; per_page?: number }) => {
    const response = await api.get(`/categories-depenses/${id}/mouvements`, { params });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/categories-depenses/stats');
    return response.data;
  },
};

// Primes API
export const primesApi = {
  getAll: async (params?: { search?: string; representant_id?: string; transitaire_id?: string; statut?: string; page?: number; per_page?: number }) => {
    const response = await api.get<PaginatedResponse<Prime>>('/primes', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/primes/${id}`);
    return response.data.data || response.data;
  },

  create: async (data: Partial<Prime>) => {
    const response = await api.post('/primes', data);
    return response.data.data || response.data;
  },

  update: async (id: string, data: Partial<Prime>) => {
    const response = await api.put(`/primes/${id}`, data);
    return response.data.data || response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/primes/${id}`);
  },

  payer: async (id: string, data: PayerPrimeData) => {
    const response = await api.post(`/primes/${id}/payer`, data);
    return response.data;
  },

  getStats: async (params?: { date_debut?: string; date_fin?: string }) => {
    const response = await api.get('/primes/stats', { params });
    return response.data;
  },
};
