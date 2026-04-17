import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Ship, Save, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { CategorieDocument, getCategoriesLabels } from "@/types/documents";
import {
  OrdreConteneursForm,
  OrdreConventionnelForm,
  OrdreIndependantForm,
  OrdreConteneursData,
  OrdreConventionnelData,
  OrdreIndependantData,
} from "@/components/ordres/forms";
import { RecapitulatifCard, AutoSaveIndicator } from "@/components/devis/shared";
import { OrdreStepper, useOrdreForm, buildOrdreStepsValidation } from "@/components/ordres/shared";
import { useClients, useArmateurs, useTransitaires, useRepresentants, useCreateOrdre } from "@/hooks/use-commercial";
import { useAutoSave } from "@/hooks/use-auto-save";
import RemiseInput, { RemiseData } from "@/components/shared/RemiseInput";
import { ClientCombobox } from "@/components/shared/ClientCombobox";
import TaxesSelector, { TaxesSelectionData } from "@/components/shared/TaxesSelector";
import { Users } from "lucide-react";
import {
  validateOrdreConteneurs,
  validateOrdreConventionnel,
  validateOrdreIndependant,
} from "@/lib/validations/ordre-schemas";
import ConfirmationSaveModal from "@/components/shared/ConfirmationSaveModal";

interface DraftData {
  categorie: CategorieDocument | "";
  clientId: string;
  notes: string;
  currentStep: number;
  conteneursData: OrdreConteneursData | null;
  conventionnelData: OrdreConventionnelData | null;
  independantData: OrdreIndependantData | null;
  remiseData: RemiseData;
  taxesSelectionData: TaxesSelectionData;
}

const toArray = (v: any): any[] =>
  Array.isArray(v?.data) ? v.data : Array.isArray(v) ? v : [];

export default function NouvelOrdrePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const prefillAppliedRef = useRef(false);

  // API hooks
  const { data: clientsData, isLoading: clientsLoading } = useClients({ per_page: 1000 });
  const { data: armateursData } = useArmateurs();
  const { data: transitairesData } = useTransitaires();
  const { data: representantsData } = useRepresentants();
  const createOrdreMutation = useCreateOrdre();

  const clients = toArray(clientsData);
  const armateurs = toArray(armateursData);
  const transitaires = toArray(transitairesData);
  const representants = toArray(representantsData);
  const categoriesLabels = getCategoriesLabels();

  // Form state via hook partagé
  const api = useOrdreForm();

  // Stepper local
  const [currentStep, setCurrentStep] = useState(1);
  const [showRestorePrompt, setShowRestorePrompt] = useState(true);
  const [isRestoredFromDraft, setIsRestoredFromDraft] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Init taxes recommandées au chargement (une seule fois, sauf restauration draft)
  useEffect(() => {
    if (api.taxesInitRef.current) return;
    if (api.taxesLoading || api.availableTaxes.length === 0) return;
    api.taxesInitRef.current = true;
    const recommendedCodes = api.availableTaxes.filter((t) => t.obligatoire).map((t) => t.code.toUpperCase());
    api.setTaxesSelectionData((prev) =>
      prev.selectedTaxCodes.length > 0 ? prev : { ...prev, selectedTaxCodes: recommendedCodes }
    );
  }, [api.taxesLoading, api.availableTaxes]);

  // Auto-save
  const { save, clear, restore, hasDraft, lastSaved, isSaving } = useAutoSave<DraftData>({
    key: "nouvel_ordre",
    debounceMs: 1500,
  });

  useEffect(() => {
    if (api.categorie || api.clientId || api.notes) {
      save({
        categorie: api.categorie,
        clientId: api.clientId,
        notes: api.notes,
        currentStep,
        conteneursData: api.conteneursData,
        conventionnelData: api.conventionnelData,
        independantData: api.independantData,
        remiseData: api.remiseData,
        taxesSelectionData: api.taxesSelectionData,
      });
    }
  }, [api.categorie, api.clientId, api.notes, currentStep, api.conteneursData, api.conventionnelData, api.independantData, api.remiseData, api.taxesSelectionData, save]);

  const handleRestoreDraft = () => {
    const draft = restore();
    if (draft) {
      api.setCategorie(draft.categorie);
      api.setClientId(draft.clientId);
      api.setNotes(draft.notes);
      api.setConteneursData(draft.conteneursData);
      api.setConventionnelData(draft.conventionnelData);
      api.setIndependantData(draft.independantData);
      api.setRemiseData(draft.remiseData || { type: "none", valeur: 0, montantCalcule: 0 });

      // [] = choix intentionnel "sans taxes" — ne pas réinjecter TVA/CSS
      const restoredTaxes = draft.taxesSelectionData ?? api.getInitialTaxesSelection();
      api.setTaxesSelectionData({
        selectedTaxCodes: Array.isArray(restoredTaxes.selectedTaxCodes) ? restoredTaxes.selectedTaxCodes : [],
        hasExoneration: restoredTaxes.hasExoneration === true,
        exoneratedTaxCodes: Array.isArray(restoredTaxes.exoneratedTaxCodes) ? restoredTaxes.exoneratedTaxCodes : [],
        motifExoneration: restoredTaxes.motifExoneration ?? "",
      });

      setCurrentStep(draft.currentStep || 1);
      setIsRestoredFromDraft(true);
      api.taxesInitRef.current = true;
      toast.success("Brouillon restauré avec succès");
    }
    setShowRestorePrompt(false);
  };

  // Pré-remplissage depuis un conteneur en attente
  useEffect(() => {
    if (prefillAppliedRef.current) return;
    if (searchParams.get("prefill") !== "conteneur") return;
    if (clientsLoading) return;

    const prefillDataStr = sessionStorage.getItem("prefill_ordre");
    if (!prefillDataStr) return;

    try {
      const prefillData = JSON.parse(prefillDataStr);
      prefillAppliedRef.current = true;
      sessionStorage.removeItem("prefill_ordre");

      api.setCategorie("conteneurs");
      setShowRestorePrompt(false);

      if (prefillData.clientNom && clients.length > 0) {
        const clientMatch = clients.find(
          (c: any) =>
            c.nom?.toLowerCase().includes(prefillData.clientNom.toLowerCase()) ||
            c.raison_sociale?.toLowerCase().includes(prefillData.clientNom.toLowerCase())
        );
        if (clientMatch) api.setClientId(clientMatch.id);
      }

      let armateurId = "";
      if (prefillData.armateurCode && armateurs.length > 0) {
        const armateurMatch = armateurs.find(
          (a: any) => a.code?.toLowerCase() === prefillData.armateurCode.toLowerCase()
        );
        if (armateurMatch) armateurId = armateurMatch.id;
      }

      const tailleFormatted =
        prefillData.conteneur?.taille === "40" || prefillData.conteneur?.taille === "40'" ? ("40'" as const) : ("20'" as const);

      api.setConteneursData({
        typeOperation: "import",
        numeroBL: prefillData.numeroBL || "",
        armateurId,
        transitaireId: "",
        representantId: "",
        primeTransitaire: 0,
        primeRepresentant: 0,
        conteneurs: [
          {
            id: crypto.randomUUID(),
            numero: prefillData.conteneur?.numero || "",
            taille: tailleFormatted,
            description: "",
            prixUnitaire: 0,
            operations: [],
          },
        ],
        montantHT: 0,
      });

      setCurrentStep(2);
      toast.success("Données du conteneur pré-remplies", {
        description: `Conteneur ${prefillData.conteneur?.numero || ""} ajouté. Complétez les informations.`,
      });
    } catch (error) {
      console.error("Erreur lors du pré-remplissage:", error);
      sessionStorage.removeItem("prefill_ordre");
    }
  }, [searchParams, clients, armateurs, clientsLoading]);

  const stepsValidation = buildOrdreStepsValidation({
    api, clients, currentStep, categoriesLabels: categoriesLabels as any, isEditMode: false,
  });

  const handleCategorieChange = (value: CategorieDocument) => {
    api.setCategorie(value);
    api.setConteneursData(null);
    api.setConventionnelData(null);
    api.setIndependantData(null);
    api.setRemiseData({ type: "none", valeur: 0, montantCalcule: 0 });
    api.setTaxesSelectionData(api.getInitialTaxesSelection());
    setCurrentStep(2);
  };

  const handleStepClick = (step: number) => {
    if (step <= currentStep + 1) setCurrentStep(step);
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !api.categorie) {
      toast.error("Veuillez sélectionner une catégorie");
      return;
    }
    if (currentStep === 2 && !api.clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }
    if (currentStep === 3) {
      const v = api.validateStep3();
      if (!v.ok) {
        toast.error(v.error || "Veuillez compléter les détails");
        return;
      }
    }
    if (api.canProceedToStep(currentStep + 1)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleOpenConfirmModal = () => {
    if (!api.clientId) { toast.error("Veuillez sélectionner un client"); return; }
    if (!api.categorie) { toast.error("Veuillez sélectionner une catégorie"); return; }

    if (api.categorie === "conteneurs" && api.conteneursData) {
      const v = validateOrdreConteneurs(api.conteneursData);
      if (!v.success) {
        toast.error("Erreurs de validation", { description: v.firstError });
        return;
      }
    } else if (api.categorie === "conventionnel" && api.conventionnelData) {
      const v = validateOrdreConventionnel(api.conventionnelData);
      if (!v.success) {
        toast.error("Erreurs de validation", { description: v.firstError });
        return;
      }
    } else if (api.categorie === "operations_independantes" && api.independantData) {
      const v = validateOrdreIndependant(api.independantData);
      if (!v.success) {
        toast.error("Erreurs de validation", { description: v.firstError });
        return;
      }
    }

    if (api.taxesSelectionData.hasExoneration && !api.taxesSelectionData.motifExoneration?.trim()) {
      toast.error("Veuillez renseigner le motif d'exonération");
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    const data = api.buildPayload({ navire: null, date_arrivee: null });
    try {
      await createOrdreMutation.mutateAsync(data);
      clear();
      setShowConfirmModal(false);
      toast.success("Ordre de travail créé avec succès");
      navigate("/ordres");
    } catch (error: any) {
      const response = error?.response?.data;
      const apiMessage = response?.message;
      const apiErrors = response?.errors;
      if (apiErrors && typeof apiErrors === "object") {
        const errorMessages = Object.entries(apiErrors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
          .join("\n");
        toast.error(apiMessage || "Erreurs de validation", { description: errorMessages, duration: 8000 });
      } else if (response?.error) {
        toast.error(apiMessage || "Erreur lors de la création de l'ordre", { description: String(response.error) });
      } else {
        toast.error(apiMessage || "Erreur lors de la création de l'ordre");
      }
      setShowConfirmModal(false);
    }
  };

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
              <p className="text-muted-foreground text-sm">Créez un ordre de travail pour l'exploitation</p>
            </div>
          </div>
          <AutoSaveIndicator
            hasDraft={hasDraft} lastSaved={lastSaved} isSaving={isSaving}
            onRestore={handleRestoreDraft} onClear={clear}
          />
        </div>
      </div>

      {showRestorePrompt && hasDraft && !isRestoredFromDraft && (
        <AutoSaveIndicator
          hasDraft={hasDraft} lastSaved={lastSaved} isSaving={isSaving}
          onRestore={handleRestoreDraft} onClear={clear}
          showRestorePrompt={true}
          onDismissPrompt={() => setShowRestorePrompt(false)}
        />
      )}

      {isMobile && (
        <OrdreStepper
          currentStep={currentStep}
          categorie={api.categorie || undefined}
          onStepClick={handleStepClick}
          stepsValidation={stepsValidation}
        />
      )}

      <div
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "BUTTON") e.preventDefault();
        }}
        className="animate-fade-in"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Step 1: Catégorie */}
          {(isMobile ? currentStep === 1 : true) && (
            <Card className="transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Catégorie d'ordre</CardTitle>
                <CardDescription>Sélectionnez le type d'ordre de travail</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(Object.keys(categoriesLabels) as CategorieDocument[]).map((key) => {
                    const cat = categoriesLabels[key];
                    const isSelected = api.categorie === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleCategorieChange(key)}
                        className={`p-4 rounded-lg border-2 text-left transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${
                          isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={isSelected ? "text-primary" : "text-muted-foreground"}>{cat.icon}</div>
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
          {(isMobile ? currentStep === 2 : !!api.categorie) && (
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
                  <ClientCombobox
                    clients={clients}
                    value={api.clientId}
                    onChange={api.setClientId}
                    placeholder="Rechercher un client..."
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Détails */}
          {(isMobile ? currentStep === 3 : !!api.categorie) && (
            <div className="space-y-6 animate-fade-in">
              {api.categorie === "conteneurs" && (
                <OrdreConteneursForm
                  armateurs={armateurs}
                  transitaires={transitaires}
                  representants={representants}
                  onDataChange={api.setConteneursData}
                  initialData={api.conteneursData ? {
                    typeOperation: api.conteneursData.typeOperation,
                    numeroBL: api.conteneursData.numeroBL,
                    armateurId: api.conteneursData.armateurId,
                    transitaireId: api.conteneursData.transitaireId,
                    representantId: api.conteneursData.representantId,
                    conteneurs: api.conteneursData.conteneurs,
                    primeTransitaire: api.conteneursData.primeTransitaire,
                    primeRepresentant: api.conteneursData.primeRepresentant,
                  } : undefined}
                />
              )}

              {api.categorie === "conventionnel" && (
                <OrdreConventionnelForm
                  onDataChange={api.setConventionnelData}
                  initialData={api.conventionnelData ? {
                    numeroBL: api.conventionnelData.numeroBL,
                    lieuChargement: api.conventionnelData.lieuChargement,
                    lieuDechargement: api.conventionnelData.lieuDechargement,
                    lots: api.conventionnelData.lots,
                  } : undefined}
                />
              )}

              {api.categorie === "operations_independantes" && (
                <OrdreIndependantForm
                  onDataChange={api.setIndependantData}
                  initialData={api.independantData ? {
                    typeOperationIndep: api.independantData.typeOperationIndep,
                    prestations: api.independantData.prestations,
                  } : undefined}
                />
              )}

              <Card className="transition-all duration-300 hover:shadow-lg">
                <CardHeader><CardTitle className="text-lg">Notes / Observations</CardTitle></CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Ajouter des notes ou observations..."
                    value={api.notes}
                    onChange={(e) => api.setNotes(e.target.value)}
                    rows={3}
                  />
                </CardContent>
              </Card>

              {api.montantHT > 0 && (
                <RemiseInput montantHT={api.montantHT} onChange={api.setRemiseData} />
              )}
            </div>
          )}

          {/* Step 4: Récapitulatif */}
          {(isMobile ? currentStep === 4 : !!api.categorie) && (
            <div className="space-y-6 animate-fade-in">
              {api.montantHTApresRemise > 0 && (
                <TaxesSelector
                  taxes={api.availableTaxes}
                  montantHT={api.montantHTApresRemise}
                  onChange={api.handleTaxesChange}
                  value={api.taxesSelectionData}
                />
              )}

              <RecapitulatifCard
                montantHT={api.montantHT}
                tauxTva={api.taxRates.TVA}
                tauxCss={api.taxRates.CSS}
                tva={api.tva}
                css={api.css}
                montantTTC={api.montantTTC}
                remiseMontant={api.remiseData.montantCalcule}
                remiseType={api.remiseData.type}
                remiseValeur={api.remiseData.valeur}
                selectedTaxCodes={api.taxesSelectionData.selectedTaxCodes}
                {...api.toApiPayload(api.taxesSelectionData)}
              />
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            {isMobile ? (
              <Button type="button" variant="outline" onClick={handlePrevStep} disabled={currentStep === 1}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
            ) : <div />}

            {isMobile && currentStep < 4 ? (
              <Button type="button" onClick={handleNextStep} disabled={!api.canProceedToStep(currentStep + 1)}>
                Suivant
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleOpenConfirmModal}
                disabled={createOrdreMutation.isPending || !api.categorie || !api.clientId}
                className="gap-2"
              >
                {createOrdreMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Créer l'ordre
              </Button>
            )}
          </div>
        </div>
      </div>

      <ConfirmationSaveModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        onConfirm={handleConfirmSave}
        title="Confirmer la création de l'ordre"
        description="Vérifiez les informations avant de créer l'ordre de travail."
        montantTTC={api.montantTTC}
        isLoading={createOrdreMutation.isPending}
      />
    </MainLayout>
  );
}
