import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  FileText,
  Edit,
  Wallet,
  Ban,
  Trash2,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  PenLine,
  Mail,
  Receipt,
} from "lucide-react";
import { factures, clients, formatMontant, formatDate, getStatutLabel } from "@/data/mockData";

// Mock traçabilité data
const getTracabiliteFacture = (factureId: string) => [
  {
    id: "1",
    action: "Création",
    utilisateur: "Jean Dupont",
    date: "2026-01-03 09:00:00",
    details: "Facture créée à partir de l'ordre OT-2026-0001",
    icon: FileText,
    color: "text-blue-600",
  },
  {
    id: "2",
    action: "Envoi par email",
    utilisateur: "Marie Martin",
    date: "2026-01-03 10:30:00",
    details: "Facture envoyée au client par email",
    icon: Mail,
    color: "text-purple-600",
  },
  {
    id: "3",
    action: "Paiement reçu",
    utilisateur: "Admin Principal",
    date: "2026-01-05 14:30:00",
    details: "Paiement de 1 249 500 FCFA reçu par virement",
    icon: Wallet,
    color: "text-green-600",
  },
  {
    id: "4",
    action: "Validation",
    utilisateur: "Directeur",
    date: "2026-01-05 15:00:00",
    details: "Facture marquée comme payée",
    icon: CheckCircle,
    color: "text-green-600",
  },
];

export default function FactureDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("details");

  const facture = factures.find((f) => f.id === id);
  const client = facture ? clients.find((c) => c.id === facture.clientId) : null;
  const tracabilite = id ? getTracabiliteFacture(id) : [];

  if (!facture) {
    return (
      <MainLayout title="Facture non trouvée">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Facture non trouvée</h2>
          <p className="text-muted-foreground mb-4">
            La facture demandée n'existe pas ou a été supprimée.
          </p>
          <Button onClick={() => navigate("/factures")}>Retour aux factures</Button>
        </div>
      </MainLayout>
    );
  }

  const resteAPayer = facture.montantTTC - facture.montantPaye;

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      emise: "outline",
      payee: "default",
      partielle: "secondary",
      impayee: "destructive",
      annulee: "destructive",
    };
    return <Badge variant={variants[statut] || "secondary"}>{getStatutLabel(statut)}</Badge>;
  };

  return (
    <MainLayout title={`Facture ${facture.numero}`}>
      <div className="space-y-6">
        {/* Header avec actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/factures")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{facture.numero}</h1>
                {getStatutBadge(facture.statut)}
              </div>
              <p className="text-muted-foreground">
                Créée le {formatDate(facture.dateCreation)} • Échéance: {formatDate(facture.dateEcheance)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.open(`/factures/${id}/pdf`, "_blank")}
            >
              <FileText className="h-4 w-4" />
              PDF
            </Button>
            {facture.statut !== 'payee' && facture.statut !== 'annulee' && (
              <>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate(`/factures/${id}/modifier`)}
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </Button>
                <Button variant="outline" className="gap-2 text-green-600">
                  <Wallet className="h-4 w-4" />
                  Paiement
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="details">Détails</TabsTrigger>
            <TabsTrigger value="tracabilite" className="gap-2">
              <Clock className="h-4 w-4" />
              Historique / Traçabilité
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-6">
            {/* Infos client + récap */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-primary" />
                    Client
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-semibold text-lg">{client?.nom}</p>
                  <p className="text-muted-foreground">{client?.email}</p>
                  <p className="text-muted-foreground">{client?.telephone}</p>
                  <p className="text-muted-foreground">
                    {client?.adresse}, {client?.ville}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Receipt className="h-5 w-5 text-primary" />
                    Récapitulatif financier
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant HT</span>
                    <span className="font-medium">{formatMontant(facture.montantHT)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TVA (18%)</span>
                    <span>{formatMontant(facture.tva)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CSS (1%)</span>
                    <span>{formatMontant(facture.css)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total TTC</span>
                    <span className="text-primary">{formatMontant(facture.montantTTC)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant payé</span>
                    <span className="text-green-600 font-medium">{formatMontant(facture.montantPaye)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Reste à payer</span>
                    <span className={resteAPayer > 0 ? "text-destructive" : "text-green-600"}>
                      {formatMontant(resteAPayer)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lignes de la facture */}
            <Card>
              <CardHeader>
                <CardTitle>Lignes de la facture</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Description</TableHead>
                      <TableHead className="text-center">Quantité</TableHead>
                      <TableHead className="text-right">Prix unitaire</TableHead>
                      <TableHead className="text-right">Montant HT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facture.lignes.map((ligne) => (
                      <TableRow key={ligne.id}>
                        <TableCell>{ligne.description}</TableCell>
                        <TableCell className="text-center">{ligne.quantite}</TableCell>
                        <TableCell className="text-right">
                          {formatMontant(ligne.prixUnitaire)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMontant(ligne.montantHT)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Notes */}
            {facture.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{facture.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tracabilite" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Historique des actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-6">
                    {tracabilite.map((action) => {
                      const IconComponent = action.icon;
                      return (
                        <div key={action.id} className="relative flex gap-4 pl-10">
                          <div
                            className={`absolute left-0 p-2 rounded-full bg-background border-2 ${action.color.replace("text-", "border-")}`}
                          >
                            <IconComponent className={`h-4 w-4 ${action.color}`} />
                          </div>
                          <div className="flex-1 bg-muted/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">{action.action}</span>
                              <span className="text-sm text-muted-foreground">{action.date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <User className="h-3 w-3" />
                              <span>{action.utilisateur}</span>
                            </div>
                            <p className="text-sm">{action.details}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
