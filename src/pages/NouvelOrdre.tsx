import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Ship, Save, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { RecapitulatifCard, AutoSaveIndicator } from "@/components/devis/shared";
import { OrdreStepper, OrdrePreview } from "@/components/ordres/shared";
import { useClients, useArmateurs, useTransitaires, useRepresentants, useCreateOrdre, useConfiguration } from "@/hooks/use-commercial";
import { useAutoSave } from "@/hooks/use-auto-save";
import RemiseInput, { RemiseData } from "@/components/shared/RemiseInput";
import { Users } from "lucide-react";
import { FormError } from "@/components/ui/form-error";
import {
  validateOrdreConteneurs,
  validateOrdreConventionnel,
  validateOrdreIndependant,
} from "@/lib/validations/ordre-schemas";

interface DraftData {
  categorie: CategorieDocument | "";
  clientId: string;
  notes: string;
  currentStep: number;
  conteneursData: OrdreConteneursData | null;
  conventionnelData: OrdreConventionnelData | null;
  independantData: OrdreIndependantData | null;
  remiseData: RemiseData;
}

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

  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  const [showRestorePrompt, setShowRestorePrompt] = useState(true);
  const [isRestoredFromDraft, setIsRestoredFromDraft] = useState(false);

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
    type: "none",
    valeur: 0,
    montantCalcule: 0,
  });

  // Auto-save
  const { save, clear, restore, hasDraft, lastSaved, isSaving } = useAutoSave<DraftData>({
    key: 'nouvel_ordre',
    debounceMs: 1500,
  });

  // Auto-save on data changes
  useEffect(() => {
    if (categorie || clientId || notes) {
      save({
        categorie,
        clientId,
        notes,
        currentStep,
        conteneursData,
        conventionnelData,
        independantData,
        remiseData,
      });
    }
  }, [categorie, clientId, notes, currentStep, conteneursData, conventionnelData, independantData, remiseData, save]);

  const handleRestoreDraft = () => {
    const draft = restore();
    if (draft) {
      setCategorie(draft.categorie);
      setClientId(draft.clientId);
      setNotes(draft.notes);
      setConteneursData(draft.conteneursData);
      setConventionnelData(draft.conventionnelData);
      setIndependantData(draft.independantData);
      setRemiseData(draft.remiseData || { type: "none", valeur: 0, montantCalcule: 0 });
      setCurrentStep(draft.currentStep || 1);
      setIsRestoredFromDraft(true);
      toast.success("Brouillon restauré avec succès");
    }
    setShowRestorePrompt(false);
  };

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
    setRemiseData({ type: "none", valeur: 0, montantCalcule: 0 });
    setCurrentStep(2);
  };

  // Stepper navigation
  const handleStepClick = (step: number) => {
    if (step <= currentStep + 1) {
      setCurrentStep(step);
    }
  };

  const canProceedToStep = (step: number): boolean => {
    if (step === 2) return !!categorie;
    if (step === 3) return !!categorie && !!clientId;
    if (step === 4) {
      if (categorie === "conteneurs") return !!conteneursData && conteneursData.conteneurs.length > 0;
      if (categorie === "conventionnel") return !!conventionnelData && conventionnelData.lots.length > 0;
      if (categorie === "operations_independantes") return !!independantData && independantData.prestations.length > 0;
    }
    return true;
  };

  const handleNextStep = () => {
    if (canProceedToStep(currentStep + 1)) {
      setCurrentStep(currentStep + 1);
    } else {
      if (currentStep === 1 && !categorie) {
        toast.error("Veuillez sélectionner une catégorie");
      } else if (currentStep === 2 && !clientId) {
        toast.error("Veuillez sélectionner un client");
      } else if (currentStep === 3) {
        toast.error("Veuillez compléter les détails de l'ordre");
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
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

    // Validation Zod selon la catégorie
    if (categorie === "conteneurs" && conteneursData) {
      const validation = validateOrdreConteneurs(conteneursData);
      if (!validation.success) {
        toast.error("Erreurs de validation", {
          description: validation.firstError || "Veuillez corriger les erreurs dans le formulaire",
        });
        console.log("Validation errors:", validation.errors);
        return;
      }
    } else if (categorie === "conventionnel" && conventionnelData) {
      const validation = validateOrdreConventionnel(conventionnelData);
      if (!validation.success) {
        toast.error("Erreurs de validation", {
          description: validation.firstError || "Veuillez corriger les erreurs dans le formulaire",
        });
        console.log("Validation errors:", validation.errors);
        return;
      }
    } else if (categorie === "operations_independantes" && independantData) {
      const validation = validateOrdreIndependant(independantData);
      if (!validation.success) {
        toast.error("Erreurs de validation", {
          description: validation.firstError || "Veuillez corriger les erreurs dans le formulaire",
        });
        console.log("Validation errors:", validation.errors);
        return;
      }
    }

    // Préparer les données selon la catégorie
    let lignesData: any[] = [];
    let conteneursDataApi: any[] = [];
    let lotsData: any[] = [];
    let numeroBL = "";
    let transitaireId = "";

    if (categorie === "conteneurs" && conteneursData) {
      numeroBL = conteneursData.numeroBL;
      transitaireId = conteneursData.transitaireId;
      conteneursDataApi = conteneursData.conteneurs.map(c => ({
        numero: c.numero,
        type: 'dry',
        taille: c.taille,
        description: c.description,
        armateur_id: conteneursData.armateurId || null,
        prix_unitaire: c.prixUnitaire || 0,
        operations: c.operations.map(op => ({
          type_operation: op.type,
          description: typesOperationConteneur[op.type]?.label || op.description,
          quantite: op.quantite,
          prix_unitaire: op.prixUnitaire,
        }))
      }));
    } else if (categorie === "conventionnel" && conventionnelData) {
      numeroBL = conventionnelData.numeroBL;
      lotsData = conventionnelData.lots.map(l => ({
        designation: l.description || l.numeroLot,
        quantite: l.quantite,
        poids: 0,
        volume: 0,
        prix_unitaire: l.prixUnitaire,
      }));
    } else if (categorie === "operations_independantes" && independantData) {
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
      type_operation: categorie === "conteneurs" && conteneursData ? conteneursData.typeOperation : null,
      type_operation_indep: categorie === "operations_independantes" && independantData ? independantData.typeOperationIndep : null,
      bl_numero: numeroBL || null,
      navire: null,
      date_arrivee: null,
      transitaire_id: transitaireId || null,
      representant_id: conteneursData?.representantId || null,
      prime_transitaire: conteneursData?.primeTransitaire || 0,
      prime_representant: conteneursData?.primeRepresentant || 0,
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
      clear(); // Clear draft on success
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

  // Get client for preview
  const selectedClient = clients.find(c => String(c.id) === clientId);

  return (
    <MainLayout title="Nouvel ordre de travail">
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between gap-4">
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
          <AutoSaveIndicator
            hasDraft={hasDraft}
            lastSaved={lastSaved}
            isSaving={isSaving}
            onRestore={handleRestoreDraft}
            onClear={clear}
          />
        </div>
      </div>

      {/* Restore prompt */}
      {showRestorePrompt && hasDraft && !isRestoredFromDraft && (
        <AutoSaveIndicator
          hasDraft={hasDraft}
          lastSaved={lastSaved}
          isSaving={isSaving}
          onRestore={handleRestoreDraft}
          onClear={clear}
          showRestorePrompt={true}
          onDismissPrompt={() => setShowRestorePrompt(false)}
        />
      )}

      {/* Stepper */}
      <OrdreStepper 
        currentStep={currentStep} 
        categorie={categorie || undefined}
        onStepClick={handleStepClick}
      />

      <form onSubmit={handleSubmit} className="animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Catégorie */}
            {currentStep === 1 && (
              <Card className="transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Catégorie d'ordre</CardTitle>
                  <CardDescription>Sélectionnez le type d'ordre de travail</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(Object.keys(categoriesLabels) as CategorieDocument[]).map((key) => {
                      const cat = categoriesLabels[key];
                      const isSelected = categorie === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleCategorieChange(key)}
                          className={`p-4 rounded-lg border-2 text-left transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${
                            isSelected 
                              ? "border-primary bg-primary/10" 
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                              {cat.icon}
                            </div>
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

            {/* Step 2: Client */}
            {currentStep === 2 && (
              <Card className="transition-all duration-300 hover:shadow-lg animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    Client
                  </CardTitle>
                  <CardDescription>Sélectionnez le client pour cet ordre</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-w-md">
                    <Label htmlFor="client">Nom du client *</Label>
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger className="mt-1 h-11">
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

            {/* Step 3: Détails */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                {categorie === "conteneurs" && (
                  <OrdreConteneursForm
                    armateurs={armateurs}
                    transitaires={transitaires}
                    representants={representants}
                    onDataChange={setConteneursData}
                    initialData={isRestoredFromDraft && conteneursData ? {
                      typeOperation: conteneursData.typeOperation,
                      numeroBL: conteneursData.numeroBL,
                      armateurId: conteneursData.armateurId,
                      transitaireId: conteneursData.transitaireId,
                      representantId: conteneursData.representantId,
                      conteneurs: conteneursData.conteneurs,
                      primeTransitaire: conteneursData.primeTransitaire,
                      primeRepresentant: conteneursData.primeRepresentant,
                    } : undefined}
                  />
                )}

                {categorie === "conventionnel" && (
                  <OrdreConventionnelForm 
                    onDataChange={setConventionnelData}
                    initialData={isRestoredFromDraft && conventionnelData ? {
                      numeroBL: conventionnelData.numeroBL,
                      lieuChargement: conventionnelData.lieuChargement,
                      lieuDechargement: conventionnelData.lieuDechargement,
                      lots: conventionnelData.lots,
                    } : undefined}
                  />
                )}

                {categorie === "operations_independantes" && (
                  <OrdreIndependantForm 
                    onDataChange={setIndependantData}
                    initialData={isRestoredFromDraft && independantData ? {
                      typeOperationIndep: independantData.typeOperationIndep,
                      prestations: independantData.prestations,
                    } : undefined}
                  />
                )}

                {/* Notes */}
                <Card className="transition-all duration-300 hover:shadow-lg">
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

                {/* Remise */}
                {montantHT > 0 && (
                  <RemiseInput montantHT={montantHT} onChange={setRemiseData} />
                )}
              </div>
            )}

            {/* Step 4: Récapitulatif */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
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

            {/* Navigation buttons */}
            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handlePrevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>

              {currentStep < 4 ? (
                <Button 
                  type="button" 
                  onClick={handleNextStep}
                  disabled={!canProceedToStep(currentStep + 1)}
                >
                  Suivant
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={createOrdreMutation.isPending}
                  className="transition-all duration-200 hover:scale-105 hover:shadow-md"
                >
                  {createOrdreMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Créer l'ordre de travail
                </Button>
              )}
            </div>
          </div>

          {/* Preview sidebar */}
          <div className="hidden lg:block">
            <OrdrePreview
              categorie={categorie}
              client={selectedClient ? { id: selectedClient.id, nom: selectedClient.nom } : null}
              montantHT={montantHT}
              tva={tva}
              css={css}
              montantTTC={montantTTC}
              numeroBL={conteneursData?.numeroBL || conventionnelData?.numeroBL}
              typeOperation={conteneursData?.typeOperation}
              typeOperationIndep={independantData?.typeOperationIndep}
              conteneurs={conteneursData?.conteneurs}
              lots={conventionnelData?.lots?.map(l => ({ description: l.description || l.numeroLot, quantite: l.quantite }))}
              prestations={independantData?.prestations?.map(p => ({ description: p.description, quantite: p.quantite }))}
              notes={notes}
            />
          </div>
        </div>
      </form>
    </MainLayout>
  );
}
