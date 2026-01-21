import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

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
  exonereTva?: boolean;
  exonereCss?: boolean;
  motifExoneration?: string;
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
  exonereTva = false,
  exonereCss = false,
  motifExoneration,
}: RecapitulatifCardProps) {
  const montantHTApresRemise = montantHT - remiseMontant;
  const hasExoneration = exonereTva || exonereCss;

  // Calcul des montants exonérés
  const tvaExoneree = exonereTva ? Math.round(montantHTApresRemise * (tauxTva / 100)) : 0;
  const cssExoneree = exonereCss ? Math.round(montantHTApresRemise * (tauxCss / 100)) : 0;
  const totalEconomie = tvaExoneree + cssExoneree;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Récapitulatif</span>
          {hasExoneration && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
              <Shield className="h-3 w-3" />
              Exonération
            </Badge>
          )}
        </CardTitle>
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

          {/* TVA */}
          <div className={cn(
            "flex justify-between",
            exonereTva && "text-muted-foreground line-through"
          )}>
            <span className="text-muted-foreground flex items-center gap-2">
              TVA ({tauxTva}%)
              {exonereTva && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                  Exonéré
                </Badge>
              )}
            </span>
            <span>{exonereTva ? formatMontant(0) : formatMontant(tva)}</span>
          </div>

          {/* CSS */}
          <div className={cn(
            "flex justify-between",
            exonereCss && "text-muted-foreground line-through"
          )}>
            <span className="text-muted-foreground flex items-center gap-2">
              CSS ({tauxCss}%)
              {exonereCss && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                  Exonéré
                </Badge>
              )}
            </span>
            <span>{exonereCss ? formatMontant(0) : formatMontant(css)}</span>
          </div>

          {/* Économie si exonération */}
          {hasExoneration && totalEconomie > 0 && (
            <div className="flex justify-between text-green-600 bg-green-50 dark:bg-green-950/20 p-2 rounded-md">
              <span className="flex items-center gap-1">
                <Percent className="h-4 w-4" />
                Économie fiscale
              </span>
              <span className="font-medium">- {formatMontant(totalEconomie)}</span>
            </div>
          )}

          {/* Motif exonération */}
          {hasExoneration && motifExoneration && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
              <strong>Motif:</strong> {motifExoneration}
            </div>
          )}

          <div className="border-t pt-3 flex justify-between text-lg font-bold">
            <span>Total TTC</span>
            <span className="text-primary">{formatMontant(montantTTC)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}