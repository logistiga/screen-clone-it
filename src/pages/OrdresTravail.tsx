import { useState, useMemo, useEffect, useRef } from "react";
import { roundMoney } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnimatedTableBody } from "@/components/ui/animated-table";
import { Plus, Download, CreditCard, ClipboardList, Clock, TrendingUp } from "lucide-react";
import { useOrdres, useDeleteOrdre, useConvertOrdreToFacture } from "@/hooks/use-commercial";
import { formatMontant, getStatutLabel } from "@/data/mockData";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { TablePagination } from "@/components/TablePagination";
import { toast } from "sonner";
import { openWhatsAppShare } from "@/lib/whatsapp";
import {
  DocumentStatCard, DocumentFilters, DocumentEmptyState,
  DocumentLoadingState, DocumentErrorState,
} from "@/components/shared/documents";
import { statutOptions, categorieOptions } from "./ordres-travail/ordres-helpers";
import { OrdreTableRow } from "./ordres-travail/OrdreTableRow";
import { OrdreModals } from "./ordres-travail/OrdreModals";

export default function OrdresTravailPage() {
  const navigate = useNavigate();
  const hasLoadedOnce = useRef(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [categorieFilter, setCategorieFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);

  const now = new Date();
  const dateDebut = format(startOfMonth(now), 'yyyy-MM-dd');
  const dateFin = format(endOfMonth(now), 'yyyy-MM-dd');

  // Main query: NO date filter — shows all data in the table
  const { data: ordresData, isLoading, isFetching, error, refetch } = useOrdres({
    search: debouncedSearch || undefined,
    statut: statutFilter !== "all" ? statutFilter : undefined,
    categorie: categorieFilter !== "all" ? categorieFilter : undefined,
    page: currentPage, per_page: pageSize,
  });

  // Separate query for monthly stats (recap cards only)
  const { data: ordresMoisData } = useOrdres({
    date_debut: dateDebut,
    date_fin: dateFin,
    per_page: 10000,
  });

  const deleteOrdreMutation = useDeleteOrdre();
  const convertMutation = useConvertOrdreToFacture();

  // Modal states
  const [confirmAction, setConfirmAction] = useState<{ type: "supprimer" | "facturer" | null; id: string; numero: string } | null>(null);
  const [annulationModal, setAnnulationModal] = useState<{ id: number; numero: string } | null>(null);
  const [paiementModal, setPaiementModal] = useState<any>(null);
  const [paiementGlobalOpen, setPaiementGlobalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [emailModal, setEmailModal] = useState<any>(null);
  const [annulationPaiementModal, setAnnulationPaiementModal] = useState<{ id: string; numero: string } | null>(null);

  const handleAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === "supprimer") await deleteOrdreMutation.mutateAsync(confirmAction.id);
      else if (confirmAction.type === "facturer") { await convertMutation.mutateAsync(confirmAction.id); toast.success("Ordre converti en facture"); navigate("/factures"); }
    } catch (error: any) { toast.error(error?.response?.data?.message || "Erreur lors de l'opération"); }
    finally { setConfirmAction(null); }
  };

  const handleWhatsAppShare = (ordre: any) => {
    const pdfUrl = `${window.location.origin}/ordres/${ordre.id}/pdf`;
    const montant = new Intl.NumberFormat("fr-FR").format(ordre.montant_ttc || 0) + " FCFA";
    const message = `Bonjour${ordre.client?.raison_sociale ? ` ${ordre.client.raison_sociale}` : ""},\n\nVeuillez trouver ci-dessous votre ordre de travail n° *${ordre.numero}* d'un montant de *${montant}*.\n\n📋 *Détails :*\n• Client : ${ordre.client?.raison_sociale || ordre.client?.nom_complet || "-"}\n• Statut : ${getStatutLabel(ordre.statut)}\n\n📎 ${pdfUrl}\n\nCordialement,\nL'équipe LOGISTIGA`;
    openWhatsAppShare(message);
  };

  const ordresList = Array.isArray(ordresData?.data) ? ordresData.data : [];
  const totalPages = ordresData?.meta?.last_page || 1;
  const totalItems = ordresData?.meta?.total || 0;
  const tableRenderKey = [debouncedSearch, statutFilter, categorieFilter, currentPage, pageSize, totalItems, ordresList.map((o: any) => o.id).join("-")].join("|");

  // Stats from monthly data only (for recap cards)
  const ordresMoisList = Array.isArray(ordresMoisData?.data) ? ordresMoisData.data : [];
  const stats = useMemo(() => ({
    totalOrdres: ordresMoisList.reduce((sum: number, o: any) => sum + (o.montant_ttc || 0), 0),
    totalPaye: ordresMoisList.reduce((sum: number, o: any) => sum + (o.montant_paye || 0), 0),
    ordresEnCours: ordresMoisList.filter((o: any) => o.statut === "en_cours").length,
    count: ordresMoisData?.meta?.total || 0,
  }), [ordresMoisList, ordresMoisData?.meta?.total]);

  if (ordresData) hasLoadedOnce.current = true;

  if (isLoading && !hasLoadedOnce.current) return <MainLayout title="Ordres de Travail"><DocumentLoadingState message="Chargement des ordres..." /></MainLayout>;
  if (error) {
    const err: any = error;
    const status = err?.response?.status;
    const apiMsg = err?.response?.data?.message;
    let message = "Erreur lors du chargement des ordres";
    if (status === 401) message = "Session expirée. Veuillez vous reconnecter.";
    else if (status === 403) message = "Accès refusé à la liste des ordres.";
    else if (apiMsg) message = apiMsg;
    else if (err?.message === "Network Error") message = "Backend injoignable. Vérifiez votre connexion.";
    return <MainLayout title="Ordres de Travail"><DocumentErrorState message={message} onRetry={() => refetch()} /></MainLayout>;
  }
  if (ordresList.length === 0 && !searchTerm && statutFilter === "all" && categorieFilter === "all") {
    return <MainLayout title="Ordres de Travail"><DocumentEmptyState icon={ClipboardList} title="Aucun ordre de travail" description="Commencez par créer votre premier ordre de travail." actionLabel="Créer un ordre" onAction={() => navigate("/ordres/nouveau")} /></MainLayout>;
  }

  return (
    <MainLayout title="Ordres de Travail">
      <div className="space-y-6 animate-fade-in">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DocumentStatCard title="Total Ordres" value={stats.count} icon={ClipboardList} variant="primary" subtitle="Ce mois" delay={0} />
          <DocumentStatCard title="Montant Total" value={formatMontant(stats.totalOrdres)} icon={TrendingUp} variant="info" subtitle="Ce mois" delay={0.1} />
          <DocumentStatCard title="Total Payé" value={formatMontant(stats.totalPaye)} icon={CreditCard} variant="success" subtitle={`${stats.totalOrdres > 0 ? Math.round((stats.totalPaye / stats.totalOrdres) * 100) : 0}% encaissé`} delay={0.2} />
          <DocumentStatCard title="En cours" value={stats.ordresEnCours} icon={Clock} variant="warning" subtitle="Ce mois" delay={0.3} />
        </div>

        <DocumentFilters searchTerm={searchTerm} onSearchChange={(v) => { setSearchTerm(v); setCurrentPage(1); }} searchPlaceholder="Rechercher par numéro, client, conteneur..." statutFilter={statutFilter} onStatutChange={setStatutFilter} statutOptions={statutOptions} categorieFilter={categorieFilter} onCategorieChange={setCategorieFilter} categorieOptions={categorieOptions} isSearching={searchTerm !== debouncedSearch || (isFetching && !!debouncedSearch)} />

        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" className="gap-2 transition-all duration-200 hover:scale-105" onClick={() => setPaiementGlobalOpen(true)}><CreditCard className="h-4 w-4" />Paiement global</Button>
          <Button variant="outline" className="gap-2 transition-all duration-200 hover:scale-105" onClick={() => setExportOpen(true)}><Download className="h-4 w-4" />Exporter</Button>
          <Button className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md" onClick={() => navigate("/ordres/nouveau")}><Plus className="h-4 w-4" />Nouvel ordre</Button>
        </div>

        <Card className="overflow-hidden transition-all duration-300 hover:shadow-md relative">
          {isFetching && hasLoadedOnce.current && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary/20 overflow-hidden z-10">
              <div className="h-full bg-primary animate-[shimmer_1.5s_ease-in-out_infinite] w-1/3" style={{ animation: 'shimmer 1.5s ease-in-out infinite' }} />
            </div>
          )}
          <CardContent className={`p-0 transition-opacity duration-200 ${isFetching && hasLoadedOnce.current ? 'opacity-50' : 'opacity-100'}`}>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Numéro</TableHead><TableHead>Client</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead>
                  <TableHead className="text-right">Total TTC</TableHead><TableHead className="text-right">Payé</TableHead>
                  <TableHead>Statut</TableHead><TableHead>Logistiga</TableHead><TableHead>Facture</TableHead><TableHead className="w-48">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <AnimatedTableBody key={tableRenderKey}>
                {ordresList.map((ordre: any, index: number) => (
                  <OrdreTableRow key={ordre.id} ordre={ordre} index={index}
                    onConfirmAction={setConfirmAction} onPaiement={setPaiementModal}
                    onAnnulationPaiement={setAnnulationPaiementModal} onAnnulation={setAnnulationModal}
                    onEmail={setEmailModal} onWhatsApp={handleWhatsAppShare}
                  />
                ))}
                {ordresList.length === 0 && (
                  <TableRow key={`empty-${tableRenderKey}`}><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Aucun ordre trouvé avec ces critères</TableCell></TableRow>
                )}
              </AnimatedTableBody>
            </Table>
            <TablePagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={totalItems} onPageChange={setCurrentPage} onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }} />
          </CardContent>
        </Card>
      </div>

      <OrdreModals
        confirmAction={confirmAction} onConfirmActionChange={setConfirmAction} onHandleAction={handleAction}
        annulationModal={annulationModal} onAnnulationModalChange={setAnnulationModal}
        paiementModal={paiementModal} onPaiementModalChange={setPaiementModal}
        paiementGlobalOpen={paiementGlobalOpen} onPaiementGlobalChange={setPaiementGlobalOpen}
        exportOpen={exportOpen} onExportChange={setExportOpen}
        emailModal={emailModal} onEmailModalChange={setEmailModal}
        annulationPaiementModal={annulationPaiementModal} onAnnulationPaiementModalChange={setAnnulationPaiementModal}
        onRefetch={() => refetch()}
      />
    </MainLayout>
  );
}
