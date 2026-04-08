import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowDownCircle, Building2, CreditCard, Loader2, Plus } from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { SortieBancaireModal } from "@/components/SortieBancaireModal";
import { EntreeBancaireModal } from "@/components/EntreeBancaireModal";
import { TablePagination } from "@/components/TablePagination";
import { useBanqueData } from "./banque/useBanqueData";
import { BanqueStatsCards } from "./banque/BanqueStatsCards";
import { BanqueFilters } from "./banque/BanqueFilters";
import { BanqueMouvementsTable } from "./banque/BanqueMouvementsTable";
import { BanqueComptesTab } from "./banque/BanqueComptesTab";

export default function BanquePage() {
  const d = useBanqueData();

  if (d.isLoading) {
    return <MainLayout title="Banque"><div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>;
  }

  if (d.banques.length === 0 && d.mouvements.length === 0) {
    return (
      <MainLayout title="Banque">
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
          <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Aucun mouvement bancaire</h2>
          <p className="text-muted-foreground mb-6 max-w-md">Les paiements par virement et chèque ainsi que les sorties bancaires apparaîtront ici. Configurez d'abord vos comptes bancaires dans Paramétrage → Banques.</p>
          <Button onClick={() => d.navigate('/banques')}><Building2 className="h-4 w-4 mr-2" />Configurer les banques</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Banque">
      <div className="space-y-6 animate-fade-in">
        <BanqueStatsCards
          totalSoldeBanques={d.totalSoldeBanques} totalEncaissements={d.totalEncaissements}
          totalDecaissements={d.totalDecaissements} soldePeriode={d.soldePeriode}
          banquesCount={d.banques.length} encaissementsCount={d.encaissements.length} decaissementsCount={d.decaissements.length}
        />

        <Tabs value={d.activeTab} onValueChange={d.setActiveTab}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="mouvements" className="gap-2"><CreditCard className="h-4 w-4" />Mouvements</TabsTrigger>
              <TabsTrigger value="comptes" className="gap-2"><Building2 className="h-4 w-4" />Comptes bancaires</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button onClick={() => d.setShowEntreeModal(true)} variant="outline" className="gap-2 text-success border-success hover:bg-success/10"><ArrowDownCircle className="h-4 w-4" />Nouvelle entrée bancaire</Button>
              <Button onClick={() => d.setShowSortieModal(true)} className="gap-2"><Plus className="h-4 w-4" />Nouvelle sortie bancaire</Button>
            </div>
          </div>

          <TabsContent value="mouvements" className="space-y-4 mt-4">
            <BanqueFilters
              searchTerm={d.searchTerm} onSearchChange={(v) => { d.setSearchTerm(v); d.setCurrentPage(1); }}
              banqueFilter={d.banqueFilter} onBanqueChange={(v) => { d.setBanqueFilter(v); d.setCurrentPage(1); }}
              typeFilter={d.typeFilter} onTypeChange={(v) => { d.setTypeFilter(v); d.setCurrentPage(1); }}
              dateDebut={d.dateDebut} onDateDebutChange={(dt) => { d.setDateDebut(dt); d.setCurrentPage(1); }}
              dateFin={d.dateFin} onDateFinChange={(dt) => { d.setDateFin(dt); d.setCurrentPage(1); }}
              banques={d.banques} hasFilters={d.hasFilters} onClearFilters={d.clearFilters}
            />

            <BanqueMouvementsTable
              mouvements={d.mouvements} hasFilters={d.hasFilters} onClearFilters={d.clearFilters}
              onViewDocument={d.handleViewDocument} onDeleteMouvement={d.setDeletingMouvement}
            />

            {d.totalPages > 1 && (
              <TablePagination currentPage={d.currentPage} totalPages={d.totalPages} pageSize={d.pageSize} totalItems={d.totalItems}
                onPageChange={d.setCurrentPage} onPageSizeChange={(s) => { d.setPageSize(s); d.setCurrentPage(1); }} />
            )}
          </TabsContent>

          <TabsContent value="comptes" className="mt-4">
            <BanqueComptesTab banques={d.banques} onNavigateBanques={() => d.navigate('/banques')} />
          </TabsContent>
        </Tabs>
      </div>

      <SortieBancaireModal open={d.showSortieModal} onOpenChange={d.setShowSortieModal} onSuccess={() => d.refetchDecaissements()} />
      <EntreeBancaireModal open={d.showEntreeModal} onOpenChange={d.setShowEntreeModal} onSuccess={() => d.refetchDecaissements()} />

      <AlertDialog open={!!d.deletingMouvement} onOpenChange={(open) => !open && d.setDeletingMouvement(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce décaissement de <strong>{d.deletingMouvement && formatMontant(d.deletingMouvement.montant)}</strong> ?<br />Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={d.handleDeleteMouvement} className="bg-destructive hover:bg-destructive/90" disabled={d.deleteMouvement.isPending}>
              {d.deleteMouvement.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
