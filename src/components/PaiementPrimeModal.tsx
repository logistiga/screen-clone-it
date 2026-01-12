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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatMontant } from "@/data/mockData";

// Type générique pour les primes - supporte les deux formats
interface PrimeGeneric {
  id: string | number;
  montant: number;
  statut?: string;
  [key: string]: any;
}

interface PaiementPrimeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partenaireNom: string;
  partenaireType: "transitaire" | "representant";
  primes: PrimeGeneric[];
  total: number;
}

export function PaiementPrimeModal({ 
  open, 
  onOpenChange, 
  partenaireNom,
  partenaireType,
  primes,
  total 
}: PaiementPrimeModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    modePaiement: "",
    reference: "",
    notes: "",
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.modePaiement) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un mode de paiement",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Paiement effectué",
      description: `Paiement de ${formatMontant(total)} effectué pour ${partenaireNom}.`,
    });
    
    setFormData({ modePaiement: "", reference: "", notes: "", date: new Date().toISOString().split('T')[0] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Paiement de primes</DialogTitle>
          <DialogDescription>
            Paiement pour {partenaireNom} ({partenaireType === "transitaire" ? "Transitaire" : "Représentant"})
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Récapitulatif */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {primes.length} prime(s) sélectionnée(s)
                </span>
                <span className="text-xl font-bold text-primary">
                  {formatMontant(total)}
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">Date du paiement</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="modePaiement">Mode de paiement *</Label>
              <Select
                value={formData.modePaiement}
                onValueChange={(value) => setFormData({ ...formData, modePaiement: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="especes">Espèces</SelectItem>
                  <SelectItem value="virement">Virement bancaire</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reference">
                {formData.modePaiement === "cheque" ? "Numéro de chèque" : "Référence"}
              </Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder={formData.modePaiement === "cheque" ? "CHQ-XXXXXX" : "Référence optionnelle"}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes additionnelles..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Confirmer le paiement</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
