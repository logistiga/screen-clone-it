import api from '../api';

// Types
export interface Prevision {
  id: number;
  type: 'recette' | 'depense';
  source: 'caisse' | 'banque';
  categorie: string;
  description?: string;
  montant_prevu: number;
  montant_realise: number;
  ecart: number;
  taux_realisation: number;
  mois: number;
  mois_nom: string;
  annee: number;
  periode: string;
  date_prevue?: string;
  statut: 'en_cours' | 'atteint' | 'depasse' | 'non_atteint';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PrevisionStats {
  annee: number;
  stats: {
    recettes: {
      caisse: { prevu: number; realise: number };
      banque: { prevu: number; realise: number };
    };
    depenses: {
      caisse: { prevu: number; realise: number };
      banque: { prevu: number; realise: number };
    };
  };
  par_mois: Array<{
    mois: number;
    type: string;
    source: string;
    prevu: number;
    realise: number;
  }>;
  par_categorie: Array<{
    categorie: string;
    type: string;
    source: string;
    prevu: number;
    realise: number;
  }>;
  total_prevu: number;
  total_realise: number;
  taux_global: number;
  compteurs: {
    en_cours: number;
    atteint: number;
    depasse: number;
    non_atteint: number;
  };
}

export interface ComparaisonMois {
  mois: number;
  mois_nom: string;
  recettes: {
    caisse: { prevu: number; realise: number };
    banque: { prevu: number; realise: number };
  };
  depenses: {
    caisse: { prevu: number; realise: number };
    banque: { prevu: number; realise: number };
  };
}

export interface ComparaisonData {
  annee: number;
  comparaison: ComparaisonMois[];
  reel_caisse: Record<number, { entrees: number; sorties: number }>;
  reel_banque: Record<number, { entrees: number; sorties: number }>;
}

export interface Categories {
  recette: string[];
  depense: string[];
}

export interface CreatePrevisionData {
  type: 'recette' | 'depense';
  source: 'caisse' | 'banque';
  categorie: string;
  description?: string;
  montant_prevu: number;
  mois: number;
  annee: number;
  date_prevue?: string;
  notes?: string;
  banque_id?: number;
}

export interface UpdatePrevisionData {
  type?: 'recette' | 'depense';
  source?: 'caisse' | 'banque';
  categorie?: string;
  description?: string;
  montant_prevu?: number;
  montant_realise?: number;
  mois?: number;
  annee?: number;
  statut?: string;
  notes?: string;
}

export interface PrevisionFilters {
  type?: string;
  source?: string;
  statut?: string;
  mois?: number;
  annee?: number;
  per_page?: number;
}

// API
export const previsionsApi = {
  getAll: async (filters: PrevisionFilters = {}): Promise<{ data: Prevision[]; meta: any }> => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.source) params.append('source', filters.source);
    if (filters.statut) params.append('statut', filters.statut);
    if (filters.mois) params.append('mois', filters.mois.toString());
    if (filters.annee) params.append('annee', filters.annee.toString());
    if (filters.per_page) params.append('per_page', filters.per_page.toString());
    
    const response = await api.get(`/previsions?${params.toString()}`);
    return response.data;
  },

  getById: async (id: number): Promise<Prevision> => {
    const response = await api.get(`/previsions/${id}`);
    return response.data;
  },

  create: async (data: CreatePrevisionData): Promise<Prevision> => {
    const response = await api.post('/previsions', data);
    return response.data;
  },

  update: async (id: number, data: UpdatePrevisionData): Promise<Prevision> => {
    const response = await api.put(`/previsions/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/previsions/${id}`);
  },

  updateRealise: async (id: number, montant: number, mode: 'ajouter' | 'remplacer' = 'ajouter'): Promise<Prevision> => {
    const response = await api.patch(`/previsions/${id}/realise`, { montant, mode });
    return response.data;
  },

  getStats: async (annee?: number): Promise<PrevisionStats> => {
    const params = annee ? `?annee=${annee}` : '';
    const response = await api.get(`/previsions/stats${params}`);
    return response.data;
  },

  getCategories: async (): Promise<Categories> => {
    const response = await api.get('/previsions/categories');
    return response.data;
  },

  getComparaison: async (annee?: number, mois?: number, source?: string): Promise<ComparaisonData> => {
    const params = new URLSearchParams();
    if (annee) params.append('annee', annee.toString());
    if (mois) params.append('mois', mois.toString());
    if (source) params.append('source', source);
    
    const response = await api.get(`/previsions/comparaison?${params.toString()}`);
    return response.data;
  },

  syncRealise: async (annee: number, mois: number): Promise<any> => {
    const response = await api.post('/previsions/sync-realise', { annee, mois });
    return response.data;
  },
};
