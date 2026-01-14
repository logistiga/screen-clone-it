import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Types
export interface AuditUser {
  id: number;
  name: string;
  email?: string;
  role?: string;
}

export interface AuditEntry {
  id: number;
  user_id: number;
  action: string;
  module: string;
  document_type: string | null;
  document_id: number | null;
  document_numero: string | null;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  user?: AuditUser;
}

export interface AuditStats {
  total: number;
  par_action: Array<{ action: string; total: number }>;
  par_table: Array<{ table_name: string; total: number }>;
  par_utilisateur: Array<{ user_id: number; total: number; user?: AuditUser }>;
  par_jour: Array<{ date: string; total: number }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface AuditFilters {
  search?: string;
  action?: string;
  module?: string;
  user_id?: number;
  date_debut?: string;
  date_fin?: string;
  page?: number;
  per_page?: number;
}

// Helper pour les headers d'authentification
const getAuthHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const auditService = {
  // Liste des audits paginés
  async getAll(params?: AuditFilters): Promise<PaginatedResponse<AuditEntry>> {
    const response = await axios.get(`${API_URL}/audit`, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data;
  },

  // Détails d'un audit
  async getById(id: number): Promise<AuditEntry> {
    const response = await axios.get(`${API_URL}/audit/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Liste des actions distinctes
  async getActions(): Promise<string[]> {
    const response = await axios.get(`${API_URL}/audit/actions`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Liste des modules/tables distinctes
  async getTables(): Promise<string[]> {
    const response = await axios.get(`${API_URL}/audit/tables`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Statistiques
  async getStats(dateDebut?: string, dateFin?: string): Promise<AuditStats> {
    const response = await axios.get(`${API_URL}/audit/stats`, {
      headers: getAuthHeaders(),
      params: { date_debut: dateDebut, date_fin: dateFin },
    });
    return response.data;
  },

  // Export des données
  async export(dateDebut?: string, dateFin?: string): Promise<{ data: AuditEntry[]; total: number }> {
    const response = await axios.get(`${API_URL}/audit/export`, {
      headers: getAuthHeaders(),
      params: { date_debut: dateDebut, date_fin: dateFin },
    });
    return response.data;
  },
};

// Service utilisateurs pour les filtres
export const userService = {
  async getAll(): Promise<AuditUser[]> {
    const response = await axios.get(`${API_URL}/users`, {
      headers: getAuthHeaders(),
    });
    return response.data.data || response.data;
  },
};
