import { useCallback, useMemo, useRef, useState } from "react";
import { CategorieDocument } from "@/types/documents";
import { TaxesSelectionData } from "@/components/shared/TaxesSelector";
import { RemiseData } from "@/components/shared/RemiseInput";
import type { DevisConteneursData } from "@/components/devis/forms/DevisConteneursForm";
import type { DevisConventionnelData } from "@/components/devis/forms/DevisConventionnelForm";
import type { DevisIndependantData } from "@/components/devis/forms/DevisIndependantForm";
import { useDocumentTaxes } from "@/hooks/useDocumentTaxes";

export interface DevisFormState {
  categorie: CategorieDocument | "";
  clientId: string;
  dateValidite: string;
  notes: string;
  conteneursData: DevisConteneursData | null;
  conventionnelData: DevisConventionnelData | null;
  independantData: DevisIndependantData | null;
  remiseData: RemiseData;
  taxesSelectionData: TaxesSelectionData;
}

const defaultDateValidite = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
};

export function useDevisForm(initial?: Partial<DevisFormState>) {
  const [categorie, setCategorie] = useState<CategorieDocument | "">(initial?.categorie ?? "");
  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [dateValidite, setDateValidite] = useState(initial?.dateValidite ?? defaultDateValidite());
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const [conteneursData, setConteneursData] = useState<DevisConteneursData | null>(initial?.conteneursData ?? null);
  const [conventionnelData, setConventionnelData] = useState<DevisConventionnelData | null>(initial?.conventionnelData ?? null);
  const [independantData, setIndependantData] = useState<DevisIndependantData | null>(initial?.independantData ?? null);

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

  const { taxRates, availableTaxes, isLoading: taxesLoading, calculateTaxes, toApiPayload } = useDocumentTaxes();

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

  const buildPayload = useCallback(
    (extra?: Record<string, any>) => {
      const typeDocumentMap: Record<CategorieDocument, string> = {
        conteneurs: "Conteneur",
        conventionnel: "Lot",
        operations_independantes: "Independant",
      };

      const data: any = {
        client_id: parseInt(clientId),
        date_validite: dateValidite,
        notes: notes || null,
        remise_type: remiseData.type === "none" ? null : remiseData.type,
        remise_valeur: remiseData.type === "none" ? 0 : remiseData.valeur || 0,
        remise_montant: remiseData.type === "none" ? 0 : remiseData.montantCalcule || 0,
        ...toApiPayload(taxesSelectionData),
        ...extra,
      };

      if (categorie) {
        data.type_document = typeDocumentMap[categorie as CategorieDocument];
      }

      if (categorie === "conteneurs" && conteneursData) {
        data.transitaire_id = conteneursData.transitaireId ? parseInt(conteneursData.transitaireId) : null;
        data.representant_id = conteneursData.representantId ? parseInt(conteneursData.representantId) : null;
        data.armateur_id = conteneursData.armateurId ? parseInt(conteneursData.armateurId) : null;
        data.bl_numero = conteneursData.numeroBL || null;
        data.type_operation = conteneursData.typeOperation || "import";
        data.conteneurs = conteneursData.conteneurs.map((c) => ({
          numero: c.numero,
          type: "DRY",
          taille: c.taille === "20'" ? "20" : "40",
          description: c.description || null,
          prix_unitaire: c.prixUnitaire || 0,
          armateur_id: conteneursData.armateurId ? parseInt(conteneursData.armateurId) : null,
          operations: c.operations.map((op) => ({
            type_operation: op.type,
            description: op.description || "",
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
          numero_lot: l.numeroLot || null,
          designation: l.description || `Lot ${l.numeroLot}`,
          description: l.description || `Lot ${l.numeroLot}`,
          quantite: l.quantite,
          prix_unitaire: l.prixUnitaire,
        }));
      }

      if (categorie === "operations_independantes" && independantData) {
        data.type_operation_indep = independantData.typeOperationIndep || null;
        data.lignes = independantData.prestations.map((p) => ({
          type_operation: independantData.typeOperationIndep || "manutention",
          description: p.description || "",
          lieu_depart: p.lieuDepart || independantData.lieuChargement || null,
          lieu_arrivee: p.lieuArrivee || independantData.lieuDechargement || null,
          date_debut: p.dateDebut || null,
          date_fin: p.dateFin || null,
          quantite: p.quantite || 1,
          prix_unitaire: p.prixUnitaire || 0,
        }));
      }

      return data;
    },
    [
      clientId,
      dateValidite,
      notes,
      remiseData,
      taxesSelectionData,
      toApiPayload,
      categorie,
      conteneursData,
      conventionnelData,
      independantData,
    ]
  );

  return {
    // state
    categorie, setCategorie,
    clientId, setClientId,
    dateValidite, setDateValidite,
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
    montantTTC,
    // taxes meta
    taxRates,
    availableTaxes,
    taxesLoading,
    toApiPayload,
    // helpers
    buildPayload,
  };
}

export type DevisFormApi = ReturnType<typeof useDevisForm>;
