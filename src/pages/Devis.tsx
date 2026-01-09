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
import { Plus, Search, Eye, Edit, ArrowRight, FileText, Ban, Trash2, Mail, FileCheck, Loader2, Check, Container, Package, Wrench } from "lucide-react";
import { EmailModal } from "@/components/EmailModal";
import { useDevis, useDeleteDevis, useConvertDevisToOrdre, useUpdateDevis } from "@/hooks/use-commercial";
import { formatMontant, formatDate, getStatutLabel } from "@/data/mockData";
import { TablePagination } from "@/components/TablePagination";

export default function DevisPage() {
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
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
      // Fermer la modale même si la requête échoue
      setConfirmAction(null);
    }
  };

  const devisList = devisData?.data || [];
  const totalPages = devisData?.meta?.last_page || 1;
  const totalItems = devisData?.meta?.total || 0;

  // Statistiques
  const totalDevis = devisList.reduce((sum, d) => sum + (d.montant_ttc || 0), 0);
  const devisAcceptes = devisList.filter(d => d.statut === 'accepte').length;
  const devisEnAttente = devisList.filter(d => d.statut === 'envoye').length;

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      brouillon: "secondary",
      envoye: "outline",
      accepte: "default",
      refuse: "destructive",
      expire: "destructive",
    };
    return <Badge variant={variants[statut] || "secondary"}>{getStatutLabel(statut)}</Badge>;
  };

  const getCategorieBadge = (typeDocument: string) => {
    const config: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
      Conteneur: { label: "Conteneurs", icon: <Container className="h-3 w-3" />, className: "bg-blue-100 text-blue-800" },
      Lot: { label: "Conventionnel", icon: <Package className="h-3 w-3" />, className: "bg-amber-100 text-amber-800" },
      Independant: { label: "Indépendant", icon: <Wrench className="h-3 w-3" />, className: "bg-purple-100 text-purple-800" },
    };
    const cat = config[typeDocument] || config.Conteneur;
    return (
      <Badge variant="outline" className={`${cat.className} flex items-center gap-1`}>
        {cat.icon}
        {cat.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <MainLayout title="Devis">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Devis">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive">Erreur lors du chargement des devis</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
            Réessayer
          </Button>
        </div>
      </MainLayout>
    );
  }

  // État vide
  if (devisList.length === 0 && !searchTerm && statutFilter === "all") {
    return (
      <MainLayout title="Devis">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileCheck className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Aucun devis</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Commencez par créer votre premier devis pour proposer vos services.
          </p>
          <Button onClick={() => navigate("/devis/nouveau")} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau devis
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Devis">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Devis</CardTitle>
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
              <div className="text-2xl font-bold">{formatMontant(totalDevis)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Acceptés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{devisAcceptes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{devisEnAttente}</div>
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
                <SelectItem value="brouillon">Brouillon</SelectItem>
                <SelectItem value="envoye">Envoyé</SelectItem>
                <SelectItem value="accepte">Accepté</SelectItem>
                <SelectItem value="refuse">Refusé</SelectItem>
                <SelectItem value="expire">Expiré</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="gap-2" onClick={() => navigate("/devis/nouveau")}>
            <Plus className="h-4 w-4" />
            Nouveau devis
          </Button>
        </div>

        {/* Table */}
        <Card>
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
                {devisList.map((d) => (
                  <TableRow key={d.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-primary hover:underline cursor-pointer" onClick={() => navigate(`/devis/${d.id}`)}>
                      {d.numero}
                    </TableCell>
                    <TableCell>{d.client?.nom}</TableCell>
                    <TableCell>{getCategorieBadge(d.type_document)}</TableCell>
                    <TableCell className="capitalize">{d.type_operation || '-'}</TableCell>
                    <TableCell>{formatDate(d.date_creation || d.date)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatMontant(d.montant_ttc)}</TableCell>
                    <TableCell>{getStatutBadge(d.statut)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" title="Voir" onClick={() => navigate(`/devis/${d.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {d.statut !== 'refuse' && d.statut !== 'expire' && d.statut !== 'accepte' && (
                          <Button variant="ghost" size="icon" title="Modifier" onClick={() => navigate(`/devis/${d.id}/modifier`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title="PDF" onClick={() => window.open(`/devis/${d.id}/pdf`, '_blank')}>
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Envoyer par email" className="text-blue-600"
                          onClick={() => setEmailModal({ numero: d.numero, clientEmail: d.client?.email || '', clientNom: d.client?.nom || '' })}>
                          <Mail className="h-4 w-4" />
                        </Button>
                        {(d.statut === 'brouillon' || d.statut === 'envoye') && (
                          <Button variant="ghost" size="icon" title="Valider le devis" className="text-green-600"
                            onClick={() => setConfirmAction({ type: 'valider', id: d.id, numero: d.numero })}>
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {d.statut === 'accepte' && (
                          <Button variant="ghost" size="icon" title="Convertir en ordre" className="text-primary"
                            onClick={() => setConfirmAction({ type: 'convertir', id: d.id, numero: d.numero })}>
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        )}
                        {d.statut !== 'refuse' && d.statut !== 'expire' && d.statut !== 'accepte' && (
                          <Button variant="ghost" size="icon" title="Annuler" className="text-orange-600"
                            onClick={() => setConfirmAction({ type: 'annuler', id: d.id, numero: d.numero })}>
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title="Supprimer" className="text-destructive"
                          onClick={() => setConfirmAction({ type: 'supprimer', id: d.id, numero: d.numero })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
              Voulez-vous valider le devis <strong>{confirmAction?.numero}</strong> ? Le statut passera à "Accepté".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} className="bg-green-600 hover:bg-green-700" disabled={updateDevisMutation.isPending}>
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
            <AlertDialogCancel>Non</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={convertMutation.isPending}>
              {convertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Convertir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Email */}
      <EmailModal
        open={!!emailModal}
        onOpenChange={(open) => !open && setEmailModal(null)}
        documentType="devis"
        documentNumero={emailModal?.numero || ""}
        clientEmail={emailModal?.clientEmail || ""}
        clientNom={emailModal?.clientNom || ""}
      />
    </MainLayout>
  );
}
