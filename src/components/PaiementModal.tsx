import { useState, useEffect } from "react";
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
import { Wallet, Banknote, CreditCard, Building2, Smartphone } from "lucide-react";
import { useCreatePaiement, useBanques } from "@/hooks/use-commercial";

interface PaiementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: "ordre" | "facture";
  documentId: string;
  documentNumero: string;
  montantRestant: number;
  onSuccess?: () => void;
}

type ModePaiement = "Espèces" | "Chèque" | "Virement" | "Mobile Money";

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

export function PaiementModal({
  open,
  onOpenChange,
  documentType,
  documentId,
  documentNumero,
  montantRestant,
  onSuccess,
}: PaiementModalProps) {
  const [montant, setMontant] = useState<number>(montantRestant);
  const [modePaiement, setModePaiement] = useState<ModePaiement>("Espèces");
  const [banqueId, setBanqueId] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const { data: banques = [], isLoading: isLoadingBanques } = useBanques();
  const createPaiement = useCreatePaiement();

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setMontant(montantRestant);
      setModePaiement("Espèces");
      setBanqueId("");
      setReference("");
      setNotes("");
    }
  }, [open, montantRestant]);

  const handleSubmit = async () => {
    if (montant <= 0 || montant > montantRestant) {
      return;
    }

    const paiementData = {
      montant,
      mode_paiement: modePaiement,
      banque_id: (modePaiement === "Chèque" || modePaiement === "Virement") ? banqueId : undefined,
      reference: reference || undefined,
      notes: notes || undefined,
      ...(documentType === "facture" ? { facture_id: documentId } : { ordre_id: documentId }),
    };

    createPaiement.mutate(paiementData, {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.();
      },
    });
  };

  const activeBanques = banques.filter(b => b.actif);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Enregistrer un paiement
          </DialogTitle>
          <DialogDescription>
            {documentType === "facture" ? "Facture" : "Ordre"} <strong>{documentNumero}</strong>
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
              max={montantRestant}
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

          {/* Mode de paiement */}
          <div className="space-y-3">
            <Label>Mode de paiement</Label>
            <RadioGroup value={modePaiement} onValueChange={(v) => setModePaiement(v as ModePaiement)}>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="Espèces" id="especes" />
                <Label htmlFor="especes" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Banknote className="h-4 w-4 text-green-600" />
                  Espèces
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="Chèque" id="cheque" />
                <Label htmlFor="cheque" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  Chèque
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="Virement" id="virement" />
                <Label htmlFor="virement" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Building2 className="h-4 w-4 text-purple-600" />
                  Virement bancaire
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="Mobile Money" id="mobile" />
                <Label htmlFor="mobile" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Smartphone className="h-4 w-4 text-orange-600" />
                  Mobile Money
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Champs conditionnels pour banque */}
          {(modePaiement === "Chèque" || modePaiement === "Virement") && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Banque</Label>
                <Select value={banqueId} onValueChange={setBanqueId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une banque" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingBanques ? (
                      <SelectItem value="" disabled>Chargement...</SelectItem>
                    ) : (
                      activeBanques.map((banque) => (
                        <SelectItem key={banque.id} value={banque.id}>
                          {banque.nom}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">
                  {modePaiement === "Chèque" ? "Numéro de chèque" : "Référence du virement"}
                </Label>
                <Input
                  id="reference"
                  placeholder={modePaiement === "Chèque" ? "Ex: CHQ-123456" : "Ex: VIR-2026-001"}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
          )}

          {/* Référence Mobile Money */}
          {modePaiement === "Mobile Money" && (
            <div className="space-y-2">
              <Label htmlFor="reference">Référence de la transaction</Label>
              <Input
                id="reference"
                placeholder="Ex: MM-123456789"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="font-mono"
              />
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createPaiement.isPending}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createPaiement.isPending || montant <= 0 || montant > montantRestant} 
            className="gap-2"
          >
            {createPaiement.isPending ? (
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