import { CategorieDocument } from "@/types/documents";
import type { OrdreFormApi } from "./useOrdreForm";

export interface StepValidation {
  isValid: boolean;
  hasError: boolean;
  details: string[];
}

export type StepsValidation = Record<number, StepValidation>;

export interface BuildStepsValidationOptions {
  api: OrdreFormApi;
  clients: any[];
  currentStep: number;
  categoriesLabels: Record<string, { label: string; icon?: any }>;
  /** En mode édition, l'étape 1 est read-only (pas d'erreur possible). */
  isEditMode?: boolean;
}

/**
 * Construit l'état de validation des étapes 1-4 pour OrdreStepper.
 * Utilisé par NouvelOrdre et ModifierOrdre.
 */
export function buildOrdreStepsValidation({
  api,
  clients,
  currentStep,
  categoriesLabels,
  isEditMode = false,
}: BuildStepsValidationOptions): StepsValidation {
  const { categorie, clientId, conteneursData, conventionnelData, independantData } = api;

  // Step 1 : catégorie
  const isStep1Valid = !!categorie;
  const step1Details = categorie
    ? [`Catégorie : ${(categoriesLabels[categorie as CategorieDocument] as any)?.label ?? categorie}`]
    : isEditMode ? [] : ["Catégorie non sélectionnée"];

  // Step 2 : client
  const isStep2Valid = !!clientId;
  const selectedClient = clients.find((c: any) => c.id === clientId);
  const step2Details = selectedClient
    ? [`Client : ${selectedClient.nom}`]
    : ["Client non sélectionné"];

  // Step 3 : détails selon la catégorie
  let isStep3Valid = false;
  let step3Details: string[] = [];

  if (categorie === "conteneurs") {
    const missing: string[] = [];
    const completed: string[] = [];
    if (!conteneursData?.typeOperation) missing.push("Type d'opération");
    else completed.push(`Type : ${conteneursData.typeOperation}`);
    if (!conteneursData?.numeroBL?.trim()) missing.push("Numéro BL");
    else completed.push(`BL : ${conteneursData.numeroBL}`);
    const validConteneurs = conteneursData?.conteneurs?.filter((c) => c.numero?.trim()).length || 0;
    if (validConteneurs === 0) missing.push("Au moins un conteneur");
    else completed.push(`${validConteneurs} conteneur(s)`);
    isStep3Valid = missing.length === 0;
    step3Details = isStep3Valid ? completed : missing;
  } else if (categorie === "conventionnel") {
    const missing: string[] = [];
    const completed: string[] = [];
    if (!conventionnelData?.numeroBL?.trim()) missing.push("Numéro BL");
    else completed.push(`BL : ${conventionnelData.numeroBL}`);
    const validLots = conventionnelData?.lots?.filter((l) => l.description?.trim()).length || 0;
    if (validLots === 0) missing.push("Au moins un lot");
    else completed.push(`${validLots} lot(s)`);
    isStep3Valid = missing.length === 0;
    step3Details = isStep3Valid ? completed : missing;
  } else if (categorie === "operations_independantes") {
    const missing: string[] = [];
    const completed: string[] = [];
    if (!independantData?.typeOperationIndep) missing.push("Type d'opération");
    else completed.push(`Type : ${independantData.typeOperationIndep}`);
    const validPrestations = independantData?.prestations?.filter((p) => p.description?.trim()).length || 0;
    if (validPrestations === 0) missing.push("Au moins une prestation");
    else completed.push(`${validPrestations} prestation(s)`);
    isStep3Valid = missing.length === 0;
    step3Details = isStep3Valid ? completed : missing;
  }

  return {
    1: {
      isValid: isEditMode ? true : isStep1Valid,
      hasError: !isEditMode && currentStep > 1 && !isStep1Valid,
      details: step1Details,
    },
    2: {
      isValid: isStep2Valid,
      hasError: currentStep > 2 && !isStep2Valid,
      details: step2Details,
    },
    3: {
      isValid: isStep3Valid,
      hasError: currentStep > 3 && !isStep3Valid,
      details: step3Details,
    },
    4: { isValid: true, hasError: false, details: ["Vérification finale"] },
  };
}
