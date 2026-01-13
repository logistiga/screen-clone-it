import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormError } from "@/components/ui/form-error";
import {
  TypeOperationIndep,
  LignePrestationEtendue,
  getOperationsIndepLabels,
  getInitialPrestationEtendue,
  calculateDaysBetween,
} from "@/types/documents";
import { ordreIndependantSchema } from "@/lib/validations/ordre-schemas";
import OperationsIndependantesForm from "@/components/operations/OperationsIndependantesForm";
import { cn } from "@/lib/utils";

interface OrdreIndependantFormProps {
  onDataChange: (data: OrdreIndependantData) => void;
  initialData?: Partial<OrdreIndependantData>;
}

export interface OrdreIndependantData {
  typeOperationIndep: TypeOperationIndep | "";
  prestations: LignePrestationEtendue[];
  montantHT: number;
}

export default function OrdreIndependantForm({
  onDataChange,
  initialData,
}: OrdreIndependantFormProps) {
  const lastInitKey = useRef<string>("");
  const [typeOperationIndep, setTypeOperationIndep] = useState<TypeOperationIndep | "">("");
  const [prestations, setPrestations] = useState<LignePrestationEtendue[]>([getInitialPrestationEtendue()]);
  
  // Validation errors state
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

    console.log("OrdreIndependantForm - Sync initialData:", initialData);

    if (initialData.typeOperationIndep) {
      setTypeOperationIndep(initialData.typeOperationIndep);
    }

    if (initialData.prestations && initialData.prestations.length > 0) {
      setPrestations(initialData.prestations);
    }

    lastInitKey.current = initKey;
  }, [initialData]);

  // Validate on blur
  const validateField = useCallback((fieldPath: string) => {
    const data = {
      typeOperationIndep,
      prestations,
    };

    const result = ordreIndependantSchema.safeParse(data);
    
    if (!result.success) {
      const fieldError = result.error.errors.find(e => e.path.join('.') === fieldPath);
      if (fieldError) {
        setErrors(prev => ({ ...prev, [fieldPath]: fieldError.message }));
      } else {
        setErrors(prev => {
          const next = { ...prev };
          delete next[fieldPath];
          return next;
        });
      }
    } else {
      setErrors(prev => {
        const next = { ...prev };
        delete next[fieldPath];
        return next;
      });
    }
  }, [typeOperationIndep, prestations]);

  const handleBlur = (fieldPath: string) => {
    setTouched(prev => ({ ...prev, [fieldPath]: true }));
    validateField(fieldPath);
  };

  const getFieldError = (fieldPath: string) => {
    return touched[fieldPath] ? errors[fieldPath] : undefined;
  };

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

  const handleTypeChange = (key: TypeOperationIndep) => {
    setTypeOperationIndep(key);
    setTouched(prev => ({ ...prev, typeOperationIndep: true }));
    // Clear the error when a valid type is selected
    setErrors(prev => {
      const next = { ...prev };
      delete next['typeOperationIndep'];
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Sélection du type d'opération */}
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Type d'opération indépendante *
                {typeOperationIndep && (
                  <Badge variant="secondary" className="ml-2">
                    {operationsIndepLabels[typeOperationIndep]?.label}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                Sélectionnez le type d'opération pour cette prestation
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {(Object.keys(operationsIndepLabels) as TypeOperationIndep[]).map((key) => {
              const op = operationsIndepLabels[key];
              const isSelected = typeOperationIndep === key;
              const hasError = touched['typeOperationIndep'] && !typeOperationIndep;
              return (
                <motion.button
                  key={key}
                  type="button"
                  onClick={() => handleTypeChange(key)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "p-5 rounded-xl border-2 transition-all flex flex-col items-center gap-3 text-center relative overflow-hidden",
                    isSelected 
                      ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20" 
                      : "border-border hover:border-primary/50 hover:bg-muted/50",
                    hasError && "border-destructive"
                  )}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-3 h-3 rounded-full bg-primary"
                    />
                  )}
                  <motion.div 
                    className={`p-3 rounded-full ${isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
                    animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {op.icon}
                  </motion.div>
                  <span className={`text-sm font-semibold ${isSelected ? "text-primary" : ""}`}>
                    {op.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
          <FormError message={getFieldError('typeOperationIndep')} />
        </CardContent>
      </Card>

      {/* Formulaire des prestations */}
      <AnimatePresence mode="wait">
        {typeOperationIndep && (
          <motion.div
            key={typeOperationIndep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <OperationsIndependantesForm
              typeOperationIndep={typeOperationIndep}
              prestations={prestations}
              onAddPrestation={handleAddPrestation}
              onRemovePrestation={handleRemovePrestation}
              onPrestationChange={handlePrestationChange}
              errors={errors}
              touched={touched}
              onBlur={handleBlur}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
