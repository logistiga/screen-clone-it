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
import { ArrowLeft, Edit, Mail, Phone, MapPin, ClipboardList, Receipt, FileText, Loader2 } from "lucide-react";
import { formatMontant, formatDate, getStatutLabel } from "@/data/mockData";
import { useTransitaireById } from "@/hooks/use-commercial";

export default function TransitaireDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: transitaire, isLoading, error } = useTransitaireById(id);

  if (isLoading) {
    return (
      <MainLayout title="Chargement...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  if (error || !transitaire) {
    return (
      <MainLayout title="Transitaire non trouvé">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Ce transitaire n'existe pas.</p>
          <Button variant="link" onClick={() => navigate("/partenaires")}>
            Retour aux partenaires
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Données venant de l'API
  const ordres = transitaire.ordres_travail || [];
  const factures = transitaire.factures || [];
  const devisList = transitaire.devis || [];

  // Calculer les totaux
  const totalOrdres = ordres.length;
  const totalFactures = factures.length;
  const totalDevis = devisList.length;
  const montantTotalFactures = factures.reduce((sum: number, f: any) => sum + (f.montant_ttc || 0), 0);
  const montantTotalOrdres = ordres.reduce((sum: number, o: any) => sum + (o.montant_ttc || 0), 0);

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
      brouillon: "secondary",
      envoye: "outline",
      accepte: "default",
      refuse: "destructive",
      expire: "destructive",
      converti: "default",
    };
    return <Badge variant={variants[statut] || "secondary"}>{getStatutLabel(statut)}</Badge>;
  };

  return (
    <MainLayout title={transitaire.nom || 'Transitaire'}>
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
          </div>
        </div>

        {/* Info + Stats */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Informations du transitaire</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{transitaire.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{transitaire.telephone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{transitaire.adresse || '-'}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Partenaire depuis le {transitaire.created_at ? formatDate(transitaire.created_at) : '-'}
                  </div>
                  <Badge variant={transitaire.actif !== false ? "default" : "secondary"}>
                    {transitaire.actif !== false ? "Actif" : "Inactif"}
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
                <div className="text-2xl font-bold">{totalOrdres}</div>
                <p className="text-xs text-muted-foreground">{formatMontant(montantTotalOrdres)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Factures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalFactures}</div>
                <p className="text-xs text-muted-foreground">{formatMontant(montantTotalFactures)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Devis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDevis}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="ordres" className="w-full">
          <TabsList>
            <TabsTrigger value="ordres" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Ordres ({totalOrdres})
            </TabsTrigger>
            <TabsTrigger value="factures" className="gap-2">
              <Receipt className="h-4 w-4" />
              Factures ({totalFactures})
            </TabsTrigger>
            <TabsTrigger value="devis" className="gap-2">
              <FileText className="h-4 w-4" />
              Devis ({totalDevis})
            </TabsTrigger>
          </TabsList>

          {/* Ordres Tab */}
          <TabsContent value="ordres" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Numéro</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Montant TTC</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordres.map((ordre: any) => (
                      <TableRow 
                        key={ordre.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/ordres/${ordre.id}`)}
                      >
                        <TableCell className="font-medium">{ordre.numero}</TableCell>
                        <TableCell>{formatDate(ordre.date || ordre.created_at)}</TableCell>
                        <TableCell>{ordre.client?.nom || '-'}</TableCell>
                        <TableCell className="text-right">{formatMontant(ordre.montant_ttc)}</TableCell>
                        <TableCell>{getStatutBadge(ordre.statut)}</TableCell>
                      </TableRow>
                    ))}
                    {ordres.length === 0 && (
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
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Montant TTC</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {factures.map((facture: any) => (
                      <TableRow 
                        key={facture.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/factures/${facture.id}`)}
                      >
                        <TableCell className="font-medium">{facture.numero}</TableCell>
                        <TableCell>{formatDate(facture.date_facture || facture.created_at)}</TableCell>
                        <TableCell>{facture.client?.nom || '-'}</TableCell>
                        <TableCell className="text-right">{formatMontant(facture.montant_ttc)}</TableCell>
                        <TableCell>{getStatutBadge(facture.statut)}</TableCell>
                      </TableRow>
                    ))}
                    {factures.length === 0 && (
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

          {/* Devis Tab */}
          <TabsContent value="devis" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Numéro</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Montant TTC</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devisList.map((devis: any) => (
                      <TableRow 
                        key={devis.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/devis/${devis.id}`)}
                      >
                        <TableCell className="font-medium">{devis.numero}</TableCell>
                        <TableCell>{formatDate(devis.date || devis.created_at)}</TableCell>
                        <TableCell>{devis.client?.nom || '-'}</TableCell>
                        <TableCell className="text-right">{formatMontant(devis.montant_ttc)}</TableCell>
                        <TableCell>{getStatutBadge(devis.statut)}</TableCell>
                      </TableRow>
                    ))}
                    {devisList.length === 0 && (
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
        </Tabs>
      </div>
    </MainLayout>
  );
}
