import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { fetchCaisseMouvements, fetchCaisseSolde, fetchCaisseSoldeJour } from "@/services/api";
import { fetchAllPaginated } from "@/services/api/pagination.api";
import { refreshTreasury } from "@/services/api/treasury-cache";

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
  const queryClient = useQueryClient();
  const now = new Date();
  const dateDebut = format(startOfMonth(now), 'yyyy-MM-dd');
  const dateFin = format(endOfMonth(now), 'yyyy-MM-dd');

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortieModalOpen, setSortieModalOpen] = useState(false);
  const [entreeModalOpen, setEntreeModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const { data: mouvementsData, isLoading, refetch } = useQuery({
    queryKey: ['caisse-mouvements', currentPage, pageSize, searchTerm, typeFilter],
    queryFn: () => {
      const params: Record<string, string | number> = { page: currentPage, per_page: pageSize, source: 'caisse' };
      if (searchTerm) params.search = searchTerm;
      if (typeFilter !== 'all') params.type = typeFilter;
      return fetchCaisseMouvements<CaisseResponse>(params);
    },
  });

  const { data: soldeData } = useQuery({
    queryKey: ['caisse-solde'],
    queryFn: () => fetchCaisseSolde<SoldeResponse>(),
  });

  const { data: soldeJourData } = useQuery({
    queryKey: ['caisse-solde-jour', format(now, 'yyyy-MM-dd')],
    queryFn: () => {
      const today = format(now, 'yyyy-MM-dd');
      return fetchCaisseSoldeJour<{ entrees: number; sorties: number; solde: number }>(today);
    },
  });

  // Mouvements du mois en cours pour les totaux mensuels
  const { data: mouvementsMoisData } = useQuery({
    queryKey: ['caisse-mouvements-mois', dateDebut, dateFin],
    queryFn: () => fetchAllPaginated<MouvementCaisse>('/caisse', {
      source: 'caisse', date_debut: dateDebut, date_fin: dateFin,
    }),
  });

  const mouvements = mouvementsData?.data || [];
  const totalPages = mouvementsData?.meta?.last_page || 1;
  const totalItems = mouvementsData?.meta?.total || 0;

  const soldeCaisse = soldeData?.solde || 0;

  // Totaux du mois en cours
  const mouvementsMois = mouvementsMoisData || [];
  const totalEntrees = mouvementsMois.filter((m: MouvementCaisse) => m.type === 'entree').reduce((sum: number, m: MouvementCaisse) => sum + (m.montant || 0), 0);
  const totalSorties = mouvementsMois.filter((m: MouvementCaisse) => m.type === 'sortie').reduce((sum: number, m: MouvementCaisse) => sum + (m.montant || 0), 0);

  const soldeJour = soldeJourData?.solde ?? 0;
  const entreesJour = soldeJourData?.entrees ?? 0;
  const sortiesJour = soldeJourData?.sorties ?? 0;

  const entreesCount = mouvements.filter((m: MouvementCaisse) => m.type === 'entree').length;
  const sortiesCount = mouvements.filter((m: MouvementCaisse) => m.type === 'sortie').length;

  const hasFilters = !!searchTerm || typeFilter !== 'all';
  const clearFilters = () => { setSearchTerm(""); setTypeFilter("all"); setCurrentPage(1); };
  const handleSuccess = () => refreshTreasury(queryClient);

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
