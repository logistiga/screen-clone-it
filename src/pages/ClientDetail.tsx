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
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building2, Trash2, CreditCard, Clock, Receipt, FileText, Download, Loader2, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatMontant, formatDate, getStatutLabel } from "@/data/mockData";
import { getAvoirsClient, type Annulation } from "@/lib/api/annulations";
import { useClient, useDeleteClient } from "@/hooks/use-commercial";

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
  const { data: client, isLoading, error } = useClient(id || '');
  const deleteClientMutation = useDeleteClient();

  // Charger les avoirs du client depuis l'API
  const { data: avoirsData } = useQuery({
    queryKey: ['client-avoirs', id],
    queryFn: () => getAvoirsClient(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <MainLayout title="Chargement...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !client) {
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

  // Données de l'API (avec fallback sur tableaux vides)
  const clientDevis = (client as any).devis || [];
  const clientOrdres = (client as any).ordres_travail || [];
  const clientFactures = (client as any).factures || [];
  const clientPaiements = (client as any).paiements || [];
  const clientAvoirs = avoirsData?.avoirs || [];
  const soldeAvoirsTotal = avoirsData?.solde_total || 0;

  // Calculer les totaux
  const totalFacture = clientFactures.reduce((sum: number, f: any) => sum + (f.montant_ttc || 0), 0);
  const totalPaye = clientPaiements.reduce((sum: number, p: any) => sum + (p.montant || 0), 0);

  const handleDelete = async () => {
    try {
      await deleteClientMutation.mutateAsync(id || '');
      navigate("/clients");
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    }
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
                    <span>{client.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{client.telephone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{client.adresse || '-'}{client.ville ? `, ${client.ville}` : ''}</span>
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
                  {client.limite_credit > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span>Plafond: {formatMontant(client.limite_credit)}</span>
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Client depuis le {client.created_at ? formatDate(client.created_at) : '-'}
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
            <TabsTrigger value="factures" className="gap-2">
              <Receipt className="h-4 w-4" />
              Factures ({clientFactures.length})
            </TabsTrigger>
            <TabsTrigger value="ordres" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Ordres ({clientOrdres.length})
            </TabsTrigger>
            <TabsTrigger value="devis" className="gap-2">
              <FileText className="h-4 w-4" />
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
                    {clientFactures.map((facture: any) => (
                      <TableRow 
                        key={facture.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/factures/${facture.id}`)}
                      >
                        <TableCell className="font-medium">{facture.numero}</TableCell>
                        <TableCell>{formatDate(facture.date_facture || facture.created_at)}</TableCell>
                        <TableCell>{formatDate(facture.date_echeance)}</TableCell>
                        <TableCell className="text-right">{formatMontant(facture.montant_ttc)}</TableCell>
                        <TableCell className="text-right">{formatMontant(facture.montant_paye || 0)}</TableCell>
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
                    {clientOrdres.map((ordre: any) => (
                      <TableRow 
                        key={ordre.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/ordres/${ordre.id}`)}
                      >
                        <TableCell className="font-medium">{ordre.numero}</TableCell>
                        <TableCell>{formatDate(ordre.date || ordre.created_at)}</TableCell>
                        <TableCell className="capitalize">{ordre.type_operation || ordre.categorie || '-'}</TableCell>
                        <TableCell className="text-right">{formatMontant(ordre.montant_ttc)}</TableCell>
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
                    {clientDevis.map((d: any) => (
                      <TableRow 
                        key={d.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/devis/${d.id}`)}
                      >
                        <TableCell className="font-medium">{d.numero}</TableCell>
                        <TableCell>{formatDate(d.date || d.created_at)}</TableCell>
                        <TableCell>{formatDate(d.date_validite)}</TableCell>
                        <TableCell className="text-right">{formatMontant(d.montant_ttc)}</TableCell>
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
                    {clientPaiements.map((paiement: any) => (
                      <TableRow key={paiement.id}>
                        <TableCell>{formatDate(paiement.date_paiement || paiement.date)}</TableCell>
                        <TableCell className="capitalize">{paiement.mode_paiement}</TableCell>
                        <TableCell>{paiement.reference || '-'}</TableCell>
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
