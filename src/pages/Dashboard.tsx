import { useNavigate } from "react-router-dom";
import { motion, Variants, Easing } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCard, AnimatedCardHeader, AnimatedCardContent } from "@/components/ui/animated-card";
import { StaggerContainer, StaggerItem } from "@/components/ui/stagger-container";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Button } from "@/components/ui/button";
import { Users, FileText, ClipboardList, Receipt, Wallet, TrendingUp, ArrowRight, Building2, CreditCard, FileStack, Handshake, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { useDashboardStats, useDashboardGraphiques, useDashboardAlertes } from "@/hooks/use-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, CartesianGrid, Tooltip, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";

// Easing personnalisé typé correctement
const customEase: Easing = [0.25, 0.46, 0.45, 0.94];

// Animation variants
const containerVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};
const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: customEase
    }
  }
};
const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 30
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: customEase
    }
  }
};
const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: customEase
    }
  }
};
export default function DashboardPage() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats
  } = useDashboardStats();
  const {
    data: graphiques,
    isLoading: graphiquesLoading
  } = useDashboardGraphiques(currentYear);
  const {
    data: alertes,
    isLoading: alertesLoading
  } = useDashboardAlertes();
  const quickActions = [{
    label: "Nouveau client",
    icon: Users,
    path: "/clients/nouveau",
    color: "bg-blue-500"
  }, {
    label: "Nouveau devis",
    icon: FileText,
    path: "/devis/nouveau",
    color: "bg-purple-500"
  }, {
    label: "Nouvel ordre",
    icon: ClipboardList,
    path: "/ordres/nouveau",
    color: "bg-green-500"
  }, {
    label: "Nouvelle facture",
    icon: Receipt,
    path: "/factures/nouvelle",
    color: "bg-orange-500"
  }];
  const modules = [{
    title: "Clients",
    description: "Gérez vos clients et leurs informations",
    icon: Users,
    path: "/clients",
    count: stats?.clients ?? 0
  }, {
    title: "Partenaires",
    description: "Transitaires, armateurs, représentants",
    icon: Handshake,
    path: "/partenaires",
    count: 0
  }, {
    title: "Devis",
    description: "Créez et suivez vos propositions",
    icon: FileText,
    path: "/devis",
    count: stats?.devis ?? 0
  }, {
    title: "Ordres de travail",
    description: "Gérez vos opérations",
    icon: ClipboardList,
    path: "/ordres",
    count: stats?.ordres ?? 0
  }, {
    title: "Factures",
    description: "Facturation et encaissements",
    icon: Receipt,
    path: "/factures",
    count: stats?.factures ?? 0
  }, {
    title: "Notes de début",
    description: "Notes et documents opérationnels",
    icon: FileStack,
    path: "/notes-debut",
    count: 0
  }];
  const financeModules = [{
    title: "Caisse",
    description: "Mouvements de caisse",
    icon: Wallet,
    path: "/caisse",
    amount: stats?.caisse ?? 0
  }, {
    title: "Banque",
    description: "Opérations bancaires",
    icon: Building2,
    path: "/banque",
    amount: stats?.banque ?? 0
  }, {
    title: "Crédits Bancaires",
    description: "Suivi des emprunts",
    icon: CreditCard,
    path: "/credits",
    amount: 0
  }, {
    title: "Reporting",
    description: "Analyses et statistiques",
    icon: TrendingUp,
    path: "/reporting",
    amount: null
  }];
  const chartConfig = {
    ca: {
      label: "Chiffre d'affaires",
      color: "hsl(var(--primary))"
    },
    paiements: {
      label: "Paiements",
      color: "hsl(var(--chart-2))"
    }
  };
  return <MainLayout title="Tableau de bord">
      <motion.div className="space-y-8" initial="hidden" animate="visible" variants={containerVariants}>
        {/* Message de bienvenue avec stats globales */}
        <motion.div variants={fadeInUp} className="rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <motion.h2 className="text-2xl font-bold mb-2" initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              delay: 0.2
            }}>Bienvenue sur LogistiGA</motion.h2>
              <motion.p className="text-muted-foreground" initial={{
              opacity: 0
            }} animate={{
              opacity: 1
            }} transition={{
              delay: 0.3
            }}>
                Votre solution de gestion logistique et transit.
              </motion.p>
            </div>
            <motion.div whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }}>
              <Button variant="outline" size="sm" onClick={() => refetchStats()} disabled={statsLoading}>
                {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">Actualiser</span>
              </Button>
            </motion.div>
          </div>
          
          {/* KPIs principaux */}
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6" variants={containerVariants}>
            {[{
            label: "CA Annuel",
            value: stats?.ca_annuel ?? 0,
            color: "text-primary"
          }, {
            label: "CA du mois",
            value: stats?.ca_mensuel ?? 0,
            color: "text-green-600"
          }, {
            label: "Créances",
            value: stats?.creances ?? 0,
            color: "text-orange-600"
          }, {
            label: "Trésorerie totale",
            value: (stats?.caisse ?? 0) + (stats?.banque ?? 0),
            color: ""
          }].map((kpi, index) => <motion.div key={kpi.label} variants={scaleIn} whileHover={{
            scale: 1.03,
            y: -2
          }} className="bg-background/50 rounded-lg p-4 border cursor-default transition-shadow hover:shadow-md">
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                {statsLoading ? <Skeleton className="h-8 w-24 mt-1" /> : <p className={`text-xl font-bold ${kpi.color}`}>
                    <AnimatedCounter value={kpi.value} suffix=" XAF" formatFn={v => new Intl.NumberFormat('fr-FR').format(Math.round(v))} />
                  </p>}
              </motion.div>)}
          </motion.div>
        </motion.div>

        {/* Alertes */}
        {!alertesLoading && alertes && alertes.length > 0 && <motion.div className="space-y-2" initial={{
        opacity: 0,
        height: 0
      }} animate={{
        opacity: 1,
        height: "auto"
      }} transition={{
        duration: 0.3
      }}>
            {alertes.map((alerte, index) => <motion.div key={index} initial={{
          opacity: 0,
          x: -20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          delay: index * 0.1
        }} whileHover={{
          scale: 1.01
        }} className={`flex items-center gap-3 p-3 rounded-lg border ${alerte.type === 'danger' ? 'bg-destructive/10 border-destructive/20 text-destructive' : alerte.type === 'warning' ? 'bg-orange-500/10 border-orange-500/20 text-orange-700' : 'bg-blue-500/10 border-blue-500/20 text-blue-700'}`}>
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1">{alerte.message}</span>
                {alerte.count > 0 && <Badge variant="secondary">{alerte.count}</Badge>}
              </motion.div>)}
          </motion.div>}

        {/* Graphiques */}
        <motion.div className="grid gap-6 lg:grid-cols-2" variants={containerVariants}>
          {/* Évolution CA */}
          <motion.div variants={itemVariants}>
            <AnimatedCard delay={0.1} hoverScale={1.01} hoverY={-2}>
              <AnimatedCardHeader className="pb-2">
                <CardTitle className="text-base">Évolution du chiffre d'affaires</CardTitle>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                {graphiquesLoading ? <div className="h-[250px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div> : graphiques?.ca_mensuel && graphiques.ca_mensuel.length > 0 ? <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart data={graphiques.ca_mensuel}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="mois" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={value => `${(value / 1000000).toFixed(0)}M`} />
                      <ChartTooltip content={<ChartTooltipContent />} formatter={(value: number) => formatMontant(value)} />
                      <Bar dataKey="montant" name="CA" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer> : <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    Aucune donnée disponible
                  </div>}
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>

          {/* Top Clients */}
          <motion.div variants={itemVariants}>
            <AnimatedCard delay={0.2} hoverScale={1.01} hoverY={-2}>
              <AnimatedCardHeader className="pb-2">
                <CardTitle className="text-base">Top clients par CA</CardTitle>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                {graphiquesLoading ? <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-20" />
                      </div>)}
                  </div> : graphiques?.top_clients && graphiques.top_clients.length > 0 ? <div className="space-y-3">
                    {graphiques.top_clients.slice(0, 5).map((client, index) => <motion.div key={index} className="flex items-center justify-between" initial={{
                  opacity: 0,
                  x: -10
                }} animate={{
                  opacity: 1,
                  x: 0
                }} transition={{
                  delay: 0.3 + index * 0.1
                }}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground w-5">
                            {index + 1}.
                          </span>
                          <span className="text-sm font-medium truncate max-w-[180px]">
                            {client.nom}
                          </span>
                        </div>
                        <span className="text-sm font-bold">{formatMontant(client.montant)}</span>
                      </motion.div>)}
                  </div> : <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    Aucune donnée disponible
                  </div>}
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>
        </motion.div>

        {/* Actions rapides */}
        <motion.div variants={itemVariants}>
          <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
          <StaggerContainer className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.05}>
            {quickActions.map((action, index) => <StaggerItem key={action.label}>
                <motion.div whileHover={{
              scale: 1.03,
              y: -4
            }} whileTap={{
              scale: 0.97
            }}>
                  <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:border-primary hover:shadow-md transition-all" onClick={() => navigate(action.path)}>
                    <motion.div className={`p-2 rounded-full ${action.color} text-white`} whileHover={{
                  rotate: [0, -10, 10, 0]
                }} transition={{
                  duration: 0.4
                }}>
                      <action.icon className="h-5 w-5" />
                    </motion.div>
                    <span className="font-medium">{action.label}</span>
                  </Button>
                </motion.div>
              </StaggerItem>)}
          </StaggerContainer>
        </motion.div>

        {/* Modules Commercial */}
        <motion.div variants={itemVariants}>
          <h3 className="text-lg font-semibold mb-4">Commercial</h3>
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.06}>
            {modules.map((module, index) => <StaggerItem key={module.title}>
                <AnimatedCard delay={0} hoverScale={1.02} hoverY={-4} className="cursor-pointer" onClick={() => navigate(module.path)}>
                  <AnimatedCardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <motion.div className="p-2 rounded-lg bg-primary/10 text-primary" whileHover={{
                      scale: 1.1,
                      rotate: 5
                    }}>
                          <module.icon className="h-5 w-5" />
                        </motion.div>
                        <CardTitle className="text-base">{module.title}</CardTitle>
                      </div>
                      <motion.div initial={{
                    x: 0
                  }} whileHover={{
                    x: 4
                  }}>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                    </div>
                  </AnimatedCardHeader>
                  <AnimatedCardContent>
                    <p className="text-sm text-muted-foreground mb-2">{module.description}</p>
                    {statsLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">
                        <AnimatedCounter value={module.count} />
                      </p>}
                  </AnimatedCardContent>
                </AnimatedCard>
              </StaggerItem>)}
          </StaggerContainer>
        </motion.div>

        {/* Modules Finance */}
        <motion.div variants={itemVariants}>
          <h3 className="text-lg font-semibold mb-4">Finance & Comptabilité</h3>
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.05}>
            {financeModules.map((module, index) => <StaggerItem key={module.title}>
                <AnimatedCard delay={0} hoverScale={1.03} hoverY={-4} className="cursor-pointer" onClick={() => navigate(module.path)}>
                  <AnimatedCardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <motion.div className="p-2 rounded-lg bg-primary/10 text-primary" whileHover={{
                    scale: 1.1,
                    rotate: -5
                  }}>
                        <module.icon className="h-5 w-5" />
                      </motion.div>
                      <CardTitle className="text-sm">{module.title}</CardTitle>
                    </div>
                  </AnimatedCardHeader>
                  <AnimatedCardContent>
                    <p className="text-xs text-muted-foreground mb-1">{module.description}</p>
                    {module.amount !== null && (statsLoading ? <Skeleton className="h-6 w-20" /> : <p className="text-lg font-bold">
                          <AnimatedCounter value={module.amount} suffix=" XAF" formatFn={v => new Intl.NumberFormat('fr-FR').format(Math.round(v))} />
                        </p>)}
                  </AnimatedCardContent>
                </AnimatedCard>
              </StaggerItem>)}
          </StaggerContainer>
        </motion.div>

        {/* Accès paramétrage */}
        <motion.div variants={fadeInUp} whileHover={{
        scale: 1.01
      }} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 transition-shadow hover:shadow-md">
          <div>
            <h4 className="font-medium">Paramétrage</h4>
            <p className="text-sm text-muted-foreground">
              Configurez les utilisateurs, rôles, taxes et numérotation
            </p>
          </div>
          <motion.div whileHover={{
          scale: 1.05
        }} whileTap={{
          scale: 0.95
        }}>
            <Button variant="outline" onClick={() => navigate("/utilisateurs")}>
              Accéder aux paramètres
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </MainLayout>;
}