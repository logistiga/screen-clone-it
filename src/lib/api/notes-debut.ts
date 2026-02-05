import api from '@/lib/api';
import { Client, Transitaire, Armateur } from './commercial';

export interface LigneNoteDebut {
  id?: string;
  note_debut_id?: string;
  ordre_id?: string;
  conteneur_numero?: string;
  bl_numero?: string;
  date_debut?: string;
  date_fin?: string;
  nombre_jours?: number;
  tarif_journalier?: number;
  montant_ht?: number;
  observations?: string;
  created_at?: string;
}

export interface NoteDebut {
  id: string;
  numero: string;
  type: 'ouverture_port' | 'detention' | 'reparation' | 'Ouverture Port' | 'Detention' | 'Reparation' | string;
  date?: string;
  date_creation?: string;
  
  // Client
  client_id: string;
  client?: Client;
  
  // Conteneur (pour notes simples)
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
  
  // Montants (AUCUNE taxe sur les notes de début)
  montant_ht?: number;
  montant_tva?: number; // Toujours 0
  montant_css?: number; // Toujours 0
  montant_ttc?: number; // = montant_ht
  montant_stockage?: number;
  montant_manutention?: number;
  montant_total?: number;
  taux_tva?: number; // Toujours 0
  taux_css?: number; // Toujours 0
  
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
  
  // Lignes multiples (pour notes groupées)
  lignes?: LigneNoteDebut[];
  nb_lignes?: number;
  
  created_at?: string;
  updated_at?: string;
}

export interface CreateNoteDebutPayload {
  type: string;
  client_id: string;
  description?: string;
  transitaire_id?: string;
  armateur_id?: string;
  // Pour création simple (1 conteneur)
  ordre_id?: string;
  conteneur_numero?: string;
  bl_numero?: string;
  date_debut?: string;
  date_fin?: string;
  nombre_jours?: number;
  tarif_journalier?: number;
  montant_ht?: number;
  // Pour création groupée (plusieurs conteneurs)
  lignes?: {
    ordre_id?: string;
    conteneur_numero?: string;
    bl_numero?: string;
    date_debut: string;
    date_fin: string;
    tarif_journalier: number;
    observations?: string;
  }[];
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
    const response = await api.get('/notes-debit', { params });
    return response.data;
  },

  getById: async (id: string): Promise<NoteDebut> => {
    const response = await api.get(`/notes-debit/${id}`);
    const payload = response.data;
    return payload?.data ?? payload;
  },

  create: async (data: Partial<NoteDebut>): Promise<NoteDebut> => {
    const response = await api.post('/notes-debit', data);
    const payload = response.data;
    return payload?.data ?? payload;
  },

  update: async (id: string, data: Partial<NoteDebut>): Promise<NoteDebut> => {
    const response = await api.put(`/notes-debit/${id}`, data);
    const payload = response.data;
    return payload?.data ?? payload;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/notes-debit/${id}`);
  },

  duplicate: async (id: string): Promise<NoteDebut> => {
    const response = await api.post(`/notes-debit/${id}/duplicate`);
    const payload = response.data;
    return payload?.data ?? payload;
  },

  getStats: async (params?: { client_id?: string; type?: string; date_debut?: string; date_fin?: string }): Promise<NoteDebutStats> => {
    const response = await api.get('/notes-debit/stats', { params });
    return response.data;
  },

  sendEmail: async (id: string, data: { destinataire: string; sujet: string; message: string }): Promise<void> => {
    const response = await api.post(`/notes-debit/${id}/send-email`, data);
    return response.data;
  },
};
