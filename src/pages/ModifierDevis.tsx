import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { ClientInfoCard, RecapitulatifCard } from "@/components/shared";
import { useDevisById, useClients, useTransitaires, useRepresentants, useUpdateDevis, useConfiguration } from "@/hooks/use-commercial";

export default function ModifierDevisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: devis, isLoading: loadingDevis } = useDevisById(id || "");
  const { data: clientsData } = useClients();
  const { data: transitairesData } = useTransitaires();
  const { data: representantsData } = useRepresentants();
  const { data: configData } = useConfiguration();
  const updateDevisMutation = useUpdateDevis();
  
  const clients = clientsData?.data || [];
  const transitaires = transitairesData || [];
  const representants = representantsData || [];
  
  // Taux
  const taxes = configData?.taxes || { taux_tva: 18, taux_css: 1 };
  const TAUX_TVA = taxes.taux_tva / 100;
  const TAUX_CSS = taxes.taux_css / 100;

  // État du formulaire
  const [clientId, setClientId] = useState("");
  const [transitaireId, setTransitaireId] = useState("");
  const [representantId, setRepresentantId] = useState("");
  const [dateValidite, setDateValidite] = useState("");
  const [notes, setNotes] = useState("");
  const [statut, setStatut] = useState("brouillon");
  const [lignes, setLignes] = useState<Array<{
    id?: string;
    description: string;
    quantite: number;
    prixUnitaire: number;
  }>>([{ description: "", quantite: 1, prixUnitaire: 0 }]);

  // Charger les données du devis
  useEffect(() => {
    if (devis) {
      setClientId(devis.client_id || "");
      setTransitaireId(devis.transitaire_id || "");
      setRepresentantId(devis.representant_id || "");
      setDateValidite(devis.date_validite?.split("T")[0] || "");
      setNotes(devis.notes || "");
      setStatut(devis.statut || "brouillon");
      
      if (devis.lignes && devis.lignes.length > 0) {
        setLignes(devis.lignes.map((l: any) => ({
          id: l.id,
          description: l.description || "",
          quantite: l.quantite || 1,
          prixUnitaire: l.prix_unitaire || 0,
        })));
      }
    }
  }, [devis]);

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

    const data = {
      client_id: clientId,
      transitaire_id: transitaireId || null,
      representant_id: representantId || null,
      date_validite: dateValidite,
      notes,
      statut,
      lignes: lignes.filter(l => l.description && l.prixUnitaire > 0).map(l => ({
        id: l.id,
        description: l.description,
        quantite: l.quantite,
        prix_unitaire: l.prixUnitaire,
      })),
      montant_ht: montantHT,
      tva,
      css,
      montant_ttc: montantTTC,
    };

    updateDevisMutation.mutate({ id: id!, data }, {
      onSuccess: () => {
        toast.success("Devis modifié avec succès");
        navigate(`/devis/${id}`);
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Erreur lors de la modification");
      },
    });
  };

  if (loadingDevis) {
    return (
      <MainLayout title="Chargement...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!devis) {
    return (
      <MainLayout title="Devis">
        <div className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Devis non trouvé</p>
          <Button onClick={() => navigate("/devis")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={`Modifier ${devis.numero}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/devis/${id}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Modifier {devis.numero}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="capitalize">
                  {devis.categorie?.replace("_", " ") || "Standard"}
                </Badge>
              </div>
            </div>
          </div>
          <Button type="submit" disabled={updateDevisMutation.isPending}>
            {updateDevisMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </div>

        {/* Statut */}
        <Card>
          <CardHeader>
            <CardTitle>Statut</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={statut} onValueChange={setStatut}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brouillon">Brouillon</SelectItem>
                <SelectItem value="envoye">Envoyé</SelectItem>
                <SelectItem value="accepte">Accepté</SelectItem>
                <SelectItem value="refuse">Refusé</SelectItem>
                <SelectItem value="expire">Expiré</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

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
          <Button type="button" variant="outline" onClick={() => navigate(`/devis/${id}`)}>
            Annuler
          </Button>
          <Button type="submit" disabled={updateDevisMutation.isPending}>
            {updateDevisMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </div>
      </form>
    </MainLayout>
  );
}
