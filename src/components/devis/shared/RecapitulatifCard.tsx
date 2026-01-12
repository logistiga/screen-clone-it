import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecapitulatifCardProps {
  montantHT: number;
  tva: number;
  css: number;
  montantTTC: number;
  tauxTva?: number;
  tauxCss?: number;
  remiseMontant?: number;
  remiseType?: string;
  remiseValeur?: number;
}

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' XAF';
};

export default function RecapitulatifCard({
  montantHT,
  tva,
  css,
  montantTTC,
  tauxTva = 18,
  tauxCss = 1,
  remiseMontant = 0,
  remiseType,
  remiseValeur,
}: RecapitulatifCardProps) {
  const montantHTApresRemise = montantHT - remiseMontant;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Récapitulatif</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-w-md ml-auto">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total HT (avant remise)</span>
            <span className="font-medium">{formatMontant(montantHT)}</span>
          </div>

          {remiseMontant > 0 && (
            <>
              <div className="flex justify-between text-destructive">
                <span>
                  Remise
                  {remiseType === "pourcentage" && remiseValeur ? ` (${remiseValeur}%)` : ""}
                </span>
                <span className="font-medium">- {formatMontant(remiseMontant)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-muted-foreground">Sous-total HT</span>
                <span className="font-medium">{formatMontant(montantHTApresRemise)}</span>
              </div>
            </>
          )}

          <div className="flex justify-between">
            <span className="text-muted-foreground">TVA ({tauxTva}%)</span>
            <span>{formatMontant(tva)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">CSS ({tauxCss}%)</span>
            <span>{formatMontant(css)}</span>
          </div>
          <div className="border-t pt-3 flex justify-between text-lg font-bold">
            <span>Total TTC</span>
            <span className="text-primary">{formatMontant(montantTTC)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
