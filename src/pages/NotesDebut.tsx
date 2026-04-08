import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, CheckCircle2, CreditCard, FileText } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/TablePagination";
import { formatMontant } from "@/data/mockData";
import { DocumentFilters, DocumentEmptyState, DocumentLoadingState } from "@/components/shared/documents";
import { useNotesDebutData, typeFilterOptions, getNoteRemaining } from "./notes-debut/useNotesDebutData";
import { NotesStatsCards } from "./notes-debut/NotesStatsCards";
import { NotesTable } from "./notes-debut/NotesTable";
import { NotesModals } from "./notes-debut/NotesModals";

export default function NotesDebut() {
  const navigate = useNavigate();
  const d = useNotesDebutData();

  if (d.isLoading) return <MainLayout title="Notes de début"><DocumentLoadingState message="Chargement des notes..." /></MainLayout>;

  if (d.notes.length === 0 && !d.hasFilters) {
    return <MainLayout title="Notes de début"><DocumentEmptyState icon={FileText} title="Aucune note de début" description="Commencez par créer votre première note de début (Ouverture de port, Détention, Réparation)." actionLabel="Nouvelle note" onAction={() => navigate("/notes-debut/nouvelle")} /></MainLayout>;
  }

  return (
    <MainLayout title="Notes de début">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Notes de début</h1>
            <p className="text-muted-foreground mt-1">Gérez les notes de début</p>
          </div>
          <Button onClick={() => navigate("/notes-debut/nouvelle")}><Plus className="h-4 w-4 mr-2" />Nouvelle note</Button>
        </div>

        <NotesStatsCards notes={d.notes} totalNotes={d.totalNotes} totalMontant={d.totalMontant} meta={d.meta} pageSize={d.pageSize} />

        <DocumentFilters
          searchTerm={d.searchTerm} onSearchChange={(v) => { d.setSearchTerm(v); d.setCurrentPage(1); }}
          searchPlaceholder="Rechercher par numéro, client, conteneur..."
          statutFilter={d.typeFilter} onStatutChange={(v) => { d.setTypeFilter(v); d.setCurrentPage(1); }}
          statutOptions={typeFilterOptions} isSearching={d.isSearching}
        />

        {d.selectedIds.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{d.selectedIds.length} note(s) sélectionnée(s)</span>
              <span className="text-sm text-muted-foreground">- Total: {formatMontant(d.notes.filter((n: any) => d.selectedIds.includes(n.id)).reduce((sum: number, n: any) => sum + getNoteRemaining(n), 0))} restant</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => d.setSelectedIds([])}>Annuler</Button>
              <Button size="sm" onClick={d.handleGroupPayment}><CreditCard className="h-4 w-4 mr-2" />Payer la sélection</Button>
            </div>
          </motion.div>
        )}

        <NotesTable
          notes={d.notes} tableRenderKey={d.tableRenderKey}
          selectedIds={d.selectedIds} isAllSelected={d.isAllSelected} hasFilters={d.hasFilters}
          onSelectAll={d.handleSelectAll} onSelectOne={d.handleSelectOne} onClearFilters={d.clearFilters}
          onEmail={(note) => { d.setSelectedNote(note); d.setShowEmailModal(true); }}
          onPaiement={(note) => { d.setSelectedNote(note); d.setShowPaiementModal(true); }}
          onDelete={(note) => { d.setSelectedNote(note); d.setShowDeleteDialog(true); }}
        />

        {d.meta.last_page > 1 && (
          <TablePagination currentPage={d.meta.current_page} totalPages={d.meta.last_page} pageSize={d.pageSize} totalItems={d.meta.total}
            onPageChange={d.setCurrentPage} onPageSizeChange={(size) => { d.setPageSize(size); d.setCurrentPage(1); }} />
        )}
      </div>

      <NotesModals
        selectedNote={d.selectedNote}
        showPaiementModal={d.showPaiementModal} onPaiementChange={d.setShowPaiementModal}
        showEmailModal={d.showEmailModal} onEmailChange={d.setShowEmailModal}
        showDeleteDialog={d.showDeleteDialog} onDeleteChange={d.setShowDeleteDialog}
        onConfirmDelete={d.confirmDelete} onPaiementSuccess={d.handlePaiementSuccess}
        deleteIsPending={d.deleteNote.isPending}
      />
    </MainLayout>
  );
}
