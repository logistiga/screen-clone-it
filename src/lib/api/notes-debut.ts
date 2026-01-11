import api from '@/lib/api';
import { Client, Transitaire, Armateur } from './commercial';

export interface NoteDebut {
  id: string;
  numero: string;
  type: 'ouverture_port' | 'detention' | 'reparation' | 'Ouverture Port' | 'Detention' | 'Reparation' | string;
  date?: string;
  date_creation?: string;
  
  // Client
  client_id: string;
  client?: Client;
  
  // Conteneur
  bl_numero?: string;
  conteneur_numero?: string;
  conteneur_type?: string;
  conteneur_taille?: string;
  navire?: string;
  date_arrivee?: string;
  
  // Période
  date_debut?: string;
  date_fin?: string;
  date_debut_stockage?: string;
  date_fin_stockage?: string;
  nombre_jours?: number;
  jours_stockage?: number;
  jours_franchise?: number;
  tarif_journalier?: number;
  
  // Montants
  montant_ht?: number;
  montant_tva?: number;
  montant_css?: number;
  montant_ttc?: number;
  montant_stockage?: number;
  montant_manutention?: number;
  montant_total?: number;
  taux_tva?: number;
  taux_css?: number;
  
  // Paiement
  montant_paye?: number;
  montant_avance?: number;
  statut?: 'brouillon' | 'en_attente' | 'facturee' | 'payee' | 'annulee' | 'partielle';
  
  // Divers
  description?: string;
  notes?: string;
  observations?: string;
  
  // Relations
  transitaire_id?: string;
  transitaire?: Transitaire;
  armateur_id?: string;
  armateur?: Armateur;
  ordre_id?: string;
  facture_id?: string;
  
  created_at?: string;
  updated_at?: string;
}

export interface NoteDebutParams {
  search?: string;
  type?: string;
  client_id?: string;
  statut?: string;
  date_debut?: string;
  date_fin?: string;
  page?: number;
  per_page?: number;
}

export interface PaginatedNotesResponse {
  data: NoteDebut[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface NoteDebutStats {
  total: number;
  en_attente: number;
  facturees: number;
  payees: number;
  montant_total: number;
  montant_paye: number;
  montant_restant: number;
}

export const notesDebutApi = {
  getAll: async (params?: NoteDebutParams): Promise<PaginatedNotesResponse> => {
    const response = await api.get('/notes-debut', { params });
    return response.data;
  },

  getById: async (id: string): Promise<NoteDebut> => {
    const response = await api.get(`/notes-debut/${id}`);
    const payload = response.data;
    return payload?.data ?? payload;
  },

  create: async (data: Partial<NoteDebut>): Promise<NoteDebut> => {
    const response = await api.post('/notes-debut', data);
    const payload = response.data;
    return payload?.data ?? payload;
  },

  update: async (id: string, data: Partial<NoteDebut>): Promise<NoteDebut> => {
    const response = await api.put(`/notes-debut/${id}`, data);
    const payload = response.data;
    return payload?.data ?? payload;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/notes-debut/${id}`);
  },

  duplicate: async (id: string): Promise<NoteDebut> => {
    const response = await api.post(`/notes-debut/${id}/duplicate`);
    const payload = response.data;
    return payload?.data ?? payload;
  },

  getStats: async (params?: { client_id?: string; type?: string; date_debut?: string; date_fin?: string }): Promise<NoteDebutStats> => {
    const response = await api.get('/notes-debut/stats', { params });
    return response.data;
  },
};
