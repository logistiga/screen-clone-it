import { useState, useEffect, useRef } from "react";
import { Package, FileText, Plus, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LigneLot,
  getInitialLot,
  calculateTotalLots,
} from "@/types/documents";
import { FormError } from "@/components/ui/form-error";
import { fieldSchemas } from "@/lib/validations/facture-schemas";

interface FactureConventionnelFormProps {
  onDataChange: (data: FactureConventionnelData) => void;
  initialData?: FactureConventionnelData | null;
}

export interface FactureConventionnelData {
  numeroBL: string;
  lieuChargement: string;
  lieuDechargement: string;
  lots: LigneLot[];
  montantHT: number;
}

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(montant)) + ' XAF';
};

export default function FactureConventionnelForm({
  onDataChange,
  initialData,
}: FactureConventionnelFormProps) {
  const lastInitKey = useRef<string>("");
  const [numeroBL, setNumeroBL] = useState("");
  const [lieuChargement, setLieuChargement] = useState("");
  const [lieuDechargement, setLieuDechargement] = useState("");
  const [lots, setLots] = useState<LigneLot[]>([getInitialLot()]);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Sync initialData une seule fois
  useEffect(() => {
    if (!initialData) return;
    const initKey = JSON.stringify(initialData);
    if (initKey === lastInitKey.current) return;
    
    setNumeroBL(initialData.numeroBL || "");
    setLieuChargement(initialData.lieuChargement || "");
    setLieuDechargement(initialData.lieuDechargement || "");
    if (initialData.lots?.length > 0) {
      setLots(initialData.lots);
    }
    lastInitKey.current = initKey;
  }, [initialData]);

  // Field validation
  const validateField = (fieldName: string, value: unknown): string | null => {
    try {
      if (fieldName === "numeroBL") {
        fieldSchemas.numeroBL.parse(value);
      } else if (fieldName === "lieuChargement" || fieldName === "lieuDechargement") {
        fieldSchemas.lieu.parse(value);
      } else if (fieldName.includes("description")) {
        fieldSchemas.description.parse(value);
      }
      return null;
    } catch (error: any) {
      return error.errors?.[0]?.message || "Valeur invalide";
    }
  };

  const handleBlur = (fieldName: string, value: unknown) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    const error = validateField(fieldName, value);
    setErrors((prev) => {
      if (error) {
        return { ...prev, [fieldName]: error };
      }
      const { [fieldName]: _, ...rest } = prev;
      return rest;
    });
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

  useEffect(() => {
    updateParent(lots);
  }, [numeroBL, lieuChargement, lieuDechargement, lots]);

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
              onBlur={() => handleBlur("numeroBL", numeroBL)}
              className={`font-mono ${touched.numeroBL && errors.numeroBL ? "border-destructive" : ""}`}
            />
            <FormError message={touched.numeroBL ? errors.numeroBL : undefined} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-amber-600">
                <MapPin className="h-4 w-4" />
                Lieu de chargement *
              </Label>
              <Input
                placeholder="Ex: Port d'Owendo"
                value={lieuChargement}
                onChange={(e) => setLieuChargement(e.target.value)}
                onBlur={() => handleBlur("lieuChargement", lieuChargement)}
                className={touched.lieuChargement && errors.lieuChargement ? "border-destructive" : ""}
              />
              <FormError message={touched.lieuChargement ? errors.lieuChargement : undefined} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-amber-600">
                <MapPin className="h-4 w-4" />
                Lieu de déchargement *
              </Label>
              <Input
                placeholder="Ex: Entrepôt client"
                value={lieuDechargement}
                onChange={(e) => setLieuDechargement(e.target.value)}
                onBlur={() => handleBlur("lieuDechargement", lieuDechargement)}
                className={touched.lieuDechargement && errors.lieuDechargement ? "border-destructive" : ""}
              />
              <FormError message={touched.lieuDechargement ? errors.lieuDechargement : undefined} />
            </div>
          </div>
        </CardContent>
      </Card>

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
          <div className="space-y-6">
            {lots.map((lot, index) => {
              const descriptionFieldName = `lots.${index}.description`;
              
              return (
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
                        onBlur={() => handleBlur(descriptionFieldName, lot.description)}
                        className={touched[descriptionFieldName] && errors[descriptionFieldName] ? "border-destructive" : ""}
                      />
                      <FormError message={touched[descriptionFieldName] ? errors[descriptionFieldName] : undefined} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Quantité</Label>
                      <Input
                        type="number"
                        min="1"
                        value={lot.quantite}
                        onChange={(e) => handleLotChange(lot.id, 'quantite', parseInt(e.target.value) || 0)}
                      />
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
              );
            })}
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
