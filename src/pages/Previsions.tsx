import { useState } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus, Target, TrendingUp, TrendingDown, Wallet, Building2, 
  BarChart3, RefreshCw, Trash2, CheckCircle2, 
  XCircle, AlertTriangle, Clock, FileDown, Loader2,
  ChevronLeft, ChevronRight, Calendar
} from "lucide-react";
import { toast } from "sonner";
import { exportPrevisionsPDF } from "@/utils/export-previsions-pdf";
import { NouvellePrevisionModal } from "@/components/NouvellePrevisionModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePrevisions,
  useStatsMensuelles,
  useHistoriquePrevisions,
  useDeletePrevision,
  useSyncPrevisionRealise,
} from "@/hooks/use-previsions";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DocumentStatCard, DocumentStatCardSkeleton } from "@/components/shared/documents/DocumentStatCard";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const moisNoms = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function PrevisionsPage() {
  const currentDate = new Date();
  const [annee, setAnnee] = useState(currentDate.getFullYear());
  const [mois, setMois] = useState(currentDate.getMonth() + 1);
  const [showNouvelleModal, setShowNouvelleModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Données
  const { data: stats, isLoading: loadingStats } = useStatsMensuelles(annee, mois);
  const { data: historique, isLoading: loadingHistorique } = useHistoriquePrevisions(annee);
  const { data: previsionsData } = usePrevisions({ annee, mois, per_page: 100 });
  const deleteMutation = useDeletePrevision();
  const syncMutation = useSyncPrevisionRealise();

  const previsions = previsionsData?.data || [];

  const formatMontant = (montant: number) => {
    if (montant >= 1000000) return (montant / 1000000).toFixed(1) + 'M';
    if (montant >= 1000) return (montant / 1000).toFixed(0) + 'K';
    return montant.toLocaleString('fr-FR');
  };

  const formatMontantFull = (montant: number) => montant.toLocaleString('fr-FR') + ' FCFA';

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'en_cours': return <Badge variant="outline" className="border-primary text-primary"><Clock className="h-3 w-3 mr-1" />En cours</Badge>;
      case 'atteint': return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="h-3 w-3 mr-1" />Atteint</Badge>;
      case 'depasse': return <Badge className="bg-info text-info-foreground"><TrendingUp className="h-3 w-3 mr-1" />Dépassé</Badge>;
      case 'non_atteint': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Non atteint</Badge>;
      default: return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getTauxColor = (taux: number, isDepense = false) => {
    if (isDepense) {
      // Pour les dépenses, dépasser c'est mauvais
      if (taux > 100) return 'text-destructive';
      if (taux >= 80) return 'text-warning';
      return 'text-success';
    }
    // Pour les recettes
    if (taux >= 100) return 'text-success';
    if (taux >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const handleSync = async () => {
    await syncMutation.mutateAsync({ annee, mois });
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer cette prévision ?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleExportPDF = async () => {
    if (!stats) {
      toast.error('Aucune donnée à exporter');
      return;
    }
    setExporting(true);
    try {
      await exportPrevisionsPDF(stats);
      toast.success(`PDF exporté: Prévisions ${moisNoms[mois - 1]} ${annee}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export PDF');
    } finally {
      setExporting(false);
    }
  };

  const navigateMois = (direction: number) => {
    let newMois = mois + direction;
    let newAnnee = annee;
    if (newMois > 12) { newMois = 1; newAnnee++; }
    if (newMois < 1) { newMois = 12; newAnnee--; }
    setMois(newMois);
    setAnnee(newAnnee);
  };

  const anneeOptions = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  // Graphique historique
  const chartData = historique?.historique?.map(h => ({
    mois: h.mois_nom.substring(0, 3),
    recettes: h.recettes_realisees,
    depenses: h.depenses_realisees,
    benefice: h.benefice,
  })) || [];

  if (loadingStats) {
    return (
      <MainLayout title="Prévisions budgétaires">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <DocumentStatCardSkeleton key={i} />)}
          </div>
        </div>
      </MainLayout>
    );
  }

  const synthese = stats?.synthese;

  return (
    <MainLayout title="Prévisions budgétaires">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        
        {/* Header avec navigation mois */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Prévisions budgétaires
              </h1>
              <p className="text-muted-foreground">Vue mensuelle consolidée (Caisse + Banque)</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleExportPDF} 
                disabled={exporting || !stats}
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4 mr-2" />
                )}
                Exporter PDF
              </Button>
              <Button variant="outline" onClick={handleSync} disabled={syncMutation.isPending}>
                <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                Synchroniser
              </Button>
              <Button onClick={() => setShowNouvelleModal(true)} className="shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle prévision
              </Button>
            </div>
          </div>

          {/* Navigation mois */}
          <div className="flex items-center gap-4 bg-muted/50 rounded-lg p-3">
            <Button variant="ghost" size="icon" onClick={() => navigateMois(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 flex-1 justify-center">
              <Calendar className="h-5 w-5 text-primary" />
              <Select value={mois.toString()} onValueChange={(v) => setMois(parseInt(v))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {moisNoms.map((nom, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>{nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={annee.toString()} onValueChange={(v) => setAnnee(parseInt(v))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anneeOptions.map(a => (
                    <SelectItem key={a} value={a.toString()}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigateMois(1)}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>

        {/* Alertes */}
        {stats?.alertes && stats.alertes.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-2">
            {stats.alertes.map((alerte, i) => (
              <Alert key={i} variant={alerte.type === 'danger' ? 'destructive' : 'default'} 
                className={alerte.type === 'warning' ? 'border-warning bg-warning/10' : ''}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{alerte.message}</AlertDescription>
              </Alert>
            ))}
          </motion.div>
        )}

        {/* KPIs principaux */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DocumentStatCard
            title="Recettes du mois"
            value={formatMontant(synthese?.recettes.realise || 0)}
            icon={TrendingUp}
            subtitle={`Prévu: ${formatMontant(synthese?.recettes.prevu || 0)} (${synthese?.recettes.taux || 0}%)`}
            variant="success"
            delay={0}
          />
          <DocumentStatCard
            title="Dépenses du mois"
            value={formatMontant(synthese?.depenses.realise || 0)}
            icon={TrendingDown}
            subtitle={`Prévu: ${formatMontant(synthese?.depenses.prevu || 0)} (${synthese?.depenses.taux || 0}%)`}
            variant="danger"
            delay={0.1}
          />
          <DocumentStatCard
            title={synthese?.situation === 'beneficiaire' ? 'Bénéfice' : 'Déficit'}
            value={formatMontant(Math.abs(synthese?.benefice || 0))}
            icon={Target}
            subtitle={synthese?.dans_budget ? '✓ Dans le budget' : '⚠ Budget dépassé'}
            variant={synthese?.benefice && synthese.benefice >= 0 ? "primary" : "danger"}
            delay={0.2}
          />
          <DocumentStatCard
            title="Prévisions"
            value={`${stats?.nb_previsions || 0}`}
            icon={BarChart3}
            subtitle={`${moisNoms[mois - 1]} ${annee}`}
            variant="info"
            delay={0.3}
          />
        </motion.div>

        {/* Détails Caisse vs Banque */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-warning">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="h-5 w-5 text-warning" />
                Mouvements Caisse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Entrées</p>
                  <p className="text-xl font-bold text-success">{formatMontant(synthese?.recettes.caisse || 0)}</p>
                </div>
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Sorties</p>
                  <p className="text-xl font-bold text-destructive">{formatMontant(synthese?.depenses.caisse || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Mouvements Banque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Entrées</p>
                  <p className="text-xl font-bold text-success">{formatMontant(synthese?.recettes.banque || 0)}</p>
                </div>
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Sorties</p>
                  <p className="text-xl font-bold text-destructive">{formatMontant(synthese?.depenses.banque || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Onglets */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="progression" className="space-y-4">
            <TabsList>
              <TabsTrigger value="progression">Progression</TabsTrigger>
              <TabsTrigger value="historique">Historique {annee}</TabsTrigger>
              <TabsTrigger value="liste">Liste ({previsions.length})</TabsTrigger>
            </TabsList>

            {/* Onglet Progression */}
            <TabsContent value="progression" className="space-y-4">
              {/* Dépenses */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-destructive" />
                    Suivi des dépenses par catégorie
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats?.details?.depenses && stats.details.depenses.length > 0 ? (
                    stats.details.depenses.map((dep) => (
                      <div key={dep.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{dep.categorie}</span>
                            {getStatutBadge(dep.statut)}
                          </div>
                          <div className="text-right">
                            <span className={`font-bold ${getTauxColor(dep.taux, true)}`}>
                              {formatMontant(dep.montant_realise)}
                            </span>
                            <span className="text-muted-foreground"> / {formatMontant(dep.montant_prevu)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={Math.min(dep.taux, 100)} 
                            className={`flex-1 h-3 ${dep.taux > 100 ? '[&>div]:bg-destructive' : ''}`}
                          />
                          <span className={`text-sm font-medium w-16 text-right ${getTauxColor(dep.taux, true)}`}>
                            {dep.taux}%
                          </span>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Caisse: {formatMontant(dep.realise_caisse)}</span>
                          <span>Banque: {formatMontant(dep.realise_banque)}</span>
                          <span className={dep.ecart > 0 ? 'text-destructive' : 'text-success'}>
                            Écart: {dep.ecart > 0 ? '+' : ''}{formatMontant(dep.ecart)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Aucune prévision de dépense pour ce mois</p>
                  )}
                </CardContent>
              </Card>

              {/* Recettes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-success" />
                    Suivi des recettes par catégorie
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats?.details?.recettes && stats.details.recettes.length > 0 ? (
                    stats.details.recettes.map((rec) => (
                      <div key={rec.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{rec.categorie}</span>
                            {getStatutBadge(rec.statut)}
                          </div>
                          <div className="text-right">
                            <span className={`font-bold ${getTauxColor(rec.taux)}`}>
                              {formatMontant(rec.montant_realise)}
                            </span>
                            <span className="text-muted-foreground"> / {formatMontant(rec.montant_prevu)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={Math.min(rec.taux, 100)} className="flex-1 h-3" />
                          <span className={`text-sm font-medium w-16 text-right ${getTauxColor(rec.taux)}`}>
                            {rec.taux}%
                          </span>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Caisse: {formatMontant(rec.realise_caisse)}</span>
                          <span>Banque: {formatMontant(rec.realise_banque)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Aucune prévision de recette pour ce mois</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Historique */}
            <TabsContent value="historique" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Évolution mensuelle {annee}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="mois" />
                        <YAxis tickFormatter={(v) => formatMontant(v)} />
                        <Tooltip formatter={(value: number) => formatMontantFull(value)} />
                        <Legend />
                        <Bar dataKey="recettes" name="Recettes" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="depenses" name="Dépenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Tableau récapitulatif */}
              <Card>
                <CardHeader>
                  <CardTitle>Récapitulatif annuel</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mois</TableHead>
                        <TableHead className="text-right">Recettes</TableHead>
                        <TableHead className="text-right">Dépenses</TableHead>
                        <TableHead className="text-right">Bénéfice</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historique?.historique?.map((h) => (
                        <TableRow key={h.mois} className={h.mois === mois ? 'bg-primary/5' : ''}>
                          <TableCell className="font-medium">{h.mois_nom}</TableCell>
                          <TableCell className="text-right text-success">{formatMontant(h.recettes_realisees)}</TableCell>
                          <TableCell className="text-right text-destructive">{formatMontant(h.depenses_realisees)}</TableCell>
                          <TableCell className={`text-right font-bold ${h.benefice >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {h.benefice >= 0 ? '+' : ''}{formatMontant(h.benefice)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {historique?.totaux && (
                        <TableRow className="bg-muted font-bold">
                          <TableCell>TOTAL {annee}</TableCell>
                          <TableCell className="text-right text-success">{formatMontant(historique.totaux.recettes_realisees)}</TableCell>
                          <TableCell className="text-right text-destructive">{formatMontant(historique.totaux.depenses_realisees)}</TableCell>
                          <TableCell className={`text-right ${historique.totaux.benefice_total >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {historique.totaux.benefice_total >= 0 ? '+' : ''}{formatMontant(historique.totaux.benefice_total)}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Liste */}
            <TabsContent value="liste">
              <Card>
                <CardHeader>
                  <CardTitle>Prévisions de {moisNoms[mois - 1]} {annee}</CardTitle>
                </CardHeader>
                <CardContent>
                  {previsions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Aucune prévision pour ce mois.</p>
                      <Button variant="link" onClick={() => setShowNouvelleModal(true)}>
                        Ajouter une prévision
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Catégorie</TableHead>
                          <TableHead className="text-right">Prévu</TableHead>
                          <TableHead className="text-right">Réalisé</TableHead>
                          <TableHead className="text-right">Taux</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previsions.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>
                              {p.type === 'recette' ? (
                                <Badge className="bg-success/20 text-success border-0">Recette</Badge>
                              ) : (
                                <Badge className="bg-destructive/20 text-destructive border-0">Dépense</Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{p.categorie}</TableCell>
                            <TableCell className="text-right">{formatMontantFull(p.montant_prevu)}</TableCell>
                            <TableCell className="text-right">{formatMontantFull(p.montant_realise)}</TableCell>
                            <TableCell className={`text-right font-bold ${getTauxColor(p.taux_realisation, p.type === 'depense')}`}>
                              {p.taux_realisation}%
                            </TableCell>
                            <TableCell>{getStatutBadge(p.statut)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>

      <NouvellePrevisionModal
        open={showNouvelleModal}
        onOpenChange={setShowNouvelleModal}
        defaultMois={mois}
        defaultAnnee={annee}
      />
    </MainLayout>
  );
}
