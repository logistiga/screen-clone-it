import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AnimatedTableRow, AnimatedTableBody } from "@/components/ui/animated-table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Eye, Edit, Trash2, Users, Loader2, Receipt, Banknote, TrendingUp, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useClients, useDeleteClient } from "@/hooks/use-commercial";
import { usePrefetch } from "@/hooks/use-prefetch";
import { formatMontant } from "@/data/mockData";
import { TablePagination } from "@/components/TablePagination";
import { ClientAvatar, ClientHealthBadge, ClientCard, ClientFilters } from "@/components/clients";
import { Client } from "@/lib/api/commercial";
import { MainLayout } from "@/components/layout/MainLayout";

type SortField = "nom" | "solde" | "ville" | "created_at";
type SortOrder = "asc" | "desc";

export default function ClientsPage() {
  const navigate = useNavigate();
  const { prefetchClient } = usePrefetch();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; nom: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Nouveaux états pour filtres et vue
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [statusFilter, setStatusFilter] = useState("all");
  const [villeFilter, setVilleFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("nom");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // API hooks
  const { data: clientsData, isLoading, error } = useClients({
    search: searchTerm || undefined,
    page: currentPage,
    per_page: pageSize,
  });

  const deleteClientMutation = useDeleteClient();

  const clients = clientsData?.data || [];
  const pagination = clientsData?.meta;

  // Extraire les villes uniques pour le filtre
  const villes = useMemo(() => {
    const villeSet = new Set<string>();
    clients.forEach((client: Client) => {
      if (client.ville) villeSet.add(client.ville);
    });
    return Array.from(villeSet).sort();
  }, [clients]);

  // Filtrer et trier les clients
  const filteredClients = useMemo(() => {
    let result = [...clients];

    // Filtre par statut
    if (statusFilter === "with_balance") {
      result = result.filter((c: Client) => Number(c.solde) > 0);
    } else if (statusFilter === "no_balance") {
      result = result.filter((c: Client) => Number(c.solde) <= 0);
    } else if (statusFilter === "with_avoirs") {
      result = result.filter((c: Client) => Number(c.solde_avoirs) > 0);
    }

    // Filtre par ville
    if (villeFilter !== "all") {
      result = result.filter((c: Client) => c.ville === villeFilter);
    }

    // Tri
    result.sort((a: Client, b: Client) => {
      let comparison = 0;
      switch (sortField) {
        case "nom":
          comparison = a.nom.localeCompare(b.nom);
          break;
        case "solde":
          comparison = Number(a.solde) - Number(b.solde);
          break;
        case "ville":
          comparison = (a.ville || "").localeCompare(b.ville || "");
          break;
        case "created_at":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [clients, statusFilter, villeFilter, sortField, sortOrder]);

  // Stats
  const stats = useMemo(() => {
    const total = clients.length;
    const totalSolde = clients.reduce((sum: number, c: Client) => sum + Number(c.solde || 0), 0);
    const totalAvoirs = clients.reduce((sum: number, c: Client) => sum + Number(c.solde_avoirs || 0), 0);
    const withSolde = clients.filter((c: Client) => Number(c.solde) > 0).length;
    return { total, totalSolde, totalAvoirs, withSolde };
  }, [clients]);

  const hasActiveFilters = statusFilter !== "all" || villeFilter !== "all" || searchTerm !== "";

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return sortOrder === "asc" 
      ? <ArrowUp className="h-4 w-4 ml-1" /> 
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteClientMutation.mutateAsync(String(deleteConfirm.id));
      setDeleteConfirm(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setVilleFilter("all");
  };

  if (isLoading) {
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
          <p className="text-muted-foreground">Gérez votre portefeuille clients</p>
        </div>
        <Button onClick={() => navigate("/clients/nouveau")} className="shadow-lg hover:shadow-xl transition-shadow">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau client
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200/50 dark:border-blue-800/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total clients</CardTitle>
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</div>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">clients actifs</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30 border-amber-200/50 dark:border-amber-800/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">Solde total dû</CardTitle>
            <Receipt className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">{formatMontant(stats.totalSolde)}</div>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">créances en cours</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30 border-emerald-200/50 dark:border-emerald-800/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Total avoirs</CardTitle>
            <Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{formatMontant(stats.totalAvoirs)}</div>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">avoirs disponibles</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/50 dark:to-rose-900/30 border-rose-200/50 dark:border-rose-800/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-300">Avec solde</CardTitle>
            <TrendingUp className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-900 dark:text-rose-100">{stats.withSolde}</div>
            <p className="text-xs text-rose-600/70 dark:text-rose-400/70 mt-1">
              {stats.total > 0 ? Math.round((stats.withSolde / stats.total) * 100) : 0}% des clients
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <ClientFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        villeFilter={villeFilter}
        onVilleFilterChange={setVilleFilter}
        villes={villes}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Contenu principal */}
      {filteredClients.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Aucun client trouvé</h3>
            <p className="text-muted-foreground mt-1">
              {hasActiveFilters ? "Essayez de modifier vos filtres" : "Commencez par ajouter un client"}
            </p>
            {!hasActiveFilters && (
              <Button onClick={() => navigate("/clients/nouveau")} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau client
              </Button>
            )}
          </div>
        </Card>
      ) : viewMode === "cards" ? (
        /* Vue Cards */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredClients.map((client: Client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={(id) => navigate(`/clients/${id}/modifier`)}
              onDelete={(c) => setDeleteConfirm({ id: c.id, nom: c.nom })}
            />
          ))}
        </div>
      ) : (
        /* Vue Tableau */
        <Card className="shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[300px]">
                    <button 
                      className="flex items-center hover:text-foreground transition-colors"
                      onClick={() => handleSort("nom")}
                    >
                      Client
                      {getSortIcon("nom")}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button 
                      className="flex items-center justify-end w-full hover:text-foreground transition-colors"
                      onClick={() => handleSort("solde")}
                    >
                      Solde dû
                      {getSortIcon("solde")}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Avoirs</TableHead>
                  <TableHead className="text-right">Statut</TableHead>
                  <TableHead className="w-[120px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <AnimatedTableBody>
                {filteredClients.map((client: Client, index: number) => {
                  const solde = Number(client.solde) || 0;
                  const avoirs = Number(client.solde_avoirs) || 0;
                  
                  return (
                    <AnimatedTableRow 
                      key={client.id} 
                      index={index}
                      className="group cursor-pointer"
                      onClick={() => navigate(`/clients/${client.id}`)}
                      onMouseEnter={() => prefetchClient(client.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ClientAvatar name={client.nom} size="sm" />
                          <div>
                            <p className="font-medium group-hover:text-primary transition-colors">{client.nom}</p>
                            {client.type && (
                              <p className="text-xs text-muted-foreground">{client.type}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={solde > 0 ? "font-semibold text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>
                          {formatMontant(solde)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={avoirs > 0 ? "font-semibold text-blue-600 dark:text-blue-400" : "text-muted-foreground"}>
                          {formatMontant(avoirs)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <ClientHealthBadge solde={solde} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => navigate(`/clients/${client.id}`)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Voir</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => navigate(`/clients/${client.id}/modifier`)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Modifier</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteConfirm({ id: client.id, nom: client.nom })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Supprimer</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </AnimatedTableRow>
                  );
                })}
              </AnimatedTableBody>
            </Table>
          </div>

          {pagination && (
            <div className="p-4 border-t">
              <TablePagination
                currentPage={pagination.current_page}
                totalPages={pagination.last_page}
                pageSize={pageSize}
                totalItems={pagination.total}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </Card>
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le client <strong>{deleteConfirm?.nom}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteClientMutation.isPending}
            >
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
