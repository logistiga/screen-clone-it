import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Ban, AlertTriangle, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatMontant } from "@/data/mockData";
import { useAnnulerFacture, useAnnulerOrdre } from "@/hooks/use-annulations";

interface AnnulationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: "ordre" | "facture";
  documentId: number;
  documentNumero: string;
  montantTTC: number;
  montantPaye: number;
  clientNom: string;
  onSuccess?: (avoirGenere: boolean) => void;
}

export function AnnulationModal({
  open,
  onOpenChange,
  documentType,
  documentId,
  documentNumero,
  montantTTC,
  montantPaye,
  clientNom,
  onSuccess,
}: AnnulationModalProps) {
  const { toast } = useToast();
  const [motif, setMotif] = useState("");
  const [genererAvoir, setGenererAvoir] = useState(montantPaye > 0);

  const annulerFactureMutation = useAnnulerFacture();
  const annulerOrdreMutation = useAnnulerOrdre();

  const isSaving = annulerFactureMutation.isPending || annulerOrdreMutation.isPending;

  const documentLabel = documentType === "ordre" ? "l'ordre" : "la facture";
  const estPaye = montantPaye > 0;

  const handleSubmit = async () => {
    if (!motif.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un motif d'annulation.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (documentType === "facture") {
        await annulerFactureMutation.mutateAsync({
          factureId: documentId,
          data: {
            motif: motif.trim(),
            generer_avoir: estPaye ? genererAvoir : false,
          },
        });
      } else {
        await annulerOrdreMutation.mutateAsync({
          ordreId: documentId,
          data: { motif: motif.trim() },
        });
      }

      if (estPaye && genererAvoir && documentType === "facture") {
        toast({
          title: "Annulation avec avoir",
          description: `La facture ${documentNumero} a été annulée et un avoir de ${formatMontant(montantPaye)} a été généré pour ${clientNom}.`,
        });
      } else {
        toast({
          title: "Annulation effectuée",
          description: `${documentType === "ordre" ? "L'ordre" : "La facture"} ${documentNumero} a été annulé(e).`,
        });
      }

      onOpenChange(false);
      setMotif("");
      onSuccess?.(estPaye && genererAvoir);
    } catch (error: any) {
      // L'erreur est déjà gérée dans le hook via onError
      console.error("Erreur annulation:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <Ban className="h-5 w-5" />
            Annuler {documentLabel}
          </DialogTitle>
          <DialogDescription>
            Vous allez annuler {documentLabel} <strong>{documentNumero}</strong> du client <strong>{clientNom}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Alerte si payé */}
          {estPaye && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Document avec paiement
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Ce document a reçu un paiement de <strong>{formatMontant(montantPaye)}</strong>.
                    Un avoir sera généré pour le client.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Résumé */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Montant total</span>
              <span className="font-medium">{formatMontant(montantTTC)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Montant payé</span>
              <span className={estPaye ? "font-medium text-green-600" : ""}>
                {formatMontant(montantPaye)}
              </span>
            </div>
            {estPaye && (
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground">Avoir à générer</span>
                <span className="font-semibold text-primary">{formatMontant(montantPaye)}</span>
              </div>
            )}
          </div>

          {/* Motif */}
          <div className="space-y-2">
            <Label htmlFor="motif">Motif de l'annulation *</Label>
            <Textarea
              id="motif"
              placeholder="Ex: Erreur de facturation, Service non effectué, Demande du client..."
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={3}
            />
          </div>

          {/* Option avoir (si payé et facture) */}
          {estPaye && documentType === "facture" && (
            <div className="flex items-start space-x-3 p-3 rounded-lg border bg-background">
              <Checkbox
                id="genererAvoir"
                checked={genererAvoir}
                onCheckedChange={(checked) => setGenererAvoir(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="genererAvoir" className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Générer un avoir pour le client
                </Label>
                <p className="text-xs text-muted-foreground">
                  L'avoir de {formatMontant(montantPaye)} sera ajouté au solde du client et pourra être utilisé pour les prochaines factures.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Non, garder
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSaving} 
            className="gap-2 bg-orange-600 hover:bg-orange-700"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Annulation...
              </>
            ) : (
              <>
                <Ban className="h-4 w-4" />
                Oui, annuler
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
