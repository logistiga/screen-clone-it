import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  FileText,
  Edit,
  ArrowRight,
  Wallet,
  Clock,
  User,
  AlertCircle,
  Ship,
  Loader2,
  Container,
  Package,
  Truck,
  ArrowDownToLine,
  ArrowUpFromLine,
  Warehouse,
  Calendar,
  RotateCcw,
  Ban,
  Receipt,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Hash,
  Anchor,
  StickyNote,
} from "lucide-react";
import { useOrdreById, useConvertOrdreToFacture } from "@/hooks/use-commercial";
import { formatMontant, formatDate, getStatutLabel } from "@/data/mockData";
import { PaiementModal } from "@/components/PaiementModal";
import { toast } from "sonner";

// Types pour les badges
interface TypeConfig {
  label: string;
  icon: React.ReactNode;
  className: string;
}

export default function OrdreDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("details");
  const [paiementModalOpen, setPaiementModalOpen] = useState(false);

  const { data: ordre, isLoading, error, refetch } = useOrdreById(id || "");
  const convertMutation = useConvertOrdreToFacture();

  // Configuration des types d'opérations indépendantes
  const typeIndepConfigs: Record<string, TypeConfig> = useMemo(() => ({
    transport: { 
      label: "Transport", 
      icon: <Truck className="h-3.5 w-3.5" />, 
      className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-200 dark:border-green-700" 
    },
    manutention: { 
      label: "Manutention", 
      icon: <Package className="h-3.5 w-3.5" />, 
      className: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-700" 
    },
    stockage: { 
      label: "Stockage", 
      icon: <Warehouse className="h-3.5 w-3.5" />, 
      className: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-700" 
    },
    location: { 
      label: "Location", 
      icon: <Calendar className="h-3.5 w-3.5" />, 
      className: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-200 dark:border-teal-700" 
    },
    double_relevage: { 
      label: "Double Relevage", 
      icon: <RotateCcw className="h-3.5 w-3.5" />, 
      className: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/40 dark:text-pink-200 dark:border-pink-700" 
    },
  }), []);

  // Configuration des types de conteneurs (Import/Export)
  const typeConteneurConfigs: Record<string, TypeConfig> = useMemo(() => ({
    import: { 
      label: "Import", 
      icon: <ArrowDownToLine className="h-3.5 w-3.5" />, 
      className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700" 
    },
    export: { 
      label: "Export", 
      icon: <ArrowUpFromLine className="h-3.5 w-3.5" />, 
      className: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-200 dark:border-cyan-700" 
    },
  }), []);

  const getStatutConfig = (statut: string) => {
    const configs: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      en_cours: { 
        label: getStatutLabel(statut), 
        className: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700",
        icon: <Clock className="h-3.5 w-3.5" />
      },
      termine: { 
        label: getStatutLabel(statut), 
        className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700",
        icon: null
      },
      facture: { 
        label: getStatutLabel(statut), 
        className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700",
        icon: <FileText className="h-3.5 w-3.5" />
      },
      annule: { 
        label: getStatutLabel(statut), 
        className: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700",
        icon: <Ban className="h-3.5 w-3.5" />
      },
    };
    return configs[statut] || { label: getStatutLabel(statut), className: "bg-muted text-muted-foreground", icon: null };
  };

  // Fonction améliorée pour obtenir le badge de type/catégorie
  // Affiche "Catégorie / Type" pour plus de clarté
  const getTypeBadge = (ordre: any) => {
    const { categorie, type_operation, type_operation_indep } = ordre;

    // 1. Conteneurs → afficher "Conteneurs / Import" ou "Conteneurs / Export"
    if (categorie === 'conteneurs') {
      const typeOp = type_operation?.toLowerCase() || '';
      if (typeOp.includes('import') || typeOp === 'import') {
        const config = typeConteneurConfigs.import;
        return (
          <Badge className={`${config.className} flex items-center gap-1.5 font-medium`}>
            {config.icon}
            <span>Conteneurs / Import</span>
          </Badge>
        );
      }
      if (typeOp.includes('export') || typeOp === 'export') {
        const config = typeConteneurConfigs.export;
        return (
          <Badge className={`${config.className} flex items-center gap-1.5 font-medium`}>
            {config.icon}
            <span>Conteneurs / Export</span>
          </Badge>
        );
      }
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 flex items-center gap-1.5 font-medium">
          <Container className="h-3.5 w-3.5" />
          Conteneurs
        </Badge>
      );
    }

    // 2. Opérations indépendantes → afficher "Indépendant / [type spécifique]"
    if (categorie === 'operations_independantes') {
      const typeIndep = type_operation_indep?.toLowerCase() || type_operation?.toLowerCase() || '';
      const config = typeIndepConfigs[typeIndep];
      if (config) {
        return (
          <Badge className={`${config.className} flex items-center gap-1.5 font-medium`}>
            {config.icon}
            <span>Indépendant / {config.label}</span>
          </Badge>
        );
      }
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-200 flex items-center gap-1.5 font-medium">
          <Truck className="h-3.5 w-3.5" />
          Indépendant
        </Badge>
      );
    }

    // 3. Conventionnel
    if (categorie === 'conventionnel') {
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-200 flex items-center gap-1.5 font-medium">
          <Ship className="h-3.5 w-3.5" />
          Conventionnel
        </Badge>
      );
    }

    // Fallback
    return (
      <Badge className="bg-muted text-muted-foreground flex items-center gap-1.5">
        {ordre.type_document || categorie || 'N/A'}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <MainLayout title="Chargement...">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
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
            Chargement de l'ordre...
          </motion.p>
        </div>
      </MainLayout>
    );
  }

  if (error || !ordre) {
    return (
      <MainLayout title="Ordre non trouvé">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <AlertCircle className="h-20 w-20 text-destructive/50 mb-6" />
          </motion.div>
          <h2 className="text-xl font-semibold mb-2">Ordre de travail non trouvé</h2>
          <p className="text-muted-foreground mb-6">
            L'ordre demandé n'existe pas ou a été supprimé.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={() => navigate("/ordres")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour aux ordres
            </Button>
          </motion.div>
        </motion.div>
      </MainLayout>
    );
  }

  const resteAPayer = (ordre.montant_ttc || 0) - (ordre.montant_paye || 0);
  const client = ordre.client;
  const statutConfig = getStatutConfig(ordre.statut);

  const handleConvertToFacture = async () => {
    try {
      await convertMutation.mutateAsync(id!);
      toast.success("Ordre converti en facture avec succès");
      navigate("/factures");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la conversion");
    }
  };

  // Traçabilité mock
  const tracabilite = [
    {
      id: "1",
      action: "Création",
      utilisateur: "Système",
      date: ordre.created_at || ordre.date,
      details: "Ordre de travail créé",
      icon: FileText,
      color: "text-blue-600",
    },
  ];

  return (
    <MainLayout title={`Ordre ${ordre.numero}`}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Header avec actions */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card/50 backdrop-blur-sm p-4 rounded-lg border"
        >
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button variant="ghost" size="icon" onClick={() => navigate("/ordres")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </motion.div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{ordre.numero}</h1>
                <Badge 
                  variant="outline" 
                  className={`${statutConfig.className} flex items-center gap-1`}
                >
                  {statutConfig.icon}
                  {statutConfig.label}
                </Badge>
                {getTypeBadge(ordre)}
              </div>
              <p className="text-muted-foreground mt-1">
                Créé le {formatDate(ordre.date)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open(`/ordres/${id}/pdf`, "_blank")}
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
            </motion.div>
            {ordre.statut !== 'facture' && ordre.statut !== 'annule' && (
              <>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigate(`/ordres/${id}/modifier`)}
                  >
                    <Edit className="h-4 w-4" />
                    Modifier
                  </Button>
                </motion.div>
                {resteAPayer > 0 && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      variant="outline" 
                      className="gap-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" 
                      onClick={() => setPaiementModalOpen(true)}
                    >
                      <Wallet className="h-4 w-4" />
                      Paiement
                    </Button>
                  </motion.div>
                )}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    className="gap-2 shadow-md" 
                    onClick={handleConvertToFacture} 
                    disabled={convertMutation.isPending}
                  >
                    {convertMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    Facturer
                  </Button>
                </motion.div>
              </>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="details" className="gap-2">
              <Receipt className="h-4 w-4" />
              Détails
            </TabsTrigger>
            <TabsTrigger value="tracabilite" className="gap-2">
              <Clock className="h-4 w-4" />
              Historique
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="details" className="space-y-6 mt-6">
              {/* Infos client + récap */}
              <div className="grid gap-6 md:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg group">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <User className="h-5 w-5 text-primary" />
                        Client
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{client?.nom}</p>
                          <p className="text-sm text-muted-foreground">{client?.type}</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        {client?.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{client.email}</span>
                          </div>
                        )}
                        {client?.telephone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{client.telephone}</span>
                          </div>
                        )}
                        {(client?.adresse || client?.ville) && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{[client?.adresse, client?.ville].filter(Boolean).join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-green-500/5 to-transparent">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <CreditCard className="h-5 w-5 text-green-600" />
                        Récapitulatif financier
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Montant HT</span>
                        <span className="font-medium">{formatMontant(ordre.montant_ht)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">TVA</span>
                        <span>{formatMontant(ordre.montant_tva)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">CSS</span>
                        <span>{formatMontant(ordre.montant_css)}</span>
                      </div>
                      <Separator />
                      <motion.div 
                        className="flex justify-between items-center text-lg"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <span className="font-bold">Total TTC</span>
                        <span className="font-bold text-primary text-xl">{formatMontant(ordre.montant_ttc)}</span>
                      </motion.div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Wallet className="h-4 w-4" />
                          Montant payé
                        </span>
                        <span className="text-green-600 font-medium">{formatMontant(ordre.montant_paye || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center font-semibold">
                        <span>Reste à payer</span>
                        <motion.span 
                          className={resteAPayer > 0 ? "text-destructive" : "text-green-600"}
                          animate={resteAPayer > 0 ? { scale: [1, 1.05, 1] } : {}}
                          transition={{ repeat: resteAPayer > 0 ? Infinity : 0, duration: 2 }}
                        >
                          {formatMontant(resteAPayer)}
                        </motion.span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Infos BL */}
              {ordre.bl_numero && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-500/5 to-transparent">
                      <CardTitle className="flex items-center gap-2">
                        <Anchor className="h-5 w-5 text-blue-600" />
                        Informations BL
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Hash className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Numéro BL</span>
                            <p className="font-mono font-medium">{ordre.bl_numero}</p>
                          </div>
                        </div>
                        {ordre.navire && (
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                              <Ship className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Navire</span>
                              <p className="font-medium">{ordre.navire}</p>
                            </div>
                          </div>
                        )}
                        {ordre.date_arrivee && (
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                              <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Date d'arrivée</span>
                              <p className="font-medium">{formatDate(ordre.date_arrivee)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Lignes de l'ordre - Prestations indépendantes */}
              {ordre.lignes && ordre.lignes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
                    <CardHeader className="bg-gradient-to-r from-green-500/5 to-transparent">
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-green-600" />
                        Prestations
                        <Badge variant="secondary" className="ml-2">{ordre.lignes.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Description</TableHead>
                            <TableHead>Trajet / Lieu</TableHead>
                            <TableHead>Période</TableHead>
                            <TableHead className="text-center">Qté</TableHead>
                            <TableHead className="text-right">Prix unit.</TableHead>
                            <TableHead className="text-right">Montant HT</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ordre.lignes.map((ligne: any, index: number) => (
                            <motion.tr
                              key={ligne.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="border-b hover:bg-muted/50 transition-colors"
                            >
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{ligne.description || ligne.type_operation}</span>
                                  {ligne.type_operation && ligne.description && (
                                    <span className="text-xs text-muted-foreground capitalize">{ligne.type_operation}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {(ligne.lieu_depart || ligne.lieu_arrivee) ? (
                                  <div className="flex items-center gap-1 text-sm">
                                    {ligne.lieu_depart && <span>{ligne.lieu_depart}</span>}
                                    {ligne.lieu_depart && ligne.lieu_arrivee && <span className="text-muted-foreground">→</span>}
                                    {ligne.lieu_arrivee && <span>{ligne.lieu_arrivee}</span>}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {(ligne.date_debut || ligne.date_fin) ? (
                                  <div className="text-sm">
                                    {ligne.date_debut && <span>{formatDate(ligne.date_debut)}</span>}
                                    {ligne.date_debut && ligne.date_fin && <span className="text-muted-foreground"> → </span>}
                                    {ligne.date_fin && <span>{formatDate(ligne.date_fin)}</span>}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">{ligne.quantite}</TableCell>
                              <TableCell className="text-right">
                                {formatMontant(ligne.prix_unitaire)}
                              </TableCell>
                              <TableCell className="text-right font-medium text-primary">
                                {formatMontant(ligne.montant_ht || ligne.quantite * ligne.prix_unitaire)}
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Conteneurs */}
              {ordre.conteneurs && ordre.conteneurs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Container className="h-5 w-5 text-blue-600" />
                        Conteneurs
                        <Badge variant="secondary" className="ml-2">{ordre.conteneurs.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Numéro</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Taille</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ordre.conteneurs.map((conteneur: any, index: number) => (
                            <motion.tr
                              key={conteneur.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="border-b hover:bg-muted/50 transition-colors"
                            >
                              <TableCell className="font-mono font-medium">{conteneur.numero}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{conteneur.type}</Badge>
                              </TableCell>
                              <TableCell>{conteneur.taille}</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatMontant(conteneur.montant_ht || 0)}
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Lots */}
              {ordre.lots && ordre.lots.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-purple-600" />
                        Lots
                        <Badge variant="secondary" className="ml-2">{ordre.lots.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Désignation</TableHead>
                            <TableHead className="text-center">Quantité</TableHead>
                            <TableHead className="text-right">Prix unitaire</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ordre.lots.map((lot: any, index: number) => (
                            <motion.tr
                              key={lot.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="border-b hover:bg-muted/50 transition-colors"
                            >
                              <TableCell>{lot.designation}</TableCell>
                              <TableCell className="text-center">{lot.quantite}</TableCell>
                              <TableCell className="text-right">
                                {formatMontant(lot.prix_unitaire)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatMontant(lot.montant_ht || lot.quantite * lot.prix_unitaire)}
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Notes */}
              {ordre.notes && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-amber-500/5 to-transparent">
                      <CardTitle className="flex items-center gap-2">
                        <StickyNote className="h-5 w-5 text-amber-600" />
                        Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-muted-foreground whitespace-pre-wrap">{ordre.notes}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="tracabilite" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Historique des actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-transparent" />
                      <div className="space-y-6">
                        {tracabilite.map((action, index) => {
                          const IconComponent = action.icon;
                          return (
                            <motion.div
                              key={action.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="relative flex gap-4 pl-10"
                            >
                              <motion.div
                                className={`absolute left-0 p-2 rounded-full bg-background border-2 ${action.color.replace("text-", "border-")}`}
                                whileHover={{ scale: 1.1 }}
                              >
                                <IconComponent className={`h-4 w-4 ${action.color}`} />
                              </motion.div>
                              <div className="flex-1 bg-muted/30 rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold">{action.action}</span>
                                  <span className="text-sm text-muted-foreground">{formatDate(action.date)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                  <User className="h-3 w-3" />
                                  <span>{action.utilisateur}</span>
                                </div>
                                <p className="text-sm">{action.details}</p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>

      {/* Modal paiement */}
      <PaiementModal
        open={paiementModalOpen}
        onOpenChange={setPaiementModalOpen}
        documentType="ordre"
        documentId={ordre.id}
        documentNumero={ordre.numero}
        montantRestant={resteAPayer}
        onSuccess={() => refetch()}
      />
    </MainLayout>
  );
}
