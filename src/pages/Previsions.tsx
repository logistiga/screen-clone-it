import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Plus, Target, TrendingUp, Clock, CheckCircle, AlertTriangle, Lightbulb,
  Building2, Eye, Trash2, XCircle, BarChart3, PieChart as PieChartIcon
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { NouvellePrevisionModal } from "@/components/NouvellePrevisionModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PrevisionInvestissement {
  id: string;
  titre: string;
  description: string;
  montantEstime: number;
  tauxEstime?: number;
  dureeEstimee?: number;
  banqueEnvisagee?: string;
  dateObjectif?: string;
  priorite: 'haute' | 'moyenne' | 'basse';
  statut: 'en_attente' | 'en_cours' | 'approuve' | 'refuse' | 'realise';
}

export default function PrevisionsPage() {
  // Données en mémoire uniquement
  const [previsions, setPrevisions] = useState<PrevisionInvestissement[]>([]);
  const [showNouvelleModal, setShowNouvelleModal] = useState(false);
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [filterPriorite, setFilterPriorite] = useState<string>("all");

  // Stats
  const totalPrevisions = previsions.reduce((sum, p) => sum + p.montantEstime, 0);
  const previsionsEnCours = previsions.filter(p => p.statut === 'en_cours');
  const previsionsEnAttente = previsions.filter(p => p.statut === 'en_attente');
  const previsionsApprouvees = previsions.filter(p => p.statut === 'approuve');
  const previsionsHautePriorite = previsions.filter(p => p.priorite === 'haute' && p.statut !== 'realise' && p.statut !== 'refuse');

  const montantEnCours = previsionsEnCours.reduce((sum, p) => sum + p.montantEstime, 0);
  const montantEnAttente = previsionsEnAttente.reduce((sum, p) => sum + p.montantEstime, 0);
  const montantApprouve = previsionsApprouvees.reduce((sum, p) => sum + p.montantEstime, 0);

  // Filtrage
  const previsionsFiltrees = previsions.filter(prev => {
    if (filterStatut !== "all" && prev.statut !== filterStatut) return false;
    if (filterPriorite !== "all" && prev.priorite !== filterPriorite) return false;
    return true;
  });

  const formatMontant = (montant: number) => (montant / 1000000).toFixed(0) + 'M';

  const getPrioriteBadge = (priorite: string) => {
    switch (priorite) {
      case 'haute': return <Badge variant="destructive">Haute</Badge>;
      case 'moyenne': return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Moyenne</Badge>;
      case 'basse': return <Badge variant="secondary">Basse</Badge>;
      default: return <Badge variant="outline">{priorite}</Badge>;
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'en_attente': return <Badge variant="outline" className="border-orange-500 text-orange-600"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'en_cours': return <Badge className="bg-blue-600"><TrendingUp className="h-3 w-3 mr-1" />En cours</Badge>;
      case 'approuve': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approuvé</Badge>;
      case 'refuse': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Refusé</Badge>;
      case 'realise': return <Badge className="bg-purple-100 text-purple-800">Réalisé</Badge>;
      default: return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const handleSupprimer = (prevision: PrevisionInvestissement) => {
    setPrevisions(prev => prev.filter(p => p.id !== prevision.id));
    toast.success("Prévision supprimée", { description: `"${prevision.titre}" a été supprimée.` });
  };

  // État vide
  if (previsions.length === 0) {
    return (
      <MainLayout title="Prévisions d'investissement">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Lightbulb className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Aucune prévision</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Planifiez vos futurs investissements et demandes de financement.
          </p>
          <Button onClick={() => setShowNouvelleModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle prévision
          </Button>
        </div>
        <NouvellePrevisionModal open={showNouvelleModal} onOpenChange={setShowNouvelleModal} />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Prévisions d'investissement">
      {/* Dashboard KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-100"><Target className="h-6 w-6 text-purple-600" /></div>
              <div><p className="text-sm text-muted-foreground">Total prévisions</p><p className="text-2xl font-bold">{formatMontant(totalPrevisions)}</p><p className="text-xs text-muted-foreground">{previsions.length} projets</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100"><TrendingUp className="h-6 w-6 text-blue-600" /></div>
              <div><p className="text-sm text-muted-foreground">En cours</p><p className="text-2xl font-bold">{formatMontant(montantEnCours)}</p><p className="text-xs text-blue-600">{previsionsEnCours.length} dossiers</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-100"><Clock className="h-6 w-6 text-orange-600" /></div>
              <div><p className="text-sm text-muted-foreground">En attente</p><p className="text-2xl font-bold">{formatMontant(montantEnAttente)}</p><p className="text-xs text-orange-600">{previsionsEnAttente.length} projets</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100"><CheckCircle className="h-6 w-6 text-green-600" /></div>
              <div><p className="text-sm text-muted-foreground">Approuvés</p><p className="text-2xl font-bold">{formatMontant(montantApprouve)}</p><p className="text-xs text-green-600">{previsionsApprouvees.length} projets</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-100"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
              <div><p className="text-sm text-muted-foreground">Haute priorité</p><p className="text-2xl font-bold">{previsionsHautePriorite.length}</p><p className="text-xs text-red-600">à traiter</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions et filtres */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <Select value={filterStatut} onValueChange={setFilterStatut}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
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
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Toutes priorités" /></SelectTrigger>
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

      <Tabs defaultValue="liste" className="space-y-4">
        <TabsList>
          <TabsTrigger value="liste"><Lightbulb className="h-4 w-4 mr-1" />Liste des projets ({previsionsFiltrees.length})</TabsTrigger>
          <TabsTrigger value="tableau">Tableau détaillé</TabsTrigger>
        </TabsList>

        <TabsContent value="liste" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {previsionsFiltrees.map(prevision => (
              <Card key={prevision.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{prevision.titre}</CardTitle>
                      <CardDescription className="mt-1">{prevision.description}</CardDescription>
                    </div>
                    {getPrioriteBadge(prevision.priorite)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Montant estimé</span>
                      <span className="font-bold">{formatMontant(prevision.montantEstime)} FCFA</span>
                    </div>
                    {prevision.banqueEnvisagee && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Banque</span>
                        <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{prevision.banqueEnvisagee}</span>
                      </div>
                    )}
                    {prevision.dateObjectif && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Objectif</span>
                        <span>{format(new Date(prevision.dateObjectif), 'dd MMM yyyy', { locale: fr })}</span>
                      </div>
                    )}
                    <div className="pt-2 flex items-center justify-between">
                      {getStatutBadge(prevision.statut)}
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleSupprimer(prevision)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {previsionsFiltrees.length === 0 && (
            <Card><CardContent className="pt-6"><div className="text-center text-muted-foreground py-8">Aucune prévision correspondant aux filtres</div></CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="tableau" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Tableau des prévisions</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Titre</TableHead><TableHead>Montant</TableHead><TableHead>Banque</TableHead>
                    <TableHead>Priorité</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previsionsFiltrees.map((prevision) => (
                    <TableRow key={prevision.id}>
                      <TableCell className="font-medium">{prevision.titre}</TableCell>
                      <TableCell>{formatMontant(prevision.montantEstime)} FCFA</TableCell>
                      <TableCell>{prevision.banqueEnvisagee || '-'}</TableCell>
                      <TableCell>{getPrioriteBadge(prevision.priorite)}</TableCell>
                      <TableCell>{getStatutBadge(prevision.statut)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleSupprimer(prevision)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {previsionsFiltrees.length === 0 && (<TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Aucune prévision</TableCell></TableRow>)}
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
