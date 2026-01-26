import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Receipt, Ship, Calculator, Percent, Shield, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface ConfirmationSaveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
  type: "ordre" | "facture";
  montantHT: number;
  tva: number;
  css: number;
  montantTTC: number;
  remise?: number;
  exonereTva?: boolean;
  exonereCss?: boolean;
  motifExoneration?: string;
  clientName?: string;
  categorie?: string;
  // Nouvelles props pour affichage dynamique
  selectedTaxCodes?: string[];
  tauxTva?: number;
  tauxCss?: number;
}

export default function ConfirmationSaveModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  type,
  montantHT,
  tva,
  css,
  montantTTC,
  remise = 0,
  exonereTva = false,
  exonereCss = false,
  motifExoneration,
  clientName,
  categorie,
  selectedTaxCodes = [],
  tauxTva = 18,
  tauxCss = 1,
}: ConfirmationSaveModalProps) {
  const formatMontant = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + " XAF";
  };

  const Icon = type === "facture" ? Receipt : Ship;
  const title = type === "facture" ? "Confirmer la facture" : "Confirmer l'ordre de travail";
  const description = type === "facture" 
    ? "Vérifiez les informations avant d'enregistrer cette facture."
    : "Vérifiez les informations avant d'enregistrer cet ordre de travail.";

  const hasExoneration = exonereTva || exonereCss;
  
  // Déterminer quelles taxes afficher
  const showTva = selectedTaxCodes.length === 0 || selectedTaxCodes.includes('TVA');
  const showCss = selectedTaxCodes.length === 0 || selectedTaxCodes.includes('CSS');
  const hasTaxes = selectedTaxCodes.length > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Client & Catégorie */}
          {(clientName || categorie) && (
            <div className="flex flex-wrap gap-2">
              {clientName && (
                <Badge variant="secondary" className="text-sm">
                  Client: {clientName}
                </Badge>
              )}
              {categorie && (
                <Badge variant="outline" className="text-sm capitalize">
                  {categorie.replace("_", " ")}
                </Badge>
              )}
            </div>
          )}

          <Separator />

          {/* Récapitulatif financier */}
          <div className="space-y-3 bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calculator className="h-4 w-4" />
              Récapitulatif financier
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Montant HT</span>
                <span className="font-medium">{formatMontant(montantHT)}</span>
              </div>

              {remise > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Remise</span>
                  <span>- {formatMontant(remise)}</span>
                </div>
              )}

              {/* TVA - afficher seulement si sélectionnée */}
              {showTva && selectedTaxCodes.includes('TVA') && (
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    TVA ({tauxTva}%)
                    {exonereTva && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 ml-1">
                        Exonéré
                      </Badge>
                    )}
                  </span>
                  <span className={exonereTva ? "line-through text-muted-foreground" : ""}>
                    {formatMontant(exonereTva ? 0 : tva)}
                  </span>
                </div>
              )}

              {/* CSS - afficher seulement si sélectionnée */}
              {showCss && selectedTaxCodes.includes('CSS') && (
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    CSS ({tauxCss}%)
                    {exonereCss && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 ml-1">
                        Exonéré
                      </Badge>
                    )}
                  </span>
                  <span className={exonereCss ? "line-through text-muted-foreground" : ""}>
                    {formatMontant(exonereCss ? 0 : css)}
                  </span>
                </div>
              )}

              {/* Message si aucune taxe */}
              {selectedTaxCodes.length === 0 && hasTaxes === false && (
                <div className="text-sm text-muted-foreground italic py-1">
                  Aucune taxe appliquée
                </div>
              )}

              <Separator className="my-2" />

              <div className="flex justify-between text-base font-bold">
                <span>Total TTC</span>
                <span className="text-primary">{formatMontant(montantTTC)}</span>
              </div>
            </div>
          </div>

          {/* Motif d'exonération */}
          {hasExoneration && motifExoneration && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800"
            >
              <Shield className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <span className="font-medium text-amber-700 dark:text-amber-400">
                  Motif d'exonération:
                </span>
                <p className="text-amber-600 dark:text-amber-500 mt-0.5">
                  {motifExoneration}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Confirmer et enregistrer"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}