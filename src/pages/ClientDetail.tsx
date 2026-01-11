import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building2, Trash2, CreditCard, Clock, Users, User, Receipt, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  clients, devis, ordresTravail, factures, paiements,
  formatMontant, formatDate, getStatutLabel 
} from "@/data/mockData";
import { getAvoirsClient, type Annulation } from "@/lib/api/annulations";

// Mock contacts pour la démo
const getClientContacts = (clientId: string) => [
  { id: "1", prenom: "Jean", nom: "DUPONT", email: "j.dupont@total-gabon.ga", telephone: "+241 07 12 34 56", fonction: "Responsable logistique" },
  { id: "2", prenom: "Marie", nom: "NZENG", email: "m.nzeng@total-gabon.ga", telephone: "+241 06 98 76 54", fonction: "Assistante commerciale" },
];

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
  const client = clients.find(c => c.id === id);
  const contacts = id ? getClientContacts(id) : [];
  
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

  // Charger les avoirs du client depuis l'API
  const { data: avoirsData } = useQuery({
    queryKey: ['client-avoirs', id],
    queryFn: () => getAvoirsClient(Number(id)),
    enabled: !!id,
  });

  const clientAvoirs = avoirsData?.avoirs || [];
  const soldeAvoirsTotal = avoirsData?.solde_total || 0;

  const totalFacture = clientFactures.reduce((sum, f) => sum + f.montantTTC, 0);
  const totalPaye = clientPaiements.reduce((sum, p) => sum + p.montant, 0);

  // Mock pour plafond et délai
  const plafondCredit = 50000000;
  const delaiPaiement = 30;

  const handleDelete = () => {
    toast({
      title: "Client supprimé",
      description: `Le client ${client.nom} a été supprimé.`,
      variant: "destructive",
    });
    navigate("/clients");
  };

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
        {/* Header with actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" onClick={() => navigate("/clients")} className="gap-2 w-fit">
            <ArrowLeft className="h-4 w-4" />
            Retour aux clients
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => navigate(`/clients/${id}/modifier`)}
            >
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
            <Button 
              variant="destructive" 
              className="gap-2"
              onClick={() => setDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          </div>
        </div>

        {/* Client Info + Stats */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Informations du client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
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
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span>Plafond: {formatMontant(plafondCredit)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Délai paiement: {delaiPaiement} jours</span>
                  </div>
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
        <Tabs defaultValue="contacts" className="w-full">
          <TabsList>
            <TabsTrigger value="contacts" className="gap-2">
              <Users className="h-4 w-4" />
              Contacts ({contacts.length})
            </TabsTrigger>
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
            <TabsTrigger value="avoirs" className="gap-2">
              <Receipt className="h-4 w-4" />
              Avoirs
            </TabsTrigger>
          </TabsList>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Interlocuteurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contacts.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{contact.prenom} {contact.nom}</p>
                            <p className="text-sm text-muted-foreground">{contact.fonction}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                              {contact.email}
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{contact.telephone}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    Aucun contact enregistré
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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

          <TabsContent value="avoirs" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Avoirs disponibles
                </CardTitle>
                {soldeAvoirsTotal > 0 && (
                  <Badge variant="default" className="text-lg px-3 py-1">
                    Solde: {formatMontant(soldeAvoirsTotal)}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                {clientAvoirs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>N° Avoir</TableHead>
                        <TableHead>Document annulé</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Montant initial</TableHead>
                        <TableHead className="text-right">Solde disponible</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientAvoirs.map((avoir: Annulation) => (
                        <TableRow key={avoir.id}>
                          <TableCell className="font-medium text-primary">
                            {avoir.numero_avoir}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              {avoir.document_numero}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(avoir.date)}</TableCell>
                          <TableCell className="text-right">
                            {formatMontant(avoir.montant)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={avoir.solde_avoir > 0 ? "text-green-600 font-semibold" : "text-muted-foreground"}>
                              {formatMontant(avoir.solde_avoir)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/annulations/${avoir.id}/avoir`)}
                              className="gap-1"
                            >
                              <Download className="h-4 w-4" />
                              PDF
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun avoir disponible pour ce client</p>
                    <p className="text-sm mt-1">Les avoirs sont générés lors de l'annulation de documents payés</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de confirmation suppression */}
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le client <strong>{client.nom}</strong> ? 
              Cette action supprimera également tous les documents associés et est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non, annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Oui, supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
