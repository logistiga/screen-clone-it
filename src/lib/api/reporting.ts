import api from '../api';

// ============ TYPES ============

export interface ChiffreAffairesData {
  annee: number;
  mois: number | null;
  mensuel: {
    mois: number;
    label: string;
    total_ht: number;
    total_tva: number;
    total_css: number;
    total_ttc: number;
    nb_factures: number;
  }[];
  total_annuel: {
    total_ht: number;
    total_tva: number;
    total_css: number;
    total_ttc: number;
    nb_factures: number;
  };
}

export interface RentabiliteData {
  annee: number;
  chiffre_affaires: number;
  charges_exploitation: number;
  charges_financieres: number;
  commissions: number;
  marge_brute: number;
  resultat_net: number;
  taux_marge: number;
  mensuel: {
    mois: number;
    label: string;
    ca: number;
    charges: number;
    marge: number;
  }[];
}

export interface CreancesData {
  total_creances: number;
  nb_factures_impayees: number;
  age_moyen: number;
  par_tranche: {
    tranche: string;
    montant: number;
    nb_factures: number;
  }[];
  top_debiteurs: {
    client_id: number;
    client_nom: string;
    montant_du: number;
    nb_factures: number;
    plus_ancienne: string;
  }[];
}

export interface TresorerieData {
  date_debut: string;
  date_fin: string;
  solde_initial: number;
  solde_final: number;
  total_entrees: number;
  total_sorties: number;
  mouvements_quotidiens: {
    date: string;
    entrees: number;
    sorties: number;
    solde: number;
  }[];
  par_categorie: {
    categorie: string;
    entrees: number;
    sorties: number;
  }[];
}

export interface ComparatifData {
  annee1: number;
  annee2: number;
  ca_annee1: number;
  ca_annee2: number;
  variation_ca: number;
  nb_factures_annee1: number;
  nb_factures_annee2: number;
  variation_factures: number;
  nb_clients_annee1: number;
  nb_clients_annee2: number;
  variation_clients: number;
}

export interface ActiviteClientsData {
  date_debut: string;
  date_fin: string;
  total_clients: number;
  clients_actifs: number;
  top_clients: {
    client_id: number;
    client_nom: string;
    ca_total: number;
    nb_factures: number;
    paiements: number;
    solde_du: number;
  }[];
}

export interface StatistiquesDocumentsData {
  annee: number;
  devis: {
    total: number;
    brouillon: number;
    envoye: number;
    accepte: number;
    refuse: number;
    expire: number;
    taux_conversion: number;
  };
  ordres: {
    total: number;
    en_cours: number;
    termine: number;
    facture: number;
    taux_facturation: number;
  };
  factures: {
    total: number;
    brouillon: number;
    validee: number;
    partiellement_payee: number;
    payee: number;
    annulee: number;
    taux_recouvrement: number;
  };
}

export interface TableauDeBordData {
  annee: number;
  kpis: {
    ca_total: number;
    ca_mois_courant: number;
    creances_totales: number;
    taux_recouvrement: number;
    nb_factures: number;
    nb_ordres: number;
    nb_devis: number;
    nb_clients: number;
  };
  evolution_mensuelle: {
    mois: string;
    ca: number;
    encaissements: number;
  }[];
  alertes: {
    type: string;
    message: string;
    count: number;
  }[];
}

// ============ API CALLS REPORTING ============

export const reportingApi = {
  // Tableau de bord
  getTableauDeBord: async (annee?: number): Promise<TableauDeBordData> => {
    const params = annee ? { annee } : {};
    const response = await api.get('/reporting', { params });
    return response.data;
  },

  // Chiffre d'affaires
  getChiffreAffaires: async (annee?: number, mois?: number): Promise<ChiffreAffairesData> => {
    const params: Record<string, number> = {};
    if (annee) params.annee = annee;
    if (mois) params.mois = mois;
    const response = await api.get('/reporting/chiffre-affaires', { params });
    return response.data;
  },

  // Rentabilité
  getRentabilite: async (annee?: number): Promise<RentabiliteData> => {
    const params = annee ? { annee } : {};
    const response = await api.get('/reporting/rentabilite', { params });
    return response.data;
  },

  // Créances
  getCreances: async (): Promise<CreancesData> => {
    const response = await api.get('/reporting/creances');
    return response.data;
  },

  // Trésorerie
  getTresorerie: async (dateDebut: string, dateFin: string): Promise<TresorerieData> => {
    const response = await api.get('/reporting/tresorerie', {
      params: { date_debut: dateDebut, date_fin: dateFin }
    });
    return response.data;
  },

  // Comparatif annuel
  getComparatif: async (annee1: number, annee2: number): Promise<ComparatifData> => {
    const response = await api.get('/reporting/comparatif', {
      params: { annee1, annee2 }
    });
    return response.data;
  },

  // Activité clients
  getActiviteClients: async (dateDebut: string, dateFin: string, limit?: number): Promise<ActiviteClientsData> => {
    const response = await api.get('/reporting/activite-clients', {
      params: { date_debut: dateDebut, date_fin: dateFin, limit }
    });
    return response.data;
  },

  // Statistiques documents
  getStatistiquesDocuments: async (annee?: number): Promise<StatistiquesDocumentsData> => {
    const params = annee ? { annee } : {};
    const response = await api.get('/reporting/statistiques-documents', { params });
    return response.data;
  },
};

// ============ EXPORT TYPES ============

export type ExportType = 
  | 'factures' 
  | 'devis' 
  | 'ordres-travail'
  | 'paiements' 
  | 'caisse' 
  | 'clients' 
  | 'primes'
  | 'chiffre-affaires' 
  | 'creances' 
  | 'tresorerie' 
  | 'credits' 
  | 'annulations'
  | 'activite-globale'
  | 'tableau-de-bord';

export interface ExportFilters {
  date_debut?: string;
  date_fin?: string;
  statut?: string;
  client_id?: string;
  mode_paiement?: string;
  type?: string;
  categorie?: string;
  banque_id?: string;
  representant_id?: string;
  annee?: number;
  actif?: boolean;
}

// ============ API CALLS EXPORTS ============

export const exportApi = {
  // Export générique CSV
  exportCSV: async (type: ExportType, filters: ExportFilters = {}): Promise<Blob> => {
    const response = await api.get(`/exports/${type}`, {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },

  // Télécharger un export
  downloadExport: async (type: ExportType, filters: ExportFilters = {}, format: 'csv' | 'pdf' = 'csv'): Promise<void> => {
    try {
      const blob = await exportApi.exportCSV(type, filters);
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      throw error;
    }
  },

  // Exports spécifiques
  exportFactures: async (filters: ExportFilters = {}): Promise<Blob> => {
    return exportApi.exportCSV('factures', filters);
  },

  exportDevis: async (filters: ExportFilters = {}): Promise<Blob> => {
    return exportApi.exportCSV('devis', filters);
  },

  exportOrdres: async (filters: ExportFilters = {}): Promise<Blob> => {
    return exportApi.exportCSV('ordres-travail', filters);
  },

  exportPaiements: async (filters: ExportFilters = {}): Promise<Blob> => {
    return exportApi.exportCSV('paiements', filters);
  },

  exportCaisse: async (filters: ExportFilters = {}): Promise<Blob> => {
    return exportApi.exportCSV('caisse', filters);
  },

  exportClients: async (filters: ExportFilters = {}): Promise<Blob> => {
    return exportApi.exportCSV('clients', filters);
  },

  exportPrimes: async (filters: ExportFilters = {}): Promise<Blob> => {
    return exportApi.exportCSV('primes', filters);
  },

  exportCreances: async (): Promise<Blob> => {
    return exportApi.exportCSV('creances');
  },

  exportTresorerie: async (dateDebut: string, dateFin: string): Promise<Blob> => {
    return exportApi.exportCSV('tresorerie', { date_debut: dateDebut, date_fin: dateFin });
  },

  exportCredits: async (filters: ExportFilters = {}): Promise<Blob> => {
    return exportApi.exportCSV('credits', filters);
  },

  exportAnnulations: async (filters: ExportFilters = {}): Promise<Blob> => {
    return exportApi.exportCSV('annulations', filters);
  },

  exportActiviteGlobale: async (dateDebut: string, dateFin: string): Promise<Blob> => {
    return exportApi.exportCSV('activite-globale', { date_debut: dateDebut, date_fin: dateFin });
  },

  exportTableauDeBord: async (annee: number): Promise<Blob> => {
    return exportApi.exportCSV('tableau-de-bord', { annee });
  },
};
