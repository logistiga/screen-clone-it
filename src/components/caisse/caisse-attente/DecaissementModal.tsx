import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Wallet, Coins, Loader2 } from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { toast } from "sonner";
import api from "@/lib/api";
import { PrimeEnAttente } from "./types";

interface DecaissementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prime: PrimeEnAttente | null;
}

export function DecaissementModal({ open, onOpenChange, prime }: DecaissementModalProps) {
  const queryClient = useQueryClient();
  const [modePaiement, setModePaiement] = useState("Espèces");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: async ({ primeId, source }: { primeId: string; source: string }) => {
      const endpointMap: Record<string, string> = {
        CNV: `/caisse-cnv/${primeId}/decaisser`,
        HORSLBV: `/caisse-horslbv/${primeId}/decaisser`,
        GARAGE: `/caisse-garage/${primeId}/decaisser`,
        OPS: `/caisse-en-attente/${primeId}/decaisser`,
      };
      const endpoint = endpointMap[source] || endpointMap.OPS;
      const response = await api.post(endpoint, {
        mode_paiement: modePaiement, reference, notes, source,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Décaissement validé avec succès");
      queryClient.invalidateQueries({ queryKey: ['caisse-en-attente'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-cnv'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-horslbv'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-garage'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-en-attente-stats'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-cnv-stats'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-horslbv-stats'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-garage-stats'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-mouvements'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-solde'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erreur lors du décaissement");
    },
  });

  const resetForm = () => {
    setModePaiement("Espèces");
    setReference("");
    setNotes("");
  };

  const handleConfirm = () => {
    if (!prime) return;
    mutation.mutate({ primeId: prime.id, source: prime.source });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Valider le décaissement
          </DialogTitle>
          <DialogDescription>
            Cette action va créer une sortie de caisse pour cette prime.
          </DialogDescription>
        </DialogHeader>

        {prime && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Source:</span>
                <Badge variant="secondary">
                  {prime.source === 'OPS' ? 'Conteneurs (OPS)' : prime.source === 'CNV' ? 'Conventionnel (CNV)' : 'Hors Libreville'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Montant:</span>
                <span className="font-semibold text-lg">{formatMontant(prime.montant)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Type:</span>
                <span className="capitalize">{prime.type || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Bénéficiaire:</span>
                <span className="font-medium">{prime.beneficiaire || '-'}</span>
              </div>
              {prime.camion_plaque && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Camion:</span>
                  <span>{prime.camion_plaque}</span>
                </div>
              )}
              {prime.parc && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Parc:</span>
                  <span>{prime.parc}</span>
                </div>
              )}
              {prime.prestataire_nom && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Prestataire:</span>
                  <span>{prime.prestataire_nom}</span>
                </div>
              )}
              {(prime.responsable_nom || prime.responsable) && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Responsable:</span>
                  <span>{prime.responsable_nom || prime.responsable}</span>
                </div>
              )}
              {prime.numero_paiement && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">N° Paiement:</span>
                  <span className="font-medium font-mono">{prime.numero_paiement}</span>
                </div>
              )}
              {prime.reference_paiement && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Réf. Paiement:</span>
                  <span>{prime.reference_paiement}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Mode de paiement</Label>
              <Select value={modePaiement} onValueChange={setModePaiement}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Espèces">Espèces</SelectItem>
                  <SelectItem value="Virement">Virement</SelectItem>
                  <SelectItem value="Chèque">Chèque</SelectItem>
                  <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Référence (optionnel)</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="N° chèque, référence virement..."
              />
            </div>

            <div className="space-y-2">
              <Label>Notes (optionnel)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes supplémentaires..."
                rows={2}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={mutation.isPending}
            className="gap-2"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Coins className="h-4 w-4" />
            )}
            Confirmer le décaissement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
