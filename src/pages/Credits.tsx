import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Wallet,
  Eye,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  History,
  Download
} from "lucide-react";
import { 
  creditsBancaires, 
  echeancesCredits, 
  remboursementsCredits,
  banques,
  CreditBancaire,
  EcheanceCredit
} from "@/data/mockData";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format, differenceInDays, addMonths, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { NouveauCreditModal } from "@/components/NouveauCreditModal";
import { RemboursementCreditModal } from "@/components/RemboursementCreditModal";
import { useNavigate } from "react-router-dom";

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

  // Prochaines échéances
  const today = new Date();
  const echeancesAPayer = echeancesCredits
    .filter(e => e.statut === 'a_payer')
    .sort((a, b) => new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime());

  const prochaineMensualite = echeancesAPayer.length > 0 ? echeancesAPayer[0] : null;

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

  return (
    <MainLayout title="Crédits Bancaires">
      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total emprunté</p>
                <p className="text-2xl font-bold">{totalEmprunte.toLocaleString('fr-FR')}</p>
                <p className="text-xs text-muted-foreground">FCFA</p>
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
                <p className="text-2xl font-bold">{totalRembourse.toLocaleString('fr-FR')}</p>
                <p className="text-xs text-muted-foreground">FCFA</p>
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
                <p className="text-sm text-muted-foreground">Reste à rembourser</p>
                <p className="text-2xl font-bold">{totalRestant.toLocaleString('fr-FR')}</p>
                <p className="text-xs text-muted-foreground">FCFA</p>
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
                    <p className="text-2xl font-bold">{prochaineMensualite.montantTotal.toLocaleString('fr-FR')}</p>
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
        <Button onClick={() => setShowNouveauModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau crédit
        </Button>
      </div>

      <Tabs defaultValue="credits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="credits">Crédits actifs ({creditsActifs.length})</TabsTrigger>
          <TabsTrigger value="echeances">Échéancier</TabsTrigger>
          <TabsTrigger value="historique">
            <History className="h-4 w-4 mr-1" />
            Historique ({creditsTermines.length})
          </TabsTrigger>
          <TabsTrigger value="alertes">Alertes</TabsTrigger>
        </TabsList>

        {/* Onglet Crédits */}
        <TabsContent value="credits" className="space-y-4">
          {creditsFiltres.map(credit => {
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
