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
import { 
  Plus, Eye, Edit, ArrowRight, FileText, Ban, Trash2, Share2, 
  FileCheck, Check, Container, Package, Wrench,
  TrendingUp, Clock, CheckCircle
} from "lucide-react";
import { ShareModal } from "@/components/ShareModal";
import { useDevis, useDeleteDevis, useConvertDevisToOrdre, useUpdateDevis } from "@/hooks/use-commercial";
import { formatMontant, formatDate, getStatutLabel } from "@/data/mockData";
import { TablePagination } from "@/components/TablePagination";
import { getOperationsIndepLabels, TypeOperationIndep } from "@/types/documents";
import {
  DevisCard,
  DevisGridSkeleton,
  DevisTableSkeleton,
} from "@/components/devis/shared";
import {
  DocumentStatCard,
  DocumentFilters,
  DocumentEmptyState,
  DocumentLoadingState,
  DocumentErrorState,
} from "@/components/shared/documents";
import { cn } from "@/lib/utils";

// Options de filtres
const statutOptions = [
  { value: "all", label: "Tous statuts" },
  { value: "brouillon", label: "Brouillon" },
  { value: "envoye", label: "Envoyé" },
  { value: "accepte", label: "Accepté" },
  { value: "refuse", label: "Refusé" },
  { value: "expire", label: "Expiré" },
  { value: "converti", label: "Converti" },
];

const categorieOptions = [
  { value: "all", label: "Toutes catégories" },
  { value: "Conteneur", label: "Conteneurs" },
  { value: "Lot", label: "Conventionnel" },
  { value: "Independant", label: "Indépendant" },
];

export default function DevisPage() {
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [categorieFilter, setCategorieFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // API hooks
  const { data: devisData, isLoading, error, refetch } = useDevis({
    search: searchTerm || undefined,
    statut: statutFilter !== "all" ? statutFilter : undefined,
    page: currentPage,
    per_page: pageSize,
  });
  
  const deleteDevisMutation = useDeleteDevis();
  const convertMutation = useConvertDevisToOrdre();
  const updateDevisMutation = useUpdateDevis();
  
  // États modales consolidés
  const [confirmAction, setConfirmAction] = useState<{
    type: 'annuler' | 'supprimer' | 'convertir' | 'valider' | null;
    id: string;
    numero: string;
  } | null>(null);
  const [shareModal, setShareModal] = useState<{
    id: string;
    numero: string;
    clientEmail: string;
    clientNom: string;
    clientTelephone: string;
    montantTTC: number;
  } | null>(null);

  // Handlers consolidés
  const handleAction = async () => {
    if (!confirmAction) return;

    try {
      if (confirmAction.type === 'annuler') {
        await updateDevisMutation.mutateAsync({ id: confirmAction.id, data: { statut: 'refuse' } });
      } else if (confirmAction.type === 'valider') {
        await updateDevisMutation.mutateAsync({ id: confirmAction.id, data: { statut: 'accepte' } });
      } else if (confirmAction.type === 'supprimer') {
        await deleteDevisMutation.mutateAsync(confirmAction.id);
      } else if (confirmAction.type === 'convertir') {
        const result = await convertMutation.mutateAsync(confirmAction.id);
        // Rediriger vers l'ordre créé en mode édition
        const ordreId = result?.data?.id;
        if (ordreId) {
          navigate(`/ordres/${ordreId}/modifier`);
        } else {
          navigate("/ordres");
        }
      }
    } catch {
      // noop: les mutations gèrent déjà le toast d'erreur dans onError
    } finally {
      setConfirmAction(null);
    }
  };

  const handleCardAction = (type: 'annuler' | 'supprimer' | 'convertir' | 'valider', id: string, numero: string) => {
    setConfirmAction({ type, id, numero });
  };

  const handleCardShare = (id: string, numero: string, email: string, nom: string, telephone: string, montantTTC: number) => {
    setShareModal({ id, numero, clientEmail: email, clientNom: nom, clientTelephone: telephone, montantTTC });
  };

  const devisList = devisData?.data || [];
  const totalPages = devisData?.meta?.last_page || 1;
  const totalItems = devisData?.meta?.total || 0;

  // Filtrer par catégorie côté client si nécessaire
  const filteredDevis = categorieFilter === 'all' 
    ? devisList 
    : devisList.filter(d => d.type_document === categorieFilter);

  // Statistiques
  const totalMontant = devisList.reduce((sum, d) => sum + (d.montant_ttc || 0), 0);
  const devisAcceptes = devisList.filter(d => d.statut === 'accepte').length;
  const devisEnAttente = devisList.filter(d => d.statut === 'envoye' || d.statut === 'brouillon').length;

  const getStatutBadge = (statut: string) => {
    const config: Record<string, { className: string }> = {
      brouillon: { className: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/30 dark:text-gray-200" },
      envoye: { className: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200" },
      accepte: { className: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200" },
      refuse: { className: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-200" },
      expire: { className: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200" },
      converti: { className: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-200" },
    };
    const style = config[statut] || config.brouillon;
    return (
      <Badge variant="outline" className={`${style.className} transition-all duration-200 hover:scale-105`}>
        {getStatutLabel(statut)}
      </Badge>
    );
  };

  const getCategorieBadge = (typeDocument: string) => {
    const config: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
      Conteneur: { label: "Conteneurs", icon: <Container className="h-3 w-3" />, className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200" },
      Lot: { label: "Conventionnel", icon: <Package className="h-3 w-3" />, className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200" },
      Independant: { label: "Indépendant", icon: <Wrench className="h-3 w-3" />, className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200" },
    };
    const cat = config[typeDocument] || config.Conteneur;
    return (
      <Badge variant="outline" className={cn("flex items-center gap-1", cat.className)}>
        {cat.icon}
        {cat.label}
      </Badge>
    );
  };

  const getTypeOperationLabel = (typeDoc: string, typeOp?: string | null) => {
    if (typeDoc === 'Conteneur') {
      return typeOp || '-';
    }
    if (typeDoc === 'Independant' && typeOp) {
      const labels = getOperationsIndepLabels();
      return labels[typeOp as TypeOperationIndep]?.label || typeOp;
    }
    return '-';
  };

  if (isLoading) {
    return (
      <MainLayout title="Devis">
        <DocumentLoadingState message="Chargement des devis..." />
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Devis">
        <DocumentErrorState 
          message="Erreur lors du chargement des devis"
          onRetry={() => refetch()}
        />
      </MainLayout>
    );
  }

  // État vide
  if (devisList.length === 0 && !searchTerm && statutFilter === "all") {
    return (
      <MainLayout title="Devis">
        <DocumentEmptyState
          icon={FileCheck}
          title="Aucun devis"
          description="Commencez par créer votre premier devis pour proposer vos services à vos clients."
          actionLabel="Créer un devis"
          onAction={() => navigate("/devis/nouveau")}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Devis">
      <div className="space-y-6 animate-fade-in">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DocumentStatCard
            title="Total Devis"
            value={totalItems}
            icon={FileText}
            variant="primary"
            subtitle="Documents créés"
            delay={0}
          />
          <DocumentStatCard
            title="Montant Total"
            value={formatMontant(totalMontant)}
            icon={TrendingUp}
            variant="info"
            subtitle="Valeur cumulée"
            delay={0.1}
          />
          <DocumentStatCard
            title="Acceptés"
            value={devisAcceptes}
            icon={CheckCircle}
            variant="success"
            subtitle={`${totalItems > 0 ? Math.round((devisAcceptes / totalItems) * 100) : 0}% de conversion`}
            delay={0.2}
          />
          <DocumentStatCard
            title="En attente"
            value={devisEnAttente}
            icon={Clock}
            variant="warning"
            subtitle="Brouillons et envoyés"
            delay={0.3}
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showViewToggle
          />
          <Button 
            className="gap-2 shadow-md transition-all duration-200 hover:scale-105 shrink-0" 
            onClick={() => navigate("/devis/nouveau")}
          >
            <Plus className="h-4 w-4" />
            Nouveau devis
          </Button>
        </div>

        {/* Content */}
        {viewMode === 'grid' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDevis.map((d, index) => (
              <div 
                key={d.id} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <DevisCard 
                  devis={d} 
                  onAction={handleCardAction}
                  onShare={handleCardShare}
                />
              </div>
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Numéro</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Type d'opération</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Montant TTC</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-48">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevis.map((d, index) => (
                    <TableRow 
                      key={d.id} 
                      className="hover:bg-muted/50 transition-all duration-200 animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell className="font-medium text-primary hover:underline cursor-pointer" onClick={() => navigate(`/devis/${d.id}`)}>
                        {d.numero}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {d.client?.nom?.substring(0, 2).toUpperCase() || '??'}
                          </div>
                          <span className="truncate max-w-[150px]">{d.client?.nom}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getCategorieBadge(d.type_document)}</TableCell>
                      <TableCell>
                        {getTypeOperationLabel(
                          d.type_document,
                          d.type_operation_indep ?? d.type_operation ?? d.lignes?.[0]?.type_operation
                        )}
                      </TableCell>
                      <TableCell>{formatDate(d.date_creation || d.date)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatMontant(d.montant_ttc)}</TableCell>
                      <TableCell>{getStatutBadge(d.statut)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" title="Voir" className="h-8 w-8 transition-all duration-200 hover:scale-110 hover:bg-primary/10" onClick={() => navigate(`/devis/${d.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {d.statut !== 'refuse' && d.statut !== 'expire' && d.statut !== 'accepte' && (
                            <Button variant="ghost" size="icon" title="Modifier" className="h-8 w-8 transition-all duration-200 hover:scale-110 hover:bg-blue-500/10" onClick={() => navigate(`/devis/${d.id}/modifier`)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" title="PDF" className="h-8 w-8 transition-all duration-200 hover:scale-110 hover:bg-muted" onClick={() => window.open(`/devis/${d.id}/pdf`, '_blank')}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Partager" className="h-8 w-8 text-blue-600 transition-all duration-200 hover:scale-110 hover:bg-blue-500/10"
                            onClick={() => setShareModal({ 
                              id: d.id, 
                              numero: d.numero, 
                              clientEmail: d.client?.email || '', 
                              clientNom: d.client?.nom || '',
                              clientTelephone: d.client?.telephone || '',
                              montantTTC: d.montant_ttc || 0
                            })}>
                            <Share2 className="h-4 w-4" />
                          </Button>
                          {(d.statut === 'brouillon' || d.statut === 'envoye') && (
                            <Button variant="ghost" size="icon" title="Valider" className="h-8 w-8 text-emerald-600 transition-all duration-200 hover:scale-110 hover:bg-emerald-500/10"
                              onClick={() => setConfirmAction({ type: 'valider', id: d.id, numero: d.numero })}>
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {d.statut === 'accepte' && (
                            <Button variant="ghost" size="icon" title="Convertir" className="h-8 w-8 text-primary transition-all duration-200 hover:scale-110 hover:bg-primary/10"
                              onClick={() => setConfirmAction({ type: 'convertir', id: d.id, numero: d.numero })}>
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          )}
                          {d.statut !== 'refuse' && d.statut !== 'expire' && d.statut !== 'accepte' && (
                            <Button variant="ghost" size="icon" title="Annuler" className="h-8 w-8 text-orange-600 transition-all duration-200 hover:scale-110 hover:bg-orange-500/10"
                              onClick={() => setConfirmAction({ type: 'annuler', id: d.id, numero: d.numero })}>
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" title="Supprimer" className="h-8 w-8 text-destructive transition-all duration-200 hover:scale-110 hover:bg-red-500/10"
                            onClick={() => setConfirmAction({ type: 'supprimer', id: d.id, numero: d.numero })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredDevis.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Aucun devis trouvé avec ces critères
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
        )}

        {/* Pagination for grid view */}
        {viewMode === 'grid' && (
          <Card className="p-4">
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
          </Card>
        )}
      </div>

      {/* Modales */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'annuler' && 'Annuler le devis'}
              {confirmAction?.type === 'valider' && 'Valider le devis'}
              {confirmAction?.type === 'supprimer' && 'Supprimer le devis'}
              {confirmAction?.type === 'convertir' && 'Convertir en ordre'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'annuler' && `Êtes-vous sûr de vouloir annuler le devis ${confirmAction?.numero} ?`}
              {confirmAction?.type === 'valider' && `Êtes-vous sûr de vouloir valider le devis ${confirmAction?.numero} ?`}
              {confirmAction?.type === 'supprimer' && `Êtes-vous sûr de vouloir supprimer le devis ${confirmAction?.numero} ? Cette action est irréversible.`}
              {confirmAction?.type === 'convertir' && `Voulez-vous convertir le devis ${confirmAction?.numero} en ordre de travail ?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAction}
              className={confirmAction?.type === 'supprimer' ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {confirmAction?.type === 'annuler' && 'Annuler le devis'}
              {confirmAction?.type === 'valider' && 'Valider'}
              {confirmAction?.type === 'supprimer' && 'Supprimer'}
              {confirmAction?.type === 'convertir' && 'Convertir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {shareModal && (
        <ShareModal
          open={!!shareModal}
          onOpenChange={() => setShareModal(null)}
          documentType="devis"
          documentId={shareModal.id}
          documentNumero={shareModal.numero}
          clientEmail={shareModal.clientEmail}
          clientNom={shareModal.clientNom}
          clientTelephone={shareModal.clientTelephone}
          montantTTC={shareModal.montantTTC}
        />
      )}
    </MainLayout>
  );
}
