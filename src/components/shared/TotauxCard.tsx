import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calculator } from "lucide-react";

interface TotauxCardProps {
  montantHT: number;
  montantTVA: number;
  montantCSS: number;
  montantTTC: number;
}

export function TotauxCard({
  montantHT,
  montantTVA,
  montantCSS,
  montantTTC,
}: TotauxCardProps) {
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
          Totaux
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Montant HT</span>
          <span>{formatMontant(montantHT)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">TVA</span>
          <span>{formatMontant(montantTVA)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">CSS</span>
          <span>{formatMontant(montantCSS)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>Total TTC</span>
          <span className="text-primary">{formatMontant(montantTTC)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
