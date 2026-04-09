import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { roundMoney } from "@/lib/utils";
import { useFactures, useDeleteFacture } from "@/hooks/use-commercial";
import { format, startOfMonth, endOfMonth } from "date-fns";

export function useFacturesData() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [categorieFilter, setCategorieFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const debouncedSearch = useDebounce(searchTerm, 500);

  const now = new Date();
  const dateDebut = format(startOfMonth(now), 'yyyy-MM-dd');
  const dateFin = format(endOfMonth(now), 'yyyy-MM-dd');

  // Main query: NO date filter — shows all data in the table
  const { data: facturesData, isLoading, isFetching, error, refetch } = useFactures({
    search: debouncedSearch || undefined,
    statut: statutFilter !== "all" ? statutFilter : undefined,
    categorie: categorieFilter !== "all" ? categorieFilter : undefined,
    page: currentPage,
    per_page: pageSize,
  });

  // Separate query for monthly stats (recap cards only)
  const { data: facturesMoisData } = useFactures({
    date_debut: dateDebut,
    date_fin: dateFin,
    per_page: 10000,
  });

  const deleteFactureMutation = useDeleteFacture();

  const [confirmDelete, setConfirmDelete] = useState<{ id: string; numero: string } | null>(null);
  const [emailModal, setEmailModal] = useState<any | null>(null);
  const [paiementModal, setPaiementModal] = useState<{
    id: string; numero: string; montantRestant: number; clientId?: number;
    montantHT: number; montantDejaPaye: number; exonereTva: boolean; exonereCss: boolean;
  } | null>(null);
  const [annulationModal, setAnnulationModal] = useState<{
    id: string; numero: string; montantTTC: number; montantPaye: number; clientNom: string;
  } | null>(null);
  const [paiementGlobalOpen, setPaiementGlobalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [annulationPaiementModal, setAnnulationPaiementModal] = useState<{ id: string; numero: string } | null>(null);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteFactureMutation.mutateAsync(confirmDelete.id);
    setConfirmDelete(null);
  };

  const facturesList = facturesData?.data || [];
  const totalPages = facturesData?.meta?.last_page || 1;
  const totalItems = facturesData?.meta?.total || 0;

  const isSearching = (searchTerm !== debouncedSearch) || (isFetching && !isLoading);
  const tableRenderKey = useMemo(() =>
    [debouncedSearch, statutFilter, categorieFilter, currentPage, pageSize, totalItems, facturesList.map((f: any) => f.id).join("-")].join("|"),
    [debouncedSearch, statutFilter, categorieFilter, currentPage, pageSize, totalItems, facturesList]
  );

  // Stats from monthly data only (for recap cards)
  const facturesMoisList = facturesMoisData?.data || [];
  const totalFactures = facturesMoisList.reduce((sum: number, f: any) => sum + (f.montant_ttc || 0), 0);
  const totalPaye = facturesMoisList.reduce((sum: number, f: any) => sum + (f.montant_paye || 0), 0);
  const facturesEnAttente = facturesMoisList.filter((f: any) => f.statut === 'brouillon' || f.statut === 'validee').length;

  return {
    searchTerm, setSearchTerm, statutFilter, setStatutFilter,
    categorieFilter, setCategorieFilter, currentPage, setCurrentPage,
    pageSize, setPageSize, isLoading, isSearching, error, refetch,
    facturesList, totalPages, totalItems, tableRenderKey,
    totalFactures, totalPaye, facturesEnAttente,
    confirmDelete, setConfirmDelete, handleDelete,
    emailModal, setEmailModal,
    paiementModal, setPaiementModal,
    annulationModal, setAnnulationModal,
    paiementGlobalOpen, setPaiementGlobalOpen,
    exportOpen, setExportOpen,
    annulationPaiementModal, setAnnulationPaiementModal,
  };
}
