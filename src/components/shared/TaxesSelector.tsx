import { useCallback, useMemo } from "react";
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

/**
 * Nouvelle structure de données pour la sélection des taxes
 * Basée sur des codes (strings) pour éviter les bugs React
 */
export interface TaxesSelectionData {
  selectedTaxCodes: string[];      // Codes des taxes à appliquer
  hasExoneration: boolean;          // Active le mode exonération
  exoneratedTaxCodes: string[];     // Codes des taxes exonérées (parmi selected)
  motifExoneration: string;         // Obligatoire si hasExoneration = true
}

interface TaxesSelectorProps {
  taxes: TaxeItem[];
  montantHT: number;
  value: TaxesSelectionData;
  onChange: (data: TaxesSelectionData) => void;
}

function uniqSorted(arr: string[]): string[] {
  return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));
}

export default function TaxesSelector({
  taxes,
  montantHT,
  value,
  onChange,
}: TaxesSelectorProps) {
  const { selectedTaxCodes, hasExoneration, exoneratedTaxCodes, motifExoneration } = value;

  // Taxes actives triées
  const activeTaxes = useMemo(
    () => taxes.filter(t => t.active).sort((a, b) => a.code.localeCompare(b.code)),
    [taxes]
  );

  // Codes des taxes obligatoires
  const mandatoryCodes = useMemo(
    () => activeTaxes.filter(t => t.obligatoire).map(t => t.code),
    [activeTaxes]
  );

  // Sets pour vérifications rapides
  const selectedSet = useMemo(() => new Set(selectedTaxCodes), [selectedTaxCodes]);
  const exoSet = useMemo(() => new Set(exoneratedTaxCodes), [exoneratedTaxCodes]);

  const isSelected = useCallback((code: string) => selectedSet.has(code), [selectedSet]);
  const isExonerated = useCallback((code: string) => exoSet.has(code), [exoSet]);

  // Toggle sélection taxe à appliquer
  const toggleSelectTax = useCallback(
    (taxe: TaxeItem) => {
      const code = taxe.code;

      // Taxes obligatoires: toujours sélectionnées
      if (taxe.obligatoire) return;

      const nextSelected = selectedSet.has(code)
        ? selectedTaxCodes.filter(c => c !== code)
        : [...selectedTaxCodes, code];

      // S'assurer que les taxes obligatoires sont toujours incluses
      const nextSelectedNorm = uniqSorted([...nextSelected, ...mandatoryCodes]);
      
      // Nettoyer les exonérations qui ne sont plus dans la sélection
      const nextExo = exoneratedTaxCodes.filter(c => nextSelectedNorm.includes(c));

      onChange({
        ...value,
        selectedTaxCodes: nextSelectedNorm,
        exoneratedTaxCodes: uniqSorted(nextExo),
      });
    },
    [selectedSet, selectedTaxCodes, exoneratedTaxCodes, mandatoryCodes, onChange, value]
  );

  // Toggle exonération sur une taxe (uniquement si la taxe est sélectionnée)
  const toggleExonerateTax = useCallback(
    (code: string) => {
      if (!selectedSet.has(code)) return;

      const nextExo = exoSet.has(code)
        ? exoneratedTaxCodes.filter(c => c !== code)
        : [...exoneratedTaxCodes, code];

      onChange({
        ...value,
        exoneratedTaxCodes: uniqSorted(nextExo),
      });
    },
    [selectedSet, exoSet, exoneratedTaxCodes, onChange, value]
  );

  // Toggle mode exonération global
  const handleHasExonerationChange = useCallback(
    (checked: boolean) => {
      onChange({
        ...value,
        hasExoneration: checked,
        // Si on coupe l'exonération: on reset la liste + motif
        exoneratedTaxCodes: checked ? uniqSorted(exoneratedTaxCodes.filter(c => selectedSet.has(c))) : [],
        motifExoneration: checked ? (motifExoneration ?? "") : "",
      });
    },
    [onChange, value, exoneratedTaxCodes, selectedSet, motifExoneration]
  );

  // Mise à jour du motif
  const handleMotifChange = useCallback(
    (nextMotif: string) => {
      onChange({
        ...value,
        motifExoneration: nextMotif,
      });
    },
    [onChange, value]
  );

  // Taxes sélectionnées (objets) - inclut toujours les obligatoires
  const selectedTaxes = useMemo(() => {
    const codes = new Set(uniqSorted([...selectedTaxCodes, ...mandatoryCodes]));
    return activeTaxes.filter(t => codes.has(t.code));
  }, [activeTaxes, selectedTaxCodes, mandatoryCodes]);

  // Calcul total taxes (hors exonérées si mode exonération actif)
  const totalTaxes = useMemo(() => {
    if (montantHT <= 0) return 0;
    return selectedTaxes.reduce((acc, t) => {
      if (hasExoneration && exoSet.has(t.code)) return acc;
      return acc + Math.round(montantHT * (t.taux / 100));
    }, 0);
  }, [montantHT, selectedTaxes, hasExoneration, exoSet]);

  const montantTTC = montantHT + totalTaxes;

  // Pour l'affichage
  const selectedCodesDisplay = selectedTaxes.map(t => t.code).join(", ");

  return (
    <Card className="transition-all duration-300 hover:shadow-lg border-blue-200/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Taxes (depuis la table)
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Exonération</span>
            <Switch
              checked={hasExoneration}
              onCheckedChange={handleHasExonerationChange}
              className="data-[state=checked]:bg-amber-600"
            />
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 1) Sélection des taxes à appliquer */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">
            Taxes à appliquer
          </Label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeTaxes.map((taxe) => {
              const selected = isSelected(taxe.code) || !!taxe.obligatoire;
              const montantTaxe = Math.round(montantHT * (taxe.taux / 100));
              const disabled = !!taxe.obligatoire;

              return (
                <motion.div
                  key={taxe.code}
                  whileHover={{ scale: disabled ? 1 : 1.02 }}
                  whileTap={{ scale: disabled ? 1 : 0.98 }}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border-2 transition-all",
                    disabled ? "cursor-not-allowed opacity-80" : "cursor-pointer",
                    selected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                      : "border-border hover:border-blue-300 hover:bg-muted/50"
                  )}
                  onClick={() => !disabled && toggleSelectTax(taxe)}
                >
                  <Checkbox
                    checked={selected}
                    disabled={disabled}
                    onCheckedChange={() => !disabled && toggleSelectTax(taxe)}
                    className="mt-0.5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Label className="font-semibold cursor-pointer">
                        {taxe.code}
                      </Label>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          selected ? "bg-blue-200 text-blue-800" : ""
                        )}
                      >
                        {taxe.taux}%
                      </Badge>
                      {taxe.obligatoire && (
                        <Badge
                          variant="outline"
                          className="text-xs text-amber-600 border-amber-300"
                        >
                          Obligatoire
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {taxe.nom}
                    </p>

                    {selected && montantHT > 0 && (
                      <p className="text-xs text-blue-600 font-medium mt-1">
                        + {montantTaxe.toLocaleString("fr-FR")} XAF
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {selectedTaxes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Aucune taxe appliquée (document hors taxes)
            </p>
          )}
        </div>

        {/* 2) Exonération par taxe (uniquement sur les taxes sélectionnées) */}
        <AnimatePresence>
          {hasExoneration && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 pt-2"
            >
              <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                <Shield className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700 dark:text-amber-400">
                  Sélectionne les taxes dont ce document est exonéré (parmi celles appliquées).
                </AlertDescription>
              </Alert>

              {/* Liste exonération */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Taxes exonérées
                </Label>

                {selectedTaxes.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Sélectionne d'abord au moins une taxe à appliquer.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {selectedTaxes.map((t) => {
                      const exo = isExonerated(t.code);

                      return (
                        <div
                          key={`exo-${t.code}`}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer",
                            exo
                              ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
                              : "border-border hover:border-amber-300"
                          )}
                          onClick={() => toggleExonerateTax(t.code)}
                          role="button"
                        >
                          <Checkbox
                            checked={exo}
                            onCheckedChange={() => toggleExonerateTax(t.code)}
                            className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                          />
                          <span className={cn("text-sm font-medium", exo && "text-amber-700")}>
                            {t.code} ({t.taux}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Motif */}
              <div className="space-y-2">
                <Label htmlFor="motif" className="flex items-center gap-1">
                  Motif d'exonération <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="motif"
                  value={motifExoneration}
                  onChange={(e) => handleMotifChange(e.target.value)}
                  placeholder="Ex: Export zone franche, ONG, Marché public..."
                  maxLength={255}
                  className={!motifExoneration ? "border-amber-300 focus:border-amber-500" : ""}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.preventDefault();
                  }}
                />
                {!motifExoneration && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Le motif est obligatoire si exonération activée
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3) Résumé calcul */}
        {montantHT > 0 && (
          <div className="pt-3 border-t">
            <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
              <Percent className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700 dark:text-blue-400">
                <div className="flex flex-col gap-1">
                  <span className="text-sm">
                    Taxes appliquées:{" "}
                    <strong>{selectedCodesDisplay || "Aucune"}</strong>
                  </span>
                  {hasExoneration && selectedTaxes.length > 0 && (
                    <span className="text-sm">
                      Taxes exonérées:{" "}
                      <strong>{exoneratedTaxCodes.length ? exoneratedTaxCodes.join(", ") : "Aucune"}</strong>
                    </span>
                  )}
                  <span className="text-sm">
                    Total taxes: <strong>{totalTaxes.toLocaleString("fr-FR")} XAF</strong>
                  </span>
                  <span className="text-sm font-semibold">
                    Total TTC: <strong>{montantTTC.toLocaleString("fr-FR")} XAF</strong>
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
