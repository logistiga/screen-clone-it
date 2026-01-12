import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
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
import { Plus, Search, Eye, Edit, Trash2, Users, Loader2, Receipt, Banknote, TrendingUp, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useClients, useDeleteClient } from "@/hooks/use-commercial";
import { formatMontant } from "@/data/mockData";
import { TablePagination } from "@/components/TablePagination";

export default function ClientsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; nom: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // API hooks
  const { data: clientsData, isLoading, error } = useClients({
    search: searchTerm || undefined,
    page: currentPage,
    per_page: pageSize,
  });

  const deleteClientMutation = useDeleteClient();

  const clientsList = clientsData?.data || [];
  const totalPages = clientsData?.meta?.last_page || 1;
  const totalItems = clientsData?.meta?.total || 0;

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deleteClientMutation.mutateAsync(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  // Statistiques
  const totalSolde = clientsList.reduce((sum, c) => sum + (c.solde || 0), 0);
  const totalAvoirs = clientsList.reduce((sum, c) => sum + ((c as any).solde_avoirs || 0), 0);
  const clientsAvecSolde = clientsList.filter(c => (c.solde || 0) > 0).length;

  if (isLoading) {
    return (
      <MainLayout title="Clients">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Clients">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive">Erreur lors du chargement des clients</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
            Réessayer
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (clientsList.length === 0 && !searchTerm) {
    return (
      <MainLayout title="Clients">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Aucun client</h2>
          <p className="text-muted-foreground mb-6">Commencez par ajouter votre premier client.</p>
          <Button onClick={() => navigate("/clients/nouveau")} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau client
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Clients">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Solde Total Dû
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatMontant(totalSolde)}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Total Avoirs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatMontant(totalAvoirs)}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Clients avec Solde
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientsAvecSolde}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button className="gap-2" onClick={() => navigate("/clients/nouveau")}>
            <Plus className="h-4 w-4" />
            Nouveau client
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nom</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead className="text-right">Solde Dû</TableHead>
                  <TableHead className="text-right">Avoirs</TableHead>
                  <TableHead className="w-32 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientsList.map((client) => {
                  const soldeAvoirs = (client as any).solde_avoirs || 0;
                  return (
                    <TableRow key={client.id} className="hover:bg-muted/50 group">
                      <TableCell 
                        className="font-medium text-primary hover:underline cursor-pointer"
                        onClick={() => navigate(`/clients/${client.id}`)}
                      >
                        {client.nom}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{client.email}</div>
                        <div className="text-xs text-muted-foreground">{client.telephone}</div>
                      </TableCell>
                      <TableCell>{client.ville}</TableCell>
                      <TableCell className="text-right">
                        {(client.solde || 0) > 0 ? (
                          <Badge variant="destructive" className="font-mono">
                            {formatMontant(client.solde)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">0 FCFA</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {soldeAvoirs > 0 ? (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700 font-mono">
                            {formatMontant(soldeAvoirs)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/clients/${client.id}`)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Voir détails</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/clients/${client.id}/modifier`)}>
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
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={deleteClientMutation.isPending}>
              {deleteClientMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
