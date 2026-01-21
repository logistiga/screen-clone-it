import api from '@/lib/api';

// Types
export interface TaxeConfig {
  id: string;
  code: string;
  nom: string;
  taux: number;
  description: string;
  obligatoire: boolean;
  active: boolean;
}

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

// API Client
export const taxesApi = {
  // Récupérer la configuration des taxes
  getConfig: async (): Promise<{ data: TaxeConfig[]; taux_tva: number; taux_css: number }> => {
    const response = await api.get('/taxes/config');
    return response.data;
  },

  // Mettre à jour les taux de taxes
  updateConfig: async (data: {
    taux_tva: number;
    taux_css: number;
    tva_actif?: boolean;
    css_actif?: boolean;
  }): Promise<void> => {
    await api.put('/taxes/config', data);
  },

  // Récupérer les angles du mois courant
  getMoisCourant: async (): Promise<MoisCourantData> => {
    const response = await api.get('/taxes/mois-courant');
    return response.data;
  },

  // Récupérer l'historique annuel
  getHistorique: async (annee?: number): Promise<HistoriqueAnnuelData> => {
    const response = await api.get('/taxes/historique', {
      params: annee ? { annee } : undefined,
    });
    return response.data;
  },

  // Recalculer les taxes d'un mois
  recalculer: async (annee: number, mois: number): Promise<void> => {
    await api.post('/taxes/recalculer', { annee, mois });
  },

  // Clôturer un mois
  cloturerMois: async (annee: number, mois: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/taxes/cloturer-mois', { annee, mois });
    return response.data;
  },
};

export default taxesApi;
