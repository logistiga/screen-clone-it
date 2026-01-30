import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Percent, DollarSign, Tag } from "lucide-react";

export type RemiseType = "pourcentage" | "montant" | "none";

export interface RemiseData {
  type: RemiseType;
  valeur: number;
  montantCalcule: number;
}

interface RemiseInputProps {
  montantHT: number;
  onChange: (data: RemiseData) => void;
  initialType?: RemiseType;
  initialValeur?: number;
}

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(montant)) + " XAF";
};

export default function RemiseInput({
  montantHT,
  onChange,
  initialType = "none",
  initialValeur = 0,
}: RemiseInputProps) {
  const [type, setType] = useState<RemiseType>(initialType);
  const [valeur, setValeur] = useState<number>(initialValeur);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Synchroniser avec les props initiales quand elles changent (mode édition)
  useEffect(() => {
    if (!hasInitialized && initialType !== "none") {
      setType(initialType);
      setValeur(initialValeur);
      setHasInitialized(true);
    }
  }, [initialType, initialValeur, hasInitialized]);

  // Calculer le montant de la remise
  const calculerMontantRemise = (): number => {
    if (type === "none" || valeur <= 0) return 0;
    if (type === "pourcentage") {
      const pourcentage = Math.min(valeur, 100); // Max 100%
      return Math.round((montantHT * pourcentage) / 100);
    }
    // Montant fixe - ne peut pas dépasser le montant HT
    return Math.min(valeur, montantHT);
  };

  const montantRemise = calculerMontantRemise();

  useEffect(() => {
    onChange({
      type,
      valeur,
      montantCalcule: montantRemise,
    });
  }, [type, valeur, montantRemise]);

  const handleTypeChange = (newType: RemiseType) => {
    setType(newType);
    if (newType === "none") {
      setValeur(0);
    }
  };

  const handleValeurChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    // Limiter le pourcentage à 100%
    if (type === "pourcentage") {
      setValeur(Math.min(val, 100));
    } else {
      setValeur(Math.max(0, val));
    }
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-lg animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          Remise
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label>Type de remise</Label>
            <Select value={type} onValueChange={(v) => handleTypeChange(v as RemiseType)}>
              <SelectTrigger>
                <SelectValue placeholder="Aucune remise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune remise</SelectItem>
                <SelectItem value="pourcentage">
                  <span className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Pourcentage
                  </span>
                </SelectItem>
                <SelectItem value="montant">
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Montant fixe
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type !== "none" && (
            <div className="space-y-2">
              <Label>
                {type === "pourcentage" ? "Pourcentage (%)" : "Montant (XAF)"}
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={type === "pourcentage" ? 100 : undefined}
                  step={type === "pourcentage" ? 0.5 : 1}
                  value={valeur || ""}
                  onChange={handleValeurChange}
                  placeholder={type === "pourcentage" ? "Ex: 5" : "Ex: 50000"}
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {type === "pourcentage" ? "%" : "XAF"}
                </span>
              </div>
            </div>
          )}

          {type !== "none" && valeur > 0 && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Montant de la remise</Label>
              <div className="h-10 flex items-center px-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <span className="text-destructive font-semibold">
                  - {formatMontant(montantRemise)}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
