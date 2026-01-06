import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend 
} from "recharts";
import { 
  FileText, Download, TrendingUp, TrendingDown, Users, FileCheck, 
  Receipt, Wallet, CreditCard, Building2, Calendar, BarChart3
} from "lucide-react";
import { 
  clients, devis, ordresTravail, factures, paiements, banques, 
  mouvementsCaisse, creditsBancaires 
} from "@/data/mockData";
import { toast } from "sonner";

const COLORS = ["#E63946", "#4A4A4A", "#F4A261", "#2A9D8F", "#264653", "#8338EC", "#FF006E"];

const formatMontant = (montant: number): string => {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(montant) + ' FCFA';
};

const moisLabels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

// Fonction pour obtenir le mois et l'année d'une date
const getMonthYear = (dateStr: string) => {
  const date = new Date(dateStr);
  return { month: date.getMonth(), year: date.getFullYear() };
};

export default function ReportingPage() {
  const [vuePeriode, setVuePeriode] = useState<"mensuelle" | "annuelle">("mensuelle");
  const [anneeSelectionnee, setAnneeSelectionnee] = useState("2026");
  const [moisSelectionne, setMoisSelectionne] = useState("1"); // Janvier

  // Années disponibles
  const anneesDisponibles = ["2024", "2025", "2026"];

  // ============ CALCULS DES DONNÉES ============

  // Données factures par mois
  const dataFacturesParMois = useMemo(() => {
    return moisLabels.map((mois, index) => {
      const facturesMois = factures.filter(f => {
        const { month, year } = getMonthYear(f.dateCreation);
        return month === index && year === parseInt(anneeSelectionnee);
      });
      const totalTTC = facturesMois.reduce((sum, f) => sum + f.montantTTC, 0);
      const totalPaye = facturesMois.reduce((sum, f) => sum + f.montantPaye, 0);
      const impaye = totalTTC - totalPaye;
      return { 
        mois, 
        factureEmises: facturesMois.length,
        montantTTC: totalTTC, 
        montantPaye: totalPaye, 
        impaye,
        tauxRecouvrement: totalTTC > 0 ? Math.round((totalPaye / totalTTC) * 100) : 0
      };
    });
  }, [anneeSelectionnee]);

  // Données devis par mois
  const dataDevisParMois = useMemo(() => {
    return moisLabels.map((mois, index) => {
      const devisMois = devis.filter(d => {
        const { month, year } = getMonthYear(d.dateCreation);
        return month === index && year === parseInt(anneeSelectionnee);
      });
      const acceptes = devisMois.filter(d => d.statut === 'accepte').length;
      const refuses = devisMois.filter(d => d.statut === 'refuse').length;
      const enAttente = devisMois.filter(d => ['brouillon', 'envoye'].includes(d.statut)).length;
      const totalMontant = devisMois.reduce((sum, d) => sum + d.montantTTC, 0);
      return { 
        mois, 
        total: devisMois.length, 
        acceptes, 
        refuses, 
        enAttente, 
        montant: totalMontant,
        tauxConversion: devisMois.length > 0 ? Math.round((acceptes / devisMois.length) * 100) : 0
      };
    });
  }, [anneeSelectionnee]);

  // Données ordres de travail par mois
  const dataOrdresParMois = useMemo(() => {
    return moisLabels.map((mois, index) => {
      const ordresMois = ordresTravail.filter(o => {
        const { month, year } = getMonthYear(o.dateCreation);
        return month === index && year === parseInt(anneeSelectionnee);
      });
      const termines = ordresMois.filter(o => ['termine', 'facture'].includes(o.statut)).length;
      const enCours = ordresMois.filter(o => o.statut === 'en_cours').length;
      const totalMontant = ordresMois.reduce((sum, o) => sum + o.montantTTC, 0);
      return { 
        mois, 
        total: ordresMois.length, 
        termines, 
        enCours, 
        montant: totalMontant 
      };
    });
  }, [anneeSelectionnee]);

  // Répartition par type d'opération
  const dataTypesOperations = useMemo(() => {
    const types: Record<string, { count: number; montant: number }> = {};
    ordresTravail.forEach(o => {
      if (!types[o.typeOperation]) {
        types[o.typeOperation] = { count: 0, montant: 0 };
      }
      types[o.typeOperation].count++;
      types[o.typeOperation].montant += o.montantTTC;
    });
    return Object.entries(types).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: data.count,
      montant: data.montant
    }));
  }, []);

  // Labels types d'opérations
  const typesOperationsLabels: Record<string, string> = {
    conteneurs: "Conteneurs",
    conventionnel: "Conventionnel",
    location: "Location",
    transport: "Transport",
    manutention: "Manutention",
    stockage: "Stockage"
  };

  // Données détaillées par type d'opération
  const dataDetailParType = useMemo(() => {
    const allTypes = ['conteneurs', 'conventionnel', 'location', 'transport', 'manutention', 'stockage'];
    
    return allTypes.map(type => {
      const ordresType = ordresTravail.filter(o => o.typeOperation === type);
      const facturesType = factures.filter(f => {
        const ordre = ordresTravail.find(o => o.id === f.ordreId);
        return ordre?.typeOperation === type;
      });
      
      const totalOrdres = ordresType.length;
      const montantOrdres = ordresType.reduce((sum, o) => sum + o.montantTTC, 0);
      const ordresTermines = ordresType.filter(o => ['termine', 'facture'].includes(o.statut)).length;
      const ordresEnCours = ordresType.filter(o => o.statut === 'en_cours').length;
      
      const totalFactures = facturesType.length;
      const montantFactures = facturesType.reduce((sum, f) => sum + f.montantTTC, 0);
      const montantPaye = facturesType.reduce((sum, f) => sum + f.montantPaye, 0);
      const montantImpaye = montantFactures - montantPaye;
      const tauxRecouvrement = montantFactures > 0 ? Math.round((montantPaye / montantFactures) * 100) : 0;
      
      // Clients uniques pour ce type
      const clientsIds = [...new Set(ordresType.map(o => o.clientId))];
      const nbClients = clientsIds.length;
      
      // Top clients par type
      const topClientsType = clientsIds.map(clientId => {
        const client = clients.find(c => c.id === clientId);
        const ordresClient = ordresType.filter(o => o.clientId === clientId);
        const montant = ordresClient.reduce((sum, o) => sum + o.montantTTC, 0);
        return { nom: client?.nom || 'Inconnu', montant, nbOrdres: ordresClient.length };
      }).sort((a, b) => b.montant - a.montant).slice(0, 5);
      
      return {
        type,
        label: typesOperationsLabels[type],
        totalOrdres,
        montantOrdres,
        ordresTermines,
        ordresEnCours,
        totalFactures,
        montantFactures,
        montantPaye,
        montantImpaye,
        tauxRecouvrement,
        nbClients,
        topClientsType
      };
    });
  }, []);

  // Évolution mensuelle par type d'opération
  const dataEvolutionParType = useMemo(() => {
    const allTypes = ['conteneurs', 'conventionnel', 'location', 'transport', 'manutention', 'stockage'];
    
    return moisLabels.map((mois, index) => {
      const result: Record<string, string | number> = { mois };
      
      allTypes.forEach(type => {
        const ordresMoisType = ordresTravail.filter(o => {
          const { month, year } = getMonthYear(o.dateCreation);
          return month === index && year === parseInt(anneeSelectionnee) && o.typeOperation === type;
        });
        result[type] = ordresMoisType.reduce((sum, o) => sum + o.montantTTC, 0);
      });
      
      return result;
    });
  }, [anneeSelectionnee]);

  // Comparaison annuelle par type
  const dataComparaisonAnnuelle = useMemo(() => {
    const allTypes = ['conteneurs', 'conventionnel', 'location', 'transport', 'manutention', 'stockage'];
    
    return allTypes.map(type => {
      const ordresType = ordresTravail.filter(o => o.typeOperation === type);
      const montantTotal = ordresType.reduce((sum, o) => sum + o.montantTTC, 0);
      const nbOrdres = ordresType.length;
      const moyennePrix = nbOrdres > 0 ? Math.round(montantTotal / nbOrdres) : 0;
      
      return {
        name: typesOperationsLabels[type],
        montant: montantTotal,
        nbOrdres,
        moyennePrix
      };
    });
  }, []);

  // Top clients par CA
  const topClients = useMemo(() => {
    const clientsCA = clients.map(client => {
      const facturesClient = factures.filter(f => f.clientId === client.id);
      const totalFacture = facturesClient.reduce((sum, f) => sum + f.montantTTC, 0);
      const totalPaye = facturesClient.reduce((sum, f) => sum + f.montantPaye, 0);
      return {
        id: client.id,
        nom: client.nom,
        totalFacture,
        totalPaye,
        impaye: totalFacture - totalPaye,
        nbFactures: facturesClient.length
      };
    });
    return clientsCA.sort((a, b) => b.totalFacture - a.totalFacture).slice(0, 10);
  }, []);

  // Données paiements par mode
  const dataPaiementsParMode = useMemo(() => {
    const modes: Record<string, { count: number; montant: number }> = {
      'especes': { count: 0, montant: 0 },
      'virement': { count: 0, montant: 0 },
      'cheque': { count: 0, montant: 0 }
    };
    paiements.forEach(p => {
      modes[p.modePaiement].count++;
      modes[p.modePaiement].montant += p.montant;
    });
    return [
      { name: 'Espèces', value: modes.especes.count, montant: modes.especes.montant },
      { name: 'Virement', value: modes.virement.count, montant: modes.virement.montant },
      { name: 'Chèque', value: modes.cheque.count, montant: modes.cheque.montant }
    ];
  }, []);

  // Mouvements caisse par mois
  const dataCaisseParMois = useMemo(() => {
    return moisLabels.map((mois, index) => {
      const mouvementsMois = mouvementsCaisse.filter(m => {
        const { month, year } = getMonthYear(m.date);
        return month === index && year === parseInt(anneeSelectionnee);
      });
      const entrees = mouvementsMois.filter(m => m.type === 'entree').reduce((sum, m) => sum + m.montant, 0);
      const sorties = mouvementsMois.filter(m => m.type === 'sortie').reduce((sum, m) => sum + m.montant, 0);
      return { mois, entrees, sorties, solde: entrees - sorties };
    });
  }, [anneeSelectionnee]);

  // Soldes banques
  const dataBanques = useMemo(() => {
    return banques.map(b => ({
      name: b.nom,
      solde: b.solde,
      actif: b.actif
    }));
  }, []);

  // Crédits en cours
  const dataCredits = useMemo(() => {
    const creditsActifs = creditsBancaires.filter(c => c.statut === 'actif');
    const totalEmprunte = creditsActifs.reduce((sum, c) => sum + c.montantEmprunte, 0);
    const totalRembourse = creditsActifs.reduce((sum, c) => sum + c.montantRembourse, 0);
    const totalRestant = creditsActifs.reduce((sum, c) => sum + (c.montantEmprunte - c.montantRembourse), 0);
    return { creditsActifs: creditsActifs.length, totalEmprunte, totalRembourse, totalRestant };
  }, []);

  // ============ KPIs GLOBAUX ============
  const totalCA = factures.reduce((sum, f) => sum + f.montantTTC, 0);
  const totalPaye = factures.reduce((sum, f) => sum + f.montantPaye, 0);
  const totalImpaye = totalCA - totalPaye;
  const tauxRecouvrement = totalCA > 0 ? Math.round((totalPaye / totalCA) * 100) : 0;
  const nbFactures = factures.length;
  const nbDevis = devis.length;
  const nbOrdres = ordresTravail.length;
  const nbClients = clients.length;

  // ============ FONCTIONS EXPORT ============
  const handleExportPDF = (type: string) => {
    toast.success(`Export PDF "${type}" généré avec succès`, {
      description: `Le rapport ${type} a été téléchargé`
    });
  };

  const handleExportExcel = (type: string) => {
    toast.success(`Export Excel "${type}" généré avec succès`, {
      description: `Le fichier Excel ${type} a été téléchargé`
    });
  };

  // Composant pour les boutons d'export
  const ExportButtons = ({ type }: { type: string }) => (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => handleExportPDF(type)}>
        <FileText className="h-4 w-4 mr-1" /> PDF
      </Button>
      <Button variant="outline" size="sm" onClick={() => handleExportExcel(type)}>
        <Download className="h-4 w-4 mr-1" /> Excel
      </Button>
    </div>
  );

  return (
    <MainLayout title="Reporting Commercial">
      <div className="space-y-6">
        {/* Filtres période */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <Select value={vuePeriode} onValueChange={(v) => setVuePeriode(v as "mensuelle" | "annuelle")}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Vue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensuelle">Vue Mensuelle</SelectItem>
                <SelectItem value="annuelle">Vue Annuelle</SelectItem>
              </SelectContent>
            </Select>
            <Select value={anneeSelectionnee} onValueChange={setAnneeSelectionnee}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {anneesDisponibles.map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {vuePeriode === "mensuelle" && (
              <Select value={moisSelectionne} onValueChange={setMoisSelectionne}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Mois" />
                </SelectTrigger>
                <SelectContent>
                  {moisLabels.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleExportPDF("Rapport Complet")}>
              <FileText className="h-4 w-4 mr-2" /> Export PDF Complet
            </Button>
            <Button variant="outline" onClick={() => handleExportExcel("Rapport Complet")}>
              <Download className="h-4 w-4 mr-2" /> Export Excel Complet
            </Button>
          </div>
        </div>

        {/* KPIs globaux */}
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                <Receipt className="h-3 w-3" /> CA Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{formatMontant(totalCA)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                <Wallet className="h-3 w-3" /> Encaissé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-green-600">{formatMontant(totalPaye)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-3 w-3" /> Impayés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-destructive">{formatMontant(totalImpaye)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Recouvrement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{tauxRecouvrement}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                <FileCheck className="h-3 w-3" /> Factures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{nbFactures}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" /> Devis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{nbDevis}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                <BarChart3 className="h-3 w-3" /> Ordres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{nbOrdres}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{nbClients}</div>
            </CardContent>
          </Card>
        </div>

        {/* Onglets de rapports */}
        <Tabs defaultValue="factures" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="factures">Factures</TabsTrigger>
            <TabsTrigger value="devis">Devis</TabsTrigger>
            <TabsTrigger value="ordres">Ordres Travail</TabsTrigger>
            <TabsTrigger value="operations">Par Type Opération</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="paiements">Paiements</TabsTrigger>
            <TabsTrigger value="tresorerie">Trésorerie</TabsTrigger>
            <TabsTrigger value="credits">Crédits</TabsTrigger>
          </TabsList>

          {/* TAB FACTURES */}
          <TabsContent value="factures" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Rapport Factures - {anneeSelectionnee}</h3>
              <ExportButtons type="Factures" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-sm">CA Mensuel</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dataFacturesParMois}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mois" />
                      <YAxis />
                      <Tooltip formatter={(v) => formatMontant(v as number)} />
                      <Legend />
                      <Bar dataKey="montantTTC" name="Facturé" fill="#E63946" />
                      <Bar dataKey="montantPaye" name="Encaissé" fill="#2A9D8F" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Évolution Impayés</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dataFacturesParMois}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mois" />
                      <YAxis />
                      <Tooltip formatter={(v) => formatMontant(v as number)} />
                      <Area type="monotone" dataKey="impaye" name="Impayés" fill="#F4A261" stroke="#E76F51" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-sm">Détail par mois</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mois</TableHead>
                      <TableHead className="text-right">Nb Factures</TableHead>
                      <TableHead className="text-right">Montant TTC</TableHead>
                      <TableHead className="text-right">Encaissé</TableHead>
                      <TableHead className="text-right">Impayé</TableHead>
                      <TableHead className="text-right">Taux Recouvrement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataFacturesParMois.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{d.mois}</TableCell>
                        <TableCell className="text-right">{d.factureEmises}</TableCell>
                        <TableCell className="text-right">{formatMontant(d.montantTTC)}</TableCell>
                        <TableCell className="text-right text-green-600">{formatMontant(d.montantPaye)}</TableCell>
                        <TableCell className="text-right text-destructive">{formatMontant(d.impaye)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={d.tauxRecouvrement >= 80 ? "default" : d.tauxRecouvrement >= 50 ? "secondary" : "destructive"}>
                            {d.tauxRecouvrement}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB DEVIS */}
          <TabsContent value="devis" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Rapport Devis - {anneeSelectionnee}</h3>
              <ExportButtons type="Devis" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-sm">Devis par mois</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dataDevisParMois}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mois" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="acceptes" name="Acceptés" stackId="a" fill="#2A9D8F" />
                      <Bar dataKey="refuses" name="Refusés" stackId="a" fill="#E63946" />
                      <Bar dataKey="enAttente" name="En attente" stackId="a" fill="#F4A261" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Taux de conversion</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dataDevisParMois}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mois" />
                      <YAxis unit="%" />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Line type="monotone" dataKey="tauxConversion" name="Taux conversion" stroke="#8338EC" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-sm">Détail par mois</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mois</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Acceptés</TableHead>
                      <TableHead className="text-right">Refusés</TableHead>
                      <TableHead className="text-right">En attente</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-right">Taux conversion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataDevisParMois.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{d.mois}</TableCell>
                        <TableCell className="text-right">{d.total}</TableCell>
                        <TableCell className="text-right text-green-600">{d.acceptes}</TableCell>
                        <TableCell className="text-right text-destructive">{d.refuses}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{d.enAttente}</TableCell>
                        <TableCell className="text-right">{formatMontant(d.montant)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={d.tauxConversion >= 50 ? "default" : "secondary"}>{d.tauxConversion}%</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB ORDRES TRAVAIL */}
          <TabsContent value="ordres" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Rapport Ordres de Travail - {anneeSelectionnee}</h3>
              <ExportButtons type="Ordres de Travail" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-sm">Ordres par mois</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dataOrdresParMois}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mois" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="termines" name="Terminés" fill="#2A9D8F" />
                      <Bar dataKey="enCours" name="En cours" fill="#F4A261" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Répartition par type d'opération</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie 
                        data={dataTypesOperations} 
                        cx="50%" cy="50%" 
                        outerRadius={100} 
                        dataKey="value" 
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {dataTypesOperations.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-sm">CA par type d'opération</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type d'opération</TableHead>
                      <TableHead className="text-right">Nombre</TableHead>
                      <TableHead className="text-right">Montant Total</TableHead>
                      <TableHead className="text-right">% du CA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataTypesOperations.map((d, i) => {
                      const totalOrdres = ordresTravail.reduce((sum, o) => sum + o.montantTTC, 0);
                      const pourcentage = totalOrdres > 0 ? Math.round((d.montant / totalOrdres) * 100) : 0;
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{d.name}</TableCell>
                          <TableCell className="text-right">{d.value}</TableCell>
                          <TableCell className="text-right">{formatMontant(d.montant)}</TableCell>
                          <TableCell className="text-right">
                            <Badge>{pourcentage}%</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB PAR TYPE OPERATION */}
          <TabsContent value="operations" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Rapport par Type d'Opération - {anneeSelectionnee}</h3>
              <ExportButtons type="Types Opérations" />
            </div>

            {/* KPIs par type */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {dataDetailParType.map((d, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-muted-foreground">{d.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">{formatMontant(d.montantOrdres)}</div>
                    <p className="text-xs text-muted-foreground">{d.totalOrdres} ordres</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Graphiques */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-sm">CA par type d'opération</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dataComparaisonAnnuelle}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip formatter={(v) => formatMontant(v as number)} />
                      <Bar dataKey="montant" name="CA" fill="#E63946" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Répartition du CA</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie 
                        data={dataComparaisonAnnuelle} 
                        cx="50%" cy="50%" 
                        outerRadius={100} 
                        dataKey="montant" 
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {dataComparaisonAnnuelle.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => formatMontant(v as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Évolution mensuelle par type */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Évolution mensuelle par type d'opération</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={dataEvolutionParType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip formatter={(v) => formatMontant(v as number)} />
                    <Legend />
                    <Area type="monotone" dataKey="conteneurs" name="Conteneurs" stackId="1" fill="#E63946" stroke="#E63946" />
                    <Area type="monotone" dataKey="transport" name="Transport" stackId="1" fill="#4A4A4A" stroke="#4A4A4A" />
                    <Area type="monotone" dataKey="manutention" name="Manutention" stackId="1" fill="#F4A261" stroke="#F4A261" />
                    <Area type="monotone" dataKey="stockage" name="Stockage" stackId="1" fill="#2A9D8F" stroke="#2A9D8F" />
                    <Area type="monotone" dataKey="location" name="Location" stackId="1" fill="#264653" stroke="#264653" />
                    <Area type="monotone" dataKey="conventionnel" name="Conventionnel" stackId="1" fill="#8338EC" stroke="#8338EC" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tableau détaillé par type */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Analyse détaillée par type</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Ordres</TableHead>
                      <TableHead className="text-right">Terminés</TableHead>
                      <TableHead className="text-right">En cours</TableHead>
                      <TableHead className="text-right">CA Ordres</TableHead>
                      <TableHead className="text-right">Facturé</TableHead>
                      <TableHead className="text-right">Payé</TableHead>
                      <TableHead className="text-right">Impayé</TableHead>
                      <TableHead className="text-right">Recouvrement</TableHead>
                      <TableHead className="text-right">Clients</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataDetailParType.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{d.label}</TableCell>
                        <TableCell className="text-right">{d.totalOrdres}</TableCell>
                        <TableCell className="text-right text-green-600">{d.ordresTermines}</TableCell>
                        <TableCell className="text-right text-amber-600">{d.ordresEnCours}</TableCell>
                        <TableCell className="text-right">{formatMontant(d.montantOrdres)}</TableCell>
                        <TableCell className="text-right">{formatMontant(d.montantFactures)}</TableCell>
                        <TableCell className="text-right text-green-600">{formatMontant(d.montantPaye)}</TableCell>
                        <TableCell className="text-right text-destructive">{formatMontant(d.montantImpaye)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={d.tauxRecouvrement >= 80 ? "default" : d.tauxRecouvrement >= 50 ? "secondary" : "destructive"}>
                            {d.tauxRecouvrement}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{d.nbClients}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Prix moyen par type */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-sm">Nombre d'ordres par type</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dataComparaisonAnnuelle}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="nbOrdres" name="Ordres" fill="#264653" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Prix moyen par type</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dataComparaisonAnnuelle}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip formatter={(v) => formatMontant(v as number)} />
                      <Bar dataKey="moyennePrix" name="Prix moyen" fill="#2A9D8F" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Top clients par type */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Top clients par type d'opération</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {dataDetailParType.filter(d => d.topClientsType.length > 0).map((d, i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Badge>{d.label}</Badge>
                      </h4>
                      <div className="space-y-2">
                        {d.topClientsType.map((client, j) => (
                          <div key={j} className="flex justify-between text-sm">
                            <span className="truncate">{client.nom}</span>
                            <span className="font-medium">{formatMontant(client.montant)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB CLIENTS */}
          <TabsContent value="clients" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Rapport Clients</h3>
              <ExportButtons type="Clients" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-sm">Top 10 Clients par CA</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topClients} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="nom" type="category" width={100} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => formatMontant(v as number)} />
                      <Bar dataKey="totalFacture" name="CA" fill="#E63946" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Impayés par client</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topClients.filter(c => c.impaye > 0)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="nom" type="category" width={100} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => formatMontant(v as number)} />
                      <Bar dataKey="impaye" name="Impayés" fill="#F4A261" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-sm">Détail clients</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Nb Factures</TableHead>
                      <TableHead className="text-right">CA Total</TableHead>
                      <TableHead className="text-right">Payé</TableHead>
                      <TableHead className="text-right">Impayé</TableHead>
                      <TableHead className="text-right">Taux paiement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topClients.map((c, i) => {
                      const taux = c.totalFacture > 0 ? Math.round((c.totalPaye / c.totalFacture) * 100) : 0;
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{c.nom}</TableCell>
                          <TableCell className="text-right">{c.nbFactures}</TableCell>
                          <TableCell className="text-right">{formatMontant(c.totalFacture)}</TableCell>
                          <TableCell className="text-right text-green-600">{formatMontant(c.totalPaye)}</TableCell>
                          <TableCell className="text-right text-destructive">{formatMontant(c.impaye)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={taux >= 80 ? "default" : taux >= 50 ? "secondary" : "destructive"}>
                              {taux}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB PAIEMENTS */}
          <TabsContent value="paiements" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Rapport Paiements - {anneeSelectionnee}</h3>
              <ExportButtons type="Paiements" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-sm">Répartition par mode de paiement</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie 
                        data={dataPaiementsParMode} 
                        cx="50%" cy="50%" 
                        outerRadius={100} 
                        dataKey="montant" 
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {dataPaiementsParMode.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => formatMontant(v as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Nombre par mode</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dataPaiementsParMode}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" name="Nombre" fill="#264653" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-sm">Détail par mode de paiement</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mode de paiement</TableHead>
                      <TableHead className="text-right">Nombre</TableHead>
                      <TableHead className="text-right">Montant Total</TableHead>
                      <TableHead className="text-right">% du total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataPaiementsParMode.map((d, i) => {
                      const total = dataPaiementsParMode.reduce((sum, p) => sum + p.montant, 0);
                      const pourcentage = total > 0 ? Math.round((d.montant / total) * 100) : 0;
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{d.name}</TableCell>
                          <TableCell className="text-right">{d.value}</TableCell>
                          <TableCell className="text-right">{formatMontant(d.montant)}</TableCell>
                          <TableCell className="text-right">
                            <Badge>{pourcentage}%</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB TRESORERIE */}
          <TabsContent value="tresorerie" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Rapport Trésorerie - {anneeSelectionnee}</h3>
              <ExportButtons type="Trésorerie" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-sm">Flux de trésorerie mensuel</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dataCaisseParMois}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mois" />
                      <YAxis />
                      <Tooltip formatter={(v) => formatMontant(v as number)} />
                      <Legend />
                      <Bar dataKey="entrees" name="Entrées" fill="#2A9D8F" />
                      <Bar dataKey="sorties" name="Sorties" fill="#E63946" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Soldes bancaires</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dataBanques}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(v) => formatMontant(v as number)} />
                      <Bar dataKey="solde" name="Solde" fill="#264653" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {dataBanques.map((b, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> {b.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatMontant(b.solde)}</div>
                    <Badge variant={b.actif ? "default" : "secondary"} className="mt-2">
                      {b.actif ? "Actif" : "Inactif"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TAB CREDITS */}
          <TabsContent value="credits" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Rapport Crédits Bancaires</h3>
              <ExportButtons type="Crédits" />
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3 w-3" /> Crédits actifs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dataCredits.creditsActifs}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground">Total emprunté</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatMontant(dataCredits.totalEmprunte)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground">Remboursé</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatMontant(dataCredits.totalRembourse)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground">Restant dû</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{formatMontant(dataCredits.totalRestant)}</div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-sm">Détail des crédits</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Banque</TableHead>
                      <TableHead>Objet</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-right">Remboursé</TableHead>
                      <TableHead className="text-right">Restant</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creditsBancaires.map((c, i) => {
                      const banque = banques.find(b => b.id === c.banqueId);
                      const restant = c.montantEmprunte - c.montantRembourse;
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{c.numero}</TableCell>
                          <TableCell>{banque?.nom || '-'}</TableCell>
                          <TableCell>{c.objet}</TableCell>
                          <TableCell className="text-right">{formatMontant(c.montantEmprunte)}</TableCell>
                          <TableCell className="text-right text-green-600">{formatMontant(c.montantRembourse)}</TableCell>
                          <TableCell className="text-right text-destructive">{formatMontant(restant)}</TableCell>
                          <TableCell>
                            <Badge variant={c.statut === 'actif' ? 'default' : c.statut === 'termine' ? 'secondary' : 'destructive'}>
                              {c.statut === 'actif' ? 'Actif' : c.statut === 'termine' ? 'Terminé' : 'En retard'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
