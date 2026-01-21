import api from '@/lib/api';

// Types pour une taxe
export interface Taxe {
  id: number;
  code: string;
  nom: string;
  taux: number;
  description: string | null;
  obligatoire: boolean;
  active: boolean;
  ordre: number;
  created_at?: string;
  updated_at?: string;
}

export interface TaxeFormData {
  code: string;
  nom: string;
  taux: number;
  description?: string | null;
  obligatoire?: boolean;
  active?: boolean;
}

// Types pour les angles mensuels (compatibilité legacy avec tva/css)
export interface AngleTaxe {
  type_taxe: string;
  taux: number;
  montant_ht_total: number;
  montant_taxe_total: number;
  montant_exonere: number;
  nombre_documents: number;
  nombre_exonerations: number;
  cloture: boolean;
  progression: number | null;
}

export interface MoisCourantData {
  annee: number;
  mois: number;
  nom_mois: string;
  angles: {
    tva: AngleTaxe;
    css: AngleTaxe;
  };
  total_taxes_mois: number;
}

export interface HistoriqueMoisData {
  mois: number;
  nom_mois: string;
  tva: {
    montant_ht: number;
    montant_taxe: number;
    montant_exonere: number;
    docs: number;
    cloture: boolean;
  } | null;
  css: {
    montant_ht: number;
    montant_taxe: number;
    montant_exonere: number;
    docs: number;
    cloture: boolean;
  } | null;
  total_taxes: number;
}

export interface HistoriqueAnnuelData {
  annee: number;
  historique: HistoriqueMoisData[];
  cumul: {
    tva: {
      total_ht: number;
      total_taxe: number;
      total_exonere: number;
      total_docs: number;
      total_exonerations: number;
    } | null;
    css: {
      total_ht: number;
      total_taxe: number;
      total_exonere: number;
      total_docs: number;
      total_exonerations: number;
    } | null;
    total_taxes: number;
  };
}

// API Client pour CRUD des taxes
export const taxesApi = {
  // ====== CRUD Taxes ======
  
  // Lister toutes les taxes
  getAll: async (activeOnly?: boolean): Promise<{ data: Taxe[]; total: number }> => {
    const params = activeOnly !== undefined ? { active: activeOnly } : undefined;
    const response = await api.get('/taxes', { params });
    return response.data;
  },

  // Récupérer les taxes actives (pour formulaires)
  getActives: async (): Promise<{ data: Taxe[] }> => {
    const response = await api.get('/taxes/actives');
    return response.data;
  },

  // Récupérer une taxe
  getById: async (id: number): Promise<{ data: Taxe }> => {
    const response = await api.get(`/taxes/${id}`);
    return response.data;
  },

  // Créer une taxe
  create: async (data: TaxeFormData): Promise<{ message: string; data: Taxe }> => {
    const response = await api.post('/taxes', data);
    return response.data;
  },

  // Mettre à jour une taxe
  update: async (id: number, data: Partial<TaxeFormData>): Promise<{ message: string; data: Taxe }> => {
    const response = await api.put(`/taxes/${id}`, data);
    return response.data;
  },

  // Supprimer une taxe
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/taxes/${id}`);
    return response.data;
  },

  // Réordonner les taxes
  reorder: async (ordres: { id: number; ordre: number }[]): Promise<{ message: string }> => {
    const response = await api.post('/taxes/reorder', { ordres });
    return response.data;
  },

  // Activer/désactiver une taxe
  toggleActive: async (id: number): Promise<{ message: string; data: Taxe }> => {
    const response = await api.post(`/taxes/${id}/toggle-active`);
    return response.data;
  },

  // ====== Angles mensuels ======
  
  // Récupérer les angles du mois courant
  getMoisCourant: async (): Promise<MoisCourantData> => {
    const response = await api.get('/taxes-mensuelles/mois-courant');
    return response.data;
  },

  // Récupérer l'historique annuel
  getHistorique: async (annee?: number): Promise<HistoriqueAnnuelData> => {
    const response = await api.get('/taxes-mensuelles/historique', {
      params: annee ? { annee } : undefined,
    });
    return response.data;
  },

  // Recalculer les taxes d'un mois
  recalculer: async (annee: number, mois: number): Promise<void> => {
    await api.post('/taxes-mensuelles/recalculer', { annee, mois });
  },

  // Clôturer un mois
  cloturerMois: async (annee: number, mois: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/taxes-mensuelles/cloturer-mois', { annee, mois });
    return response.data;
  },
};

export default taxesApi;
