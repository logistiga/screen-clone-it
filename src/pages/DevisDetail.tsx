import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ArrowLeft,
  MoreHorizontal,
  Pencil,
  Copy,
  Send,
  Printer,
  ClipboardList,
  Trash2,
  History,
  FileText,
  User,
  Calendar,
  Building2,
  Container,
  Package,
  Truck,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  DocumentCommercial,
  categoriesConfig,
  formatMontant,
  formatDate,
  getStatutLabel,
  getStatutVariant,
} from "@/types/commercial";

// Mock data
const mockDevis: DocumentCommercial = {
  id: "1",
  numero: "DEV-2025-0001",
  type: "devis",
  categorie: "conteneurs",
  clientId: "1",
  clientNom: "TOTAL GABON",
  date: "2025-01-08",
  dateValidite: "2025-02-08",
  statut: "envoye",
  montantHT: 1500000,
  montantTVA: 270000,
  montantCSS: 15000,
  montantTTC: 1785000,
  montantPaye: 0,
  numeroBL: "MSCUAB123456",
  notes: "Devis pour transport de conteneurs - urgent",
  conteneurs: [
    {
      id: "1",
      numero: "MSCU1234567",
      taille: "40'",
      description: "Conteneur standard",
      prixUnitaire: 500000,
      operations: [
        {
          id: "1",
          type: "arrivee",
          description: "Arrivée au port",
          quantite: 1,
          prixUnitaire: 50000,
          prixTotal: 50000,
        },
        {
          id: "2",
          type: "transport",
          description: "Transport vers dépôt",
          quantite: 1,
          prixUnitaire: 150000,
          prixTotal: 150000,
        },
      ],
    },
    {
      id: "2",
      numero: "MSCU7654321",
      taille: "20'",
      description: "Conteneur réfrigéré",
      prixUnitaire: 800000,
      operations: [],
    },
  ],
};

// Mock historique
const mockHistorique = [
  { date: "2025-01-08 14:30", action: "Création", utilisateur: "Admin" },
  { date: "2025-01-08 15:00", action: "Envoyé au client", utilisateur: "Admin" },
  { date: "2025-01-08 16:00", action: "Consulté par le client", utilisateur: "Système" },
];

export default function DevisDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  const devis = mockDevis;

  const handleAction = async (action: string) => {
    switch (action) {
      case "edit":
        navigate(`/devis/${id}/modifier`);
        break;
      case "duplicate":
        toast.success("Devis dupliqué avec succès");
        break;
      case "send":
        toast.success("Devis envoyé au client");
        break;
      case "print":
        navigate(`/devis/${id}/pdf`);
        break;
      case "convert":
        toast.success("Ordre de travail créé à partir du devis");
        navigate("/ordres");
        break;
      case "accept":
        toast.success("Devis marqué comme accepté");
        break;
      case "refuse":
        toast.success("Devis marqué comme refusé");
        break;
      case "history":
        setShowHistoryDialog(true);
        break;
      case "delete":
        setShowDeleteDialog(true);
        break;
    }
  };

  const confirmDelete = () => {
    toast.success("Devis supprimé");
    navigate("/devis");
  };

  const getCategorieIcon = () => {
    switch (devis.categorie) {
      case "conteneurs":
        return <Container className="h-5 w-5" />;
      case "conventionnel":
        return <Package className="h-5 w-5" />;
      case "operations_independantes":
        return <Truck className="h-5 w-5" />;
    }
  };

  return (
    <MainLayout
      title={`Devis ${devis.numero}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/devis")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <MoreHorizontal className="h-4 w-4" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleAction("edit")}>
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction("duplicate")}>
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAction("send")}>
                <Send className="h-4 w-4 mr-2" />
                Envoyer par email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction("print")}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimer / PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAction("accept")}>
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Marquer accepté
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction("refuse")}>
                <XCircle className="h-4 w-4 mr-2 text-red-600" />
                Marquer refusé
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAction("convert")}>
                <ClipboardList className="h-4 w-4 mr-2" />
                Convertir en ordre
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAction("history")}>
                <History className="h-4 w-4 mr-2" />
                Historique
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleAction("delete")}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{devis.numero}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getStatutVariant(devis.statut)}>
                  {getStatutLabel(devis.statut)}
                </Badge>
                <Badge variant="outline" className={categoriesConfig[devis.categorie].className}>
                  {getCategorieIcon()}
                  <span className="ml-1">{categoriesConfig[devis.categorie].label}</span>
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Montant TTC</p>
            <p className="text-3xl font-bold text-primary">{formatMontant(devis.montantTTC)}</p>
          </div>
        </div>

        {/* Informations principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{devis.clientNom}</p>
              {devis.numeroBL && (
                <p className="text-sm text-muted-foreground mt-2">
                  N° BL: <span className="font-mono">{devis.numeroBL}</span>
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date création:</span>
                <span className="font-medium">{formatDate(devis.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Validité:</span>
                <span className="font-medium">{formatDate(devis.dateValidite)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Détails selon catégorie */}
        {devis.categorie === "conteneurs" && devis.conteneurs && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Container className="h-5 w-5 text-primary" />
                Conteneurs ({devis.conteneurs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {devis.conteneurs.map((conteneur, index) => (
                  <div
                    key={conteneur.id}
                    className="p-4 border rounded-lg bg-muted/20"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-mono font-bold">{conteneur.numero}</p>
                        <p className="text-sm text-muted-foreground">
                          {conteneur.taille} - {conteneur.description}
                        </p>
                      </div>
                      <p className="font-semibold">{formatMontant(conteneur.prixUnitaire)}</p>
                    </div>
                    {conteneur.operations.length > 0 && (
                      <div className="space-y-2 mt-3 pt-3 border-t">
                        <p className="text-sm font-medium text-muted-foreground">Opérations:</p>
                        {conteneur.operations.map((op) => (
                          <div key={op.id} className="flex justify-between text-sm">
                            <span>{op.description || op.type}</span>
                            <span className="font-medium">{formatMontant(op.prixTotal)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {devis.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{devis.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Récapitulatif financier */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Montant HT</p>
                <p className="text-xl font-bold">{formatMontant(devis.montantHT)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">TVA (18%)</p>
                <p className="text-xl font-bold">{formatMontant(devis.montantTVA)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CSS (1%)</p>
                <p className="text-xl font-bold">{formatMontant(devis.montantCSS)}</p>
              </div>
              <div className="border-l-2 border-primary pl-4">
                <p className="text-sm text-muted-foreground">Total TTC</p>
                <p className="text-2xl font-bold text-primary">{formatMontant(devis.montantTTC)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce devis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le devis {devis.numero} sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog historique */}
      <AlertDialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique du devis
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-3 py-4">
            {mockHistorique.map((item, index) => (
              <div key={index} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="font-medium">{item.action}</p>
                  <p className="text-muted-foreground text-xs">
                    {item.date} par {item.utilisateur}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Fermer</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
