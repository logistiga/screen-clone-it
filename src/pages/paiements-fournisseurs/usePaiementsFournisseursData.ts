import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface PaiementFournisseur {
  id: number;
  fournisseur: string;
  reference: string;
  description: string | null;
  montant_total: number;
  date_facture: string;
  source: string | null;
  total_paye: number;
  reste: number;
  pourcentage: number;
  est_solde: boolean;
  nombre_tranches: number;
  created_at: string;
}

export interface Tranche {
  id: number;
  montant: number;
  mode_paiement: string;
  reference: string | null;
  notes: string | null;
  date_paiement: string;
  numero_tranche: number;
  mouvement_id: number | null;
}

export function usePaiementsFournisseursData() {
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAvanceModal, setShowAvanceModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPF, setSelectedPF] = useState<PaiementFournisseur | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['paiements-fournisseurs', page, pageSize, search, statut],
    queryFn: async () => {
      const params: Record<string, any> = { page, per_page: pageSize, statut };
      if (search) params.search = search;
      const response = await api.get('/paiements-fournisseurs', { params });
      return response.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['paiements-fournisseurs-stats'],
    queryFn: async () => {
      const response = await api.get('/paiements-fournisseurs/stats');
      return response.data;
    },
  });

  const items: PaiementFournisseur[] = data?.data || [];
  const totalPages = data?.last_page || 1;
  const totalCount = data?.total || 0;

  const openAvance = (pf: PaiementFournisseur) => { setSelectedPF(pf); setShowAvanceModal(true); };
  const openDetail = (pf: PaiementFournisseur) => { setSelectedPF(pf); setShowDetailModal(true); };

  return {
    search, setSearch, statut, setStatut, page, setPage, pageSize, setPageSize,
    showCreateModal, setShowCreateModal, showAvanceModal, setShowAvanceModal,
    showDetailModal, setShowDetailModal, selectedPF,
    isLoading, items, totalPages, totalCount, stats,
    openAvance, openDetail,
  };
}
