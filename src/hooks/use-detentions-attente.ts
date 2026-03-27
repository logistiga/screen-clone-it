import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface DetentionAttente {
  id: string | null;
  numero_conteneur: string;
  numero_bl: string;
  client_nom: string;
  armateur_code: string;
  date_sortie: string | null;
  date_retour: string | null;
  jours_gratuits: number;
  jours_detention: number;
  prix_par_jour: number;
  cout_total: number;
  responsabilite: string;
  jours_client: number;
  jours_compagnie: number;
  cout_client: number;
  cout_compagnie: number;
  paiement_valide: boolean;
  sortie_id: string | null;
}

export interface DetentionStats {
  total: number;
  total_client: number;
  total_compagnie: number;
  cout_total: number;
  cout_client: number;
  cout_compagnie: number;
  jours_max: number;
  jours_moyen: number;
  non_payes: number;
}

interface DetentionsParams {
  page: number;
  per_page: number;
  search?: string;
  responsabilite?: string;
  armateur_code?: string;
  paiement_valide?: string;
  sort_by?: string;
  sort_dir?: string;
}

export function useDetentionsAttente(params: DetentionsParams) {
  return useQuery({
    queryKey: ["detentions-attente", params],
    queryFn: async () => {
      const { data } = await api.get("/detentions-attente", { params });
      return data as {
        data: DetentionAttente[];
        meta: { current_page: number; last_page: number; per_page: number; total: number };
        source_errors?: Record<string, string>;
      };
    },
  });
}

export function useDetentionsAttenteStats() {
  return useQuery({
    queryKey: ["detentions-attente-stats"],
    queryFn: async () => {
      const { data } = await api.get("/detentions-attente/stats");
      return data as DetentionStats;
    },
  });
}
