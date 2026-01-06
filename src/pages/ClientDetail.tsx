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
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building2 } from "lucide-react";
import { 
  clients, devis, ordresTravail, factures, paiements,
  formatMontant, formatDate, getStatutLabel 
} from "@/data/mockData";

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const client = clients.find(c => c.id === id);
  
  if (!client) {
    return (
      <MainLayout title="Client non trouvé">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Ce client n'existe pas.</p>
          <Button variant="link" onClick={() => navigate("/clients")}>
            Retour à la liste
          </Button>
        </div>
      </MainLayout>
    );
  }

  const clientDevis = devis.filter(d => d.clientId === id);
  const clientOrdres = ordresTravail.filter(o => o.clientId === id);
  const clientFactures = factures.filter(f => f.clientId === id);
  const clientPaiements = paiements.filter(p => p.clientId === id);

  const totalFacture = clientFactures.reduce((sum, f) => sum + f.montantTTC, 0);
  const totalPaye = clientPaiements.reduce((sum, p) => sum + p.montant, 0);

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      brouillon: "secondary",
      envoye: "outline",
      accepte: "default",
      refuse: "destructive",
      expire: "destructive",
      en_cours: "outline",
      termine: "default",
      facture: "default",
      annule: "destructive",
      emise: "outline",
      payee: "default",
      partielle: "secondary",
      impayee: "destructive",
      annulee: "destructive",
    };
    return <Badge variant={variants[statut] || "secondary"}>{getStatutLabel(statut)}</Badge>;
  };

  return (
    <MainLayout title={client.nom}>
      <div className="space-y-6">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate("/clients")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour aux clients
        </Button>

        {/* Client Info + Stats */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Informations du client</CardTitle>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="h-4 w-4" />
                Modifier
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{client.telephone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{client.adresse}, {client.ville}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {client.rccm && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>RCCM: {client.rccm}</span>
                    </div>
                  )}
                  {client.nif && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>NIF: {client.nif}</span>
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Client depuis le {formatDate(client.dateCreation)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Facturé
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMontant(totalFacture)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Payé
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatMontant(totalPaye)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Solde Dû
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{formatMontant(client.solde)}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs with documents */}
        <Tabs defaultValue="factures" className="w-full">
          <TabsList>
            <TabsTrigger value="factures">
              Factures ({clientFactures.length})
            </TabsTrigger>
            <TabsTrigger value="ordres">
              Ordres ({clientOrdres.length})
            </TabsTrigger>
            <TabsTrigger value="devis">
              Devis ({clientDevis.length})
            </TabsTrigger>
            <TabsTrigger value="paiements">
              Paiements ({clientPaiements.length})
            </TabsTrigger>
          </TabsList>

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
                      <TableHead className="text-right">Payé</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientFactures.map((facture) => (
                      <TableRow key={facture.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{facture.numero}</TableCell>
                        <TableCell>{formatDate(facture.dateCreation)}</TableCell>
                        <TableCell>{formatDate(facture.dateEcheance)}</TableCell>
                        <TableCell className="text-right">{formatMontant(facture.montantTTC)}</TableCell>
                        <TableCell className="text-right">{formatMontant(facture.montantPaye)}</TableCell>
                        <TableCell>{getStatutBadge(facture.statut)}</TableCell>
                      </TableRow>
                    ))}
                    {clientFactures.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          Aucune facture
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

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
                    {clientOrdres.map((ordre) => (
                      <TableRow key={ordre.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{ordre.numero}</TableCell>
                        <TableCell>{formatDate(ordre.dateCreation)}</TableCell>
                        <TableCell className="capitalize">{ordre.typeOperation}</TableCell>
                        <TableCell className="text-right">{formatMontant(ordre.montantTTC)}</TableCell>
                        <TableCell>{getStatutBadge(ordre.statut)}</TableCell>
                      </TableRow>
                    ))}
                    {clientOrdres.length === 0 && (
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

          <TabsContent value="devis" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Numéro</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Validité</TableHead>
                      <TableHead className="text-right">Montant TTC</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientDevis.map((d) => (
                      <TableRow key={d.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{d.numero}</TableCell>
                        <TableCell>{formatDate(d.dateCreation)}</TableCell>
                        <TableCell>{formatDate(d.dateValidite)}</TableCell>
                        <TableCell className="text-right">{formatMontant(d.montantTTC)}</TableCell>
                        <TableCell>{getStatutBadge(d.statut)}</TableCell>
                      </TableRow>
                    ))}
                    {clientDevis.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          Aucun devis
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paiements" className="mt-4">
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
                    {clientPaiements.map((paiement) => (
                      <TableRow key={paiement.id}>
                        <TableCell>{formatDate(paiement.date)}</TableCell>
                        <TableCell className="capitalize">{paiement.modePaiement}</TableCell>
                        <TableCell>{paiement.reference || paiement.numeroCheque || '-'}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatMontant(paiement.montant)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {clientPaiements.length === 0 && (
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
    </MainLayout>
  );
}
