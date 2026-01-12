import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Ship, Users, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  CategorieDocument,
  getCategoriesLabels,
  typesOperationConteneur,
} from "@/types/documents";
import {
  OrdreConteneursForm,
  OrdreConventionnelForm,
  OrdreIndependantForm,
  OrdreConteneursData,
  OrdreConventionnelData,
  OrdreIndependantData,
} from "@/components/ordres/forms";
import { RecapitulatifCard } from "@/components/devis/shared";
import { useClients, useArmateurs, useTransitaires, useRepresentants, useCreateOrdre, useConfiguration } from "@/hooks/use-commercial";
import RemiseInput, { RemiseData, RemiseType } from "@/components/shared/RemiseInput";

export default function NouvelOrdrePage() {
  const navigate = useNavigate();
  
  // API hooks
  const { data: clientsData } = useClients();
  const { data: armateursData } = useArmateurs();
  const { data: transitairesData } = useTransitaires();
  const { data: representantsData } = useRepresentants();
  const { data: configData } = useConfiguration();
  const createOrdreMutation = useCreateOrdre();
  
  const clients = clientsData?.data || [];
  const armateurs = armateursData || [];
  const transitaires = transitairesData || [];
  const representants = representantsData || [];
  
  // Taux depuis configuration
  const TAUX_TVA = configData?.tva_taux ? parseFloat(configData.tva_taux) / 100 : 0.18;
  const TAUX_CSS = configData?.css_taux ? parseFloat(configData.css_taux) / 100 : 0.01;
  
  const categoriesLabels = getCategoriesLabels();

  // État global
  const [categorie, setCategorie] = useState<CategorieDocument | "">("");
  const [clientId, setClientId] = useState("");
  const [notes, setNotes] = useState("");
  
  // Données des formulaires par catégorie
  const [conteneursData, setConteneursData] = useState<OrdreConteneursData | null>(null);
  const [conventionnelData, setConventionnelData] = useState<OrdreConventionnelData | null>(null);
  const [independantData, setIndependantData] = useState<OrdreIndependantData | null>(null);

  // État de la remise
  const [remiseData, setRemiseData] = useState<RemiseData>({
    type: "",
    valeur: 0,
    montantCalcule: 0,
  });

  // Calcul du montant HT selon la catégorie
  const getMontantHT = (): number => {
    if (categorie === "conteneurs" && conteneursData) return conteneursData.montantHT;
    if (categorie === "conventionnel" && conventionnelData) return conventionnelData.montantHT;
    if (categorie === "operations_independantes" && independantData) return independantData.montantHT;
    return 0;
  };

  const montantHT = getMontantHT();
  const montantHTApresRemise = montantHT - remiseData.montantCalcule;
  const tva = Math.round(montantHTApresRemise * TAUX_TVA);
  const css = Math.round(montantHTApresRemise * TAUX_CSS);
  const montantTTC = montantHTApresRemise + tva + css;

  // Reset catégorie
  const handleCategorieChange = (value: CategorieDocument) => {
    setCategorie(value);
    setConteneursData(null);
    setConventionnelData(null);
    setIndependantData(null);
    setRemiseData({ type: "", valeur: 0, montantCalcule: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }
    if (!categorie) {
      toast.error("Veuillez sélectionner une catégorie");
      return;
    }

    // Préparer les données selon la catégorie
    let lignesData: any[] = [];
    let conteneursDataApi: any[] = [];
    let lotsData: any[] = [];
    let numeroBL = "";
    let transitaireId = "";

    if (categorie === "conteneurs" && conteneursData) {
      if (!conteneursData.numeroBL) {
        toast.error("Veuillez saisir le numéro de BL");
        return;
      }
      numeroBL = conteneursData.numeroBL;
      transitaireId = conteneursData.transitaireId;
      conteneursDataApi = conteneursData.conteneurs.map(c => ({
        numero: c.numero,
        type: 'dry',
        taille: c.taille,
        description: c.description,
        armateur_id: conteneursData.armateurId || null,
        prix_unitaire: c.prixUnitaire || 0, // <-- important pour le calcul HT
        operations: c.operations.map(op => ({
          type_operation: op.type,
          description: typesOperationConteneur[op.type]?.label || op.description,
          quantite: op.quantite,
          prix_unitaire: op.prixUnitaire,
        }))
      }));
    } else if (categorie === "conventionnel" && conventionnelData) {
      if (!conventionnelData.numeroBL) {
        toast.error("Veuillez saisir le numéro de BL");
        return;
      }
      numeroBL = conventionnelData.numeroBL;
      lotsData = conventionnelData.lots.map(l => ({
        designation: l.description || l.numeroLot,
        quantite: l.quantite,
        poids: 0,
        volume: 0,
        prix_unitaire: l.prixUnitaire,
      }));
    } else if (categorie === "operations_independantes" && independantData) {
      if (!independantData.typeOperationIndep) {
        toast.error("Veuillez sélectionner un type d'opération");
        return;
      }
      lignesData = independantData.prestations.map(p => ({
        type_operation: independantData.typeOperationIndep,
        description: p.description,
        lieu_depart: p.lieuDepart,
        lieu_arrivee: p.lieuArrivee,
        date_debut: p.dateDebut,
        date_fin: p.dateFin,
        quantite: p.quantite,
        prix_unitaire: p.prixUnitaire,
      }));
    }

    const data = {
      client_id: clientId,
      type_document: categorie === "conteneurs" ? "Conteneur" : categorie === "conventionnel" ? "Lot" : "Independant",
      // Ajouter type_operation pour conteneurs (Import/Export)
      type_operation: categorie === "conteneurs" && conteneursData ? conteneursData.typeOperation : null,
      // Ajouter type_operation_indep pour opérations indépendantes
      type_operation_indep: categorie === "operations_independantes" && independantData ? independantData.typeOperationIndep : null,
      bl_numero: numeroBL || null,
      navire: null,
      date_arrivee: null,
      transitaire_id: transitaireId || null,
      representant_id: conteneursData?.representantId || null,
      // Primes pour transitaire et représentant
      prime_transitaire: conteneursData?.primeTransitaire || 0,
      prime_representant: conteneursData?.primeRepresentant || 0,
      // Remise
      remise_type: remiseData.type || null,
      remise_valeur: remiseData.valeur || 0,
      remise_montant: remiseData.montantCalcule || 0,
      notes,
      lignes: lignesData,
      conteneurs: conteneursDataApi,
      lots: lotsData,
    };

    try {
      await createOrdreMutation.mutateAsync(data);
      toast.success("Ordre de travail créé avec succès");
      navigate("/ordres");
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message;
      const apiError = error?.response?.data?.error;

      if (apiError) {
        toast.error(apiMessage || "Erreur lors de la création de l'ordre", {
          description: String(apiError),
        });
      } else {
        toast.error(apiMessage || "Erreur lors de la création de l'ordre");
      }
    }
  };

  return (
    <MainLayout title="Nouvel ordre de travail">
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/ordres")} className="transition-all duration-200 hover:scale-110">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Ship className="h-6 w-6 text-primary" />
              Nouvel ordre de travail
            </h1>
            <p className="text-muted-foreground text-sm">
              Créez un ordre de travail pour l'exploitation
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
        
        {/* Sélection de catégorie */}
        {!categorie && (
          <Card className="transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Catégorie d'ordre</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(Object.keys(categoriesLabels) as CategorieDocument[]).map((key) => {
                  const cat = categoriesLabels[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleCategorieChange(key)}
                      className="p-4 rounded-lg border-2 text-left transition-all duration-300 border-border hover:border-primary/50 hover:bg-muted/50 hover:shadow-md hover:-translate-y-1"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-muted-foreground">{cat.icon}</div>
                        <span className="font-semibold">{cat.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{cat.description}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Badge catégorie sélectionnée */}
        {categorie && (
          <div className="flex items-center gap-3 animate-fade-in">
            <Badge variant="secondary" className="py-2 px-4 text-sm flex items-center gap-2 transition-all duration-200 hover:scale-105">
              {categoriesLabels[categorie].icon}
              <span>{categoriesLabels[categorie].label}</span>
            </Badge>
            <Button type="button" variant="ghost" size="sm" onClick={() => setCategorie("")} className="text-muted-foreground transition-all duration-200 hover:scale-105">
              Changer
            </Button>
          </div>
        )}

        {/* Section Client */}
        {categorie && (
          <Card className="transition-all duration-300 hover:shadow-lg animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-md">
                <Label htmlFor="client">Nom du client *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulaire Conteneurs */}
        {categorie === "conteneurs" && (
          <div className="animate-fade-in">
            <OrdreConteneursForm
              armateurs={armateurs}
              transitaires={transitaires}
              representants={representants}
              onDataChange={setConteneursData}
            />
          </div>
        )}

        {/* Formulaire Conventionnel */}
        {categorie === "conventionnel" && (
          <div className="animate-fade-in">
            <OrdreConventionnelForm onDataChange={setConventionnelData} />
          </div>
        )}

        {/* Formulaire Opérations Indépendantes */}
        {categorie === "operations_independantes" && (
          <div className="animate-fade-in">
            <OrdreIndependantForm onDataChange={setIndependantData} />
          </div>
        )}

        {/* Notes */}
        {categorie && (
          <Card className="transition-all duration-300 hover:shadow-lg animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg">Notes / Observations</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Ajouter des notes ou observations..." 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                rows={3}
              />
            </CardContent>
          </Card>
        )}

        {/* Remise - avant le récapitulatif */}
        {categorie && montantHT > 0 && (
          <RemiseInput montantHT={montantHT} onChange={setRemiseData} />
        )}

        {/* Récapitulatif */}
        {categorie && (
          <div className="animate-fade-in">
            <RecapitulatifCard
              montantHT={montantHT}
              tauxTva={Math.round(TAUX_TVA * 100)}
              tauxCss={Math.round(TAUX_CSS * 100)}
              tva={tva}
              css={css}
              montantTTC={montantTTC}
              remiseMontant={remiseData.montantCalcule}
              remiseType={remiseData.type}
              remiseValeur={remiseData.valeur}
            />
          </div>
        )}

        {/* Bouton de soumission */}
        {categorie && (
          <div className="flex justify-end animate-fade-in">
            <Button type="submit" size="lg" disabled={createOrdreMutation.isPending} className="transition-all duration-200 hover:scale-105 hover:shadow-md">
              {createOrdreMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Créer l'ordre de travail
            </Button>
          </div>
        )}
      </form>
    </MainLayout>
  );
}