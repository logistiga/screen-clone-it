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
  ArrowRight,
  Wallet,
  Ban,
  Trash2,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  PenLine,
  Ship,
} from "lucide-react";
import { ordresTravail, clients, formatMontant, formatDate, getStatutLabel } from "@/data/mockData";

// Mock traçabilité data
const getTracabiliteOrdre = (ordreId: string) => [
  {
    id: "1",
    action: "Création",
    utilisateur: "Jean Dupont",
    date: "2026-01-02 08:30:00",
    details: "Ordre de travail créé",
    icon: FileText,
    color: "text-blue-600",
  },
  {
    id: "2",
    action: "Modification",
    utilisateur: "Marie Martin",
    date: "2026-01-02 11:00:00",
    details: "Ajout de 2 conteneurs",
    icon: PenLine,
    color: "text-orange-600",
  },
  {
    id: "3",
    action: "Paiement partiel",
    utilisateur: "Admin Principal",
    date: "2026-01-03 14:30:00",
    details: "Paiement de 500 000 FCFA reçu",
    icon: Wallet,
    color: "text-green-600",
  },
  {
    id: "4",
    action: "Validation",
    utilisateur: "Directeur",
    date: "2026-01-04 09:00:00",
    details: "Ordre validé et approuvé",
    icon: CheckCircle,
    color: "text-green-600",
  },
];

export default function OrdreDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("details");

  const ordre = ordresTravail.find((o) => o.id === id);
  const client = ordre ? clients.find((c) => c.id === ordre.clientId) : null;
  const tracabilite = id ? getTracabiliteOrdre(id) : [];

  if (!ordre) {
    return (
      <MainLayout title="Ordre non trouvé">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ordre de travail non trouvé</h2>
          <p className="text-muted-foreground mb-4">
            L'ordre demandé n'existe pas ou a été supprimé.
          </p>
          <Button onClick={() => navigate("/ordres")}>Retour aux ordres</Button>
        </div>
      </MainLayout>
    );
  }

  const resteAPayer = ordre.montantTTC - ordre.montantPaye;

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      en_cours: "outline",
      termine: "default",
      facture: "default",
      annule: "destructive",
    };
    return <Badge variant={variants[statut] || "secondary"}>{getStatutLabel(statut)}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      conteneurs: "bg-blue-100 text-blue-800",
      conventionnel: "bg-purple-100 text-purple-800",
      location: "bg-orange-100 text-orange-800",
      transport: "bg-green-100 text-green-800",
      manutention: "bg-yellow-100 text-yellow-800",
      stockage: "bg-gray-100 text-gray-800",
    };
    return <Badge className={colors[type] || "bg-gray-100"}>{type}</Badge>;
  };

  return (
    <MainLayout title={`Ordre ${ordre.numero}`}>
      <div className="space-y-6">
        {/* Header avec actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/ordres")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{ordre.numero}</h1>
                {getStatutBadge(ordre.statut)}
                {getTypeBadge(ordre.typeOperation)}
              </div>
              <p className="text-muted-foreground">
                Créé le {formatDate(ordre.dateCreation)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.open(`/ordres/${id}/pdf`, "_blank")}
            >
              <FileText className="h-4 w-4" />
              PDF
            </Button>
            {ordre.statut !== 'facture' && ordre.statut !== 'annule' && (
              <>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate(`/ordres/${id}/modifier`)}
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </Button>
                <Button variant="outline" className="gap-2 text-green-600">
                  <Wallet className="h-4 w-4" />
                  Paiement
                </Button>
                <Button className="gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Facturer
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
                    <Ship className="h-5 w-5 text-primary" />
                    Récapitulatif financier
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant HT</span>
                    <span className="font-medium">{formatMontant(ordre.montantHT)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TVA (18%)</span>
                    <span>{formatMontant(ordre.tva)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CSS (1%)</span>
                    <span>{formatMontant(ordre.css)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total TTC</span>
                    <span className="text-primary">{formatMontant(ordre.montantTTC)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant payé</span>
                    <span className="text-green-600 font-medium">{formatMontant(ordre.montantPaye)}</span>
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

            {/* Lignes de l'ordre */}
            <Card>
              <CardHeader>
                <CardTitle>Lignes de l'ordre</CardTitle>
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
                    {ordre.lignes.map((ligne) => (
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
            {ordre.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{ordre.notes}</p>
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
