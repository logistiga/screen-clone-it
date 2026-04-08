import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText, Download, TrendingUp, TrendingDown, Users, FileCheck,
  Receipt, Wallet, CreditCard, Calendar, BarChart3, AlertTriangle, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { ExportDataModal } from "@/components/reporting/ExportDataModal";
import {
  useTableauDeBord, useChiffreAffaires, useCreances, useRentabilite,
  useStatistiquesDocuments, useActiviteClients, useComparatif, useTresorerie,
} from "@/hooks/use-reporting";
import { DocumentStatCard, DocumentStatCardSkeleton } from "@/components/shared/documents/DocumentStatCard";
import { DocumentLoadingState } from "@/components/shared/documents/DocumentLoadingState";
import { DocumentEmptyState } from "@/components/shared/documents/DocumentEmptyState";
import { ChiffreAffairesTab, CreancesTab, RentabiliteTab, TresorerieTab, ComparatifTab } from "./reporting/ReportingCharts";
import { DocumentsTab } from "./reporting/ReportingDocumentsTab";

const formatMontant = (montant: number | null | undefined): string => {
  const value = Number(montant);
  if (isNaN(value) || montant === null || montant === undefined) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value)) + ' FCFA';
};

const moisLabels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function ReportingPage() {
  const [anneeSelectionnee, setAnneeSelectionnee] = useState(new Date().getFullYear());
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [dateDebutTresorerie, setDateDebutTresorerie] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0]; });
  const [dateFinTresorerie, setDateFinTresorerie] = useState(() => new Date().toISOString().split('T')[0]);

  const dateDebutAnnee = `${anneeSelectionnee}-01-01`;
  const dateFinAnnee = `${anneeSelectionnee}-12-31`;
  const anneesDisponibles = [2024, 2025, 2026];

  const { data: tableauDeBord, isLoading: loadingTableau, refetch: refetchTableau } = useTableauDeBord(anneeSelectionnee);
  const { data: chiffreAffaires, isLoading: loadingCA } = useChiffreAffaires(anneeSelectionnee);
  const { data: creances, isLoading: loadingCreances } = useCreances();
  const { data: rentabilite, isLoading: loadingRentabilite } = useRentabilite(anneeSelectionnee);
  const { data: statsDocuments, isLoading: loadingStats } = useStatistiquesDocuments(anneeSelectionnee);
  const { data: activiteClients, isLoading: loadingClients } = useActiviteClients(dateDebutAnnee, dateFinAnnee, 10);
  const { data: comparatif, isLoading: loadingComparatif } = useComparatif(anneeSelectionnee - 1, anneeSelectionnee);
  const { data: tresorerie, isLoading: loadingTresorerie } = useTresorerie(dateDebutTresorerie, dateFinTresorerie);

  const { data: clientsData } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => { const r = await api.get('/clients'); return r.data.data || []; },
    staleTime: 10 * 60 * 1000,
  });
  const clients = clientsData?.map((c: any) => ({ id: String(c.id), nom: c.nom })) || [];

  const evolutionMensuelle = useMemo(() => {
    if (!chiffreAffaires?.mensuel) return [];
    return chiffreAffaires.mensuel.map((m: any) => ({ mois: moisLabels[m.mois - 1] || m.label, ca: m.total_ttc, nbFactures: m.nb_factures }));
  }, [chiffreAffaires]);

  const dataCreancesParTranche = useMemo(() => {
    if (!creances?.par_tranche) return [];
    return creances.par_tranche.map((t: any) => ({ name: t.tranche, value: t.montant, nb: t.nb_factures }));
  }, [creances]);

  const rentabiliteMensuelle = useMemo(() => {
    if (!rentabilite?.mensuel) return [];
    return rentabilite.mensuel.map((m: any) => ({ mois: moisLabels[m.mois - 1] || m.label, ca: m.ca, charges: m.charges, marge: m.marge }));
  }, [rentabilite]);

  const tresorerieQuotidienne = useMemo(() => {
    if (!tresorerie?.mouvements_quotidiens) return [];
    return tresorerie.mouvements_quotidiens.map((m: any) => ({ date: new Date(m.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }), entrees: m.entrees, sorties: m.sorties, solde: m.solde }));
  }, [tresorerie]);

  const topDebiteurs = creances?.top_debiteurs || [];
  const topClientsActivite = (activiteClients?.top_clients || []).map((c: any) => ({ ...c, ca_total: Number(c.ca_total) || 0, nb_factures: Number(c.nb_factures) || 0, paiements: Number(c.paiements) || 0, solde_du: Number(c.solde_du) || 0, client_nom: c.client_nom || 'Client inconnu' }));

  if (loadingTableau && !tableauDeBord) return <MainLayout title="Reporting Commercial"><DocumentLoadingState message="Chargement des données de reporting..." /></MainLayout>;

  return (
    <MainLayout title="Reporting Commercial">
      <motion.div className="space-y-5" initial="hidden" animate="visible" variants={containerVariants}>
        <motion.div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" variants={itemVariants}>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Reporting Commercial</h1>
            <p className="text-sm text-muted-foreground">Vue d'ensemble — {anneeSelectionnee}</p>
          </div>
          <div className="flex gap-2 items-center">
            <Select value={String(anneeSelectionnee)} onValueChange={(v) => setAnneeSelectionnee(Number(v))}>
              <SelectTrigger className="w-[110px] h-9 text-sm"><Calendar className="h-3.5 w-3.5 mr-1.5" /><SelectValue placeholder="Année" /></SelectTrigger>
              <SelectContent>{anneesDisponibles.map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={() => { refetchTableau(); toast.success("Données actualisées"); }}><RefreshCw className="h-3.5 w-3.5" /></Button>
            <Button size="sm" className="h-9 gap-1.5" onClick={() => setExportModalOpen(true)}><Download className="h-3.5 w-3.5" />Exporter</Button>
          </div>
        </motion.div>

        {/* KPIs */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {loadingTableau ? [...Array(4)].map((_, i) => <DocumentStatCardSkeleton key={i} />) : (
            <>
              <DocumentStatCard title="CA Total" value={formatMontant(tableauDeBord?.kpis?.ca_total || 0)} icon={Receipt} variant="primary" delay={0} />
              <DocumentStatCard title="CA Mois Courant" value={formatMontant(tableauDeBord?.kpis?.ca_mois_courant || 0)} icon={Calendar} variant="info" delay={0.05} />
              <DocumentStatCard title="Créances" value={formatMontant(tableauDeBord?.kpis?.creances_totales || 0)} icon={TrendingDown} variant="danger" delay={0.1} />
              <DocumentStatCard title="Recouvrement" value={`${tableauDeBord?.kpis?.taux_recouvrement || 0}%`} icon={TrendingUp} variant="success" delay={0.15} />
            </>
          )}
        </div>
        <div className="grid gap-3 grid-cols-4">
          {loadingTableau ? [...Array(4)].map((_, i) => <DocumentStatCardSkeleton key={i} />) : (
            <>
              <DocumentStatCard title="Factures" value={tableauDeBord?.kpis?.nb_factures || 0} icon={FileCheck} variant="default" delay={0.2} compact />
              <DocumentStatCard title="Devis" value={tableauDeBord?.kpis?.nb_devis || 0} icon={FileText} variant="default" delay={0.25} compact />
              <DocumentStatCard title="Ordres" value={tableauDeBord?.kpis?.nb_ordres || 0} icon={BarChart3} variant="default" delay={0.3} compact />
              <DocumentStatCard title="Clients" value={tableauDeBord?.kpis?.nb_clients || 0} icon={Users} variant="default" delay={0.35} compact />
            </>
          )}
        </div>

        {/* Alertes */}
        {tableauDeBord?.alertes?.length > 0 && (
          <motion.div className="flex flex-wrap gap-2" variants={itemVariants}>
            {tableauDeBord.alertes.map((alerte: any, i: number) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="font-medium text-amber-800 dark:text-amber-300">{alerte.message}</span>
                <Badge variant="secondary" className="text-[10px] bg-amber-200/50 dark:bg-amber-800/50 text-amber-700 dark:text-amber-300">{alerte.count}</Badge>
              </div>
            ))}
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="chiffre-affaires" className="space-y-4">
            <TabsList className="flex-wrap h-auto gap-0.5 bg-muted/40 p-0.5 rounded-lg border">
              <TabsTrigger value="chiffre-affaires" className="gap-1.5 text-xs data-[state=active]:shadow-sm"><Receipt className="h-3.5 w-3.5" />Chiffre d'Affaires</TabsTrigger>
              <TabsTrigger value="creances" className="gap-1.5 text-xs data-[state=active]:shadow-sm"><TrendingDown className="h-3.5 w-3.5" />Créances</TabsTrigger>
              <TabsTrigger value="rentabilite" className="gap-1.5 text-xs data-[state=active]:shadow-sm"><TrendingUp className="h-3.5 w-3.5" />Rentabilité</TabsTrigger>
              <TabsTrigger value="tresorerie" className="gap-1.5 text-xs data-[state=active]:shadow-sm"><Wallet className="h-3.5 w-3.5" />Trésorerie</TabsTrigger>
              <TabsTrigger value="documents" className="gap-1.5 text-xs data-[state=active]:shadow-sm"><FileText className="h-3.5 w-3.5" />Documents</TabsTrigger>
              <TabsTrigger value="clients" className="gap-1.5 text-xs data-[state=active]:shadow-sm"><Users className="h-3.5 w-3.5" />Clients</TabsTrigger>
              <TabsTrigger value="comparatif" className="gap-1.5 text-xs data-[state=active]:shadow-sm"><BarChart3 className="h-3.5 w-3.5" />Comparatif</TabsTrigger>
            </TabsList>

            <TabsContent value="chiffre-affaires" className="space-y-4">
              <ChiffreAffairesTab loadingCA={loadingCA} evolutionMensuelle={evolutionMensuelle} chiffreAffaires={chiffreAffaires} annee={anneeSelectionnee} />
            </TabsContent>
            <TabsContent value="creances" className="space-y-4">
              <CreancesTab loadingCreances={loadingCreances} dataCreancesParTranche={dataCreancesParTranche} topDebiteurs={topDebiteurs} creances={creances} />
            </TabsContent>
            <TabsContent value="rentabilite" className="space-y-4">
              <RentabiliteTab loading={loadingRentabilite} rentabilite={rentabilite} rentabiliteMensuelle={rentabiliteMensuelle} />
            </TabsContent>
            <TabsContent value="tresorerie" className="space-y-4">
              <TresorerieTab loading={loadingTresorerie} tresorerie={tresorerie} tresorerieQuotidienne={tresorerieQuotidienne} dateDebut={dateDebutTresorerie} dateFin={dateFinTresorerie} onDateDebutChange={setDateDebutTresorerie} onDateFinChange={setDateFinTresorerie} />
            </TabsContent>
            <TabsContent value="documents" className="space-y-4">
              <DocumentsTab loadingStats={loadingStats} statsDocuments={statsDocuments} />
            </TabsContent>
            <TabsContent value="clients" className="space-y-4">
              <Card className="rounded-xl border shadow-sm overflow-hidden">
                <CardHeader className="pb-2 border-b bg-muted/20">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-primary" />Top Clients par CA</CardTitle>
                  <CardDescription className="text-xs">Année {anneeSelectionnee}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingClients ? <div className="p-6"><Skeleton className="h-[300px] w-full" /></div> : topClientsActivite.length === 0 ? (
                    <div className="py-12"><DocumentEmptyState icon={Users} title="Aucun client actif" description="Aucune activité client enregistrée" /></div>
                  ) : (
                    <Table>
                      <TableHeader><TableRow className="bg-muted/50"><TableHead>#</TableHead><TableHead>Client</TableHead><TableHead className="text-right">CA Total</TableHead><TableHead className="text-center">Factures</TableHead><TableHead className="text-right">Paiements</TableHead><TableHead className="text-right">Solde dû</TableHead></TableRow></TableHeader>
                      <TableBody>{topClientsActivite.map((c: any, i: number) => (
                        <TableRow key={i} className="hover:bg-muted/50">
                          <TableCell><Badge variant="outline" className={i < 3 ? "bg-primary/10 text-primary" : ""}>{i + 1}</Badge></TableCell>
                          <TableCell className="font-medium">{c.client_nom}</TableCell>
                          <TableCell className="text-right font-semibold">{formatMontant(c.ca_total)}</TableCell>
                          <TableCell className="text-center"><Badge variant="secondary">{c.nb_factures}</Badge></TableCell>
                          <TableCell className="text-right text-emerald-600 dark:text-emerald-400">{formatMontant(c.paiements)}</TableCell>
                          <TableCell className={`text-right ${c.solde_du > 0 ? 'text-red-600 dark:text-red-400 font-semibold' : ''}`}>{formatMontant(c.solde_du)}</TableCell>
                        </TableRow>
                      ))}</TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="comparatif" className="space-y-4">
              <ComparatifTab loading={loadingComparatif} comparatif={comparatif} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
      <ExportDataModal open={exportModalOpen} onOpenChange={setExportModalOpen} clients={clients} />
    </MainLayout>
  );
}
