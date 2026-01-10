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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Search, 
  Loader2, 
  CreditCard, 
  Trash2, 
  Eye,
  FileText,
  ClipboardList,
  Receipt,
  CalendarIcon,
  Download,
  Wallet
} from "lucide-react";
import { usePaiements, useDeletePaiement, useClients } from "@/hooks/use-commercial";
import { formatMontant, formatDate } from "@/data/mockData";
import { TablePagination } from "@/components/TablePagination";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function PaiementsPage() {
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [dateDebut, setDateDebut] = useState<Date | undefined>();
  const [dateFin, setDateFin] = useState<Date | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  
  // API hooks
  const { data: paiementsData, isLoading, error } = usePaiements({
    search: searchTerm || undefined,
    type: typeFilter !== "all" ? typeFilter as 'facture' | 'ordre' : undefined,
    mode_paiement: modeFilter !== "all" ? modeFilter : undefined,
    client_id: clientFilter !== "all" ? clientFilter : undefined,
    date_debut: dateDebut ? format(dateDebut, 'yyyy-MM-dd') : undefined,
    date_fin: dateFin ? format(dateFin, 'yyyy-MM-dd') : undefined,
    page: currentPage,
    per_page: pageSize,
  });
  
  const { data: clientsData } = useClients({ per_page: 1000 });
  const deletePaiementMutation = useDeletePaiement();
  
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; montant: number } | null>(null);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deletePaiementMutation.mutateAsync(confirmDelete.id);
    setConfirmDelete(null);
  };

  const paiementsList = paiementsData?.data || [];
  const totalPages = paiementsData?.meta?.last_page || 1;
  const totalItems = paiementsData?.meta?.total || 0;
  const clientsList = clientsData?.data || [];

  // Statistiques
  const totalMontant = paiementsList.reduce((sum, p) => sum + (p.montant || 0), 0);

  const getModeBadge = (mode: string) => {
    const configs: Record<string, { className: string }> = {
      'Espèces': { className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200" },
      'Chèque': { className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200" },
      'Virement': { className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200" },
      'Mobile Money': { className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200" },
    };
    const config = configs[mode] || { className: "bg-gray-100 text-gray-800" };
    return (
      <Badge variant="outline" className={cn(config.className, "transition-all duration-200 hover:scale-105")}>
        {mode}
      </Badge>
    );
  };

  const getTypeBadge = (type?: string) => {
    if (type === 'facture') {
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 flex items-center gap-1">
          <Receipt className="h-3 w-3" />
          Facture
        </Badge>
      );
    }
    if (type === 'ordre') {
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 flex items-center gap-1">
          <ClipboardList className="h-3 w-3" />
          Ordre
        </Badge>
      );
    }
    return <Badge variant="outline">N/A</Badge>;
  };

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setModeFilter("all");
    setClientFilter("all");
    setDateDebut(undefined);
    setDateFin(undefined);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <MainLayout title="Paiements">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Paiements">
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
          <p className="text-destructive">Erreur lors du chargement des paiements</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
            Réessayer
          </Button>
        </div>
      </MainLayout>
    );
  }

  // État vide
  if (paiementsList.length === 0 && !searchTerm && typeFilter === "all" && modeFilter === "all" && clientFilter === "all" && !dateDebut && !dateFin) {
    return (
      <MainLayout title="Paiements">
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
          <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Aucun paiement</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Aucun paiement n'a été enregistré pour le moment.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Paiements">
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Paiements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Montant Total (page)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatMontant(totalMontant)}</div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Éléments affichés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paiementsList.length} / {totalItems}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="facture">Factures</SelectItem>
                <SelectItem value="ordre">Ordres de travail</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={modeFilter} onValueChange={setModeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les modes</SelectItem>
                <SelectItem value="Espèces">Espèces</SelectItem>
                <SelectItem value="Chèque">Chèque</SelectItem>
                <SelectItem value="Virement">Virement</SelectItem>
                <SelectItem value="Mobile Money">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les clients</SelectItem>
                {clientsList.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-48 justify-start text-left font-normal", !dateDebut && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateDebut ? format(dateDebut, "dd/MM/yyyy", { locale: fr }) : "Date début"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateDebut} onSelect={setDateDebut} initialFocus locale={fr} />
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-48 justify-start text-left font-normal", !dateFin && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFin ? format(dateFin, "dd/MM/yyyy", { locale: fr }) : "Date fin"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFin} onSelect={setDateFin} initialFocus locale={fr} />
              </PopoverContent>
            </Popover>
            
            {(searchTerm || typeFilter !== "all" || modeFilter !== "all" || clientFilter !== "all" || dateDebut || dateFin) && (
              <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paiementsList.map((paiement, index) => (
                  <TableRow 
                    key={paiement.id} 
                    className="transition-all duration-200 animate-fade-in hover:bg-muted/50"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <TableCell>{formatDate(paiement.date)}</TableCell>
                    <TableCell>
                      {paiement.client?.nom || 
                        paiement.facture?.client?.nom || 
                        paiement.ordre?.client?.nom || 
                        '-'}
                    </TableCell>
                    <TableCell>
                      {paiement.document_numero ? (
                        <span 
                          className="text-primary hover:underline cursor-pointer font-medium"
                          onClick={() => {
                            if (paiement.document_type === 'facture' && paiement.facture_id) {
                              navigate(`/factures/${paiement.facture_id}`);
                            } else if (paiement.ordre_id) {
                              navigate(`/ordres/${paiement.ordre_id}`);
                            }
                          }}
                        >
                          {paiement.document_numero}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getTypeBadge(paiement.document_type)}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatMontant(paiement.montant)}
                    </TableCell>
                    <TableCell>{getModeBadge(paiement.mode_paiement)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {paiement.reference || paiement.numero_cheque || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Voir le document"
                          onClick={() => {
                            if (paiement.document_type === 'facture' && paiement.facture_id) {
                              navigate(`/factures/${paiement.facture_id}`);
                            } else if (paiement.ordre_id) {
                              navigate(`/ordres/${paiement.ordre_id}`);
                            }
                          }}
                          className="transition-all duration-200 hover:scale-110 hover:bg-primary/10"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Supprimer"
                          className="text-destructive transition-all duration-200 hover:scale-110 hover:bg-destructive/10"
                          onClick={() => setConfirmDelete({ id: paiement.id, montant: paiement.montant })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paiementsList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Aucun paiement trouvé avec les critères sélectionnés
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce paiement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce paiement de {confirmDelete ? formatMontant(confirmDelete.montant) : ''} ? 
              Cette action annulera le paiement et mettra à jour les montants sur le document associé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
