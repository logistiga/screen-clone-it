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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAnnulerOrdre } from "@/hooks/use-annulations";
import { Ban, Loader2 } from "lucide-react";

interface AnnulationOrdreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ordreId: number | null;
  ordreNumero: string;
}

export function AnnulationOrdreModal({
  open,
  onOpenChange,
  ordreId,
  ordreNumero,
}: AnnulationOrdreModalProps) {
  const [motif, setMotif] = useState("");
  const annulerOrdre = useAnnulerOrdre();

  const handleSubmit = () => {
    if (!ordreId || !motif.trim()) return;

    annulerOrdre.mutate(
      { ordreId, data: { motif: motif.trim() } },
      {
        onSuccess: () => {
          setMotif("");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <Ban className="h-5 w-5" />
            Annuler l'ordre de travail
          </DialogTitle>
          <DialogDescription>
            Vous allez annuler l'ordre <strong>{ordreNumero}</strong>. 
            Cette action créera un enregistrement d'annulation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="motif">Motif de l'annulation *</Label>
            <Textarea
              id="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Expliquez pourquoi cet ordre est annulé..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={annulerOrdre.isPending || !motif.trim()}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {annulerOrdre.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Annulation...
              </>
            ) : (
              "Confirmer l'annulation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
