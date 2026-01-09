import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calculator } from "lucide-react";

interface RecapitulatifCardProps {
  montantHT: number;
  montantTVA?: number;
  montantCSS?: number;
  montantTTC: number;
  tauxTVA?: number;
  tauxCSS?: number;
  // Alias pour compatibilité avec les pages existantes
  tva?: number;
  css?: number;
  tauxTva?: number;
  tauxCss?: number;
}

export function RecapitulatifCard({
  montantHT,
  montantTVA,
  montantCSS,
  montantTTC,
  tauxTVA,
  tauxCSS,
  tva,
  css,
  tauxTva,
  tauxCss,
}: RecapitulatifCardProps) {
  // Prendre la valeur de montantTVA ou tva
  const displayTVA = montantTVA ?? tva ?? 0;
  const displayCSS = montantCSS ?? css ?? 0;
  const displayTauxTVA = tauxTVA ?? tauxTva ?? 18;
  const displayTauxCSS = tauxCSS ?? tauxCss ?? 1;

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(montant);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Récapitulatif
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Montant HT</span>
          <span className="font-medium">{formatMontant(montantHT)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">TVA ({displayTauxTVA}%)</span>
          <span className="font-medium">{formatMontant(displayTVA)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">CSS ({displayTauxCSS}%)</span>
          <span className="font-medium">{formatMontant(displayCSS)}</span>
        </div>
        <Separator />
        <div className="flex justify-between text-lg">
          <span className="font-semibold">Total TTC</span>
          <span className="font-bold text-primary">{formatMontant(montantTTC)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
