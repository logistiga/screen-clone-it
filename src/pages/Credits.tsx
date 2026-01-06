import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Building2,
  Calendar,
  TrendingDown,
  TrendingUp,
  Wallet,
  Eye,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  History,
  Download,
  Edit,
  BarChart3,
  Target,
  Bell,
  File,
  Lightbulb,
  ArrowUpRight,
  RotateCcw
} from "lucide-react";
import { 
  creditsBancaires, 
  echeancesCredits, 
  remboursementsCredits,
  modificationsCredits,
  previsionsInvestissements,
  documentsCredits,
  alertesCredits,
  banques,
  utilisateurs,
  CreditBancaire,
  EcheanceCredit
} from "@/data/mockData";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { NouveauCreditModal } from "@/components/NouveauCreditModal";
import { RemboursementCreditModal } from "@/components/RemboursementCreditModal";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from "recharts";

export default function CreditsPage() {
  const navigate = useNavigate();
  const [showNouveauModal, setShowNouveauModal] = useState(false);
  const [showRemboursementModal, setShowRemboursementModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<CreditBancaire | null>(null);
  const [selectedEcheance, setSelectedEcheance] = useState<EcheanceCredit | undefined>(undefined);
  const [filterBanque, setFilterBanque] = useState<string>("all");
  const [filterStatut, setFilterStatut] = useState<string>("all");

  // Enrichir les crédits avec les données de banque
  const creditsEnrichis = creditsBancaires.map(credit => ({
    ...credit,
    banque: banques.find(b => b.id === credit.banqueId)
  }));

  // Calculs globaux
  const creditsActifs = creditsEnrichis.filter(c => c.statut === 'actif');
  const creditsTermines = creditsEnrichis.filter(c => c.statut === 'termine');
  const totalEmprunte = creditsActifs.reduce((sum, c) => sum + c.montantEmprunte, 0);
  const totalRembourse = creditsActifs.reduce((sum, c) => sum + c.montantRembourse, 0);
  const totalRestant = totalEmprunte - totalRembourse;
  const totalInterets = creditsActifs.reduce((sum, c) => sum + c.totalInterets, 0);
  
  // Stats des crédits terminés
  const totalEmpruteHistorique = creditsTermines.reduce((sum, c) => sum + c.montantEmprunte, 0);
  const totalInteretsPayesHistorique = creditsTermines.reduce((sum, c) => sum + c.totalInterets, 0);

  // Stats prévisions
  const totalPrevisions = previsionsInvestissements.reduce((sum, p) => sum + p.montantEstime, 0);
  const previsionsEnCours = previsionsInvestissements.filter(p => p.statut === 'en_cours').length;

  // Prochaines échéances
  const today = new Date();
  const echeancesAPayer = echeancesCredits
    .filter(e => e.statut === 'a_payer')
    .sort((a, b) => new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime());

  const prochaineMensualite = echeancesAPayer.length > 0 ? echeancesAPayer[0] : null;

  // Alertes non lues
  const alertesNonLues = alertesCredits.filter(a => !a.lu).length;

  // Données pour graphiques
  const dataRemboursementsMensuels = [
    { mois: 'Avr 25', capital: 2430556, interets: 510417, total: 2940973 },
    { mois: 'Mai 25', capital: 2430556, interets: 494011, total: 2924567 },
    { mois: 'Jun 25', capital: 2430556, interets: 477604, total: 2908160 },
    { mois: 'Jul 25', capital: 2430556, interets: 461198, total: 2891754 },
    { mois: 'Aoû 25', capital: 2430556, interets: 444792, total: 2875348 },
    { mois: 'Sep 25', capital: 2430556, interets: 428385, total: 2858941 },
    { mois: 'Oct 25', capital: 2430556, interets: 411979, total: 2842535 },
    { mois: 'Nov 25', capital: 2430556, interets: 395573, total: 2826129 },
    { mois: 'Déc 25', capital: 2430556, interets: 379167, total: 2809723 },
    { mois: 'Jan 26', capital: 2430556, interets: 362760, total: 2793316 }
  ];

  const dataRepartitionBanques = [
    { name: 'BGFI Bank', value: 50000000, color: '#3b82f6' },
    { name: 'UGB', value: 25000000, color: '#10b981' },
    { name: 'Orabank', value: 15000000, color: '#f59e0b' }
  ];

  const dataEvolutionSolde = [
    { mois: 'Mar 25', solde: 75000000 },
    { mois: 'Avr 25', solde: 72569444 },
    { mois: 'Mai 25', solde: 70138889 },
    { mois: 'Jun 25', solde: 67708333 },
    { mois: 'Jul 25', solde: 65277778 },
    { mois: 'Aoû 25', solde: 62847222 },
    { mois: 'Sep 25', solde: 60416667 },
    { mois: 'Oct 25', solde: 57986111 },
    { mois: 'Nov 25', solde: 55555556 },
    { mois: 'Déc 25', solde: 53125000 },
    { mois: 'Jan 26', solde: 50694444 }
  ];

  // Filtrage
  const creditsFiltres = creditsEnrichis.filter(credit => {
    if (filterBanque !== "all" && credit.banqueId !== filterBanque) return false;
    if (filterStatut !== "all" && credit.statut !== filterStatut) return false;
    return true;
  });

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'actif':
        return <Badge variant="default" className="bg-blue-600">Actif</Badge>;
      case 'termine':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Terminé</Badge>;
      case 'en_retard':
        return <Badge variant="destructive">En retard</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getEcheanceStatutBadge = (statut: string) => {
    switch (statut) {
      case 'payee':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Payée</Badge>;
      case 'a_payer':
        return <Badge variant="outline" className="border-orange-500 text-orange-600"><Clock className="h-3 w-3 mr-1" />À payer</Badge>;
      case 'en_retard':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />En retard</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getPrioriteBadge = (priorite: string) => {
    switch (priorite) {
      case 'haute':
        return <Badge variant="destructive">Haute</Badge>;
      case 'moyenne':
        return <Badge variant="outline" className="border-orange-500 text-orange-600">Moyenne</Badge>;
      case 'basse':
        return <Badge variant="secondary">Basse</Badge>;
      default:
        return <Badge variant="outline">{priorite}</Badge>;
    }
  };

  const getStatutPrevisionBadge = (statut: string) => {
    switch (statut) {
      case 'en_attente':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'en_cours':
        return <Badge variant="default" className="bg-blue-600"><TrendingUp className="h-3 w-3 mr-1" />En cours</Badge>;
      case 'approuve':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approuvé</Badge>;
      case 'refuse':
        return <Badge variant="destructive">Refusé</Badge>;
      case 'realise':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Réalisé</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getTypeModificationLabel = (type: string) => {
    const labels: Record<string, string> = {
      'taux': 'Modification de taux',
      'echeance': 'Modification échéance',
      'report': 'Report échéance',
      'renegociation': 'Renégociation',
      'cloture_anticipee': 'Clôture anticipée'
    };
    return labels[type] || type;
  };

  const handleRemboursement = (credit: CreditBancaire, echeance?: EcheanceCredit) => {
    setSelectedCredit(credit);
    setSelectedEcheance(echeance);
    setShowRemboursementModal(true);
  };

  const getProgressColor = (pourcentage: number) => {
    if (pourcentage >= 75) return "bg-green-500";
    if (pourcentage >= 50) return "bg-blue-500";
    if (pourcentage >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  const formatMontant = (montant: number) => (montant / 1000000).toFixed(1) + 'M';

  return (
    <MainLayout title="Crédits Bancaires">
      {/* Dashboard KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total emprunté</p>
                <p className="text-2xl font-bold">{(totalEmprunte / 1000000).toFixed(0)}M</p>
                <p className="text-xs text-muted-foreground">FCFA actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <TrendingDown className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total remboursé</p>
                <p className="text-2xl font-bold">{(totalRembourse / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-green-600">+{((totalRembourse / totalEmprunte) * 100).toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-100">
                <Wallet className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reste à payer</p>
                <p className="text-2xl font-bold">{(totalRestant / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-muted-foreground">FCFA</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-100">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prévisions</p>
                <p className="text-2xl font-bold">{(totalPrevisions / 1000000).toFixed(0)}M</p>
                <p className="text-xs text-purple-600">{previsionsEnCours} en cours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-100">
                <Calendar className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prochaine échéance</p>
                {prochaineMensualite ? (
                  <>
                    <p className="text-2xl font-bold">{(prochaineMensualite.montantTotal / 1000000).toFixed(2)}M</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(prochaineMensualite.dateEcheance), 'dd/MM/yyyy')}
                    </p>
                  </>
                ) : (
                  <p className="text-lg text-muted-foreground">Aucune</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions et filtres */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <select 
            className="border rounded-md px-3 py-2 text-sm"
            value={filterBanque}
            onChange={(e) => setFilterBanque(e.target.value)}
          >
            <option value="all">Toutes les banques</option>
            {banques.map(b => (
              <option key={b.id} value={b.id}>{b.nom}</option>
            ))}
          </select>
          <select 
            className="border rounded-md px-3 py-2 text-sm"
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="actif">Actifs</option>
            <option value="termine">Terminés</option>
            <option value="en_retard">En retard</option>
          </select>
        </div>
        <div className="flex gap-2">
          {alertesNonLues > 0 && (
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              {alertesNonLues} alertes
            </Button>
          )}
          <Button onClick={() => setShowNouveauModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau crédit
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="dashboard">
            <BarChart3 className="h-4 w-4 mr-1" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="credits">Crédits actifs ({creditsActifs.length})</TabsTrigger>
          <TabsTrigger value="echeances">Échéancier</TabsTrigger>
          <TabsTrigger value="revisions">
            <Edit className="h-4 w-4 mr-1" />
            Révisions
          </TabsTrigger>
          <TabsTrigger value="previsions">
            <Lightbulb className="h-4 w-4 mr-1" />
            Prévisions
          </TabsTrigger>
          <TabsTrigger value="historique">
            <History className="h-4 w-4 mr-1" />
            Historique ({creditsTermines.length})
          </TabsTrigger>
          <TabsTrigger value="alertes">
            Alertes
            {alertesNonLues > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{alertesNonLues}</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Onglet Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique remboursements mensuels */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Remboursements mensuels
                </CardTitle>
                <CardDescription>Capital vs Intérêts par mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataRemboursementsMensuels}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mois" fontSize={12} />
                      <YAxis tickFormatter={(v) => formatMontant(v)} fontSize={12} />
                      <Tooltip formatter={(value: number) => value.toLocaleString('fr-FR') + ' FCFA'} />
                      <Legend />
                      <Bar dataKey="capital" name="Capital" fill="#3b82f6" stackId="a" />
                      <Bar dataKey="interets" name="Intérêts" fill="#f59e0b" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Graphique répartition par banque */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Répartition par banque
                </CardTitle>
                <CardDescription>Encours total par établissement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dataRepartitionBanques}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dataRepartitionBanques.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => value.toLocaleString('fr-FR') + ' FCFA'} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Graphique évolution solde */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Évolution du solde restant
              </CardTitle>
              <CardDescription>Projection des encours sur les prochains mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dataEvolutionSolde}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" fontSize={12} />
                    <YAxis tickFormatter={(v) => formatMontant(v)} fontSize={12} />
                    <Tooltip formatter={(value: number) => value.toLocaleString('fr-FR') + ' FCFA'} />
                    <Area type="monotone" dataKey="solde" name="Solde restant" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Crédits */}
        <TabsContent value="credits" className="space-y-4">
          {creditsFiltres.filter(c => c.statut === 'actif').map(credit => {
            const echeancesCredit = echeancesCredits.filter(e => e.creditId === credit.id);
            const echeancesPayees = echeancesCredit.filter(e => e.statut === 'payee').length;
            const pourcentageRembourse = (credit.montantRembourse / (credit.montantEmprunte + credit.totalInterets)) * 100;
            const prochaineEcheance = echeancesCredit.find(e => e.statut === 'a_payer');

            return (
              <Card key={credit.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {credit.numero}
                          {getStatutBadge(credit.statut)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{credit.banque?.nom}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/credits/${credit.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                      {credit.statut === 'actif' && prochaineEcheance && (
                        <Button 
                          size="sm"
                          onClick={() => handleRemboursement(credit, prochaineEcheance)}
                        >
                          <Wallet className="h-4 w-4 mr-1" />
                          Rembourser
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm font-medium">{credit.objet}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Montant emprunté</span>
                        <p className="font-semibold">{credit.montantEmprunte.toLocaleString('fr-FR')} FCFA</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Taux d'intérêt</span>
                        <p className="font-semibold">{credit.tauxInteret}% / an</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Durée</span>
                        <p className="font-semibold">{credit.dureeEnMois} mois</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Mensualité</span>
                        <p className="font-semibold text-primary">{credit.mensualite.toLocaleString('fr-FR')} FCFA</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total intérêts</span>
                        <p className="font-semibold text-orange-600">{credit.totalInterets.toLocaleString('fr-FR')} FCFA</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Échéances</span>
                        <p className="font-semibold">{echeancesPayees} / {credit.dureeEnMois}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progression du remboursement</span>
                        <span className="font-medium">{pourcentageRembourse.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getProgressColor(pourcentageRembourse)} transition-all`}
                          style={{ width: `${pourcentageRembourse}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Remboursé: {credit.montantRembourse.toLocaleString('fr-FR')} FCFA</span>
                        <span>Reste: {(credit.montantEmprunte + credit.totalInterets - credit.montantRembourse).toLocaleString('fr-FR')} FCFA</span>
                      </div>
                    </div>

                    {prochaineEcheance && credit.statut === 'actif' && (
                      <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Prochaine échéance: <strong>{format(new Date(prochaineEcheance.dateEcheance), 'dd MMMM yyyy', { locale: fr })}</strong>
                          </span>
                        </div>
                        <span className="font-semibold text-primary">
                          {prochaineEcheance.montantTotal.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Onglet Échéancier */}
        <TabsContent value="echeances">
          <Card>
            <CardHeader>
              <CardTitle>Échéancier des remboursements</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Crédit</TableHead>
                    <TableHead>N°</TableHead>
                    <TableHead>Date échéance</TableHead>
                    <TableHead className="text-right">Capital</TableHead>
                    <TableHead className="text-right">Intérêts</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date paiement</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {echeancesCredits
                    .sort((a, b) => new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime())
                    .slice(0, 20)
                    .map(echeance => {
                      const credit = creditsEnrichis.find(c => c.id === echeance.creditId);
                      return (
                        <TableRow key={echeance.id}>
                          <TableCell className="font-medium">{credit?.numero}</TableCell>
                          <TableCell>{echeance.numero}</TableCell>
                          <TableCell>{format(new Date(echeance.dateEcheance), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="text-right">{echeance.montantCapital.toLocaleString('fr-FR')}</TableCell>
                          <TableCell className="text-right text-orange-600">{echeance.montantInteret.toLocaleString('fr-FR')}</TableCell>
                          <TableCell className="text-right font-semibold">{echeance.montantTotal.toLocaleString('fr-FR')}</TableCell>
                          <TableCell>{getEcheanceStatutBadge(echeance.statut)}</TableCell>
                          <TableCell>
                            {echeance.datePaiement ? format(new Date(echeance.datePaiement), 'dd/MM/yyyy') : '-'}
                          </TableCell>
                          <TableCell>
                            {echeance.statut === 'a_payer' && credit && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleRemboursement(credit, echeance)}
                              >
                                Payer
                              </Button>
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

        {/* Onglet Révisions */}
        <TabsContent value="revisions" className="space-y-6">
          {/* Historique des modifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <RotateCcw className="h-5 w-5" />
                    Historique des modifications
                  </CardTitle>
                  <CardDescription>Toutes les révisions et renégociations de contrats</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.success("Export en cours...")}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Crédit</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Ancienne valeur</TableHead>
                    <TableHead>Nouvelle valeur</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Document</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modificationsCredits.map(mod => {
                    const credit = creditsEnrichis.find(c => c.id === mod.creditId);
                    const utilisateur = utilisateurs.find(u => u.id === mod.utilisateurId);
                    return (
                      <TableRow key={mod.id}>
                        <TableCell>{format(new Date(mod.dateModification), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="font-medium">{credit?.numero}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getTypeModificationLabel(mod.type)}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{mod.ancienneValeur}</TableCell>
                        <TableCell className="font-medium">{mod.nouvelleValeur}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{mod.motif}</TableCell>
                        <TableCell>{utilisateur?.nom || '-'}</TableCell>
                        <TableCell>
                          {mod.documentRef ? (
                            <Button variant="ghost" size="sm">
                              <FileText className="h-4 w-4 mr-1" />
                              {mod.documentRef}
                            </Button>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Documents versionnés */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <File className="h-5 w-5" />
                    Documents versionnés
                  </CardTitle>
                  <CardDescription>Contrats, avenants et courriers archivés</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Crédit</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Nom du document</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentsCredits.map(doc => {
                    const credit = creditsEnrichis.find(c => c.id === doc.creditId);
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{credit?.numero}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{doc.type}</Badge>
                        </TableCell>
                        <TableCell>{doc.nom}</TableCell>
                        <TableCell>v{doc.version}</TableCell>
                        <TableCell>{format(new Date(doc.dateUpload), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="text-muted-foreground">{doc.taille}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Alertes et rappels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alertes et rappels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alertesCredits.map(alerte => (
                  <div 
                    key={alerte.id} 
                    className={`p-4 rounded-lg border ${alerte.lu ? 'bg-muted/50' : 'bg-background'} ${
                      alerte.priorite === 'haute' ? 'border-red-200' : 
                      alerte.priorite === 'moyenne' ? 'border-orange-200' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          alerte.priorite === 'haute' ? 'bg-red-100' : 
                          alerte.priorite === 'moyenne' ? 'bg-orange-100' : 'bg-muted'
                        }`}>
                          <Bell className={`h-4 w-4 ${
                            alerte.priorite === 'haute' ? 'text-red-600' : 
                            alerte.priorite === 'moyenne' ? 'text-orange-600' : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">{alerte.titre}</p>
                          <p className="text-sm text-muted-foreground">{alerte.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(alerte.dateCreation), 'dd MMM yyyy', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPrioriteBadge(alerte.priorite)}
                        {!alerte.lu && (
                          <Button variant="ghost" size="sm" onClick={() => toast.success("Marqué comme lu")}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Prévisions */}
        <TabsContent value="previsions" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Prévisions d'investissement</h2>
              <p className="text-muted-foreground">Projets en attente de financement</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle prévision
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-100">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total prévisions</p>
                    <p className="text-2xl font-bold">{(totalPrevisions / 1000000).toFixed(0)}M</p>
                    <p className="text-xs text-muted-foreground">FCFA</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-100">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">En cours de traitement</p>
                    <p className="text-2xl font-bold">{previsionsEnCours}</p>
                    <p className="text-xs text-muted-foreground">dossiers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-orange-100">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">En attente</p>
                    <p className="text-2xl font-bold">{previsionsInvestissements.filter(p => p.statut === 'en_attente').length}</p>
                    <p className="text-xs text-muted-foreground">projets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
            {previsionsInvestissements.map(prevision => (
              <Card key={prevision.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Lightbulb className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {prevision.titre}
                          {getStatutPrevisionBadge(prevision.statut)}
                          {getPrioriteBadge(prevision.priorite)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Créé le {format(new Date(prevision.dateCreation), 'dd MMM yyyy', { locale: fr })}
                          {prevision.dateObjectif && (
                            <> • Objectif: {format(new Date(prevision.dateObjectif), 'dd MMM yyyy', { locale: fr })}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button size="sm">
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                        Convertir en crédit
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{prevision.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Montant estimé</span>
                      <p className="font-semibold text-lg">{prevision.montantEstime.toLocaleString('fr-FR')} FCFA</p>
                    </div>
                    {prevision.banqueEnvisagee && (
                      <div>
                        <span className="text-muted-foreground">Banque envisagée</span>
                        <p className="font-semibold">{prevision.banqueEnvisagee}</p>
                      </div>
                    )}
                    {prevision.tauxEstime && (
                      <div>
                        <span className="text-muted-foreground">Taux estimé</span>
                        <p className="font-semibold">{prevision.tauxEstime}% / an</p>
                      </div>
                    )}
                    {prevision.dureeEstimee && (
                      <div>
                        <span className="text-muted-foreground">Durée estimée</span>
                        <p className="font-semibold">{prevision.dureeEstimee} mois</p>
                      </div>
                    )}
                  </div>

                  {prevision.notes && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">{prevision.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Onglet Historique */}
        <TabsContent value="historique">
          <div className="space-y-6">
            {/* Résumé historique */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-100">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Crédits soldés</p>
                      <p className="text-2xl font-bold">{creditsTermines.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-100">
                      <CreditCard className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total emprunté (historique)</p>
                      <p className="text-2xl font-bold">{totalEmpruteHistorique.toLocaleString('fr-FR')}</p>
                      <p className="text-xs text-muted-foreground">FCFA</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-orange-100">
                      <TrendingDown className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total intérêts payés</p>
                      <p className="text-2xl font-bold">{totalInteretsPayesHistorique.toLocaleString('fr-FR')}</p>
                      <p className="text-xs text-muted-foreground">FCFA</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Liste des crédits terminés */}
            {creditsTermines.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Crédits terminés - Historique complet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Crédit</TableHead>
                        <TableHead>Banque</TableHead>
                        <TableHead>Objet</TableHead>
                        <TableHead>Période</TableHead>
                        <TableHead className="text-right">Montant emprunté</TableHead>
                        <TableHead className="text-right">Intérêts payés</TableHead>
                        <TableHead className="text-right">Total remboursé</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {creditsTermines.map(credit => (
                        <TableRow key={credit.id}>
                          <TableCell className="font-medium">{credit.numero}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {credit.banque?.nom}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{credit.objet}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{format(new Date(credit.dateDebut), 'MMM yyyy', { locale: fr })}</p>
                              <p className="text-muted-foreground">→ {format(new Date(credit.dateFin), 'MMM yyyy', { locale: fr })}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{credit.montantEmprunte.toLocaleString('fr-FR')}</TableCell>
                          <TableCell className="text-right text-orange-600">{credit.totalInterets.toLocaleString('fr-FR')}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {(credit.montantEmprunte + credit.totalInterets).toLocaleString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/credits/${credit.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Détails
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun crédit terminé</h3>
                  <p className="text-muted-foreground">Les crédits soldés apparaîtront ici pour consultation historique.</p>
                </CardContent>
              </Card>
            )}

            {/* Traçabilité des remboursements */}
            {creditsTermines.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Traçabilité des remboursements
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => toast.success("Export en cours...")}>
                      <Download className="h-4 w-4 mr-2" />
                      Exporter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {creditsTermines.map(credit => {
                    const remboursements = remboursementsCredits.filter(r => r.creditId === credit.id);
                    const echeances = echeancesCredits.filter(e => e.creditId === credit.id);
                    
                    if (remboursements.length === 0) return null;

                    return (
                      <div key={credit.id} className="mb-6 last:mb-0">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Soldé
                          </Badge>
                          <h4 className="font-semibold">{credit.numero}</h4>
                          <span className="text-sm text-muted-foreground">- {credit.objet}</span>
                        </div>
                        
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead>Date</TableHead>
                                <TableHead>Échéance</TableHead>
                                <TableHead className="text-right">Capital</TableHead>
                                <TableHead className="text-right">Intérêts</TableHead>
                                <TableHead className="text-right">Total payé</TableHead>
                                <TableHead>Référence</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {remboursements.map(remb => {
                                const echeance = echeances.find(e => e.id === remb.echeanceId);
                                return (
                                  <TableRow key={remb.id}>
                                    <TableCell>{format(new Date(remb.date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell>N°{echeance?.numero || '-'}</TableCell>
                                    <TableCell className="text-right">{echeance?.montantCapital.toLocaleString('fr-FR') || '-'}</TableCell>
                                    <TableCell className="text-right text-orange-600">{echeance?.montantInteret.toLocaleString('fr-FR') || '-'}</TableCell>
                                    <TableCell className="text-right font-semibold">{remb.montant.toLocaleString('fr-FR')}</TableCell>
                                    <TableCell className="text-muted-foreground">{remb.reference || '-'}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                        
                        <div className="flex justify-end mt-2 text-sm">
                          <span className="text-muted-foreground mr-2">Total remboursé:</span>
                          <span className="font-semibold text-green-600">
                            {remboursements.reduce((sum, r) => sum + r.montant, 0).toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>
                        
                        <Separator className="mt-4" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Onglet Alertes */}
        <TabsContent value="alertes">
          <div className="space-y-4">
            {/* Échéances à venir (7 jours) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Échéances à venir (7 prochains jours)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {echeancesAPayer.filter(e => {
                  const jours = differenceInDays(new Date(e.dateEcheance), today);
                  return jours >= 0 && jours <= 7;
                }).length > 0 ? (
                  <div className="space-y-3">
                    {echeancesAPayer.filter(e => {
                      const jours = differenceInDays(new Date(e.dateEcheance), today);
                      return jours >= 0 && jours <= 7;
                    }).map(echeance => {
                      const credit = creditsEnrichis.find(c => c.id === echeance.creditId);
                      const jours = differenceInDays(new Date(echeance.dateEcheance), today);
                      return (
                        <div key={echeance.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div>
                            <p className="font-medium">{credit?.numero} - Échéance n°{echeance.numero}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(echeance.dateEcheance), 'dd MMMM yyyy', { locale: fr })}
                              {jours === 0 && <span className="text-red-600 font-semibold ml-2">Aujourd'hui !</span>}
                              {jours === 1 && <span className="text-orange-600 font-semibold ml-2">Demain</span>}
                              {jours > 1 && <span className="ml-2">dans {jours} jours</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">{echeance.montantTotal.toLocaleString('fr-FR')} FCFA</span>
                            {credit && (
                              <Button size="sm" onClick={() => handleRemboursement(credit, echeance)}>
                                Payer
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">Aucune échéance dans les 7 prochains jours</p>
                )}
              </CardContent>
            </Card>

            {/* Échéances en retard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Échéances en retard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {echeancesCredits.filter(e => e.statut === 'en_retard').length > 0 ? (
                  <div className="space-y-3">
                    {echeancesCredits.filter(e => e.statut === 'en_retard').map(echeance => {
                      const credit = creditsEnrichis.find(c => c.id === echeance.creditId);
                      const joursRetard = differenceInDays(today, new Date(echeance.dateEcheance));
                      return (
                        <div key={echeance.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div>
                            <p className="font-medium">{credit?.numero} - Échéance n°{echeance.numero}</p>
                            <p className="text-sm text-red-600">
                              En retard de {joursRetard} jours
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-red-600">{echeance.montantTotal.toLocaleString('fr-FR')} FCFA</span>
                            {credit && (
                              <Button size="sm" variant="destructive" onClick={() => handleRemboursement(credit, echeance)}>
                                Régulariser
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-muted-foreground">Aucune échéance en retard</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <NouveauCreditModal 
        open={showNouveauModal} 
        onOpenChange={setShowNouveauModal} 
      />

      {selectedCredit && (
        <RemboursementCreditModal
          open={showRemboursementModal}
          onOpenChange={setShowRemboursementModal}
          credit={selectedCredit}
          echeance={selectedEcheance}
        />
      )}
    </MainLayout>
  );
}