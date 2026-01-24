import api from '../api';

export interface ConteneurTraite {
  id: number;
  sortie_id_externe: string | null;
  numero_conteneur: string;
  numero_bl: string | null;
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

export const conteneursTraitesApi = {
  /**
   * Liste des conteneurs traités avec filtres
   */
  getAll: async (filters: ConteneursTraitesFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.statut) params.append('statut', filters.statut);
    if (filters.search) params.append('search', filters.search);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.per_page) params.append('per_page', String(filters.per_page));
    if (filters.page) params.append('page', String(filters.page));

    const response = await api.get(`/conteneurs-en-attente?${params.toString()}`);
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
};
