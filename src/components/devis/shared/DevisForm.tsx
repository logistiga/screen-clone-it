import { useEffect } from "react";
import { ChevronLeft, ChevronRight, FileText, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { CategorieDocument, getCategoriesLabels, TypeOperationConteneur } from "@/types/documents";
import TaxesSelector from "@/components/shared/TaxesSelector";
import RemiseInput from "@/components/shared/RemiseInput";
import {
  CategorieSelector,
  ClientInfoCard,
  RecapitulatifCard,
  DevisStepper,
  DevisPreview,
} from "@/components/devis/shared";
import {
  DevisConteneursForm,
  DevisConventionnelForm,
  DevisIndependantForm,
} from "@/components/devis/forms";
import type { DevisFormApi } from "./useDevisForm";

interface DevisFormProps {
  mode: "create" | "edit";
  api: DevisFormApi;
  currentStep: number;
  setCurrentStep: (s: number) => void;
  clients: any[];
  armateurs: any[];
  transitaires: any[];
  representants: any[];
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  // Edit mode: initial form data for child forms (already mapped)
  initialChildData?: {
    conteneurs?: any;
    conventionnel?: any;
    independant?: any;
  };
  // Create mode: only used when restoring from draft
  isRestoredFromDraft?: boolean;
  selectedClient?: any;
}

export default function DevisForm({
  mode,
  api,
  currentStep,
  setCurrentStep,
  clients,
  armateurs,
  transitaires,
  representants,
  isSubmitting,
  onSubmit,
  onCancel,
  initialChildData,
  isRestoredFromDraft = false,
  selectedClient,
}: DevisFormProps) {
  const isMobile = useIsMobile();
  const isEdit = mode === "edit";
  const categoriesLabels = getCategoriesLabels();

  const {
    categorie, setCategorie,
    clientId, setClientId,
    dateValidite, setDateValidite,
    notes, setNotes,
    setConteneursData,
    setConventionnelData,
    setIndependantData,
    conteneursData,
    conventionnelData,
    independantData,
    remiseData, setRemiseData,
    taxesSelectionData,
    handleTaxesChange,
    montantHT, montantHTApresRemise, tva, css, montantTTC,
    taxRates, availableTaxes, toApiPayload,
  } = api;

  // Categorie reset (create only)
  const handleCategorieChange = (value: CategorieDocument) => {
    setCategorie(value);
    setConteneursData(null);
    setConventionnelData(null);
    setIndependantData(null);
    setRemiseData({ type: "none", valeur: 0, montantCalcule: 0 });
    setCurrentStep(2);
  };

  const handleNextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };
  const handlePrevStep = () => {
    const min = isEdit ? 2 : 1;
    if (currentStep > min) setCurrentStep(currentStep - 1);
  };

  const canProceedToNext = () => {
    if (isEdit) return true;
    switch (currentStep) {
      case 1: return !!categorie;
      case 2: return !!clientId;
      case 3:
        if (categorie === "conteneurs") return !!conteneursData?.numeroBL;
        if (categorie === "conventionnel") return !!conventionnelData?.numeroBL;
        if (categorie === "operations_independantes") return !!independantData?.typeOperationIndep;
        return false;
      default: return true;
    }
  };

  const calculateCurrentStep = () => {
    if (!categorie) return 1;
    if (!clientId) return 2;
    const hasContent =
      (categorie === "conteneurs" && conteneursData && conteneursData.conteneurs.length > 0) ||
      (categorie === "conventionnel" && conventionnelData && conventionnelData.lots.length > 0) ||
      (categorie === "operations_independantes" && independantData && independantData.prestations.length > 0);
    if (!hasContent) return 3;
    return 4;
  };

  // Visibility helpers
  const showStep = (step: number) => {
    if (isEdit) return currentStep === step;
    if (isMobile) return currentStep === step;
    // desktop create: step 1 always; 2-4 once cat selected; 5 mobile-only
    if (step === 1) return true;
    if (step === 5) return false;
    return !!categorie;
  };

  const formContent = (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Étape 1: Catégorie (création uniquement) */}
      {!isEdit && showStep(1) && (
        <div className="animate-fade-in">
          <CategorieSelector onSelect={handleCategorieChange} />
        </div>
      )}

      {/* Catégorie en lecture seule (édition) */}
      {isEdit && categorie && (
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="py-2 px-4 text-sm flex items-center gap-2">
            {categoriesLabels[categorie]?.icon}
            <span>{categoriesLabels[categorie]?.label}</span>
          </Badge>
          <span className="text-sm text-muted-foreground">(non modifiable)</span>
        </div>
      )}

      {/* Étape 2: Client */}
      {((!isEdit && showStep(2) && categorie) || (isEdit && currentStep === 2)) && (
        <div className="animate-fade-in space-y-4">
          {!isEdit && isMobile && categorie && (
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="py-2 px-4 text-sm flex items-center gap-2">
                {categoriesLabels[categorie].icon}
                <span>{categoriesLabels[categorie].label}</span>
              </Badge>
              <Button
                type="button" variant="ghost" size="sm"
                onClick={() => { setCategorie(""); setCurrentStep(1); }}
                className="text-muted-foreground"
              >
                Changer
              </Button>
            </div>
          )}
          <ClientInfoCard
            clientId={clientId}
            setClientId={setClientId}
            dateValidite={dateValidite}
            setDateValidite={setDateValidite}
            clients={clients}
          />
        </div>
      )}

      {/* Étape 3: Détails */}
      {((!isEdit && showStep(3) && categorie) || (isEdit && currentStep === 3)) && (
        <div className="animate-fade-in">
          {categorie === "conteneurs" && (
            <DevisConteneursForm
              armateurs={armateurs}
              transitaires={transitaires}
              representants={representants}
              onDataChange={setConteneursData}
              initialData={
                isEdit
                  ? initialChildData?.conteneurs
                  : isRestoredFromDraft && conteneursData
                    ? {
                        typeOperation: conteneursData.typeOperation,
                        numeroBL: conteneursData.numeroBL,
                        armateurId: conteneursData.armateurId,
                        transitaireId: conteneursData.transitaireId,
                        representantId: conteneursData.representantId,
                        conteneurs: conteneursData.conteneurs,
                      }
                    : undefined
              }
            />
          )}

          {categorie === "conventionnel" && (
            <DevisConventionnelForm
              onDataChange={setConventionnelData}
              initialData={
                isEdit
                  ? initialChildData?.conventionnel
                  : isRestoredFromDraft && conventionnelData
                    ? {
                        numeroBL: conventionnelData.numeroBL,
                        lieuChargement: conventionnelData.lieuChargement,
                        lieuDechargement: conventionnelData.lieuDechargement,
                        lots: conventionnelData.lots,
                      }
                    : undefined
              }
            />
          )}

          {categorie === "operations_independantes" && (
            <DevisIndependantForm
              onDataChange={setIndependantData}
              initialData={
                isEdit
                  ? initialChildData?.independant
                  : isRestoredFromDraft && independantData
                    ? {
                        typeOperationIndep: independantData.typeOperationIndep,
                        lieuChargement: independantData.lieuChargement,
                        lieuDechargement: independantData.lieuDechargement,
                        prestations: independantData.prestations,
                      }
                    : undefined
              }
            />
          )}
        </div>
      )}

      {/* Étape 4: Récapitulatif */}
      {((!isEdit && showStep(4) && categorie) || (isEdit && currentStep === 4)) && (
        <div className="animate-fade-in space-y-6">
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

          {montantHT > 0 && (
            <RemiseInput
              montantHT={montantHT}
              onChange={setRemiseData}
              initialType={remiseData.type}
              initialValeur={remiseData.valeur}
            />
          )}

          {montantHTApresRemise > 0 && (
            <TaxesSelector
              taxes={availableTaxes}
              montantHT={montantHTApresRemise}
              onChange={handleTaxesChange}
              value={taxesSelectionData}
            />
          )}

          <RecapitulatifCard
            montantHT={montantHT}
            tva={tva}
            css={css}
            montantTTC={montantTTC}
            tauxTva={taxRates.TVA}
            tauxCss={taxRates.CSS}
            remiseMontant={remiseData.montantCalcule}
            remiseType={remiseData.type}
            remiseValeur={remiseData.valeur}
            selectedTaxCodes={taxesSelectionData.selectedTaxCodes}
            {...toApiPayload(taxesSelectionData)}
          />
        </div>
      )}

      {/* Étape 5: Aperçu mobile (création) ou édition */}
      {((!isEdit && isMobile && currentStep === 5 && categorie) || (isEdit && currentStep === 5)) && (
        <div className="animate-fade-in">
          <Card className="border-primary/20">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Vérification finale
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-4">
                {isEdit
                  ? "Vérifiez les modifications avant d'enregistrer."
                  : "Vérifiez les informations avant de créer le devis."}
              </p>
              <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">
                    {isEdit ? "Prêt à enregistrer" : "Prêt à créer"}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    Montant TTC: {montantTTC.toLocaleString("fr-FR")} XAF
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      {(isEdit || categorie) && (
        <div className="flex justify-between gap-4 pb-6 animate-fade-in">
          <div>
            {((isEdit && currentStep > 2) || (!isEdit && isMobile && currentStep > 1)) && (
              <Button type="button" variant="outline" onClick={handlePrevStep} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
            )}
          </div>

          <div className="flex gap-4">
            <Button
              type="button" variant="outline" onClick={onCancel}
              disabled={isSubmitting}
              className="transition-all duration-200 hover:scale-105"
            >
              Annuler
            </Button>

            {((isEdit || isMobile) && currentStep < 5) ? (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={!canProceedToNext()}
                className="gap-2 transition-all duration-200 hover:scale-105"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isEdit ? "Enregistrer les modifications" : "Créer le devis"}
              </Button>
            )}
          </div>
        </div>
      )}
    </form>
  );

  // Stepper rendering
  const stepper = (isEdit || isMobile) ? (
    <DevisStepper
      currentStep={currentStep}
      onStepClick={(step) => {
        if (isEdit) setCurrentStep(step);
        else if (step <= calculateCurrentStep() + 1) setCurrentStep(step);
      }}
      isEditMode={isEdit}
    />
  ) : null;

  // Layout: edit = grid 3 cols with preview; create = max-w-4xl single column
  if (isEdit) {
    return (
      <>
        {stepper}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="animate-fade-in">{formContent}</div>
          </div>
          <div className="lg:col-span-1">
            <DevisPreview
              categorie={categorie}
              client={selectedClient}
              dateValidite={dateValidite}
              notes={notes}
              conteneursData={conteneursData}
              conventionnelData={conventionnelData}
              independantData={independantData}
              montantHT={montantHT}
              tva={tva}
              css={css}
              montantTTC={montantTTC}
              remiseData={remiseData}
              armateurs={armateurs}
              transitaires={transitaires}
              representants={representants}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {stepper}
      <div className="max-w-4xl mx-auto">{formContent}</div>
    </>
  );
}
