import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, CreditCard, RefreshCw, Building2, TrendingUp, History, BarChart3 } from "lucide-react";
import { DocumentEmptyState } from "@/components/shared/documents/DocumentEmptyState";
import { DocumentLoadingState } from "@/components/shared/documents/DocumentLoadingState";
import { useCreditsData } from "./credits/useCreditsData";
import { CreditsStatsCards } from "./credits/CreditsStatsCards";
import { CreditsDashboardTab, CreditsComparaisonTab, CreditsBanqueTab, CreditsEcheancierTab, CreditsListeTab } from "./credits/CreditsTabs";
import { CreditsModals } from "./credits/CreditsModals";
import { containerVariants, itemVariants } from "./credits/constants";

export default function CreditsPage() {
  const d = useCreditsData();

  if (d.isLoading) return <MainLayout title="Crédits Bancaires"><DocumentLoadingState message="Chargement des crédits bancaires..." /></MainLayout>;

  if (d.credits.length === 0 && !d.loadingCredits) {
    return (
      <MainLayout title="Crédits Bancaires">
        <DocumentEmptyState icon={CreditCard} title="Aucun crédit bancaire" description="Gérez vos emprunts bancaires, échéances et remboursements en toute simplicité." actionLabel="Nouveau crédit" onAction={() => d.setShowNouveauModal(true)} />
        <CreditsModals {...modalProps(d)} />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Crédits Bancaires">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Crédits Bancaires</h1>
            <p className="text-muted-foreground mt-1">Suivi des emprunts et remboursements</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={d.selectedAnnee.toString()} onValueChange={(v) => d.setSelectedAnnee(parseInt(v))}>
              <SelectTrigger className="w-28"><Calendar className="h-4 w-4 mr-2 text-muted-foreground" /><SelectValue /></SelectTrigger>
              <SelectContent>{[d.currentYear - 2, d.currentYear - 1, d.currentYear, d.currentYear + 1].map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={d.filterStatut} onValueChange={d.setFilterStatut}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="actif">Actifs</SelectItem>
                <SelectItem value="soldé">Soldés</SelectItem>
                <SelectItem value="en défaut">En défaut</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => d.refetch()} title="Actualiser"><RefreshCw className="h-4 w-4" /></Button>
            <Button onClick={() => d.setShowNouveauModal(true)} className="gap-2"><Plus className="h-4 w-4" />Nouveau crédit</Button>
          </div>
        </motion.div>

        <CreditsStatsCards stats={d.stats} loadingStats={d.loadingStats} />

        <motion.div variants={itemVariants}>
          <Tabs defaultValue="dashboard" className="space-y-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="dashboard" className="gap-2"><BarChart3 className="h-4 w-4" />Tableau de bord</TabsTrigger>
              <TabsTrigger value="comparaison" className="gap-2"><TrendingUp className="h-4 w-4" />Comparaison</TabsTrigger>
              <TabsTrigger value="details" className="gap-2"><Building2 className="h-4 w-4" />Par banque</TabsTrigger>
              <TabsTrigger value="echeances" className="gap-2"><Calendar className="h-4 w-4" />Échéancier</TabsTrigger>
              <TabsTrigger value="liste" className="gap-2"><History className="h-4 w-4" />Liste complète</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard"><CreditsDashboardTab stats={d.stats} dashboard={d.dashboard} evolutionChartData={d.evolutionChartData} pieData={d.pieData} selectedAnnee={d.selectedAnnee} navigate={d.navigate} /></TabsContent>
            <TabsContent value="comparaison"><CreditsComparaisonTab comparaison={d.comparaison} comparaisonChartData={d.comparaisonChartData} selectedAnnee={d.selectedAnnee} /></TabsContent>
            <TabsContent value="details"><CreditsBanqueTab stats={d.stats} credits={d.credits} expandedBanques={d.expandedBanques} toggleBanque={d.toggleBanque} handleRemboursement={d.handleRemboursement} navigate={d.navigate} /></TabsContent>
            <TabsContent value="echeances"><CreditsEcheancierTab stats={d.stats} dashboard={d.dashboard} handlePayerEcheance={d.handlePayerEcheance} /></TabsContent>
            <TabsContent value="liste"><CreditsListeTab creditsFiltres={d.creditsFiltres} navigate={d.navigate} handleRemboursement={d.handleRemboursement} setCreditToAnnuler={d.setCreditToAnnuler} setCreditToSupprimer={d.setCreditToSupprimer} /></TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>

      <CreditsModals {...modalProps(d)} />
    </MainLayout>
  );
}

function modalProps(d: ReturnType<typeof useCreditsData>) {
  return {
    showNouveauModal: d.showNouveauModal, setShowNouveauModal: d.setShowNouveauModal,
    showRemboursementModal: d.showRemboursementModal, setShowRemboursementModal: d.setShowRemboursementModal,
    selectedCredit: d.selectedCredit, setSelectedCredit: d.setSelectedCredit,
    selectedEcheance: d.selectedEcheance, setSelectedEcheance: d.setSelectedEcheance,
    creditToAnnuler: d.creditToAnnuler, setCreditToAnnuler: d.setCreditToAnnuler,
    creditToSupprimer: d.creditToSupprimer, setCreditToSupprimer: d.setCreditToSupprimer,
    motifAnnulation: d.motifAnnulation, setMotifAnnulation: d.setMotifAnnulation,
    handleAnnuler: d.handleAnnuler, handleSupprimer: d.handleSupprimer,
    annulerPending: d.annulerMutation.isPending, supprimerPending: d.supprimerMutation.isPending,
  };
}
