import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Eye, Wallet, Mail, FileText, Ban, Trash2, Edit, Download, CreditCard, Receipt, Container, Package, Truck, TrendingUp, Clock } from "lucide-react";
import { EmailModal } from "@/components/EmailModal";
import { PaiementModal } from "@/components/PaiementModal";
import { PaiementGlobalModal } from "@/components/PaiementGlobalModal";
import { ExportModal } from "@/components/ExportModal";
import { AnnulationModal } from "@/components/AnnulationModal";
import { useFactures, useDeleteFacture } from "@/hooks/use-commercial";
import { formatMontant, formatDate, getStatutLabel } from "@/data/mockData";
import { TablePagination } from "@/components/TablePagination";
import {
  DocumentStatCard,
  DocumentStatCardSkeleton,
  DocumentFilters,
  DocumentEmptyState,
  DocumentLoadingState,
  DocumentErrorState,
} from "@/components/shared/documents";

// Options de filtres
const statutOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "brouillon", label: "Brouillon" },
  { value: "validee", label: "Validée" },
  { value: "payee", label: "Payée" },
  { value: "partiellement_payee", label: "Partielle" },
  { value: "annulee", label: "Annulée" },
];

const categorieOptions = [
  { value: "all", label: "Toutes catégories" },
  { value: "conteneurs", label: "Conteneurs" },
  { value: "conventionnel", label: "Conventionnel" },
  { value: "operations_independantes", label: "Indépendant" },
];

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
  const [paiementModal, setPaiementModal] = useState<{ id: string; numero: string; montantRestant: number; clientId?: number } | null>(null);
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
  const facturesEnAttente = facturesList.filter(f => f.statut === 'brouillon' || f.statut === 'validee').length;

  const getStatutBadge = (statut: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      brouillon: { 
        label: getStatutLabel(statut), 
        className: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-200 dark:border-gray-700" 
      },
      emise: { 
        label: getStatutLabel(statut), 
        className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700" 
      },
      validee: { 
        label: getStatutLabel(statut), 
        className: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-700" 
      },
      payee: { 
        label: getStatutLabel(statut), 
        className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700" 
      },
      partiellement_payee: { 
        label: getStatutLabel(statut), 
        className: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700" 
      },
      impayee: { 
        label: getStatutLabel(statut), 
        className: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700" 
      },
      annulee: { 
        label: getStatutLabel(statut), 
        className: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700" 
      },
    };
    const config = configs[statut] || { label: getStatutLabel(statut), className: "bg-gray-100 text-gray-800" };
    return (
      <Badge 
        variant="outline" 
        className={`${config.className} transition-all duration-200 hover:scale-105`}
      >
        {config.label}
      </Badge>
    );
  };

  const getCategorieBadge = (categorie?: string) => {
    const configs: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
      conteneurs: { label: "Conteneurs", icon: <Container className="h-3 w-3" />, className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      conventionnel: { label: "Conventionnel", icon: <Package className="h-3 w-3" />, className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
      operations_independantes: { label: "Indépendant", icon: <Truck className="h-3 w-3" />, className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    };
    const config = configs[categorie || ''] || { label: categorie || 'N/A', icon: null, className: "bg-gray-100 text-gray-800" };
    return (
      <Badge className={`${config.className} flex items-center gap-1 transition-all duration-200 hover:scale-105`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <MainLayout title="Factures">
        <DocumentLoadingState message="Chargement des factures..." />
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Factures">
        <DocumentErrorState 
          message="Erreur lors du chargement des factures"
          onRetry={() => refetch()}
        />
      </MainLayout>
    );
  }

  // État vide
  if (facturesList.length === 0 && !searchTerm && statutFilter === "all" && categorieFilter === "all") {
    return (
      <MainLayout title="Factures">
        <DocumentEmptyState
          icon={Receipt}
          title="Aucune facture"
          description="Commencez par créer votre première facture pour gérer vos encaissements."
          actionLabel="Nouvelle facture"
          onAction={() => navigate("/factures/nouvelle")}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Factures">
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DocumentStatCard
            title="Total Factures"
            value={totalItems}
            icon={Receipt}
            variant="primary"
            subtitle="Documents créés"
            delay={0}
          />
          <DocumentStatCard
            title="Montant Total"
            value={formatMontant(totalFactures)}
            icon={TrendingUp}
            variant="info"
            subtitle="Valeur cumulée"
            delay={0.1}
          />
          <DocumentStatCard
            title="Total Encaissé"
            value={formatMontant(totalPaye)}
            icon={CreditCard}
            variant="success"
            subtitle={`${totalFactures > 0 ? Math.round((totalPaye / totalFactures) * 100) : 0}% encaissé`}
            delay={0.2}
          />
          <DocumentStatCard
            title="En attente"
            value={facturesEnAttente}
            icon={Clock}
            variant="warning"
            subtitle="Brouillons et validées"
            delay={0.3}
          />
        </div>

        {/* Filters */}
        <DocumentFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Rechercher par numéro, client..."
          statutFilter={statutFilter}
          onStatutChange={setStatutFilter}
          statutOptions={statutOptions}
          categorieFilter={categorieFilter}
          onCategorieChange={setCategorieFilter}
          categorieOptions={categorieOptions}
        />

        {/* Actions */}
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" className="gap-2 transition-all duration-200 hover:scale-105" onClick={() => setPaiementGlobalOpen(true)}>
            <CreditCard className="h-4 w-4" />
            Paiement global
          </Button>
          <Button variant="outline" className="gap-2 transition-all duration-200 hover:scale-105" onClick={() => setExportOpen(true)}>
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md" onClick={() => navigate("/factures/nouvelle")}>
            <Plus className="h-4 w-4" />
            Nouvelle facture
          </Button>
        </div>

        {/* Table */}
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
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
                {facturesList.map((facture, index) => {
                  const resteAPayer = (facture.montant_ttc || 0) - (facture.montant_paye || 0);
                  return (
                    <TableRow 
                      key={facture.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-all duration-200 animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell 
                        className="font-medium text-primary hover:underline cursor-pointer"
                        onClick={() => navigate(`/factures/${facture.id}`)}
                      >
                        {facture.numero}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {facture.client?.nom?.substring(0, 2).toUpperCase() || '??'}
                          </div>
                          <span className="truncate max-w-[150px]">{facture.client?.nom}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(facture.date_facture || facture.date || facture.created_at)}</TableCell>
                      <TableCell>{getCategorieBadge(facture.categorie)}</TableCell>
                      <TableCell className="text-right font-medium">{formatMontant(facture.montant_ttc)}</TableCell>
                      <TableCell className="text-right">
                        <span className={(facture.montant_paye || 0) > 0 ? "text-emerald-600 dark:text-emerald-400" : ""}>
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
                          <Button variant="ghost" size="icon" title="Voir" onClick={() => navigate(`/factures/${facture.id}`)} className="transition-all duration-200 hover:scale-110 hover:bg-primary/10">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {facture.statut !== 'payee' && facture.statut !== 'annulee' && (
                            <Button variant="ghost" size="icon" title="Modifier" onClick={() => navigate(`/factures/${facture.id}/modifier`)} className="transition-all duration-200 hover:scale-110 hover:bg-blue-500/10">
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {facture.statut !== 'payee' && facture.statut !== 'annulee' && resteAPayer > 0 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Paiement" 
                              className="text-emerald-600 transition-all duration-200 hover:scale-110 hover:bg-emerald-500/10"
                              onClick={() => setPaiementModal({ id: facture.id, numero: facture.numero, montantRestant: resteAPayer, clientId: facture.client?.id ? Number(facture.client.id) : undefined })}
                            >
                              <Wallet className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Email"
                            className="text-blue-600 transition-all duration-200 hover:scale-110 hover:bg-blue-500/10"
                            onClick={() => setEmailModal({
                              open: true,
                              documentNumero: facture.numero,
                              clientEmail: facture.client?.email || "",
                              clientNom: facture.client?.nom || ""
                            })}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="PDF" onClick={() => window.open(`/factures/${facture.id}/pdf`, '_blank')} className="transition-all duration-200 hover:scale-110 hover:bg-muted">
                            <FileText className="h-4 w-4" />
                          </Button>
                          {facture.statut !== 'annulee' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Annuler"
                              className="text-orange-600 transition-all duration-200 hover:scale-110 hover:bg-orange-500/10"
                              onClick={() => setAnnulationModal({
                                id: facture.id,
                                numero: facture.numero,
                                montantTTC: facture.montant_ttc || 0,
                                montantPaye: facture.montant_paye || 0,
                                clientNom: facture.client?.nom || ""
                              })}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Supprimer"
                            className="text-destructive transition-all duration-200 hover:scale-110 hover:bg-red-500/10"
                            onClick={() => setConfirmDelete({ id: facture.id, numero: facture.numero })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {facturesList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucune facture trouvée avec ces critères
                    </TableCell>
                  </TableRow>
                )}
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

      {/* Modales */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la facture {confirmDelete?.numero} ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {emailModal && (
        <EmailModal
          open={emailModal.open}
          onOpenChange={() => setEmailModal(null)}
          documentType="facture"
          documentNumero={emailModal.documentNumero}
          clientEmail={emailModal.clientEmail}
          clientNom={emailModal.clientNom}
        />
      )}

      {paiementModal && (
        <PaiementModal
          open={!!paiementModal}
          onOpenChange={() => setPaiementModal(null)}
          documentType="facture"
          documentId={paiementModal.id}
          documentNumero={paiementModal.numero}
          montantRestant={paiementModal.montantRestant}
          clientId={paiementModal.clientId ? Number(paiementModal.clientId) : undefined}
        />
      )}

      {annulationModal && (
        <AnnulationModal
          open={!!annulationModal}
          onOpenChange={() => setAnnulationModal(null)}
          documentType="facture"
          documentId={Number(annulationModal.id)}
          documentNumero={annulationModal.numero}
          montantTTC={annulationModal.montantTTC}
          montantPaye={annulationModal.montantPaye}
          clientNom={annulationModal.clientNom}
        />
      )}

      <PaiementGlobalModal
        open={paiementGlobalOpen}
        onOpenChange={setPaiementGlobalOpen}
      />

      <ExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
      />
    </MainLayout>
  );
}
