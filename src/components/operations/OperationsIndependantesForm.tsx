import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormError } from "@/components/ui/form-error";
import { formatMontant } from "@/data/mockData";
import {
  TypeOperationIndep,
  LignePrestationEtendue,
  getOperationsIndepLabels,
} from "@/types/documents";
import {
  LocationFormFields,
  TransportFormFields,
  ManutentionFormFields,
  DoubleRelevageFormFields,
  StockageFormFields,
} from "./forms";
import { cn } from "@/lib/utils";

interface OperationsIndependantesFormProps {
  typeOperationIndep: TypeOperationIndep;
  prestations: LignePrestationEtendue[];
  onAddPrestation: () => void;
  onRemovePrestation: (id: string) => void;
  onPrestationChange: (id: string, field: keyof LignePrestationEtendue, value: string | number) => void;
  errors?: Record<string, string>;
  touched?: Record<string, boolean>;
  onBlur?: (fieldPath: string) => void;
}

export default function OperationsIndependantesForm({
  typeOperationIndep,
  prestations,
  onAddPrestation,
  onRemovePrestation,
  onPrestationChange,
  errors = {},
  touched = {},
  onBlur,
}: OperationsIndependantesFormProps) {
  const operationsIndepLabels = getOperationsIndepLabels();
  
  // Pour Location et Stockage : la quantité est calculée automatiquement
  const isDateBased = typeOperationIndep === 'location' || typeOperationIndep === 'stockage';

  const getFieldError = (fieldPath: string) => {
    return touched[fieldPath] ? errors[fieldPath] : undefined;
  };

  const handleBlur = (fieldPath: string) => {
    onBlur?.(fieldPath);
  };

  // Rendu des champs spécifiques selon le type d'opération
  const renderSpecificFields = (prestation: LignePrestationEtendue) => {
    switch (typeOperationIndep) {
      case 'location':
        return (
          <LocationFormFields
            prestation={prestation}
            onPrestationChange={onPrestationChange}
          />
        );
      case 'transport':
        return (
          <TransportFormFields
            prestation={prestation}
            onPrestationChange={onPrestationChange}
          />
        );
      case 'manutention':
        return (
          <ManutentionFormFields
            prestation={prestation}
            onPrestationChange={onPrestationChange}
          />
        );
      case 'double_relevage':
        return (
          <DoubleRelevageFormFields
            prestation={prestation}
            onPrestationChange={onPrestationChange}
          />
        );
      case 'stockage':
        return (
          <StockageFormFields
            prestation={prestation}
            onPrestationChange={onPrestationChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {operationsIndepLabels[typeOperationIndep].icon}
            Détail {operationsIndepLabels[typeOperationIndep].label}
          </CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={onAddPrestation} className="gap-1">
            <Plus className="h-4 w-4" />Ajouter ligne
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <FormError message={getFieldError('prestations')} />
        <div className="space-y-4">
          {prestations.map((prestation, index) => (
            <div key={prestation.id} className="p-4 border rounded-lg bg-muted/20 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Ligne {index + 1}</span>
                {prestations.length > 1 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onRemovePrestation(prestation.id)} 
                    className="text-destructive h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Champs spécifiques au type d'opération */}
              {renderSpecificFields(prestation)}

              {/* Champs communs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Input 
                    placeholder="Description..." 
                    value={prestation.description} 
                    onChange={(e) => onPrestationChange(prestation.id, 'description', e.target.value)}
                    onBlur={() => handleBlur(`prestations.${index}.description`)}
                    className={cn(getFieldError(`prestations.${index}.description`) && "border-destructive")}
                  />
                  <FormError message={getFieldError(`prestations.${index}.description`)} />
                </div>
                <div className="space-y-2">
                  <Label>{isDateBased ? 'Nombre de jours' : 'Quantité'}</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={prestation.quantite} 
                    onChange={(e) => onPrestationChange(prestation.id, 'quantite', parseInt(e.target.value) || 0)}
                    disabled={isDateBased}
                    className={isDateBased ? "bg-muted" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prix unitaire (FCFA)</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    value={prestation.prixUnitaire || ''} 
                    onChange={(e) => onPrestationChange(prestation.id, 'prixUnitaire', parseInt(e.target.value) || 0)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Montant HT</Label>
                  <Input 
                    value={formatMontant(prestation.montantHT)} 
                    disabled 
                    className="bg-muted font-medium" 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
