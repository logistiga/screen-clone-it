import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AnimatedTableRow, AnimatedTableBody } from "@/components/ui/animated-table";
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
  Plus, Eye, Edit, ArrowRight, Wallet, FileText, Ban, Trash2, 
  Download, CreditCard, ClipboardList, Container, Package, 
  Truck, Ship, ArrowUpFromLine, ArrowDownToLine, Clock, RotateCcw, 
  Warehouse, Calendar, TrendingUp, Mail, MessageCircle
} from "lucide-react";
import { EmailModalWithTemplate } from "@/components/EmailModalWithTemplate";
import { PaiementModal } from "@/components/PaiementModal";
import { PaiementGlobalOrdresModal } from "@/components/PaiementGlobalOrdresModal";
import { ExportModal } from "@/components/ExportModal";
import { useOrdres, useDeleteOrdre, useConvertOrdreToFacture } from "@/hooks/use-commercial";
import { useAnnulerOrdre } from "@/hooks/use-annulations";
import { formatMontant, formatDate, getStatutLabel } from "@/data/mockData";
import { TablePagination } from "@/components/TablePagination";
import { toast } from "sonner";
import { AnnulationOrdreModal } from "@/components/AnnulationOrdreModal";
import { openWhatsAppShare } from "@/lib/whatsapp";
import {
  DocumentStatCard,
  DocumentFilters,
  DocumentEmptyState,
  DocumentLoadingState,
  DocumentErrorState,
} from "@/components/shared/documents";

// Types pour les badges
interface TypeConfig {
  label: string;
  icon: React.ReactNode;
  className: string;
}

// Options de filtres
const statutOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "en_cours", label: "En cours" },
  { value: "termine", label: "Terminé" },
  { value: "facture", label: "Facturé" },
  { value: "annule", label: "Annulé" },
];

const categorieOptions = [
  { value: "all", label: "Toutes catégories" },
  { value: "conteneurs", label: "Conteneurs" },
  { value: "conventionnel", label: "Conventionnel" },
  { value: "operations_independantes", label: "Indépendant" },
];

export default function OrdresTravailPage() {
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [categorieFilter, setCategorieFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // API hooks
  const { data: ordresData, isLoading, error, refetch } = useOrdres({
    search: searchTerm || undefined,
    statut: statutFilter !== "all" ? statutFilter : undefined,
    categorie: categorieFilter !== "all" ? categorieFilter : undefined,
    page: currentPage,
    per_page: pageSize,
  });
  
  const deleteOrdreMutation = useDeleteOrdre();
  const convertMutation = useConvertOrdreToFacture();
  
  // États modales consolidés
  const [confirmAction, setConfirmAction] = useState<{
    type: 'supprimer' | 'facturer' | null;
    id: string;
    numero: string;
  } | null>(null);
  const [annulationModal, setAnnulationModal] = useState<{ id: number; numero: string } | null>(null);
  const [paiementModal, setPaiementModal] = useState<{ id: string; numero: string; montantRestant: number; clientId?: number } | null>(null);
  const [paiementGlobalOpen, setPaiementGlobalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [emailModal, setEmailModal] = useState<any>(null);

  // Handlers consolidés
  const handleAction = async () => {
    if (!confirmAction) return;

    try {
      if (confirmAction.type === "supprimer") {
        await deleteOrdreMutation.mutateAsync(confirmAction.id);
      } else if (confirmAction.type === "facturer") {
        await convertMutation.mutateAsync(confirmAction.id);
        toast.success("Ordre converti en facture");
        navigate("/factures");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erreur lors de l'opération");
    } finally {
      setConfirmAction(null);
    }
  };

  const handleWhatsAppShare = (ordre: any) => {
    const pdfUrl = `${window.location.origin}/ordres/${ordre.id}/pdf`;
    const montant = new Intl.NumberFormat('fr-FR').format(ordre.montant_ttc || 0) + ' FCFA';
    const typeOperation = ordre.type_independant || ordre.type_conteneur || 'Ordre de travail';
    const message = `Bonjour${ordre.client?.raison_sociale ? ` ${ordre.client.raison_sociale}` : ''},

Veuillez trouver ci-dessous votre ordre de travail n° *${ordre.numero}* d'un montant de *${montant}*.

📋 *Détails de l'ordre :*
• Client : ${ordre.client?.raison_sociale || ordre.client?.nom_complet || '-'}
• Type : ${typeOperation}
• Montant HT : ${new Intl.NumberFormat('fr-FR').format(ordre.montant_ht || 0)} FCFA
• TVA : ${new Intl.NumberFormat('fr-FR').format(ordre.montant_tva || 0)} FCFA
• *Total TTC : ${montant}*
• Statut : ${getStatutLabel(ordre.statut)}

📎 *Lien du document PDF :*
${pdfUrl}

Pour toute question, n'hésitez pas à nous contacter.

Cordialement,
L'équipe LOGISTIGA`;

    openWhatsAppShare(message);
  };

  const ordresList = ordresData?.data || [];
  const totalPages = ordresData?.meta?.last_page || 1;
  const totalItems = ordresData?.meta?.total || 0;

  // Statistiques calculées avec useMemo pour optimisation
  const stats = useMemo(() => ({
    totalOrdres: ordresList.reduce((sum, o) => sum + (o.montant_ttc || 0), 0),
    totalPaye: ordresList.reduce((sum, o) => sum + (o.montant_paye || 0), 0),
    ordresEnCours: ordresList.filter(o => o.statut === 'en_cours').length
  }), [ordresList]);

  // Configuration des types d'opérations indépendantes
  const typeIndepConfigs: Record<string, TypeConfig> = useMemo(() => ({
    transport: { 
      label: "Transport", 
      icon: <Truck className="h-3 w-3" />, 
      className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-200 dark:border-green-700" 
    },
    manutention: { 
      label: "Manutention", 
      icon: <Package className="h-3 w-3" />, 
      className: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-700" 
    },
    stockage: { 
      label: "Stockage", 
      icon: <Warehouse className="h-3 w-3" />, 
      className: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-700" 
    },
    location: { 
      label: "Location", 
      icon: <Calendar className="h-3 w-3" />, 
      className: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-200 dark:border-teal-700" 
    },
    double_relevage: { 
      label: "Double Relevage", 
      icon: <RotateCcw className="h-3 w-3" />, 
      className: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/40 dark:text-pink-200 dark:border-pink-700" 
    },
  }), []);

  // Configuration des types de conteneurs (Import/Export)
  const typeConteneurConfigs: Record<string, TypeConfig> = useMemo(() => ({
    import: { 
      label: "Import", 
      icon: <ArrowDownToLine className="h-3 w-3" />, 
      className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700" 
    },
    export: { 
      label: "Export", 
      icon: <ArrowUpFromLine className="h-3 w-3" />, 
      className: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-200 dark:border-cyan-700" 
    },
  }), []);

  const getStatutBadge = (statut: string) => {
    const configs: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      en_cours: { 
        label: getStatutLabel(statut), 
        className: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700",
        icon: <Clock className="h-3 w-3" />
      },
      termine: { 
        label: getStatutLabel(statut), 
        className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700",
        icon: null
      },
      facture: { 
        label: getStatutLabel(statut), 
        className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700",
        icon: <FileText className="h-3 w-3" />
      },
      annule: { 
        label: getStatutLabel(statut), 
        className: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700",
        icon: <Ban className="h-3 w-3" />
      },
    };
    const config = configs[statut] || { label: getStatutLabel(statut), className: "bg-muted text-muted-foreground", icon: null };
    return (
      <Badge 
        variant="outline" 
        className={`${config.className} flex items-center gap-1 transition-all duration-200 hover:scale-105`}
      >
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  // Fonction pour déduire le type depuis les lignes de l'ordre
  const getTypeFromLignes = (ordre: typeof ordresList[0]): string => {
    if (ordre.lignes && ordre.lignes.length > 0) {
      const firstLigne = ordre.lignes[0];
      if (firstLigne.type_operation) {
        return firstLigne.type_operation.toLowerCase();
      }
    }
    return '';
  };

  // Fonction améliorée pour obtenir le badge de type/catégorie
  const getTypeBadge = (ordre: typeof ordresList[0]) => {
    const { categorie, type_operation, type_operation_indep } = ordre;

    if (categorie === 'conteneurs') {
      const typeOp = type_operation?.toLowerCase() || '';
      if (typeOp.includes('import') || typeOp === 'import') {
        const config = typeConteneurConfigs.import;
        return (
          <Badge className={`${config.className} flex items-center gap-1.5 transition-all duration-200 hover:scale-105 font-medium`}>
            {config.icon}
            <span>Conteneurs / Import</span>
          </Badge>
        );
      }
      if (typeOp.includes('export') || typeOp === 'export') {
        const config = typeConteneurConfigs.export;
        return (
          <Badge className={`${config.className} flex items-center gap-1.5 transition-all duration-200 hover:scale-105 font-medium`}>
            {config.icon}
            <span>Conteneurs / Export</span>
          </Badge>
        );
      }
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 flex items-center gap-1.5 transition-all duration-200 hover:scale-105 font-medium">
          <Container className="h-3 w-3" />
          Conteneurs
        </Badge>
      );
    }

    if (categorie === 'operations_independantes') {
      let typeIndep = type_operation_indep?.toLowerCase() || type_operation?.toLowerCase() || '';
      
      if (!typeIndep || !typeIndepConfigs[typeIndep]) {
        typeIndep = getTypeFromLignes(ordre);
      }
      
      const config = typeIndepConfigs[typeIndep];
      if (config) {
        return (
          <Badge className={`${config.className} flex items-center gap-1.5 transition-all duration-200 hover:scale-105 font-medium`}>
            {config.icon}
            <span>Indépendant / {config.label}</span>
          </Badge>
        );
      }
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 flex items-center gap-1.5 transition-all duration-200 hover:scale-105 font-medium">
          <Truck className="h-3 w-3" />
          Indépendant
        </Badge>
      );
    }

    if (categorie === 'conventionnel') {
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-200 flex items-center gap-1.5 transition-all duration-200 hover:scale-105 font-medium">
          <Ship className="h-3 w-3" />
          Conventionnel
        </Badge>
      );
    }

    return (
      <Badge className="bg-muted text-muted-foreground flex items-center gap-1.5">
        {categorie || 'N/A'}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <MainLayout title="Ordres de Travail">
        <DocumentLoadingState message="Chargement des ordres..." />
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Ordres de Travail">
        <DocumentErrorState 
          message="Erreur lors du chargement des ordres"
          onRetry={() => refetch()}
        />
      </MainLayout>
    );
  }

  // État vide
  if (ordresList.length === 0 && !searchTerm && statutFilter === "all" && categorieFilter === "all") {
    return (
      <MainLayout title="Ordres de Travail">
        <DocumentEmptyState
          icon={ClipboardList}
          title="Aucun ordre de travail"
          description="Commencez par créer votre premier ordre de travail pour gérer vos opérations."
          actionLabel="Créer un ordre"
          onAction={() => navigate("/ordres/nouveau")}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Ordres de Travail">
      <div className="space-y-6 animate-fade-in">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DocumentStatCard
            title="Total Ordres"
            value={totalItems}
            icon={ClipboardList}
            variant="primary"
            subtitle="Documents créés"
            delay={0}
          />
          <DocumentStatCard
            title="Montant Total"
            value={formatMontant(stats.totalOrdres)}
            icon={TrendingUp}
            variant="info"
            subtitle="Valeur cumulée"
            delay={0.1}
          />
          <DocumentStatCard
            title="Total Payé"
            value={formatMontant(stats.totalPaye)}
            icon={CreditCard}
            variant="success"
            subtitle={`${stats.totalOrdres > 0 ? Math.round((stats.totalPaye / stats.totalOrdres) * 100) : 0}% encaissé`}
            delay={0.2}
          />
          <DocumentStatCard
            title="En cours"
            value={stats.ordresEnCours}
            icon={Clock}
            variant="warning"
            subtitle="Ordres actifs"
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
          <Button className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md" onClick={() => navigate("/ordres/nouveau")}>
            <Plus className="h-4 w-4" />
            Nouvel ordre
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
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Total TTC</TableHead>
                  <TableHead className="text-right">Payé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-48">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <AnimatedTableBody>
                {ordresList.map((ordre, index) => {
                  const resteAPayer = (ordre.montant_ttc || 0) - (ordre.montant_paye || 0);
                  return (
                    <AnimatedTableRow 
                      key={ordre.id} 
                      index={index}
                      className="cursor-pointer"
                    >
                      <TableCell 
                        className="font-medium text-primary hover:underline cursor-pointer"
                        onClick={() => navigate(`/ordres/${ordre.id}`)}
                      >
                        {ordre.numero}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {ordre.client?.nom?.substring(0, 2).toUpperCase() || '??'}
                          </div>
                          <span className="truncate max-w-[150px]">{ordre.client?.nom}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(ordre.date || ordre.created_at)}</TableCell>
                      <TableCell>{getTypeBadge(ordre)}</TableCell>
                      <TableCell className="text-right font-medium">{formatMontant(ordre.montant_ttc)}</TableCell>
                      <TableCell className="text-right">
                        <span className={(ordre.montant_paye || 0) > 0 ? "text-emerald-600 dark:text-emerald-400" : ""}>
                          {formatMontant(ordre.montant_paye)}
                        </span>
                        {resteAPayer > 0 && ordre.statut !== 'facture' && (
                          <div className="text-xs text-destructive">
                            Reste: {formatMontant(resteAPayer)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatutBadge(ordre.statut)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" title="Voir" onClick={() => navigate(`/ordres/${ordre.id}`)} className="transition-all duration-200 hover:scale-110 hover:bg-primary/10">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {ordre.statut !== 'annule' && (
                            <Button variant="ghost" size="icon" title="Modifier" onClick={() => navigate(`/ordres/${ordre.id}/modifier`)} className="transition-all duration-200 hover:scale-110 hover:bg-blue-500/10">
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {ordre.statut !== 'facture' && ordre.statut !== 'annule' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Convertir en facture"
                              className="text-primary transition-all duration-200 hover:scale-110 hover:bg-primary/10"
                              onClick={() => setConfirmAction({ type: 'facturer', id: ordre.id, numero: ordre.numero })}
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          )}
                          {ordre.statut !== 'facture' && ordre.statut !== 'annule' && resteAPayer > 0 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Paiement" 
                              className="text-emerald-600 transition-all duration-200 hover:scale-110 hover:bg-emerald-500/10"
                              onClick={() => setPaiementModal({ 
                                id: ordre.id, 
                                numero: ordre.numero, 
                                montantRestant: resteAPayer,
                                clientId: ordre.client_id ? Number(ordre.client_id) : undefined
                              })}
                            >
                              <Wallet className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" title="Voir PDF" onClick={() => navigate(`/ordres/${ordre.id}/pdf`)} className="transition-all duration-200 hover:scale-110 hover:bg-muted">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Télécharger PDF" onClick={() => window.open(`/ordres/${ordre.id}/pdf`, '_blank')} className="text-primary transition-all duration-200 hover:scale-110 hover:bg-primary/10">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Email" 
                            className="text-blue-600 transition-all duration-200 hover:scale-110 hover:bg-blue-500/10"
                            onClick={() => setEmailModal(ordre)}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="WhatsApp" 
                            className="text-emerald-600 transition-all duration-200 hover:scale-110 hover:bg-emerald-500/10"
                            onClick={() => handleWhatsAppShare(ordre)}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          {ordre.statut !== 'annule' && ordre.statut !== 'facture' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Annuler"
                              className="text-orange-600 transition-all duration-200 hover:scale-110 hover:bg-orange-500/10"
                              onClick={() => setAnnulationModal({ id: Number(ordre.id), numero: ordre.numero })}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Supprimer"
                            className="text-destructive transition-all duration-200 hover:scale-110 hover:bg-red-500/10"
                            onClick={() => setConfirmAction({ type: 'supprimer', id: ordre.id, numero: ordre.numero })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </AnimatedTableRow>
                  );
                })}
                {ordresList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucun ordre trouvé avec ces critères
                    </TableCell>
                  </TableRow>
                )}
              </AnimatedTableBody>
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
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'supprimer' ? 'Confirmer la suppression' : 'Convertir en facture'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'supprimer' 
                ? `Êtes-vous sûr de vouloir supprimer l'ordre ${confirmAction?.numero} ? Cette action est irréversible.`
                : `Voulez-vous convertir l'ordre ${confirmAction?.numero} en facture ?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAction} 
              className={confirmAction?.type === 'supprimer' ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {confirmAction?.type === 'supprimer' ? 'Supprimer' : 'Convertir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {annulationModal && (
        <AnnulationOrdreModal
          open={!!annulationModal}
          onOpenChange={() => setAnnulationModal(null)}
          ordreId={annulationModal.id}
          ordreNumero={annulationModal.numero}
        />
      )}

      {paiementModal && (
        <PaiementModal
          open={!!paiementModal}
          onOpenChange={() => setPaiementModal(null)}
          documentType="ordre"
          documentId={paiementModal.id}
          documentNumero={paiementModal.numero}
          montantRestant={paiementModal.montantRestant}
          clientId={paiementModal.clientId}
          onSuccess={() => refetch()}
        />
      )}

      <PaiementGlobalOrdresModal
        open={paiementGlobalOpen}
        onOpenChange={setPaiementGlobalOpen}
      />

      <ExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
      />

      {emailModal && (
        <EmailModalWithTemplate
          open={!!emailModal}
          onOpenChange={() => setEmailModal(null)}
          documentType="ordre"
          documentData={{
            id: emailModal.id,
            numero: emailModal.numero,
            dateCreation: emailModal.date_creation,
            montantTTC: emailModal.montant_ttc,
            montantHT: emailModal.montant_ht,
            resteAPayer: (emailModal.montant_ttc || 0) - (emailModal.montant_paye || 0),
            clientNom: emailModal.client?.raison_sociale || emailModal.client?.nom_complet,
            clientEmail: emailModal.client?.email,
            transitaireNom: emailModal.transitaire?.nom,
            transitaireEmail: emailModal.transitaire?.email,
            armateurNom: emailModal.armateur?.nom,
            armateurEmail: emailModal.armateur?.email,
            representantNom: emailModal.representant?.nom,
            representantEmail: emailModal.representant?.email,
            contacts: emailModal.client?.contacts || [],
            statut: emailModal.statut,
            categorie: emailModal.categorie || emailModal.type_operation,
          }}
        />
      )}
    </MainLayout>
  );
}
