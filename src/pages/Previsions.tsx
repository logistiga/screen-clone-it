import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, Target, TrendingUp, TrendingDown, Wallet, Building2, 
  BarChart3, PieChart, RefreshCw, Trash2, Edit2, CheckCircle2, 
  XCircle, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight,
  ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { NouvellePrevisionModal } from "@/components/NouvellePrevisionModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  usePrevisions,
  usePrevisionStats,
  usePrevisionComparaison,
  useDeletePrevision,
  useSyncPrevisionRealise,
} from "@/hooks/use-previsions";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart as RechartPieChart, Pie, Cell } from 'recharts';

export default function PrevisionsPage() {
  const currentDate = new Date();
  const [annee, setAnnee] = useState(currentDate.getFullYear());
  const [mois, setMois] = useState<number | undefined>();
  const [source, setSource] = useState<string | undefined>();
  const [showNouvelleModal, setShowNouvelleModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const { data: previsionsData, isLoading: loadingPrevisions } = usePrevisions({ 
    annee, 
    per_page: 100 
  });
  const { data: stats, isLoading: loadingStats } = usePrevisionStats(annee);
  const { data: comparaison, isLoading: loadingComparaison } = usePrevisionComparaison(annee);
  const deleteMutation = useDeletePrevision();
  const syncMutation = useSyncPrevisionRealise();

  const previsions = previsionsData?.data || [];

  const formatMontant = (montant: number) => {
    if (montant >= 1000000) return (montant / 1000000).toFixed(1) + 'M';
    if (montant >= 1000) return (montant / 1000).toFixed(0) + 'K';
    return montant.toLocaleString('fr-FR');
  };

  const formatMontantFull = (montant: number) => {
    return montant.toLocaleString('fr-FR') + ' FCFA';
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'en_cours': return <Badge variant="outline" className="border-blue-500 text-blue-600"><Clock className="h-3 w-3 mr-1" />En cours</Badge>;
      case 'atteint': return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Atteint</Badge>;
      case 'depasse': return <Badge className="bg-purple-600"><ArrowUpRight className="h-3 w-3 mr-1" />Dépassé</Badge>;
      case 'non_atteint': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Non atteint</Badge>;
      default: return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getTauxColor = (taux: number) => {
    if (taux >= 100) return 'text-green-600';
    if (taux >= 75) return 'text-blue-600';
    if (taux >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressColor = (taux: number) => {
    if (taux >= 100) return 'bg-green-500';
    if (taux >= 75) return 'bg-blue-500';
    if (taux >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleSync = async () => {
    const currentMois = mois || currentDate.getMonth() + 1;
    await syncMutation.mutateAsync({ annee, mois: currentMois });
  };

  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette prévision ?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // Données pour les graphiques
  const chartDataMensuel = comparaison?.comparaison?.map(c => ({
    mois: c.mois_nom.substring(0, 3),
    recettes_prevues: c.recettes.caisse.prevu + c.recettes.banque.prevu,
    recettes_realisees: c.recettes.caisse.realise + c.recettes.banque.realise,
    depenses_prevues: c.depenses.caisse.prevu + c.depenses.banque.prevu,
    depenses_realisees: c.depenses.caisse.realise + c.depenses.banque.realise,
  })) || [];

  const pieDataRecettes = [
    { name: 'Caisse Prévu', value: stats?.stats.recettes.caisse.prevu || 0, color: '#22c55e' },
    { name: 'Caisse Réalisé', value: stats?.stats.recettes.caisse.realise || 0, color: '#16a34a' },
    { name: 'Banque Prévu', value: stats?.stats.recettes.banque.prevu || 0, color: '#3b82f6' },
    { name: 'Banque Réalisé', value: stats?.stats.recettes.banque.realise || 0, color: '#2563eb' },
  ].filter(d => d.value > 0);

  const pieDataDepenses = [
    { name: 'Caisse Prévu', value: stats?.stats.depenses.caisse.prevu || 0, color: '#f97316' },
    { name: 'Caisse Réalisé', value: stats?.stats.depenses.caisse.realise || 0, color: '#ea580c' },
    { name: 'Banque Prévu', value: stats?.stats.depenses.banque.prevu || 0, color: '#ef4444' },
    { name: 'Banque Réalisé', value: stats?.stats.depenses.banque.realise || 0, color: '#dc2626' },
  ].filter(d => d.value > 0);

  const moisOptions = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' },
  ];

  const anneeOptions = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  // Calcul totaux
  const totalRecettesPrevu = (stats?.stats.recettes.caisse.prevu || 0) + (stats?.stats.recettes.banque.prevu || 0);
  const totalRecettesRealise = (stats?.stats.recettes.caisse.realise || 0) + (stats?.stats.recettes.banque.realise || 0);
  const totalDepensesPrevu = (stats?.stats.depenses.caisse.prevu || 0) + (stats?.stats.depenses.banque.prevu || 0);
  const totalDepensesRealise = (stats?.stats.depenses.caisse.realise || 0) + (stats?.stats.depenses.banque.realise || 0);
  const soldePrevu = totalRecettesPrevu - totalDepensesPrevu;
  const soldeRealise = totalRecettesRealise - totalDepensesRealise;

  if (loadingStats) {
    return (
      <MainLayout title="Prévisions budgétaires">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Prévisions budgétaires">
      {/* Filtres et actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          <Select value={annee.toString()} onValueChange={(v) => setAnnee(parseInt(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anneeOptions.map(a => (
                <SelectItem key={a} value={a.toString()}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={source || "all"} onValueChange={(v) => setSource(v === "all" ? undefined : v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Toutes sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes sources</SelectItem>
              <SelectItem value="caisse">Caisse</SelectItem>
              <SelectItem value="banque">Banque</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSync} disabled={syncMutation.isPending}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Synchroniser
          </Button>
          <Button onClick={() => setShowNouvelleModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle prévision
          </Button>
        </div>
      </div>

      {/* Dashboard KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recettes prévues</p>
                <p className="text-2xl font-bold text-green-600">{formatMontant(totalRecettesPrevu)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">Réalisé:</span>
                  <span className="text-sm font-medium">{formatMontant(totalRecettesRealise)}</span>
                  <span className={`text-xs ${getTauxColor(totalRecettesPrevu > 0 ? (totalRecettesRealise / totalRecettesPrevu) * 100 : 0)}`}>
                    ({totalRecettesPrevu > 0 ? Math.round((totalRecettesRealise / totalRecettesPrevu) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dépenses prévues</p>
                <p className="text-2xl font-bold text-red-600">{formatMontant(totalDepensesPrevu)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">Réalisé:</span>
                  <span className="text-sm font-medium">{formatMontant(totalDepensesRealise)}</span>
                  <span className={`text-xs ${getTauxColor(totalDepensesPrevu > 0 ? (totalDepensesRealise / totalDepensesPrevu) * 100 : 0)}`}>
                    ({totalDepensesPrevu > 0 ? Math.round((totalDepensesRealise / totalDepensesPrevu) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Solde prévisionnel</p>
                <p className={`text-2xl font-bold ${soldePrevu >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatMontant(soldePrevu)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">Réel:</span>
                  <span className={`text-sm font-medium ${soldeRealise >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatMontant(soldeRealise)}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux global</p>
                <p className={`text-2xl font-bold ${getTauxColor(stats?.taux_global || 0)}`}>
                  {stats?.taux_global || 0}%
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                    {stats?.compteurs.atteint || 0}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1 text-blue-500" />
                    {stats?.compteurs.en_cours || 0}
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Détails Caisse vs Banque */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5 text-orange-600" />
              Caisse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Recettes</p>
                  <p className="font-semibold">Prévu: {formatMontant(stats?.stats.recettes.caisse.prevu || 0)}</p>
                  <p className="text-sm text-green-600">Réalisé: {formatMontant(stats?.stats.recettes.caisse.realise || 0)}</p>
                </div>
                <div className="text-right">
                  <Progress 
                    value={stats?.stats.recettes.caisse.prevu ? 
                      Math.min(100, (stats.stats.recettes.caisse.realise / stats.stats.recettes.caisse.prevu) * 100) : 0} 
                    className="w-20 h-2"
                  />
                  <p className={`text-sm font-medium mt-1 ${getTauxColor(
                    stats?.stats.recettes.caisse.prevu ? 
                    (stats.stats.recettes.caisse.realise / stats.stats.recettes.caisse.prevu) * 100 : 0
                  )}`}>
                    {stats?.stats.recettes.caisse.prevu ? 
                      Math.round((stats.stats.recettes.caisse.realise / stats.stats.recettes.caisse.prevu) * 100) : 0}%
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Dépenses</p>
                  <p className="font-semibold">Prévu: {formatMontant(stats?.stats.depenses.caisse.prevu || 0)}</p>
                  <p className="text-sm text-red-600">Réalisé: {formatMontant(stats?.stats.depenses.caisse.realise || 0)}</p>
                </div>
                <div className="text-right">
                  <Progress 
                    value={stats?.stats.depenses.caisse.prevu ? 
                      Math.min(100, (stats.stats.depenses.caisse.realise / stats.stats.depenses.caisse.prevu) * 100) : 0} 
                    className="w-20 h-2"
                  />
                  <p className={`text-sm font-medium mt-1 ${getTauxColor(
                    stats?.stats.depenses.caisse.prevu ? 
                    (stats.stats.depenses.caisse.realise / stats.stats.depenses.caisse.prevu) * 100 : 0
                  )}`}>
                    {stats?.stats.depenses.caisse.prevu ? 
                      Math.round((stats.stats.depenses.caisse.realise / stats.stats.depenses.caisse.prevu) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
              Banque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Recettes</p>
                  <p className="font-semibold">Prévu: {formatMontant(stats?.stats.recettes.banque.prevu || 0)}</p>
                  <p className="text-sm text-green-600">Réalisé: {formatMontant(stats?.stats.recettes.banque.realise || 0)}</p>
                </div>
                <div className="text-right">
                  <Progress 
                    value={stats?.stats.recettes.banque.prevu ? 
                      Math.min(100, (stats.stats.recettes.banque.realise / stats.stats.recettes.banque.prevu) * 100) : 0} 
                    className="w-20 h-2"
                  />
                  <p className={`text-sm font-medium mt-1 ${getTauxColor(
                    stats?.stats.recettes.banque.prevu ? 
                    (stats.stats.recettes.banque.realise / stats.stats.recettes.banque.prevu) * 100 : 0
                  )}`}>
                    {stats?.stats.recettes.banque.prevu ? 
                      Math.round((stats.stats.recettes.banque.realise / stats.stats.recettes.banque.prevu) * 100) : 0}%
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Dépenses</p>
                  <p className="font-semibold">Prévu: {formatMontant(stats?.stats.depenses.banque.prevu || 0)}</p>
                  <p className="text-sm text-red-600">Réalisé: {formatMontant(stats?.stats.depenses.banque.realise || 0)}</p>
                </div>
                <div className="text-right">
                  <Progress 
                    value={stats?.stats.depenses.banque.prevu ? 
                      Math.min(100, (stats.stats.depenses.banque.realise / stats.stats.depenses.banque.prevu) * 100) : 0} 
                    className="w-20 h-2"
                  />
                  <p className={`text-sm font-medium mt-1 ${getTauxColor(
                    stats?.stats.depenses.banque.prevu ? 
                    (stats.stats.depenses.banque.realise / stats.stats.depenses.banque.prevu) * 100 : 0
                  )}`}>
                    {stats?.stats.depenses.banque.prevu ? 
                      Math.round((stats.stats.depenses.banque.realise / stats.stats.depenses.banque.prevu) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="comparaison" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="comparaison">
            <BarChart3 className="h-4 w-4 mr-1" />
            Comparaison
          </TabsTrigger>
          <TabsTrigger value="details">
            <PieChart className="h-4 w-4 mr-1" />
            Détails
          </TabsTrigger>
          <TabsTrigger value="liste">
            Liste ({previsions.length})
          </TabsTrigger>
        </TabsList>

        {/* Onglet Comparaison */}
        <TabsContent value="comparaison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution mensuelle - Prévu vs Réalisé</CardTitle>
              <CardDescription>Comparaison des recettes et dépenses par mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataMensuel}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis tickFormatter={(v) => formatMontant(v)} />
                    <Tooltip 
                      formatter={(value: number) => formatMontantFull(value)}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Legend />
                    <Bar dataKey="recettes_prevues" name="Recettes prévues" fill="#86efac" />
                    <Bar dataKey="recettes_realisees" name="Recettes réalisées" fill="#22c55e" />
                    <Bar dataKey="depenses_prevues" name="Dépenses prévues" fill="#fca5a5" />
                    <Bar dataKey="depenses_realisees" name="Dépenses réalisées" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Tableau de comparaison mensuelle */}
          <Card>
            <CardHeader>
              <CardTitle>Tableau comparatif mensuel</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Mois</TableHead>
                      <TableHead className="text-center text-green-600" colSpan={2}>Recettes</TableHead>
                      <TableHead className="text-center text-red-600" colSpan={2}>Dépenses</TableHead>
                      <TableHead className="text-right">Solde</TableHead>
                    </TableRow>
                    <TableRow className="bg-muted/30">
                      <TableHead></TableHead>
                      <TableHead className="text-center text-xs">Prévu</TableHead>
                      <TableHead className="text-center text-xs">Réalisé</TableHead>
                      <TableHead className="text-center text-xs">Prévu</TableHead>
                      <TableHead className="text-center text-xs">Réalisé</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparaison?.comparaison?.map((c) => {
                      const recP = c.recettes.caisse.prevu + c.recettes.banque.prevu;
                      const recR = c.recettes.caisse.realise + c.recettes.banque.realise;
                      const depP = c.depenses.caisse.prevu + c.depenses.banque.prevu;
                      const depR = c.depenses.caisse.realise + c.depenses.banque.realise;
                      const solde = recR - depR;
                      
                      return (
                        <TableRow key={c.mois}>
                          <TableCell className="font-medium">{c.mois_nom}</TableCell>
                          <TableCell className="text-center">{formatMontant(recP)}</TableCell>
                          <TableCell className="text-center text-green-600 font-medium">{formatMontant(recR)}</TableCell>
                          <TableCell className="text-center">{formatMontant(depP)}</TableCell>
                          <TableCell className="text-center text-red-600 font-medium">{formatMontant(depR)}</TableCell>
                          <TableCell className={`text-right font-bold ${solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatMontant(solde)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Détails par catégorie */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Par catégorie - Recettes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recettes par catégorie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.par_categorie
                    ?.filter(c => c.type === 'recette')
                    .map((cat, i) => {
                      const taux = cat.prevu > 0 ? (cat.realise / cat.prevu) * 100 : 0;
                      return (
                        <Collapsible 
                          key={i} 
                          open={expandedCategories.includes(`rec-${cat.categorie}`)}
                          onOpenChange={() => toggleCategory(`rec-${cat.categorie}`)}
                        >
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{cat.source}</Badge>
                                <span className="font-medium">{cat.categorie}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${getTauxColor(taux)}`}>{Math.round(taux)}%</span>
                                {expandedCategories.includes(`rec-${cat.categorie}`) ? 
                                  <ChevronUp className="h-4 w-4" /> : 
                                  <ChevronDown className="h-4 w-4" />
                                }
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-3 bg-muted/20 rounded-b-lg space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Prévu:</span>
                                <span>{formatMontantFull(cat.prevu)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Réalisé:</span>
                                <span className="text-green-600 font-medium">{formatMontantFull(cat.realise)}</span>
                              </div>
                              <Progress value={Math.min(100, taux)} className="h-2" />
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  {(!stats?.par_categorie || stats.par_categorie.filter(c => c.type === 'recette').length === 0) && (
                    <p className="text-center text-muted-foreground py-4">Aucune prévision de recette</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Par catégorie - Dépenses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Dépenses par catégorie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.par_categorie
                    ?.filter(c => c.type === 'depense')
                    .map((cat, i) => {
                      const taux = cat.prevu > 0 ? (cat.realise / cat.prevu) * 100 : 0;
                      return (
                        <Collapsible 
                          key={i} 
                          open={expandedCategories.includes(`dep-${cat.categorie}`)}
                          onOpenChange={() => toggleCategory(`dep-${cat.categorie}`)}
                        >
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{cat.source}</Badge>
                                <span className="font-medium">{cat.categorie}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${taux > 100 ? 'text-red-600' : getTauxColor(taux)}`}>
                                  {Math.round(taux)}%
                                </span>
                                {expandedCategories.includes(`dep-${cat.categorie}`) ? 
                                  <ChevronUp className="h-4 w-4" /> : 
                                  <ChevronDown className="h-4 w-4" />
                                }
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-3 bg-muted/20 rounded-b-lg space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Prévu:</span>
                                <span>{formatMontantFull(cat.prevu)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Réalisé:</span>
                                <span className="text-red-600 font-medium">{formatMontantFull(cat.realise)}</span>
                              </div>
                              <Progress value={Math.min(100, taux)} className="h-2" />
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  {(!stats?.par_categorie || stats.par_categorie.filter(c => c.type === 'depense').length === 0) && (
                    <p className="text-center text-muted-foreground py-4">Aucune prévision de dépense</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Liste */}
        <TabsContent value="liste" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Liste des prévisions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Période</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Prévu</TableHead>
                    <TableHead className="text-right">Réalisé</TableHead>
                    <TableHead className="text-center">Taux</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previsions.map((prev) => (
                    <TableRow key={prev.id}>
                      <TableCell className="font-medium">{prev.periode}</TableCell>
                      <TableCell>
                        {prev.type === 'recette' ? (
                          <Badge className="bg-green-100 text-green-800">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Recette
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Dépense
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {prev.source === 'caisse' ? (
                          <span className="flex items-center gap-1">
                            <Wallet className="h-3 w-3 text-orange-600" />
                            Caisse
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-blue-600" />
                            Banque
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{prev.categorie}</TableCell>
                      <TableCell className="text-right">{formatMontant(prev.montant_prevu)}</TableCell>
                      <TableCell className="text-right font-medium">{formatMontant(prev.montant_realise)}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${getTauxColor(prev.taux_realisation)}`}>
                          {prev.taux_realisation}%
                        </span>
                      </TableCell>
                      <TableCell>{getStatutBadge(prev.statut)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(prev.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {previsions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                        Aucune prévision pour cette période
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NouvellePrevisionModal open={showNouvelleModal} onOpenChange={setShowNouvelleModal} />
    </MainLayout>
  );
}
