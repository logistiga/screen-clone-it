import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  FileText,
  ClipboardList,
  Receipt,
  Wallet,
  TrendingUp,
  ArrowRight,
  Building2,
  CreditCard,
  FileStack,
  Handshake,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { useDashboardStats, useDashboardGraphiques, useDashboardAlertes } from "@/hooks/use-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, CartesianGrid, Tooltip, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: graphiques, isLoading: graphiquesLoading } = useDashboardGraphiques(currentYear);
  const { data: alertes, isLoading: alertesLoading } = useDashboardAlertes();

  const quickActions = [
    { label: "Nouveau client", icon: Users, path: "/clients/nouveau", color: "bg-blue-500" },
    { label: "Nouveau devis", icon: FileText, path: "/devis/nouveau", color: "bg-purple-500" },
    { label: "Nouvel ordre", icon: ClipboardList, path: "/ordres/nouveau", color: "bg-green-500" },
    { label: "Nouvelle facture", icon: Receipt, path: "/factures/nouvelle", color: "bg-orange-500" },
  ];

  const modules = [
    { title: "Clients", description: "Gérez vos clients et leurs informations", icon: Users, path: "/clients", count: stats?.clients ?? 0 },
    { title: "Partenaires", description: "Transitaires, armateurs, représentants", icon: Handshake, path: "/partenaires", count: 0 },
    { title: "Devis", description: "Créez et suivez vos propositions", icon: FileText, path: "/devis", count: stats?.devis ?? 0 },
    { title: "Ordres de travail", description: "Gérez vos opérations", icon: ClipboardList, path: "/ordres", count: stats?.ordres ?? 0 },
    { title: "Factures", description: "Facturation et encaissements", icon: Receipt, path: "/factures", count: stats?.factures ?? 0 },
    { title: "Notes de début", description: "Notes et documents opérationnels", icon: FileStack, path: "/notes-debut", count: 0 },
  ];

  const financeModules = [
    { title: "Caisse", description: "Mouvements de caisse", icon: Wallet, path: "/caisse", amount: stats?.caisse ?? 0 },
    { title: "Banque", description: "Opérations bancaires", icon: Building2, path: "/banque", amount: stats?.banque ?? 0 },
    { title: "Crédits Bancaires", description: "Suivi des emprunts", icon: CreditCard, path: "/credits", amount: 0 },
    { title: "Reporting", description: "Analyses et statistiques", icon: TrendingUp, path: "/reporting", amount: null },
  ];

  const chartConfig = {
    ca: { label: "Chiffre d'affaires", color: "hsl(var(--primary))" },
    paiements: { label: "Paiements", color: "hsl(var(--chart-2))" },
  };

  return (
    <MainLayout title="Tableau de bord">
      <div className="space-y-8">
        {/* Message de bienvenue avec stats globales */}
        <div className="rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Bienvenue sur Lojistiga</h2>
              <p className="text-muted-foreground">
                Votre solution de gestion logistique et transit.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchStats()}
              disabled={statsLoading}
            >
              {statsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Actualiser</span>
            </Button>
          </div>
          
          {/* KPIs principaux */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-background/50 rounded-lg p-4 border">
              <p className="text-sm text-muted-foreground">CA Annuel</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-24 mt-1" />
              ) : (
                <p className="text-xl font-bold text-primary">{formatMontant(stats?.ca_annuel ?? 0)}</p>
              )}
            </div>
            <div className="bg-background/50 rounded-lg p-4 border">
              <p className="text-sm text-muted-foreground">CA du mois</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-24 mt-1" />
              ) : (
                <p className="text-xl font-bold text-green-600">{formatMontant(stats?.ca_mensuel ?? 0)}</p>
              )}
            </div>
            <div className="bg-background/50 rounded-lg p-4 border">
              <p className="text-sm text-muted-foreground">Créances</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-24 mt-1" />
              ) : (
                <p className="text-xl font-bold text-orange-600">{formatMontant(stats?.creances ?? 0)}</p>
              )}
            </div>
            <div className="bg-background/50 rounded-lg p-4 border">
              <p className="text-sm text-muted-foreground">Trésorerie totale</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-24 mt-1" />
              ) : (
                <p className="text-xl font-bold">{formatMontant((stats?.caisse ?? 0) + (stats?.banque ?? 0))}</p>
              )}
            </div>
          </div>
        </div>

        {/* Alertes */}
        {!alertesLoading && alertes && alertes.length > 0 && (
          <div className="space-y-2">
            {alertes.map((alerte, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  alerte.type === 'danger' 
                    ? 'bg-destructive/10 border-destructive/20 text-destructive' 
                    : alerte.type === 'warning'
                    ? 'bg-orange-500/10 border-orange-500/20 text-orange-700'
                    : 'bg-blue-500/10 border-blue-500/20 text-blue-700'
                }`}
              >
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1">{alerte.message}</span>
                {alerte.count > 0 && (
                  <Badge variant="secondary">{alerte.count}</Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Graphiques */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Évolution CA */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Évolution du chiffre d'affaires</CardTitle>
            </CardHeader>
            <CardContent>
              {graphiquesLoading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : graphiques?.ca_mensuel && graphiques.ca_mensuel.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <BarChart data={graphiques.ca_mensuel}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mois" className="text-xs" />
                    <YAxis 
                      className="text-xs" 
                      tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => formatMontant(value)}
                    />
                    <Bar dataKey="montant" name="CA" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Clients */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top clients par CA</CardTitle>
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
                <div className="space-y-3">
                  {graphiques.top_clients.slice(0, 5).map((client, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground w-5">
                          {index + 1}.
                        </span>
                        <span className="text-sm font-medium truncate max-w-[180px]">
                          {client.nom}
                        </span>
                      </div>
                      <span className="text-sm font-bold">{formatMontant(client.montant)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary"
                onClick={() => navigate(action.path)}
              >
                <div className={`p-2 rounded-full ${action.color} text-white`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Modules Commercial */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Commercial</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <Card
                key={module.title}
                className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50"
                onClick={() => navigate(module.path)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <module.icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-base">{module.title}</CardTitle>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{module.description}</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{module.count}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Modules Finance */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Finance & Comptabilité</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {financeModules.map((module) => (
              <Card
                key={module.title}
                className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50"
                onClick={() => navigate(module.path)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <module.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-sm">{module.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-1">{module.description}</p>
                  {module.amount !== null && (
                    statsLoading ? (
                      <Skeleton className="h-6 w-20" />
                    ) : (
                      <p className="text-lg font-bold">{formatMontant(module.amount)}</p>
                    )
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Accès paramétrage */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
          <div>
            <h4 className="font-medium">Paramétrage</h4>
            <p className="text-sm text-muted-foreground">
              Configurez les utilisateurs, rôles, taxes et numérotation
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/utilisateurs")}>
            Accéder aux paramètres
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
