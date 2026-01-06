import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { LigneDocument } from "@/data/mockData";

interface LignesDocumentFormProps {
  lignes: LigneDocument[];
  onChange: (lignes: LigneDocument[]) => void;
}

export function LignesDocumentForm({ lignes, onChange }: LignesDocumentFormProps) {
  const addLigne = () => {
    const newLigne: LigneDocument = {
      id: Date.now().toString(),
      description: "",
      quantite: 1,
      prixUnitaire: 0,
      montantHT: 0
    };
    onChange([...lignes, newLigne]);
  };

  const updateLigne = (index: number, field: keyof LigneDocument, value: string | number) => {
    const updated = [...lignes];
    updated[index] = { ...updated[index], [field]: value };
    
    // Recalculate montantHT
    if (field === 'quantite' || field === 'prixUnitaire') {
      const quantite = field === 'quantite' ? Number(value) : updated[index].quantite;
      const prixUnitaire = field === 'prixUnitaire' ? Number(value) : updated[index].prixUnitaire;
      updated[index].montantHT = quantite * prixUnitaire;
    }
    
    onChange(updated);
  };

  const removeLigne = (index: number) => {
    onChange(lignes.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Lignes du document</Label>
        <Button type="button" variant="outline" size="sm" onClick={addLigne} className="gap-1">
          <Plus className="h-4 w-4" />
          Ajouter une ligne
        </Button>
      </div>

      {lignes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucune ligne. Cliquez sur "Ajouter une ligne" pour commencer.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
            <div className="col-span-5">Description</div>
            <div className="col-span-2">Quantité</div>
            <div className="col-span-2">Prix unitaire</div>
            <div className="col-span-2">Montant HT</div>
            <div className="col-span-1"></div>
          </div>
          
          {lignes.map((ligne, index) => (
            <div key={ligne.id} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5">
                <Input
                  value={ligne.description}
                  onChange={(e) => updateLigne(index, 'description', e.target.value)}
                  placeholder="Description du service..."
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  min="1"
                  value={ligne.quantite}
                  onChange={(e) => updateLigne(index, 'quantite', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  min="0"
                  value={ligne.prixUnitaire}
                  onChange={(e) => updateLigne(index, 'prixUnitaire', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="text"
                  value={ligne.montantHT.toLocaleString('fr-FR')}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLigne(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
