import { FileText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DecimalInput } from "@/components/ui/decimal-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LIGNES_CONFIG } from "./config";
import type { DocumentLigne, DocumentType } from "./types";

interface LignesFormProps<T extends DocumentLigne> {
  documentType: DocumentType;
  lignes: T[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: keyof T, value: string | number) => void;
}

const formatMontant = (montant: number) =>
  new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
    Math.round(montant)
  ) + " XAF";

export default function LignesForm<T extends DocumentLigne>({
  documentType,
  lignes,
  onAdd,
  onRemove,
  onChange,
}: LignesFormProps<T>) {
  const cfg = LIGNES_CONFIG[documentType];

  const getValue = (ligne: T, field: string): string | number => {
    const v = (ligne as unknown as Record<string, unknown>)[field];
    return typeof v === "string" || typeof v === "number" ? v : "";
  };

  const renderRow = (ligne: T) => {
    const descriptionInput = (
      <Input
        placeholder="Description de la prestation"
        value={String(getValue(ligne, cfg.descriptionField) ?? "")}
        onChange={(e) => onChange(ligne.id, cfg.descriptionField as keyof T, e.target.value)}
        className={cfg.fullWidthDescription ? "h-11" : undefined}
      />
    );

    const quantiteInput = cfg.useDecimalInput ? (
      <DecimalInput
        placeholder="1"
        value={Number(getValue(ligne, "quantite")) || 0}
        onChange={(v) => onChange(ligne.id, "quantite" as keyof T, v)}
      />
    ) : (
      <Input
        type="number"
        min="1"
        value={Number(getValue(ligne, "quantite")) || 0}
        onChange={(e) => onChange(ligne.id, "quantite" as keyof T, parseInt(e.target.value) || 1)}
        className="h-11"
      />
    );

    const prixField = documentType === "devis" ? "prix_unitaire" : "prixUnitaire";
    const prixInput = cfg.useDecimalInput ? (
      <DecimalInput
        placeholder="0"
        value={Number(getValue(ligne, prixField)) || 0}
        onChange={(v) => onChange(ligne.id, prixField as keyof T, v)}
      />
    ) : (
      <Input
        type="number"
        min="0"
        value={Number(getValue(ligne, prixField)) || 0}
        onChange={(e) =>
          onChange(ligne.id, prixField as keyof T, parseFloat(e.target.value) || 0)
        }
        className="h-11"
      />
    );

    const amount = Number(getValue(ligne, cfg.amountField)) || 0;

    const removeBtn = lignes.length > 1 && (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(ligne.id)}
        className="text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    );

    if (cfg.fullWidthDescription) {
      return (
        <div key={ligne.id} className="p-4 border rounded-lg bg-muted/30 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-2">
              <Label>{cfg.descriptionLabel}</Label>
              {descriptionInput}
            </div>
            <div className="pt-7">{removeBtn}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Quantité</Label>
              {quantiteInput}
            </div>
            <div className="space-y-2">
              <Label>Prix unitaire</Label>
              {prixInput}
            </div>
            <div className="space-y-2">
              <Label>{cfg.amountLabel}</Label>
              <div className="h-11 flex items-center font-medium">{formatMontant(amount)}</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={ligne.id}
        className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-4 border rounded-lg bg-muted/30"
      >
        <div className="md:col-span-5 space-y-2">
          <Label>{cfg.descriptionLabel}</Label>
          {descriptionInput}
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label>Quantité</Label>
          {quantiteInput}
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label>Prix unitaire</Label>
          {prixInput}
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label>{cfg.amountLabel}</Label>
          <div className="h-10 flex items-center font-medium">{formatMontant(amount)}</div>
        </div>
        <div className="md:col-span-1 flex justify-end">{removeBtn}</div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            {cfg.cardTitle}
          </CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter ligne
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">{lignes.map(renderRow)}</div>
      </CardContent>
    </Card>
  );
}
