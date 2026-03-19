import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Target, TrendingUp, TrendingDown, Wallet, Building2,
  BarChart3, RefreshCw, AlertTriangle, FileDown, Loader2,
  ChevronLeft, ChevronRight, Calendar, AlertOctagon, Info
} from "lucide-react";
import { toast } from "sonner";
import { exportPrevisionsPDF } from "@/utils/export-previsions-pdf";
import { NouvellePrevisionModal } from "@/components/NouvellePrevisionModal";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  usePrevisions, useStatsMensuelles, useHistoriquePrevisions,
  useDeletePrevision, useSyncPrevisionRealise,
} from "@/hooks/use-previsions";
import { DocumentStatCard, DocumentStatCardSkeleton } from "@/components/shared/documents/DocumentStatCard";
import { SuiviDepensesTab } from "@/components/previsions/SuiviDepensesTab";
import { SuiviRecettesTab } from "@/components/previsions/SuiviRecettesTab";
import { HistoriqueTab } from "@/components/previsions/HistoriqueTab";
import { PrevisionsListeTab } from "@/components/previsions/PrevisionsListeTab";
import { BudgetHealthGauge } from "@/components/previsions/BudgetHealthGauge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const moisNoms = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const formatMontant = (montant: number) => {
  if (montant >= 1000000) return (montant / 1000000).toFixed(1) + 'M';
  if (montant >= 1000) return (montant / 1000).toFixed(0) + 'K';
  return montant.toLocaleString('fr-FR');
};

const formatMontantFull = (montant: number) => montant.toLocaleString('fr-FR') + ' FCFA';

export default function PrevisionsPage() {
  const currentDate = new Date();
  const [annee, setAnnee] = useState(currentDate.getFullYear());
  const [mois, setMois] = useState(currentDate.getMonth() + 1);
  const [showNouvelleModal, setShowNouvelleModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [hasAutoSelectedLatestPeriod, setHasAutoSelectedLatestPeriod] = useState(false);

  const { data: stats, isLoading: loadingStats, error: statsError } = useStatsMensuelles(annee, mois);
  const { data: historique } = useHistoriquePrevisions(annee);
  const { data: previsionsData, error: previsionsError } = usePrevisions({ annee, mois, per_page: 100 });
  const { data: latestPrevisionsData } = usePrevisions({ per_page: 1 });
  const deleteMutation = useDeletePrevision();
  const syncMutation = useSyncPrevisionRealise();

  const previsions = previsionsData?.data || [];
  const latestPrevision = latestPrevisionsData?.data?.[0];
  const hasDataForSelectedPeriod = (stats?.nb_previsions || 0) > 0 || previsions.length > 0;

  useEffect(() => {
    if (hasAutoSelectedLatestPeriod || loadingStats || !latestPrevision) return;
    const latestPeriodIsDifferent = latestPrevision.annee !== annee || latestPrevision.mois !== mois;
    if (!hasDataForSelectedPeriod && latestPeriodIsDifferent) {
      setAnnee(latestPrevision.annee);
      setMois(latestPrevision.mois);
    }
    setHasAutoSelectedLatestPeriod(true);
  }, [annee, mois, hasAutoSelectedLatestPeriod, hasDataForSelectedPeriod, latestPrevision, loadingStats]);

  if (statsError) console.error('[Previsions] Stats error:', statsError);
  if (previsionsError) console.error('[Previsions] Previsions error:', previsionsError);

  const handleSync = async () => { await syncMutation.mutateAsync({ annee, mois }); };
  const handleDelete = async (id: number) => {
    if (confirm('Supprimer cette prévision ?')) await deleteMutation.mutateAsync(id);
  };

  const handleExportPDF = async () => {
    if (!stats) { toast.error('Aucune donnée à exporter'); return; }
    setExporting(true);
    try {
      await exportPrevisionsPDF(stats);
      toast.success(`PDF exporté: Prévisions ${moisNoms[mois - 1]} ${annee}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Erreur lors de l'export PDF");
    } finally { setExporting(false); }
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

  if (loadingStats) {
    return (
      <MainLayout title="Prévisions budgétaires">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => <DocumentStatCardSkeleton key={i} />)}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (statsError) {
    return (
      <MainLayout title="Prévisions budgétaires">
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Erreur lors du chargement: {(statsError as any)?.response?.data?.message || (statsError as any)?.message || 'Erreur inconnue'}
            </AlertDescription>
          </Alert>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />Réessayer
          </Button>
        </div>
      </MainLayout>
    );
  }

  const synthese = stats?.synthese;
  const nbDepenses = stats?.details?.depenses?.length || 0;
  const nbRecettes = stats?.details?.recettes?.length || 0;

  // Global health score: balanced between expenses staying low and revenue being high
  const depenseTaux = synthese?.depenses.taux || 0;
  const recetteTaux = synthese?.recettes.taux || 0;
  const santeGlobale = Math.max(0, Math.min(100, Math.round(
    (Math.min(100, recetteTaux) + Math.max(0, 200 - depenseTaux)) / 2
  )));

  return (
    <MainLayout title="Prévisions budgétaires">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">

        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Prévisions budgétaires
              </h1>
              <p className="text-sm text-muted-foreground">Vue mensuelle consolidée (Caisse + Banque)</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting || !stats}>
                {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleSync} disabled={syncMutation.isPending}>
                <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                Sync
              </Button>
              <Button size="sm" onClick={() => setShowNouvelleModal(true)} className="shadow-md">
                <Plus className="h-4 w-4 mr-2" />Nouvelle
              </Button>
            </div>
          </div>

          {/* Navigation mois */}
          <div className="flex items-center gap-4 bg-muted/50 rounded-xl p-3">
            <Button variant="ghost" size="icon" onClick={() => navigateMois(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 flex-1 justify-center">
              <Calendar className="h-5 w-5 text-primary" />
              <Select value={mois.toString()} onValueChange={(v) => setMois(parseInt(v))}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {moisNoms.map((nom, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>{nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={annee.toString()} onValueChange={(v) => setAnnee(parseInt(v))}>
                <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
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

        {/* Alertes — Card style */}
        {(stats?.alertes?.length || !hasDataForSelectedPeriod) && (
          <motion.div variants={itemVariants} className="space-y-3">
            {!hasDataForSelectedPeriod && latestPrevision && (
              <Card className="border-orange-500/30 bg-orange-500/5">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="p-2 rounded-full bg-orange-500/10">
                    <Info className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Aucune donnée pour cette période</p>
                    <p className="text-xs text-muted-foreground">
                      Aucune prévision pour {moisNoms[mois - 1]} {annee}. Dernière période: {moisNoms[latestPrevision.mois - 1]} {latestPrevision.annee}.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {stats?.alertes?.map((alerte, i) => (
              <Card key={i} className={
                alerte.type === 'danger'
                  ? 'border-destructive/30 bg-destructive/5'
                  : 'border-orange-500/30 bg-orange-500/5'
              }>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className={`p-2 rounded-full ${alerte.type === 'danger' ? 'bg-destructive/10' : 'bg-orange-500/10'}`}>
                    {alerte.type === 'danger'
                      ? <AlertOctagon className="h-5 w-5 text-destructive" />
                      : <AlertTriangle className="h-5 w-5 text-orange-500" />
                    }
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {alerte.type === 'danger' ? 'Alerte budget' : 'Attention'}
                    </p>
                    <p className="text-xs text-muted-foreground">{alerte.message}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* KPIs + Jauge santé globale */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <BudgetHealthGauge score={santeGlobale} label="Santé du mois" />

          <DocumentStatCard title="Recettes" value={formatMontant(synthese?.recettes.realise || 0)}
            icon={TrendingUp} subtitle={`Prévu: ${formatMontant(synthese?.recettes.prevu || 0)} — ${synthese?.recettes.taux || 0}%`}
            variant="success" delay={0} />
          <DocumentStatCard title="Dépenses" value={formatMontant(synthese?.depenses.realise || 0)}
            icon={TrendingDown} subtitle={`Prévu: ${formatMontant(synthese?.depenses.prevu || 0)} — ${synthese?.depenses.taux || 0}%`}
            variant="danger" delay={0.1} />
          <DocumentStatCard title={synthese?.situation === 'beneficiaire' ? 'Bénéfice' : 'Déficit'}
            value={formatMontant(Math.abs(synthese?.benefice || 0))} icon={Target}
            subtitle={synthese?.dans_budget ? '✓ Dans le budget' : '⚠ Budget dépassé'}
            variant={synthese?.benefice && synthese.benefice >= 0 ? "primary" : "danger"} delay={0.2} />
          <DocumentStatCard title="Prévisions" value={`${stats?.nb_previsions || 0}`}
            icon={BarChart3} subtitle={`${moisNoms[mois - 1]} ${annee}`} variant="info" delay={0.3} />
        </motion.div>

        {/* Caisse vs Banque */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-5 w-5 text-orange-500" />Caisse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-500/10 rounded-lg">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Entrées</p>
                  <p className="text-xl font-extrabold text-emerald-600">{formatMontant(synthese?.recettes.caisse || 0)}</p>
                </div>
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Sorties</p>
                  <p className="text-xl font-extrabold text-destructive">{formatMontant(synthese?.depenses.caisse || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-5 w-5 text-primary" />Banque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-500/10 rounded-lg">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Entrées</p>
                  <p className="text-xl font-extrabold text-emerald-600">{formatMontant(synthese?.recettes.banque || 0)}</p>
                </div>
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Sorties</p>
                  <p className="text-xl font-extrabold text-destructive">{formatMontant(synthese?.depenses.banque || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Onglets — pill style */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="depenses" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 h-12 p-1 bg-muted/70 rounded-xl">
              <TabsTrigger value="depenses" className="gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-destructive font-semibold transition-all">
                <TrendingDown className="h-4 w-4" />
                Dépenses ({nbDepenses})
              </TabsTrigger>
              <TabsTrigger value="recettes" className="gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-emerald-600 font-semibold transition-all">
                <TrendingUp className="h-4 w-4" />
                Recettes ({nbRecettes})
              </TabsTrigger>
              <TabsTrigger value="historique" className="gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary font-semibold transition-all">
                <BarChart3 className="h-4 w-4" />
                Historique
              </TabsTrigger>
              <TabsTrigger value="liste" className="gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary font-semibold transition-all">
                <Calendar className="h-4 w-4" />
                Liste ({previsions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="depenses">
              <SuiviDepensesTab depenses={stats?.details?.depenses || []} formatMontant={formatMontant} />
            </TabsContent>

            <TabsContent value="recettes">
              <SuiviRecettesTab recettes={stats?.details?.recettes || []} formatMontant={formatMontant} />
            </TabsContent>

            <TabsContent value="historique">
              <HistoriqueTab historique={historique} annee={annee} mois={mois} formatMontant={formatMontant} formatMontantFull={formatMontantFull} />
            </TabsContent>

            <TabsContent value="liste">
              <PrevisionsListeTab previsions={previsions} moisNom={moisNoms[mois - 1]} annee={annee}
                onDelete={handleDelete} onAdd={() => setShowNouvelleModal(true)} formatMontantFull={formatMontantFull} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>

      <NouvellePrevisionModal open={showNouvelleModal} onOpenChange={setShowNouvelleModal} defaultMois={mois} defaultAnnee={annee} />
    </MainLayout>
  );
}
