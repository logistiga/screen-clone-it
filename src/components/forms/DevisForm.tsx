import { useState, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { LignesDocumentForm } from "./LignesDocumentForm";
import { TotauxDocument } from "./TotauxDocument";
import { clients, LigneDocument, TAUX_TVA, TAUX_CSS, configurationNumerotation } from "@/data/mockData";
import { toast } from "sonner";

interface DevisFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: any) => void;
}

export function DevisForm({ open, onOpenChange, onSubmit }: DevisFormProps) {
  const [clientId, setClientId] = useState("");
  const [dateValidite, setDateValidite] = useState("");
  const [notes, setNotes] = useState("");
  const [lignes, setLignes] = useState<LigneDocument[]>([]);

  // Calculate totals
  const montantHT = lignes.reduce((sum, l) => sum + l.montantHT, 0);
  const tva = Math.round(montantHT * TAUX_TVA);
  const css = Math.round(montantHT * TAUX_CSS);
  const montantTTC = montantHT + tva + css;

  // Generate numero
  const generateNumero = () => {
    const year = new Date().getFullYear();
    const counter = configurationNumerotation.prochainNumeroDevis.toString().padStart(4, '0');
    return `${configurationNumerotation.prefixeDevis}-${year}-${counter}`;
  };

  // Set default validite date (30 days from now)
  useEffect(() => {
    if (open) {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      setDateValidite(date.toISOString().split('T')[0]);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }
    if (lignes.length === 0) {
      toast.error("Veuillez ajouter au moins une ligne");
      return;
    }

    const data = {
      id: Date.now().toString(),
      numero: generateNumero(),
      clientId,
      dateCreation: new Date().toISOString().split('T')[0],
      dateValidite,
      lignes,
      montantHT,
      tva,
      css,
      montantTTC,
      statut: 'brouillon',
      notes
    };

    onSubmit?.(data);
    toast.success("Devis créé avec succès");
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setClientId("");
    setDateValidite("");
    setNotes("");
    setLignes([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau Devis</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateValidite">Date de validité</Label>
              <Input
                id="dateValidite"
                type="date"
                value={dateValidite}
                onChange={(e) => setDateValidite(e.target.value)}
              />
            </div>
          </div>

          <LignesDocumentForm lignes={lignes} onChange={setLignes} />

          <TotauxDocument
            montantHT={montantHT}
            tva={tva}
            css={css}
            montantTTC={montantTTC}
          />

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes ou conditions particulières..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Créer le devis</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
