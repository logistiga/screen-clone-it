import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { useBanques } from "@/hooks/use-commercial";
import { useRembourserCredit } from "@/hooks/use-credits";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, Wallet, Calendar, CreditCard } from "lucide-react";

interface RemboursementCreditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credit: {
    id: number | string;
    numero: string;
    objet?: string;
    banque?: { id?: number | string; nom: string };
  };
  echeance?: {
    id?: number | string;
    numero?: number;
    date_echeance?: string;
    montant?: number;
    montant_total?: number;
    montant_capital?: number;
    montant_interet?: number;
  } | null;
}

export function RemboursementCreditModal({ 
  open, 
  onOpenChange, 
  credit,
  echeance 
}: RemboursementCreditModalProps) {
  const { data: banques = [], isLoading: isLoadingBanques } = useBanques({ actif: true });
  const rembourserCredit = useRembourserCredit();
  
  const montantEcheance = echeance?.montant_total || echeance?.montant || 0;
  
  const [formData, setFormData] = useState({
    montant: montantEcheance > 0 ? montantEcheance.toString() : "",
    mode_paiement: "virement",
    reference: "",
    notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.montant) {
      toast.error("Veuillez saisir le montant du remboursement");
      return;
    }

    const montant = parseFloat(formData.montant);
    if (montant <= 0) {
      toast.error("Le montant doit être supérieur à 0");
      return;
    }

    try {
      const creditId = typeof credit.id === 'string' ? parseInt(credit.id) : credit.id;
      const echeanceId = echeance?.id ? (typeof echeance.id === 'string' ? parseInt(echeance.id) : echeance.id) : undefined;
      
      await rembourserCredit.mutateAsync({
        id: creditId,
        data: {
          echeance_id: echeanceId,
          montant,
          mode_paiement: formData.mode_paiement,
          reference: formData.reference || undefined,
          notes: formData.notes || undefined,
        }
      });

      toast.success(
        `Remboursement de ${montant.toLocaleString('fr-FR')} FCFA enregistré pour le crédit ${credit.numero}`
      );
      
      setFormData({
        montant: "",
        mode_paiement: "virement",
        reference: "",
        notes: ""
      });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erreur lors du remboursement");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-green-600" />
            Enregistrer un remboursement
          </DialogTitle>
          <DialogDescription>
            Paiement manuel d'une échéance de crédit
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted p-4 rounded-lg mb-4 space-y-2">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{credit.numero}</span>
          </div>
          {credit.objet && (
            <p className="text-xs text-muted-foreground">{credit.objet}</p>
          )}
          {credit.banque && (
            <p className="text-xs text-muted-foreground">Banque: {credit.banque.nom}</p>
          )}
          {echeance && echeance.date_echeance && (
            <div className="flex items-center gap-2 pt-2 border-t mt-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <span className="text-sm">
                Échéance n°{echeance.numero} - {format(new Date(echeance.date_echeance), 'dd MMMM yyyy', { locale: fr })}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="montant">Montant du remboursement (FCFA) *</Label>
            <Input
              id="montant"
              type="number"
              value={formData.montant}
              onChange={(e) => setFormData({...formData, montant: e.target.value})}
              placeholder={montantEcheance > 0 ? montantEcheance.toString() : "0"}
            />
            {echeance && montantEcheance > 0 && (
              <p className="text-xs text-muted-foreground">
                Montant attendu: {montantEcheance.toLocaleString('fr-FR')} FCFA
                {echeance.montant_capital && echeance.montant_interet && (
                  <> (Capital: {echeance.montant_capital.toLocaleString('fr-FR')} + Intérêts: {echeance.montant_interet.toLocaleString('fr-FR')})</>
                )}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mode_paiement">Mode de paiement *</Label>
            <Select value={formData.mode_paiement} onValueChange={(value) => setFormData({...formData, mode_paiement: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="virement">Virement bancaire</SelectItem>
                <SelectItem value="cheque">Chèque</SelectItem>
                <SelectItem value="prelevement">Prélèvement automatique</SelectItem>
                <SelectItem value="especes">Espèces</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Référence du paiement</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => setFormData({...formData, reference: e.target.value})}
              placeholder="VIR-CRED-2026-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Notes additionnelles..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={rembourserCredit.isPending} className="bg-green-600 hover:bg-green-700">
              {rembourserCredit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer le paiement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
