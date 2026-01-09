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
  Clock,
  User,
  AlertCircle,
  Loader2,
  Download,
  Copy,
} from "lucide-react";
import { useDevisById, useConvertDevisToOrdre } from "@/hooks/use-commercial";

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' XAF';
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR');
};

export default function DevisDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("details");

  const { data: devisData, isLoading, error } = useDevisById(id || '');
  const convertMutation = useConvertDevisToOrdre();

  if (isLoading) {
    return (
      <MainLayout title="Chargement...">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !devisData) {
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
    const config: Record<string, { className: string; label: string }> = {
      brouillon: { className: "bg-gray-100 text-gray-700 border-gray-300", label: "Brouillon" },
      envoye: { className: "bg-blue-100 text-blue-700 border-blue-300", label: "Envoyé" },
      accepte: { className: "bg-green-100 text-green-700 border-green-300", label: "Accepté" },
      refuse: { className: "bg-red-100 text-red-700 border-red-300", label: "Refusé" },
      expire: { className: "bg-orange-100 text-orange-700 border-orange-300", label: "Expiré" },
      converti: { className: "bg-purple-100 text-purple-700 border-purple-300", label: "Converti" },
    };
    const style = config[statut] || config.brouillon;
    return (
      <Badge variant="outline" className={`${style.className} transition-all duration-200 hover:scale-105`}>
        {style.label}
      </Badge>
    );
  };

  const handleConvertToOrdre = async () => {
    if (!id) return;
    try {
      await convertMutation.mutateAsync(id);
      navigate("/ordres");
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <MainLayout title={`Devis ${devisData.numero}`}>
      <div className="space-y-6 animate-fade-in">
        {/* Header avec actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/devis")} className="transition-all duration-200 hover:scale-110">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{devisData.numero}</h1>
                {getStatutBadge(devisData.statut)}
              </div>
              <p className="text-muted-foreground">
                Créé le {formatDate(devisData.date_creation || devisData.date)} • Valide jusqu'au{" "}
                {formatDate(devisData.date_validite)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-2 transition-all duration-200 hover:scale-105"
              onClick={() => window.open(`/devis/${id}/pdf`, "_blank")}
            >
              <Download className="h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              className="gap-2 transition-all duration-200 hover:scale-105"
              onClick={() => navigate(`/devis/${id}/modifier`)}
              disabled={devisData.statut === 'converti'}
            >
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
            <Button variant="outline" className="gap-2 text-blue-600 transition-all duration-200 hover:scale-105 hover:bg-blue-50">
              <Mail className="h-4 w-4" />
              Envoyer
            </Button>
            {devisData.statut !== 'converti' && devisData.statut !== 'refuse' && (
              <Button 
                className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md" 
                onClick={handleConvertToOrdre}
                disabled={convertMutation.isPending}
              >
                {convertMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
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
              Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-6">
            {/* Infos client */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-primary" />
                    Client
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-semibold text-lg">{devisData.client?.nom}</p>
                  <p className="text-muted-foreground">{devisData.client?.email}</p>
                  <p className="text-muted-foreground">{devisData.client?.telephone}</p>
                  <p className="text-muted-foreground">
                    {devisData.client?.adresse}, {devisData.client?.ville}
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    Récapitulatif
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant HT</span>
                    <span className="font-medium">{formatMontant(devisData.montant_ht || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TVA (18%)</span>
                    <span>{formatMontant(devisData.montant_tva || devisData.tva || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CSS (1%)</span>
                    <span>{formatMontant(devisData.montant_css || devisData.css || 0)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total TTC</span>
                    <span className="text-primary">{formatMontant(devisData.montant_ttc || 0)}</span>
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
                      <TableHead>Désignation</TableHead>
                      <TableHead className="text-center">Quantité</TableHead>
                      <TableHead className="text-right">Prix unitaire</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devisData.lignes?.map((ligne: any) => (
                      <TableRow key={ligne.id}>
                        <TableCell>{ligne.designation}</TableCell>
                        <TableCell className="text-center">{ligne.quantite} {ligne.unite}</TableCell>
                        <TableCell className="text-right">
                          {formatMontant(ligne.prix_unitaire)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMontant(ligne.montant)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!devisData.lignes || devisData.lignes.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Aucune ligne
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Conteneurs si présents */}
            {devisData.conteneurs && devisData.conteneurs.length > 0 && (
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
                        <TableHead className="text-right">Opérations</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {devisData.conteneurs.map((conteneur: any) => (
                        <TableRow key={conteneur.id}>
                          <TableCell className="font-mono">{conteneur.numero}</TableCell>
                          <TableCell>{conteneur.type}</TableCell>
                          <TableCell>{conteneur.taille}'</TableCell>
                          <TableCell className="text-right">{conteneur.operations?.length || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

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
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="p-2 rounded-full bg-blue-100">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Création du devis</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(devisData.created_at)}
                      </p>
                    </div>
                  </div>
                  {devisData.updated_at !== devisData.created_at && (
                    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="p-2 rounded-full bg-orange-100">
                        <Edit className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">Dernière modification</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(devisData.updated_at)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
