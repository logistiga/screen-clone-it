import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, FileText, Ban, Percent } from "lucide-react";
import { formatMontant } from "@/data/mockData";

interface AngleTaxeCardProps {
  typeTaxe: "TVA" | "CSS";
  taux: number;
  montantHT: number;
  montantTaxe: number;
  montantExonere: number;
  nombreDocuments: number;
  nombreExonerations: number;
  progression: number | null;
  cloture: boolean;
  delay?: number;
}

export function AngleTaxeCard({
  typeTaxe,
  taux,
  montantHT,
  montantTaxe,
  montantExonere,
  nombreDocuments,
  nombreExonerations,
  progression,
  cloture,
  delay = 0,
}: AngleTaxeCardProps) {
  const isTVA = typeTaxe === "TVA";
  
  const getProgressionIcon = () => {
    if (progression === null) return <Minus className="h-3 w-3" />;
    if (progression > 0) return <TrendingUp className="h-3 w-3" />;
    if (progression < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getProgressionColor = () => {
    if (progression === null) return "text-muted-foreground";
    if (progression > 0) return "text-emerald-600";
    if (progression < 0) return "text-red-500";
    return "text-muted-foreground";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className={`relative overflow-hidden border-border/50 ${cloture ? 'opacity-75' : ''}`}>
        {/* Gradient accent */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${
          isTVA ? 'bg-gradient-to-r from-primary to-primary/60' : 'bg-gradient-to-r from-amber-500 to-amber-400'
        }`} />
        
        <CardContent className="pt-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${
                isTVA ? 'bg-primary/10' : 'bg-amber-500/10'
              }`}>
                <Percent className={`h-5 w-5 ${isTVA ? 'text-primary' : 'text-amber-600'}`} />
              </div>
              <div>
                <h3 className="font-bold text-lg">{typeTaxe}</h3>
                <p className="text-xs text-muted-foreground">Taux: {taux}%</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {cloture && (
                <Badge variant="outline" className="text-xs bg-muted">
                  Clôturé
                </Badge>
              )}
              {progression !== null && (
                <div className={`flex items-center gap-1 text-xs ${getProgressionColor()}`}>
                  {getProgressionIcon()}
                  <span>{Math.abs(progression)}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Montant principal */}
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-1">À reverser</p>
            <p className={`text-2xl font-bold ${isTVA ? 'text-primary' : 'text-amber-600'}`}>
              {formatMontant(montantTaxe)}
            </p>
          </div>

          {/* Stats secondaires */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
            <div>
              <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                <FileText className="h-3 w-3" />
                <span>Documents</span>
              </div>
              <p className="font-semibold text-sm">{nombreDocuments}</p>
            </div>
            <div>
              <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                <span>Base HT</span>
              </div>
              <p className="font-semibold text-sm">{formatMontant(montantHT)}</p>
            </div>
          </div>

          {/* Exonérations */}
          {nombreExonerations > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Ban className="h-3 w-3" />
                  <span>Exonérations</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{nombreExonerations} docs</span>
                  <span className="text-muted-foreground ml-2">
                    ({formatMontant(montantExonere)} HT)
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
