import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Plus, Building2, Calendar, TrendingDown, TrendingUp, Wallet, Eye, CreditCard,
  AlertTriangle, CheckCircle, Clock, History, BarChart3, Target, Bell
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { NouveauCreditModal } from "@/components/NouveauCreditModal";
import { RemboursementCreditModal } from "@/components/RemboursementCreditModal";

interface CreditBancaire {
  id: string;
  numero: string;
  banqueId: string;
  banqueNom: string;
  objet: string;
  montantEmprunte: number;
  montantRembourse: number;
  totalInterets: number;
  tauxInteret: number;
  duree: number;
  dureeEnMois: number;
  dateDebut: string;
  dateFin: string;
  mensualite: number;
  statut: 'actif' | 'termine' | 'en_retard';
}

interface EcheanceCredit {
  id: string;
  creditId: string;
  dateEcheance: string;
  montantCapital: number;
  montantInterets: number;
  montantTotal: number;
  statut: 'payee' | 'a_payer' | 'en_retard';
}

export default function CreditsPage() {
  const navigate = useNavigate();
  
  // Données en mémoire uniquement
  const [credits] = useState<CreditBancaire[]>([]);
  const [echeances] = useState<EcheanceCredit[]>([]);
  const [showNouveauModal, setShowNouveauModal] = useState(false);
  const [showRemboursementModal, setShowRemboursementModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<CreditBancaire | null>(null);
  const [filterStatut, setFilterStatut] = useState<string>("all");

  // Stats
  const creditsActifs = credits.filter(c => c.statut === 'actif');
  const totalEmprunte = creditsActifs.reduce((sum, c) => sum + c.montantEmprunte, 0);
  const totalRembourse = creditsActifs.reduce((sum, c) => sum + c.montantRembourse, 0);
  const totalRestant = totalEmprunte - totalRembourse;
  const totalInterets = creditsActifs.reduce((sum, c) => sum + c.totalInterets, 0);

  const echeancesAPayer = echeances.filter(e => e.statut === 'a_payer').sort((a, b) => new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime());
  const prochaineMensualite = echeancesAPayer.length > 0 ? echeancesAPayer[0] : null;

  const creditsFiltres = credits.filter(credit => filterStatut === "all" || credit.statut === filterStatut);

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'actif': return <Badge className="bg-blue-600">Actif</Badge>;
      case 'termine': return <Badge className="bg-green-100 text-green-800">Terminé</Badge>;
      case 'en_retard': return <Badge variant="destructive">En retard</Badge>;
      default: return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getEcheanceStatutBadge = (statut: string) => {
    switch (statut) {
      case 'payee': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Payée</Badge>;
      case 'a_payer': return <Badge variant="outline" className="border-orange-500 text-orange-600"><Clock className="h-3 w-3 mr-1" />À payer</Badge>;
      case 'en_retard': return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />En retard</Badge>;
      default: return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const formatMontant = (montant: number) => (montant / 1000000).toFixed(1) + 'M';

  const handleRemboursement = (credit: CreditBancaire) => { setSelectedCredit(credit); setShowRemboursementModal(true); };

  // État vide
  if (credits.length === 0) {
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
      {/* Dashboard KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100"><CreditCard className="h-6 w-6 text-blue-600" /></div>
              <div><p className="text-sm text-muted-foreground">Total emprunté</p><p className="text-2xl font-bold">{formatMontant(totalEmprunte)}</p><p className="text-xs text-muted-foreground">FCFA actifs</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100"><TrendingDown className="h-6 w-6 text-green-600" /></div>
              <div><p className="text-sm text-muted-foreground">Total remboursé</p><p className="text-2xl font-bold">{formatMontant(totalRembourse)}</p><p className="text-xs text-green-600">+{totalEmprunte > 0 ? ((totalRembourse / totalEmprunte) * 100).toFixed(0) : 0}%</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-100"><Wallet className="h-6 w-6 text-orange-600" /></div>
              <div><p className="text-sm text-muted-foreground">Reste à payer</p><p className="text-2xl font-bold">{formatMontant(totalRestant)}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-100"><Target className="h-6 w-6 text-purple-600" /></div>
              <div><p className="text-sm text-muted-foreground">Total intérêts</p><p className="text-2xl font-bold">{formatMontant(totalInterets)}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-100"><Calendar className="h-6 w-6 text-red-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Prochaine échéance</p>
                {prochaineMensualite ? (<><p className="text-2xl font-bold">{formatMontant(prochaineMensualite.montantTotal)}</p><p className="text-xs text-muted-foreground">{format(new Date(prochaineMensualite.dateEcheance), 'dd/MM/yyyy')}</p></>) : (<p className="text-lg text-muted-foreground">Aucune</p>)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <select className="border rounded-md px-3 py-2 text-sm" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
            <option value="all">Tous les statuts</option>
            <option value="actif">Actifs</option>
            <option value="termine">Terminés</option>
            <option value="en_retard">En retard</option>
          </select>
        </div>
        <Button onClick={() => setShowNouveauModal(true)}><Plus className="h-4 w-4 mr-2" />Nouveau crédit</Button>
      </div>

      <Tabs defaultValue="credits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="credits">Crédits actifs ({creditsActifs.length})</TabsTrigger>
          <TabsTrigger value="echeances">Échéancier</TabsTrigger>
          <TabsTrigger value="historique"><History className="h-4 w-4 mr-1" />Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="credits" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Liste des crédits</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Banque</TableHead><TableHead>Objet</TableHead><TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Remboursé</TableHead><TableHead>Progression</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditsFiltres.map((credit) => {
                    const progression = credit.montantEmprunte > 0 ? (credit.montantRembourse / credit.montantEmprunte) * 100 : 0;
                    return (
                      <TableRow key={credit.id}>
                        <TableCell><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /><span className="font-medium">{credit.banqueNom}</span></div></TableCell>
                        <TableCell>{credit.objet}</TableCell>
                        <TableCell className="text-right font-medium">{formatMontant(credit.montantEmprunte)} FCFA</TableCell>
                        <TableCell className="text-right text-green-600">{formatMontant(credit.montantRembourse)} FCFA</TableCell>
                        <TableCell><div className="w-24"><Progress value={progression} className="h-2" /><p className="text-xs text-muted-foreground mt-1">{progression.toFixed(0)}%</p></div></TableCell>
                        <TableCell>{getStatutBadge(credit.statut)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => navigate(`/credits/${credit.id}`)}><Eye className="h-4 w-4" /></Button>
                            {credit.statut === 'actif' && (<Button variant="ghost" size="icon" className="text-green-600" onClick={() => handleRemboursement(credit)}><TrendingDown className="h-4 w-4" /></Button>)}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {creditsFiltres.length === 0 && (<TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Aucun crédit</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="echeances" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Échéances à venir</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Date</TableHead><TableHead>Capital</TableHead><TableHead>Intérêts</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {echeances.map((echeance) => (
                    <TableRow key={echeance.id}>
                      <TableCell>{format(new Date(echeance.dateEcheance), 'dd MMM yyyy', { locale: fr })}</TableCell>
                      <TableCell>{formatMontant(echeance.montantCapital)} FCFA</TableCell>
                      <TableCell>{formatMontant(echeance.montantInterets)} FCFA</TableCell>
                      <TableCell className="text-right font-bold">{formatMontant(echeance.montantTotal)} FCFA</TableCell>
                      <TableCell>{getEcheanceStatutBadge(echeance.statut)}</TableCell>
                    </TableRow>
                  ))}
                  {echeances.length === 0 && (<TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Aucune échéance</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historique" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground py-8">Historique des crédits terminés</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NouveauCreditModal open={showNouveauModal} onOpenChange={setShowNouveauModal} />
      {selectedCredit && (<RemboursementCreditModal open={showRemboursementModal} onOpenChange={setShowRemboursementModal} credit={selectedCredit} />)}
    </MainLayout>
  );
}
