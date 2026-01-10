import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TypeOperationIndep,
  LignePrestationEtendue,
  getOperationsIndepLabels,
  getInitialPrestationEtendue,
  calculateDaysBetween,
} from "@/types/documents";
import OperationsIndependantesForm from "@/components/operations/OperationsIndependantesForm";

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
  const hasInitialized = useRef(false);
  const [typeOperationIndep, setTypeOperationIndep] = useState<TypeOperationIndep | "">("");
  const [prestations, setPrestations] = useState<LignePrestationEtendue[]>([getInitialPrestationEtendue()]);

  // Initialisation depuis initialData - une seule fois quand les données arrivent
  useEffect(() => {
    if (initialData && !hasInitialized.current) {
      console.log("OrdreIndependantForm - Initializing with data:", JSON.stringify(initialData, null, 2));
      
      if (initialData.typeOperationIndep) {
        console.log("Setting typeOperationIndep to:", initialData.typeOperationIndep);
        setTypeOperationIndep(initialData.typeOperationIndep);
      }
      
      if (initialData.prestations && initialData.prestations.length > 0) {
        console.log("Setting prestations:", initialData.prestations.length, "items");
        setPrestations(initialData.prestations);
      }
      
      hasInitialized.current = true;
    }
  }, [initialData]);
  
  const operationsIndepLabels = getOperationsIndepLabels();

  const calculateTotalPrestations = (prestations: LignePrestationEtendue[]): number => {
    return prestations.reduce((sum, p) => sum + p.montantHT, 0);
  };

  const updateParent = (newPrestations: LignePrestationEtendue[]) => {
    const montantHT = calculateTotalPrestations(newPrestations);
    onDataChange({
      typeOperationIndep,
      prestations: newPrestations,
      montantHT,
    });
  };

  // Met à jour le parent quand le type change
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

  return (
    <div className="space-y-6">
      {/* Sélection du type d'opération */}
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Type d'opération indépendante
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
              return (
                <motion.button
                  key={key}
                  type="button"
                  onClick={() => setTypeOperationIndep(key)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-5 rounded-xl border-2 transition-all flex flex-col items-center gap-3 text-center relative overflow-hidden ${
                    isSelected 
                      ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20" 
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
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
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
