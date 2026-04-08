import { useState, useMemo } from "react";
import { useMouvementsCaisse, useSoldeCaisse, usePaiements } from "@/hooks/use-commercial";
import { format, startOfMonth, endOfMonth } from "date-fns";

export function useCaisseGlobaleData() {
  // Par défaut : mois en cours
  const now = new Date();
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: startOfMonth(now),
    to: endOfMonth(now),
  });
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const dateDebut = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const dateFin = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

  const { data: mouvementsData, isLoading } = useMouvementsCaisse({
    source: sourceFilter !== 'all' ? sourceFilter : undefined,
    date_debut: dateDebut,
    date_fin: dateFin,
    page: currentPage,
    per_page: pageSize,
  });

  const { data: soldeData } = useSoldeCaisse();

  // Paiements filtrés par période (caisse = espèces)
  const { data: paiementsCaisseData } = usePaiements({
    mode_paiement: 'Espèces',
    date_debut: dateDebut,
    date_fin: dateFin,
    per_page: 1000,
  });

  // Paiements filtrés par période (banque = virements/chèques)
  const { data: paiementsBanqueData } = usePaiements({
    date_debut: dateDebut,
    date_fin: dateFin,
    per_page: 1000,
  });

  const mouvements = mouvementsData?.data || [];
  const totalPages = mouvementsData?.meta?.last_page || 1;
  const totalItems = mouvementsData?.meta?.total || 0;

  // Soldes restent globaux (c'est le solde actuel du compte)
  const soldeCaisse = soldeData?.solde || 0;
  const soldeBanques = soldeData?.solde_banques || 0;
  const soldeGlobal = soldeData?.solde_total || (soldeCaisse + soldeBanques);
  const totalEntrees = soldeData?.total_entrees || 0;
  const totalSorties = soldeData?.total_sorties || 0;

  // Entrées/Sorties par source filtrées par période
  const paiementsCaisse = paiementsCaisseData?.data || [];
  const paiementsBanque = (paiementsBanqueData?.data || []).filter((p: any) => p.mode_paiement === 'Virement' || p.mode_paiement === 'Chèque');

  const totalEntreesCaisse = paiementsCaisse.reduce((sum: number, p: any) => sum + (p.montant || 0), 0);
  const totalEntreesBanque = paiementsBanque.reduce((sum: number, p: any) => sum + (p.montant || 0), 0);

  const sortiesCaisse = mouvements.filter((m: any) => m.type === 'sortie' && m.source === 'caisse');
  const sortiesBanque = mouvements.filter((m: any) => m.type === 'sortie' && m.source === 'banque');
  const totalSortiesCaisse = sortiesCaisse.reduce((sum: number, m: any) => sum + (m.montant || 0), 0);
  const totalSortiesBanque = sortiesBanque.reduce((sum: number, m: any) => sum + (m.montant || 0), 0);

  const hasActiveFilters = !!dateRange.from || sourceFilter !== "all";
  const clearFilters = () => { setDateRange({ from: startOfMonth(now), to: endOfMonth(now) }); setSourceFilter("all"); setCurrentPage(1); };

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
