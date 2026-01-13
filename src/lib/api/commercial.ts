import api from '@/lib/api';

// Types
export interface Client {
  id: number;
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
  solde_avoirs?: number;
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
  date: string;
  date_creation: string;
  date_validite: string;
  categorie?: string;
  type_document?: string;
  type_operation?: string;
  type_operation_indep?: string;
  reference_client?: string;
  navire?: string;
  numero_bl?: string;
  bl_numero?: string;
  montant_ht: number;
  montant_tva: number;
  montant_css: number;
  montant_ttc: number;
  tva: number;
  css: number;
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
  date_creation?: string;
  client_id: string;
  client?: Client;
  devis_id?: string;
  type_document: string;
  categorie?: string;
  type_operation?: string;
  type_operation_indep?: string;
  bl_numero?: string;
  numero_bl?: string;
  navire?: string;
  date_arrivee?: string;
  armateur_id?: string;
  transitaire_id?: string;
  representant_id?: string;
  transitaire?: Transitaire;
  montant_ht: number;
  montant_tva: number;
  montant_css: number;
  montant_ttc: number;
  montant_paye?: number;
  taux_tva?: number;
  taux_css?: number;
  statut: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  conteneurs?: any[];
  lots?: any[];
  lignes?: any[];
  primes?: Prime[];
}

export interface Facture {
  id: string;
  numero: string;
  date?: string;
  date_facture: string;
  date_creation?: string;
  date_echeance: string;
  client_id: string;
  client?: Client;
  ordre_id?: string;
  type_document: string;
  categorie?: string;
  bl_numero?: string;
  numero_bl?: string;
  navire?: string;
  armateur_id?: string;
  transitaire_id?: string;
  representant_id?: string;
  transitaire?: Transitaire;
  montant_ht: number;
  montant_tva: number;
  montant_css: number;
  montant_ttc: number;
  montant_paye?: number;
  reste_a_payer?: number;
  taux_tva?: number;
  taux_css?: number;
  statut: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  conteneurs?: any[];
  lots?: any[];
  lignes?: any[];
}

export interface Armateur {
  id: string;
  nom: string;
  code?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Transitaire {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  contact_principal?: string;
  nif?: string;
  rccm?: string;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
  // Primes
  primes_dues?: number;
  primes_payees?: number;
  // Relations chargées depuis show()
  ordres_travail?: OrdreTravail[];
  factures?: Facture[];
  devis?: Devis[];
  primes?: Prime[];
  paiements_primes?: PaiementPrimeGrouped[];
  counts?: {
    devis: number;
    ordres: number;
    factures: number;
  };
}

export interface Prime {
  id: string;
  ordre_id?: string;
  transitaire_id?: string;
  representant_id?: string;
  facture_id?: string;
  montant: number;
  montant_paye?: number;
  reste_a_payer?: number;
  description?: string;
  statut: string;
  ordre?: OrdreTravail;
  facture?: Facture;
  transitaire?: Transitaire;
  representant?: Representant;
  paiements?: PaiementPrime[];
  created_at?: string;
  updated_at?: string;
}

export interface PaiementPrime {
  id: string;
  prime_id?: string;
  montant: number;
  mode_paiement: string;
  reference?: string;
  date?: string;
  date_paiement?: string;
  notes?: string;
  created_at?: string;
}

export interface PaiementPrimeGrouped {
  id: string;
  transitaire_id?: string;
  representant_id?: string;
  montant: number;
  mode_paiement: string;
  reference?: string;
  date?: string;
  notes?: string;
  created_at?: string;
  primes?: Prime[];
}

export interface Representant {
  id: string;
  nom: string;
  prenom?: string;
  nom_complet?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  zone?: string;
  taux_commission?: number;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
  // Totaux calculés des primes
  primes_dues?: number;
  primes_payees?: number;
  // Relations chargées depuis show()
  primes?: Prime[];
  paiements_primes?: PaiementPrimeGrouped[];
  ordres_travail?: OrdreTravail[];
  factures?: Facture[];
  devis?: Devis[];
  counts?: {
    primes: number;
    primes_sum_montant: number;
    ordres?: number;
    factures?: number;
    devis?: number;
  };
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

// Helper to unwrap API responses (handles both { data: ... } and direct object)
const unwrapResponse = <T>(response: any): T => {
  const payload = response.data;
  const result = payload?.data ?? payload;
  if (result === undefined || result === null) {
    throw new Error('API returned undefined data');
  }
  return result as T;
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
export interface OrdresStats {
  total_ordres: number;
  montant_total: number;
  total_paye: number;
  reste_a_payer: number;
  en_cours: number;
  termine: number;
  facture: number;
  annule: number;
  par_categorie: {
    conteneurs: number;
    conventionnel: number;
    operations_independantes: number;
  };
}

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

// Banques API
export interface Banque {
  id: string;
  nom: string;
  code?: string;
  numero_compte?: string;
  rib?: string;
  iban?: string;
  swift?: string;
  solde?: number;
  actif: boolean;
  paiements_count?: number;
  paiements_sum_montant?: number;
}

// Mouvement bancaire unifié (encaissement ou décaissement)
export interface MouvementBancaire {
  id: string;
  type: 'entree' | 'sortie';
  date: string;
  montant: number;
  categorie: string;
  description: string | null;
  tiers: string | null;
  banque: { id: string; nom: string } | null;
  reference: string | null;
  source_type: 'paiement' | 'mouvement';
  source_id: number;
  document_type: 'facture' | 'ordre' | null;
  document_id: string | null;
}

export interface MouvementsBancairesResponse {
  data: MouvementBancaire[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  stats: {
    total_encaissements: number;
    total_decaissements: number;
    nombre_encaissements: number;
    nombre_decaissements: number;
    solde_periode: number;
  };
}

export interface MouvementsBancairesParams {
  banque_id?: string;
  type?: 'entree' | 'sortie';
  search?: string;
  date_debut?: string;
  date_fin?: string;
  page?: number;
  per_page?: number;
}

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

  // Nouvel endpoint unifié pour tous les mouvements bancaires
  getMouvementsUnifies: async (params?: MouvementsBancairesParams): Promise<MouvementsBancairesResponse> => {
    const response = await api.get('/banques/mouvements', { params });
    return response.data;
  },
};

// Paiements API
export interface PaiementData {
  facture_id?: string | number;
  ordre_id?: string | number;
  montant: number;
  mode_paiement: 'Espèces' | 'Chèque' | 'Virement' | 'Mobile Money';
  reference?: string;
  banque_id?: string | number;
  notes?: string;
}

export interface Paiement {
  id: string;
  montant: number;
  mode_paiement: string;
  reference?: string;
  numero_cheque?: string;
  date: string;
  date_paiement?: string;
  notes?: string;
  document_numero?: string;
  document_type?: 'facture' | 'ordre';
  facture_id?: string;
  ordre_id?: string;
  client_id?: string;
  banque_id?: string;
  facture?: Facture;
  ordre?: OrdreTravail;
  client?: Client;
  banque?: Banque;
  created_at?: string;
}

export interface PaiementsParams {
  search?: string;
  type?: 'facture' | 'ordre';
  mode_paiement?: string;
  client_id?: string;
  banque_id?: string;
  date_debut?: string;
  date_fin?: string;
  page?: number;
  per_page?: number;
}

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
  
  // Paiement global pour factures uniquement
  createGlobal: async (data: { 
    client_id: string; 
    montant: number; 
    factures: { id: string; montant: number }[]; 
    mode_paiement: string; 
    reference?: string; 
    banque_id?: string 
  }) => {
    const response = await api.post('/paiements/global', data);
    return response.data;
  },
  
  // Paiement global pour ordres de travail uniquement
  createGlobalOrdres: async (data: { 
    client_id: string; 
    montant: number; 
    ordres: { id: string; montant: number }[]; 
    mode_paiement: string; 
    reference?: string; 
    banque_id?: string 
  }) => {
    const response = await api.post('/paiements/global', data);
    return response.data;
  },
};

// Configuration API
// Mouvements Caisse API
export interface MouvementCaisseData {
  type: 'Entrée' | 'Sortie';
  source?: 'caisse' | 'banque';
  montant: number;
  description: string;
  categorie: string;
  banque_id?: string;
  beneficiaire?: string;
}

export interface MouvementCaisse {
  id: string;
  type: string;
  source: string;
  montant: number;
  description: string;
  categorie: string;
  beneficiaire?: string;
  reference?: string;
  date: string;
  banque_id?: string;
  banque?: Banque;
  user?: { id: string; name: string };
  created_at: string;
}

export const mouvementsCaisseApi = {
  getAll: async (params?: {
    type?: string;
    source?: string;
    banque_id?: string;
    categorie?: string;
    date_debut?: string;
    date_fin?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }) => {
    const response = await api.get('/caisse', { params });
    return response.data;
  },

  create: async (data: MouvementCaisseData) => {
    const response = await api.post('/caisse', data);
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
    prefixe_devis?: string;
    prefixe_ordre?: string;
    prefixe_facture?: string;
    prefixe_avoir?: string;
    format_annee?: boolean;
    prochain_numero_devis?: number;
    prochain_numero_ordre?: number;
    prochain_numero_facture?: number;
    prochain_numero_avoir?: number;
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
export interface CategorieDepense {
  id: string;
  nom: string;
  description?: string;
  type: 'Entrée' | 'Sortie';
  couleur?: string;
  actif: boolean;
  total_depenses?: number;
  nombre_mouvements?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CategorieDepenseData {
  nom: string;
  description?: string;
  type: 'Entrée' | 'Sortie';
  couleur?: string;
  actif?: boolean;
}

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
export interface PayerPrimeData {
  montant: number;
  mode_paiement: string;
  reference?: string;
  notes?: string;
}

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
