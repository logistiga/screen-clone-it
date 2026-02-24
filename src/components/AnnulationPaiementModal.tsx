import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Loader2, Wallet, Calendar, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { paiementsApi } from "@/lib/api/commercial";
import { useDeletePaiement } from "@/hooks/use-commercial";
import { formatMontant, formatDate } from "@/data/mockData";

interface AnnulationPaiementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: "ordre" | "facture";
  documentId: string;
  documentNumero: string;
  onSuccess?: () => void;
}

export function AnnulationPaiementModal({
  open,
  onOpenChange,
  documentType,
  documentId,
  documentNumero,
  onSuccess,
}: AnnulationPaiementModalProps) {
  const [confirmPaiement, setConfirmPaiement] = useState<any>(null);
  const deletePaiement = useDeletePaiement();

  const { data: paiementsData, isLoading } = useQuery({
    queryKey: ["paiements", documentType, documentId],
    queryFn: () =>
      paiementsApi.getAll({
        [`${documentType === "ordre" ? "ordre_id" : "facture_id"}`]: documentId,
        per_page: 100,
      }),
    enabled: open,
  });

  const paiements = paiementsData?.data || [];

  const handleConfirmDelete = async () => {
    if (!confirmPaiement) return;
    try {
      await deletePaiement.mutateAsync(String(confirmPaiement.id));
      setConfirmPaiement(null);
      onSuccess?.();
      if (paiements.length <= 1) {
        onOpenChange(false);
      }
    } catch {
      // error handled by hook
    }
  };

  const getModePaiementLabel = (mode: string) => {
    const labels: Record<string, string> = {
      especes: "Espèces",
      cheque: "Chèque",
      virement: "Virement",
      carte: "Carte bancaire",
      mobile_money: "Mobile Money",
    };
    return labels[mode] || mode;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-destructive" />
              Annuler un paiement
            </DialogTitle>
            <DialogDescription>
              Paiements enregistrés pour {documentNumero}. L'annulation réduira automatiquement la caisse.
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : paiements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun paiement trouvé pour ce document.
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {paiements.map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="font-medium text-base">
                      {formatMontant(p.montant)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(p.date)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        <CreditCard className="h-3 w-3 mr-1" />
                        {getModePaiementLabel(p.mode_paiement)}
                      </Badge>
                    </div>
                    {p.reference && (
                      <div className="text-xs text-muted-foreground">
                        Réf: {p.reference}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => setConfirmPaiement(p)}
                    disabled={deletePaiement.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmPaiement} onOpenChange={() => setConfirmPaiement(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'annulation du paiement</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous annuler le paiement de{" "}
              <strong>{confirmPaiement && formatMontant(confirmPaiement.montant)}</strong>{" "}
              du {confirmPaiement && formatDate(confirmPaiement.date)} ?
              <br />
              <br />
              Cette action va :
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Réduire le montant payé sur {documentNumero}</li>
                <li>Créer une sortie de caisse correspondante</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePaiement.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletePaiement.isPending}
            >
              {deletePaiement.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirmer l'annulation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
