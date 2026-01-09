import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, FileText, User, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  CategorieDocument,
  categoriesConfig,
  ConteneursFormData,
  ConventionnelFormData,
  IndependantFormData,
  formatMontant,
} from "@/types/commercial";
import { ConteneursForm, ConventionnelForm, IndependantForm } from "@/components/documents/forms";

// Mock data clients
const mockClients = [
  { id: "1", nom: "TOTAL GABON" },
  { id: "2", nom: "CIMGABON" },
  { id: "3", nom: "OLAM GABON" },
  { id: "4", nom: "SETRAG" },
];

// Mock partenaires
const mockArmateurs = [
  { id: "1", nom: "MSC" },
  { id: "2", nom: "MAERSK" },
  { id: "3", nom: "CMA CGM" },
];
const mockTransitaires = [
  { id: "1", nom: "GETMA" },
  { id: "2", nom: "SDV" },
];
const mockRepresentants = [
  { id: "1", nom: "Jean Dupont" },
  { id: "2", nom: "Marie Koumba" },
];

// Mock devis existant
const mockDevisExistant = {
  id: "1",
  clientId: "1",
  categorie: "conteneurs" as CategorieDocument,
  dateValidite: "2025-02-08",
  notes: "Devis pour transport de conteneurs - urgent",
  conteneursData: {
    typeOperation: "import" as const,
    numeroBL: "MSCUAB123456",
    armateurId: "1",
    transitaireId: "1",
    representantId: "1",
    primeTransitaire: 0,
    primeRepresentant: 0,
    conteneurs: [
      {
        id: "1",
        numero: "MSCU1234567",
        taille: "40'" as const,
        description: "Conteneur standard",
        prixUnitaire: 500000,
        operations: [],
      },
    ],
    montantHT: 500000,
  },
};

// Taxes
const TAUX_TVA = 0.18;
const TAUX_CSS = 0.01;

export default function ModifierDevisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // État principal
  const [clientId, setClientId] = useState("");
  const [categorie, setCategorie] = useState<CategorieDocument | "">("");
  const [dateValidite, setDateValidite] = useState("");
  const [notes, setNotes] = useState("");

  // États des formulaires par catégorie
  const [conteneursData, setConteneursData] = useState<ConteneursFormData | null>(null);
  const [conventionnelData, setConventionnelData] = useState<ConventionnelFormData | null>(null);
  const [independantData, setIndependantData] = useState<IndependantFormData | null>(null);

  // Charger les données existantes
  useEffect(() => {
    // Simulation chargement
    setClientId(mockDevisExistant.clientId);
    setCategorie(mockDevisExistant.categorie);
    setDateValidite(mockDevisExistant.dateValidite);
    setNotes(mockDevisExistant.notes);
    setConteneursData(mockDevisExistant.conteneursData);
  }, [id]);

  // Calcul des totaux
  const getMontantHT = (): number => {
    switch (categorie) {
      case "conteneurs":
        return conteneursData?.montantHT || 0;
      case "conventionnel":
        return conventionnelData?.montantHT || 0;
      case "operations_independantes":
        return independantData?.montantHT || 0;
      default:
        return 0;
    }
  };

  const montantHT = getMontantHT();
  const montantTVA = montantHT * TAUX_TVA;
  const montantCSS = montantHT * TAUX_CSS;
  const montantTTC = montantHT + montantTVA + montantCSS;

  const handleSubmit = async () => {
    if (!clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }
    if (!categorie) {
      toast.error("Veuillez sélectionner une catégorie");
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Devis mis à jour avec succès");
      navigate(`/devis/${id}`);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCategorieForm = () => {
    switch (categorie) {
      case "conteneurs":
        return (
          <ConteneursForm
            armateurs={mockArmateurs}
            transitaires={mockTransitaires}
            representants={mockRepresentants}
            onDataChange={setConteneursData}
            initialData={conteneursData || undefined}
          />
        );
      case "conventionnel":
        return (
          <ConventionnelForm
            onDataChange={setConventionnelData}
            initialData={conventionnelData || undefined}
          />
        );
      case "operations_independantes":
        return (
          <IndependantForm
            onDataChange={setIndependantData}
            initialData={independantData || undefined}
          />
        );
      default:
        return null;
    }
  };

  return (
    <MainLayout
      title="Modifier le devis"
      actions={
        <Button variant="outline" onClick={() => navigate(`/devis/${id}`)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
      }
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* En-tête : Client et catégorie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Informations du devis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Client *
                </Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Catégorie *</Label>
                <Select
                  value={categorie}
                  onValueChange={(v) => setCategorie(v as CategorieDocument)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type d'opération" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(categoriesConfig) as CategorieDocument[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {categoriesConfig[key].icon}
                          <span>{categoriesConfig[key].label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date de validité
                </Label>
                <Input
                  type="date"
                  value={dateValidite}
                  onChange={(e) => setDateValidite(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulaire spécifique à la catégorie */}
        {categorie && renderCategorieForm()}

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Notes ou observations pour ce devis..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Récapitulatif et actions */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">HT:</span>
                  <span className="font-medium">{formatMontant(montantHT)}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">TVA (18%):</span>
                  <span>{formatMontant(montantTVA)}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">CSS (1%):</span>
                  <span>{formatMontant(montantCSS)}</span>
                </div>
                <div className="flex items-center gap-4 text-lg pt-2 border-t">
                  <span className="font-semibold">Total TTC:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatMontant(montantTTC)}
                  </span>
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="gap-2 w-full md:w-auto"
              >
                <Save className="h-4 w-4" />
                Enregistrer les modifications
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
