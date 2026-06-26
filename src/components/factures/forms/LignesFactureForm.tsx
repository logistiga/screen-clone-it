import LignesForm from "@/components/documents/forms/LignesForm";
import type { LigneFacture } from "@/components/documents/forms/types";

export type { LigneFacture };

interface Props {
  lignes: LigneFacture[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: keyof LigneFacture, value: string | number) => void;
}

export default function LignesFactureForm(props: Props) {
  return <LignesForm<LigneFacture> documentType="facture" {...props} />;
}
