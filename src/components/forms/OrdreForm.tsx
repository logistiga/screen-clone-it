import { useState } from "react";
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

interface OrdreFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: any) => void;
}

const typesOperation = [
  { value: 'conteneurs', label: 'Conteneurs' },
  { value: 'conventionnel', label: 'Conventionnel' },
  { value: 'location', label: 'Location véhicule' },
  { value: 'transport', label: 'Transport' },
  { value: 'manutention', label: 'Manutention' },
  { value: 'stockage', label: 'Stockage' },
];

export function OrdreForm({ open, onOpenChange, onSubmit }: OrdreFormProps) {
  const [clientId, setClientId] = useState("");
  const [typeOperation, setTypeOperation] = useState("");
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
    const counter = configurationNumerotation.prochainNumeroOrdre.toString().padStart(4, '0');
    return `${configurationNumerotation.prefixeOrdre}-${year}-${counter}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }
    if (!typeOperation) {
      toast.error("Veuillez sélectionner un type d'opération");
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
      typeOperation,
      lignes,
      montantHT,
      tva,
      css,
      montantTTC,
      montantPaye: 0,
      statut: 'en_cours',
      notes
    };

    onSubmit?.(data);
    toast.success("Ordre de travail créé avec succès");
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setClientId("");
    setTypeOperation("");
    setNotes("");
    setLignes([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvel Ordre de Travail</DialogTitle>
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
              <Label htmlFor="typeOperation">Type d'opération *</Label>
              <Select value={typeOperation} onValueChange={setTypeOperation}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {typesOperation.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              placeholder="Instructions ou remarques..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Créer l'ordre de travail</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
