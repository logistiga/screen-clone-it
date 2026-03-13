import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { XCircle, Loader2 } from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { toast } from "sonner";
import api from "@/lib/api";
import { PrimeEnAttente } from "./types";

interface RefusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prime: PrimeEnAttente | null;
}

export function RefusModal({ open, onOpenChange, prime }: RefusModalProps) {
  const queryClient = useQueryClient();
  const [motif, setMotif] = useState("");

  const mutation = useMutation({
    mutationFn: async ({ primeId, source }: { primeId: string; source: string }) => {
      const endpoint = source === 'CNV'
        ? `/caisse-cnv/${primeId}/refuser`
        : `/caisse-en-attente/${primeId}/refuser`;
      const response = await api.post(endpoint, { motif });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Prime refusée avec succès");
      queryClient.invalidateQueries({ queryKey: ['caisse-en-attente'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-cnv'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-en-attente-stats'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-cnv-stats'] });
      onOpenChange(false);
      setMotif("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erreur lors du refus");
    },
  });

  const handleConfirm = () => {
    if (!prime) return;
    mutation.mutate({ primeId: prime.id, source: prime.source });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Refuser le décaissement
          </DialogTitle>
          <DialogDescription>
            Cette prime sera ignorée et ne s'affichera plus dans la liste des primes à décaisser.
          </DialogDescription>
        </DialogHeader>

        {prime && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Source:</span>
                <Badge variant="secondary">
                  {prime.source === 'OPS' ? 'Conteneurs (OPS)' : 'Conventionnel (CNV)'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Montant:</span>
                <span className="font-semibold text-lg">{formatMontant(prime.montant)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Bénéficiaire:</span>
                <span className="font-medium">{prime.beneficiaire || '-'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Motif du refus (optionnel)</Label>
              <Textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Raison du refus..."
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={mutation.isPending}
            className="gap-2"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Confirmer le refus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
