import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend 
} from "recharts";
import { 
  FileText, Download, TrendingUp, TrendingDown, Users, FileCheck, 
  Receipt, Wallet, CreditCard, Building2, Calendar, BarChart3,
  AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw, PieChart as PieChartIcon
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { ExportDataModal } from "@/components/reporting/ExportDataModal";
import { 
  useTableauDeBord, 
  useChiffreAffaires, 
  useCreances, 
  useRentabilite,
  useStatistiquesDocuments,
  useActiviteClients,
  useComparatif,
  useTresorerie
} from "@/hooks/use-reporting";
import { DocumentStatCard, DocumentStatCardSkeleton } from "@/components/shared/documents/DocumentStatCard";
import { DocumentLoadingState } from "@/components/shared/documents/DocumentLoadingState";
import { DocumentEmptyState } from "@/components/shared/documents/DocumentEmptyState";

const COLORS = ["#E63946", "#4A4A4A", "#F4A261", "#2A9D8F", "#264653", "#8338EC", "#FF006E"];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const formatMontant = (montant: number | null | undefined): string => {
  const value = Number(montant);
  if (isNaN(value) || montant === null || montant === undefined) {
    return '0 FCFA';
  }
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value)) + ' FCFA';
};

const moisLabels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

export default function ReportingPage() {
  const [anneeSelectionnee, setAnneeSelectionnee] = useState(new Date().getFullYear());
  const [exportModalOpen, setExportModalOpen] = useState(false);
  
  // Dates pour trésorerie
  const [dateDebutTresorerie, setDateDebutTresorerie] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [dateFinTresorerie, setDateFinTresorerie] = useState(() => 
    new Date().toISOString().split('T')[0]
  );

  // Dates pour activité clients
  const dateDebutAnnee = `${anneeSelectionnee}-01-01`;
  const dateFinAnnee = `${anneeSelectionnee}-12-31`;

  // Années disponibles
  const anneesDisponibles = [2024, 2025, 2026];

  // ============ QUERIES API ============
  const { data: tableauDeBord, isLoading: loadingTableau, refetch: refetchTableau } = useTableauDeBord(anneeSelectionnee);
  const { data: chiffreAffaires, isLoading: loadingCA } = useChiffreAffaires(anneeSelectionnee);
  const { data: creances, isLoading: loadingCreances } = useCreances();
  const { data: rentabilite, isLoading: loadingRentabilite } = useRentabilite(anneeSelectionnee);
  const { data: statsDocuments, isLoading: loadingStats } = useStatistiquesDocuments(anneeSelectionnee);
  const { data: activiteClients, isLoading: loadingClients } = useActiviteClients(dateDebutAnnee, dateFinAnnee, 10);
  const { data: comparatif, isLoading: loadingComparatif } = useComparatif(anneeSelectionnee - 1, anneeSelectionnee);
  const { data: tresorerie, isLoading: loadingTresorerie } = useTresorerie(dateDebutTresorerie, dateFinTresorerie);

  // Fetch clients pour le modal d'export
  const { data: clientsData } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const response = await api.get('/clients');
      return response.data.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const clients = clientsData?.map((c: any) => ({ id: String(c.id), nom: c.nom })) || [];

  // ============ DONNÉES FORMATÉES ============
  const evolutionMensuelle = useMemo(() => {
    if (!chiffreAffaires?.mensuel) return [];
    return chiffreAffaires.mensuel.map((m: any) => ({
      mois: moisLabels[m.mois - 1] || m.label,
      ca: m.total_ttc,
      nbFactures: m.nb_factures,
    }));
  }, [chiffreAffaires]);

  const dataCreancesParTranche = useMemo(() => {
    if (!creances?.par_tranche) return [];
    return creances.par_tranche.map((t: any) => ({
      name: t.tranche,
      value: t.montant,
      nb: t.nb_factures,
    }));
  }, [creances]);

  const topDebiteurs = creances?.top_debiteurs || [];
  const topClientsActivite = (activiteClients?.top_clients || []).map((c: any) => ({
    ...c,
    ca_total: Number(c.ca_total) || 0,
    nb_factures: Number(c.nb_factures) || 0,
    paiements: Number(c.paiements) || 0,
    solde_du: Number(c.solde_du) || 0,
    client_nom: c.client_nom || 'Client inconnu',
  }));

  const rentabiliteMensuelle = useMemo(() => {
    if (!rentabilite?.mensuel) return [];
    return rentabilite.mensuel.map((m: any) => ({
      mois: moisLabels[m.mois - 1] || m.label,
      ca: m.ca,
      charges: m.charges,
      marge: m.marge,
    }));
  }, [rentabilite]);

  const tresorerieQuotidienne = useMemo(() => {
    if (!tresorerie?.mouvements_quotidiens) return [];
    return tresorerie.mouvements_quotidiens.map((m: any) => ({
      date: new Date(m.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      entrees: m.entrees,
      sorties: m.sorties,
      solde: m.solde,
    }));
  }, [tresorerie]);

  // ============ HANDLERS ============
  const handleRefresh = () => {
    refetchTableau();
    toast.success("Données actualisées");
  };

  // État de chargement global
  const isInitialLoading = loadingTableau && !tableauDeBord;

  if (isInitialLoading) {
    return (
      <MainLayout title="Reporting Commercial">
        <DocumentLoadingState message="Chargement des données de reporting..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Reporting Commercial">
      <motion.div 
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          variants={itemVariants}
        >
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10">
                <PieChartIcon className="h-6 w-6 text-primary" />
              </div>
              Reporting Commercial
            </h1>
            <p className="text-muted-foreground mt-1">Tableaux de bord et analyses</p>
          </div>
          <div className="flex gap-2 items-center">
            <Select 
              value={String(anneeSelectionnee)} 
              onValueChange={(v) => setAnneeSelectionnee(Number(v))}
            >
              <SelectTrigger className="w-[120px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {anneesDisponibles.map(a => (
                  <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setExportModalOpen(true)} className="gap-2">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          </div>
        </motion.div>

        {/* KPIs globaux */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
          {loadingTableau ? (
            <>
              {[...Array(8)].map((_, i) => <DocumentStatCardSkeleton key={i} />)}
            </>
          ) : (
            <>
              <DocumentStatCard
                title="CA Total"
                value={formatMontant(tableauDeBord?.kpis?.ca_total || 0)}
                icon={Receipt}
                variant="primary"
                delay={0}
              />
              <DocumentStatCard
                title="CA Mois"
                value={formatMontant(tableauDeBord?.kpis?.ca_mois_courant || 0)}
                icon={Calendar}
                variant="info"
                delay={0.05}
              />
              <DocumentStatCard
                title="Créances"
                value={formatMontant(tableauDeBord?.kpis?.creances_totales || 0)}
                icon={TrendingDown}
                variant="danger"
                delay={0.1}
              />
              <DocumentStatCard
                title="Recouvrement"
                value={`${tableauDeBord?.kpis?.taux_recouvrement || 0}%`}
                icon={TrendingUp}
                variant="success"
                delay={0.15}
              />
              <DocumentStatCard
                title="Factures"
                value={tableauDeBord?.kpis?.nb_factures || 0}
                icon={FileCheck}
                variant="default"
                delay={0.2}
              />
              <DocumentStatCard
                title="Devis"
                value={tableauDeBord?.kpis?.nb_devis || 0}
                icon={FileText}
                variant="default"
                delay={0.25}
              />
              <DocumentStatCard
                title="Ordres"
                value={tableauDeBord?.kpis?.nb_ordres || 0}
                icon={BarChart3}
                variant="default"
                delay={0.3}
              />
              <DocumentStatCard
                title="Clients"
                value={tableauDeBord?.kpis?.nb_clients || 0}
                icon={Users}
                variant="default"
                delay={0.35}
              />
            </>
          )}
        </div>

        {/* Alertes */}
        {tableauDeBord?.alertes && tableauDeBord.alertes.length > 0 && (
          <motion.div 
            className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"
            variants={itemVariants}
          >
            {tableauDeBord.alertes.map((alerte: any, index: number) => (
              <Card key={index} className="border-amber-500/50 bg-amber-500/5 border-l-4 border-l-amber-500">
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{alerte.message}</p>
                    <p className="text-xs text-muted-foreground">{alerte.count} élément(s)</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="chiffre-affaires" className="space-y-4">
            <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
              <TabsTrigger value="chiffre-affaires" className="gap-1">
                <Receipt className="h-4 w-4" />
                Chiffre d'Affaires
              </TabsTrigger>
              <TabsTrigger value="creances" className="gap-1">
                <TrendingDown className="h-4 w-4" />
                Créances
              </TabsTrigger>
              <TabsTrigger value="rentabilite" className="gap-1">
                <TrendingUp className="h-4 w-4" />
                Rentabilité
              </TabsTrigger>
              <TabsTrigger value="tresorerie" className="gap-1">
                <Wallet className="h-4 w-4" />
                Trésorerie
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-1">
                <FileText className="h-4 w-4" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="clients" className="gap-1">
                <Users className="h-4 w-4" />
                Clients
              </TabsTrigger>
              <TabsTrigger value="comparatif" className="gap-1">
                <BarChart3 className="h-4 w-4" />
                Comparatif
              </TabsTrigger>
            </TabsList>

            {/* Chiffre d'Affaires */}
            <TabsContent value="chiffre-affaires" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2 border-0 shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-primary" />
                      Évolution mensuelle du CA
                    </CardTitle>
                    <CardDescription>Chiffre d'affaires TTC par mois en {anneeSelectionnee}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {loadingCA ? (
                      <Skeleton className="h-[300px] w-full" />
                    ) : evolutionMensuelle.length === 0 ? (
                      <div className="h-[300px] flex items-center justify-center">
                        <DocumentEmptyState 
                          icon={Receipt}
                          title="Aucune donnée"
                          description="Pas de données de chiffre d'affaires pour cette année"
                        />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={evolutionMensuelle}>
                          <defs>
                            <linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="mois" className="text-xs" />
                          <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} className="text-xs" />
                          <Tooltip 
                            formatter={(value: number) => formatMontant(value)}
                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="ca" 
                            stroke="hsl(var(--primary))" 
                            fill="url(#colorCA)" 
                            name="CA TTC"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
                    <CardTitle>Récapitulatif Annuel</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    {loadingCA ? (
                      <Skeleton className="h-32 w-full" />
                    ) : (
                      <>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-muted-foreground">Total HT</span>
                          <span className="font-bold">{formatMontant(chiffreAffaires?.total_annuel?.total_ht || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-muted-foreground">TVA</span>
                          <span className="font-bold">{formatMontant(chiffreAffaires?.total_annuel?.total_tva || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-muted-foreground">CSS</span>
                          <span className="font-bold">{formatMontant(chiffreAffaires?.total_annuel?.total_css || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 bg-primary/10 rounded-lg px-3">
                          <span className="font-semibold">Total TTC</span>
                          <span className="font-bold text-primary">{formatMontant(chiffreAffaires?.total_annuel?.total_ttc || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 text-sm">
                          <span className="text-muted-foreground">Nombre de factures</span>
                          <Badge variant="secondary">{chiffreAffaires?.total_annuel?.nb_factures || 0}</Badge>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Créances */}
            <TabsContent value="creances" className="space-y-4">
              {/* Stats créances */}
              <div className="grid gap-4 sm:grid-cols-3">
                <DocumentStatCard
                  title="Total Créances"
                  value={formatMontant(creances?.total_creances || 0)}
                  icon={TrendingDown}
                  variant="danger"
                  delay={0}
                />
                <DocumentStatCard
                  title="Factures Impayées"
                  value={creances?.nb_factures_impayees || 0}
                  icon={FileCheck}
                  variant="warning"
                  delay={0.1}
                />
                <DocumentStatCard
                  title="Âge Moyen"
                  value={`${creances?.age_moyen || 0} jours`}
                  icon={Calendar}
                  variant="info"
                  delay={0.2}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-red-500/5 to-transparent border-b">
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5 text-red-500" />
                      Créances par ancienneté
                    </CardTitle>
                    <CardDescription>Répartition des impayés par tranche de jours</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {loadingCreances ? (
                      <Skeleton className="h-[300px] w-full" />
                    ) : dataCreancesParTranche.length === 0 ? (
                      <div className="h-[300px] flex items-center justify-center">
                        <DocumentEmptyState 
                          icon={TrendingDown}
                          title="Aucune créance"
                          description="Félicitations ! Vous n'avez pas de créances"
                        />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={dataCreancesParTranche}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {dataCreancesParTranche.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatMontant(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-red-500/5 to-transparent border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-red-500" />
                      Top 10 Débiteurs
                    </CardTitle>
                    <CardDescription>Clients avec le plus d'impayés</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loadingCreances ? (
                      <div className="p-6">
                        <Skeleton className="h-[300px] w-full" />
                      </div>
                    ) : topDebiteurs.length === 0 ? (
                      <div className="py-12">
                        <DocumentEmptyState 
                          icon={Users}
                          title="Aucun débiteur"
                          description="Tous vos clients sont à jour"
                        />
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Client</TableHead>
                            <TableHead className="text-right">Montant dû</TableHead>
                            <TableHead className="text-center">Factures</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topDebiteurs.slice(0, 10).map((client: any, i: number) => (
                            <TableRow key={i} className="hover:bg-muted/50">
                              <TableCell className="font-medium">{client.client_nom}</TableCell>
                              <TableCell className="text-right text-red-600 dark:text-red-400 font-semibold">
                                {formatMontant(client.montant_du)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline">{client.nb_factures}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Rentabilité */}
            <TabsContent value="rentabilite" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DocumentStatCard
                  title="Chiffre d'Affaires"
                  value={formatMontant(rentabilite?.chiffre_affaires || 0)}
                  icon={Receipt}
                  variant="primary"
                  delay={0}
                />
                <DocumentStatCard
                  title="Charges"
                  value={formatMontant((rentabilite?.charges_exploitation || 0) + (rentabilite?.charges_financieres || 0))}
                  icon={TrendingDown}
                  variant="warning"
                  delay={0.1}
                />
                <DocumentStatCard
                  title="Résultat Net"
                  value={formatMontant(rentabilite?.resultat_net || 0)}
                  icon={TrendingUp}
                  variant={(rentabilite?.resultat_net || 0) >= 0 ? "success" : "danger"}
                  delay={0.2}
                />
                <DocumentStatCard
                  title="Taux de Marge"
                  value={`${rentabilite?.taux_marge || 0}%`}
                  icon={BarChart3}
                  variant="info"
                  delay={0.3}
                />
              </div>

              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-500/5 to-transparent border-b">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    Évolution de la Rentabilité
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {loadingRentabilite ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : rentabiliteMensuelle.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <DocumentEmptyState 
                        icon={TrendingUp}
                        title="Aucune donnée"
                        description="Pas de données de rentabilité pour cette année"
                      />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={rentabiliteMensuelle}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="mois" className="text-xs" />
                        <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} className="text-xs" />
                        <Tooltip formatter={(value: number) => formatMontant(value)} />
                        <Legend />
                        <Bar dataKey="ca" name="CA" fill="hsl(var(--primary))" />
                        <Bar dataKey="charges" name="Charges" fill="#F4A261" />
                        <Bar dataKey="marge" name="Marge" fill="#2A9D8F" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trésorerie */}
            <TabsContent value="tresorerie" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DocumentStatCard
                  title="Solde Initial"
                  value={formatMontant(tresorerie?.solde_initial || 0)}
                  icon={Wallet}
                  variant="info"
                  delay={0}
                />
                <DocumentStatCard
                  title="Total Entrées"
                  value={formatMontant(tresorerie?.total_entrees || 0)}
                  icon={ArrowUpRight}
                  variant="success"
                  delay={0.1}
                />
                <DocumentStatCard
                  title="Total Sorties"
                  value={formatMontant(tresorerie?.total_sorties || 0)}
                  icon={ArrowDownRight}
                  variant="danger"
                  delay={0.2}
                />
                <DocumentStatCard
                  title="Solde Final"
                  value={formatMontant(tresorerie?.solde_final || 0)}
                  icon={CreditCard}
                  variant={(tresorerie?.solde_final || 0) >= 0 ? "primary" : "danger"}
                  delay={0.3}
                />
              </div>

              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500/5 to-transparent border-b">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-blue-500" />
                        Flux de Trésorerie
                      </CardTitle>
                      <CardDescription>Entrées et sorties de fonds</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Du</Label>
                        <Input 
                          type="date" 
                          value={dateDebutTresorerie} 
                          onChange={(e) => setDateDebutTresorerie(e.target.value)}
                          className="w-auto"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Au</Label>
                        <Input 
                          type="date" 
                          value={dateFinTresorerie} 
                          onChange={(e) => setDateFinTresorerie(e.target.value)}
                          className="w-auto"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {loadingTresorerie ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : tresorerieQuotidienne.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <DocumentEmptyState 
                        icon={Wallet}
                        title="Aucun mouvement"
                        description="Pas de mouvements de trésorerie sur cette période"
                      />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={tresorerieQuotidienne}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} className="text-xs" />
                        <Tooltip formatter={(value: number) => formatMontant(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="entrees" name="Entrées" stroke="#2A9D8F" strokeWidth={2} />
                        <Line type="monotone" dataKey="sorties" name="Sorties" stroke="#E63946" strokeWidth={2} />
                        <Line type="monotone" dataKey="solde" name="Solde" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                {/* Devis */}
                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-500/5 to-transparent border-b">
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Devis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-6">
                    {loadingStats ? (
                      <Skeleton className="h-32 w-full" />
                    ) : (
                      <>
                        <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                          <span className="font-medium">Total</span>
                          <Badge>{statsDocuments?.devis?.total || 0}</Badge>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                          <span className="text-muted-foreground">Brouillon</span>
                          <span>{statsDocuments?.devis?.brouillon || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                          <span className="text-muted-foreground">Envoyé</span>
                          <span>{statsDocuments?.devis?.envoye || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                          <span className="text-emerald-600 dark:text-emerald-400">Accepté</span>
                          <span className="font-semibold">{statsDocuments?.devis?.accepte || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                          <span className="text-red-600 dark:text-red-400">Refusé</span>
                          <span>{statsDocuments?.devis?.refuse || 0}</span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Taux de conversion</span>
                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              {statsDocuments?.devis?.taux_conversion || 0}%
                            </Badge>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Ordres */}
                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-amber-500/5 to-transparent border-b">
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-amber-500/20">
                        <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      Ordres de Travail
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-6">
                    {loadingStats ? (
                      <Skeleton className="h-32 w-full" />
                    ) : (
                      <>
                        <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                          <span className="font-medium">Total</span>
                          <Badge>{statsDocuments?.ordres?.total || 0}</Badge>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                          <span className="text-amber-600 dark:text-amber-400">En cours</span>
                          <span>{statsDocuments?.ordres?.en_cours || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                          <span className="text-emerald-600 dark:text-emerald-400">Terminé</span>
                          <span>{statsDocuments?.ordres?.termine || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                          <span className="text-primary">Facturé</span>
                          <span className="font-semibold">{statsDocuments?.ordres?.facture || 0}</span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Taux de facturation</span>
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              {statsDocuments?.ordres?.taux_facturation || 0}%
                            </Badge>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Factures */}
                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-emerald-500/5 to-transparent border-b">
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-500/20">
                        <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      Factures
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-6">
                    {loadingStats ? (
                      <Skeleton className="h-32 w-full" />
                    ) : (
                      <>
                        <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                          <span className="font-medium">Total</span>
                          <Badge>{statsDocuments?.factures?.total || 0}</Badge>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                          <span className="text-muted-foreground">Validée</span>
                          <span>{statsDocuments?.factures?.validee || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                          <span className="text-amber-600 dark:text-amber-400">Partiellement payée</span>
                          <span>{statsDocuments?.factures?.partiellement_payee || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                          <span className="text-emerald-600 dark:text-emerald-400">Payée</span>
                          <span className="font-semibold">{statsDocuments?.factures?.payee || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                          <span className="text-red-600 dark:text-red-400">Annulée</span>
                          <span>{statsDocuments?.factures?.annulee || 0}</span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Taux de recouvrement</span>
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              {statsDocuments?.factures?.taux_recouvrement || 0}%
                            </Badge>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Clients */}
            <TabsContent value="clients" className="space-y-4">
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Top Clients par Chiffre d'Affaires
                  </CardTitle>
                  <CardDescription>Année {anneeSelectionnee}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingClients ? (
                    <div className="p-6">
                      <Skeleton className="h-[300px] w-full" />
                    </div>
                  ) : topClientsActivite.length === 0 ? (
                    <div className="py-12">
                      <DocumentEmptyState 
                        icon={Users}
                        title="Aucun client actif"
                        description="Aucune activité client enregistrée pour cette année"
                      />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>#</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead className="text-right">CA Total</TableHead>
                          <TableHead className="text-center">Factures</TableHead>
                          <TableHead className="text-right">Paiements</TableHead>
                          <TableHead className="text-right">Solde dû</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topClientsActivite.map((client: any, i: number) => (
                          <TableRow key={i} className="hover:bg-muted/50">
                            <TableCell>
                              <Badge variant="outline" className={i < 3 ? "bg-primary/10 text-primary" : ""}>
                                {i + 1}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{client.client_nom}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatMontant(client.ca_total)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{client.nb_factures}</Badge>
                            </TableCell>
                            <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                              {formatMontant(client.paiements)}
                            </TableCell>
                            <TableCell className={`text-right ${client.solde_du > 0 ? 'text-red-600 dark:text-red-400 font-semibold' : ''}`}>
                              {formatMontant(client.solde_du)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Comparatif */}
            <TabsContent value="comparatif" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b pb-2">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Chiffre d'Affaires
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {loadingComparatif ? (
                      <Skeleton className="h-16 w-full" />
                    ) : (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold">{formatMontant(comparatif?.ca_annee2 || 0)}</span>
                          <Badge 
                            className={`gap-1 ${(comparatif?.variation_ca || 0) >= 0 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'}`}
                          >
                            {(comparatif?.variation_ca || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {comparatif?.variation_ca || 0}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          vs {formatMontant(comparatif?.ca_annee1 || 0)} en {comparatif?.annee1}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-500/5 to-transparent border-b pb-2">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                      <FileCheck className="h-4 w-4" />
                      Nombre de Factures
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {loadingComparatif ? (
                      <Skeleton className="h-16 w-full" />
                    ) : (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold">{comparatif?.nb_factures_annee2 || 0}</span>
                          <Badge 
                            className={`gap-1 ${(comparatif?.variation_factures || 0) >= 0 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'}`}
                          >
                            {(comparatif?.variation_factures || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {comparatif?.variation_factures || 0}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          vs {comparatif?.nb_factures_annee1 || 0} en {comparatif?.annee1}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-emerald-500/5 to-transparent border-b pb-2">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Clients Actifs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {loadingComparatif ? (
                      <Skeleton className="h-16 w-full" />
                    ) : (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold">{comparatif?.nb_clients_annee2 || 0}</span>
                          <Badge 
                            className={`gap-1 ${(comparatif?.variation_clients || 0) >= 0 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'}`}
                          >
                            {(comparatif?.variation_clients || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {comparatif?.variation_clients || 0}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          vs {comparatif?.nb_clients_annee1 || 0} en {comparatif?.annee1}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>

      {/* Modal d'export */}
      <ExportDataModal 
        open={exportModalOpen} 
        onOpenChange={setExportModalOpen}
        clients={clients}
      />
    </MainLayout>
  );
}
