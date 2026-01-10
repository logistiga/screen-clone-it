import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
import { 
  Plus, Search, Eye, Edit, ArrowRight, Wallet, FileText, Ban, Trash2, 
  Download, CreditCard, ClipboardList, Loader2, Container, Package, 
  Truck, Ship, ArrowUpFromLine, ArrowDownToLine, Clock, RotateCcw, 
  Warehouse, Calendar
} from "lucide-react";
import { PaiementModal } from "@/components/PaiementModal";
import { PaiementGlobalModal } from "@/components/PaiementGlobalModal";
import { ExportModal } from "@/components/ExportModal";
import { useOrdres, useDeleteOrdre, useConvertOrdreToFacture, useUpdateOrdre } from "@/hooks/use-commercial";
import { formatMontant, formatDate, getStatutLabel } from "@/data/mockData";
import { TablePagination } from "@/components/TablePagination";

// Types pour les badges
interface TypeConfig {
  label: string;
  icon: React.ReactNode;
  className: string;
}

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

  // Fonction améliorée pour obtenir le badge de type/catégorie
  const getTypeBadge = (ordre: typeof ordresList[0]) => {
    const { categorie, type_operation, type_operation_indep } = ordre;

    // 1. Conteneurs → afficher Import/Export
    if (categorie === 'conteneurs') {
      const typeOp = type_operation?.toLowerCase() || '';
      if (typeOp.includes('import') || typeOp === 'import') {
        const config = typeConteneurConfigs.import;
        return (
          <Badge className={`${config.className} flex items-center gap-1.5 transition-all duration-200 hover:scale-105 font-medium`}>
            {config.icon}
            {config.label}
          </Badge>
        );
      }
      if (typeOp.includes('export') || typeOp === 'export') {
        const config = typeConteneurConfigs.export;
        return (
          <Badge className={`${config.className} flex items-center gap-1.5 transition-all duration-200 hover:scale-105 font-medium`}>
            {config.icon}
            {config.label}
          </Badge>
        );
      }
      // Fallback si pas de type_operation défini
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 flex items-center gap-1.5 transition-all duration-200 hover:scale-105 font-medium">
          <Container className="h-3 w-3" />
          Conteneurs
        </Badge>
      );
    }

    // 2. Opérations indépendantes → afficher le type spécifique
    if (categorie === 'operations_independantes') {
      const typeIndep = type_operation_indep?.toLowerCase() || type_operation?.toLowerCase() || '';
      const config = typeIndepConfigs[typeIndep];
      if (config) {
        return (
          <Badge className={`${config.className} flex items-center gap-1.5 transition-all duration-200 hover:scale-105 font-medium`}>
            {config.icon}
            {config.label}
          </Badge>
        );
      }
      // Fallback
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-200 flex items-center gap-1.5 transition-all duration-200 hover:scale-105 font-medium">
          <Truck className="h-3 w-3" />
          Indépendant
        </Badge>
      );
    }

    // 3. Conventionnel → garder "Conventionnel"
    if (categorie === 'conventionnel') {
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-200 flex items-center gap-1.5 transition-all duration-200 hover:scale-105 font-medium">
          <Ship className="h-3 w-3" />
          Conventionnel
        </Badge>
      );
    }

    // Fallback générique
    return (
      <Badge className="bg-muted text-muted-foreground flex items-center gap-1.5">
        {categorie || 'N/A'}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <MainLayout title="Ordres de Travail">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-10 w-10 text-primary" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-muted-foreground"
          >
            Chargement des ordres...
          </motion.p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Ordres de Travail">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <p className="text-destructive mb-4">Erreur lors du chargement des ordres</p>
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Réessayer
          </Button>
        </motion.div>
      </MainLayout>
    );
  }

  // État vide
  if (ordresList.length === 0 && !searchTerm && statutFilter === "all" && categorieFilter === "all") {
    return (
      <MainLayout title="Ordres de Travail">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <ClipboardList className="h-20 w-20 text-muted-foreground/50 mb-6" />
          </motion.div>
          <h2 className="text-2xl font-semibold mb-2">Aucun ordre de travail</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Commencez par créer votre premier ordre de travail pour gérer vos opérations.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={() => navigate("/ordres/nouveau")} className="gap-2" size="lg">
              <Plus className="h-5 w-5" />
              Créer un ordre
            </Button>
          </motion.div>
        </motion.div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Ordres de Travail">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Stats Cards avec animation */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { 
              title: "Total Ordres", 
              value: totalItems, 
              icon: ClipboardList, 
              color: "primary",
              delay: 0 
            },
            { 
              title: "Montant Total", 
              value: formatMontant(stats.totalOrdres), 
              icon: Wallet, 
              color: "blue-500",
              textColor: "text-blue-600 dark:text-blue-400",
              delay: 0.1 
            },
            { 
              title: "Total Payé", 
              value: formatMontant(stats.totalPaye), 
              icon: CreditCard, 
              color: "green-500",
              textColor: "text-green-600 dark:text-green-400",
              delay: 0.2 
            },
            { 
              title: "En cours", 
              value: stats.ordresEnCours, 
              icon: Clock, 
              color: "orange-500",
              textColor: "text-orange-500",
              delay: 0.3 
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: stat.delay, duration: 0.4 }}
            >
              <Card className={`group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-l-4 border-l-${stat.color}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <stat.icon className="h-4 w-4" />
                    {stat.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <motion.div 
                    className={`text-2xl md:text-3xl font-bold ${stat.textColor || ''}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: stat.delay + 0.2, duration: 0.3 }}
                  >
                    {stat.value}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filtres et Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card/50 backdrop-blur-sm p-4 rounded-lg border"
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Rechercher..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-9 transition-all duration-200 focus:ring-2 focus:ring-primary/20" 
              />
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
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" className="gap-2" onClick={() => setPaiementGlobalOpen(true)}>
                <CreditCard className="h-4 w-4" />
                Paiement global
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" className="gap-2" onClick={() => setExportOpen(true)}>
                <Download className="h-4 w-4" />
                Exporter
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="gap-2 shadow-md" onClick={() => navigate("/ordres/nouveau")}>
                <Plus className="h-4 w-4" />
                Nouvel ordre
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Table avec animations */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">Numéro</TableHead>
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="text-right font-semibold">Montant</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="w-44 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {ordresList.map((ordre, index) => {
                      const resteAPayer = (ordre.montant_ttc || 0) - (ordre.montant_paye || 0);
                      return (
                        <motion.tr
                          key={ordre.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.03, duration: 0.3 }}
                          layout
                          className="border-b transition-colors hover:bg-muted/50 group"
                        >
                          <TableCell 
                            className="font-medium text-primary hover:underline cursor-pointer transition-colors" 
                            onClick={() => navigate(`/ordres/${ordre.id}`)}
                          >
                            {ordre.numero}
                          </TableCell>
                          <TableCell className="font-medium">{ordre.client?.nom}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(ordre.date || ordre.date_creation || ordre.created_at)}
                          </TableCell>
                          <TableCell>{getTypeBadge(ordre)}</TableCell>
                          <TableCell className="text-right">
                            <div className="font-semibold">{formatMontant(ordre.montant_ttc)}</div>
                            {(ordre.montant_paye || 0) > 0 && (
                              <div className="text-sm text-green-600 font-medium">
                                Payé: {formatMontant(ordre.montant_paye)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{getStatutBadge(ordre.statut)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                              <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  title="Voir" 
                                  onClick={() => navigate(`/ordres/${ordre.id}`)} 
                                  className="h-8 w-8 hover:bg-primary/10"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </motion.div>
                              
                              {ordre.statut !== 'facture' && ordre.statut !== 'annule' && (
                                <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    title="Modifier" 
                                    onClick={() => navigate(`/ordres/${ordre.id}/modifier`)} 
                                    className="h-8 w-8 hover:bg-blue-500/10"
                                  >
                                    <Edit className="h-4 w-4 text-blue-600" />
                                  </Button>
                                </motion.div>
                              )}
                              
                              {ordre.statut !== 'facture' && ordre.statut !== 'annule' && resteAPayer > 0 && (
                                <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    title="Paiement" 
                                    className="h-8 w-8 text-green-600 hover:bg-green-500/10"
                                    onClick={() => setPaiementModal({ id: ordre.id, numero: ordre.numero, montantRestant: resteAPayer })}
                                  >
                                    <Wallet className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                              )}
                              
                              {ordre.statut !== 'facture' && ordre.statut !== 'annule' && (
                                <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    title="Facturer" 
                                    className="h-8 w-8 text-primary hover:bg-primary/10"
                                    onClick={() => setConfirmAction({ type: 'facturer', id: ordre.id, numero: ordre.numero })}
                                  >
                                    <ArrowRight className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                              )}
                              
                              <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  title="PDF" 
                                  onClick={() => window.open(`/ordres/${ordre.id}/pdf`, '_blank')} 
                                  className="h-8 w-8 hover:bg-muted"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </motion.div>
                              
                              {ordre.statut !== 'facture' && ordre.statut !== 'annule' && (
                                <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    title="Annuler" 
                                    className="h-8 w-8 text-orange-600 hover:bg-orange-500/10"
                                    onClick={() => setConfirmAction({ type: 'annuler', id: ordre.id, numero: ordre.numero })}
                                  >
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                              )}
                              
                              <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  title="Supprimer" 
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                  onClick={() => setConfirmAction({ type: 'supprimer', id: ordre.id, numero: ordre.numero })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
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
        </motion.div>
      </motion.div>

      {/* Modal Annulation */}
      <AlertDialog open={confirmAction?.type === 'annuler'} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent className="animate-scale-in">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-orange-600" />
              Confirmer l'annulation
            </AlertDialogTitle>
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
        <AlertDialogContent className="animate-scale-in">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Confirmer la suppression
            </AlertDialogTitle>
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
        <AlertDialogContent className="animate-scale-in">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Convertir en facture
            </AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous convertir l'ordre <strong>{confirmAction?.numero}</strong> en facture ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non, annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={convertMutation.isPending}>
              {convertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Convertir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Paiement */}
      {paiementModal && (
        <PaiementModal
          open={!!paiementModal}
          onOpenChange={(open) => !open && setPaiementModal(null)}
          documentType="ordre"
          documentId={paiementModal.id}
          documentNumero={paiementModal.numero}
          montantRestant={paiementModal.montantRestant}
          onSuccess={() => {
            setPaiementModal(null);
            refetch();
          }}
        />
      )}

      {/* Modal Paiement Global */}
      <PaiementGlobalModal
        open={paiementGlobalOpen}
        onOpenChange={setPaiementGlobalOpen}
        onSuccess={() => refetch()}
      />

      {/* Modal Export */}
      <ExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
      />
    </MainLayout>
  );
}
