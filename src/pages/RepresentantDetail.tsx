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
import { ArrowLeft, Edit, Mail, Phone, MapPin, CreditCard, ClipboardList, Receipt, History, DollarSign, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatMontant, formatDate, ordresTravail, factures, getStatutLabel } from "@/data/mockData";
import { 
  getPrimesRepresentant, 
  getPaiementsRepresentant,
  getTotalPrimesDues,
  getTotalPrimesPayees
} from "@/data/partenairesData";
import { PaiementPrimeModal } from "@/components/PaiementPrimeModal";
import { useRepresentantById } from "@/hooks/use-commercial";

export default function RepresentantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [selectedPrimes, setSelectedPrimes] = useState<string[]>([]);
  
  const { data: representant, isLoading, error } = useRepresentantById(id);
  const primes = id ? getPrimesRepresentant(id) : [];
  const paiements = id ? getPaiementsRepresentant(id) : [];

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

  const primesDues = getTotalPrimesDues(primes);
  const primesPayees = getTotalPrimesPayees(primes);
  const primesDuesList = primes.filter(p => p.statut === 'due');

  // Mock: ordres associés à ce représentant (basé sur les primes)
  const ordreIds = [...new Set(primes.map(p => p.ordreId))];
  const representantOrdres = ordresTravail.filter(o => ordreIds.includes(o.id));
  const representantFactures = factures.filter(f => f.ordreId && ordreIds.includes(f.ordreId));

  const handleSelectPrime = (primeId: string, checked: boolean) => {
    if (checked) {
      setSelectedPrimes([...selectedPrimes, primeId]);
    } else {
      setSelectedPrimes(selectedPrimes.filter(id => id !== primeId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPrimes(primesDuesList.map(p => p.id));
    } else {
      setSelectedPrimes([]);
    }
  };

  const selectedTotal = primes
    .filter(p => selectedPrimes.includes(p.id))
    .reduce((sum, p) => sum + p.montant, 0);

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      en_cours: "outline",
      termine: "default",
      facture: "default",
      annule: "destructive",
      emise: "outline",
      payee: "default",
      partielle: "secondary",
      impayee: "destructive",
    };
    return <Badge variant={variants[statut] || "secondary"}>{getStatutLabel(statut)}</Badge>;
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
                  Total Ordres
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{representantOrdres.length}</div>
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
            <TabsTrigger value="ordres" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Ordres ({representantOrdres.length})
            </TabsTrigger>
            <TabsTrigger value="factures" className="gap-2">
              <Receipt className="h-4 w-4" />
              Factures ({representantFactures.length})
            </TabsTrigger>
            <TabsTrigger value="historique" className="gap-2">
              <History className="h-4 w-4" />
              Historique Paiements ({paiements.length})
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
                      <TableHead>Ordre</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date Paiement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {primes.map((prime) => (
                      <TableRow key={prime.id}>
                        <TableCell>
                          {prime.statut === 'due' && (
                            <Checkbox 
                              checked={selectedPrimes.includes(prime.id)}
                              onCheckedChange={(checked) => handleSelectPrime(prime.id, !!checked)}
                            />
                          )}
                        </TableCell>
                        <TableCell 
                          className="font-medium text-primary hover:underline cursor-pointer"
                          onClick={() => navigate(`/ordres/${prime.ordreId}`)}
                        >
                          {prime.ordreNumero}
                        </TableCell>
                        <TableCell>{formatDate(prime.dateCreation)}</TableCell>
                        <TableCell className="text-right font-medium">{formatMontant(prime.montant)}</TableCell>
                        <TableCell>
                          <Badge variant={prime.statut === 'payee' ? 'default' : 'destructive'}>
                            {prime.statut === 'payee' ? 'Payée' : 'Due'}
                          </Badge>
                        </TableCell>
                        <TableCell>{prime.datePaiement ? formatDate(prime.datePaiement) : '-'}</TableCell>
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

          {/* Ordres Tab */}
          <TabsContent value="ordres" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Numéro</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Montant TTC</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {representantOrdres.map((ordre) => (
                      <TableRow 
                        key={ordre.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/ordres/${ordre.id}`)}
                      >
                        <TableCell className="font-medium">{ordre.numero}</TableCell>
                        <TableCell>{formatDate(ordre.dateCreation)}</TableCell>
                        <TableCell className="capitalize">{ordre.typeOperation}</TableCell>
                        <TableCell className="text-right">{formatMontant(ordre.montantTTC)}</TableCell>
                        <TableCell>{getStatutBadge(ordre.statut)}</TableCell>
                      </TableRow>
                    ))}
                    {representantOrdres.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          Aucun ordre de travail
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Factures Tab */}
          <TabsContent value="factures" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Numéro</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Échéance</TableHead>
                      <TableHead className="text-right">Montant TTC</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {representantFactures.map((facture) => (
                      <TableRow 
                        key={facture.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/factures/${facture.id}`)}
                      >
                        <TableCell className="font-medium">{facture.numero}</TableCell>
                        <TableCell>{formatDate(facture.dateCreation)}</TableCell>
                        <TableCell>{formatDate(facture.dateEcheance)}</TableCell>
                        <TableCell className="text-right">{formatMontant(facture.montantTTC)}</TableCell>
                        <TableCell>{getStatutBadge(facture.statut)}</TableCell>
                      </TableRow>
                    ))}
                    {representantFactures.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          Aucune facture
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
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paiements.map((paiement) => (
                      <TableRow key={paiement.id}>
                        <TableCell>{formatDate(paiement.date)}</TableCell>
                        <TableCell className="capitalize">{paiement.modePaiement}</TableCell>
                        <TableCell>{paiement.reference || '-'}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatMontant(paiement.montant)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {paiements.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          Aucun paiement
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal Paiement */}
      <PaiementPrimeModal 
        open={showPaiementModal}
        onOpenChange={setShowPaiementModal}
        partenaireNom={representant.nom}
        partenaireType="representant"
        primes={primes.filter(p => selectedPrimes.length > 0 ? selectedPrimes.includes(p.id) : p.statut === 'due')}
        total={selectedTotal > 0 ? selectedTotal : primesDues}
      />
    </MainLayout>
  );
}
