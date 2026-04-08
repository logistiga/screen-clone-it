import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, ArrowDownCircle, Download, Wallet } from "lucide-react";
import { SortieCaisseModal } from "@/components/SortieCaisseModal";
import { EntreeCaisseModal } from "@/components/caisse/EntreeCaisseModal";
import { ExportCaisseModal } from "@/components/caisse/ExportCaisseModal";
import { TablePagination } from "@/components/TablePagination";
import { DocumentFilters, DocumentEmptyState, DocumentLoadingState } from "@/components/shared/documents";
import { useCaisseData } from "./caisse/useCaisseData";
import { CaisseStats } from "./caisse/CaisseStats";
import { CaisseTable } from "./caisse/CaisseTable";

const typeFilterOptions = [
  { value: "all", label: "Tous les types" },
  { value: "entree", label: "Entrées" },
  { value: "sortie", label: "Sorties" },
];

export default function CaissePage() {
  const d = useCaisseData();

  if (d.isLoading) return <MainLayout title="Caisse"><DocumentLoadingState message="Chargement des mouvements..." /></MainLayout>;

  if (d.mouvements.length === 0 && !d.hasFilters) {
    return (
      <MainLayout title="Caisse">
        <DocumentEmptyState icon={Wallet} title="Aucun mouvement de caisse" description="Les paiements en espèces sur les ordres de travail et sorties de caisse apparaîtront ici." actionLabel="Nouvelle sortie" onAction={() => d.setSortieModalOpen(true)} />
        <SortieCaisseModal open={d.sortieModalOpen} onOpenChange={d.setSortieModalOpen} type="caisse" onSuccess={d.handleSuccess} />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Caisse">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Caisse</h1>
            <p className="text-muted-foreground mt-1">Gérez les mouvements de caisse (espèces)</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => d.setExportModalOpen(true)}><Download className="h-4 w-4" />Exporter</Button>
            <Button variant="outline" className="gap-2 text-success border-success hover:bg-success/10" onClick={() => d.setEntreeModalOpen(true)}><ArrowDownCircle className="h-4 w-4" />Nouvelle entrée</Button>
            <Button variant="outline" className="gap-2 text-destructive border-destructive hover:bg-destructive/10" onClick={() => d.setSortieModalOpen(true)}><ArrowUpCircle className="h-4 w-4" />Nouvelle sortie</Button>
          </div>
        </div>

        <CaisseStats soldeJour={d.soldeJour} entreesJour={d.entreesJour} sortiesJour={d.sortiesJour} soldeCaisse={d.soldeCaisse} totalEntrees={d.totalEntrees} totalSorties={d.totalSorties} totalItems={d.totalItems} entreesCount={d.entreesCount} sortiesCount={d.sortiesCount} />

        <DocumentFilters searchTerm={d.searchTerm} onSearchChange={(v) => { d.setSearchTerm(v); d.setCurrentPage(1); }} searchPlaceholder="Rechercher (n° ordre, description)..." statutFilter={d.typeFilter} onStatutChange={(v) => { d.setTypeFilter(v); d.setCurrentPage(1); }} statutOptions={typeFilterOptions} />

        <CaisseTable mouvements={d.mouvements} hasFilters={d.hasFilters} onClearFilters={d.clearFilters} onRefetch={() => d.refetch()} />

        {d.totalPages > 1 && (
          <TablePagination currentPage={d.currentPage} totalPages={d.totalPages} pageSize={d.pageSize} totalItems={d.totalItems} onPageChange={d.setCurrentPage} onPageSizeChange={(s) => { d.setPageSize(s); d.setCurrentPage(1); }} />
        )}
      </div>

      <SortieCaisseModal open={d.sortieModalOpen} onOpenChange={d.setSortieModalOpen} type="caisse" onSuccess={d.handleSuccess} />
      <EntreeCaisseModal open={d.entreeModalOpen} onOpenChange={d.setEntreeModalOpen} onSuccess={d.handleSuccess} />
      <ExportCaisseModal open={d.exportModalOpen} onOpenChange={d.setExportModalOpen} />
    </MainLayout>
  );
}
