import { useState, useMemo } from "react";
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
  AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw
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

const COLORS = ["#E63946", "#4A4A4A", "#F4A261", "#2A9D8F", "#264653", "#8338EC", "#FF006E"];

const formatMontant = (montant: number): string => {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(montant) + ' FCFA';
};

const moisLabels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

// Composant de chargement
const LoadingCard = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-4 w-24" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-32" />
    </CardContent>
  </Card>
);

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
  const topClientsActivite = activiteClients?.top_clients || [];

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

  return (
    <MainLayout title="Reporting Commercial">
      <div className="space-y-6">
        {/* Barre d'outils */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <Select 
              value={String(anneeSelectionnee)} 
              onValueChange={(v) => setAnneeSelectionnee(Number(v))}
            >
              <SelectTrigger className="w-[120px]">
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
          </div>
          <Button onClick={() => setExportModalOpen(true)} className="gap-2">
            <Download className="h-4 w-4" />
            Exporter des données
          </Button>
        </div>

        {/* KPIs globaux */}
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          {loadingTableau ? (
            <>
              {[...Array(8)].map((_, i) => <LoadingCard key={i} />)}
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                    <Receipt className="h-3 w-3" /> CA Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{formatMontant(tableauDeBord?.kpis?.ca_total || 0)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> CA Mois
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-primary">{formatMontant(tableauDeBord?.kpis?.ca_mois_courant || 0)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" /> Créances
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-destructive">{formatMontant(tableauDeBord?.kpis?.creances_totales || 0)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Recouvrement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{tableauDeBord?.kpis?.taux_recouvrement || 0}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileCheck className="h-3 w-3" /> Factures
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{tableauDeBord?.kpis?.nb_factures || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Devis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{tableauDeBord?.kpis?.nb_devis || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" /> Ordres
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{tableauDeBord?.kpis?.nb_ordres || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> Clients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{tableauDeBord?.kpis?.nb_clients || 0}</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Alertes */}
        {tableauDeBord?.alertes && tableauDeBord.alertes.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {tableauDeBord.alertes.map((alerte: any, index: number) => (
              <Card key={index} className="border-warning/50 bg-warning/5">
                <CardContent className="flex items-center gap-3 py-3">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <div>
                    <p className="font-medium text-sm">{alerte.message}</p>
                    <p className="text-xs text-muted-foreground">{alerte.count} élément(s)</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="chiffre-affaires" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="chiffre-affaires">Chiffre d'Affaires</TabsTrigger>
            <TabsTrigger value="creances">Créances</TabsTrigger>
            <TabsTrigger value="rentabilite">Rentabilité</TabsTrigger>
            <TabsTrigger value="tresorerie">Trésorerie</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="comparatif">Comparatif</TabsTrigger>
          </TabsList>

          {/* Chiffre d'Affaires */}
          <TabsContent value="chiffre-affaires" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Évolution mensuelle du CA</CardTitle>
                  <CardDescription>Chiffre d'affaires TTC par mois en {anneeSelectionnee}</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCA ? (
                    <Skeleton className="h-[300px] w-full" />
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

              <Card>
                <CardHeader>
                  <CardTitle>Récapitulatif Annuel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      <div className="flex justify-between items-center py-2 bg-primary/10 rounded px-2">
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
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Créances par ancienneté</CardTitle>
                  <CardDescription>Répartition des impayés par tranche de jours</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCreances ? (
                    <Skeleton className="h-[300px] w-full" />
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

              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Débiteurs</CardTitle>
                  <CardDescription>Clients avec le plus d'impayés</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCreances ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead className="text-right">Montant dû</TableHead>
                          <TableHead className="text-center">Factures</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topDebiteurs.slice(0, 10).map((client: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{client.client_nom}</TableCell>
                            <TableCell className="text-right text-destructive font-semibold">
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

            {/* Stats créances */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Créances</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {formatMontant(creances?.total_creances || 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Factures Impayées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{creances?.nb_factures_impayees || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Âge Moyen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{creances?.age_moyen || 0} jours</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rentabilité */}
          <TabsContent value="rentabilite" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Chiffre d'Affaires</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatMontant(rentabilite?.chiffre_affaires || 0)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Charges</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatMontant((rentabilite?.charges_exploitation || 0) + (rentabilite?.charges_financieres || 0))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Résultat Net</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${(rentabilite?.resultat_net || 0) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {formatMontant(rentabilite?.resultat_net || 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Taux de Marge</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{rentabilite?.taux_marge || 0}%</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Évolution de la Rentabilité</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingRentabilite ? (
                  <Skeleton className="h-[300px] w-full" />
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
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <CardTitle>Flux de Trésorerie</CardTitle>
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
              <CardContent>
                {loadingTresorerie ? (
                  <Skeleton className="h-[300px] w-full" />
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

            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Solde Initial</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{formatMontant(tresorerie?.solde_initial || 0)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Entrées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-green-600 flex items-center gap-1">
                    <ArrowUpRight className="h-4 w-4" />
                    {formatMontant(tresorerie?.total_entrees || 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Sorties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-destructive flex items-center gap-1">
                    <ArrowDownRight className="h-4 w-4" />
                    {formatMontant(tresorerie?.total_sorties || 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Solde Final</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-xl font-bold ${(tresorerie?.solde_final || 0) >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {formatMontant(tresorerie?.solde_final || 0)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Devis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Devis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loadingStats ? (
                    <Skeleton className="h-32 w-full" />
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>Total</span>
                        <Badge>{statsDocuments?.devis?.total || 0}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Brouillon</span>
                        <span>{statsDocuments?.devis?.brouillon || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Envoyé</span>
                        <span>{statsDocuments?.devis?.envoye || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Accepté</span>
                        <span className="font-semibold">{statsDocuments?.devis?.accepte || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-destructive">Refusé</span>
                        <span>{statsDocuments?.devis?.refuse || 0}</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between">
                          <span className="font-medium">Taux de conversion</span>
                          <Badge variant="secondary">{statsDocuments?.devis?.taux_conversion || 0}%</Badge>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Ordres */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Ordres de Travail
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loadingStats ? (
                    <Skeleton className="h-32 w-full" />
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>Total</span>
                        <Badge>{statsDocuments?.ordres?.total || 0}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-orange-600">En cours</span>
                        <span>{statsDocuments?.ordres?.en_cours || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Terminé</span>
                        <span>{statsDocuments?.ordres?.termine || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-primary">Facturé</span>
                        <span className="font-semibold">{statsDocuments?.ordres?.facture || 0}</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between">
                          <span className="font-medium">Taux de facturation</span>
                          <Badge variant="secondary">{statsDocuments?.ordres?.taux_facturation || 0}%</Badge>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Factures */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Factures
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loadingStats ? (
                    <Skeleton className="h-32 w-full" />
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>Total</span>
                        <Badge>{statsDocuments?.factures?.total || 0}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Validée</span>
                        <span>{statsDocuments?.factures?.validee || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-orange-600">Partiellement payée</span>
                        <span>{statsDocuments?.factures?.partiellement_payee || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Payée</span>
                        <span className="font-semibold">{statsDocuments?.factures?.payee || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-destructive">Annulée</span>
                        <span>{statsDocuments?.factures?.annulee || 0}</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between">
                          <span className="font-medium">Taux de recouvrement</span>
                          <Badge variant="secondary">{statsDocuments?.factures?.taux_recouvrement || 0}%</Badge>
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
            <Card>
              <CardHeader>
                <CardTitle>Top Clients par Chiffre d'Affaires</CardTitle>
                <CardDescription>Année {anneeSelectionnee}</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingClients ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
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
                        <TableRow key={i}>
                          <TableCell>
                            <Badge variant="outline">{i + 1}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{client.client_nom}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatMontant(client.ca_total)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{client.nb_factures}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatMontant(client.paiements)}
                          </TableCell>
                          <TableCell className={`text-right ${client.solde_du > 0 ? 'text-destructive font-semibold' : ''}`}>
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
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    Chiffre d'Affaires
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingComparatif ? (
                    <Skeleton className="h-16 w-full" />
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{formatMontant(comparatif?.ca_annee2 || 0)}</span>
                        <Badge 
                          variant={(comparatif?.variation_ca || 0) >= 0 ? "default" : "destructive"}
                          className="gap-1"
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

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    Nombre de Factures
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingComparatif ? (
                    <Skeleton className="h-16 w-full" />
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{comparatif?.nb_factures_annee2 || 0}</span>
                        <Badge 
                          variant={(comparatif?.variation_factures || 0) >= 0 ? "default" : "destructive"}
                          className="gap-1"
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

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    Clients Actifs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingComparatif ? (
                    <Skeleton className="h-16 w-full" />
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{comparatif?.nb_clients_annee2 || 0}</span>
                        <Badge 
                          variant={(comparatif?.variation_clients || 0) >= 0 ? "default" : "destructive"}
                          className="gap-1"
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
      </div>

      {/* Modal d'export */}
      <ExportDataModal 
        open={exportModalOpen} 
        onOpenChange={setExportModalOpen}
        clients={clients}
      />
    </MainLayout>
  );
}
