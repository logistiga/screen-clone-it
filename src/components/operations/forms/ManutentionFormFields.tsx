import { LignePrestationEtendue } from "@/types/documents";

interface ManutentionFormFieldsProps {
  prestation: LignePrestationEtendue;
  onPrestationChange: (id: string, field: keyof LignePrestationEtendue, value: string | number) => void;
}

export default function ManutentionFormFields({
  prestation,
  onPrestationChange,
}: ManutentionFormFieldsProps) {
  // Manutention n'a pas de champs spécifiques
  // Les champs communs (description, quantité, prix) sont gérés dans le parent
  return null;
}
