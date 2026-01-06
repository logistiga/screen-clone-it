import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Building2,
  Calendar,
  TrendingDown,
  Wallet,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Download
} from "lucide-react";
import { 
  creditsBancaires, 
  echeancesCredits, 
  remboursementsCredits,
  banques,
  EcheanceCredit
} from "@/data/mockData";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { RemboursementCreditModal } from "@/components/RemboursementCreditModal";
import { toast } from "sonner";

export default function CreditDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showRemboursementModal, setShowRemboursementModal] = useState(false);
  const [selectedEcheance, setSelectedEcheance] = useState<EcheanceCredit | undefined>(undefined);

  const credit = creditsBancaires.find(c => c.id === id);
  const banque = credit ? banques.find(b => b.id === credit.banqueId) : null;
  const echeances = echeancesCredits.filter(e => e.creditId === id);
  const remboursements = remboursementsCredits.filter(r => r.creditId === id);

  if (!credit) {
    return (
      <MainLayout title="Crédit non trouvé">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Ce crédit n'existe pas.</p>
            <Button className="mt-4" onClick={() => navigate('/credits')}>
              Retour aux crédits
            </Button>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  const echeancesPayees = echeances.filter(e => e.statut === 'payee').length;
  const pourcentageRembourse = (credit.montantRembourse / (credit.montantEmprunte + credit.totalInterets)) * 100;
  const capitalRestant = credit.montantEmprunte - echeances.filter(e => e.statut === 'payee').reduce((sum, e) => sum + e.montantCapital, 0);
  const interetsPayes = echeances.filter(e => e.statut === 'payee').reduce((sum, e) => sum + e.montantInteret, 0);
  const prochaineEcheance = echeances.find(e => e.statut === 'a_payer');

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

  const handleRemboursement = (echeance?: EcheanceCredit) => {
    setSelectedEcheance(echeance);
    setShowRemboursementModal(true);
  };

  const handleExportPDF = () => {
    toast.success("Export PDF du tableau d'amortissement en cours...");
  };

  return (
    <MainLayout title={`Crédit ${credit.numero}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate('/credits')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          {credit.statut === 'actif' && prochaineEcheance && (
            <Button onClick={() => handleRemboursement(prochaineEcheance)}>
              <Wallet className="h-4 w-4 mr-2" />
              Rembourser échéance
            </Button>
          )}
        </div>
      </div>

      {/* Informations générales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <Building2 className="h-5 w-5" />
                {credit.numero}
                {getStatutBadge(credit.statut)}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Objet du crédit</h3>
              <p>{credit.objet}</p>
              {credit.notes && <p className="text-sm text-muted-foreground mt-1">{credit.notes}</p>}
            </div>

            <Separator />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Banque</span>
                <p className="font-semibold">{banque?.nom}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Montant emprunté</span>
                <p className="font-semibold">{credit.montantEmprunte.toLocaleString('fr-FR')} FCFA</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Taux d'intérêt</span>
                <p className="font-semibold">{credit.tauxInteret}% / an</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Durée</span>
                <p className="font-semibold">{credit.dureeEnMois} mois</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Date de début</span>
                <p className="font-semibold">{format(new Date(credit.dateDebut), 'dd/MM/yyyy')}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Date de fin</span>
                <p className="font-semibold">{format(new Date(credit.dateFin), 'dd/MM/yyyy')}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Mensualité</span>
                <p className="font-semibold text-primary">{credit.mensualite.toLocaleString('fr-FR')} FCFA</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Total des intérêts</span>
                <p className="font-semibold text-orange-600">{credit.totalInterets.toLocaleString('fr-FR')} FCFA</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progression</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{pourcentageRembourse.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">remboursé</p>
            </div>

            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${pourcentageRembourse}%` }}
              />
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Échéances payées</span>
                <span className="font-semibold">{echeancesPayees} / {credit.dureeEnMois}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Capital remboursé</span>
                <span className="font-semibold">{(credit.montantEmprunte - capitalRestant).toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Capital restant</span>
                <span className="font-semibold text-orange-600">{capitalRestant.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Intérêts payés</span>
                <span className="font-semibold">{interetsPayes.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>

            {prochaineEcheance && credit.statut === 'actif' && (
              <>
                <Separator />
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Prochaine échéance
                  </p>
                  <p className="text-lg font-bold text-primary mt-1">
                    {prochaineEcheance.montantTotal.toLocaleString('fr-FR')} FCFA
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(prochaineEcheance.dateEcheance), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="echeances" className="space-y-4">
        <TabsList>
          <TabsTrigger value="echeances">Tableau d'amortissement</TabsTrigger>
          <TabsTrigger value="remboursements">Historique des remboursements</TabsTrigger>
        </TabsList>

        <TabsContent value="echeances">
          <Card>
            <CardHeader>
              <CardTitle>Tableau d'amortissement</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Date échéance</TableHead>
                    <TableHead className="text-right">Capital</TableHead>
                    <TableHead className="text-right">Intérêts</TableHead>
                    <TableHead className="text-right">Mensualité</TableHead>
                    <TableHead className="text-right">Capital restant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date paiement</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {echeances.map((echeance, index) => {
                    const capitalRestantApres = capitalRestant - echeances
                      .slice(0, index + 1)
                      .filter(e => e.statut !== 'payee')
                      .reduce((sum, e) => sum + e.montantCapital, 0);
                    
                    return (
                      <TableRow key={echeance.id}>
                        <TableCell className="font-medium">{echeance.numero}</TableCell>
                        <TableCell>{format(new Date(echeance.dateEcheance), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="text-right">{echeance.montantCapital.toLocaleString('fr-FR')}</TableCell>
                        <TableCell className="text-right text-orange-600">{echeance.montantInteret.toLocaleString('fr-FR')}</TableCell>
                        <TableCell className="text-right font-semibold">{echeance.montantTotal.toLocaleString('fr-FR')}</TableCell>
                        <TableCell className="text-right">
                          {echeance.statut === 'payee' 
                            ? '-' 
                            : (credit.montantEmprunte - echeances.slice(0, index).filter(e => e.statut === 'payee').reduce((s, e) => s + e.montantCapital, 0) - echeance.montantCapital).toLocaleString('fr-FR')
                          }
                        </TableCell>
                        <TableCell>{getEcheanceStatutBadge(echeance.statut)}</TableCell>
                        <TableCell>
                          {echeance.datePaiement ? format(new Date(echeance.datePaiement), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          {echeance.statut === 'a_payer' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRemboursement(echeance)}
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

        <TabsContent value="remboursements">
          <Card>
            <CardHeader>
              <CardTitle>Historique des remboursements</CardTitle>
            </CardHeader>
            <CardContent>
              {remboursements.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Échéance</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Compte débité</TableHead>
                      <TableHead>Référence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {remboursements.map(remb => {
                      const echeance = echeances.find(e => e.id === remb.echeanceId);
                      const banqueRemb = banques.find(b => b.id === remb.banqueId);
                      return (
                        <TableRow key={remb.id}>
                          <TableCell>{format(new Date(remb.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>Échéance n°{echeance?.numero}</TableCell>
                          <TableCell className="text-right font-semibold">{remb.montant.toLocaleString('fr-FR')} FCFA</TableCell>
                          <TableCell>{banqueRemb?.nom}</TableCell>
                          <TableCell>{remb.reference || '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">Aucun remboursement enregistré</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal remboursement */}
      <RemboursementCreditModal
        open={showRemboursementModal}
        onOpenChange={setShowRemboursementModal}
        credit={credit}
        echeance={selectedEcheance}
      />
    </MainLayout>
  );
}
