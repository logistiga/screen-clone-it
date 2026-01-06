import { useState } from "react";
import {
  Dialog,
  DialogContent,
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
import { banques, CreditBancaire, EcheanceCredit } from "@/data/mockData";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface RemboursementCreditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credit: CreditBancaire;
  echeance?: EcheanceCredit;
}

export function RemboursementCreditModal({ 
  open, 
  onOpenChange, 
  credit,
  echeance 
}: RemboursementCreditModalProps) {
  const [formData, setFormData] = useState({
    montant: echeance ? echeance.montantTotal.toString() : "",
    date: format(new Date(), 'yyyy-MM-dd'),
    banqueId: credit.banqueId,
    reference: "",
    notes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.montant || !formData.date || !formData.banqueId) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const montant = parseFloat(formData.montant);
    const banque = banques.find(b => b.id === formData.banqueId);

    toast.success(
      `Remboursement de ${montant.toLocaleString('fr-FR')} FCFA enregistré pour le crédit ${credit.numero} via ${banque?.nom}`
    );
    
    setFormData({
      montant: "",
      date: format(new Date(), 'yyyy-MM-dd'),
      banqueId: credit.banqueId,
      reference: "",
      notes: ""
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enregistrer un remboursement</DialogTitle>
        </DialogHeader>

        <div className="bg-muted p-3 rounded-lg mb-4">
          <p className="text-sm font-medium">{credit.numero}</p>
          <p className="text-xs text-muted-foreground">{credit.objet}</p>
          {echeance && (
            <p className="text-xs text-muted-foreground mt-1">
              Échéance n°{echeance.numero} - {format(new Date(echeance.dateEcheance), 'dd MMMM yyyy', { locale: fr })}
            </p>
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
              placeholder={echeance ? echeance.montantTotal.toString() : "0"}
            />
            {echeance && (
              <p className="text-xs text-muted-foreground">
                Montant attendu: {echeance.montantTotal.toLocaleString('fr-FR')} FCFA 
                (Capital: {echeance.montantCapital.toLocaleString('fr-FR')} + Intérêts: {echeance.montantInteret.toLocaleString('fr-FR')})
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date du remboursement *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="banque">Compte de débit *</Label>
            <Select value={formData.banqueId} onValueChange={(value) => setFormData({...formData, banqueId: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un compte" />
              </SelectTrigger>
              <SelectContent>
                {banques.filter(b => b.actif).map(banque => (
                  <SelectItem key={banque.id} value={banque.id}>{banque.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Référence du virement</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => setFormData({...formData, reference: e.target.value})}
              placeholder="VIR-CRED-XXX"
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
            <Button type="submit">Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
