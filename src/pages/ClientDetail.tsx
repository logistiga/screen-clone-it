import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  ArrowLeft, Edit, Mail, Phone, MapPin, Building2, Trash2, CreditCard, 
  Receipt, FileText, Download, Loader2, ClipboardList, Eye, Calendar,
  Banknote, TrendingUp, TrendingDown, FileCheck, AlertCircle, ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatMontant, formatDate, getStatutLabel } from "@/data/mockData";
import { getAvoirsClient, type Annulation } from "@/lib/api/annulations";
import { useClient, useDeleteClient } from "@/hooks/use-commercial";
import { ClientDetailHeader } from "@/components/clients";

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
  const soldeDu = client.solde || (totalFacture - totalPaye);

  const handleDelete = async () => {
    try {
      await deleteClientMutation.mutateAsync(id || '');
      navigate("/clients");
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    }
  };

  const getStatutBadge = (statut: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className?: string }> = {
      brouillon: { variant: "secondary" },
      envoye: { variant: "outline", className: "border-blue-500 text-blue-600" },
      accepte: { variant: "default", className: "bg-green-600" },
      refuse: { variant: "destructive" },
      expire: { variant: "destructive" },
      en_cours: { variant: "outline", className: "border-amber-500 text-amber-600" },
      termine: { variant: "default", className: "bg-green-600" },
      facture: { variant: "default" },
      annule: { variant: "destructive" },
      emise: { variant: "outline", className: "border-blue-500 text-blue-600" },
      payee: { variant: "default", className: "bg-green-600" },
      partielle: { variant: "outline", className: "border-amber-500 text-amber-600 bg-amber-50" },
      impayee: { variant: "destructive" },
      annulee: { variant: "destructive" },
    };
    const c = config[statut] || { variant: "secondary" };
    return <Badge variant={c.variant} className={c.className}>{getStatutLabel(statut)}</Badge>;
  };

  return (
    <MainLayout title={client.nom}>
      <div className="space-y-6">
      {/* New Header */}
      <ClientDetailHeader 
        client={client} 
        onDelete={() => setDeleteConfirm(true)}
      />

        {/* Client Info + Stats - Improved Layout */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Client Info Card */}
          <Card className="lg:col-span-7 overflow-hidden">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Informations du client
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  Client depuis {client.created_at ? formatDate(client.created_at) : '-'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Contact Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Contact</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">{client.email || '-'}</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">{client.telephone || '-'}</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">{client.adresse || '-'}{client.ville ? `, ${client.ville}` : ''}</span>
                    </div>
                  </div>
                </div>
                
                {/* Legal Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Informations légales</h4>
                  <div className="space-y-3">
                    {client.rccm && (
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                        <FileCheck className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-xs text-muted-foreground">RCCM</span>
                          <p className="text-sm font-medium">{client.rccm}</p>
                        </div>
                      </div>
                    )}
                    {client.nif && (
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                        <FileCheck className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-xs text-muted-foreground">NIF</span>
                          <p className="text-sm font-medium">{client.nif}</p>
                        </div>
                      </div>
                    )}
                    {client.limite_credit > 0 && (
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <CreditCard className="h-4 w-4 text-amber-600" />
                        <div>
                          <span className="text-xs text-muted-foreground">Plafond crédit</span>
                          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">{formatMontant(client.limite_credit)}</p>
                        </div>
                      </div>
                    )}
                    {!client.rccm && !client.nif && !client.limite_credit && (
                      <p className="text-sm text-muted-foreground italic">Aucune information légale renseignée</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards - Improved */}
          <div className="lg:col-span-5 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Facturé</p>
                    <p className="text-2xl font-bold mt-1">{formatMontant(totalFacture)}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Receipt className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Payé</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{formatMontant(totalPaye)}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className={`border-l-4 ${soldeDu > 0 ? 'border-l-red-500' : 'border-l-gray-300'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Solde Dû</p>
                    <p className={`text-2xl font-bold mt-1 ${soldeDu > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {formatMontant(soldeDu)}
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${soldeDu > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-muted'}`}>
                    {soldeDu > 0 ? (
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {soldeAvoirsTotal > 0 && (
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avoirs disponibles</p>
                      <p className="text-2xl font-bold text-purple-600 mt-1">{formatMontant(soldeAvoirsTotal)}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Banknote className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Tabs with documents */}
        <Card>
          <Tabs defaultValue="factures" className="w-full">
            <CardHeader className="pb-0">
              <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-transparent p-0">
                <TabsTrigger value="factures" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Receipt className="h-4 w-4" />
                  Factures
                  <Badge variant="secondary" className="ml-1 text-xs">{clientFactures.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="ordres" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <ClipboardList className="h-4 w-4" />
                  Ordres
                  <Badge variant="secondary" className="ml-1 text-xs">{clientOrdres.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="devis" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <FileText className="h-4 w-4" />
                  Devis
                  <Badge variant="secondary" className="ml-1 text-xs">{clientDevis.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="paiements" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Banknote className="h-4 w-4" />
                  Paiements
                  <Badge variant="secondary" className="ml-1 text-xs">{clientPaiements.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="avoirs" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Receipt className="h-4 w-4" />
                  Avoirs
                  <Badge variant="secondary" className="ml-1 text-xs">{clientAvoirs.length}</Badge>
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Factures Tab */}
              <TabsContent value="factures" className="mt-0">
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Numéro</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Échéance</TableHead>
                        <TableHead className="text-right">Montant TTC</TableHead>
                        <TableHead className="text-right">Payé</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-center w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientFactures.map((facture: any) => (
                        <TableRow key={facture.id} className="group hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <Link to={`/factures/${facture.id}`} className="text-primary hover:underline">
                              {facture.numero}
                            </Link>
                          </TableCell>
                          <TableCell>{formatDate(facture.date_facture || facture.created_at)}</TableCell>
                          <TableCell>{formatDate(facture.date_echeance)}</TableCell>
                          <TableCell className="text-right font-medium">{formatMontant(facture.montant_ttc)}</TableCell>
                          <TableCell className="text-right text-green-600">{formatMontant(facture.montant_paye || 0)}</TableCell>
                          <TableCell>{getStatutBadge(facture.statut)}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/factures/${facture.id}`)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Voir détails</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => navigate(`/factures/${facture.id}/pdf`)}>
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Télécharger PDF</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {clientFactures.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            Aucune facture
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Ordres Tab */}
              <TabsContent value="ordres" className="mt-0">
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Numéro</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Montant TTC</TableHead>
                        <TableHead className="text-right">Payé</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-center w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientOrdres.map((ordre: any) => (
                        <TableRow key={ordre.id} className="group hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <Link to={`/ordres/${ordre.id}`} className="text-primary hover:underline">
                              {ordre.numero}
                            </Link>
                          </TableCell>
                          <TableCell>{formatDate(ordre.date || ordre.created_at)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {ordre.type_operation || ordre.categorie || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatMontant(ordre.montant_ttc)}</TableCell>
                          <TableCell className="text-right text-green-600">{formatMontant(ordre.montant_paye || 0)}</TableCell>
                          <TableCell>{getStatutBadge(ordre.statut)}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/ordres/${ordre.id}`)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Voir détails</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => navigate(`/ordres/${ordre.id}/pdf`)}>
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Télécharger PDF</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {clientOrdres.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                            <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            Aucun ordre de travail
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Devis Tab */}
              <TabsContent value="devis" className="mt-0">
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Numéro</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Validité</TableHead>
                        <TableHead className="text-right">Montant TTC</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-center w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientDevis.map((d: any) => (
                        <TableRow key={d.id} className="group hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <Link to={`/devis/${d.id}`} className="text-primary hover:underline">
                              {d.numero}
                            </Link>
                          </TableCell>
                          <TableCell>{formatDate(d.date || d.created_at)}</TableCell>
                          <TableCell>{formatDate(d.date_validite)}</TableCell>
                          <TableCell className="text-right font-medium">{formatMontant(d.montant_ttc)}</TableCell>
                          <TableCell>{getStatutBadge(d.statut)}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/devis/${d.id}`)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Voir détails</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => navigate(`/devis/${d.id}/pdf`)}>
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Télécharger PDF</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {clientDevis.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            Aucun devis
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Paiements Tab */}
              <TabsContent value="paiements" className="mt-0">
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Date</TableHead>
                        <TableHead>Document</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Référence</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientPaiements.map((paiement: any) => (
                        <TableRow key={paiement.id} className="hover:bg-muted/50">
                          <TableCell>{formatDate(paiement.date_paiement || paiement.date)}</TableCell>
                          <TableCell>
                            {paiement.document_numero ? (
                              <Link 
                                to={paiement.document_type === 'facture' 
                                  ? `/factures/${paiement.facture_id}` 
                                  : `/ordres/${paiement.ordre_id}`
                                } 
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                {paiement.document_numero}
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {paiement.mode_paiement}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{paiement.reference || paiement.numero_cheque || '-'}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            +{formatMontant(paiement.montant)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {clientPaiements.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            <Banknote className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            Aucun paiement enregistré
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Avoirs Tab */}
              <TabsContent value="avoirs" className="mt-0">
                {clientAvoirs.length > 0 ? (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>N° Avoir</TableHead>
                          <TableHead>Document annulé</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Motif</TableHead>
                          <TableHead className="text-right">Montant initial</TableHead>
                          <TableHead className="text-right">Solde disponible</TableHead>
                          <TableHead className="text-center w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientAvoirs.map((avoir: Annulation) => (
                          <TableRow key={avoir.id} className="group hover:bg-muted/50">
                            <TableCell className="font-medium text-purple-600">
                              {avoir.numero_avoir}
                            </TableCell>
                            <TableCell>
                              <Link to={`/annulations`} className="flex items-center gap-2 text-primary hover:underline">
                                <FileText className="h-4 w-4" />
                                {avoir.document_numero}
                              </Link>
                            </TableCell>
                            <TableCell>{formatDate(avoir.date)}</TableCell>
                            <TableCell className="max-w-[200px] truncate text-muted-foreground">
                              {avoir.motif || '-'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatMontant(avoir.montant)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={avoir.solde_avoir > 0 ? "text-green-600 font-semibold" : "text-muted-foreground"}>
                                {formatMontant(avoir.solde_avoir)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-primary"
                                      onClick={() => navigate(`/annulations/${avoir.id}/avoir`)}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Télécharger l'avoir PDF</TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg bg-muted/30">
                    <Receipt className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground font-medium">Aucun avoir disponible pour ce client</p>
                    <p className="text-sm text-muted-foreground mt-1">Les avoirs sont générés lors de l'annulation de documents payés</p>
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
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
