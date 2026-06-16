import api from "@/lib/api";

export interface OperationAttente {
  id: string;
  numero: string | null;
  type: string | null;
  client_nom: string | null;
  description: string | null;
  point_depart: string | null;
  point_arrivee: string | null;
  date_operation: string | null;
  quantite: number | null;
  montant_ht: number | null;
  raw?: Record<string, any>;
}

export interface OperationAttenteStats {
  en_attente: number;
  ignorees: number;
  converties: number;
}

export const operationsEnAttenteApi = {
  list: async (params: { search?: string; per_page?: number; page?: number } = {}) => {
    const { data } = await api.get("/operations-en-attente", { params });
    return data as {
      data: OperationAttente[];
      meta: { current_page: number; last_page: number; per_page: number; total: number };
      source_errors?: Record<string, string>;
    };
  },
  stats: async () => {
    const { data } = await api.get("/operations-en-attente/stats");
    return data as OperationAttenteStats;
  },
  confirmer: async (id: string) => {
    const { data } = await api.post(`/operations-en-attente/${encodeURIComponent(id)}/confirmer`);
    return data as { success: boolean; message: string; ordre?: { id: number; numero: string } };
  },
  ignorer: async (id: string) => {
    const { data } = await api.post(`/operations-en-attente/${encodeURIComponent(id)}/ignorer`);
    return data as { success: boolean; message: string };
  },
};
