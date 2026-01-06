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
  Mail,
  ArrowRight,
  Ban,
  Trash2,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  PenLine,
} from "lucide-react";
import { devis, clients, formatMontant, formatDate, getStatutLabel } from "@/data/mockData";

// Mock traçabilité data
const getTracabiliteDevis = (devisId: string) => [
  {
    id: "1",
    action: "Création",
    utilisateur: "Jean Dupont",
    date: "2026-01-02 09:15:00",
    details: "Devis créé à partir d'une demande client",
    icon: FileText,
    color: "text-blue-600",
  },
  {
    id: "2",
    action: "Modification",
    utilisateur: "Marie Martin",
    date: "2026-01-02 14:30:00",
    details: "Ajout de 2 lignes de prestation",
    icon: PenLine,
    color: "text-orange-600",
  },
  {
    id: "3",
    action: "Envoi",
    utilisateur: "Jean Dupont",
    date: "2026-01-03 10:00:00",
    details: "Envoyé par email à contact@total-gabon.ga",
    icon: Mail,
    color: "text-purple-600",
  },
  {
    id: "4",
    action: "Validation",
    utilisateur: "Admin Principal",
    date: "2026-01-04 16:45:00",
    details: "Devis validé et approuvé",
    icon: CheckCircle,
    color: "text-green-600",
  },
];

export default function DevisDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("details");

  const devisData = devis.find((d) => d.id === id);
  const client = devisData ? clients.find((c) => c.id === devisData.clientId) : null;
  const tracabilite = id ? getTracabiliteDevis(id) : [];

  if (!devisData) {
    return (
      <MainLayout title="Devis non trouvé">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Devis non trouvé</h2>
          <p className="text-muted-foreground mb-4">
            Le devis demandé n'existe pas ou a été supprimé.
          </p>
          <Button onClick={() => navigate("/devis")}>Retour aux devis</Button>
        </div>
      </MainLayout>
    );
  }

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      brouillon: "secondary",
      envoye: "outline",
      accepte: "default",
      refuse: "destructive",
      expire: "destructive",
      annule: "destructive",
    };
    return <Badge variant={variants[statut] || "secondary"}>{getStatutLabel(statut)}</Badge>;
  };

  return (
    <MainLayout title={`Devis ${devisData.numero}`}>
      <div className="space-y-6">
        {/* Header avec actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/devis")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{devisData.numero}</h1>
                {getStatutBadge(devisData.statut)}
              </div>
              <p className="text-muted-foreground">
                Créé le {formatDate(devisData.dateCreation)} • Valide jusqu'au{" "}
                {formatDate(devisData.dateValidite)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.open(`/devis/${id}/pdf`, "_blank")}
            >
              <FileText className="h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate(`/devis/${id}/modifier`)}
            >
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
            <Button variant="outline" className="gap-2 text-blue-600">
              <Mail className="h-4 w-4" />
              Envoyer
            </Button>
            {devisData.statut === "accepte" && (
              <Button className="gap-2">
                <ArrowRight className="h-4 w-4" />
                Convertir en ordre
              </Button>
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
            {/* Infos client */}
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
                    <FileText className="h-5 w-5 text-primary" />
                    Récapitulatif
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant HT</span>
                    <span className="font-medium">{formatMontant(devisData.montantHT)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TVA (18%)</span>
                    <span>{formatMontant(devisData.tva)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CSS (1%)</span>
                    <span>{formatMontant(devisData.css)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total TTC</span>
                    <span className="text-primary">{formatMontant(devisData.montantTTC)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lignes du devis */}
            <Card>
              <CardHeader>
                <CardTitle>Lignes du devis</CardTitle>
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
                    {devisData.lignes.map((ligne) => (
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
            {devisData.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{devisData.notes}</p>
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
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                  <div className="space-y-6">
                    {tracabilite.map((action, index) => {
                      const IconComponent = action.icon;
                      return (
                        <div key={action.id} className="relative flex gap-4 pl-10">
                          {/* Timeline dot */}
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
