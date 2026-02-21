import api from '../api';

export interface ConteneurTraite {
  id: number;
  sortie_id_externe: string | null;
  numero_conteneur: string;
  numero_bl: string | null;
  type_conteneur: string | null;
  armateur_code: string | null;
  armateur_nom: string | null;
  client_nom: string | null;
  client_adresse: string | null;
  transitaire_nom: string | null;
  date_sortie: string | null;
  date_retour: string | null;
  camion_plaque: string | null;
  remorque_plaque: string | null;
  chauffeur_nom: string | null;
  prime_chauffeur: number | null;
  destination_type: string | null;
  destination_adresse: string | null;
  statut_ops: string | null;
  statut: 'en_attente' | 'affecte' | 'facture' | 'ignore';
  ordre_travail_id: number | null;
  ordre_travail?: {
    id: number;
    numero: string;
  };
  synced_at: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConteneursTraitesStats {
  total: number;
  en_attente: number;
  affectes: number;
  factures: number;
  derniere_sync: string | null;
}

export interface ConteneursTraitesFilters {
  statut?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  per_page?: number;
  page?: number;
}

// ===== ANOMALIES =====

export interface ConteneurAnomalie {
  id: number;
  type: 'oublie' | 'doublon' | 'mismatch';
  type_label: string;
  numero_conteneur: string;
  numero_bl: string | null;
  client_nom: string | null;
  statut: 'non_traite' | 'traite' | 'ignore';
  details: {
    conteneurs_ops: string[];
    conteneurs_ot: string[];
    manquants: string[];
    date_detection: string;
  } | null;
  conteneurs_manquants: string[];
  nombre_manquants: number;
  ordre_travail?: {
    id: number;
    numero: string;
  };
  traite_par?: {
    id: number;
    name: string;
  };
  traite_at: string | null;
  detected_at: string | null;
  created_at: string;
}

export interface AnomaliesStats {
  total: number;
  non_traitees: number;
  traitees: number;
  ignorees: number;
  par_type: {
    oublie: number;
    doublon: number;
    mismatch: number;
  };
}

export interface OpsHealthResponse {
  success: boolean;
  message: string;
  debug?: {
    host?: string;
    database?: string;
    host_configured?: boolean;
    database_configured?: boolean;
    tables_count?: number;
    error?: string;
  };
}

export const conteneursTraitesApi = {
  /**
   * Teste la connexion à la base OPS
   */
  healthOps: async (): Promise<OpsHealthResponse> => {
    const response = await api.get('/sync-diagnostic/health-ops');
    return response.data;
  },

  /**
   * Liste des conteneurs traités avec filtres
   */
  getAll: async (filters: ConteneursTraitesFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.statut && filters.statut !== 'all') params.append('statut', filters.statut);
    if (filters.search) params.append('search', filters.search);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.per_page) params.append('per_page', String(filters.per_page));
    if (filters.page) params.append('page', String(filters.page));

    const queryString = params.toString();
    const response = await api.get(`/conteneurs-en-attente${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },

  /**
   * Statistiques des conteneurs traités
   */
  getStats: async (): Promise<ConteneursTraitesStats> => {
    const response = await api.get('/conteneurs-en-attente/stats');
    return response.data.data;
  },

  /**
   * Affecter un conteneur à un ordre de travail existant
   */
  affecterAOrdre: async (conteneurId: number, ordreId: number) => {
    const response = await api.post(`/conteneurs-en-attente/${conteneurId}/affecter`, {
      ordre_travail_id: ordreId,
    });
    return response.data;
  },

  /**
   * Créer un nouvel ordre de travail à partir du conteneur
   */
  creerOrdre: async (conteneurId: number) => {
    const response = await api.post(`/conteneurs-en-attente/${conteneurId}/creer-ordre`);
    return response.data;
  },

  /**
   * Ignorer un conteneur (ne pas facturer)
   */
  ignorer: async (conteneurId: number) => {
    const response = await api.post(`/conteneurs-en-attente/${conteneurId}/ignorer`);
    return response.data;
  },

  /**
   * Synchroniser les conteneurs depuis Logistiga OPS
   */
  syncFromOps: async (dateFrom?: string, dateTo?: string) => {
    const params: Record<string, string> = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    const response = await api.post('/sync-diagnostic/sync-conteneurs', params);
    return response.data;
  },
};

// ===== API ANOMALIES =====

export const anomaliesApi = {
  /**
   * Liste des anomalies détectées
   */
  getAll: async (filters: { statut?: string; type?: string; search?: string; per_page?: number } = {}) => {
    const params = new URLSearchParams();
    if (filters.statut) params.append('statut', filters.statut);
    if (filters.type) params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);
    if (filters.per_page) params.append('per_page', String(filters.per_page));

    const queryString = params.toString();
    const response = await api.get(`/conteneurs-anomalies${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },

  /**
   * Statistiques des anomalies
   */
  getStats: async (): Promise<AnomaliesStats> => {
    const response = await api.get('/conteneurs-anomalies/stats');
    return response.data.data;
  },

  /**
   * Lancer la détection d'anomalies
   */
  detecter: async () => {
    const response = await api.post('/conteneurs-anomalies/detecter');
    return response.data;
  },

  /**
   * Ajouter le conteneur à l'OT existant
   */
  ajouterAOrdre: async (anomalieId: number) => {
    const response = await api.post(`/conteneurs-anomalies/${anomalieId}/ajouter`);
    return response.data;
  },

  /**
   * Ignorer une anomalie
   */
  ignorer: async (anomalieId: number) => {
    const response = await api.post(`/conteneurs-anomalies/${anomalieId}/ignorer`);
    return response.data;
  },

  /**
   * Traiter plusieurs anomalies en masse
   */
  traiterEnMasse: async (anomalieIds: number[], action: 'ajouter' | 'ignorer') => {
    const response = await api.post('/conteneurs-anomalies/traiter-masse', {
      anomalie_ids: anomalieIds,
      action,
    });
    return response.data;
  },
};
