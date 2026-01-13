import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TypeOperationIndep,
  LignePrestationEtendue,
  getOperationsIndepLabels,
  getInitialPrestationEtendue,
  calculateDaysBetween,
} from "@/types/documents";
import OperationsIndependantesForm from "@/components/operations/OperationsIndependantesForm";
import { FormError } from "@/components/ui/form-error";

interface FactureIndependantFormProps {
  onDataChange: (data: FactureIndependantData) => void;
  initialData?: FactureIndependantData | null;
}

export interface FactureIndependantData {
  typeOperationIndep: TypeOperationIndep | "";
  prestations: LignePrestationEtendue[];
  montantHT: number;
}

export default function FactureIndependantForm({
  onDataChange,
  initialData,
}: FactureIndependantFormProps) {
  const lastInitKey = useRef<string>("");
  const [typeOperationIndep, setTypeOperationIndep] = useState<TypeOperationIndep | "">("");
  const [prestations, setPrestations] = useState<LignePrestationEtendue[]>([getInitialPrestationEtendue()]);
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Synchroniser l'état interne avec initialData (sans écraser les edits si rien n'a changé)
  useEffect(() => {
    if (!initialData) return;

    const initKey = JSON.stringify({
      typeOperationIndep: initialData.typeOperationIndep ?? "",
      prestations: (initialData.prestations ?? []).map((p) => ({
        id: p.id,
        description: p.description,
        lieuDepart: p.lieuDepart,
        lieuArrivee: p.lieuArrivee,
        dateDebut: p.dateDebut,
        dateFin: p.dateFin,
        quantite: p.quantite,
        prixUnitaire: p.prixUnitaire,
      })),
    });

    if (initKey === lastInitKey.current) return;

    if (initialData.typeOperationIndep) {
      setTypeOperationIndep(initialData.typeOperationIndep);
    }

    if (initialData.prestations && initialData.prestations.length > 0) {
      setPrestations(initialData.prestations);
    }

    lastInitKey.current = initKey;
  }, [initialData]);

  const operationsIndepLabels = getOperationsIndepLabels();

  const calculateTotalPrestations = (items: LignePrestationEtendue[]): number => {
    return items.reduce((sum, p) => sum + (p.montantHT || 0), 0);
  };

  const updateParent = (items: LignePrestationEtendue[]) => {
    const montantHT = calculateTotalPrestations(items);
    onDataChange({
      typeOperationIndep,
      prestations: items,
      montantHT,
    });
  };

  // Toujours pousser vers le parent quand le type ou les lignes changent
  useEffect(() => {
    updateParent(prestations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeOperationIndep, prestations]);

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
            updated.montantHT = updated.quantite * updated.prixUnitaire;
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

  const handleBlur = (fieldName: string, value: unknown) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    // Simple validation for description
    if (fieldName.includes("description") && (!value || String(value).trim() === "")) {
      setErrors((prev) => ({ ...prev, [fieldName]: "La description est obligatoire" }));
    } else {
      setErrors((prev) => {
        const { [fieldName]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleTypeSelect = (key: TypeOperationIndep) => {
    setTypeOperationIndep(key);
    setTouched((prev) => ({ ...prev, typeOperationIndep: true }));
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Type d'opération indépendante *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(Object.keys(operationsIndepLabels) as TypeOperationIndep[]).map((key) => {
              const op = operationsIndepLabels[key];
              const isSelected = typeOperationIndep === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleTypeSelect(key)}
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
          <FormError message={touched.typeOperationIndep && !typeOperationIndep ? "Veuillez sélectionner un type d'opération" : undefined} />
        </CardContent>
      </Card>

      {typeOperationIndep && (
        <OperationsIndependantesForm
          typeOperationIndep={typeOperationIndep}
          prestations={prestations}
          onAddPrestation={handleAddPrestation}
          onRemovePrestation={handleRemovePrestation}
          onPrestationChange={handlePrestationChange}
          errors={errors}
          touched={touched}
          onBlur={(fieldName: string) => handleBlur(fieldName, "")}
        />
      )}
    </>
  );
}
