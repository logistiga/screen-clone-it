import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, FileX, Percent } from "lucide-react";
import { formatDate } from "@/data/mockData";
import { motion } from "framer-motion";

interface ExonerationStatusCardProps {
  exonereTva?: boolean;
  exonereCss?: boolean;
  motifExoneration?: string;
  montantTva?: number;
  montantCss?: number;
  updatedAt?: string;
  createdAt?: string;
}

export function ExonerationStatusCard({
  exonereTva = false,
  exonereCss = false,
  motifExoneration,
  montantTva = 0,
  montantCss = 0,
  updatedAt,
  createdAt,
}: ExonerationStatusCardProps) {
  const hasExoneration = exonereTva || exonereCss;
  const economie = (exonereTva ? montantTva : 0) + (exonereCss ? montantCss : 0);

  if (!hasExoneration) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-amber-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-muted-foreground">
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <Percent className="h-4 w-4 text-amber-600" />
            </div>
            Exonération de taxes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Badges exonération */}
          <div className="flex flex-wrap gap-2">
            {exonereTva && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                TVA exonérée (18%)
              </Badge>
            )}
            {exonereCss && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                CSS exonéré (1%)
              </Badge>
            )}
          </div>

          {/* Économie réalisée */}
          {economie > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Économie réalisée:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {Math.round(economie).toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          )}

          {/* Motif */}
          {motifExoneration && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Motif d'exonération
                  </span>
                  <p className="text-sm mt-1">{motifExoneration}</p>
                </div>
              </div>
            </div>
          )}

          {/* Date de modification */}
          {updatedAt && (
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Dernière modification: {formatDate(updatedAt)}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
