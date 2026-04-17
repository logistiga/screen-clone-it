import { useCallback, useMemo, useRef, useState } from "react";
import { CategorieDocument, typesOperationConteneur } from "@/types/documents";
import { TaxesSelectionData } from "@/components/shared/TaxesSelector";
import { RemiseData } from "@/components/shared/RemiseInput";
import type { OrdreConteneursData } from "@/components/ordres/forms/OrdreConteneursForm";
import type { OrdreConventionnelData } from "@/components/ordres/forms/OrdreConventionnelForm";
import type { OrdreIndependantData } from "@/components/ordres/forms/OrdreIndependantForm";
import { useDocumentTaxes } from "@/hooks/useDocumentTaxes";

export interface OrdreFormInitial {
  categorie?: CategorieDocument | "";
  clientId?: string;
  notes?: string;
  conteneursData?: OrdreConteneursData | null;
  conventionnelData?: OrdreConventionnelData | null;
  independantData?: OrdreIndependantData | null;
  remiseData?: RemiseData;
  taxesSelectionData?: TaxesSelectionData;
}

export function useOrdreForm(initial?: OrdreFormInitial) {
  const [categorie, setCategorie] = useState<CategorieDocument | "">(initial?.categorie ?? "");
  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const [conteneursData, setConteneursData] = useState<OrdreConteneursData | null>(initial?.conteneursData ?? null);
  const [conventionnelData, setConventionnelData] = useState<OrdreConventionnelData | null>(initial?.conventionnelData ?? null);
  const [independantData, setIndependantData] = useState<OrdreIndependantData | null>(initial?.independantData ?? null);

  const [remiseData, setRemiseData] = useState<RemiseData>(
    initial?.remiseData ?? { type: "none", valeur: 0, montantCalcule: 0 }
  );

  const [taxesSelectionData, setTaxesSelectionData] = useState<TaxesSelectionData>(
    initial?.taxesSelectionData ?? {
      selectedTaxCodes: [],
      hasExoneration: false,
      exoneratedTaxCodes: [],
      motifExoneration: "",
    }
  );

  const taxesInitRef = useRef(false);

  const {
    taxRates,
    availableTaxes,
    isLoading: taxesLoading,
    getInitialTaxesSelection,
    getTaxesSelectionFromDocument,
    calculateTaxes,
    toApiPayload,
  } = useDocumentTaxes();

  // Comparaison stricte pour éviter les setState inutiles
  const handleTaxesChange = useCallback((next: TaxesSelectionData) => {
    setTaxesSelectionData((prev) => {
      const same =
        prev.hasExoneration === next.hasExoneration &&
        prev.motifExoneration === next.motifExoneration &&
        prev.selectedTaxCodes.length === next.selectedTaxCodes.length &&
        prev.selectedTaxCodes.every((v, i) => v === next.selectedTaxCodes[i]) &&
        prev.exoneratedTaxCodes.length === next.exoneratedTaxCodes.length &&
        prev.exoneratedTaxCodes.every((v, i) => v === next.exoneratedTaxCodes[i]);
      return same ? prev : next;
    });
  }, []);

  // Montants
  const getMontantHT = (): number => {
    if (categorie === "conteneurs" && conteneursData) return conteneursData.montantHT;
    if (categorie === "conventionnel" && conventionnelData) return conventionnelData.montantHT;
    if (categorie === "operations_independantes" && independantData) return independantData.montantHT;
    return 0;
  };

  const montantHT = getMontantHT();
  const montantHTApresRemise = montantHT - remiseData.montantCalcule;
  const taxesResult = calculateTaxes(montantHTApresRemise, taxesSelectionData);
  const montantTTC = montantHTApresRemise + taxesResult.totalTaxes;

  // Validation par étape (utilisée par les 2 pages OT)
  const validateStep3 = (): { ok: boolean; error?: string } => {
    if (categorie === "conteneurs") {
      if (!conteneursData?.typeOperation) return { ok: false, error: "Veuillez sélectionner un type d'opération" };
      if (!conteneursData.numeroBL?.trim()) return { ok: false, error: "Veuillez saisir le numéro BL" };
      if (!conteneursData.conteneurs?.length || conteneursData.conteneurs.every((c) => !c.numero?.trim())) {
        return { ok: false, error: "Veuillez ajouter au moins un conteneur" };
      }
      return { ok: true };
    }
    if (categorie === "conventionnel") {
      if (!conventionnelData?.numeroBL?.trim()) return { ok: false, error: "Veuillez saisir le numéro BL" };
      if (!conventionnelData.lots?.length || conventionnelData.lots.every((l) => !l.description?.trim())) {
        return { ok: false, error: "Veuillez ajouter au moins un lot" };
      }
      return { ok: true };
    }
    if (categorie === "operations_independantes") {
      if (!independantData?.typeOperationIndep) return { ok: false, error: "Veuillez sélectionner un type d'opération" };
      if (!independantData.prestations?.length || independantData.prestations.every((p) => !p.description?.trim())) {
        return { ok: false, error: "Veuillez ajouter au moins une prestation" };
      }
      return { ok: true };
    }
    return { ok: false, error: "Catégorie inconnue" };
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

  // Construction du payload API
  const buildPayload = useCallback(
    (extra?: Record<string, any>) => {
      const data: any = {
        client_id: clientId ? parseInt(String(clientId)) : null,
        type_document:
          categorie === "conteneurs"
            ? "Conteneur"
            : categorie === "conventionnel"
              ? "Lot"
              : categorie === "operations_independantes"
                ? "Independant"
                : null,
        type_operation: categorie === "conteneurs" && conteneursData ? conteneursData.typeOperation : null,
        type_operation_indep:
          categorie === "operations_independantes" && independantData ? independantData.typeOperationIndep : null,
        notes:
          categorie === "conventionnel" && (conventionnelData as any)?.description
            ? (conventionnelData as any).description
            : notes || null,
        remise_type: remiseData.type === "none" ? null : remiseData.type,
        remise_valeur: remiseData.type === "none" ? 0 : remiseData.valeur || 0,
        remise_montant: remiseData.type === "none" ? 0 : remiseData.montantCalcule || 0,
        ...toApiPayload(taxesSelectionData),
        lignes: [],
        conteneurs: [],
        lots: [],
        ...extra,
      };

      if (categorie === "conteneurs" && conteneursData) {
        data.armateur_id = conteneursData.armateurId ? parseInt(conteneursData.armateurId) : null;
        data.transitaire_id = conteneursData.transitaireId ? parseInt(conteneursData.transitaireId) : null;
        data.representant_id = conteneursData.representantId ? parseInt(conteneursData.representantId) : null;
        data.bl_numero = conteneursData.numeroBL || null;
        data.prime_transitaire = conteneursData.primeTransitaire || 0;
        data.prime_representant = conteneursData.primeRepresentant || 0;
        data.conteneurs = conteneursData.conteneurs.map((c) => ({
          numero: c.numero,
          type: "DRY",
          taille: c.taille === "20'" ? "20" : "40",
          description: c.description || null,
          armateur_id: conteneursData.armateurId ? parseInt(conteneursData.armateurId) : null,
          prix_unitaire: c.prixUnitaire || 0,
          operations: c.operations.map((op) => ({
            type_operation: op.type,
            description: typesOperationConteneur[op.type]?.label || op.description || "",
            quantite: op.quantite,
            prix_unitaire: op.prixUnitaire,
          })),
        }));
      }

      if (categorie === "conventionnel" && conventionnelData) {
        data.bl_numero = conventionnelData.numeroBL || null;
        data.lieu_chargement = conventionnelData.lieuChargement || null;
        data.lieu_dechargement = conventionnelData.lieuDechargement || null;
        data.lots = conventionnelData.lots.map((l) => ({
          designation: l.description || l.numeroLot || `Lot ${l.numeroLot}`,
          quantite: l.quantite,
          poids: 0,
          volume: 0,
          prix_unitaire: l.prixUnitaire,
        }));
      }

      if (categorie === "operations_independantes" && independantData) {
        data.type_operation_indep = independantData.typeOperationIndep || null;
        data.lignes = independantData.prestations.map((p) => ({
          type_operation: independantData.typeOperationIndep || "manutention",
          description: p.description || "",
          lieu_depart: p.lieuDepart || null,
          lieu_arrivee: p.lieuArrivee || null,
          date_debut: p.dateDebut || null,
          date_fin: p.dateFin || null,
          quantite: p.quantite || 1,
          prix_unitaire: p.prixUnitaire || 0,
        }));
      }

      return data;
    },
    [categorie, clientId, notes, remiseData, taxesSelectionData, toApiPayload, conteneursData, conventionnelData, independantData]
  );

  return {
    // state
    categorie, setCategorie,
    clientId, setClientId,
    notes, setNotes,
    conteneursData, setConteneursData,
    conventionnelData, setConventionnelData,
    independantData, setIndependantData,
    remiseData, setRemiseData,
    taxesSelectionData, setTaxesSelectionData,
    handleTaxesChange,
    taxesInitRef,
    // computed
    montantHT,
    montantHTApresRemise,
    tva: taxesResult.tva,
    css: taxesResult.css,
    totalTaxes: taxesResult.totalTaxes,
    montantTTC,
    // taxes meta
    taxRates,
    availableTaxes,
    taxesLoading,
    getInitialTaxesSelection,
    getTaxesSelectionFromDocument,
    toApiPayload,
    // helpers
    validateStep3,
    canProceedToStep,
    buildPayload,
  };
}

export type OrdreFormApi = ReturnType<typeof useOrdreForm>;
