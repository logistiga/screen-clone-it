import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/use-debounce";
import { useDevis, useDeleteDevis, useConvertDevisToOrdre, useConvertDevisToFacture, useUpdateDevis } from "@/hooks/use-commercial";
import { openWhatsAppShare } from "@/lib/whatsapp";

export function useDevisData() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [categorieFilter, setCategorieFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: devisData, isLoading, isFetching, error, refetch } = useDevis({
    search: debouncedSearch || undefined,
    statut: statutFilter !== "all" ? statutFilter : undefined,
    page: currentPage,
    per_page: pageSize,
  });

  const deleteDevisMutation = useDeleteDevis();
  const convertToOrdreMutation = useConvertDevisToOrdre();
  const convertToFactureMutation = useConvertDevisToFacture();
  const updateDevisMutation = useUpdateDevis();

  const [confirmAction, setConfirmAction] = useState<{
    type: 'annuler' | 'supprimer' | 'convertir' | 'facturer' | 'valider' | null;
    id: string;
    numero: string;
  } | null>(null);
  const [emailModal, setEmailModal] = useState<any | null>(null);

  const handleAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'annuler') {
        await updateDevisMutation.mutateAsync({ id: confirmAction.id, data: { statut: 'refuse' } });
      } else if (confirmAction.type === 'valider') {
        await updateDevisMutation.mutateAsync({ id: confirmAction.id, data: { statut: 'accepte' } });
      } else if (confirmAction.type === 'supprimer') {
        await deleteDevisMutation.mutateAsync(confirmAction.id);
      } else if (confirmAction.type === 'convertir') {
        const result = await convertToOrdreMutation.mutateAsync(confirmAction.id);
        const ordreId = result?.data?.id;
        navigate(ordreId ? `/ordres/${ordreId}/modifier` : "/ordres");
      } else if (confirmAction.type === 'facturer') {
        const result = await convertToFactureMutation.mutateAsync(confirmAction.id);
        const factureId = result?.data?.id;
        navigate(factureId ? `/factures/${factureId}` : "/factures");
      }
    } catch {
      // mutations handle toast errors internally
    } finally {
      setConfirmAction(null);
    }
  };

  const handleCardAction = (type: 'annuler' | 'supprimer' | 'convertir' | 'facturer' | 'valider', id: string, numero: string) => {
    setConfirmAction({ type, id, numero });
  };

  const handleWhatsAppShare = (devis: any) => {
    const pdfUrl = `${window.location.origin}/devis/${devis.id}/pdf`;
    const montant = new Intl.NumberFormat('fr-FR').format(devis.montant_ttc || 0) + ' FCFA';
    const message = `Bonjour${devis.client?.nom ? ` ${devis.client.nom}` : ''},

Veuillez trouver ci-dessous votre devis n° *${devis.numero}* d'un montant de *${montant}*.

📄 *Détails du devis :*
• Client : ${devis.client?.nom || '-'}
• Montant HT : ${new Intl.NumberFormat('fr-FR').format(devis.montant_ht || 0)} FCFA${devis.remise_montant > 0 ? `
• Remise : -${new Intl.NumberFormat('fr-FR').format(devis.remise_montant)} FCFA` : ''}
• TVA : ${new Intl.NumberFormat('fr-FR').format(devis.montant_tva || 0)} FCFA
• *Total TTC : ${montant}*
• Date de validité : ${devis.date_validite ? new Date(devis.date_validite).toLocaleDateString('fr-FR') : '-'}

📎 *Lien du document PDF :*
${pdfUrl}

Pour toute question, n'hésitez pas à nous contacter.

Cordialement,
L'équipe Logistiga`;
    openWhatsAppShare(message);
  };

  const devisList = devisData?.data || [];
  const totalPages = devisData?.meta?.last_page || 1;
  const totalItems = devisData?.meta?.total || 0;

  const isSearching = (searchTerm !== debouncedSearch) || (isFetching && !isLoading);

  const tableRenderKey = useMemo(() =>
    [debouncedSearch, statutFilter, categorieFilter, currentPage, pageSize, totalItems, devisList.map((d: any) => d.id).join("-")].join("|"),
    [debouncedSearch, statutFilter, categorieFilter, currentPage, pageSize, totalItems, devisList]
  );

  const filteredDevis = categorieFilter === 'all'
    ? devisList
    : devisList.filter((d: any) => d.type_document === categorieFilter);

  const totalMontant = devisList.reduce((sum: number, d: any) => sum + (d.montant_ttc || 0), 0);
  const devisAcceptes = devisList.filter((d: any) => d.statut === 'accepte').length;
  const devisEnAttente = devisList.filter((d: any) => d.statut === 'envoye' || d.statut === 'brouillon').length;

  return {
    searchTerm, setSearchTerm, statutFilter, setStatutFilter,
    categorieFilter, setCategorieFilter, viewMode, setViewMode,
    currentPage, setCurrentPage, pageSize, setPageSize,
    isLoading, isSearching, error, refetch,
    devisList, filteredDevis, totalPages, totalItems, tableRenderKey,
    totalMontant, devisAcceptes, devisEnAttente,
    confirmAction, setConfirmAction, handleAction, handleCardAction,
    emailModal, setEmailModal, handleWhatsAppShare,
  };
}
