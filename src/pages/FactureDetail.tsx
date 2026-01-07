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
  Clock,
  User,
  AlertCircle,
  Mail,
  Receipt,
  Loader2,
} from "lucide-react";
import { useFactureById } from "@/hooks/use-commercial";
import { formatMontant, formatDate, getStatutLabel } from "@/data/mockData";
import { PaiementModal } from "@/components/PaiementModal";
import { EmailModal } from "@/components/EmailModal";

export default function FactureDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("details");
  const [paiementModalOpen, setPaiementModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const { data: facture, isLoading, error } = useFactureById(id || "");

  if (isLoading) {
    return (
      <MainLayout title="Chargement...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !facture) {
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

  const resteAPayer = (facture.montant_ttc || 0) - (facture.montant_paye || 0);
  const client = facture.client;

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

  // Traçabilité mock
  const tracabilite = [
    {
      id: "1",
      action: "Création",
      utilisateur: "Système",
      date: facture.created_at || facture.date_facture,
      details: "Facture créée",
      icon: FileText,
      color: "text-blue-600",
    },
  ];

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
                Créée le {formatDate(facture.date_facture)} • Échéance: {formatDate(facture.date_echeance)}
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
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setEmailModalOpen(true)}
            >
              <Mail className="h-4 w-4" />
              Email
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
                {resteAPayer > 0 && (
                  <Button variant="outline" className="gap-2 text-green-600" onClick={() => setPaiementModalOpen(true)}>
                    <Wallet className="h-4 w-4" />
                    Paiement
                  </Button>
                )}
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
                    <span className="font-medium">{formatMontant(facture.montant_ht)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TVA</span>
                    <span>{formatMontant(facture.montant_tva)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CSS</span>
                    <span>{formatMontant(facture.montant_css)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total TTC</span>
                    <span className="text-primary">{formatMontant(facture.montant_ttc)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant payé</span>
                    <span className="text-green-600 font-medium">{formatMontant(facture.montant_paye || 0)}</span>
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

            {/* Infos BL */}
            {facture.bl_numero && (
              <Card>
                <CardHeader>
                  <CardTitle>Informations BL</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Numéro BL</span>
                      <p className="font-mono font-medium">{facture.bl_numero}</p>
                    </div>
                    {facture.navire && (
                      <div>
                        <span className="text-sm text-muted-foreground">Navire</span>
                        <p className="font-medium">{facture.navire}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lignes de la facture */}
            {facture.lignes && facture.lignes.length > 0 && (
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
                      {facture.lignes.map((ligne: any) => (
                        <TableRow key={ligne.id}>
                          <TableCell>{ligne.description || ligne.type_operation}</TableCell>
                          <TableCell className="text-center">{ligne.quantite}</TableCell>
                          <TableCell className="text-right">
                            {formatMontant(ligne.prix_unitaire)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatMontant(ligne.montant_ht)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Conteneurs */}
            {facture.conteneurs && facture.conteneurs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Conteneurs</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Numéro</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Taille</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facture.conteneurs.map((conteneur: any) => (
                        <TableRow key={conteneur.id}>
                          <TableCell className="font-mono">{conteneur.numero}</TableCell>
                          <TableCell>{conteneur.type}</TableCell>
                          <TableCell>{conteneur.taille}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatMontant(conteneur.montant_ht || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Lots */}
            {facture.lots && facture.lots.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Lots</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Désignation</TableHead>
                        <TableHead className="text-center">Quantité</TableHead>
                        <TableHead className="text-right">Prix unitaire</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facture.lots.map((lot: any) => (
                        <TableRow key={lot.id}>
                          <TableCell>{lot.designation}</TableCell>
                          <TableCell className="text-center">{lot.quantite}</TableCell>
                          <TableCell className="text-right">
                            {formatMontant(lot.prix_unitaire)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatMontant(lot.montant_ht || lot.quantite * lot.prix_unitaire)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

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
                              <span className="text-sm text-muted-foreground">{formatDate(action.date)}</span>
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

      {/* Modal paiement */}
      <PaiementModal
        open={paiementModalOpen}
        onOpenChange={setPaiementModalOpen}
        documentType="facture"
        documentNumero={facture.numero}
        montantRestant={resteAPayer}
      />

      {/* Modal email */}
      <EmailModal
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
        documentType="facture"
        documentNumero={facture.numero}
        clientEmail={client?.email || ""}
        clientNom={client?.nom || ""}
      />
    </MainLayout>
  );
}
