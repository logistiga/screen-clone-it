import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calculator, Percent, Info, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TaxeItem {
  code: string;
  nom: string;
  taux: number;
  active: boolean;
  obligatoire?: boolean;
}

export interface TaxesSelectionData {
  taxesAppliquees: TaxeItem[];
  exonere: boolean;
  motifExoneration: string;
}

interface TaxesSelectorProps {
  taxes: TaxeItem[];
  montantHT: number;
  value: TaxesSelectionData;
  onChange: (data: TaxesSelectionData) => void;
}

export default function TaxesSelector({
  taxes,
  montantHT,
  value,
  onChange,
}: TaxesSelectorProps) {
  const { taxesAppliquees, exonere, motifExoneration } = value;

  // Composant contrôlé: toutes les mises à jour passent par onChange (pas de useEffect/setState)
  const toggleTaxe = useCallback(
    (taxe: TaxeItem) => {
      const exists = taxesAppliquees.some((t) => t.code === taxe.code);
      const nextTaxes = exists
        ? taxesAppliquees.filter((t) => t.code !== taxe.code)
        : [...taxesAppliquees, taxe];

      onChange({
        ...value,
        taxesAppliquees: nextTaxes,
      });
    },
    [onChange, taxesAppliquees, value]
  );

  const isTaxeSelected = useCallback(
    (code: string) => taxesAppliquees.some((t) => t.code === code),
    [taxesAppliquees]
  );

  const handleExonereChange = useCallback(
    (checked: boolean) => {
      onChange({
        ...value,
        exonere: checked,
        motifExoneration: checked ? (value.motifExoneration ?? "") : "",
      });
    },
    [onChange, value]
  );

  const handleMotifChange = useCallback(
    (nextMotif: string) => {
      onChange({
        ...value,
        motifExoneration: nextMotif,
      });
    },
    [onChange, value]
  );

  // Calcul des montants
  const totalTaxes = taxesAppliquees.reduce((acc, t) => {
    return acc + Math.round(montantHT * (t.taux / 100));
  }, 0);
  const montantTTC = montantHT + (exonere ? 0 : totalTaxes);

  return (
    <Card className="transition-all duration-300 hover:shadow-lg border-blue-200/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Taxes applicables
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Exonérer tout</span>
            <Switch 
              checked={exonere} 
              onCheckedChange={handleExonereChange}
              className="data-[state=checked]:bg-amber-600"
            />
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {!exonere ? (
            <motion.div
              key="taxes-selection"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Sélection des taxes */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Sélectionnez les taxes à appliquer</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {taxes.map((taxe) => {
                    const isSelected = isTaxeSelected(taxe.code);
                    const montantTaxe = Math.round(montantHT * (taxe.taux / 100));
                    
                    return (
                      <motion.div
                        key={taxe.code}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer",
                          isSelected 
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" 
                            : "border-border hover:border-blue-300 hover:bg-muted/50"
                        )}
                        onClick={() => toggleTaxe(taxe)}
                      >
                        <Checkbox
                          id={`taxe-${taxe.code}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleTaxe(taxe)}
                          className="mt-0.5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Label 
                              htmlFor={`taxe-${taxe.code}`} 
                              className="font-semibold cursor-pointer"
                            >
                              {taxe.code}
                            </Label>
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "text-xs",
                                isSelected ? "bg-blue-200 text-blue-800" : ""
                              )}
                            >
                              {taxe.taux}%
                            </Badge>
                            {taxe.obligatoire && (
                              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                Obligatoire
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {taxe.nom}
                          </p>
                          {isSelected && montantHT > 0 && (
                            <p className="text-xs text-blue-600 font-medium mt-1">
                              + {montantTaxe.toLocaleString('fr-FR')} XAF
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Résumé */}
              {taxesAppliquees.length > 0 && montantHT > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                    <Percent className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700 dark:text-blue-400">
                      <div className="flex flex-col gap-1">
                        <span>
                          Taxes sélectionnées: <strong>{taxesAppliquees.map(t => t.code).join(', ')}</strong>
                        </span>
                        <span>
                          Total taxes: <strong>{totalTaxes.toLocaleString('fr-FR')} XAF</strong>
                        </span>
                      </div>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {taxesAppliquees.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Aucune taxe sélectionnée - Document hors taxes
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="exoneration"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                <Shield className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700 dark:text-amber-400">
                  Toutes les taxes sont exonérées pour ce document
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="motif" className="flex items-center gap-1">
                  Motif d'exonération 
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="motif"
                  value={motifExoneration}
                  onChange={(e) => handleMotifChange(e.target.value)}
                  placeholder="Ex: Export zone franche, ONG, Marché public..."
                  maxLength={255}
                  className={!motifExoneration ? "border-amber-300 focus:border-amber-500" : ""}
                />
                {!motifExoneration && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Le motif est obligatoire pour les exonérations
                  </p>
                )}
              </div>

              {montantHT > 0 && (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
                  <Percent className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    Économie totale: <strong>{totalTaxes.toLocaleString('fr-FR')} XAF</strong>
                  </AlertDescription>
                </Alert>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
