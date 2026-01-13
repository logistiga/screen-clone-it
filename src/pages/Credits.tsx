import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  AlertTriangle, CheckCircle, Clock, History, BarChart3, Target, Bell, ChevronDown,
  ChevronRight, RefreshCw, PieChart, ArrowUpRight, ArrowDownRight, Loader2
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { NouveauCreditModal } from "@/components/NouveauCreditModal";
import { RemboursementCreditModal } from "@/components/RemboursementCreditModal";
import { useCredits, useCreditStats, useCreditDashboard, useCreditComparaison } from "@/hooks/use-credits";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function CreditsPage() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  
  const [selectedAnnee, setSelectedAnnee] = useState(currentYear);
  const [showNouveauModal, setShowNouveauModal] = useState(false);
  const [showRemboursementModal, setShowRemboursementModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<any>(null);
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [expandedBanques, setExpandedBanques] = useState<number[]>([]);

  // Data fetching
  const { data: creditsData, isLoading: loadingCredits } = useCredits({ per_page: 100 });
  const { data: stats, isLoading: loadingStats } = useCreditStats(selectedAnnee);
  const { data: dashboard, isLoading: loadingDashboard } = useCreditDashboard(selectedAnnee);
  const { data: comparaison, isLoading: loadingComparaison } = useCreditComparaison(selectedAnnee);

  const credits = creditsData?.data || [];
  const isLoading = loadingCredits || loadingStats;

  const creditsFiltres = credits.filter(credit => 
    filterStatut === "all" || credit.statut.toLowerCase() === filterStatut.toLowerCase()
  );

  const formatMontant = (montant: number) => {
    if (montant >= 1000000000) return (montant / 1000000000).toFixed(1) + 'Mrd';
    if (montant >= 1000000) return (montant / 1000000).toFixed(1) + 'M';
    if (montant >= 1000) return (montant / 1000).toFixed(0) + 'K';
    return montant.toLocaleString('fr-FR');
  };

  const getStatutBadge = (statut: string) => {
    switch (statut.toLowerCase()) {
      case 'actif': return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Actif</Badge>;
      case 'soldé': case 'solde': return <Badge className="bg-green-100 text-green-700 border-green-200">Soldé</Badge>;
      case 'en défaut': case 'en_defaut': return <Badge variant="destructive">En défaut</Badge>;
      default: return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getEcheanceStatutBadge = (statut: string, joursRetard?: number) => {
    switch (statut.toLowerCase()) {
      case 'payée': case 'payee': return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Payée</Badge>;
      case 'en attente': case 'a_payer': return <Badge variant="outline" className="border-orange-400 text-orange-600"><Clock className="h-3 w-3 mr-1" />À payer</Badge>;
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

  const handleRemboursement = (credit: any) => {
    setSelectedCredit(credit);
    setShowRemboursementModal(true);
  };

  // Prepare chart data
  const evolutionChartData = stats?.evolution_mensuelle || [];
  const comparaisonChartData = comparaison?.par_mois || [];
  
  const pieData = stats?.par_banque?.map((b: any, index: number) => ({
    name: b.banque_nom,
    value: b.total,
    color: COLORS[index % COLORS.length]
  })) || [];

  if (isLoading) {
    return (
      <MainLayout title="Crédits Bancaires">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // État vide
  if (credits.length === 0 && !loadingCredits) {
    return (
      <MainLayout title="Crédits Bancaires">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CreditCard className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Aucun crédit bancaire</h2>
          <p className="text-muted-foreground mb-6 max-w-md">Gérez vos emprunts bancaires, échéances et remboursements.</p>
          <Button onClick={() => setShowNouveauModal(true)}><Plus className="h-4 w-4 mr-2" />Nouveau crédit</Button>
        </div>
        <NouveauCreditModal open={showNouveauModal} onOpenChange={setShowNouveauModal} />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Crédits Bancaires">
      {/* Header avec filtres */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Select value={selectedAnnee.toString()} onValueChange={(v) => setSelectedAnnee(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatut} onValueChange={setFilterStatut}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="actif">Actifs</SelectItem>
              <SelectItem value="soldé">Soldés</SelectItem>
              <SelectItem value="en défaut">En défaut</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowNouveauModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />Nouveau crédit
        </Button>
      </div>

      {/* Dashboard KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total emprunté</p>
                <p className="text-2xl font-bold text-blue-600">{formatMontant(stats?.total_credits_actifs || 0)}</p>
                <p className="text-xs text-muted-foreground">{stats?.nombre_credits_actifs || 0} crédits actifs</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total remboursé</p>
                <p className="text-2xl font-bold text-green-600">{formatMontant(stats?.total_rembourse || 0)}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  {stats?.taux_remboursement_global?.toFixed(1) || 0}% du total
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-50">
                <TrendingDown className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Reste à payer</p>
                <p className="text-2xl font-bold text-orange-600">{formatMontant(stats?.reste_global || 0)}</p>
                <Progress 
                  value={stats?.taux_remboursement_global || 0} 
                  className="h-1.5 mt-2" 
                />
              </div>
              <div className="p-3 rounded-xl bg-orange-50">
                <Wallet className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total intérêts</p>
                <p className="text-2xl font-bold text-purple-600">{formatMontant(stats?.total_interets || 0)}</p>
                <p className="text-xs text-muted-foreground">Coût du financement</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${(stats?.echeances_en_retard || 0) > 0 ? 'border-l-red-500' : 'border-l-gray-300'}`}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Échéances retard</p>
                <p className={`text-2xl font-bold ${(stats?.echeances_en_retard || 0) > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {stats?.echeances_en_retard || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(stats?.echeances_en_retard || 0) > 0 ? 'Action requise' : 'Tout est à jour'}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${(stats?.echeances_en_retard || 0) > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                <AlertTriangle className={`h-6 w-6 ${(stats?.echeances_en_retard || 0) > 0 ? 'text-red-600' : 'text-gray-400'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
            <Card>
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
                    <YAxis tickFormatter={(v) => formatMontant(v)} tick={{ fontSize: 11 }} />
                    <Tooltip 
                      formatter={(value: number) => value.toLocaleString('fr-FR') + ' FCFA'}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="emprunte" name="Emprunté" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rembourse" name="Remboursé" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Répartition par banque */}
            <Card>
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
                    <Tooltip formatter={(value: number) => value.toLocaleString('fr-FR') + ' FCFA'} />
                  </RechartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Prochaines échéances & Alertes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
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
                        <TableCell className="text-right font-semibold">{formatMontant(e.montant)}</TableCell>
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

            <Card className={(stats?.echeances_retard?.length || 0) > 0 ? 'border-red-200' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${(stats?.echeances_retard?.length || 0) > 0 ? 'text-red-600' : 'text-gray-400'}`} />
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
                      <TableRow key={e.id} className="hover:bg-red-50/50">
                        <TableCell className="font-medium text-red-600">
                          {e.date_echeance ? format(new Date(e.date_echeance), 'dd/MM', { locale: fr }) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{e.credit_numero}</div>
                          <div className="text-xs text-muted-foreground">{e.banque}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="text-xs">{e.jours_retard}j</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-600">{formatMontant(e.montant)}</TableCell>
                      </TableRow>
                    ))}
                    {(!stats?.echeances_retard || stats.echeances_retard.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-green-600 py-8">
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
            <Card>
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
                        <TableCell className="text-right font-semibold">{formatMontant(c.montant_total)}</TableCell>
                        <TableCell className="text-right text-green-600">{formatMontant(c.rembourse)}</TableCell>
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
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50">
              <CardContent className="pt-4">
                <p className="text-xs text-blue-600 uppercase tracking-wide">Emprunté {selectedAnnee}</p>
                <p className="text-xl font-bold text-blue-700">{formatMontant(comparaison?.totaux?.emprunte || 0)}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100/50">
              <CardContent className="pt-4">
                <p className="text-xs text-green-600 uppercase tracking-wide">Remboursé {selectedAnnee}</p>
                <p className="text-xl font-bold text-green-700">{formatMontant(comparaison?.totaux?.rembourse || 0)}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50">
              <CardContent className="pt-4">
                <p className="text-xs text-purple-600 uppercase tracking-wide">Intérêts {selectedAnnee}</p>
                <p className="text-xl font-bold text-purple-700">{formatMontant(comparaison?.totaux?.interets || 0)}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50">
              <CardContent className="pt-4">
                <p className="text-xs text-orange-600 uppercase tracking-wide">Reste global</p>
                <p className="text-xl font-bold text-orange-700">{formatMontant(comparaison?.totaux?.reste || 0)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Graphique comparatif */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Évolution emprunts vs remboursements {selectedAnnee}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={comparaisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mois_nom" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => formatMontant(v)} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    formatter={(value: number) => value.toLocaleString('fr-FR') + ' FCFA'}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="emprunte" name="Emprunté" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="rembourse" name="Remboursé" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  <Line type="monotone" dataKey="solde_restant" name="Solde restant" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tableau détaillé */}
          <Card>
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
                  {comparaisonChartData.map((mois: any, index: number) => {
                    const diff = mois.emprunte - mois.rembourse;
                    return (
                      <TableRow key={mois.mois} className="hover:bg-muted/20">
                        <TableCell className="font-medium">{mois.mois_nom}</TableCell>
                        <TableCell className="text-right text-blue-600">{formatMontant(mois.emprunte)}</TableCell>
                        <TableCell className="text-right text-purple-600">{formatMontant(mois.interets)}</TableCell>
                        <TableCell className="text-right text-green-600">{formatMontant(mois.rembourse)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatMontant(mois.solde_restant)}</TableCell>
                        <TableCell>
                          {diff > 0 ? (
                            <span className="flex items-center text-red-600 text-sm">
                              <ArrowUpRight className="h-4 w-4" />+{formatMontant(diff)}
                            </span>
                          ) : diff < 0 ? (
                            <span className="flex items-center text-green-600 text-sm">
                              <ArrowDownRight className="h-4 w-4" />{formatMontant(Math.abs(diff))}
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
                <Card>
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
                            <p className="font-bold text-lg">{formatMontant(banque.total)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Remboursé</p>
                            <p className="font-bold text-lg text-green-600">{formatMontant(banque.rembourse)}</p>
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
                            const reste = (credit.montant_total || 0) - rembourse;
                            const progression = credit.montant_total > 0 ? (rembourse / credit.montant_total) * 100 : 0;
                            return (
                              <TableRow key={credit.id} className="hover:bg-muted/20">
                                <TableCell className="font-medium">{credit.numero}</TableCell>
                                <TableCell className="max-w-[200px] truncate">{credit.objet}</TableCell>
                                <TableCell className="text-right">{formatMontant(credit.montant_total)}</TableCell>
                                <TableCell className="text-right text-green-600">{formatMontant(rembourse)}</TableCell>
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
                                      <Button variant="ghost" size="icon" className="text-green-600" onClick={() => handleRemboursement(credit)}>
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
            <Card>
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
                <Card key={`${mois.mois}-${mois.annee}`} className={mois.nombre > 0 ? 'border-primary/30' : ''}>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-muted-foreground uppercase">{mois.periode}</p>
                    <p className="text-2xl font-bold mt-1">{mois.nombre}</p>
                    <p className="text-xs text-muted-foreground">échéance{mois.nombre > 1 ? 's' : ''}</p>
                    {mois.nombre > 0 && (
                      <p className="text-sm font-semibold text-primary mt-2">{formatMontant(mois.montant)}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Liste échéances */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
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
                        <TableCell className="text-right font-semibold">{formatMontant(e.montant)}</TableCell>
                        <TableCell>{getEcheanceStatutBadge(e.statut)}</TableCell>
                      </TableRow>
                    ))}
                    {(!stats?.prochaines_echeances || stats.prochaines_echeances.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Aucune échéance à venir
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className={(stats?.echeances_retard?.length || 0) > 0 ? 'border-red-200 bg-red-50/30' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(stats?.echeances_retard || []).map((e: any) => (
                      <TableRow key={e.id} className="bg-red-50/50">
                        <TableCell className="font-medium text-red-700">
                          {e.date_echeance ? format(new Date(e.date_echeance), 'dd/MM/yyyy', { locale: fr }) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{e.credit_numero}</div>
                          <div className="text-xs text-muted-foreground">{e.banque}</div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-700">{formatMontant(e.montant)}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{e.jours_retard}j</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!stats?.echeances_retard || stats.echeances_retard.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          <p className="text-green-600 font-medium">Aucune échéance en retard</p>
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
          <Card>
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
                        <TableCell className="text-right font-semibold">{formatMontant(credit.montant_total)}</TableCell>
                        <TableCell className="text-right text-green-600">{formatMontant(rembourse)}</TableCell>
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
                              <Button variant="ghost" size="icon" className="text-green-600" onClick={() => handleRemboursement(credit)}>
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

      <NouveauCreditModal open={showNouveauModal} onOpenChange={setShowNouveauModal} />
      {selectedCredit && (
        <RemboursementCreditModal 
          open={showRemboursementModal} 
          onOpenChange={setShowRemboursementModal} 
          credit={selectedCredit} 
        />
      )}
    </MainLayout>
  );
}
