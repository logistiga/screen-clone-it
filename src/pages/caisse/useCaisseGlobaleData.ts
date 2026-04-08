import { useState } from "react";
import { useMouvementsCaisse, useSoldeCaisse, usePaiements } from "@/hooks/use-commercial";
import { format } from "date-fns";

export function useCaisseGlobaleData() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const { data: mouvementsData, isLoading } = useMouvementsCaisse({
    source: sourceFilter !== 'all' ? sourceFilter : undefined,
    date_debut: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    date_fin: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    page: currentPage,
    per_page: pageSize,
  });

  const { data: soldeData } = useSoldeCaisse();
  const { data: paiementsCaisseData } = usePaiements({ mode_paiement: 'Espèces', per_page: 1000 });
  const { data: paiementsBanqueData } = usePaiements({ per_page: 1000 });

  const mouvements = mouvementsData?.data || [];
  const totalPages = mouvementsData?.meta?.last_page || 1;
  const totalItems = mouvementsData?.meta?.total || 0;

  const soldeCaisse = soldeData?.solde || 0;
  const soldeBanques = soldeData?.solde_banques || 0;
  const soldeGlobal = soldeData?.solde_total || (soldeCaisse + soldeBanques);
  const totalEntrees = soldeData?.total_entrees || 0;
  const totalSorties = soldeData?.total_sorties || 0;

  const paiementsCaisse = paiementsCaisseData?.data || [];
  const paiementsBanque = (paiementsBanqueData?.data || []).filter((p: any) => p.mode_paiement === 'Virement' || p.mode_paiement === 'Chèque');

  const totalEntreesCaisse = paiementsCaisse.reduce((sum: number, p: any) => sum + (p.montant || 0), 0);
  const totalEntreesBanque = paiementsBanque.reduce((sum: number, p: any) => sum + (p.montant || 0), 0);

  const sortiesCaisse = mouvements.filter((m: any) => m.type === 'sortie' && m.source === 'caisse');
  const sortiesBanque = mouvements.filter((m: any) => m.type === 'sortie' && m.source === 'banque');
  const totalSortiesCaisse = sortiesCaisse.reduce((sum: number, m: any) => sum + (m.montant || 0), 0);
  const totalSortiesBanque = sortiesBanque.reduce((sum: number, m: any) => sum + (m.montant || 0), 0);

  const hasActiveFilters = !!dateRange.from || sourceFilter !== "all";
  const clearFilters = () => { setDateRange({ from: undefined, to: undefined }); setSourceFilter("all"); setCurrentPage(1); };

  return {
    dateRange, setDateRange, sourceFilter, setSourceFilter,
    currentPage, setCurrentPage, pageSize, setPageSize,
    exportModalOpen, setExportModalOpen,
    isLoading, mouvements, totalPages, totalItems,
    soldeCaisse, soldeBanques, soldeGlobal, totalEntrees, totalSorties,
    totalEntreesCaisse, totalEntreesBanque, totalSortiesCaisse, totalSortiesBanque,
    hasActiveFilters, clearFilters,
  };
}
