import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Plus, Building2, Calendar, TrendingDown, TrendingUp, Wallet, Eye, CreditCard,
  AlertTriangle, CheckCircle, Clock, History, BarChart3, Target, ChevronDown,
  ChevronRight, RefreshCw, PieChart, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { NouveauCreditModal } from "@/components/NouveauCreditModal";
import { RemboursementCreditModal } from "@/components/RemboursementCreditModal";
import { useCredits, useCreditStats, useCreditDashboard, useCreditComparaison } from "@/hooks/use-credits";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Line, Area, AreaChart } from 'recharts';
import { DocumentStatCard, DocumentStatCardSkeleton } from "@/components/shared/documents/DocumentStatCard";
import { DocumentEmptyState } from "@/components/shared/documents/DocumentEmptyState";
import { DocumentLoadingState } from "@/components/shared/documents/DocumentLoadingState";

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

export default function CreditsPage() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  
  const [selectedAnnee, setSelectedAnnee] = useState(currentYear);
  const [showNouveauModal, setShowNouveauModal] = useState(false);
  const [showRemboursementModal, setShowRemboursementModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<any>(null);
  const [selectedEcheance, setSelectedEcheance] = useState<any>(null);
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [expandedBanques, setExpandedBanques] = useState<number[]>([]);

  // Data fetching
  const { data: creditsData, isLoading: loadingCredits, refetch } = useCredits({ per_page: 100 });
  const { data: stats, isLoading: loadingStats } = useCreditStats(selectedAnnee);
  const { data: dashboard, isLoading: loadingDashboard } = useCreditDashboard(selectedAnnee);
  const { data: comparaison, isLoading: loadingComparaison } = useCreditComparaison(selectedAnnee);

  const credits = creditsData?.data || [];
  const isLoading = loadingCredits || loadingStats;

  const creditsFiltres = credits.filter(credit => 
    filterStatut === "all" || credit.statut.toLowerCase() === filterStatut.toLowerCase()
  );

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant) + ' FCFA';
  };

  const formatMontantCompact = (montant: number) => {
    if (montant >= 1000000000) return (montant / 1000000000).toFixed(1) + ' Mrd';
    if (montant >= 1000000) return (montant / 1000000).toFixed(1) + ' M';
    if (montant >= 1000) return (montant / 1000).toFixed(0) + ' K';
    return montant.toLocaleString('fr-FR');
  };

  const getStatutBadge = (statut: string) => {
    switch (statut.toLowerCase()) {
      case 'actif': return <Badge className="bg-primary/10 text-primary border-primary/20">Actif</Badge>;
      case 'soldé': case 'solde': return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Soldé</Badge>;
      case 'en défaut': case 'en_defaut': return <Badge variant="destructive">En défaut</Badge>;
      default: return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getEcheanceStatutBadge = (statut: string, joursRetard?: number) => {
    switch (statut.toLowerCase()) {
      case 'payée': case 'payee': return <Badge className="bg-emerald-500/10 text-emerald-600"><CheckCircle className="h-3 w-3 mr-1" />Payée</Badge>;
      case 'en attente': case 'a_payer': return <Badge variant="outline" className="border-amber-400 text-amber-600"><Clock className="h-3 w-3 mr-1" />À payer</Badge>;
      case 'en retard': return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {joursRetard ? `${joursRetard}j retard` : 'En retard'}
        </Badge>
      );
      default: return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const toggleBanque = (banqueId: number) => {
    setExpandedBanques(prev => 
      prev.includes(banqueId) ? prev.filter(id => id !== banqueId) : [...prev, banqueId]
    );
  };

  const handleRemboursement = (credit: any, echeance?: any) => {
    setSelectedCredit(credit);
    setSelectedEcheance(echeance || null);
    setShowRemboursementModal(true);
  };

  const handlePayerEcheance = (echeance: any) => {
    const credit = credits.find(c => c.id === echeance.credit_id);
    if (credit) {
      handleRemboursement(credit, echeance);
    } else {
      handleRemboursement({
        id: echeance.credit_id,
        numero: echeance.credit_numero,
        objet: echeance.objet || '',
        banque: { nom: echeance.banque }
      }, echeance);
    }
  };

  // Prepare chart data
  const evolutionChartData = stats?.evolution_mensuelle || [];
  const comparaisonChartData = comparaison?.par_mois || [];
  
  const pieData = stats?.par_banque?.map((b: any, index: number) => ({
    name: b.banque_nom,
    value: b.total,
    color: [
      'hsl(var(--primary))', 
      'hsl(142 71% 45%)', 
      'hsl(38 92% 50%)', 
      'hsl(0 84% 60%)', 
      'hsl(262 83% 58%)', 
      'hsl(189 94% 43%)'
    ][index % 6]
  })) || [];

  if (isLoading) {
    return (
      <MainLayout title="Crédits Bancaires">
        <DocumentLoadingState message="Chargement des crédits bancaires..." />
      </MainLayout>
    );
  }

  // État vide
  if (credits.length === 0 && !loadingCredits) {
    return (
      <MainLayout title="Crédits Bancaires">
        <DocumentEmptyState
          icon={CreditCard}
          title="Aucun crédit bancaire"
          description="Gérez vos emprunts bancaires, échéances et remboursements en toute simplicité."
          actionLabel="Nouveau crédit"
          onAction={() => setShowNouveauModal(true)}
        />
        <NouveauCreditModal open={showNouveauModal} onOpenChange={setShowNouveauModal} />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Crédits Bancaires">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Crédits Bancaires</h1>
            <p className="text-muted-foreground mt-1">Suivi des emprunts et remboursements</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedAnnee.toString()} onValueChange={(v) => setSelectedAnnee(parseInt(v))}>
              <SelectTrigger className="w-28">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="actif">Actifs</SelectItem>
                <SelectItem value="soldé">Soldés</SelectItem>
                <SelectItem value="en défaut">En défaut</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()} title="Actualiser">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setShowNouveauModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau crédit
            </Button>
          </div>
        </motion.div>

        {/* Dashboard KPIs */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {loadingStats ? (
            Array.from({ length: 5 }).map((_, i) => <DocumentStatCardSkeleton key={i} />)
          ) : (
            <>
              <DocumentStatCard
                title="Total emprunté"
                value={formatMontantCompact(stats?.total_credits_actifs || 0)}
                icon={CreditCard}
                subtitle={`${stats?.nombre_credits_actifs || 0} crédits actifs`}
                variant="primary"
                delay={0}
              />
              <DocumentStatCard
                title="Total remboursé"
                value={formatMontantCompact(stats?.total_rembourse || 0)}
                icon={TrendingDown}
                subtitle={`${stats?.taux_remboursement_global?.toFixed(1) || 0}% du total`}
                variant="success"
                delay={0.1}
              />
              <DocumentStatCard
                title="Reste à payer"
                value={formatMontantCompact(stats?.reste_global || 0)}
                icon={Wallet}
                variant="warning"
                delay={0.2}
              />
              <DocumentStatCard
                title="Total intérêts"
                value={formatMontantCompact(stats?.total_interets || 0)}
                icon={Target}
                subtitle="Coût du financement"
                variant="info"
                delay={0.3}
              />
              <DocumentStatCard
                title="Échéances retard"
                value={stats?.echeances_en_retard || 0}
                icon={AlertTriangle}
                subtitle={(stats?.echeances_en_retard || 0) > 0 ? 'Action requise' : 'Tout est à jour'}
                variant={(stats?.echeances_en_retard || 0) > 0 ? "danger" : "default"}
                delay={0.4}
              />
            </>
          )}
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tabs defaultValue="dashboard" className="space-y-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="dashboard" className="gap-2"><BarChart3 className="h-4 w-4" />Tableau de bord</TabsTrigger>
              <TabsTrigger value="comparaison" className="gap-2"><TrendingUp className="h-4 w-4" />Comparaison</TabsTrigger>
              <TabsTrigger value="details" className="gap-2"><Building2 className="h-4 w-4" />Par banque</TabsTrigger>
              <TabsTrigger value="echeances" className="gap-2"><Calendar className="h-4 w-4" />Échéancier</TabsTrigger>
              <TabsTrigger value="liste" className="gap-2"><History className="h-4 w-4" />Liste complète</TabsTrigger>
            </TabsList>

            {/* DASHBOARD TAB */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Evolution mensuelle */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Évolution mensuelle {selectedAnnee}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={evolutionChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="mois_nom" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={(v) => formatMontantCompact(v)} tick={{ fontSize: 11 }} />
                        <Tooltip 
                          formatter={(value: number) => formatMontant(value)}
                          labelStyle={{ color: 'hsl(var(--foreground))' }}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="emprunte" name="Emprunté" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="rembourse" name="Remboursé" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Répartition par banque */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <PieChart className="h-4 w-4 text-primary" />
                      Répartition par banque
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <RechartsPie>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {pieData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatMontant(value)} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Prochaines échéances & Alertes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Prochaines échéances
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>Date</TableHead>
                          <TableHead>Crédit</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(stats?.prochaines_echeances || []).slice(0, 5).map((e: any) => (
                          <TableRow key={e.id} className="hover:bg-muted/20">
                            <TableCell className="font-medium">
                              {e.date_echeance ? format(new Date(e.date_echeance), 'dd MMM', { locale: fr }) : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{e.credit_numero}</div>
                              <div className="text-xs text-muted-foreground">{e.banque}</div>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{formatMontantCompact(e.montant)}</TableCell>
                          </TableRow>
                        ))}
                        {(!stats?.prochaines_echeances || stats.prochaines_echeances.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                              Aucune échéance à venir
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className={`shadow-sm ${(stats?.echeances_retard?.length || 0) > 0 ? 'border-destructive/50' : ''}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className={`h-4 w-4 ${(stats?.echeances_retard?.length || 0) > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                      Échéances en retard
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>Date</TableHead>
                          <TableHead>Crédit</TableHead>
                          <TableHead>Retard</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(stats?.echeances_retard || []).slice(0, 5).map((e: any) => (
                          <TableRow key={e.id} className="hover:bg-destructive/5">
                            <TableCell className="font-medium text-destructive">
                              {e.date_echeance ? format(new Date(e.date_echeance), 'dd/MM', { locale: fr }) : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{e.credit_numero}</div>
                              <div className="text-xs text-muted-foreground">{e.banque}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive" className="text-xs">{e.jours_retard}j</Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-destructive">{formatMontantCompact(e.montant)}</TableCell>
                          </TableRow>
                        ))}
                        {(!stats?.echeances_retard || stats.echeances_retard.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-emerald-600 py-8">
                              <CheckCircle className="h-5 w-5 mx-auto mb-2" />
                              Aucune échéance en retard
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Top Crédits */}
              {dashboard?.top_credits && dashboard.top_credits.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Top crédits actifs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>Crédit</TableHead>
                          <TableHead>Banque</TableHead>
                          <TableHead className="text-right">Montant total</TableHead>
                          <TableHead className="text-right">Remboursé</TableHead>
                          <TableHead>Progression</TableHead>
                          <TableHead>Fin</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboard.top_credits.map((c: any) => (
                          <TableRow key={c.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => navigate(`/credits/${c.id}`)}>
                            <TableCell>
                              <div className="font-medium">{c.numero}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[150px]">{c.objet}</div>
                            </TableCell>
                            <TableCell>{c.banque}</TableCell>
                            <TableCell className="text-right font-semibold">{formatMontantCompact(c.montant_total)}</TableCell>
                            <TableCell className="text-right text-emerald-600">{formatMontantCompact(c.rembourse)}</TableCell>
                            <TableCell>
                              <div className="w-20">
                                <Progress value={c.taux_remboursement} className="h-2" />
                                <span className="text-xs text-muted-foreground">{c.taux_remboursement}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {c.date_fin ? format(new Date(c.date_fin), 'MMM yyyy', { locale: fr }) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* COMPARAISON TAB */}
            <TabsContent value="comparaison" className="space-y-6">
              {/* Totaux annuels */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                  <CardContent className="pt-4">
                    <p className="text-xs text-primary uppercase tracking-wide">Emprunté {selectedAnnee}</p>
                    <p className="text-xl font-bold text-primary">{formatMontantCompact(comparaison?.totaux?.emprunte || 0)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
                  <CardContent className="pt-4">
                    <p className="text-xs text-emerald-600 uppercase tracking-wide">Remboursé {selectedAnnee}</p>
                    <p className="text-xl font-bold text-emerald-600">{formatMontantCompact(comparaison?.totaux?.rembourse || 0)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5">
                  <CardContent className="pt-4">
                    <p className="text-xs text-violet-600 uppercase tracking-wide">Intérêts {selectedAnnee}</p>
                    <p className="text-xl font-bold text-violet-600">{formatMontantCompact(comparaison?.totaux?.interets || 0)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
                  <CardContent className="pt-4">
                    <p className="text-xs text-amber-600 uppercase tracking-wide">Reste global</p>
                    <p className="text-xl font-bold text-amber-600">{formatMontantCompact(comparaison?.totaux?.reste || 0)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Graphique comparatif */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Évolution emprunts vs remboursements {selectedAnnee}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={comparaisonChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="mois_nom" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => formatMontantCompact(v)} tick={{ fontSize: 11 }} />
                      <Tooltip 
                        formatter={(value: number) => formatMontant(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="emprunte" name="Emprunté" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                      <Area type="monotone" dataKey="rembourse" name="Remboursé" stroke="hsl(142 71% 45%)" fill="hsl(142 71% 45%)" fillOpacity={0.3} />
                      <Line type="monotone" dataKey="solde_restant" name="Solde restant" stroke="hsl(38 92% 50%)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Tableau détaillé */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Détail mensuel</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Mois</TableHead>
                        <TableHead className="text-right">Emprunté</TableHead>
                        <TableHead className="text-right">Intérêts</TableHead>
                        <TableHead className="text-right">Remboursé</TableHead>
                        <TableHead className="text-right">Solde restant</TableHead>
                        <TableHead>Évolution</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparaisonChartData.map((mois: any) => {
                        const diff = mois.emprunte - mois.rembourse;
                        return (
                          <TableRow key={mois.mois} className="hover:bg-muted/20">
                            <TableCell className="font-medium">{mois.mois_nom}</TableCell>
                            <TableCell className="text-right text-primary">{formatMontantCompact(mois.emprunte)}</TableCell>
                            <TableCell className="text-right text-violet-600">{formatMontantCompact(mois.interets)}</TableCell>
                            <TableCell className="text-right text-emerald-600">{formatMontantCompact(mois.rembourse)}</TableCell>
                            <TableCell className="text-right font-semibold">{formatMontantCompact(mois.solde_restant)}</TableCell>
                            <TableCell>
                              {diff > 0 ? (
                                <span className="flex items-center text-destructive text-sm">
                                  <ArrowUpRight className="h-4 w-4" />+{formatMontantCompact(diff)}
                                </span>
                              ) : diff < 0 ? (
                                <span className="flex items-center text-emerald-600 text-sm">
                                  <ArrowDownRight className="h-4 w-4" />{formatMontantCompact(Math.abs(diff))}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* DETAILS PAR BANQUE TAB */}
            <TabsContent value="details" className="space-y-4">
              {stats?.par_banque?.map((banque: any) => {
                const isExpanded = expandedBanques.includes(banque.banque_id);
                const creditsOfBanque = credits.filter(c => c.banque?.id === banque.banque_id);
                const tauxRemboursement = banque.total > 0 ? (banque.rembourse / banque.total) * 100 : 0;
                
                return (
                  <Collapsible key={banque.banque_id} open={isExpanded} onOpenChange={() => toggleBanque(banque.banque_id)}>
                    <Card className="shadow-sm">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <Building2 className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <CardTitle className="text-base">{banque.banque_nom}</CardTitle>
                                  <CardDescription>{banque.nombre} crédit(s) actif(s)</CardDescription>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-8">
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Total emprunté</p>
                                <p className="font-bold text-lg">{formatMontantCompact(banque.total)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Remboursé</p>
                                <p className="font-bold text-lg text-emerald-600">{formatMontantCompact(banque.rembourse)}</p>
                              </div>
                              <div className="w-32">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">Progression</span>
                                  <span className="font-medium">{tauxRemboursement.toFixed(0)}%</span>
                                </div>
                                <Progress value={tauxRemboursement} className="h-2" />
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/30">
                                <TableHead>Numéro</TableHead>
                                <TableHead>Objet</TableHead>
                                <TableHead className="text-right">Montant</TableHead>
                                <TableHead className="text-right">Remboursé</TableHead>
                                <TableHead>Progression</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {creditsOfBanque.map(credit => {
                                const rembourse = credit.montant_rembourse || 0;
                                const progression = credit.montant_total > 0 ? (rembourse / credit.montant_total) * 100 : 0;
                                return (
                                  <TableRow key={credit.id} className="hover:bg-muted/20">
                                    <TableCell className="font-medium">{credit.numero}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">{credit.objet}</TableCell>
                                    <TableCell className="text-right">{formatMontantCompact(credit.montant_total)}</TableCell>
                                    <TableCell className="text-right text-emerald-600">{formatMontantCompact(rembourse)}</TableCell>
                                    <TableCell>
                                      <div className="w-20">
                                        <Progress value={progression} className="h-1.5" />
                                        <span className="text-xs text-muted-foreground">{progression.toFixed(0)}%</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>{getStatutBadge(credit.statut)}</TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => navigate(`/credits/${credit.id}`)}>
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                        {credit.statut === 'Actif' && (
                                          <Button variant="ghost" size="icon" className="text-emerald-600" onClick={() => handleRemboursement(credit)}>
                                            <TrendingDown className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
              
              {(!stats?.par_banque || stats.par_banque.length === 0) && (
                <Card className="shadow-sm">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    Aucune donnée par banque disponible
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ECHÉANCIER TAB */}
            <TabsContent value="echeances" className="space-y-4">
              {/* Calendrier */}
              {dashboard?.calendrier_echeances && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                  {dashboard.calendrier_echeances.map((mois: any) => (
                    <Card key={`${mois.mois}-${mois.annee}`} className={`shadow-sm ${mois.nombre > 0 ? 'border-primary/30' : ''}`}>
                      <CardContent className="pt-4 text-center">
                        <p className="text-xs text-muted-foreground uppercase">{mois.periode}</p>
                        <p className="text-2xl font-bold mt-1">{mois.nombre}</p>
                        <p className="text-xs text-muted-foreground">échéance{mois.nombre > 1 ? 's' : ''}</p>
                        {mois.nombre > 0 && (
                          <p className="text-sm font-semibold text-primary mt-2">{formatMontantCompact(mois.montant)}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Liste échéances */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      À venir
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>Date</TableHead>
                          <TableHead>Crédit / Banque</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(stats?.prochaines_echeances || []).map((e: any) => (
                          <TableRow key={e.id}>
                            <TableCell className="font-medium">
                              {e.date_echeance ? format(new Date(e.date_echeance), 'dd/MM/yyyy', { locale: fr }) : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">{e.credit_numero}</div>
                              <div className="text-xs text-muted-foreground">{e.banque}</div>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{formatMontantCompact(e.montant)}</TableCell>
                            <TableCell>{getEcheanceStatutBadge(e.statut)}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                onClick={() => handlePayerEcheance(e)}
                              >
                                <Wallet className="h-3 w-3 mr-1" />
                                Payer
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!stats?.prochaines_echeances || stats.prochaines_echeances.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              Aucune échéance à venir
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className={`shadow-sm ${(stats?.echeances_retard?.length || 0) > 0 ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      En retard ({stats?.echeances_retard?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>Date</TableHead>
                          <TableHead>Crédit / Banque</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead>Retard</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(stats?.echeances_retard || []).map((e: any) => (
                          <TableRow key={e.id} className="bg-destructive/5">
                            <TableCell className="font-medium text-destructive">
                              {e.date_echeance ? format(new Date(e.date_echeance), 'dd/MM/yyyy', { locale: fr }) : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">{e.credit_numero}</div>
                              <div className="text-xs text-muted-foreground">{e.banque}</div>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-destructive">{formatMontantCompact(e.montant)}</TableCell>
                            <TableCell>
                              <Badge variant="destructive">{e.jours_retard}j</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handlePayerEcheance(e)}
                              >
                                <Wallet className="h-3 w-3 mr-1" />
                                Régulariser
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!stats?.echeances_retard || stats.echeances_retard.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                              <p className="text-emerald-600 font-medium">Aucune échéance en retard</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* LISTE COMPLETE TAB */}
            <TabsContent value="liste" className="space-y-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Tous les crédits ({creditsFiltres.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Numéro</TableHead>
                        <TableHead>Banque</TableHead>
                        <TableHead>Objet</TableHead>
                        <TableHead className="text-right">Montant total</TableHead>
                        <TableHead className="text-right">Remboursé</TableHead>
                        <TableHead>Progression</TableHead>
                        <TableHead>Période</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {creditsFiltres.map((credit) => {
                        const rembourse = credit.montant_rembourse || 0;
                        const progression = credit.montant_total > 0 ? (rembourse / credit.montant_total) * 100 : 0;
                        return (
                          <TableRow key={credit.id} className="hover:bg-muted/20">
                            <TableCell className="font-medium">{credit.numero}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-primary" />
                                {credit.banque?.nom || '-'}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">{credit.objet}</TableCell>
                            <TableCell className="text-right font-semibold">{formatMontantCompact(credit.montant_total)}</TableCell>
                            <TableCell className="text-right text-emerald-600">{formatMontantCompact(rembourse)}</TableCell>
                            <TableCell>
                              <div className="w-24">
                                <Progress value={progression} className="h-2" />
                                <p className="text-xs text-muted-foreground mt-1">{progression.toFixed(0)}%</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div>{credit.date_debut ? format(new Date(credit.date_debut), 'MMM yyyy', { locale: fr }) : '-'}</div>
                              <div className="text-xs text-muted-foreground">→ {credit.date_fin ? format(new Date(credit.date_fin), 'MMM yyyy', { locale: fr }) : '-'}</div>
                            </TableCell>
                            <TableCell>{getStatutBadge(credit.statut)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => navigate(`/credits/${credit.id}`)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {credit.statut === 'Actif' && (
                                  <Button variant="ghost" size="icon" className="text-emerald-600" onClick={() => handleRemboursement(credit)}>
                                    <TrendingDown className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {creditsFiltres.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                            Aucun crédit trouvé
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>

      <NouveauCreditModal open={showNouveauModal} onOpenChange={setShowNouveauModal} />
      {selectedCredit && (
        <RemboursementCreditModal 
          open={showRemboursementModal} 
          onOpenChange={(open) => {
            setShowRemboursementModal(open);
            if (!open) {
              setSelectedCredit(null);
              setSelectedEcheance(null);
            }
          }} 
          credit={selectedCredit}
          echeance={selectedEcheance}
        />
      )}
    </MainLayout>
  );
}
