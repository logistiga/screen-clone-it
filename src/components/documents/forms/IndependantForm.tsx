import { useState, useEffect } from "react";
import { Plus, Trash2, Truck, Forklift, Warehouse, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TypeOperationIndep,
  LignePrestation,
  typesOperationIndep,
  getInitialPrestation,
  calculateTotalPrestations,
  calculateDaysBetween,
  formatMontant,
  IndependantFormData,
} from "@/types/commercial";

interface IndependantFormProps {
  onDataChange: (data: IndependantFormData) => void;
  initialData?: Partial<IndependantFormData>;
}

export default function IndependantForm({ onDataChange, initialData }: IndependantFormProps) {
  const [typeOperationIndep, setTypeOperationIndep] = useState<TypeOperationIndep | "">(
    initialData?.typeOperationIndep || ""
  );
  const [prestations, setPrestations] = useState<LignePrestation[]>(
    initialData?.prestations || [getInitialPrestation()]
  );

  const updateParent = (newPrestations: LignePrestation[]) => {
    const montantHT = calculateTotalPrestations(newPrestations);
    onDataChange({
      typeOperationIndep,
      prestations: newPrestations,
      montantHT,
    });
  };

  useEffect(() => {
    updateParent(prestations);
  }, [typeOperationIndep]);

  const handleAddPrestation = () => {
    const newPrestations = [...prestations, getInitialPrestation()];
    setPrestations(newPrestations);
    updateParent(newPrestations);
  };

  const handleRemovePrestation = (id: string) => {
    if (prestations.length > 1) {
      const newPrestations = prestations.filter((p) => p.id !== id);
      setPrestations(newPrestations);
      updateParent(newPrestations);
    }
  };

  const handlePrestationChange = (id: string, field: keyof LignePrestation, value: string | number) => {
    const newPrestations = prestations.map((p) => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        if (field === "dateDebut" || field === "dateFin") {
          const dateDebut = field === "dateDebut" ? String(value) : updated.dateDebut || "";
          const dateFin = field === "dateFin" ? String(value) : updated.dateFin || "";
          if (dateDebut && dateFin) {
            updated.quantite = calculateDaysBetween(dateDebut, dateFin);
          }
        }
        if (field === "quantite" || field === "prixUnitaire") {
          updated.montantHT = updated.quantite * updated.prixUnitaire;
        }
        return updated;
      }
      return p;
    });
    setPrestations(newPrestations);
    updateParent(newPrestations);
  };

  const montantHT = calculateTotalPrestations(prestations);

  // Champs spécifiques selon le type d'opération
  const renderPrestationFields = (prestation: LignePrestation) => {
    const needsLocation = typeOperationIndep === "transport";
    const needsDates = typeOperationIndep === "location" || typeOperationIndep === "stockage";

    return (
      <>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input
            placeholder="Description de la prestation"
            value={prestation.description}
            onChange={(e) => handlePrestationChange(prestation.id, "description", e.target.value)}
          />
        </div>

        {needsLocation && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lieu de départ</Label>
              <Input
                placeholder="Lieu de départ"
                value={prestation.lieuDepart || ""}
                onChange={(e) => handlePrestationChange(prestation.id, "lieuDepart", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Lieu d'arrivée</Label>
              <Input
                placeholder="Lieu d'arrivée"
                value={prestation.lieuArrivee || ""}
                onChange={(e) => handlePrestationChange(prestation.id, "lieuArrivee", e.target.value)}
              />
            </div>
          </div>
        )}

        {needsDates && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date début</Label>
              <Input
                type="date"
                value={prestation.dateDebut || ""}
                onChange={(e) => handlePrestationChange(prestation.id, "dateDebut", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date fin</Label>
              <Input
                type="date"
                value={prestation.dateFin || ""}
                onChange={(e) => handlePrestationChange(prestation.id, "dateFin", e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>{needsDates ? "Jours" : "Quantité"}</Label>
            <Input
              type="number"
              min="1"
              value={prestation.quantite}
              onChange={(e) => handlePrestationChange(prestation.id, "quantite", parseInt(e.target.value) || 0)}
              disabled={needsDates}
            />
          </div>
          <div className="space-y-2">
            <Label>Prix unitaire (FCFA)</Label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={prestation.prixUnitaire || ""}
              onChange={(e) => handlePrestationChange(prestation.id, "prixUnitaire", parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>Montant HT</Label>
            <Input value={formatMontant(prestation.montantHT)} disabled className="bg-muted font-medium" />
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      {/* Sélection du type d'opération */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Type d'opération indépendante</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(Object.keys(typesOperationIndep) as TypeOperationIndep[]).map((key) => {
              const op = typesOperationIndep[key];
              const isSelected = typeOperationIndep === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTypeOperationIndep(key)}
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 text-center ${
                    isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className={isSelected ? "text-primary" : "text-muted-foreground"}>{op.icon}</div>
                  <span className={`text-sm font-medium ${isSelected ? "text-primary" : ""}`}>{op.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Prestations */}
      {typeOperationIndep && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5 text-primary" />
                Prestations
              </CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleAddPrestation} className="gap-1">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {prestations.map((prestation, index) => (
                <div key={prestation.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-muted-foreground">Prestation {index + 1}</span>
                    {prestations.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePrestation(prestation.id)}
                        className="text-destructive h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {renderPrestationFields(prestation)}
                  {index < prestations.length - 1 && <div className="border-b my-4" />}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t mt-6">
              <div className="text-right">
                <span className="text-sm text-muted-foreground">Total HT: </span>
                <span className="text-xl font-bold text-primary">{formatMontant(montantHT)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
