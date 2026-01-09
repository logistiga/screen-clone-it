import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TotauxCardProps {
  montantHT: number;
  tva: number;
  css: number;
  montantTTC: number;
}

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' XAF';
};

export default function TotauxCard({ montantHT, tva, css, montantTTC }: TotauxCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Récapitulatif</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total HT</span>
            <span className="font-medium">{formatMontant(montantHT)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">TVA</span>
            <span className="font-medium">{formatMontant(tva)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">CSS</span>
            <span className="font-medium">{formatMontant(css)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between">
            <span className="font-semibold">Total TTC</span>
            <span className="text-xl font-bold text-primary">{formatMontant(montantTTC)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
