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
import { banques } from "@/data/mockData";
import { toast } from "sonner";

interface NouveauCreditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NouveauCreditModal({ open, onOpenChange }: NouveauCreditModalProps) {
  const [formData, setFormData] = useState({
    banqueId: "",
    montantEmprunte: "",
    tauxInteret: "",
    dureeEnMois: "",
    dateDebut: "",
    objet: "",
    notes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.banqueId || !formData.montantEmprunte || !formData.tauxInteret || !formData.dureeEnMois || !formData.dateDebut || !formData.objet) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const montant = parseFloat(formData.montantEmprunte);
    const taux = parseFloat(formData.tauxInteret);
    const duree = parseInt(formData.dureeEnMois);

    // Calcul de la mensualité (formule d'annuité constante)
    const tauxMensuel = taux / 100 / 12;
    const mensualite = montant * (tauxMensuel * Math.pow(1 + tauxMensuel, duree)) / (Math.pow(1 + tauxMensuel, duree) - 1);
    const totalInterets = (mensualite * duree) - montant;

    toast.success(`Crédit de ${montant.toLocaleString('fr-FR')} FCFA créé avec succès. Mensualité: ${Math.round(mensualite).toLocaleString('fr-FR')} FCFA`);
    
    setFormData({
      banqueId: "",
      montantEmprunte: "",
      tauxInteret: "",
      dureeEnMois: "",
      dateDebut: "",
      objet: "",
      notes: ""
    });
    onOpenChange(false);
  };

  const calculerMensualite = () => {
    if (formData.montantEmprunte && formData.tauxInteret && formData.dureeEnMois) {
      const montant = parseFloat(formData.montantEmprunte);
      const taux = parseFloat(formData.tauxInteret);
      const duree = parseInt(formData.dureeEnMois);

      const tauxMensuel = taux / 100 / 12;
      const mensualite = montant * (tauxMensuel * Math.pow(1 + tauxMensuel, duree)) / (Math.pow(1 + tauxMensuel, duree) - 1);
      const totalInterets = (mensualite * duree) - montant;

      return { mensualite: Math.round(mensualite), totalInterets: Math.round(totalInterets) };
    }
    return null;
  };

  const simulation = calculerMensualite();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau crédit bancaire</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="banque">Banque *</Label>
            <Select value={formData.banqueId} onValueChange={(value) => setFormData({...formData, banqueId: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une banque" />
              </SelectTrigger>
              <SelectContent>
                {banques.filter(b => b.actif).map(banque => (
                  <SelectItem key={banque.id} value={banque.id}>{banque.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="montant">Montant emprunté (FCFA) *</Label>
              <Input
                id="montant"
                type="number"
                value={formData.montantEmprunte}
                onChange={(e) => setFormData({...formData, montantEmprunte: e.target.value})}
                placeholder="50 000 000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taux">Taux d'intérêt (% annuel) *</Label>
              <Input
                id="taux"
                type="number"
                step="0.1"
                value={formData.tauxInteret}
                onChange={(e) => setFormData({...formData, tauxInteret: e.target.value})}
                placeholder="8.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duree">Durée (mois) *</Label>
              <Input
                id="duree"
                type="number"
                value={formData.dureeEnMois}
                onChange={(e) => setFormData({...formData, dureeEnMois: e.target.value})}
                placeholder="36"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateDebut">Date de début *</Label>
              <Input
                id="dateDebut"
                type="date"
                value={formData.dateDebut}
                onChange={(e) => setFormData({...formData, dateDebut: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="objet">Objet du crédit *</Label>
            <Input
              id="objet"
              value={formData.objet}
              onChange={(e) => setFormData({...formData, objet: e.target.value})}
              placeholder="Acquisition de matériel"
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

          {simulation && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Simulation</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Mensualité estimée:</span>
                  <p className="font-semibold text-primary">{simulation.mensualite.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total des intérêts:</span>
                  <p className="font-semibold text-orange-600">{simulation.totalInterets.toLocaleString('fr-FR')} FCFA</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Créer le crédit</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
