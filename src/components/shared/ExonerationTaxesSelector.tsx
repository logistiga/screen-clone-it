import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Shield, Percent, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";

export interface ExonerationData {
  exonereTva: boolean;
  exonereCss: boolean;
  motif: string;
}

interface ExonerationTaxesSelectorProps {
  onChange: (data: ExonerationData) => void;
  tauxTva?: number;
  tauxCss?: number;
  initialData?: ExonerationData;
  montantHT: number;
}

export default function ExonerationTaxesSelector({
  onChange,
  tauxTva = 18,
  tauxCss = 1,
  initialData,
  montantHT,
}: ExonerationTaxesSelectorProps) {
  const [enabled, setEnabled] = useState(
    initialData?.exonereTva || initialData?.exonereCss || false
  );
  const [exonereTva, setExonereTva] = useState(initialData?.exonereTva || false);
  const [exonereCss, setExonereCss] = useState(initialData?.exonereCss || false);
  const [motif, setMotif] = useState(initialData?.motif || "");

  // Sync initial data
  useEffect(() => {
    if (!initialData) return;
    // IMPORTANT: dépendre des champs primitifs (pas de l'objet) pour éviter
    // les resets à chaque render quand le parent passe un objet inline.
    setEnabled(initialData.exonereTva || initialData.exonereCss);
    setExonereTva(initialData.exonereTva);
    setExonereCss(initialData.exonereCss);
    setMotif(initialData.motif);
  }, [initialData?.exonereTva, initialData?.exonereCss, initialData?.motif]);

  // Notify parent of changes
  useEffect(() => {
    if (!enabled) {
      onChange({ exonereTva: false, exonereCss: false, motif: "" });
    } else {
      onChange({ exonereTva, exonereCss, motif });
    }
  }, [enabled, exonereTva, exonereCss, motif, onChange]);

  // Calcul des économies
  const economieTva = exonereTva ? Math.round(montantHT * (tauxTva / 100)) : 0;
  const economieCss = exonereCss ? Math.round(montantHT * (tauxCss / 100)) : 0;
  const economieTotal = economieTva + economieCss;

  const handleToggleEnabled = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      setExonereTva(false);
      setExonereCss(false);
      setMotif("");
    }
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-lg border-amber-200/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            Exonération de taxes
          </span>
          <Switch 
            checked={enabled} 
            onCheckedChange={handleToggleEnabled}
            className="data-[state=checked]:bg-amber-600"
          />
        </CardTitle>
      </CardHeader>
      
      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="space-y-4 pt-0">
              {/* Sélection des taxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    exonereTva 
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20" 
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setExonereTva(!exonereTva)}
                >
                  <Checkbox
                    id="exonere-tva"
                    checked={exonereTva}
                    onCheckedChange={(checked) => setExonereTva(!!checked)}
                    className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                  />
                  <div className="flex-1">
                    <Label htmlFor="exonere-tva" className="font-medium cursor-pointer">
                      TVA ({tauxTva}%)
                    </Label>
                    {exonereTva && montantHT > 0 && (
                      <p className="text-xs text-green-600 font-medium mt-0.5">
                        Économie: {Math.round(economieTva).toLocaleString('fr-FR')} XAF
                      </p>
                    )}
                  </div>
                </div>
                
                <div 
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    exonereCss 
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20" 
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setExonereCss(!exonereCss)}
                >
                  <Checkbox
                    id="exonere-css"
                    checked={exonereCss}
                    onCheckedChange={(checked) => setExonereCss(!!checked)}
                    className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                  />
                  <div className="flex-1">
                    <Label htmlFor="exonere-css" className="font-medium cursor-pointer">
                      CSS ({tauxCss}%)
                    </Label>
                    {exonereCss && montantHT > 0 && (
                      <p className="text-xs text-green-600 font-medium mt-0.5">
                        Économie: {Math.round(economieCss).toLocaleString('fr-FR')} XAF
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Motif obligatoire */}
              {(exonereTva || exonereCss) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="space-y-2">
                    <Label htmlFor="motif" className="flex items-center gap-1">
                      Motif d'exonération 
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="motif"
                      value={motif}
                      onChange={(e) => setMotif(e.target.value)}
                      placeholder="Ex: Export zone franche, ONG, Marché public..."
                      maxLength={255}
                      className={!motif ? "border-amber-300 focus:border-amber-500" : ""}
                    />
                    {!motif && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Le motif est obligatoire pour les exonérations
                      </p>
                    )}
                  </div>

                  {/* Résumé des économies */}
                  {economieTotal > 0 && (
                    <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
                      <Percent className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700 dark:text-green-400">
                        Économie totale: <strong>{Math.round(economieTotal).toLocaleString('fr-FR')} XAF</strong>
                      </AlertDescription>
                    </Alert>
                  )}
                </motion.div>
              )}

              {/* Message si aucune taxe sélectionnée */}
              {enabled && !exonereTva && !exonereCss && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Sélectionnez au moins une taxe à exonérer
                </p>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
