import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, FileCheck } from "lucide-react";
import { DevisCard, DevisGridSkeleton } from "@/components/devis/shared";
import { DocumentFilters, DocumentEmptyState, DocumentLoadingState, DocumentErrorState } from "@/components/shared/documents";
import { TablePagination } from "@/components/TablePagination";
import { useDevisData } from "./devis/useDevisData";
import { DevisStatsCards } from "./devis/DevisStatsCards";
import { DevisTable } from "./devis/DevisTable";
import { DevisModals } from "./devis/DevisModals";

const statutOptions = [
  { value: "all", label: "Tous statuts" },
  { value: "brouillon", label: "Brouillon" },
  { value: "envoye", label: "Envoyé" },
  { value: "accepte", label: "Accepté" },
  { value: "refuse", label: "Refusé" },
  { value: "expire", label: "Expiré" },
  { value: "converti", label: "Converti" },
];

const categorieOptions = [
  { value: "all", label: "Toutes catégories" },
  { value: "Conteneur", label: "Conteneurs" },
  { value: "Lot", label: "Conventionnel" },
  { value: "Independant", label: "Indépendant" },
];

export default function DevisPage() {
  const navigate = useNavigate();
  const d = useDevisData();

  if (d.isLoading) {
    return <MainLayout title="Devis"><DocumentLoadingState message="Chargement des devis..." /></MainLayout>;
  }

  if (d.error) {
    return <MainLayout title="Devis"><DocumentErrorState message="Erreur lors du chargement des devis" onRetry={() => d.refetch()} /></MainLayout>;
  }

  if (d.devisList.length === 0 && !d.searchTerm && d.statutFilter === "all") {
    return (
      <MainLayout title="Devis">
        <DocumentEmptyState icon={FileCheck} title="Aucun devis" description="Commencez par créer votre premier devis pour proposer vos services à vos clients." actionLabel="Créer un devis" onAction={() => navigate("/devis/nouveau")} />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Devis">
      <div className="space-y-6 animate-fade-in">
        <DevisStatsCards totalItems={d.totalItems} totalMontant={d.totalMontant} devisAcceptes={d.devisAcceptes} devisEnAttente={d.devisEnAttente} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <DocumentFilters
            searchTerm={d.searchTerm} onSearchChange={d.setSearchTerm} searchPlaceholder="Rechercher par numéro, client..."
            statutFilter={d.statutFilter} onStatutChange={d.setStatutFilter} statutOptions={statutOptions}
            categorieFilter={d.categorieFilter} onCategorieChange={d.setCategorieFilter} categorieOptions={categorieOptions}
            viewMode={d.viewMode} onViewModeChange={d.setViewMode} showViewToggle isSearching={d.isSearching}
          />
          <Button className="gap-2 shadow-md transition-all duration-200 hover:scale-105 shrink-0" onClick={() => navigate("/devis/nouveau")}>
            <Plus className="h-4 w-4" /> Nouveau devis
          </Button>
        </div>

        {d.viewMode === 'grid' ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {d.filteredDevis.map((dv: any, index: number) => (
                <div key={dv.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <DevisCard devis={dv} onAction={d.handleCardAction} onWhatsApp={d.handleWhatsAppShare} onEmail={() => d.setEmailModal(dv)} />
                </div>
              ))}
            </div>
            <Card className="p-4">
              <TablePagination currentPage={d.currentPage} totalPages={d.totalPages} pageSize={d.pageSize} totalItems={d.totalItems} onPageChange={d.setCurrentPage} onPageSizeChange={(s) => { d.setPageSize(s); d.setCurrentPage(1); }} />
            </Card>
          </>
        ) : (
          <DevisTable
            filteredDevis={d.filteredDevis} tableRenderKey={d.tableRenderKey}
            currentPage={d.currentPage} totalPages={d.totalPages} pageSize={d.pageSize} totalItems={d.totalItems}
            onPageChange={d.setCurrentPage} onPageSizeChange={(s) => { d.setPageSize(s); d.setCurrentPage(1); }}
            onConfirmAction={d.handleCardAction} onWhatsApp={d.handleWhatsAppShare} onEmail={d.setEmailModal}
          />
        )}
      </div>

      <DevisModals
        confirmAction={d.confirmAction} onConfirmClose={() => d.setConfirmAction(null)} onConfirmAction={d.handleAction}
        emailModal={d.emailModal} onEmailClose={() => d.setEmailModal(null)}
      />
    </MainLayout>
  );
}
