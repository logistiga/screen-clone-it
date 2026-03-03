import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, Variants, Easing } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, FileText, ClipboardList, Receipt, Wallet, TrendingUp, TrendingDown,
  ArrowRight, Building2, CreditCard, Loader2, RefreshCw, Clock,
  CalendarDays, CalendarCheck, Calendar, CalendarRange, CalendarClock,
  DollarSign, PiggyBank, AlertCircle, BarChart3
} from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { useDashboardStats, useDashboardGraphiques, useDashboardAlertes } from "@/hooks/use-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  format, startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths
} from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

// === Types ===
type PeriodType = "jour" | "semaine" | "mois" | "semestre" | "annee";

const periodOptions: { value: PeriodType; label: string; icon: typeof CalendarDays }[] = [
  { value: "jour", label: "Jour", icon: CalendarDays },
  { value: "semaine", label: "Semaine", icon: CalendarCheck },
  { value: "mois", label: "Mois", icon: Calendar },
  { value: "semestre", label: "6 Mois", icon: CalendarClock },
  { value: "annee", label: "Année", icon: CalendarRange },
];

function getDateRange(period: PeriodType): { dateDebut: string; dateFin: string; label: string } {
  const now = new Date();
  switch (period) {
    case "jour":
      return {
        dateDebut: format(startOfDay(now), "yyyy-MM-dd"),
        dateFin: format(endOfDay(now), "yyyy-MM-dd"),
        label: format(now, "EEEE d MMMM yyyy", { locale: fr }),
      };
    case "semaine":
      return {
        dateDebut: format(startOfWeek(now, { locale: fr }), "yyyy-MM-dd"),
        dateFin: format(endOfWeek(now, { locale: fr }), "yyyy-MM-dd"),
        label: `Semaine du ${format(startOfWeek(now, { locale: fr }), "d MMM", { locale: fr })} au ${format(endOfWeek(now, { locale: fr }), "d MMM yyyy", { locale: fr })}`,
      };
    case "mois":
      return {
        dateDebut: format(startOfMonth(now), "yyyy-MM-dd"),
        dateFin: format(endOfMonth(now), "yyyy-MM-dd"),
        label: format(now, "MMMM yyyy", { locale: fr }),
      };
    case "semestre":
      return {
        dateDebut: format(subMonths(startOfMonth(now), 5), "yyyy-MM-dd"),
        dateFin: format(endOfMonth(now), "yyyy-MM-dd"),
        label: `${format(subMonths(now, 5), "MMM yyyy", { locale: fr })} — ${format(now, "MMM yyyy", { locale: fr })}`,
      };
    case "annee":
      return {
        dateDebut: format(startOfYear(now), "yyyy-MM-dd"),
        dateFin: format(endOfYear(now), "yyyy-MM-dd"),
        label: format(now, "yyyy"),
      };
  }
}

// === Animations ===
const customEase: Easing = [0.25, 0.46, 0.45, 0.94];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: customEase } },
};

// === Helpers ===
const periodLabel = (period: PeriodType) => {
  const map: Record<PeriodType, string> = {
    jour: "du jour", semaine: "de la semaine", mois: "du mois",
    semestre: "des 6 derniers mois", annee: "de l'année",
  };
  return map[period];
};

// === Component ===
export default function DashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("jour");

  const { dateDebut, dateFin, label: dateLabel } = useMemo(
    () => getDateRange(selectedPeriod), [selectedPeriod]
  );

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats(dateDebut, dateFin);
  const { data: graphiques, isLoading: graphiquesLoading } = useDashboardGraphiques(currentYear);
  const { data: alertes, isLoading: alertesLoading } = useDashboardAlertes();

  // Caisse en attente stats
  const { data: caisseAttenteStats } = useQuery({
    queryKey: ["caisse-en-attente-stats"],
    queryFn: async () => {
      const response = await api.get("/caisse-en-attente/stats");
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // CNV stats
  const { data: caisseCnvStats } = useQuery({
    queryKey: ["caisse-cnv-stats"],
    queryFn: async () => {
      const response = await api.get("/caisse-cnv/stats");
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const totalEnAttente = (caisseAttenteStats?.data?.total_montant ?? caisseAttenteStats?.total_montant ?? 0) +
    (caisseCnvStats?.data?.total_montant ?? caisseCnvStats?.total_montant ?? 0);

  const chartConfig = {
    ca: { label: "Chiffre d'affaires", color: "hsl(var(--primary))" },
    paiements: { label: "Paiements", color: "hsl(var(--success))" },
  };

  const quickActions = [
    { label: "Nouveau client", icon: Users, path: "/clients/nouveau" },
    { label: "Nouveau devis", icon: FileText, path: "/devis/nouveau" },
    { label: "Nouvel ordre", icon: ClipboardList, path: "/ordres/nouveau" },
    { label: "Nouvelle facture", icon: Receipt, path: "/factures/nouvelle" },
  ];

  return (
    <MainLayout title="Tableau de bord">
      <motion.div className="space-y-6" initial="hidden" animate="visible" variants={containerVariants}>

        {/* ===== HEADER + PERIOD SELECTOR ===== */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Tableau de bord</h2>
              <p className="text-sm text-muted-foreground capitalize">{dateLabel}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchStats()} disabled={statsLoading}>
              {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Actualiser</span>
            </Button>
          </div>

          {/* Period tabs */}
          <div className="flex bg-muted rounded-xl p-1 gap-0.5 w-fit">
            {periodOptions.map((option) => {
              const Icon = option.icon;
              const isActive = selectedPeriod === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedPeriod(option.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ===== KPI CARDS ===== */}
        <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4" variants={containerVariants}>
          {/* CA */}
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    CA {periodLabel(selectedPeriod)}
                  </p>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                </div>
                {statsLoading ? (
                  <Skeleton className="h-7 w-28 mt-2" />
                ) : (
                  <p className="text-xl font-bold mt-2 text-foreground">
                    {formatMontant(selectedPeriod === "annee" ? (stats?.ca_annuel ?? 0) : (stats?.ca_mensuel ?? 0))}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Créances */}
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Créances</p>
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                </div>
                {statsLoading ? (
                  <Skeleton className="h-7 w-28 mt-2" />
                ) : (
                  <p className="text-xl font-bold mt-2 text-destructive">
                    {formatMontant(stats?.creances ?? 0)}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Solde Caisse */}
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Solde Caisse</p>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                </div>
                {statsLoading ? (
                  <Skeleton className="h-7 w-28 mt-2" />
                ) : (
                  <p className="text-xl font-bold mt-2 text-foreground">
                    {formatMontant(stats?.caisse ?? 0)}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">Mis à jour aujourd'hui</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Solde Banque */}
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden border-l-4 border-l-info" style={{ borderLeftColor: "hsl(var(--info))" }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Solde Banque</p>
                  <div className="p-2 rounded-lg" style={{ background: "hsl(var(--info) / 0.1)" }}>
                    <Building2 className="h-4 w-4" style={{ color: "hsl(var(--info))" }} />
                  </div>
                </div>
                {statsLoading ? (
                  <Skeleton className="h-7 w-28 mt-2" />
                ) : (
                  <p className="text-xl font-bold mt-2 text-foreground">
                    {formatMontant(stats?.banque ?? 0)}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">Mis à jour aujourd'hui</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* ===== ROW 2: Paiements + Factures + Caisse en attente ===== */}
        <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4" variants={containerVariants}>
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    Paiements {periodLabel(selectedPeriod)}
                  </p>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-7 w-24 mt-2" />
                ) : (
                  <p className="text-xl font-bold mt-2">{formatMontant(stats?.paiements ?? 0)}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Factures</p>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-7 w-16 mt-2" />
                ) : (
                  <p className="text-xl font-bold mt-2">{stats?.factures ?? 0}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
              style={{ borderLeftColor: "hsl(var(--warning))" }}
              onClick={() => navigate("/caisse-en-attente")}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Caisse en attente</p>
                  <div className="p-2 rounded-lg" style={{ background: "hsl(var(--warning) / 0.1)" }}>
                    <Clock className="h-4 w-4" style={{ color: "hsl(var(--warning))" }} />
                  </div>
                </div>
                <p className="text-xl font-bold mt-2" style={{ color: "hsl(var(--warning))" }}>
                  {formatMontant(totalEnAttente)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">OPS + CNV en attente de décaissement</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* ===== Alertes ===== */}
        {!alertesLoading && alertes && alertes.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-2">
            {alertes.map((alerte, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${
                  alerte.type === "danger"
                    ? "bg-destructive/10 border-destructive/20 text-destructive"
                    : alerte.type === "warning"
                    ? "bg-warning/10 border-warning/20"
                    : "bg-info/10 border-info/20"
                }`}
                style={
                  alerte.type === "warning"
                    ? { color: "hsl(var(--warning))" }
                    : alerte.type === "info"
                    ? { color: "hsl(var(--info))" }
                    : undefined
                }
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{alerte.message}</span>
                {alerte.count > 0 && <Badge variant="secondary">{alerte.count}</Badge>}
              </div>
            ))}
          </motion.div>
        )}

        {/* ===== CHARTS + TOP CLIENTS ===== */}
        <motion.div className="grid gap-6 lg:grid-cols-5" variants={containerVariants}>
          {/* Évolution CA - 3/5 */}
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Évolution du chiffre d'affaires</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {graphiquesLoading ? (
                  <div className="h-[280px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : graphiques?.ca_mensuel && graphiques.ca_mensuel.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[280px] w-full">
                    <AreaChart data={graphiques.ca_mensuel}>
                      <defs>
                        <linearGradient id="caGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="mois" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        formatter={(value: number) => formatMontant(value)}
                      />
                      <Area
                        type="monotone"
                        dataKey="montant"
                        name="CA"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#caGradient)"
                      />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                    Aucune donnée disponible
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Clients - 2/5 */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Top Clients</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/reporting")}>
                    Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {graphiquesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </div>
                ) : graphiques?.top_clients && graphiques.top_clients.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-2">#</th>
                          <th className="text-left text-xs font-medium text-muted-foreground pb-2">Client</th>
                          <th className="text-right text-xs font-medium text-muted-foreground pb-2">Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {graphiques.top_clients.slice(0, 8).map((client, index) => {
                          const maxMontant = graphiques.top_clients[0]?.montant || 1;
                          const pct = (client.montant / maxMontant) * 100;
                          return (
                            <tr key={index} className="border-b border-muted/50 last:border-0">
                              <td className="py-2 pr-2 text-xs text-muted-foreground font-medium">{index + 1}</td>
                              <td className="py-2">
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium truncate max-w-[160px]">{client.nom}</span>
                                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-primary transition-all"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-2 text-right font-semibold whitespace-nowrap">
                                {formatMontant(client.montant)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                    Aucune donnée disponible
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* ===== Paiements mensuel chart ===== */}
        {graphiques?.paiements_mensuel && graphiques.paiements_mensuel.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Paiements mensuels</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <BarChart data={graphiques.paiements_mensuel}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mois" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => formatMontant(value)}
                    />
                    <Bar dataKey="montant" name="Paiements" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ===== ACTIONS RAPIDES ===== */}
        <motion.div variants={itemVariants}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Actions rapides</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-3 flex items-center gap-3 justify-start hover:border-primary/50 hover:shadow-sm transition-all"
                onClick={() => navigate(action.path)}
              >
                <div className="p-1.5 rounded-md bg-primary/10">
                  <action.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </motion.div>

        {/* ===== MODULES OVERVIEW ===== */}
        <motion.div variants={itemVariants}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Aperçu des modules</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Clients", icon: Users, path: "/clients", value: stats?.clients ?? 0 },
              { title: "Devis", icon: FileText, path: "/devis", value: stats?.devis ?? 0 },
              { title: "Ordres", icon: ClipboardList, path: "/ordres", value: stats?.ordres ?? 0 },
              { title: "Factures", icon: Receipt, path: "/factures", value: stats?.factures ?? 0 },
            ].map((mod) => (
              <Card
                key={mod.title}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(mod.path)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <mod.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{mod.title}</p>
                      {statsLoading ? (
                        <Skeleton className="h-5 w-8 mt-0.5" />
                      ) : (
                        <p className="text-lg font-bold">{mod.value}</p>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* ===== Footer: Paramétrage ===== */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
        >
          <div>
            <h4 className="font-medium text-sm">Paramétrage</h4>
            <p className="text-xs text-muted-foreground">
              Utilisateurs, rôles, taxes et numérotation
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/utilisateurs")}>
            Accéder <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </motion.div>
      </motion.div>
    </MainLayout>
  );
}
