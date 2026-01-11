import api from '../api';

export interface Annulation {
  id: number;
  numero: string;
  type: 'devis' | 'ordre' | 'facture';
  document_id: number;
  document_numero: string;
  client_id: number;
  client?: {
    id: number;
    nom: string;
    adresse?: string;
    ville?: string;
    telephone?: string;
    email?: string;
  };
  montant: number;
  date: string;
  motif: string;
  avoir_genere: boolean;
  numero_avoir?: string;
  created_at: string;
}

export interface AnnulationStats {
  total: number;
  montant_total: number;
  avoirs_generes: number;
  par_type: {
    devis: number;
    ordre: number;
    facture: number;
  };
  evolution_mensuelle: Array<{
    mois: string;
    total: number;
    montant: number;
  }>;
}

export interface AnnulationsResponse {
  data: Annulation[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// Récupérer la liste des annulations
export const getAnnulations = async (params?: {
  search?: string;
  type?: string;
  client_id?: number;
  date_debut?: string;
  date_fin?: string;
  per_page?: number;
  page?: number;
}): Promise<AnnulationsResponse> => {
  const response = await api.get('/annulations', { params });
  return response.data;
};

// Récupérer une annulation par ID
export const getAnnulation = async (id: number): Promise<Annulation> => {
  const response = await api.get(`/annulations/${id}`);
  return response.data;
};

// Statistiques des annulations
export const getAnnulationsStats = async (params?: {
  date_debut?: string;
  date_fin?: string;
  type?: string;
}): Promise<AnnulationStats> => {
  const response = await api.get('/annulations/stats', { params });
  return response.data;
};

// Annuler une facture
export const annulerFacture = async (
  factureId: number,
  data: { motif: string; generer_avoir?: boolean }
): Promise<{ message: string; annulation: Annulation }> => {
  const response = await api.post(`/annulations/facture/${factureId}`, data);
  return response.data;
};

// Annuler un ordre de travail
export const annulerOrdre = async (
  ordreId: number,
  data: { motif: string }
): Promise<{ message: string; annulation: Annulation }> => {
  const response = await api.post(`/annulations/ordre/${ordreId}`, data);
  return response.data;
};

// Annuler un devis
export const annulerDevis = async (
  devisId: number,
  data: { motif: string }
): Promise<{ message: string; annulation: Annulation }> => {
  const response = await api.post(`/annulations/devis/${devisId}`, data);
  return response.data;
};

// Générer un avoir pour une annulation existante
export const genererAvoir = async (
  annulationId: number
): Promise<{ message: string; numero_avoir: string }> => {
  const response = await api.post(`/annulations/${annulationId}/generer-avoir`);
  return response.data;
};

// Rembourser une annulation
export const rembourserAnnulation = async (
  annulationId: number,
  data: {
    montant: number;
    mode_paiement: string;
    banque_id?: number;
    reference?: string;
    notes?: string;
  }
): Promise<{ message: string }> => {
  const response = await api.post(`/annulations/${annulationId}/rembourser`, data);
  return response.data;
};

// Historique des annulations d'un client
export const getHistoriqueClient = async (clientId: number): Promise<{
  annulations: Annulation[];
  total_annulations: number;
  montant_total: number;
}> => {
  const response = await api.get(`/annulations/client/${clientId}`);
  return response.data;
};
