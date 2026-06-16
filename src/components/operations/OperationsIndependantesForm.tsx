import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormError } from "@/components/ui/form-error";
import { formatMontant } from "@/data/mockData";
import {
  LignePrestationEtendue,
  getOperationsIndepLabelsAll,
} from "@/types/documents";
import LigneModal from "./LigneModal";

interface Props {
  prestations: LignePrestationEtendue[];
  onAddPrestation: () => void;
  onRemovePrestation: (id: string) => void;
  onPrestationChange: (id: string, field: keyof LignePrestationEtendue, value: string | number) => void;
  onReplacePrestations?: (next: LignePrestationEtendue[]) => void;
  errors?: Record<string, string>;
  touched?: Record<string, boolean>;
  onBlur?: (fieldPath: string) => void;
}

export default function OperationsIndependantesForm({
  prestations,
  onAddPrestation,
  onRemovePrestation,
  onPrestationChange,
  onReplacePrestations,
  errors = {},
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LignePrestationEtendue | null>(null);
  const labels = getOperationsIndepLabelsAll();

  // Filtrer les lignes vides (ajoutées par défaut)
  const visible = prestations.filter((p) => p.typeOperation || p.description || p.prixUnitaire);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (p: LignePrestationEtendue) => { setEditing(p); setModalOpen(true); };

  const replace = (next: LignePrestationEtendue[]) => {
    if (onReplacePrestations) onReplacePrestations(next);
    else {
      // fallback : update champ par champ
      next.forEach((p) => {
        Object.keys(p).forEach((k) => {
          onPrestationChange(p.id, k as keyof LignePrestationEtendue, (p as any)[k]);
        });
      });
    }
  };

  const handleSubmit = (ligne: LignePrestationEtendue) => {
    const idx = prestations.findIndex((p) => p.id === ligne.id);
    let next: LignePrestationEtendue[];
    if (idx >= 0) {
      next = prestations.map((p) => (p.id === ligne.id ? ligne : p));
    } else {
      // Remplacer la première ligne vide si elle existe, sinon ajouter
      const emptyIdx = prestations.findIndex((p) => !p.typeOperation && !p.description);
      if (emptyIdx >= 0) {
        next = prestations.map((p, i) => (i === emptyIdx ? ligne : p));
      } else {
        next = [...prestations, ligne];
      }
    }
    replace(next);
  };

  const total = visible.reduce((s, p) => s + (p.montantHT || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Lignes de l'opération</CardTitle>
          <Button type="button" size="sm" onClick={openCreate} className="gap-1">
            <Plus className="h-4 w-4" /> Ajouter une ligne
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <FormError message={errors["prestations"]} />

        {visible.length === 0 ? (
          <div className="text-sm text-muted-foreground border border-dashed rounded-md p-8 text-center">
            Aucune ligne ajoutée. Cliquez sur « Ajouter une ligne » pour commencer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 px-2">Type</th>
                  <th className="py-2 px-2">Description</th>
                  <th className="py-2 px-2 text-right">Qté</th>
                  <th className="py-2 px-2 text-right">Prix U.</th>
                  <th className="py-2 px-2 text-right">Total HT</th>
                  <th className="py-2 px-2 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-2 px-2 font-medium">{labels[p.typeOperation as keyof typeof labels] || "—"}</td>
                    <td className="py-2 px-2">
                      <div className="line-clamp-2">{p.description || "—"}</div>
                      {p.typeOperation === "transport" && (
                        <div className="text-xs text-muted-foreground">{p.pointDepart} → {p.pointArrivee}</div>
                      )}
                      {(p.typeOperation === "location" || p.typeOperation === "manutention") && p.materiel && (
                        <div className="text-xs text-muted-foreground">{p.materiel}</div>
                      )}
                    </td>
                    <td className="py-2 px-2 text-right">{p.quantite}</td>
                    <td className="py-2 px-2 text-right">{formatMontant(p.prixUnitaire || 0)}</td>
                    <td className="py-2 px-2 text-right font-medium">{formatMontant(p.montantHT || 0)}</td>
                    <td className="py-2 px-2">
                      <div className="flex justify-end gap-1">
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onRemovePrestation(p.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="py-2 px-2 text-right font-medium">Total HT</td>
                  <td className="py-2 px-2 text-right font-bold">{formatMontant(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <LigneModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          initial={editing}
        />
      </CardContent>
    </Card>
  );
}
