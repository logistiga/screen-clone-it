import LignesForm from "@/components/documents/forms/LignesForm";
import type { LigneOrdre } from "@/components/documents/forms/types";

export type { LigneOrdre };

interface Props {
  lignes: LigneOrdre[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: keyof LigneOrdre, value: string | number) => void;
}

export default function LignesOrdreForm(props: Props) {
  return <LignesForm<LigneOrdre> documentType="ordre" {...props} />;
}
