/**
 * Types pour les réponses brutes du backend Laravel
 * Utilisables pour typer les `any` dans les normalisers et hooks
 */

// ==================== Dashboard ====================

export interface RawDashboardStats {
  clients?: { total?: number } | number;
  devis?: { total?: number } | number;
  ordres?: { total?: number } | number;
  factures?: { total?: number; montant_total?: number } | number;
  paiements?: { total_periode?: number } | number;
  caisse?: { solde_actuel?: number } | number;
  banque?: { solde_actuel?: number } | number;
  creances?: { total_impaye?: number } | number;
  nb_clients?: number;
  nb_devis?: number;
  nb_ordres?: number;
  nb_factures?: number;
  nb_paiements?: number;
  solde_caisse?: number;
  solde_banque?: number;
  total_creances?: number;
}

export interface RawGraphData {
  mois?: number | string;
  montant?: number;
  total?: number;
  label?: string;
}

export interface RawTopClient {
  id?: number | string;
  nom?: string;
  raison_sociale?: string;
  client_nom?: string;
  factures_sum_montant_ttc?: number;
  montant?: number;
  ca_total?: number;
  total?: number;
}

export interface RawCategorieItem {
  categorie?: string;
  type?: string;
  count?: number;
  nombre?: number;
}

export interface RawAlerte {
  type?: string;
  message?: string;
  count?: number;
  nombre?: number;
  lien?: string;
}

export interface RawActivite {
  type?: string;
  description?: string;
  message?: string;
  date?: string;
  created_at?: string;
  montant?: number;
}

export interface RawGraphiquesData {
  ca_mensuel?: RawGraphData[];
  paiements_mensuel?: RawGraphData[];
  top_clients?: RawTopClient[];
  factures_par_categorie?: RawCategorieItem[];
  repartition_types?: RawCategorieItem[];
}

// ==================== Erreurs API (Axios) ====================

export interface ApiErrorResponse {
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
      errors?: Record<string, string[]>;
    };
    config?: {
      method?: string;
      url?: string;
      baseURL?: string;
    };
  };
  config?: {
    method?: string;
    url?: string;
    baseURL?: string;
  };
  message?: string;
  code?: string;
}

// ==================== Entités métier ====================

export interface RawClient {
  id?: number | string;
  nom?: string;
  raison_sociale?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RawFacture {
  id?: number | string;
  numero?: string;
  client_id?: number | string;
  client?: RawClient;
  montant_ht?: number;
  montant_ttc?: number;
  statut?: string;
  date_emission?: string;
  date_echeance?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RawOrdre {
  id?: number | string;
  numero?: string;
  client_id?: number | string;
  client?: RawClient;
  categorie?: string;
  statut?: string;
  montant_total?: number;
  created_at?: string;
  updated_at?: string;
}

export interface RawDevis {
  id?: number | string;
  numero?: string;
  client_id?: number | string;
  client?: RawClient;
  montant_ht?: number;
  montant_ttc?: number;
  statut?: string;
  date_validite?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RawPaiement {
  id?: number | string;
  montant?: number;
  mode_paiement?: string;
  reference?: string;
  date_paiement?: string;
  facture_id?: number | string;
  ordre_id?: number | string;
  created_at?: string;
}

// ==================== Pagination ====================

export interface PaginatedResponse<T> {
  data: T[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

// ==================== Mutations ====================

export interface MutationPayload<T = Record<string, unknown>> {
  id: string | number;
  data: T;
}

export interface DeletePayload {
  id: string | number;
}
