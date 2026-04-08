import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface MouvementCaisse {
  id: string;
  type: 'entree' | 'sortie';
  montant: number;
  date: string;
  date_mouvement: string;
  description: string;
  source: string;
  categorie: string;
  document_numero: string | null;
  document_type: 'ordre' | 'facture' | null;
  client_nom: string | null;
  beneficiaire: string | null;
  banque_id: number | null;
}

interface CaisseResponse {
  data: MouvementCaisse[];
  meta?: { current_page: number; last_page: number; total: number; per_page: number };
}

interface SoldeResponse {
  solde: number;
  total_entrees: number;
  total_sorties: number;
  solde_banques: number;
  solde_total: number;
}

export function useCaisseData() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortieModalOpen, setSortieModalOpen] = useState(false);
  const [entreeModalOpen, setEntreeModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const { data: mouvementsData, isLoading, refetch } = useQuery({
    queryKey: ['caisse-mouvements', currentPage, pageSize, searchTerm, typeFilter],
    queryFn: async () => {
      const params: Record<string, string | number> = { page: currentPage, per_page: pageSize, source: 'caisse' };
      if (searchTerm) params.search = searchTerm;
      if (typeFilter !== 'all') params.type = typeFilter;
      const response = await api.get<CaisseResponse>('/caisse', { params });
      return response.data;
    },
  });

  const { data: soldeData } = useQuery({
    queryKey: ['caisse-solde'],
    queryFn: async () => { const r = await api.get<SoldeResponse>('/caisse/solde'); return r.data; },
  });

  const { data: soldeJourData } = useQuery({
    queryKey: ['caisse-solde-jour'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const r = await api.get<{ entrees: number; sorties: number; solde: number }>('/caisse/solde-jour', { params: { date: today } });
      return r.data;
    },
  });

  const mouvements = mouvementsData?.data || [];
  const totalPages = mouvementsData?.meta?.last_page || 1;
  const totalItems = mouvementsData?.meta?.total || 0;

  const soldeCaisse = soldeData?.solde || 0;
  const totalEntrees = soldeData?.total_entrees || 0;
  const totalSorties = soldeData?.total_sorties || 0;
  const soldeJour = soldeJourData?.solde ?? 0;
  const entreesJour = soldeJourData?.entrees ?? 0;
  const sortiesJour = soldeJourData?.sorties ?? 0;

  const entreesCount = mouvements.filter((m: MouvementCaisse) => m.type === 'entree').length;
  const sortiesCount = mouvements.filter((m: MouvementCaisse) => m.type === 'sortie').length;

  const hasFilters = !!searchTerm || typeFilter !== 'all';
  const clearFilters = () => { setSearchTerm(""); setTypeFilter("all"); setCurrentPage(1); };
  const handleSuccess = () => refetch();

  return {
    searchTerm, setSearchTerm, typeFilter, setTypeFilter,
    currentPage, setCurrentPage, pageSize, setPageSize,
    sortieModalOpen, setSortieModalOpen, entreeModalOpen, setEntreeModalOpen,
    exportModalOpen, setExportModalOpen,
    isLoading, refetch, mouvements, totalPages, totalItems,
    soldeCaisse, totalEntrees, totalSorties, soldeJour, entreesJour, sortiesJour,
    entreesCount, sortiesCount, hasFilters, clearFilters, handleSuccess,
  };
}
