import { useCallback, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calculator, Percent, Info, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

function TaxesSelectorComponent({
  taxes,
  montantHT,
  value,
  onChange,
}: TaxesSelectorProps) {
  // Refs pour éviter les boucles de re-render
  const valueRef = useRef(value);
  valueRef.current = value;
  
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const { selectedTaxCodes, hasExoneration, exoneratedTaxCodes, motifExoneration } = value;

  // Taxes actives triées
  const activeTaxes = useMemo(
    () => taxes.filter(t => t.active).sort((a, b) => a.code.localeCompare(b.code)),
    [taxes]
  );

  // Codes des taxes obligatoires (normalisés en majuscules)
  const mandatoryCodes = useMemo(
    () => activeTaxes.filter(t => t.obligatoire).map(t => t.code.toUpperCase()),
    [activeTaxes]
  );

  // Sets pour vérifications rapides - normalisés en majuscules
  const selectedSet = useMemo(
    () => new Set(selectedTaxCodes.map(c => c.toUpperCase())),
    [selectedTaxCodes]
  );
  const exoSet = useMemo(
    () => new Set(exoneratedTaxCodes.map(c => c.toUpperCase())),
    [exoneratedTaxCodes]
  );

  const isSelected = useCallback(
    (code: string) => selectedSet.has(code.toUpperCase()),
    [selectedSet]
  );
  const isExonerated = useCallback(
    (code: string) => exoSet.has(code.toUpperCase()),
    [exoSet]
  );

  // Toggle sélection taxe - STABLE via refs
  const toggleSelectTax = useCallback((taxe: TaxeItem) => {
    const code = (taxe.code || "").toUpperCase();
    
    // Taxes obligatoires: toujours sélectionnées
    if (taxe.obligatoire) return;

    const currentValue = valueRef.current;
    const currentSelectedSet = new Set(currentValue.selectedTaxCodes.map(c => c.toUpperCase()));

    const nextSelected = currentSelectedSet.has(code)
      ? currentValue.selectedTaxCodes.filter(c => c.toUpperCase() !== code)
      : [...currentValue.selectedTaxCodes, code];

    // S'assurer que les taxes obligatoires sont toujours incluses
    const nextSelectedNorm = uniqSorted([
      ...nextSelected.map(c => c.toUpperCase()),
      ...mandatoryCodes,
    ]);
    
    // Nettoyer les exonérations qui ne sont plus dans la sélection
    const nextExo = currentValue.exoneratedTaxCodes
      .map(c => c.toUpperCase())
      .filter(c => nextSelectedNorm.includes(c));

    onChangeRef.current({
      ...currentValue,
      selectedTaxCodes: nextSelectedNorm,
      exoneratedTaxCodes: uniqSorted(nextExo),
    });
  }, [mandatoryCodes]);

  // Toggle exonération - STABLE via refs
  const toggleExonerateTax = useCallback((code: string) => {
    const norm = (code || "").toUpperCase();
    const currentValue = valueRef.current;
    const currentSelectedSet = new Set(currentValue.selectedTaxCodes.map(c => c.toUpperCase()));
    
    if (!currentSelectedSet.has(norm)) return;

    const currentExoSet = new Set(currentValue.exoneratedTaxCodes.map(c => c.toUpperCase()));
    const nextExo = currentExoSet.has(norm)
      ? currentValue.exoneratedTaxCodes.filter(c => c.toUpperCase() !== norm)
      : [...currentValue.exoneratedTaxCodes, norm];

    onChangeRef.current({
      ...currentValue,
      exoneratedTaxCodes: uniqSorted(nextExo),
    });
  }, []);

  // Toggle mode exonération global - STABLE via refs
  const handleHasExonerationChange = useCallback((checked: boolean) => {
    const currentValue = valueRef.current;
    const currentSelectedSet = new Set(currentValue.selectedTaxCodes.map(c => c.toUpperCase()));
    
    onChangeRef.current({
      ...currentValue,
      hasExoneration: checked,
      exoneratedTaxCodes: checked
        ? uniqSorted(currentValue.exoneratedTaxCodes.map(c => c.toUpperCase()).filter(c => currentSelectedSet.has(c)))
        : [],
      motifExoneration: checked ? (currentValue.motifExoneration ?? "") : "",
    });
  }, []);

  // Mise à jour du motif - STABLE via refs
  const handleMotifChange = useCallback((nextMotif: string) => {
    onChangeRef.current({
      ...valueRef.current,
      motifExoneration: nextMotif,
    });
  }, []);

  // Taxes sélectionnées (objets) - inclut toujours les obligatoires
  const selectedTaxes = useMemo(() => {
    const codes = new Set(uniqSorted([...selectedTaxCodes.map(c => c.toUpperCase()), ...mandatoryCodes]));
    return activeTaxes.filter(t => codes.has(t.code.toUpperCase()));
  }, [activeTaxes, selectedTaxCodes, mandatoryCodes]);

  // Calcul total taxes (hors exonérées si mode exonération actif)
  const totalTaxes = useMemo(() => {
    if (montantHT <= 0) return 0;
    return selectedTaxes.reduce((acc, t) => {
      if (hasExoneration && exoSet.has(t.code.toUpperCase())) return acc;
      return acc + Math.round(montantHT * (t.taux / 100));
    }, 0);
  }, [montantHT, selectedTaxes, hasExoneration, exoSet]);

  const montantTTC = montantHT + totalTaxes;
  const selectedCodesDisplay = selectedTaxes.map(t => t.code).join(", ");

  return (
    <Card className="transition-all duration-300 hover:shadow-lg border-blue-200/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Taxes applicables
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
              const codeUpper = taxe.code.toUpperCase();
              const selected = isSelected(codeUpper) || !!taxe.obligatoire;
              const montantTaxe = Math.round(montantHT * (taxe.taux / 100));
              const disabled = !!taxe.obligatoire;

              return (
                <div
                  key={taxe.code}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border-2 transition-all",
                    disabled ? "cursor-not-allowed opacity-80" : "cursor-pointer",
                    selected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                      : "border-border hover:border-blue-300 hover:bg-muted/50"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!disabled) toggleSelectTax(taxe);
                  }}
                >
                  <Checkbox
                    checked={selected}
                    disabled={disabled}
                    onCheckedChange={(checked) => {
                      if (!disabled) toggleSelectTax(taxe);
                    }}
                    onClick={(e) => e.stopPropagation()}
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
                </div>
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
        {hasExoneration && (
          <div className="space-y-4 pt-2 animate-in fade-in-0 duration-200">
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleExonerateTax(t.code);
                        }}
                        role="button"
                      >
                        <Checkbox
                          checked={exo}
                          onCheckedChange={() => toggleExonerateTax(t.code)}
                          onClick={(e) => e.stopPropagation()}
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
          </div>
        )}

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

export default TaxesSelectorComponent;
