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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wallet, Banknote, CreditCard, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { banques, formatMontant } from "@/data/mockData";

interface PaiementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: "ordre" | "facture";
  documentNumero: string;
  montantRestant: number;
  onSuccess?: () => void;
}

type MethodePaiement = "especes" | "cheque" | "virement";

export function PaiementModal({
  open,
  onOpenChange,
  documentType,
  documentNumero,
  montantRestant,
  onSuccess,
}: PaiementModalProps) {
  const { toast } = useToast();
  const [montant, setMontant] = useState<number>(montantRestant);
  const [methode, setMethode] = useState<MethodePaiement>("especes");
  const [banqueId, setBanqueId] = useState("");
  const [numeroCheque, setNumeroCheque] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
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

    if (montant > montantRestant) {
      toast({
        title: "Erreur",
        description: `Le montant ne peut pas dépasser ${formatMontant(montantRestant)}.`,
        variant: "destructive",
      });
      return;
    }

    if (methode === "cheque" && !numeroCheque) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir le numéro de chèque.",
        variant: "destructive",
      });
      return;
    }

    if ((methode === "cheque" || methode === "virement") && !banqueId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une banque.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    // Simulation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const paiementData = {
      documentType,
      documentNumero,
      montant,
      methode,
      banqueId: methode !== "especes" ? banqueId : null,
      numeroCheque: methode === "cheque" ? numeroCheque : null,
      reference: methode === "virement" ? reference : null,
      notes,
      date: new Date().toISOString(),
    };

    console.log("Paiement enregistré:", paiementData);

    toast({
      title: "Paiement enregistré",
      description: `Paiement de ${formatMontant(montant)} enregistré pour ${documentType === "ordre" ? "l'ordre" : "la facture"} ${documentNumero}.`,
    });

    setIsSaving(false);
    onOpenChange(false);
    onSuccess?.();
  };

  const getMethodeIcon = (m: MethodePaiement) => {
    switch (m) {
      case "especes":
        return <Banknote className="h-4 w-4" />;
      case "cheque":
        return <CreditCard className="h-4 w-4" />;
      case "virement":
        return <Building2 className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Enregistrer un paiement
          </DialogTitle>
          <DialogDescription>
            {documentType === "ordre" ? "Ordre" : "Facture"} <strong>{documentNumero}</strong>
            <br />
            Reste à payer: <strong className="text-primary">{formatMontant(montantRestant)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="montant">Montant du paiement (FCFA)</Label>
            <Input
              id="montant"
              type="number"
              value={montant || ""}
              onChange={(e) => setMontant(parseFloat(e.target.value) || 0)}
              className="text-right text-lg font-semibold"
            />
            <Button
              type="button"
              variant="link"
              size="sm"
              className="p-0 h-auto text-xs"
              onClick={() => setMontant(montantRestant)}
            >
              Payer la totalité ({formatMontant(montantRestant)})
            </Button>
          </div>

          {/* Méthode de paiement */}
          <div className="space-y-3">
            <Label>Méthode de paiement</Label>
            <RadioGroup value={methode} onValueChange={(v) => setMethode(v as MethodePaiement)}>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="especes" id="especes" />
                <Label htmlFor="especes" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Banknote className="h-4 w-4 text-green-600" />
                  Espèces
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="cheque" id="cheque" />
                <Label htmlFor="cheque" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  Chèque
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="virement" id="virement" />
                <Label htmlFor="virement" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Building2 className="h-4 w-4 text-purple-600" />
                  Virement bancaire
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Champs conditionnels pour banque */}
          {(methode === "cheque" || methode === "virement") && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Banque</Label>
                <Select value={banqueId} onValueChange={setBanqueId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une banque" />
                  </SelectTrigger>
                  <SelectContent>
                    {banques.filter(b => b.actif).map((banque) => (
                      <SelectItem key={banque.id} value={banque.id}>
                        {banque.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {methode === "cheque" && (
                <div className="space-y-2">
                  <Label htmlFor="numeroCheque">Numéro de chèque</Label>
                  <Input
                    id="numeroCheque"
                    placeholder="Ex: CHQ-123456"
                    value={numeroCheque}
                    onChange={(e) => setNumeroCheque(e.target.value)}
                    className="font-mono"
                  />
                </div>
              )}

              {methode === "virement" && (
                <div className="space-y-2">
                  <Label htmlFor="reference">Référence du virement</Label>
                  <Input
                    id="reference"
                    placeholder="Ex: VIR-2026-001"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="font-mono"
                  />
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Notes sur ce paiement..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
