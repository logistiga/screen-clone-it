import IndependantForm, {
  type IndependantFormData,
  type IndependantFormInitial,
} from "@/components/documents/forms/IndependantForm";
import type { TypeOperationIndep, TypeMarchandise, LignePrestationEtendue } from "@/types/documents";

export interface DevisIndependantInitialData {
  typeOperationIndep?: TypeOperationIndep | "";
  typeMarchandise?: TypeMarchandise | "";
  descriptionGenerale?: string;
  observationInterne?: string;
  lieuChargement?: string;
  lieuDechargement?: string;
  prestations?: LignePrestationEtendue[];
}

export interface DevisIndependantData extends IndependantFormData {
  lieuChargement: string;
  lieuDechargement: string;
}

interface Props {
  onDataChange: (data: DevisIndependantData) => void;
  initialData?: DevisIndependantInitialData;
}

export default function DevisIndependantForm({ onDataChange, initialData }: Props) {
  return (
    <IndependantForm
      trackLieux
      initialData={initialData as IndependantFormInitial}
      onDataChange={(d) =>
        onDataChange({
          ...d,
          lieuChargement: d.lieuChargement ?? "",
          lieuDechargement: d.lieuDechargement ?? "",
        })
      }
    />
  );
}
