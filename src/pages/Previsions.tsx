import { useState } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Plus, Target, TrendingUp, TrendingDown, Wallet, Building2, 
  BarChart3, PieChart, RefreshCw, Trash2, CheckCircle2, 
  XCircle, AlertTriangle, Clock, ArrowUpRight,
  ChevronDown, ChevronUp
} from "lucide-react";
import { NouvellePrevisionModal } from "@/components/NouvellePrevisionModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  usePrevisions,
  usePrevisionStats,
  usePrevisionComparaison,
  useDeletePrevision,
  useSyncPrevisionRealise,
} from "@/hooks/use-previsions";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DocumentStatCard, DocumentStatCardSkeleton } from "@/components/shared/documents/DocumentStatCard";
import { DocumentEmptyState } from "@/components/shared/documents/DocumentEmptyState";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function PrevisionsPage() {
  const currentDate = new Date();
  const [annee, setAnnee] = useState(currentDate.getFullYear());
  const [mois, setMois] = useState<number | undefined>();
  const [source, setSource] = useState<string | undefined>();
  const [showNouvelleModal, setShowNouvelleModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const { data: previsionsData, isLoading: loadingPrevisions } = usePrevisions({ 
    annee, 
    per_page: 100 
  });
  const { data: stats, isLoading: loadingStats } = usePrevisionStats(annee);
  const { data: comparaison, isLoading: loadingComparaison } = usePrevisionComparaison(annee);
  const deleteMutation = useDeletePrevision();
  const syncMutation = useSyncPrevisionRealise();

  const previsions = previsionsData?.data || [];

  const formatMontant = (montant: number) => {
    if (montant >= 1000000) return (montant / 1000000).toFixed(1) + 'M';
    if (montant >= 1000) return (montant / 1000).toFixed(0) + 'K';
    return montant.toLocaleString('fr-FR');
  };

  const formatMontantFull = (montant: number) => {
    return montant.toLocaleString('fr-FR') + ' FCFA';
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'en_cours': return <Badge variant="outline" className="border-primary text-primary"><Clock className="h-3 w-3 mr-1" />En cours</Badge>;
      case 'atteint': return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="h-3 w-3 mr-1" />Atteint</Badge>;
      case 'depasse': return <Badge className="bg-info text-info-foreground"><ArrowUpRight className="h-3 w-3 mr-1" />Dépassé</Badge>;
      case 'non_atteint': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Non atteint</Badge>;
      default: return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getTauxColor = (taux: number) => {
    if (taux >= 100) return 'text-success';
    if (taux >= 75) return 'text-primary';
    if (taux >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const handleSync = async () => {
    const currentMois = mois || currentDate.getMonth() + 1;
    await syncMutation.mutateAsync({ annee, mois: currentMois });
  };

  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette prévision ?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // Données pour les graphiques
  const chartDataMensuel = comparaison?.comparaison?.map(c => ({
    mois: c.mois_nom.substring(0, 3),
    recettes_prevues: c.recettes.caisse.prevu + c.recettes.banque.prevu,
    recettes_realisees: c.recettes.caisse.realise + c.recettes.banque.realise,
    depenses_prevues: c.depenses.caisse.prevu + c.depenses.banque.prevu,
    depenses_realisees: c.depenses.caisse.realise + c.depenses.banque.realise,
  })) || [];

  const anneeOptions = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  // Calcul totaux
  const totalRecettesPrevu = (stats?.stats.recettes.caisse.prevu || 0) + (stats?.stats.recettes.banque.prevu || 0);
  const totalRecettesRealise = (stats?.stats.recettes.caisse.realise || 0) + (stats?.stats.recettes.banque.realise || 0);
  const totalDepensesPrevu = (stats?.stats.depenses.caisse.prevu || 0) + (stats?.stats.depenses.banque.prevu || 0);
  const totalDepensesRealise = (stats?.stats.depenses.caisse.realise || 0) + (stats?.stats.depenses.banque.realise || 0);
  const soldePrevu = totalRecettesPrevu - totalDepensesPrevu;
  const soldeRealise = totalRecettesRealise - totalDepensesRealise;
  const tauxRecettes = totalRecettesPrevu > 0 ? Math.round((totalRecettesRealise / totalRecettesPrevu) * 100) : 0;
  const tauxDepenses = totalDepensesPrevu > 0 ? Math.round((totalDepensesRealise / totalDepensesPrevu) * 100) : 0;

  if (loadingStats) {
    return (
      <MainLayout title="Prévisions budgétaires">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <DocumentStatCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Prévisions budgétaires">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Prévisions budgétaires
          </h1>
          <p className="text-muted-foreground">
            Suivi des prévisions et réalisations financières
          </p>
        </motion.div>

        {/* Filtres et actions */}
        <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2 flex-wrap">
            <Select value={annee.toString()} onValueChange={(v) => setAnnee(parseInt(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {anneeOptions.map(a => (
                  <SelectItem key={a} value={a.toString()}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={source || "all"} onValueChange={(v) => setSource(v === "all" ? undefined : v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Toutes sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes sources</SelectItem>
                <SelectItem value="caisse">Caisse</SelectItem>
                <SelectItem value="banque">Banque</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSync} disabled={syncMutation.isPending}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              Synchroniser
            </Button>
            <Button onClick={() => setShowNouvelleModal(true)} className="shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle prévision
            </Button>
          </div>
        </motion.div>

        {(previsions.length === 0) && (
          <motion.div variants={itemVariants}>
            <Alert className="border-warning/50 bg-warning/10">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertTitle>Prévisions non définies pour {annee}</AlertTitle>
              <AlertDescription>
                Les montants « Prévu » restent à 0 tant que vous n'avez pas ajouté de prévisions.
                Le bouton « Synchroniser » met à jour uniquement le « Réalisé ».
                <Button variant="link" className="px-1 text-primary" onClick={() => setShowNouvelleModal(true)}>
                  Ajouter une prévision
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Dashboard KPIs */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DocumentStatCard
            title="Recettes prévues"
            value={formatMontant(totalRecettesPrevu)}
            icon={TrendingUp}
            subtitle={`Réalisé: ${formatMontant(totalRecettesRealise)} (${tauxRecettes}%)`}
            variant="success"
            delay={0}
          />
          <DocumentStatCard
            title="Dépenses prévues"
            value={formatMontant(totalDepensesPrevu)}
            icon={TrendingDown}
            subtitle={`Réalisé: ${formatMontant(totalDepensesRealise)} (${tauxDepenses}%)`}
            variant="danger"
            delay={0.1}
          />
          <DocumentStatCard
            title="Solde prévisionnel"
            value={formatMontant(soldePrevu)}
            icon={Target}
            subtitle={`Réel: ${formatMontant(soldeRealise)}`}
            variant={soldePrevu >= 0 ? "primary" : "danger"}
            delay={0.2}
          />
          <DocumentStatCard
            title="Taux global"
            value={`${stats?.taux_global || 0}%`}
            icon={BarChart3}
            subtitle={`${stats?.compteurs.atteint || 0} atteint · ${stats?.compteurs.en_cours || 0} en cours`}
            variant="info"
            delay={0.3}
          />
        </motion.div>

        {/* Détails Caisse vs Banque */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-warning">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="h-5 w-5 text-warning" />
                Caisse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Recettes</p>
                    <p className="font-semibold">Prévu: {formatMontant(stats?.stats.recettes.caisse.prevu || 0)}</p>
                    <p className="text-sm text-success">Réalisé: {formatMontant(stats?.stats.recettes.caisse.realise || 0)}</p>
                  </div>
                  <div className="text-right">
                    <Progress 
                      value={stats?.stats.recettes.caisse.prevu ? 
                        Math.min(100, (stats.stats.recettes.caisse.realise / stats.stats.recettes.caisse.prevu) * 100) : 0} 
                      className="w-20 h-2"
                    />
                    <p className={`text-sm font-medium mt-1 ${getTauxColor(
                      stats?.stats.recettes.caisse.prevu ? 
                      (stats.stats.recettes.caisse.realise / stats.stats.recettes.caisse.prevu) * 100 : 0
                    )}`}>
                      {stats?.stats.recettes.caisse.prevu ? 
                        Math.round((stats.stats.recettes.caisse.realise / stats.stats.recettes.caisse.prevu) * 100) : 0}%
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Dépenses</p>
                    <p className="font-semibold">Prévu: {formatMontant(stats?.stats.depenses.caisse.prevu || 0)}</p>
                    <p className="text-sm text-destructive">Réalisé: {formatMontant(stats?.stats.depenses.caisse.realise || 0)}</p>
                  </div>
                  <div className="text-right">
                    <Progress 
                      value={stats?.stats.depenses.caisse.prevu ? 
                        Math.min(100, (stats.stats.depenses.caisse.realise / stats.stats.depenses.caisse.prevu) * 100) : 0} 
                      className="w-20 h-2"
                    />
                    <p className={`text-sm font-medium mt-1 ${getTauxColor(
                      stats?.stats.depenses.caisse.prevu ? 
                      (stats.stats.depenses.caisse.realise / stats.stats.depenses.caisse.prevu) * 100 : 0
                    )}`}>
                      {stats?.stats.depenses.caisse.prevu ? 
                        Math.round((stats.stats.depenses.caisse.realise / stats.stats.depenses.caisse.prevu) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Banque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Recettes</p>
                    <p className="font-semibold">Prévu: {formatMontant(stats?.stats.recettes.banque.prevu || 0)}</p>
                    <p className="text-sm text-success">Réalisé: {formatMontant(stats?.stats.recettes.banque.realise || 0)}</p>
                  </div>
                  <div className="text-right">
                    <Progress 
                      value={stats?.stats.recettes.banque.prevu ? 
                        Math.min(100, (stats.stats.recettes.banque.realise / stats.stats.recettes.banque.prevu) * 100) : 0} 
                      className="w-20 h-2"
                    />
                    <p className={`text-sm font-medium mt-1 ${getTauxColor(
                      stats?.stats.recettes.banque.prevu ? 
                      (stats.stats.recettes.banque.realise / stats.stats.recettes.banque.prevu) * 100 : 0
                    )}`}>
                      {stats?.stats.recettes.banque.prevu ? 
                        Math.round((stats.stats.recettes.banque.realise / stats.stats.recettes.banque.prevu) * 100) : 0}%
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Dépenses</p>
                    <p className="font-semibold">Prévu: {formatMontant(stats?.stats.depenses.banque.prevu || 0)}</p>
                    <p className="text-sm text-destructive">Réalisé: {formatMontant(stats?.stats.depenses.banque.realise || 0)}</p>
                  </div>
                  <div className="text-right">
                    <Progress 
                      value={stats?.stats.depenses.banque.prevu ? 
                        Math.min(100, (stats.stats.depenses.banque.realise / stats.stats.depenses.banque.prevu) * 100) : 0} 
                      className="w-20 h-2"
                    />
                    <p className={`text-sm font-medium mt-1 ${getTauxColor(
                      stats?.stats.depenses.banque.prevu ? 
                      (stats.stats.depenses.banque.realise / stats.stats.depenses.banque.prevu) * 100 : 0
                    )}`}>
                      {stats?.stats.depenses.banque.prevu ? 
                        Math.round((stats.stats.depenses.banque.realise / stats.stats.depenses.banque.prevu) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tabs defaultValue="comparaison" className="space-y-4">
            <TabsList className="flex-wrap">
              <TabsTrigger value="comparaison">
                <BarChart3 className="h-4 w-4 mr-1" />
                Comparaison
              </TabsTrigger>
              <TabsTrigger value="details">
                <PieChart className="h-4 w-4 mr-1" />
                Détails
              </TabsTrigger>
              <TabsTrigger value="liste">
                Liste ({previsions.length})
              </TabsTrigger>
            </TabsList>

            {/* Onglet Comparaison */}
            <TabsContent value="comparaison" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Évolution mensuelle - Prévu vs Réalisé</CardTitle>
                  <CardDescription>Comparaison des recettes et dépenses par mois</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataMensuel}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="mois" className="text-xs" />
                        <YAxis tickFormatter={(v) => formatMontant(v)} className="text-xs" />
                        <Tooltip 
                          formatter={(value: number) => formatMontantFull(value)}
                          labelFormatter={(label) => `${label}`}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="recettes_prevues" name="Recettes prévues" fill="hsl(var(--success) / 0.5)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="recettes_realisees" name="Recettes réalisées" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="depenses_prevues" name="Dépenses prévues" fill="hsl(var(--destructive) / 0.5)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="depenses_realisees" name="Dépenses réalisées" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Tableau de comparaison mensuelle */}
              <Card>
                <CardHeader>
                  <CardTitle>Tableau comparatif mensuel</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Mois</TableHead>
                          <TableHead className="text-center text-success" colSpan={2}>Recettes</TableHead>
                          <TableHead className="text-center text-destructive" colSpan={2}>Dépenses</TableHead>
                          <TableHead className="text-right">Solde</TableHead>
                        </TableRow>
                        <TableRow className="bg-muted/30">
                          <TableHead></TableHead>
                          <TableHead className="text-center text-xs">Prévu</TableHead>
                          <TableHead className="text-center text-xs">Réalisé</TableHead>
                          <TableHead className="text-center text-xs">Prévu</TableHead>
                          <TableHead className="text-center text-xs">Réalisé</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comparaison?.comparaison?.map((c, index) => {
                          const recP = c.recettes.caisse.prevu + c.recettes.banque.prevu;
                          const recR = c.recettes.caisse.realise + c.recettes.banque.realise;
                          const depP = c.depenses.caisse.prevu + c.depenses.banque.prevu;
                          const depR = c.depenses.caisse.realise + c.depenses.banque.realise;
                          const solde = recR - depR;
                          
                          return (
                            <motion.tr
                              key={c.mois}
                              variants={itemVariants}
                              initial="hidden"
                              animate="visible"
                              transition={{ delay: index * 0.03 }}
                              className="border-b"
                            >
                              <TableCell className="font-medium">{c.mois_nom}</TableCell>
                              <TableCell className="text-center">{formatMontant(recP)}</TableCell>
                              <TableCell className="text-center text-success font-medium">{formatMontant(recR)}</TableCell>
                              <TableCell className="text-center">{formatMontant(depP)}</TableCell>
                              <TableCell className="text-center text-destructive font-medium">{formatMontant(depR)}</TableCell>
                              <TableCell className={`text-right font-bold ${solde >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {formatMontant(solde)}
                              </TableCell>
                            </motion.tr>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Détails par catégorie */}
            <TabsContent value="details" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Par catégorie - Recettes */}
                <Card className="border-t-4 border-t-success">
                  <CardHeader>
                    <CardTitle className="text-success flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Recettes par catégorie
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats?.par_categorie
                        ?.filter(c => c.type === 'recette')
                        .map((cat, i) => {
                          const taux = cat.prevu > 0 ? (cat.realise / cat.prevu) * 100 : 0;
                          return (
                            <Collapsible 
                              key={i} 
                              open={expandedCategories.includes(`rec-${cat.categorie}`)}
                              onOpenChange={() => toggleCategory(`rec-${cat.categorie}`)}
                            >
                              <CollapsibleTrigger className="w-full">
                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">{cat.source}</Badge>
                                    <span className="font-medium">{cat.categorie}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`font-bold ${getTauxColor(taux)}`}>{Math.round(taux)}%</span>
                                    {expandedCategories.includes(`rec-${cat.categorie}`) ? 
                                      <ChevronUp className="h-4 w-4" /> : 
                                      <ChevronDown className="h-4 w-4" />
                                    }
                                  </div>
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="p-3 bg-muted/20 rounded-b-lg space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Prévu:</span>
                                    <span>{formatMontantFull(cat.prevu)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Réalisé:</span>
                                    <span className="text-success font-medium">{formatMontantFull(cat.realise)}</span>
                                  </div>
                                  <Progress value={Math.min(100, taux)} className="h-2" />
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      {(!stats?.par_categorie || stats.par_categorie.filter(c => c.type === 'recette').length === 0) && (
                        <p className="text-center text-muted-foreground py-4">Aucune prévision de recette</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Par catégorie - Dépenses */}
                <Card className="border-t-4 border-t-destructive">
                  <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                      <TrendingDown className="h-5 w-5" />
                      Dépenses par catégorie
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats?.par_categorie
                        ?.filter(c => c.type === 'depense')
                        .map((cat, i) => {
                          const taux = cat.prevu > 0 ? (cat.realise / cat.prevu) * 100 : 0;
                          return (
                            <Collapsible 
                              key={i} 
                              open={expandedCategories.includes(`dep-${cat.categorie}`)}
                              onOpenChange={() => toggleCategory(`dep-${cat.categorie}`)}
                            >
                              <CollapsibleTrigger className="w-full">
                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">{cat.source}</Badge>
                                    <span className="font-medium">{cat.categorie}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`font-bold ${taux > 100 ? 'text-destructive' : getTauxColor(taux)}`}>
                                      {Math.round(taux)}%
                                    </span>
                                    {expandedCategories.includes(`dep-${cat.categorie}`) ? 
                                      <ChevronUp className="h-4 w-4" /> : 
                                      <ChevronDown className="h-4 w-4" />
                                    }
                                  </div>
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="p-3 bg-muted/20 rounded-b-lg space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Prévu:</span>
                                    <span>{formatMontantFull(cat.prevu)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Réalisé:</span>
                                    <span className="text-destructive font-medium">{formatMontantFull(cat.realise)}</span>
                                  </div>
                                  <Progress value={Math.min(100, taux)} className="h-2" />
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      {(!stats?.par_categorie || stats.par_categorie.filter(c => c.type === 'depense').length === 0) && (
                        <p className="text-center text-muted-foreground py-4">Aucune prévision de dépense</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Onglet Liste */}
            <TabsContent value="liste" className="space-y-4">
              {previsions.length === 0 ? (
                <DocumentEmptyState
                  icon={Target}
                  title="Aucune prévision"
                  description={`Aucune prévision budgétaire pour l'année ${annee}. Créez votre première prévision pour commencer le suivi.`}
                  actionLabel="Nouvelle prévision"
                  onAction={() => setShowNouvelleModal(true)}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Liste des prévisions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Période</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Catégorie</TableHead>
                          <TableHead className="text-right">Prévu</TableHead>
                          <TableHead className="text-right">Réalisé</TableHead>
                          <TableHead className="text-center">Taux</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previsions.map((prev, index) => (
                          <motion.tr
                            key={prev.id}
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: index * 0.03 }}
                            className="border-b"
                          >
                            <TableCell className="font-medium">{prev.periode}</TableCell>
                            <TableCell>
                              {prev.type === 'recette' ? (
                                <Badge className="bg-success/20 text-success border-success/30">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Recette
                                </Badge>
                              ) : (
                                <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                  Dépense
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {prev.source === 'caisse' ? (
                                <span className="flex items-center gap-1">
                                  <Wallet className="h-3 w-3 text-warning" />
                                  Caisse
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3 text-primary" />
                                  Banque
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{prev.categorie}</TableCell>
                            <TableCell className="text-right">{formatMontant(prev.montant_prevu)}</TableCell>
                            <TableCell className="text-right font-medium">{formatMontant(prev.montant_realise)}</TableCell>
                            <TableCell className="text-center">
                              <span className={`font-bold ${getTauxColor(prev.taux_realisation)}`}>
                                {prev.taux_realisation}%
                              </span>
                            </TableCell>
                            <TableCell>{getStatutBadge(prev.statut)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(prev.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>

      <NouvellePrevisionModal open={showNouvelleModal} onOpenChange={setShowNouvelleModal} />
    </MainLayout>
  );
}
