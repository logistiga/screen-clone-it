import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Users, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ClientCard, ClientFilters } from "@/components/clients";
import { Client } from "@/lib/api/commercial";
import { MainLayout } from "@/components/layout/MainLayout";
import { InfiniteScrollLoader } from "@/components/InfiniteScrollLoader";
import { useClientsData } from "./clients/useClientsData";
import { ClientsStatsCards } from "./clients/ClientsStatsCards";
import { ClientsTable } from "./clients/ClientsTable";

export default function ClientsPage() {
  const navigate = useNavigate();
  const {
    searchTerm, setSearchTerm, deleteConfirm, setDeleteConfirm,
    viewMode, setViewMode, statusFilter, setStatusFilter,
    villeFilter, setVilleFilter, handleSort, sortField, sortOrder,
    clients, totalItems, filteredClients, stats, villes,
    isInitialLoading, isSearching, error,
    fetchNextPage, hasNextPage, isFetchingNextPage, loadMoreRef,
    deleteClientMutation, handleDelete, clearFilters, hasActiveFilters,
    tableRenderKey,
  } = useClientsData();

  if (isInitialLoading) {
    return (
      <MainLayout title="Clients">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Clients">
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-muted-foreground">Erreur lors du chargement des clients</p>
          <Button onClick={() => window.location.reload()}>Réessayer</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Clients">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground">
              Gérez votre portefeuille clients
              {totalItems > 0 && (
                <span className="ml-2 text-sm">({clients.length} / {totalItems} chargés)</span>
              )}
            </p>
          </div>
          <Button onClick={() => navigate("/clients/nouveau")} className="shadow-lg hover:shadow-xl transition-shadow">
            <Plus className="h-4 w-4 mr-2" />Nouveau client
          </Button>
        </div>

        <ClientsStatsCards stats={stats} />

        <ClientFilters
          searchTerm={searchTerm} onSearchChange={setSearchTerm}
          viewMode={viewMode} onViewModeChange={setViewMode}
          statusFilter={statusFilter} onStatusFilterChange={setStatusFilter}
          villeFilter={villeFilter} onVilleFilterChange={setVilleFilter}
          villes={villes} onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters} isSearching={isSearching}
        />

        {filteredClients.length === 0 && !isSearching ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Aucun client trouvé</h3>
              <p className="text-muted-foreground mt-1">
                {hasActiveFilters ? "Essayez de modifier vos filtres" : "Commencez par ajouter un client"}
              </p>
              {!hasActiveFilters && (
                <Button onClick={() => navigate("/clients/nouveau")} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />Nouveau client
                </Button>
              )}
            </div>
          </Card>
        ) : viewMode === "cards" ? (
          <div className="space-y-4">
            {isSearching ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredClients.map((client: Client) => (
                  <ClientCard key={client.id} client={client}
                    onEdit={(id) => navigate(`/clients/${id}/modifier`)}
                    onDelete={(c) => setDeleteConfirm({ id: c.id, nom: c.nom })}
                  />
                ))}
              </div>
            )}
            <InfiniteScrollLoader
              ref={loadMoreRef} isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage} loadedCount={clients.length}
              totalCount={totalItems} onLoadMore={() => fetchNextPage()}
            />
          </div>
        ) : (
          <ClientsTable
            filteredClients={filteredClients} isSearching={isSearching}
            tableRenderKey={tableRenderKey} sortField={sortField} sortOrder={sortOrder}
            onSort={handleSort} onDelete={setDeleteConfirm}
            loadMoreRef={loadMoreRef} isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage} loadedCount={clients.length}
            totalCount={totalItems} onLoadMore={() => fetchNextPage()}
          />
        )}

        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le client <strong>{deleteConfirm?.nom}</strong> ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteClientMutation.isPending}>
                {deleteClientMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
