import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Building2,
  Calendar,
  Edit,
  ArrowUpRight,
  BarChart3,
  PieChart as PieChartIcon,
  Wallet,
  XCircle,
  Eye,
  Trash2,
  Filter
} from "lucide-react";
import { previsionsInvestissements, banques, PrevisionInvestissement } from "@/data/mockData";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { NouvellePrevisionModal } from "@/components/NouvellePrevisionModal";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PrevisionsPage() {
  const [showNouvelleModal, setShowNouvelleModal] = useState(false);
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [filterPriorite, setFilterPriorite] = useState<string>("all");

  // Calculs globaux
  const totalPrevisions = previsionsInvestissements.reduce((sum, p) => sum + p.montantEstime, 0);
  const previsionsEnCours = previsionsInvestissements.filter(p => p.statut === 'en_cours');
  const previsionsEnAttente = previsionsInvestissements.filter(p => p.statut === 'en_attente');
  const previsionsApprouvees = previsionsInvestissements.filter(p => p.statut === 'approuve');
  const previsionsRealisees = previsionsInvestissements.filter(p => p.statut === 'realise');
  const previsionsRefusees = previsionsInvestissements.filter(p => p.statut === 'refuse');

  const montantEnCours = previsionsEnCours.reduce((sum, p) => sum + p.montantEstime, 0);
  const montantEnAttente = previsionsEnAttente.reduce((sum, p) => sum + p.montantEstime, 0);
  const montantApprouve = previsionsApprouvees.reduce((sum, p) => sum + p.montantEstime, 0);

  // Prévisions haute priorité
  const previsionsHautePriorite = previsionsInvestissements.filter(p => p.priorite === 'haute' && p.statut !== 'realise' && p.statut !== 'refuse');

  // Filtrage
  const previsionsFiltrees = previsionsInvestissements.filter(prev => {
    if (filterStatut !== "all" && prev.statut !== filterStatut) return false;
    if (filterPriorite !== "all" && prev.priorite !== filterPriorite) return false;
    return true;
  });

  // Données pour graphiques
  const dataParStatut = [
    { name: 'En cours', value: previsionsEnCours.length, montant: montantEnCours, color: '#3b82f6' },
    { name: 'En attente', value: previsionsEnAttente.length, montant: montantEnAttente, color: '#f59e0b' },
    { name: 'Approuvé', value: previsionsApprouvees.length, montant: montantApprouve, color: '#10b981' },
    { name: 'Réalisé', value: previsionsRealisees.length, montant: previsionsRealisees.reduce((s, p) => s + p.montantEstime, 0), color: '#8b5cf6' },
    { name: 'Refusé', value: previsionsRefusees.length, montant: previsionsRefusees.reduce((s, p) => s + p.montantEstime, 0), color: '#ef4444' },
  ].filter(d => d.value > 0);

  const dataParPriorite = [
    { name: 'Haute', value: previsionsInvestissements.filter(p => p.priorite === 'haute').length, color: '#ef4444' },
    { name: 'Moyenne', value: previsionsInvestissements.filter(p => p.priorite === 'moyenne').length, color: '#f59e0b' },
    { name: 'Basse', value: previsionsInvestissements.filter(p => p.priorite === 'basse').length, color: '#6b7280' },
  ];

  const dataParBanque = banques.map(banque => ({
    name: banque.nom.split(' ')[0],
    montant: previsionsInvestissements
      .filter(p => p.banqueEnvisagee === banque.nom)
      .reduce((sum, p) => sum + p.montantEstime, 0)
  })).filter(d => d.montant > 0);

  const formatMontant = (montant: number) => (montant / 1000000).toFixed(0) + 'M';

  const getPrioriteBadge = (priorite: string) => {
    switch (priorite) {
      case 'haute':
        return <Badge variant="destructive">Haute</Badge>;
      case 'moyenne':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Moyenne</Badge>;
      case 'basse':
        return <Badge variant="secondary">Basse</Badge>;
      default:
        return <Badge variant="outline">{priorite}</Badge>;
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'en_attente':
        return <Badge variant="outline" className="border-orange-500 text-orange-600"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'en_cours':
        return <Badge className="bg-blue-600"><TrendingUp className="h-3 w-3 mr-1" />En cours</Badge>;
      case 'approuve':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approuvé</Badge>;
      case 'refuse':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Refusé</Badge>;
      case 'realise':
        return <Badge className="bg-purple-100 text-purple-800">Réalisé</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const calculerMensualiteEstimee = (prevision: PrevisionInvestissement) => {
    const { montantEstime, tauxEstime, dureeEstimee } = prevision;
    if (!tauxEstime || !dureeEstimee) return null;

    const tauxMensuel = tauxEstime / 100 / 12;
    const mensualite = montantEstime * (tauxMensuel * Math.pow(1 + tauxMensuel, dureeEstimee)) / 
                       (Math.pow(1 + tauxMensuel, dureeEstimee) - 1);
    return mensualite;
  };

  const handleConvertir = (prevision: PrevisionInvestissement) => {
    toast.success("Conversion initiée", {
      description: `Le projet "${prevision.titre}" sera converti en crédit actif.`
    });
  };

  const handleSupprimer = (prevision: PrevisionInvestissement) => {
    toast.success("Prévision supprimée", {
      description: `"${prevision.titre}" a été supprimée.`
    });
  };

  return (
    <MainLayout title="Prévisions d'investissement">
      {/* Dashboard KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-100">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total prévisions</p>
                <p className="text-2xl font-bold">{formatMontant(totalPrevisions)}</p>
                <p className="text-xs text-muted-foreground">{previsionsInvestissements.length} projets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold">{formatMontant(montantEnCours)}</p>
                <p className="text-xs text-blue-600">{previsionsEnCours.length} dossiers</p>
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
                <p className="text-2xl font-bold">{formatMontant(montantEnAttente)}</p>
                <p className="text-xs text-orange-600">{previsionsEnAttente.length} projets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approuvés</p>
                <p className="text-2xl font-bold">{formatMontant(montantApprouve)}</p>
                <p className="text-xs text-green-600">{previsionsApprouvees.length} projets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Haute priorité</p>
                <p className="text-2xl font-bold">{previsionsHautePriorite.length}</p>
                <p className="text-xs text-red-600">à traiter</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions et filtres */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <Select value={filterStatut} onValueChange={setFilterStatut}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="en_attente">En attente</SelectItem>
              <SelectItem value="en_cours">En cours</SelectItem>
              <SelectItem value="approuve">Approuvé</SelectItem>
              <SelectItem value="refuse">Refusé</SelectItem>
              <SelectItem value="realise">Réalisé</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriorite} onValueChange={setFilterPriorite}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Toutes priorités" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes priorités</SelectItem>
              <SelectItem value="haute">Haute</SelectItem>
              <SelectItem value="moyenne">Moyenne</SelectItem>
              <SelectItem value="basse">Basse</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowNouvelleModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle prévision
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">
            <BarChart3 className="h-4 w-4 mr-1" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="liste">
            <Lightbulb className="h-4 w-4 mr-1" />
            Liste des projets ({previsionsFiltrees.length})
          </TabsTrigger>
          <TabsTrigger value="tableau">
            Tableau détaillé
          </TabsTrigger>
        </TabsList>

        {/* Onglet Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Répartition par statut */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Répartition par statut
                </CardTitle>
                <CardDescription>Nombre de projets par état d'avancement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dataParStatut}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} (${value})`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dataParStatut.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string, props: { payload: { montant: number } }) => [
                        `${value} projet(s) - ${formatMontant(props.payload.montant)} FCFA`,
                        name
                      ]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Montants par banque */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Montants par banque envisagée
                </CardTitle>
                <CardDescription>Répartition des financements prévus</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataParBanque} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(v) => formatMontant(v)} />
                      <YAxis type="category" dataKey="name" width={80} />
                      <Tooltip formatter={(value: number) => value.toLocaleString('fr-FR') + ' FCFA'} />
                      <Bar dataKey="montant" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Projets haute priorité */}
          {previsionsHautePriorite.length > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  Projets haute priorité à traiter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {previsionsHautePriorite.map(prevision => (
                    <div key={prevision.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-red-100">
                          <Lightbulb className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium">{prevision.titre}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatMontant(prevision.montantEstime)} FCFA
                            {prevision.dateObjectif && (
                              <> • Objectif: {format(new Date(prevision.dateObjectif), 'dd MMM yyyy', { locale: fr })}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatutBadge(prevision.statut)}
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Répartition par priorité */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par priorité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataParPriorite.map(item => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground">{item.value} projet(s)</span>
                    </div>
                    <Progress 
                      value={(item.value / previsionsInvestissements.length) * 100} 
                      className="h-2"
                      style={{ '--progress-background': item.color } as React.CSSProperties}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Liste des projets */}
        <TabsContent value="liste" className="space-y-4">
          {previsionsFiltrees.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucune prévision trouvée</h3>
                <p className="text-muted-foreground mb-4">Modifiez vos filtres ou créez une nouvelle prévision.</p>
                <Button onClick={() => setShowNouvelleModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle prévision
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {previsionsFiltrees.map(prevision => {
                const mensualite = calculerMensualiteEstimee(prevision);
                const banque = banques.find(b => b.nom === prevision.banqueEnvisagee);
                const joursRestants = prevision.dateObjectif 
                  ? differenceInDays(new Date(prevision.dateObjectif), new Date())
                  : null;

                return (
                  <Card key={prevision.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Lightbulb className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                              {prevision.titre}
                              {getStatutBadge(prevision.statut)}
                              {getPrioriteBadge(prevision.priorite)}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Créé le {format(new Date(prevision.dateCreation), 'dd MMM yyyy', { locale: fr })}
                              {prevision.dateObjectif && (
                                <>
                                  {' '}• Objectif: {format(new Date(prevision.dateObjectif), 'dd MMM yyyy', { locale: fr })}
                                  {joursRestants !== null && joursRestants > 0 && (
                                    <span className={`ml-1 ${joursRestants < 30 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                                      ({joursRestants} jours)
                                    </span>
                                  )}
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                          {prevision.statut === 'approuve' && (
                            <Button size="sm" onClick={() => handleConvertir(prevision)}>
                              <ArrowUpRight className="h-4 w-4 mr-1" />
                              Convertir en crédit
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{prevision.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Montant estimé</p>
                          <p className="font-bold text-lg">{prevision.montantEstime.toLocaleString('fr-FR')} FCFA</p>
                        </div>
                        {prevision.banqueEnvisagee && (
                          <div>
                            <p className="text-sm text-muted-foreground">Banque envisagée</p>
                            <p className="font-medium flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {prevision.banqueEnvisagee}
                            </p>
                          </div>
                        )}
                        {prevision.tauxEstime && (
                          <div>
                            <p className="text-sm text-muted-foreground">Taux estimé</p>
                            <p className="font-medium">{prevision.tauxEstime}%</p>
                          </div>
                        )}
                        {prevision.dureeEstimee && (
                          <div>
                            <p className="text-sm text-muted-foreground">Durée estimée</p>
                            <p className="font-medium">{prevision.dureeEstimee} mois</p>
                          </div>
                        )}
                      </div>

                      {mensualite && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-sm text-blue-700">
                            <Wallet className="h-4 w-4 inline mr-1" />
                            Mensualité estimée: <span className="font-bold">{mensualite.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA</span>
                          </p>
                        </div>
                      )}

                      {prevision.notes && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">{prevision.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Onglet Tableau détaillé */}
        <TabsContent value="tableau">
          <Card>
            <CardHeader>
              <CardTitle>Tableau des prévisions</CardTitle>
              <CardDescription>Vue synthétique de tous les projets d'investissement</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projet</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Banque</TableHead>
                    <TableHead>Taux</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Mensualité est.</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Objectif</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previsionsFiltrees.map(prevision => {
                    const mensualite = calculerMensualiteEstimee(prevision);
                    
                    return (
                      <TableRow key={prevision.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{prevision.titre}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {prevision.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatMontant(prevision.montantEstime)}
                        </TableCell>
                        <TableCell>
                          {prevision.banqueEnvisagee || '-'}
                        </TableCell>
                        <TableCell>
                          {prevision.tauxEstime ? `${prevision.tauxEstime}%` : '-'}
                        </TableCell>
                        <TableCell>
                          {prevision.dureeEstimee ? `${prevision.dureeEstimee} mois` : '-'}
                        </TableCell>
                        <TableCell className="font-mono">
                          {mensualite ? formatMontant(mensualite) : '-'}
                        </TableCell>
                        <TableCell>{getPrioriteBadge(prevision.priorite)}</TableCell>
                        <TableCell>{getStatutBadge(prevision.statut)}</TableCell>
                        <TableCell>
                          {prevision.dateObjectif 
                            ? format(new Date(prevision.dateObjectif), 'dd/MM/yy')
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleSupprimer(prevision)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
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

      <NouvellePrevisionModal
        open={showNouvelleModal}
        onOpenChange={setShowNouvelleModal}
      />
    </MainLayout>
  );
}
