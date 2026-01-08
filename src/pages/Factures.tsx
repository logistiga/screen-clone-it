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
import { Plus, Search, Eye, Wallet, Mail, FileText, Ban, Trash2, Edit, Download, CreditCard, Receipt, Loader2, Container, Package, Truck } from "lucide-react";
import { EmailModal } from "@/components/EmailModal";
import { PaiementModal } from "@/components/PaiementModal";
import { PaiementGlobalModal } from "@/components/PaiementGlobalModal";
import { ExportModal } from "@/components/ExportModal";
import { AnnulationModal } from "@/components/AnnulationModal";
import { useFactures, useDeleteFacture } from "@/hooks/use-commercial";
import { formatMontant, formatDate, getStatutLabel } from "@/data/mockData";
import { TablePagination } from "@/components/TablePagination";

export default function FacturesPage() {
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [categorieFilter, setCategorieFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // API hooks
  const { data: facturesData, isLoading, error, refetch } = useFactures({
    search: searchTerm || undefined,
    statut: statutFilter !== "all" ? statutFilter : undefined,
    categorie: categorieFilter !== "all" ? categorieFilter : undefined,
    page: currentPage,
    per_page: pageSize,
  });
  
  const deleteFactureMutation = useDeleteFacture();
  
  // États modales consolidés
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; numero: string } | null>(null);
  const [emailModal, setEmailModal] = useState<{
    open: boolean;
    documentNumero: string;
    clientEmail: string;
    clientNom: string;
  } | null>(null);
  const [paiementModal, setPaiementModal] = useState<{ id: string; numero: string; montantRestant: number } | null>(null);
  const [annulationModal, setAnnulationModal] = useState<{
    id: string;
    numero: string;
    montantTTC: number;
    montantPaye: number;
    clientNom: string;
  } | null>(null);
  const [paiementGlobalOpen, setPaiementGlobalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Handlers consolidés
  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteFactureMutation.mutateAsync(confirmDelete.id);
    setConfirmDelete(null);
  };

  const facturesList = facturesData?.data || [];
  const totalPages = facturesData?.meta?.last_page || 1;
  const totalItems = facturesData?.meta?.total || 0;

  // Statistiques
  const totalFactures = facturesList.reduce((sum, f) => sum + (f.montant_ttc || 0), 0);
  const totalPaye = facturesList.reduce((sum, f) => sum + (f.montant_paye || 0), 0);
  const totalImpaye = totalFactures - totalPaye;

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      brouillon: "outline",
      emise: "outline",
      validee: "secondary",
      payee: "default",
      partiellement_payee: "secondary",
      impayee: "destructive",
      annulee: "destructive",
    };
    return <Badge variant={variants[statut] || "secondary"}>{getStatutLabel(statut)}</Badge>;
  };

  const getCategorieBadge = (categorie?: string) => {
    const configs: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
      conteneurs: { label: "Conteneurs", icon: <Container className="h-3 w-3" />, className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      conventionnel: { label: "Conventionnel", icon: <Package className="h-3 w-3" />, className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
      operations_independantes: { label: "Indépendant", icon: <Truck className="h-3 w-3" />, className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    };
    const config = configs[categorie || ''] || { label: categorie || 'N/A', icon: null, className: "bg-gray-100 text-gray-800" };
    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <MainLayout title="Factures">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Factures">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive">Erreur lors du chargement des factures</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
            Réessayer
          </Button>
        </div>
      </MainLayout>
    );
  }

  // État vide
  if (facturesList.length === 0 && !searchTerm && statutFilter === "all" && categorieFilter === "all") {
    return (
      <MainLayout title="Factures">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Receipt className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Aucune facture</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Commencez par créer votre première facture pour gérer vos encaissements.
          </p>
          <Button className="gap-2" onClick={() => navigate("/factures/nouvelle")}>
            <Plus className="h-4 w-4" />
            Nouvelle facture
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Factures">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Factures</CardTitle>
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
              <div className="text-2xl font-bold">{formatMontant(totalFactures)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Encaissé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatMontant(totalPaye)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Impayé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatMontant(totalImpaye)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statutFilter} onValueChange={setStatutFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="brouillon">Brouillon</SelectItem>
                <SelectItem value="validee">Validée</SelectItem>
                <SelectItem value="payee">Payée</SelectItem>
                <SelectItem value="partiellement_payee">Partielle</SelectItem>
                <SelectItem value="annulee">Annulée</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categorieFilter} onValueChange={setCategorieFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Toutes catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="conteneurs">Conteneurs</SelectItem>
                <SelectItem value="conventionnel">Conventionnel</SelectItem>
                <SelectItem value="operations_independantes">Indépendant</SelectItem>
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
            <Button className="gap-2" onClick={() => navigate("/factures/nouvelle")}>
              <Plus className="h-4 w-4" />
              Nouvelle facture
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
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Total TTC</TableHead>
                  <TableHead className="text-right">Payé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-44">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturesList.map((facture) => {
                  const resteAPayer = (facture.montant_ttc || 0) - (facture.montant_paye || 0);
                  return (
                    <TableRow key={facture.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell 
                        className="font-medium text-primary hover:underline cursor-pointer"
                        onClick={() => navigate(`/factures/${facture.id}`)}
                      >
                        {facture.numero}
                      </TableCell>
                      <TableCell>{facture.client?.nom}</TableCell>
                      <TableCell>{formatDate(facture.date_facture || facture.date || facture.created_at)}</TableCell>
                      <TableCell>{getCategorieBadge(facture.categorie)}</TableCell>
                      <TableCell className="text-right font-medium">{formatMontant(facture.montant_ttc)}</TableCell>
                      <TableCell className="text-right">
                        <span className={(facture.montant_paye || 0) > 0 ? "text-green-600" : ""}>
                          {formatMontant(facture.montant_paye)}
                        </span>
                        {resteAPayer > 0 && facture.statut !== 'payee' && (
                          <div className="text-xs text-destructive">
                            Reste: {formatMontant(resteAPayer)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatutBadge(facture.statut)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" title="Voir" onClick={() => navigate(`/factures/${facture.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {facture.statut !== 'payee' && facture.statut !== 'annulee' && (
                            <Button variant="ghost" size="icon" title="Modifier" onClick={() => navigate(`/factures/${facture.id}/modifier`)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {facture.statut !== 'payee' && facture.statut !== 'annulee' && resteAPayer > 0 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Paiement" 
                              className="text-green-600"
                              onClick={() => setPaiementModal({ id: facture.id, numero: facture.numero, montantRestant: resteAPayer })}
                            >
                              <Wallet className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Email"
                            className="text-blue-600"
                            onClick={() => setEmailModal({
                              open: true,
                              documentNumero: facture.numero,
                              clientEmail: facture.client?.email || "",
                              clientNom: facture.client?.nom || ""
                            })}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="PDF" onClick={() => window.open(`/factures/${facture.id}/pdf`, '_blank')}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          {facture.statut !== 'annulee' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Annuler"
                              className="text-orange-600"
                              onClick={() => setAnnulationModal({
                                id: facture.id,
                                numero: facture.numero,
                                montantTTC: facture.montant_ttc,
                                montantPaye: facture.montant_paye,
                                clientNom: facture.client?.nom || ''
                              })}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Supprimer"
                            className="text-destructive"
                            onClick={() => setConfirmDelete({ id: facture.id, numero: facture.numero })}
                          >
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

      {/* Modal suppression */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la facture <strong>{confirmDelete?.numero}</strong> ? 
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non, garder</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={deleteFactureMutation.isPending}>
              {deleteFactureMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Oui, supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Email */}
      <EmailModal
        open={!!emailModal}
        onOpenChange={(open) => !open && setEmailModal(null)}
        documentType="facture"
        documentNumero={emailModal?.documentNumero || ""}
        clientEmail={emailModal?.clientEmail || ""}
        clientNom={emailModal?.clientNom || ""}
      />

      {/* Modal Paiement */}
      <PaiementModal
        open={!!paiementModal}
        onOpenChange={(open) => !open && setPaiementModal(null)}
        documentType="facture"
        documentId={paiementModal?.id || ""}
        documentNumero={paiementModal?.numero || ""}
        montantRestant={paiementModal?.montantRestant || 0}
        onSuccess={() => refetch()}
      />

      {/* Modal Paiement Global */}
      <PaiementGlobalModal open={paiementGlobalOpen} onOpenChange={setPaiementGlobalOpen} />

      {/* Modal Export */}
      <ExportModal open={exportOpen} onOpenChange={setExportOpen} />

      {/* Modal Annulation */}
      <AnnulationModal
        open={!!annulationModal}
        onOpenChange={(open) => !open && setAnnulationModal(null)}
        documentType="facture"
        documentNumero={annulationModal?.numero || ""}
        montantTTC={annulationModal?.montantTTC || 0}
        montantPaye={annulationModal?.montantPaye || 0}
        clientNom={annulationModal?.clientNom || ""}
        onSuccess={() => navigate("/annulations")}
      />
    </MainLayout>
  );
}
