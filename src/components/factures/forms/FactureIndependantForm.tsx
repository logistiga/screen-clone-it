import IndependantForm, {
  type IndependantFormData,
  type IndependantFormInitial,
} from "@/components/documents/forms/IndependantForm";

export type FactureIndependantData = IndependantFormData;

interface Props {
  onDataChange: (data: FactureIndependantData) => void;
  initialData?: FactureIndependantData | null;
}

export default function FactureIndependantForm({ onDataChange, initialData }: Props) {
  return (
    <IndependantForm
      initialData={initialData as IndependantFormInitial}
      onDataChange={onDataChange}
    />
  );
}
