import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ApiErrorState } from "@/components/ApiErrorState";
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
  Plus, Eye, Edit, ArrowRight, FileText, Ban, Trash2, Mail, 
  FileCheck, Loader2, Check, Container, Package, Wrench,
  TrendingUp, Clock, CheckCircle, XCircle
} from "lucide-react";
import { EmailModal } from "@/components/EmailModal";
import { useDevis, useDeleteDevis, useConvertDevisToOrdre, useUpdateDevis } from "@/hooks/use-commercial";
import { formatMontant, formatDate, getStatutLabel } from "@/data/mockData";
import { TablePagination } from "@/components/TablePagination";
import { getOperationsIndepLabels, TypeOperationIndep } from "@/types/documents";
import {
  DevisStatCard,
  DevisStatCardSkeleton,
  DevisCard,
  DevisGridSkeleton,
  DevisTableSkeleton,
  DevisFilters,
} from "@/components/devis/shared";
import { cn } from "@/lib/utils";

export default function DevisPage() {
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [categorieFilter, setCategorieFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // API hooks
  const { data: devisData, isLoading, error } = useDevis({
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
  const [emailModal, setEmailModal] = useState<{
    numero: string;
    clientEmail: string;
    clientNom: string;
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
        await convertMutation.mutateAsync(confirmAction.id);
        navigate("/ordres");
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

  const handleCardEmail = (numero: string, email: string, nom: string) => {
    setEmailModal({ numero, clientEmail: email, clientNom: nom });
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
  const devisRefuses = devisList.filter(d => d.statut === 'refuse').length;

  const getStatutBadge = (statut: string) => {
    const config: Record<string, { className: string }> = {
      brouillon: { className: "bg-gray-100 text-gray-700 border-gray-300" },
      envoye: { className: "bg-blue-100 text-blue-700 border-blue-300" },
      accepte: { className: "bg-emerald-100 text-emerald-700 border-emerald-300" },
      refuse: { className: "bg-red-100 text-red-700 border-red-300" },
      expire: { className: "bg-orange-100 text-orange-700 border-orange-300" },
      converti: { className: "bg-purple-100 text-purple-700 border-purple-300" },
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
      Conteneur: { label: "Conteneurs", icon: <Container className="h-3 w-3" />, className: "bg-blue-100 text-blue-800" },
      Lot: { label: "Conventionnel", icon: <Package className="h-3 w-3" />, className: "bg-amber-100 text-amber-800" },
      Independant: { label: "Indépendant", icon: <Wrench className="h-3 w-3" />, className: "bg-purple-100 text-purple-800" },
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

  // État vide
  if (!isLoading && devisList.length === 0 && !searchTerm && statutFilter === "all") {
    return (
      <MainLayout title="Devis">
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
          <div className="p-4 rounded-full bg-primary/10 mb-4">
            <FileCheck className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Aucun devis</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Commencez par créer votre premier devis pour proposer vos services à vos clients.
          </p>
          <Button onClick={() => navigate("/devis/nouveau")} className="gap-2 shadow-md">
            <Plus className="h-4 w-4" />
            Créer un devis
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Devis">
        <ApiErrorState
          title="Erreur lors du chargement des devis"
          error={error}
          onRetry={() => window.location.reload()}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Devis">
      <div className="space-y-6 animate-fade-in">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              <DevisStatCardSkeleton />
              <DevisStatCardSkeleton />
              <DevisStatCardSkeleton />
              <DevisStatCardSkeleton />
            </>
          ) : (
            <>
              <DevisStatCard
                title="Total Devis"
                value={totalItems}
                icon={FileText}
                variant="primary"
                subtitle="Documents créés"
              />
              <DevisStatCard
                title="Montant Total"
                value={formatMontant(totalMontant)}
                icon={TrendingUp}
                variant="info"
                subtitle="Valeur cumulée"
              />
              <DevisStatCard
                title="Acceptés"
                value={devisAcceptes}
                icon={CheckCircle}
                variant="success"
                subtitle={`${totalItems > 0 ? Math.round((devisAcceptes / totalItems) * 100) : 0}% de conversion`}
              />
              <DevisStatCard
                title="En attente"
                value={devisEnAttente}
                icon={Clock}
                variant="warning"
                subtitle="Brouillons et envoyés"
              />
            </>
          )}
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <DevisFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statutFilter={statutFilter}
            onStatutChange={setStatutFilter}
            categorieFilter={categorieFilter}
            onCategorieChange={setCategorieFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
          <Button 
            className="gap-2 shadow-md transition-all duration-200 hover:scale-105" 
            onClick={() => navigate("/devis/nouveau")}
          >
            <Plus className="h-4 w-4" />
            Nouveau devis
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          viewMode === 'grid' ? (
            <DevisGridSkeleton count={6} />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Numéro</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Montant TTC</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="w-48">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <DevisTableSkeleton count={5} />
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        ) : viewMode === 'grid' ? (
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
                  onEmail={handleCardEmail}
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
                          <Button variant="ghost" size="icon" title="Voir" className="h-8 w-8" onClick={() => navigate(`/devis/${d.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {d.statut !== 'refuse' && d.statut !== 'expire' && d.statut !== 'accepte' && (
                            <Button variant="ghost" size="icon" title="Modifier" className="h-8 w-8" onClick={() => navigate(`/devis/${d.id}/modifier`)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" title="PDF" className="h-8 w-8" onClick={() => window.open(`/devis/${d.id}/pdf`, '_blank')}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Email" className="h-8 w-8 text-blue-600"
                            onClick={() => setEmailModal({ numero: d.numero, clientEmail: d.client?.email || '', clientNom: d.client?.nom || '' })}>
                            <Mail className="h-4 w-4" />
                          </Button>
                          {(d.statut === 'brouillon' || d.statut === 'envoye') && (
                            <Button variant="ghost" size="icon" title="Valider" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                              onClick={() => setConfirmAction({ type: 'valider', id: d.id, numero: d.numero })}>
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {d.statut === 'accepte' && (
                            <Button variant="ghost" size="icon" title="Convertir" className="h-8 w-8 text-primary"
                              onClick={() => setConfirmAction({ type: 'convertir', id: d.id, numero: d.numero })}>
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          )}
                          {d.statut !== 'refuse' && d.statut !== 'expire' && d.statut !== 'accepte' && (
                            <Button variant="ghost" size="icon" title="Annuler" className="h-8 w-8 text-orange-600 hover:bg-orange-50"
                              onClick={() => setConfirmAction({ type: 'annuler', id: d.id, numero: d.numero })}>
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" title="Supprimer" className="h-8 w-8 text-destructive hover:bg-red-50"
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
        {viewMode === 'grid' && !isLoading && (
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

      {/* Modal Annulation */}
      <AlertDialog open={confirmAction?.type === 'annuler'} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'annulation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir annuler le devis <strong>{confirmAction?.numero}</strong> ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non, garder</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} className="bg-orange-600 hover:bg-orange-700" disabled={updateDevisMutation.isPending}>
              {updateDevisMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmer"}
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
              Êtes-vous sûr de vouloir supprimer le devis <strong>{confirmAction?.numero}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non, garder</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} className="bg-destructive hover:bg-destructive/90" disabled={deleteDevisMutation.isPending}>
              {deleteDevisMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Validation */}
      <AlertDialog open={confirmAction?.type === 'valider'} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Valider le devis</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous marquer le devis <strong>{confirmAction?.numero}</strong> comme accepté ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} className="bg-emerald-600 hover:bg-emerald-700" disabled={updateDevisMutation.isPending}>
              {updateDevisMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Valider"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Conversion */}
      <AlertDialog open={confirmAction?.type === 'convertir'} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convertir en ordre de travail</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous convertir le devis <strong>{confirmAction?.numero}</strong> en ordre de travail ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={convertMutation.isPending}>
              {convertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Convertir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Email */}
      {emailModal && (
        <EmailModal
          open={!!emailModal}
          onOpenChange={(open) => !open && setEmailModal(null)}
          documentType="devis"
          documentNumero={emailModal.numero}
          clientEmail={emailModal.clientEmail}
          clientNom={emailModal.clientNom}
        />
      )}
    </MainLayout>
  );
}
