import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBanques, usePaiements, useMouvementsCaisse, useDeleteMouvementCaisse } from "@/hooks/use-commercial";
import { format } from "date-fns";

export function useBanqueData() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [banqueFilter, setBanqueFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateDebut, setDateDebut] = useState<Date | undefined>();
  const [dateFin, setDateFin] = useState<Date | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showSortieModal, setShowSortieModal] = useState(false);
  const [showEntreeModal, setShowEntreeModal] = useState(false);
  const [deletingMouvement, setDeletingMouvement] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("mouvements");

  const { data: banques = [], isLoading: banquesLoading } = useBanques({ actif: true });

  const { data: paiementsData, isLoading: paiementsLoading } = usePaiements({
    search: searchTerm || undefined,
    banque_id: banqueFilter !== 'all' ? banqueFilter : undefined,
    date_debut: dateDebut ? format(dateDebut, 'yyyy-MM-dd') : undefined,
    date_fin: dateFin ? format(dateFin, 'yyyy-MM-dd') : undefined,
    page: currentPage,
    per_page: pageSize,
  });

  const { data: decaissementsData, isLoading: decaissementsLoading, refetch: refetchDecaissements } = useMouvementsCaisse({
    type: 'Sortie',
    source: 'banque',
    banque_id: banqueFilter !== 'all' ? banqueFilter : undefined,
    date_debut: dateDebut ? format(dateDebut, 'yyyy-MM-dd') : undefined,
    date_fin: dateFin ? format(dateFin, 'yyyy-MM-dd') : undefined,
    per_page: 1000,
  });

  const deleteMouvement = useDeleteMouvementCaisse();
  const isLoading = banquesLoading || paiementsLoading || decaissementsLoading;

  const allPaiements = paiementsData?.data || [];
  const decaissementsList = decaissementsData?.data || [];
  const totalPages = paiementsData?.meta?.last_page || 1;
  const totalItems = paiementsData?.meta?.total || 0;

  const bankPaiements = allPaiements.filter((p: any) =>
    p.mode_paiement === 'Virement' || p.mode_paiement === 'Chèque'
  );

  const encaissements = bankPaiements.map((p: any) => ({
    id: 'paiement_' + p.id,
    type: 'entree' as const,
    date: p.date,
    montant: p.montant,
    categorie: p.mode_paiement,
    description: p.document_numero || p.facture?.numero || p.ordre?.numero,
    tiers: p.client?.nom || p.facture?.client?.nom || p.ordre?.client?.nom,
    banque: p.banque,
    reference: p.reference || p.numero_cheque,
    source_type: 'paiement' as const,
    source_id: p.id,
    document_type: p.facture_id ? 'facture' : (p.ordre_id ? 'ordre' : null),
    document_id: p.facture_id || p.ordre_id,
  }));

  const decaissements = decaissementsList.map((m: any) => ({
    id: 'mouvement_' + m.id,
    type: 'sortie' as const,
    date: m.date || m.created_at,
    montant: m.montant,
    categorie: m.categorie,
    description: m.description,
    tiers: m.beneficiaire,
    banque: m.banque,
    reference: null,
    source_type: 'mouvement' as const,
    source_id: m.id,
    document_type: null,
    document_id: null,
  }));

  let mouvements = [...encaissements, ...decaissements].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (typeFilter === 'entree') mouvements = mouvements.filter(m => m.type === 'entree');
  else if (typeFilter === 'sortie') mouvements = mouvements.filter(m => m.type === 'sortie');

  const totalSoldeBanques = banques.reduce((sum, b) => sum + (b.solde || 0), 0);
  const totalEncaissements = encaissements.reduce((sum, e) => sum + (e.montant || 0), 0);
  const totalDecaissements = decaissements.reduce((sum, d) => sum + (d.montant || 0), 0);
  const soldePeriode = totalEncaissements - totalDecaissements;

  const hasFilters = !!(searchTerm || banqueFilter !== "all" || typeFilter !== "all" || dateDebut || dateFin);
  const clearFilters = () => { setSearchTerm(""); setBanqueFilter("all"); setTypeFilter("all"); setDateDebut(undefined); setDateFin(undefined); setCurrentPage(1); };

  const handleDeleteMouvement = async () => {
    if (!deletingMouvement) return;
    try {
      await deleteMouvement.mutateAsync(String(deletingMouvement.source_id));
      setDeletingMouvement(null);
      refetchDecaissements();
    } catch { /* handled by hook */ }
  };

  const handleViewDocument = (mouvement: any) => {
    if (mouvement.document_type === 'facture' && mouvement.document_id) navigate(`/factures/${mouvement.document_id}`);
    else if (mouvement.document_type === 'ordre' && mouvement.document_id) navigate(`/ordres/${mouvement.document_id}`);
  };

  return {
    searchTerm, setSearchTerm, banqueFilter, setBanqueFilter, typeFilter, setTypeFilter,
    dateDebut, setDateDebut, dateFin, setDateFin,
    currentPage, setCurrentPage, pageSize, setPageSize,
    showSortieModal, setShowSortieModal, showEntreeModal, setShowEntreeModal,
    deletingMouvement, setDeletingMouvement, activeTab, setActiveTab,
    banques, isLoading, mouvements, totalPages, totalItems,
    totalSoldeBanques, totalEncaissements, totalDecaissements, soldePeriode,
    encaissements, decaissements, hasFilters, clearFilters,
    handleDeleteMouvement, handleViewDocument, deleteMouvement, refetchDecaissements,
    navigate,
  };
}
