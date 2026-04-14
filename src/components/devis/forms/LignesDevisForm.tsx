import { FileText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface LigneDevis {
  id: string;
  designation: string;
  unite: string;
  quantite: number;
  prix_unitaire: number;
  montant: number;
}

interface LignesDevisFormProps {
  lignes: LigneDevis[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: keyof LigneDevis, value: string | number) => void;
}

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(montant)) + ' XAF';
};

export default function LignesDevisForm({
  lignes,
  onAdd,
  onRemove,
  onChange,
}: LignesDevisFormProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Lignes du devis
          </CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter ligne
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {lignes.map((ligne) => (
            <div
              key={ligne.id}
              className="p-4 border rounded-lg bg-muted/30 space-y-4"
            >
              {/* Désignation - pleine largeur */}
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-2">
                  <Label>Désignation *</Label>
                  <Input
                    placeholder="Description de la prestation"
                    value={ligne.designation}
                    onChange={(e) => onChange(ligne.id, "designation", e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="pt-7">
                  {lignes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(ligne.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {/* Quantité, Prix, Montant */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Quantité</Label>
                  <Input
                    type="number"
                    min="1"
                    value={ligne.quantite}
                    onChange={(e) => onChange(ligne.id, "quantite", parseInt(e.target.value) || 1)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prix unitaire</Label>
                  <Input
                    type="number"
                    min="0"
                    value={ligne.prix_unitaire}
                    onChange={(e) => onChange(ligne.id, "prix_unitaire", parseFloat(e.target.value) || 0)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Montant</Label>
                  <div className="h-11 flex items-center font-medium">
                    {formatMontant(ligne.montant)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
