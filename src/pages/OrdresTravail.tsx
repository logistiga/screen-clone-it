import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Search, Eye, Edit, ArrowRight, Wallet, FileText, Ban, Trash2, Download, CreditCard, ClipboardList, Loader2 } from "lucide-react";
import { PaiementModal } from "@/components/PaiementModal";
import { PaiementGlobalModal } from "@/components/PaiementGlobalModal";
import { ExportModal } from "@/components/ExportModal";
import { useOrdres, useDeleteOrdre, useConvertOrdreToFacture, useUpdateOrdre } from "@/hooks/use-commercial";
import { formatMontant, formatDate, getStatutLabel } from "@/data/mockData";
import { TablePagination } from "@/components/TablePagination";

export default function OrdresTravailPage() {
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // API hooks
  const { data: ordresData, isLoading, error } = useOrdres({
    search: searchTerm || undefined,
    statut: statutFilter !== "all" ? statutFilter : undefined,
    page: currentPage,
    per_page: pageSize,
  });
  
  const deleteOrdreMutation = useDeleteOrdre();
  const convertMutation = useConvertOrdreToFacture();
  const updateOrdreMutation = useUpdateOrdre();
  
  // États modales consolidés
  const [confirmAction, setConfirmAction] = useState<{
    type: 'annuler' | 'supprimer' | 'facturer' | null;
    id: string;
    numero: string;
  } | null>(null);
  const [paiementModal, setPaiementModal] = useState<{ id: string; numero: string; montantRestant: number } | null>(null);
  const [paiementGlobalOpen, setPaiementGlobalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Handlers consolidés
  const handleAction = async () => {
    if (!confirmAction) return;
    
    if (confirmAction.type === 'annuler') {
      await updateOrdreMutation.mutateAsync({ id: confirmAction.id, data: { statut: 'annule' } });
    } else if (confirmAction.type === 'supprimer') {
      await deleteOrdreMutation.mutateAsync(confirmAction.id);
    } else if (confirmAction.type === 'facturer') {
      await convertMutation.mutateAsync(confirmAction.id);
      navigate("/factures");
    }
    setConfirmAction(null);
  };

  const ordresList = ordresData?.data || [];
  const totalPages = ordresData?.meta?.last_page || 1;
  const totalItems = ordresData?.meta?.total || 0;

  // Filtrage par type (côté client car pas de filtre API)
  const filteredOrdres = typeFilter === "all" 
    ? ordresList 
    : ordresList.filter(o => o.type_operation === typeFilter);

  // Statistiques
  const totalOrdres = filteredOrdres.reduce((sum, o) => sum + (o.montant_ttc || 0), 0);
  const totalPaye = filteredOrdres.reduce((sum, o) => sum + (o.montant_paye || 0), 0);
  const ordresEnCours = filteredOrdres.filter(o => o.statut === 'en_cours').length;

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      en_cours: "outline",
      termine: "default",
      facture: "default",
      annule: "destructive",
    };
    return <Badge variant={variants[statut] || "secondary"}>{getStatutLabel(statut)}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      conteneurs: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      conventionnel: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      location: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      transport: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      manutention: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      stockage: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    };
    return <Badge className={colors[type] || "bg-gray-100"}>{type}</Badge>;
  };

  if (isLoading) {
    return (
      <MainLayout title="Ordres de Travail">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Ordres de Travail">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive">Erreur lors du chargement des ordres</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
            Réessayer
          </Button>
        </div>
      </MainLayout>
    );
  }

  // État vide
  if (ordresList.length === 0 && !searchTerm && statutFilter === "all") {
    return (
      <MainLayout title="Ordres de Travail">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Aucun ordre de travail</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Commencez par créer votre premier ordre de travail pour gérer vos opérations.
          </p>
          <Button onClick={() => navigate("/ordres/nouveau")} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvel ordre
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Ordres de Travail">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Ordres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Montant Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMontant(totalOrdres)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Payé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatMontant(totalPaye)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En cours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{ordresEnCours}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statutFilter} onValueChange={setStatutFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="termine">Terminé</SelectItem>
                <SelectItem value="facture">Facturé</SelectItem>
                <SelectItem value="annule">Annulé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="conteneurs">Conteneurs</SelectItem>
                <SelectItem value="conventionnel">Conventionnel</SelectItem>
                <SelectItem value="location">Location</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="manutention">Manutention</SelectItem>
                <SelectItem value="stockage">Stockage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setPaiementGlobalOpen(true)}>
              <CreditCard className="h-4 w-4" />
              Paiement global
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setExportOpen(true)}>
              <Download className="h-4 w-4" />
              Exporter
            </Button>
            <Button className="gap-2" onClick={() => navigate("/ordres/nouveau")}>
              <Plus className="h-4 w-4" />
              Nouvel ordre
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Montant TTC</TableHead>
                  <TableHead className="text-right">Payé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrdres.map((ordre) => {
                  const resteAPayer = (ordre.montant_ttc || 0) - (ordre.montant_paye || 0);
                  return (
                    <TableRow key={ordre.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-primary hover:underline cursor-pointer" onClick={() => navigate(`/ordres/${ordre.id}`)}>
                        {ordre.numero}
                      </TableCell>
                      <TableCell>{ordre.client?.nom}</TableCell>
                      <TableCell>{formatDate(ordre.date_creation)}</TableCell>
                      <TableCell>{getTypeBadge(ordre.categorie || ordre.type_operation)}</TableCell>
                      <TableCell className="text-right">{formatMontant(ordre.montant_ttc)}</TableCell>
                      <TableCell className="text-right">
                        <span className={(ordre.montant_paye || 0) > 0 ? "text-green-600" : ""}>{formatMontant(ordre.montant_paye)}</span>
                        {resteAPayer > 0 && <div className="text-xs text-muted-foreground">Reste: {formatMontant(resteAPayer)}</div>}
                      </TableCell>
                      <TableCell>{getStatutBadge(ordre.statut)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" title="Voir" onClick={() => navigate(`/ordres/${ordre.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {ordre.statut !== 'facture' && ordre.statut !== 'annule' && (
                            <Button variant="ghost" size="icon" title="Modifier" onClick={() => navigate(`/ordres/${ordre.id}/modifier`)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {ordre.statut !== 'facture' && ordre.statut !== 'annule' && resteAPayer > 0 && (
                            <Button variant="ghost" size="icon" title="Paiement" className="text-green-600"
                              onClick={() => setPaiementModal({ id: ordre.id, numero: ordre.numero, montantRestant: resteAPayer })}>
                              <Wallet className="h-4 w-4" />
                            </Button>
                          )}
                          {ordre.statut !== 'facture' && ordre.statut !== 'annule' && (
                            <Button variant="ghost" size="icon" title="Facturer" className="text-primary"
                              onClick={() => setConfirmAction({ type: 'facturer', id: ordre.id, numero: ordre.numero })}>
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" title="PDF" onClick={() => window.open(`/ordres/${ordre.id}/pdf`, '_blank')}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          {ordre.statut !== 'facture' && ordre.statut !== 'annule' && (
                            <Button variant="ghost" size="icon" title="Annuler" className="text-orange-600"
                              onClick={() => setConfirmAction({ type: 'annuler', id: ordre.id, numero: ordre.numero })}>
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" title="Supprimer" className="text-destructive"
                            onClick={() => setConfirmAction({ type: 'supprimer', id: ordre.id, numero: ordre.numero })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Modal Annulation */}
      <AlertDialog open={confirmAction?.type === 'annuler'} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'annulation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir annuler l'ordre <strong>{confirmAction?.numero}</strong> ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non, garder</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} className="bg-orange-600 hover:bg-orange-700" disabled={updateOrdreMutation.isPending}>
              {updateOrdreMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Suppression */}
      <AlertDialog open={confirmAction?.type === 'supprimer'} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'ordre <strong>{confirmAction?.numero}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non, garder</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} className="bg-destructive hover:bg-destructive/90" disabled={deleteOrdreMutation.isPending}>
              {deleteOrdreMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Facturation */}
      <AlertDialog open={confirmAction?.type === 'facturer'} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convertir en facture</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous convertir l'ordre <strong>{confirmAction?.numero}</strong> en facture ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={convertMutation.isPending}>
              {convertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer la facture"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Paiement */}
      <PaiementModal
        open={!!paiementModal}
        onOpenChange={(open) => !open && setPaiementModal(null)}
        documentType="ordre"
        documentNumero={paiementModal?.numero || ""}
        montantRestant={paiementModal?.montantRestant || 0}
      />

      {/* Modal Paiement Global */}
      <PaiementGlobalModal open={paiementGlobalOpen} onOpenChange={setPaiementGlobalOpen} />

      {/* Modal Export */}
      <ExportModal open={exportOpen} onOpenChange={setExportOpen} />
    </MainLayout>
  );
}
