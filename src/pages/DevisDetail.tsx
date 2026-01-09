import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, FileText, Download, Send, RefreshCw, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MainLayout } from "@/components/layout/MainLayout";
import { useDevisById, useConvertDevisToOrdre, useDeleteDevis } from "@/hooks/use-commercial";
import { toast } from "sonner";

const getStatutBadge = (statut: string) => {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    brouillon: { variant: "secondary", label: "Brouillon" },
    envoye: { variant: "default", label: "Envoyé" },
    accepte: { variant: "default", label: "Accepté" },
    refuse: { variant: "destructive", label: "Refusé" },
    expire: { variant: "outline", label: "Expiré" },
    converti: { variant: "default", label: "Converti" },
  };
  const config = variants[statut] || { variant: "secondary", label: statut };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(montant || 0);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("fr-FR");
};

export default function DevisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: devis, isLoading, error } = useDevisById(id || "");
  const convertMutation = useConvertDevisToOrdre();
  const deleteMutation = useDeleteDevis();

  const handleConvert = () => {
    if (!id) return;
    if (confirm("Convertir ce devis en ordre de travail ?")) {
      convertMutation.mutate(id, {
        onSuccess: (data: any) => {
          toast.success("Devis converti en ordre de travail");
          navigate(`/ordres/${data?.data?.id || data?.id}`);
        },
      });
    }
  };

  const handleDelete = () => {
    if (!id) return;
    if (confirm("Êtes-vous sûr de vouloir supprimer ce devis ?")) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          toast.success("Devis supprimé");
          navigate("/devis");
        },
      });
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Chargement...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (error || !devis) {
    return (
      <MainLayout title="Devis">
        <div className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Devis non trouvé ou module en reconstruction</p>
          <Button onClick={() => navigate("/devis")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
        </div>
      </MainLayout>
    );
  }

  const lignes = devis.lignes || [];

  return (
    <MainLayout title={`Devis ${devis.numero}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/devis")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <FileText className="h-6 w-6" />
                {devis.numero}
                {getStatutBadge(devis.statut)}
              </h1>
              <p className="text-muted-foreground">
                Créé le {formatDate(devis.date_creation || devis.created_at)}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => navigate(`/devis/${id}/modifier`)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            {devis.statut !== "converti" && (
              <Button onClick={handleConvert} disabled={convertMutation.isPending}>
                {convertMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Convertir en ordre
              </Button>
            )}
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Infos principales */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client */}
            <Card>
              <CardHeader>
                <CardTitle>Informations client</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{devis.client?.nom || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Code</p>
                  <p className="font-medium">{devis.client?.code || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Validité</p>
                  <p className="font-medium">{formatDate(devis.date_validite)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Catégorie</p>
                  <p className="font-medium capitalize">{devis.categorie?.replace("_", " ") || "-"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Lignes */}
            <Card>
              <CardHeader>
                <CardTitle>Lignes du devis</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {lignes.length === 0 ? (
                  <p className="p-6 text-muted-foreground">Aucune ligne</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qté</TableHead>
                        <TableHead className="text-right">Prix unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lignes.map((ligne: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{ligne.description}</TableCell>
                          <TableCell className="text-right">{ligne.quantite}</TableCell>
                          <TableCell className="text-right">{formatMontant(ligne.prix_unitaire)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatMontant(ligne.montant_ht || ligne.quantite * ligne.prix_unitaire)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {devis.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{devis.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Totaux */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant HT</span>
                  <span className="font-medium">{formatMontant(devis.montant_ht)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TVA</span>
                  <span className="font-medium">{formatMontant(devis.tva || devis.montant_tva)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CSS</span>
                  <span className="font-medium">{formatMontant(devis.css || devis.montant_css)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total TTC</span>
                  <span className="font-bold text-primary">{formatMontant(devis.montant_ttc)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historique</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Créé le</p>
                  <p>{formatDate(devis.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dernière modification</p>
                  <p>{formatDate(devis.updated_at)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
