import api from '@/lib/api';

// Types
export interface Client {
  id: string;
  code: string;
  nom: string;
  type: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  pays: string;
  nif?: string;
  rccm?: string;
  limite_credit: number;
  solde: number;
  notes?: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Devis {
  id: string;
  numero: string;
  client_id: string;
  client?: Client;
  transitaire_id?: string;
  representant_id?: string;
  armateur_id?: string;
  date_devis: string;
  date_validite: string;
  reference_client?: string;
  navire?: string;
  voyage?: string;
  port_chargement?: string;
  port_dechargement?: string;
  sous_total: number;
  tva: number;
  css: number;
  total_ttc: number;
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire' | 'converti';
  conditions?: string;
  notes?: string;
  conteneurs?: any[];
  lots?: any[];
  lignes?: any[];
  created_at: string;
  updated_at: string;
}

export interface OrdreTravail {
  id: string;
  numero: string;
  date: string;
  client_id: string;
  client?: Client;
  devis_id?: string;
  type_document: string;
  bl_numero?: string;
  navire?: string;
  date_arrivee?: string;
  transitaire_id?: string;
  transitaire?: Transitaire;
  montant_ht: number;
  montant_tva: number;
  montant_css: number;
  montant_ttc: number;
  montant_paye?: number;
  taux_tva: number;
  taux_css: number;
  statut: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  conteneurs?: any[];
  lots?: any[];
  lignes?: any[];
}

export interface Facture {
  id: string;
  numero: string;
  client_id: string;
  client?: Client;
  ordre_id?: string;
  categorie: string;
  type_operation: string;
  numero_bl?: string;
  armateur_id?: string;
  transitaire_id?: string;
  representant_id?: string;
  montant_ht: number;
  tva: number;
  css: number;
  montant_ttc: number;
  montant_paye: number;
  statut: 'emise' | 'payee' | 'partielle' | 'impayee' | 'annulee';
  notes?: string;
  date_creation: string;
  date_echeance: string;
  conteneurs?: any[];
  lots?: any[];
  lignes?: any[];
}

export interface Armateur {
  id: string;
  nom: string;
  code: string;
  email?: string;
  telephone?: string;
  actif: boolean;
}

export interface Transitaire {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  actif: boolean;
}

export interface Representant {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
  zone?: string;
  actif: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// Clients API
export const clientsApi = {
  getAll: async (params?: { search?: string; page?: number; per_page?: number }) => {
    const response = await api.get<PaginatedResponse<Client>>('/clients', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get<{ data: Client }>(`/clients/${id}`);
    return response.data.data;
  },
  
  create: async (data: Partial<Client>) => {
    const response = await api.post<{ data: Client }>('/clients', data);
    return response.data.data;
  },
  
  update: async (id: string, data: Partial<Client>) => {
    const response = await api.put<{ data: Client }>(`/clients/${id}`, data);
    return response.data.data;
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
    const response = await api.get<{ data: Devis }>(`/devis/${id}`);
    return response.data.data;
  },
  
  create: async (data: any) => {
    const response = await api.post<{ data: Devis }>('/devis', data);
    return response.data.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put<{ data: Devis }>(`/devis/${id}`, data);
    return response.data.data;
  },
  
  delete: async (id: string) => {
    await api.delete(`/devis/${id}`);
  },
  
  convertToOrdre: async (id: string) => {
    const response = await api.post<{ data: OrdreTravail; message: string }>(`/devis/${id}/convert-to-ordre`);
    return response.data;
  },
  
  duplicate: async (id: string) => {
    const response = await api.post<{ data: Devis }>(`/devis/${id}/duplicate`);
    return response.data.data;
  },
  
  sendEmail: async (id: string, data: { destinataire: string; sujet: string; message: string }) => {
    const response = await api.post(`/devis/${id}/send-email`, data);
    return response.data;
  },
};

// Ordres de Travail API
export const ordresApi = {
  getAll: async (params?: { search?: string; statut?: string; client_id?: string; date_debut?: string; date_fin?: string; page?: number; per_page?: number }) => {
    const response = await api.get<PaginatedResponse<OrdreTravail>>('/ordres', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get<{ data: OrdreTravail }>(`/ordres/${id}`);
    return response.data.data;
  },
  
  create: async (data: any) => {
    const response = await api.post<{ data: OrdreTravail }>('/ordres', data);
    return response.data.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put<{ data: OrdreTravail }>(`/ordres/${id}`, data);
    return response.data.data;
  },
  
  delete: async (id: string) => {
    await api.delete(`/ordres/${id}`);
  },
  
  convertToFacture: async (id: string) => {
    const response = await api.post<{ data: Facture; message: string }>(`/ordres/${id}/convert-to-facture`);
    return response.data;
  },
};

// Factures API
export const facturesApi = {
  getAll: async (params?: { search?: string; statut?: string; client_id?: string; date_debut?: string; date_fin?: string; page?: number; per_page?: number }) => {
    const response = await api.get<PaginatedResponse<Facture>>('/factures', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get<{ data: Facture }>(`/factures/${id}`);
    return response.data.data;
  },
  
  create: async (data: any) => {
    const response = await api.post<{ data: Facture }>('/factures', data);
    return response.data.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put<{ data: Facture }>(`/factures/${id}`, data);
    return response.data.data;
  },
  
  delete: async (id: string) => {
    await api.delete(`/factures/${id}`);
  },
  
  annuler: async (id: string, data: { motif: string; avoir?: boolean }) => {
    const response = await api.post(`/factures/${id}/annuler`, data);
    return response.data;
  },
  
  duplicate: async (id: string) => {
    const response = await api.post<{ data: Facture }>(`/factures/${id}/duplicate`);
    return response.data.data;
  },
  
  sendEmail: async (id: string, data: { destinataire: string; sujet: string; message: string }) => {
    const response = await api.post(`/factures/${id}/send-email`, data);
    return response.data;
  },
  
  getImpayes: async (clientId?: string) => {
    const response = await api.get<{ data: Facture[] }>('/factures/impayes', { params: { client_id: clientId } });
    return response.data.data;
  },
};

// Armateurs API
export const armateursApi = {
  getAll: async () => {
    const response = await api.get<{ data: Armateur[] }>('/armateurs');
    return response.data.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get<{ data: Armateur }>(`/armateurs/${id}`);
    return response.data.data;
  },
  
  create: async (data: Partial<Armateur>) => {
    const response = await api.post<{ data: Armateur }>('/armateurs', data);
    return response.data.data;
  },
  
  update: async (id: string, data: Partial<Armateur>) => {
    const response = await api.put<{ data: Armateur }>(`/armateurs/${id}`, data);
    return response.data.data;
  },
  
  delete: async (id: string) => {
    await api.delete(`/armateurs/${id}`);
  },
};

// Transitaires API
export const transitairesApi = {
  getAll: async () => {
    const response = await api.get<{ data: Transitaire[] }>('/transitaires');
    return response.data.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get<{ data: Transitaire }>(`/transitaires/${id}`);
    return response.data.data;
  },
  
  create: async (data: Partial<Transitaire>) => {
    const response = await api.post<{ data: Transitaire }>('/transitaires', data);
    return response.data.data;
  },
  
  update: async (id: string, data: Partial<Transitaire>) => {
    const response = await api.put<{ data: Transitaire }>(`/transitaires/${id}`, data);
    return response.data.data;
  },
  
  delete: async (id: string) => {
    await api.delete(`/transitaires/${id}`);
  },
};

// Representants API
export const representantsApi = {
  getAll: async () => {
    const response = await api.get<{ data: Representant[] }>('/representants');
    return response.data.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get<{ data: Representant }>(`/representants/${id}`);
    return response.data.data;
  },
  
  create: async (data: Partial<Representant>) => {
    const response = await api.post<{ data: Representant }>('/representants', data);
    return response.data.data;
  },
  
  update: async (id: string, data: Partial<Representant>) => {
    const response = await api.put<{ data: Representant }>(`/representants/${id}`, data);
    return response.data.data;
  },
  
  delete: async (id: string) => {
    await api.delete(`/representants/${id}`);
  },
};

// Paiements API
export const paiementsApi = {
  create: async (data: { facture_id?: string; ordre_id?: string; montant: number; mode_paiement: string; reference?: string; notes?: string }) => {
    const response = await api.post('/paiements', data);
    return response.data;
  },
  
  createGlobal: async (data: { client_id: string; factures: { facture_id: string; montant: number }[]; mode_paiement: string; reference?: string }) => {
    const response = await api.post('/paiements/global', data);
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
};
