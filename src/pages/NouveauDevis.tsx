import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { CategorieSelector, ClientInfoCard, RecapitulatifCard } from "@/components/shared";
import { useClients, useTransitaires, useRepresentants, useCreateDevis, useConfiguration } from "@/hooks/use-commercial";

type CategorieType = "conteneurs" | "conventionnel" | "operations_independantes" | "";

export default function NouveauDevisPage() {
  const navigate = useNavigate();
  
  const { data: clientsData, isLoading: loadingClients } = useClients();
  const { data: transitairesData } = useTransitaires();
  const { data: representantsData } = useRepresentants();
  const { data: configData } = useConfiguration();
  const createDevisMutation = useCreateDevis();
  
  const clients = clientsData?.data || [];
  const transitaires = transitairesData || [];
  const representants = representantsData || [];
  
  // Taux depuis configuration
  const taxes = configData?.taxes || { taux_tva: 18, taux_css: 1 };
  const TAUX_TVA = taxes.taux_tva / 100;
  const TAUX_CSS = taxes.taux_css / 100;

  // État du formulaire
  const [categorie, setCategorie] = useState<CategorieType>("");
  const [clientId, setClientId] = useState("");
  const [transitaireId, setTransitaireId] = useState("");
  const [representantId, setRepresentantId] = useState("");
  const [dateValidite, setDateValidite] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");
  
  // Lignes de devis simples
  const [lignes, setLignes] = useState<Array<{
    description: string;
    quantite: number;
    prixUnitaire: number;
  }>>([{ description: "", quantite: 1, prixUnitaire: 0 }]);

  // Calculs
  const montantHT = lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0);
  const tva = montantHT * TAUX_TVA;
  const css = montantHT * TAUX_CSS;
  const montantTTC = montantHT + tva + css;

  const handleAddLigne = () => {
    setLignes([...lignes, { description: "", quantite: 1, prixUnitaire: 0 }]);
  };

  const handleRemoveLigne = (index: number) => {
    if (lignes.length > 1) {
      setLignes(lignes.filter((_, i) => i !== index));
    }
  };

  const handleLigneChange = (index: number, field: string, value: any) => {
    const newLignes = [...lignes];
    newLignes[index] = { ...newLignes[index], [field]: value };
    setLignes(newLignes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }
    
    if (!categorie) {
      toast.error("Veuillez sélectionner un type de document");
      return;
    }
    
    if (lignes.every(l => !l.description || l.prixUnitaire <= 0)) {
      toast.error("Veuillez ajouter au moins une ligne avec un prix");
      return;
    }

    const data = {
      client_id: clientId,
      transitaire_id: transitaireId || null,
      representant_id: representantId || null,
      categorie,
      type_document: categorie,
      date_validite: dateValidite,
      notes,
      lignes: lignes.filter(l => l.description && l.prixUnitaire > 0).map(l => ({
        description: l.description,
        quantite: l.quantite,
        prix_unitaire: l.prixUnitaire,
      })),
      montant_ht: montantHT,
      tva,
      css,
      montant_ttc: montantTTC,
    };

    createDevisMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Devis créé avec succès");
        navigate("/devis");
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Erreur lors de la création du devis");
      },
    });
  };

  if (loadingClients) {
    return (
      <MainLayout title="Nouveau devis">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Nouveau devis">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate("/devis")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Nouveau devis
              </h1>
              <p className="text-muted-foreground">Créez un nouveau devis client</p>
            </div>
          </div>
          <Button type="submit" disabled={createDevisMutation.isPending}>
            {createDevisMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Créer le devis
          </Button>
        </div>

        {/* Catégorie */}
        <CategorieSelector value={categorie} onChange={(v) => setCategorie(v as CategorieType)} />

        {categorie && (
          <>
            {/* Client */}
            <ClientInfoCard
              clientId={clientId}
              onClientChange={setClientId}
              clients={clients}
              transitaireId={transitaireId}
              onTransitaireChange={setTransitaireId}
              transitaires={transitaires}
              representantId={representantId}
              onRepresentantChange={setRepresentantId}
              representants={representants}
              validiteDate={dateValidite}
              onValiditeDateChange={setDateValidite}
              showValidite
            />

            {/* Lignes */}
            <Card>
              <CardHeader>
                <CardTitle>Lignes du devis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lignes.map((ligne, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-6">
                      <Label>Description</Label>
                      <Input
                        value={ligne.description}
                        onChange={(e) => handleLigneChange(index, "description", e.target.value)}
                        placeholder="Description du service"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Quantité</Label>
                      <Input
                        type="number"
                        min="1"
                        value={ligne.quantite}
                        onChange={(e) => handleLigneChange(index, "quantite", Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Prix unitaire (XOF)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={ligne.prixUnitaire}
                        onChange={(e) => handleLigneChange(index, "prixUnitaire", Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveLigne(index)}
                        disabled={lignes.length === 1}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={handleAddLigne}>
                  + Ajouter une ligne
                </Button>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Conditions particulières, remarques..."
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Récapitulatif */}
            <RecapitulatifCard
              montantHT={montantHT}
              tva={tva}
              css={css}
              montantTTC={montantTTC}
              tauxTva={taxes.taux_tva}
              tauxCss={taxes.taux_css}
            />

            {/* Boutons */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate("/devis")}>
                Annuler
              </Button>
              <Button type="submit" disabled={createDevisMutation.isPending}>
                {createDevisMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Créer le devis
              </Button>
            </div>
          </>
        )}
      </form>
    </MainLayout>
  );
}
