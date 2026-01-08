import { LignePrestationEtendue } from "@/types/documents";

interface DoubleRelevageFormFieldsProps {
  prestation: LignePrestationEtendue;
  onPrestationChange: (id: string, field: keyof LignePrestationEtendue, value: string | number) => void;
}

export default function DoubleRelevageFormFields({
  prestation,
  onPrestationChange,
}: DoubleRelevageFormFieldsProps) {
  // Double relevage n'a pas de champs spécifiques
  // Les champs communs (description, quantité, prix) sont gérés dans le parent
  return null;
}
