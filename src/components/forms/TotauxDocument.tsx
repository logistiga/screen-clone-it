import { formatMontant, TAUX_TVA, TAUX_CSS } from "@/data/mockData";

interface TotauxDocumentProps {
  montantHT: number;
  tva: number;
  css: number;
  montantTTC: number;
}

export function TotauxDocument({ montantHT, tva, css, montantTTC }: TotauxDocumentProps) {
  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span>Sous-total HT</span>
        <span className="font-medium">{formatMontant(montantHT)}</span>
      </div>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>TVA ({TAUX_TVA * 100}%)</span>
        <span>{formatMontant(tva)}</span>
      </div>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>CSS ({TAUX_CSS * 100}%)</span>
        <span>{formatMontant(css)}</span>
      </div>
      <div className="border-t pt-2 flex justify-between text-lg font-bold">
        <span>Total TTC</span>
        <span className="text-primary">{formatMontant(montantTTC)}</span>
      </div>
    </div>
  );
}
