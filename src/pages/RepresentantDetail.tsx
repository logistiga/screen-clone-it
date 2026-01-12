import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Edit, Mail, Phone, MapPin, CreditCard, History, DollarSign, Loader2, Printer } from "lucide-react";
import { formatMontant, formatDate } from "@/data/mockData";
import { PaiementPrimeModal } from "@/components/PaiementPrimeModal";
import { useRepresentantById } from "@/hooks/use-commercial";

export default function RepresentantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [selectedPrimes, setSelectedPrimes] = useState<string[]>([]);
  
  const { data: representant, isLoading, error } = useRepresentantById(id);

  if (isLoading) {
    return (
      <MainLayout title="Chargement...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  if (error || !representant) {
    return (
      <MainLayout title="Représentant non trouvé">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Ce représentant n'existe pas.</p>
          <Button variant="link" onClick={() => navigate("/partenaires")}>
            Retour aux partenaires
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Données de l'API
  const primes = representant.primes || [];

  // Calculer les totaux depuis les vraies données
  const primesDues = primes
    .filter((p: any) => p.statut !== 'Payée')
    .reduce((sum: number, p: any) => sum + (p.montant || 0), 0);
  
  const primesPayees = primes
    .filter((p: any) => p.statut === 'Payée')
    .reduce((sum: number, p: any) => sum + (p.montant || 0), 0);

  const primesDuesList = primes.filter((p: any) => p.statut !== 'Payée');

  // Récupérer les paiements groupés (depuis paiements_primes)
  const paiementsPrimes = representant.paiements_primes || [];
  
  // Fallback: paiements individuels des primes si paiements_primes vide
  const allPaiements = paiementsPrimes.length > 0 
    ? paiementsPrimes 
    : primes.flatMap((p: any) => p.paiements || []);

  const handleSelectPrime = (primeId: string, checked: boolean) => {
    if (checked) {
      setSelectedPrimes([...selectedPrimes, primeId]);
    } else {
      setSelectedPrimes(selectedPrimes.filter(pid => pid !== primeId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPrimes(primesDuesList.map((p: any) => String(p.id)));
    } else {
      setSelectedPrimes([]);
    }
  };

  const selectedTotal = primes
    .filter((p: any) => selectedPrimes.includes(String(p.id)))
    .reduce((sum: number, p: any) => sum + (p.montant || 0), 0);

  const getStatutBadge = (statut: string) => {
    const isPaid = statut === 'Payée' || statut === 'payee';
    return (
      <Badge variant={isPaid ? 'default' : 'destructive'}>
        {isPaid ? 'Payée' : statut === 'Partiellement payée' ? 'Partielle' : 'Due'}
      </Badge>
    );
  };

  return (
    <MainLayout title={representant.prenom ? `${representant.prenom} ${representant.nom}` : representant.nom || 'Représentant'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" onClick={() => navigate("/partenaires")} className="gap-2 w-fit">
            <ArrowLeft className="h-4 w-4" />
            Retour aux partenaires
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
            {primesDues > 0 && (
              <Button 
                className="gap-2"
                onClick={() => setShowPaiementModal(true)}
                disabled={selectedPrimes.length === 0}
              >
                <DollarSign className="h-4 w-4" />
                Payer primes ({formatMontant(selectedTotal || primesDues)})
              </Button>
            )}
          </div>
        </div>

        {/* Info + Stats */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Informations du représentant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{representant.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{representant.telephone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{representant.adresse || '-'}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Partenaire depuis le {representant.created_at ? formatDate(representant.created_at) : '-'}
                  </div>
                  {representant.taux_commission && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Taux commission: </span>
                      <span className="font-medium">{representant.taux_commission}%</span>
                    </div>
                  )}
                  <Badge variant={representant.actif !== false ? "default" : "secondary"}>
                    {representant.actif !== false ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Primes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{primes.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Primes Dues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{formatMontant(primesDues)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Primes Payées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatMontant(primesPayees)}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="primes" className="w-full">
          <TabsList>
            <TabsTrigger value="primes" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Primes ({primes.length})
            </TabsTrigger>
            <TabsTrigger value="historique" className="gap-2">
              <History className="h-4 w-4" />
              Historique Paiements ({allPaiements.length})
            </TabsTrigger>
          </TabsList>

          {/* Primes Tab */}
          <TabsContent value="primes" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={selectedPrimes.length === primesDuesList.length && primesDuesList.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Ordre/Facture</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-right">Reste à payer</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {primes.map((prime: any) => (
                      <TableRow key={prime.id}>
                        <TableCell>
                          {prime.statut !== 'Payée' && (
                            <Checkbox 
                              checked={selectedPrimes.includes(String(prime.id))}
                              onCheckedChange={(checked) => handleSelectPrime(String(prime.id), !!checked)}
                            />
                          )}
                        </TableCell>
                        <TableCell 
                          className="font-medium text-primary hover:underline cursor-pointer"
                          onClick={() => {
                            if (prime.ordre_id) navigate(`/ordres/${prime.ordre_id}`);
                            else if (prime.facture_id) navigate(`/factures/${prime.facture_id}`);
                          }}
                        >
                          {prime.ordre?.numero || prime.facture?.numero || '-'}
                        </TableCell>
                        <TableCell>{formatDate(prime.created_at)}</TableCell>
                        <TableCell className="text-right font-medium">{formatMontant(prime.montant)}</TableCell>
                        <TableCell className="text-right font-medium text-destructive">
                          {formatMontant(prime.reste_a_payer ?? prime.montant)}
                        </TableCell>
                        <TableCell>{getStatutBadge(prime.statut)}</TableCell>
                      </TableRow>
                    ))}
                    {primes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          Aucune prime
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Historique Paiements Tab */}
          <TabsContent value="historique" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {allPaiements.length === 0 ? (
                  <div className="h-24 flex items-center justify-center text-muted-foreground">
                    Aucun paiement
                  </div>
                ) : (
                  <div className="divide-y">
                    {allPaiements.map((paiement: any) => (
                      <div key={paiement.id} className="p-4 hover:bg-muted/50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold text-lg text-green-600">
                                {formatMontant(paiement.montant)}
                              </span>
                              <Badge variant="outline">{paiement.mode_paiement}</Badge>
                              {paiement.reference && (
                                <span className="text-sm text-muted-foreground">
                                  Réf: {paiement.reference}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              Payé le {formatDate(paiement.date || paiement.created_at)}
                            </div>
                            
                            {/* Liste des primes payées dans ce lot */}
                            {paiement.primes && paiement.primes.length > 0 && (
                              <div className="mt-3 bg-muted/30 rounded-lg p-3">
                                <div className="text-xs font-medium text-muted-foreground mb-2">
                                  Primes incluses:
                                </div>
                                <div className="space-y-1">
                                  {paiement.primes.map((prime: any) => (
                                    <div key={prime.id} className="flex justify-between text-sm">
                                      <span 
                                        className="text-primary hover:underline cursor-pointer"
                                        onClick={() => {
                                          if (prime.ordre_id) navigate(`/ordres/${prime.ordre_id}`);
                                          else if (prime.facture_id) navigate(`/factures/${prime.facture_id}`);
                                        }}
                                      >
                                        {prime.ordre?.numero || prime.facture?.numero || prime.description || `Prime #${prime.id}`}
                                      </span>
                                      <span className="font-mono">{formatMontant(prime.montant)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 print:hidden"
                            onClick={() => {
                              const nomComplet = representant.nom_complet || `${representant.prenom || ''} ${representant.nom}`.trim();
                              const printContent = `
                                <html>
                                <head>
                                  <title>Reçu de paiement - ${paiement.reference || paiement.id}</title>
                                  <style>
                                    body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
                                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                                    .header h1 { margin: 0; font-size: 24px; }
                                    .info { margin: 20px 0; }
                                    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                                    .primes { margin-top: 20px; }
                                    .primes h3 { margin-bottom: 10px; font-size: 14px; color: #666; }
                                    .prime-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
                                    .total { margin-top: 20px; padding-top: 20px; border-top: 2px solid #333; font-size: 20px; font-weight: bold; text-align: right; }
                                    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
                                  </style>
                                </head>
                                <body>
                                  <div class="header">
                                    <h1>REÇU DE PAIEMENT</h1>
                                    <p>Prime ${nomComplet}</p>
                                  </div>
                                  <div class="info">
                                    <div class="info-row"><span>Date:</span><span>${formatDate(paiement.date || paiement.created_at)}</span></div>
                                    <div class="info-row"><span>Mode de paiement:</span><span>${paiement.mode_paiement}</span></div>
                                    ${paiement.reference ? `<div class="info-row"><span>Référence:</span><span>${paiement.reference}</span></div>` : ''}
                                    <div class="info-row"><span>Bénéficiaire:</span><span>${nomComplet}</span></div>
                                  </div>
                                  ${paiement.primes && paiement.primes.length > 0 ? `
                                    <div class="primes">
                                      <h3>DÉTAIL DES PRIMES PAYÉES</h3>
                                      ${paiement.primes.map((p: any) => `
                                        <div class="prime-row">
                                          <span>${p.ordre?.numero || p.facture?.numero || p.description || 'Prime #' + p.id}</span>
                                          <span>${formatMontant(p.montant)}</span>
                                        </div>
                                      `).join('')}
                                    </div>
                                  ` : ''}
                                  <div class="total">
                                    TOTAL: ${formatMontant(paiement.montant)}
                                  </div>
                                  <div class="footer">
                                    <p>Document généré le ${new Date().toLocaleDateString('fr-FR')}</p>
                                  </div>
                                </body>
                                </html>
                              `;
                              const printWindow = window.open('', '_blank');
                              if (printWindow) {
                                printWindow.document.write(printContent);
                                printWindow.document.close();
                                printWindow.print();
                              }
                            }}
                          >
                            <Printer className="h-4 w-4" />
                            Imprimer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal Paiement */}
      <PaiementPrimeModal 
        open={showPaiementModal}
        onOpenChange={setShowPaiementModal}
        partenaireNom={representant.nom || ''}
        partenaireType="representant"
        primes={primes.filter((p: any) => selectedPrimes.length > 0 ? selectedPrimes.includes(String(p.id)) : p.statut !== 'Payée')}
        total={selectedTotal > 0 ? selectedTotal : primesDues}
        onSuccess={() => {}}
      />
    </MainLayout>
  );
}
