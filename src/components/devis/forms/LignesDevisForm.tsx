import LignesForm from "@/components/documents/forms/LignesForm";
import type { LigneDevis } from "@/components/documents/forms/types";

export type { LigneDevis };

interface Props {
  lignes: LigneDevis[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: keyof LigneDevis, value: string | number) => void;
}

export default function LignesDevisForm(props: Props) {
  return <LignesForm<LigneDevis> documentType="devis" {...props} />;
}
