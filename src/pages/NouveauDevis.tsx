import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { useClients, useArmateurs, useTransitaires, useRepresentants, useCreateDevis, useConfiguration } from "@/hooks/use-commercial";
import { CategorieDocument, getCategoriesLabels, typesOperationConteneur } from "@/types/documents";
import {
  CategorieSelector,
  ClientInfoCard,
  RecapitulatifCard,
  DevisConteneursForm,
  DevisConventionnelForm,
  DevisIndependantForm,
} from "@/components/devis";
import type { DevisConteneursData } from "@/components/devis/forms/DevisConteneursForm";
import type { DevisConventionnelData } from "@/components/devis/forms/DevisConventionnelForm";
import type { DevisIndependantData } from "@/components/devis/forms/DevisIndependantForm";

export default function NouveauDevisPage() {
  const navigate = useNavigate();
  
  // API hooks
  const { data: clientsData, isLoading: loadingClients } = useClients({ per_page: 100 });
  const { data: armateursData, isLoading: loadingArmateurs } = useArmateurs();
  const { data: transitairesData, isLoading: loadingTransitaires } = useTransitaires();
  const { data: representantsData, isLoading: loadingRepresentants } = useRepresentants();
  const { data: config } = useConfiguration();
  const createDevisMutation = useCreateDevis();

  const clients = clientsData?.data || [];
  const armateurs = armateursData || [];
  const transitaires = transitairesData || [];
  const representants = representantsData || [];
  
  const TAUX_TVA = config?.taux_tva ? parseFloat(config.taux_tva) / 100 : 0.18;
  const TAUX_CSS = config?.taux_css ? parseFloat(config.taux_css) / 100 : 0.01;
  
  const categoriesLabels = getCategoriesLabels();

  const [categorie, setCategorie] = useState<CategorieDocument | "">("");
  const [clientId, setClientId] = useState("");
  const [dateValidite, setDateValidite] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState("");
  
  // Form data from child components
  const [conteneursData, setConteneursData] = useState<DevisConteneursData | null>(null);
  const [conventionnelData, setConventionnelData] = useState<DevisConventionnelData | null>(null);
  const [independantData, setIndependantData] = useState<DevisIndependantData | null>(null);

  const getMontantHT = (): number => {
    if (categorie === "conteneurs" && conteneursData) return conteneursData.montantHT;
    if (categorie === "conventionnel" && conventionnelData) return conventionnelData.montantHT;
    if (categorie === "operations_independantes" && independantData) return independantData.montantHT;
    return 0;
  };

  const montantHT = getMontantHT();
  const tva = Math.round(montantHT * TAUX_TVA);
  const css = Math.round(montantHT * TAUX_CSS);
  const montantTTC = montantHT + tva + css;

  const handleCategorieChange = (value: CategorieDocument) => {
    setCategorie(value);
    setConteneursData(null);
    setConventionnelData(null);
    setIndependantData(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) { toast.error("Veuillez sélectionner un client"); return; }
    if (!categorie) { toast.error("Veuillez sélectionner une catégorie"); return; }
    
    if (categorie === "conteneurs" && !conteneursData?.numeroBL) {
      toast.error("Veuillez saisir le numéro de BL"); return;
    }
    if (categorie === "conventionnel" && !conventionnelData?.numeroBL) {
      toast.error("Veuillez saisir le numéro de BL"); return;
    }
    if (categorie === "operations_independantes" && !independantData?.typeOperationIndep) {
      toast.error("Veuillez sélectionner un type d'opération"); return;
    }

    const typeDocumentMap: Record<CategorieDocument, string> = {
      conteneurs: "Conteneur",
      conventionnel: "Lot",
      operations_independantes: "Independant"
    };

    const data: any = {
      client_id: parseInt(clientId),
      type_document: typeDocumentMap[categorie as CategorieDocument],
      date_arrivee: new Date().toISOString().split('T')[0],
      validite_jours: Math.ceil((new Date(dateValidite).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      notes: notes || null,
      lignes: [],
      conteneurs: [],
      lots: [],
    };

    if (categorie === "conteneurs" && conteneursData) {
      data.transitaire_id = conteneursData.transitaireId ? parseInt(conteneursData.transitaireId) : null;
      data.representant_id = conteneursData.representantId ? parseInt(conteneursData.representantId) : null;
      data.armateur_id = conteneursData.armateurId ? parseInt(conteneursData.armateurId) : null;
      data.bl_numero = conteneursData.numeroBL || null;
      data.type_operation = conteneursData.typeOperation || "import";
      data.conteneurs = conteneursData.conteneurs.map(c => ({
        numero: c.numero,
        type: "DRY",
        taille: c.taille === "20'" ? "20" : "40",
        description: c.description || null,
        armateur_id: conteneursData.armateurId ? parseInt(conteneursData.armateurId) : null,
        operations: c.operations.map(op => ({
          type_operation: op.type, // Envoyer le code (arrivee, stockage...) pas le label
          description: op.description || "",
          quantite: op.quantite,
          prix_unitaire: op.prixUnitaire
        }))
      }));
    }

    if (categorie === "conventionnel" && conventionnelData) {
      data.bl_numero = conventionnelData.numeroBL || null;
      data.lieu_chargement = conventionnelData.lieuChargement || null;
      data.lieu_dechargement = conventionnelData.lieuDechargement || null;
      data.lots = conventionnelData.lots.map(l => ({
        numero_lot: l.numeroLot || null,
        description: l.description || `Lot ${l.numeroLot}`,
        quantite: l.quantite,
        prix_unitaire: l.prixUnitaire
      }));
    }

    if (categorie === "operations_independantes" && independantData) {
      data.type_operation_indep = independantData.typeOperationIndep || null;
      data.lignes = independantData.prestations.map(p => ({
        type_operation: independantData.typeOperationIndep || "manutention",
        description: p.description || "",
        lieu_depart: p.lieuDepart || independantData.lieuChargement || null,
        lieu_arrivee: p.lieuArrivee || independantData.lieuDechargement || null,
        date_debut: p.dateDebut || null,
        date_fin: p.dateFin || null,
        quantite: p.quantite || 1,
        prix_unitaire: p.prixUnitaire || 0
      }));
    }

    try {
      await createDevisMutation.mutateAsync(data);
      navigate("/devis");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = loadingClients || loadingArmateurs || loadingTransitaires || loadingRepresentants;

  if (isLoading) {
    return (
      <MainLayout title="Nouveau devis">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Nouveau devis">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/devis")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />Nouveau devis
            </h1>
            <p className="text-muted-foreground text-sm">Créer un nouveau devis client</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {!categorie && <CategorieSelector onSelect={handleCategorieChange} />}

        {categorie && (
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="py-2 px-4 text-sm flex items-center gap-2">
              {categoriesLabels[categorie].icon}
              <span>{categoriesLabels[categorie].label}</span>
            </Badge>
            <Button type="button" variant="ghost" size="sm" onClick={() => setCategorie("")} className="text-muted-foreground">
              Changer
            </Button>
          </div>
        )}

        {categorie && (
          <ClientInfoCard
            clientId={clientId}
            setClientId={setClientId}
            dateValidite={dateValidite}
            setDateValidite={setDateValidite}
            clients={clients}
          />
        )}

        {categorie === "conteneurs" && (
          <DevisConteneursForm
            armateurs={armateurs}
            transitaires={transitaires}
            representants={representants}
            onDataChange={setConteneursData}
          />
        )}

        {categorie === "conventionnel" && (
          <DevisConventionnelForm onDataChange={setConventionnelData} />
        )}

        {categorie === "operations_independantes" && (
          <DevisIndependantForm onDataChange={setIndependantData} />
        )}

        {categorie && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conditions et notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Conditions particulières, notes..."
                rows={4}
              />
            </CardContent>
          </Card>
        )}

        {categorie && (
          <RecapitulatifCard
            montantHT={montantHT}
            tva={tva}
            css={css}
            montantTTC={montantTTC}
            tauxTva={Math.round(TAUX_TVA * 100)}
            tauxCss={Math.round(TAUX_CSS * 100)}
          />
        )}

        {categorie && (
          <div className="flex justify-end gap-4 pb-6">
            <Button type="button" variant="outline" onClick={() => navigate("/devis")} disabled={createDevisMutation.isPending}>
              Annuler
            </Button>
            <Button type="submit" className="gap-2" disabled={createDevisMutation.isPending}>
              {createDevisMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Créer le devis
            </Button>
          </div>
        )}
      </form>
    </MainLayout>
  );
}
