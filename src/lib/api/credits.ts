import api from '../api';

// Types
export interface CreditBancaire {
  id: number;
  numero: string;
  objet: string;
  montant_principal: number;
  taux_interet: number;
  montant_interet: number;
  montant_total: number;
  duree_mois: number;
  date_debut: string;
  date_fin: string;
  statut: 'Actif' | 'Soldé' | 'En défaut';
  notes?: string;
  created_at?: string;
  montant_rembourse?: number;
  reste_a_payer?: number;
  banque?: {
    id: number;
    nom: string;
    code?: string;
  };
  echeances?: EcheanceCredit[];
  remboursements?: RemboursementCredit[];
  prochaine_echeance?: EcheanceCredit;
}

export interface EcheanceCredit {
  id: number;
  credit_id: number;
  numero_echeance: number;
  date_echeance: string;
  montant: number;
  montant_capital?: number;
  montant_interet?: number;
  statut: 'En attente' | 'Payée' | 'En retard';
  date_paiement?: string;
}

export interface RemboursementCredit {
  id: number;
  credit_bancaire_id: number;
  echeance_id?: number;
  montant: number;
  mode_paiement: string;
  reference?: string;
  date_remboursement: string;
  notes?: string;
}

export interface CreditStats {
  total_credits_actifs: number;
  total_rembourse: number;
  reste_global: number;
  echeances_en_retard: number;
  nombre_credits_actifs: number;
  total_interets: number;
  taux_remboursement_global: number;
  par_banque: Array<{
    banque_id: number;
    banque_nom: string;
    total: number;
    nombre: number;
    rembourse: number;
  }>;
  par_statut: {
    actif: number;
    solde: number;
    en_defaut: number;
  };
  evolution_mensuelle: Array<{
    mois: number;
    mois_nom: string;
    emprunte: number;
    rembourse: number;
    solde: number;
  }>;
  prochaines_echeances: EcheanceCredit[];
  echeances_retard: EcheanceCredit[];
}

export interface ComparaisonCredit {
  annee: number;
  par_mois: Array<{
    mois: number;
    mois_nom: string;
    emprunte: number;
    rembourse: number;
    solde_restant: number;
    interets: number;
  }>;
  totaux: {
    emprunte: number;
    rembourse: number;
    interets: number;
    reste: number;
  };
}

export interface CreditFilters {
  search?: string;
  statut?: string;
  banque_id?: number;
  per_page?: number;
}

export interface CreateCreditData {
  banque_id: number;
  objet: string;
  montant_principal: number;
  taux_interet: number;
  duree_mois: number;
  date_debut: string;
  notes?: string;
}

export interface CreateRemboursementData {
  echeance_id?: number;
  montant: number;
  mode_paiement: string;
  reference?: string;
  notes?: string;
}

// API
export const creditsApi = {
  getAll: async (filters: CreditFilters = {}): Promise<{ data: CreditBancaire[]; meta: any }> => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.statut) params.append('statut', filters.statut);
    if (filters.banque_id) params.append('banque_id', filters.banque_id.toString());
    if (filters.per_page) params.append('per_page', filters.per_page.toString());
    
    const response = await api.get(`/credits?${params.toString()}`);
    return response.data;
  },

  getById: async (id: number): Promise<CreditBancaire> => {
    const response = await api.get(`/credits/${id}`);
    return response.data.data || response.data;
  },

  create: async (data: CreateCreditData): Promise<CreditBancaire> => {
    const response = await api.post('/credits', data);
    return response.data.data || response.data;
  },

  update: async (id: number, data: Partial<CreditBancaire>): Promise<CreditBancaire> => {
    const response = await api.put(`/credits/${id}`, data);
    return response.data.data || response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/credits/${id}`);
  },

  rembourser: async (id: number, data: CreateRemboursementData): Promise<RemboursementCredit> => {
    const response = await api.post(`/credits/${id}/rembourser`, data);
    return response.data.data || response.data;
  },

  getEcheances: async (id: number): Promise<EcheanceCredit[]> => {
    const response = await api.get(`/credits/${id}/echeances`);
    return response.data.data || response.data;
  },

  getStats: async (annee?: number): Promise<CreditStats> => {
    const params = annee ? `?annee=${annee}` : '';
    const response = await api.get(`/credits/stats${params}`);
    return response.data;
  },

  getDashboard: async (annee?: number): Promise<any> => {
    const params = annee ? `?annee=${annee}` : '';
    const response = await api.get(`/credits/dashboard${params}`);
    return response.data;
  },

  getComparaison: async (annee?: number): Promise<ComparaisonCredit> => {
    const params = annee ? `?annee=${annee}` : '';
    const response = await api.get(`/credits/comparaison${params}`);
    return response.data;
  },
};
