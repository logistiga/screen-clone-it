import IndependantForm, {
  type IndependantFormData,
  type IndependantFormInitial,
} from "@/components/documents/forms/IndependantForm";

export type OrdreIndependantData = IndependantFormData;

interface Props {
  onDataChange: (data: OrdreIndependantData) => void;
  initialData?: Partial<OrdreIndependantData>;
}

export default function OrdreIndependantForm({ onDataChange, initialData }: Props) {
  return (
    <IndependantForm
      withValidation
      initialData={initialData as IndependantFormInitial}
      onDataChange={onDataChange}
    />
  );
}
