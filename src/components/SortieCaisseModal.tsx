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
import { ArrowUpCircle, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { banques, formatMontant } from "@/data/mockData";

interface SortieCaisseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "caisse" | "banque";
  banqueId?: string;
  onSuccess?: () => void;
}

export function SortieCaisseModal({
  open,
  onOpenChange,
  type,
  banqueId: initialBanqueId,
  onSuccess,
}: SortieCaisseModalProps) {
  const { toast } = useToast();
  const [montant, setMontant] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [banqueId, setBanqueId] = useState(initialBanqueId || "");
  const [reference, setReference] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (montant <= 0) {
      toast({
        title: "Erreur",
        description: "Le montant doit être supérieur à 0.",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une description.",
        variant: "destructive",
      });
      return;
    }

    if (type === "banque" && !banqueId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une banque.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const sortieData = {
      type: "sortie",
      source: type,
      montant,
      description,
      banqueId: type === "banque" ? banqueId : null,
      reference: reference || null,
      date: new Date().toISOString(),
    };

    console.log("Sortie enregistrée:", sortieData);

    const banque = type === "banque" ? banques.find((b) => b.id === banqueId) : null;

    toast({
      title: "Sortie enregistrée",
      description: `Sortie de ${formatMontant(montant)} ${type === "banque" ? `(${banque?.nom})` : "(Caisse)"} enregistrée.`,
    });

    setIsSaving(false);
    setMontant(0);
    setDescription("");
    setReference("");
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ArrowUpCircle className="h-5 w-5" />
            Sortie {type === "caisse" ? "de caisse" : "bancaire"}
          </DialogTitle>
          <DialogDescription>
            Enregistrer une sortie {type === "caisse" ? "d'espèces" : "bancaire"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Sélection banque si type banque */}
          {type === "banque" && (
            <div className="space-y-2">
              <Label>Compte bancaire</Label>
              <Select value={banqueId} onValueChange={setBanqueId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un compte" />
                </SelectTrigger>
                <SelectContent>
                  {banques.filter((b) => b.actif).map((banque) => (
                    <SelectItem key={banque.id} value={banque.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {banque.nom} - {formatMontant(banque.solde)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="montant">Montant (FCFA)</Label>
            <Input
              id="montant"
              type="number"
              value={montant || ""}
              onChange={(e) => setMontant(parseFloat(e.target.value) || 0)}
              className="text-right text-lg font-semibold"
              placeholder="0"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Ex: Achat fournitures bureau, Paiement fournisseur..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Référence (optionnel pour banque) */}
          {type === "banque" && (
            <div className="space-y-2">
              <Label htmlFor="reference">Référence (optionnel)</Label>
              <Input
                id="reference"
                placeholder="Ex: VIR-OUT-001, CHQ-789..."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="font-mono"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="gap-2 bg-destructive hover:bg-destructive/90"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <ArrowUpCircle className="h-4 w-4" />
                Enregistrer la sortie
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
