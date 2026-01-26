import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaxeDetail {
  code: string;
  label: string;
  taux: number;
  montant: number;
  exonere?: boolean;
}

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
  // Nouvelles props pour affichage dynamique
  selectedTaxCodes?: string[];
  taxesDetails?: TaxeDetail[];
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
  selectedTaxCodes = [],
  taxesDetails = [],
}: RecapitulatifCardProps) {
  const montantHTApresRemise = montantHT - remiseMontant;
  const hasExoneration = exonereTva || exonereCss;

  // Déterminer quelles taxes afficher
  const showTva = selectedTaxCodes.length === 0 || selectedTaxCodes.includes('TVA');
  const showCss = selectedTaxCodes.length === 0 || selectedTaxCodes.includes('CSS');
  
  // Si selectedTaxCodes est fourni et vide, aucune taxe n'est sélectionnée
  const noTaxesSelected = selectedTaxCodes.length === 0 && taxesDetails.length === 0;

  // Calcul des montants exonérés
  const tvaExoneree = exonereTva ? Math.round(montantHTApresRemise * (tauxTva / 100)) : 0;
  const cssExoneree = exonereCss ? Math.round(montantHTApresRemise * (tauxCss / 100)) : 0;
  const totalEconomie = tvaExoneree + cssExoneree;

  // Si on a des détails de taxes, les utiliser
  const useDynamicTaxes = taxesDetails.length > 0 || selectedTaxCodes.length > 0;

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

          {/* Affichage dynamique des taxes basé sur taxesDetails */}
          {taxesDetails.length > 0 ? (
            taxesDetails.map((taxe) => (
              <div 
                key={taxe.code}
                className={cn(
                  "flex justify-between",
                  taxe.exonere && "text-muted-foreground line-through"
                )}
              >
                <span className="text-muted-foreground flex items-center gap-2">
                  {taxe.label} ({taxe.taux}%)
                  {taxe.exonere && (
                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                      Exonéré
                    </Badge>
                  )}
                </span>
                <span>{taxe.exonere ? formatMontant(0) : formatMontant(taxe.montant)}</span>
              </div>
            ))
          ) : (
            <>
              {/* Affichage classique basé sur selectedTaxCodes */}
              {/* TVA - n'afficher que si sélectionnée ou si mode legacy */}
              {(showTva && (tva > 0 || !useDynamicTaxes)) && selectedTaxCodes.includes('TVA') && (
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
              )}

              {/* CSS - n'afficher que si sélectionnée ou si mode legacy */}
              {(showCss && (css > 0 || !useDynamicTaxes)) && selectedTaxCodes.includes('CSS') && (
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
              )}

              {/* Message si aucune taxe sélectionnée */}
              {selectedTaxCodes.length === 0 && useDynamicTaxes && (
                <div className="py-2 text-sm text-muted-foreground italic bg-muted/50 rounded-md px-3">
                  Aucune taxe appliquée (document hors taxes)
                </div>
              )}
            </>
          )}

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