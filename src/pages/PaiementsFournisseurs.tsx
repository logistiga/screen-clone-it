import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DocumentFilters, DocumentLoadingState } from "@/components/shared/documents";
import { TablePagination } from "@/components/TablePagination";
import { usePaiementsFournisseursData } from "./paiements-fournisseurs/usePaiementsFournisseursData";
import { PFStatsCards } from "./paiements-fournisseurs/PFStatsCards";
import { PFTable } from "./paiements-fournisseurs/PFTable";
import { CreateFactureModal, AvanceModal, DetailModal } from "./paiements-fournisseurs/PFModals";

const statutOptions = [
  { value: "all", label: "Toutes les factures" },
  { value: "en_cours", label: "En cours de paiement" },
  { value: "solde", label: "Soldées" },
];

export default function PaiementsFournisseursPage() {
  const d = usePaiementsFournisseursData();

  return (
    <MainLayout title="Paiements Fournisseurs">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Paiements Fournisseurs</h1>
            <p className="text-muted-foreground mt-1">Suivi des paiements par tranche et avances</p>
          </div>
          <Button onClick={() => d.setShowCreateModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />Nouvelle facture
          </Button>
        </div>

        <PFStatsCards stats={d.stats} />

        <DocumentFilters
          searchTerm={d.search}
          onSearchChange={(v) => { d.setSearch(v); d.setPage(1); }}
          searchPlaceholder="Rechercher par fournisseur, référence..."
          statutFilter={d.statut}
          onStatutChange={(v) => { d.setStatut(v); d.setPage(1); }}
          statutOptions={statutOptions}
        />

        {d.isLoading ? (
          <DocumentLoadingState message="Chargement des paiements fournisseurs..." />
        ) : (
          <PFTable items={d.items} onOpenDetail={d.openDetail} onOpenAvance={d.openAvance} />
        )}

        {d.totalPages > 1 && (
          <TablePagination
            currentPage={d.page} totalPages={d.totalPages} pageSize={d.pageSize} totalItems={d.totalCount}
            onPageChange={d.setPage} onPageSizeChange={(s) => { d.setPageSize(s); d.setPage(1); }}
          />
        )}
      </div>

      <CreateFactureModal open={d.showCreateModal} onOpenChange={d.setShowCreateModal} />
      <AvanceModal open={d.showAvanceModal} onOpenChange={d.setShowAvanceModal} pf={d.selectedPF} />
      <DetailModal open={d.showDetailModal} onOpenChange={d.setShowDetailModal} pf={d.selectedPF} />
    </MainLayout>
  );
}
