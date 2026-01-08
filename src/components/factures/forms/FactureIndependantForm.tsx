import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TypeOperationIndep,
  LignePrestationEtendue,
  getOperationsIndepLabels,
  getInitialPrestationEtendue,
  calculateDaysBetween,
} from "@/types/documents";
import OperationsIndependantesForm from "@/components/operations/OperationsIndependantesForm";

interface FactureIndependantFormProps {
  onDataChange: (data: FactureIndependantData) => void;
}

export interface FactureIndependantData {
  typeOperationIndep: TypeOperationIndep | "";
  prestations: LignePrestationEtendue[];
  montantHT: number;
}

export default function FactureIndependantForm({
  onDataChange,
}: FactureIndependantFormProps) {
  const [typeOperationIndep, setTypeOperationIndep] = useState<TypeOperationIndep | "">("");
  const [prestations, setPrestations] = useState<LignePrestationEtendue[]>([getInitialPrestationEtendue()]);
  
  const operationsIndepLabels = getOperationsIndepLabels();

  const calculateTotalPrestations = (items: LignePrestationEtendue[]): number => {
    return items.reduce((sum, p) => sum + p.montantHT, 0);
  };

  const updateParent = (newPrestations: LignePrestationEtendue[]) => {
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
    const newPrestations = [...prestations, { ...getInitialPrestationEtendue(), id: String(Date.now()) }];
    setPrestations(newPrestations);
    updateParent(newPrestations);
  };

  const handleRemovePrestation = (id: string) => {
    if (prestations.length > 1) {
      const newPrestations = prestations.filter(p => p.id !== id);
      setPrestations(newPrestations);
      updateParent(newPrestations);
    }
  };

  const handlePrestationChange = (id: string, field: keyof LignePrestationEtendue, value: string | number) => {
    const newPrestations = prestations.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        if (field === 'dateDebut' || field === 'dateFin') {
          const dateDebut = field === 'dateDebut' ? String(value) : updated.dateDebut || '';
          const dateFin = field === 'dateFin' ? String(value) : updated.dateFin || '';
          if (dateDebut && dateFin) {
            updated.quantite = calculateDaysBetween(dateDebut, dateFin);
          }
        }
        if (field === 'quantite' || field === 'prixUnitaire') {
          updated.montantHT = updated.quantite * updated.prixUnitaire;
        }
        return updated;
      }
      return p;
    });
    setPrestations(newPrestations);
    updateParent(newPrestations);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Type d'opération indépendante</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(Object.keys(operationsIndepLabels) as TypeOperationIndep[]).map((key) => {
              const op = operationsIndepLabels[key];
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

      {typeOperationIndep && (
        <OperationsIndependantesForm
          typeOperationIndep={typeOperationIndep}
          prestations={prestations}
          onAddPrestation={handleAddPrestation}
          onRemovePrestation={handleRemovePrestation}
          onPrestationChange={handlePrestationChange}
        />
      )}
    </>
  );
}
