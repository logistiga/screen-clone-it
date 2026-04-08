import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus, Download, CreditCard, Receipt } from "lucide-react";
import { DocumentFilters, DocumentEmptyState, DocumentLoadingState, DocumentErrorState } from "@/components/shared/documents";
import { useFacturesData } from "./factures/useFacturesData";
import { FacturesStatsCards } from "./factures/FacturesStatsCards";
import { FacturesTable } from "./factures/FacturesTable";
import { FacturesModals } from "./factures/FacturesModals";

const statutOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "brouillon", label: "Brouillon" },
  { value: "validee", label: "Validée" },
  { value: "payee", label: "Payée" },
  { value: "partiellement_payee", label: "Partielle" },
  { value: "annulee", label: "Annulée" },
];

const categorieOptions = [
  { value: "all", label: "Toutes catégories" },
  { value: "conteneurs", label: "Conteneurs" },
  { value: "conventionnel", label: "Conventionnel" },
  { value: "operations_independantes", label: "Indépendant" },
];

export default function FacturesPage() {
  const navigate = useNavigate();
  const d = useFacturesData();

  if (d.isLoading) return <MainLayout title="Factures"><DocumentLoadingState message="Chargement des factures..." /></MainLayout>;
  if (d.error) return <MainLayout title="Factures"><DocumentErrorState message="Erreur lors du chargement des factures" onRetry={() => d.refetch()} /></MainLayout>;
  if (d.facturesList.length === 0 && !d.searchTerm && d.statutFilter === "all" && d.categorieFilter === "all") {
    return <MainLayout title="Factures"><DocumentEmptyState icon={Receipt} title="Aucune facture" description="Commencez par créer votre première facture pour gérer vos encaissements." actionLabel="Nouvelle facture" onAction={() => navigate("/factures/nouvelle")} /></MainLayout>;
  }

  return (
    <MainLayout title="Factures">
      <div className="space-y-6 animate-fade-in">
        <FacturesStatsCards totalItems={d.totalItems} totalFactures={d.totalFactures} totalPaye={d.totalPaye} facturesEnAttente={d.facturesEnAttente} />

        <DocumentFilters
          searchTerm={d.searchTerm} onSearchChange={d.setSearchTerm} searchPlaceholder="Rechercher par numéro, client, conteneur..."
          statutFilter={d.statutFilter} onStatutChange={d.setStatutFilter} statutOptions={statutOptions}
          categorieFilter={d.categorieFilter} onCategorieChange={d.setCategorieFilter} categorieOptions={categorieOptions}
          isSearching={d.isSearching}
        />

        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" className="gap-2 transition-all duration-200 hover:scale-105" onClick={() => d.setPaiementGlobalOpen(true)}><CreditCard className="h-4 w-4" />Paiement global</Button>
          <Button variant="outline" className="gap-2 transition-all duration-200 hover:scale-105" onClick={() => d.setExportOpen(true)}><Download className="h-4 w-4" />Exporter</Button>
          <Button className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md" onClick={() => navigate("/factures/nouvelle")}><Plus className="h-4 w-4" />Nouvelle facture</Button>
        </div>

        <FacturesTable
          facturesList={d.facturesList} tableRenderKey={d.tableRenderKey}
          currentPage={d.currentPage} totalPages={d.totalPages} pageSize={d.pageSize} totalItems={d.totalItems}
          onPageChange={d.setCurrentPage} onPageSizeChange={(s) => { d.setPageSize(s); d.setCurrentPage(1); }}
          onDelete={d.setConfirmDelete} onEmail={d.setEmailModal} onPaiement={d.setPaiementModal}
          onAnnulation={d.setAnnulationModal} onAnnulationPaiement={d.setAnnulationPaiementModal}
        />
      </div>

      <FacturesModals
        confirmDelete={d.confirmDelete} onConfirmDeleteClose={() => d.setConfirmDelete(null)} onHandleDelete={d.handleDelete}
        emailModal={d.emailModal} onEmailClose={() => d.setEmailModal(null)}
        paiementModal={d.paiementModal} onPaiementClose={() => d.setPaiementModal(null)}
        annulationModal={d.annulationModal} onAnnulationClose={() => d.setAnnulationModal(null)}
        paiementGlobalOpen={d.paiementGlobalOpen} onPaiementGlobalClose={d.setPaiementGlobalOpen}
        exportOpen={d.exportOpen} onExportClose={d.setExportOpen}
        annulationPaiementModal={d.annulationPaiementModal} onAnnulationPaiementClose={() => d.setAnnulationPaiementModal(null)}
        onRefetch={() => d.refetch()}
      />
    </MainLayout>
  );
}
