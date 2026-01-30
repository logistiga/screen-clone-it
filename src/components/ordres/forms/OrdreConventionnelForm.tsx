import { useState, useEffect, useCallback } from "react";
import { Package, FileText, Plus, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormError } from "@/components/ui/form-error";
import {
  LigneLot,
  getInitialLot,
  calculateTotalLots,
} from "@/types/documents";
import { ordreConventionnelSchema } from "@/lib/validations/ordre-schemas";
import { cn } from "@/lib/utils";

interface OrdreConventionnelFormProps {
  onDataChange: (data: OrdreConventionnelData) => void;
  initialData?: Partial<OrdreConventionnelData>;
}

export interface OrdreConventionnelData {
  numeroBL: string;
  lieuChargement: string;
  lieuDechargement: string;
  lots: LigneLot[];
  montantHT: number;
}

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(montant)) + ' XAF';
};

export default function OrdreConventionnelForm({
  onDataChange,
  initialData,
}: OrdreConventionnelFormProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [numeroBL, setNumeroBL] = useState("");
  const [lieuChargement, setLieuChargement] = useState("");
  const [lieuDechargement, setLieuDechargement] = useState("");
  const [lots, setLots] = useState<LigneLot[]>([getInitialLot()]);
  
  // Validation errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Initialisation depuis initialData
  useEffect(() => {
    if (initialData && !isInitialized) {
      if (initialData.numeroBL) setNumeroBL(initialData.numeroBL);
      if (initialData.lieuChargement) setLieuChargement(initialData.lieuChargement);
      if (initialData.lieuDechargement) setLieuDechargement(initialData.lieuDechargement);
      if (initialData.lots && initialData.lots.length > 0) {
        setLots(initialData.lots);
      }
      setIsInitialized(true);
    }
  }, [initialData, isInitialized]);

  // Validate on blur
  const validateField = useCallback((fieldPath: string) => {
    const data = {
      numeroBL,
      lieuChargement,
      lieuDechargement,
      lots,
    };

    const result = ordreConventionnelSchema.safeParse(data);
    
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
  }, [numeroBL, lieuChargement, lieuDechargement, lots]);

  const handleBlur = (fieldPath: string) => {
    setTouched(prev => ({ ...prev, [fieldPath]: true }));
    validateField(fieldPath);
  };

  const getFieldError = (fieldPath: string) => {
    return touched[fieldPath] ? errors[fieldPath] : undefined;
  };

  const updateParent = (newLots: LigneLot[]) => {
    const montantHT = calculateTotalLots(newLots);
    onDataChange({
      numeroBL,
      lieuChargement,
      lieuDechargement,
      lots: newLots,
      montantHT,
    });
  };

  // Met à jour le parent quand les champs header changent
  useEffect(() => {
    updateParent(lots);
  }, [numeroBL, lieuChargement, lieuDechargement]);

  const handleAddLot = () => {
    const newLots = [...lots, { ...getInitialLot(), id: String(Date.now()) }];
    setLots(newLots);
    updateParent(newLots);
  };

  const handleRemoveLot = (id: string) => {
    if (lots.length > 1) {
      const newLots = lots.filter(l => l.id !== id);
      setLots(newLots);
      updateParent(newLots);
    }
  };

  const handleLotChange = (id: string, field: keyof LigneLot, value: string | number) => {
    const newLots = lots.map(l => {
      if (l.id === id) {
        const updated = { ...l, [field]: value };
        if (field === 'quantite' || field === 'prixUnitaire') {
          updated.prixTotal = updated.quantite * updated.prixUnitaire;
        }
        return updated;
      }
      return l;
    });
    setLots(newLots);
    updateParent(newLots);
  };

  const montantHT = calculateTotalLots(lots);

  return (
    <>
      {/* Informations du lot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Informations du lot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md space-y-2">
            <Label className="text-amber-600">Numéro BL *</Label>
            <Input
              placeholder="Ex: MSCUAB123456"
              value={numeroBL}
              onChange={(e) => setNumeroBL(e.target.value.toUpperCase())}
              onBlur={() => handleBlur('numeroBL')}
              className={cn("font-mono", getFieldError('numeroBL') && "border-destructive")}
            />
            <FormError message={getFieldError('numeroBL')} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-amber-600">
                <MapPin className="h-4 w-4" />
                Lieu de chargement
              </Label>
              <Input
                placeholder="Ex: Port d'Owendo"
                value={lieuChargement}
                onChange={(e) => setLieuChargement(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-amber-600">
                <MapPin className="h-4 w-4" />
                Lieu de déchargement
              </Label>
              <Input
                placeholder="Ex: Entrepôt client"
                value={lieuDechargement}
                onChange={(e) => setLieuDechargement(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des lots */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Lots
            </CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={handleAddLot} className="gap-1">
              <Plus className="h-4 w-4" />
              Ajouter lot
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <FormError message={getFieldError('lots')} />
          <div className="space-y-6">
            {lots.map((lot, index) => (
              <div key={lot.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-muted-foreground">Lot {index + 1}</span>
                  {lots.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveLot(lot.id)}
                      className="text-destructive h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>N° Lot</Label>
                    <Input
                      placeholder="Ex: LOT-2024-001"
                      value={lot.numeroLot}
                      onChange={(e) => handleLotChange(lot.id, 'numeroLot', e.target.value.toUpperCase())}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Input
                      placeholder="Description de la marchandise"
                      value={lot.description}
                      onChange={(e) => handleLotChange(lot.id, 'description', e.target.value)}
                      onBlur={() => handleBlur(`lots.${index}.description`)}
                      className={cn(getFieldError(`lots.${index}.description`) && "border-destructive")}
                    />
                    <FormError message={getFieldError(`lots.${index}.description`)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Quantité *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={lot.quantite}
                      onChange={(e) => handleLotChange(lot.id, 'quantite', parseInt(e.target.value) || 0)}
                      onBlur={() => handleBlur(`lots.${index}.quantite`)}
                      className={cn(getFieldError(`lots.${index}.quantite`) && "border-destructive")}
                    />
                    <FormError message={getFieldError(`lots.${index}.quantite`)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Prix unitaire (FCFA)</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={lot.prixUnitaire || ""}
                      onChange={(e) => handleLotChange(lot.id, 'prixUnitaire', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prix total (FCFA)</Label>
                    <Input value={lot.prixTotal} disabled className="bg-muted font-medium" />
                  </div>
                </div>
                {index < lots.length - 1 && <div className="border-b my-4" />}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end pt-4 border-t mt-6">
            <div className="text-right">
              <span className="text-sm text-muted-foreground">Total: </span>
              <span className="text-xl font-bold text-primary">{formatMontant(montantHT)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
