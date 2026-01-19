import api from '../api';

// Types
export interface Prevision {
  id: number;
  type: 'recette' | 'depense';
  categorie: string;
  description?: string;
  montant_prevu: number;
  realise_caisse: number;
  realise_banque: number;
  montant_realise: number;
  ecart: number;
  taux_realisation: number;
  mois: number;
  mois_nom: string;
  annee: number;
  periode: string;
  statut: 'en_cours' | 'atteint' | 'depasse' | 'non_atteint';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StatsMensuelles {
  periode: {
    mois: number;
    mois_nom: string;
    annee: number;
  };
  synthese: {
    recettes: {
      prevu: number;
      realise: number;
      caisse: number;
      banque: number;
      ecart: number;
      taux: number;
    };
    depenses: {
      prevu: number;
      realise: number;
      caisse: number;
      banque: number;
      ecart: number;
      taux: number;
    };
    solde_prevu: number;
    benefice: number;
    ecart_global: number;
    situation: 'beneficiaire' | 'deficitaire';
    dans_budget: boolean;
  };
  details: {
    recettes: DetailCategorie[];
    depenses: DetailCategorie[];
  };
  alertes: { type: string; message: string }[];
  nb_previsions: number;
}

export interface DetailCategorie {
  id: number;
  categorie: string;
  montant_prevu: number;
  realise_caisse: number;
  realise_banque: number;
  montant_realise: number;
  taux: number;
  ecart: number;
  statut: string;
}

export interface Historique {
  annee: number;
  historique: HistoriqueMois[];
  totaux: {
    recettes_prevues: number;
    recettes_realisees: number;
    depenses_prevues: number;
    depenses_realisees: number;
    benefice_total: number;
    solde_prevu_total: number;
  };
}

export interface HistoriqueMois {
  mois: number;
  mois_nom: string;
  recettes_prevues: number;
  recettes_realisees: number;
  depenses_prevues: number;
  depenses_realisees: number;
  benefice: number;
  solde_prevu: number;
  nb_previsions: number;
}

export interface Categories {
  recette: string[];
  depense: string[];
}

export interface CreatePrevisionData {
  type: 'recette' | 'depense';
  categorie: string;
  description?: string;
  montant_prevu: number;
  mois: number;
  annee: number;
  notes?: string;
}

export interface UpdatePrevisionData {
  type?: 'recette' | 'depense';
  categorie?: string;
  description?: string;
  montant_prevu?: number;
  mois?: number;
  annee?: number;
  statut?: string;
  notes?: string;
}

export interface PrevisionFilters {
  type?: string;
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

  // Stats mensuelles détaillées (nouvel endpoint principal)
  getStatsMensuelles: async (annee: number, mois: number): Promise<StatsMensuelles> => {
    const response = await api.get(`/previsions/stats-mensuelles?annee=${annee}&mois=${mois}`);
    return response.data;
  },

  // Historique annuel
  getHistorique: async (annee: number): Promise<Historique> => {
    const response = await api.get(`/previsions/historique?annee=${annee}`);
    return response.data;
  },

  // Export pour PDF
  getExportMois: async (annee: number, mois: number): Promise<any> => {
    const response = await api.get(`/previsions/export-mois?annee=${annee}&mois=${mois}`);
    return response.data;
  },

  // Catégories disponibles
  getCategories: async (): Promise<Categories> => {
    const response = await api.get('/previsions/categories');
    return response.data;
  },

  // Synchroniser les réalisés
  syncRealise: async (annee: number, mois: number): Promise<any> => {
    const response = await api.post('/previsions/sync-realise', { annee, mois });
    return response.data;
  },
};
