import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, TrendingUp, ChevronsRight } from "lucide-react";
import { DetailCategorie } from "@/lib/api/previsions";

interface PrevisionProgressItemProps {
  item: DetailCategorie;
  isDepense?: boolean;
  formatMontant: (montant: number) => string;
}

const getStatutBadge = (statut: string) => {
  switch (statut) {
    case 'en_cours': return <Badge variant="outline" className="border-primary text-primary text-[11px] px-1.5 py-0"><Clock className="h-3 w-3 mr-0.5" />En cours</Badge>;
    case 'atteint': return <Badge className="bg-success text-success-foreground text-[11px] px-1.5 py-0"><CheckCircle2 className="h-3 w-3 mr-0.5" />Atteint</Badge>;
    case 'depasse': return <Badge className="bg-destructive/90 text-destructive-foreground text-[11px] px-1.5 py-0"><TrendingUp className="h-3 w-3 mr-0.5" />Dépassé</Badge>;
    case 'non_atteint': return <Badge variant="destructive" className="text-[11px] px-1.5 py-0"><XCircle className="h-3 w-3 mr-0.5" />Non atteint</Badge>;
    default: return <Badge variant="outline" className="text-[11px]">{statut}</Badge>;
  }
};

const getBarColor = (taux: number, isDepense: boolean): string => {
  if (isDepense) {
    if (taux > 100) return 'bg-destructive';
    if (taux >= 80) return 'bg-orange-500';
    return 'bg-emerald-500';
  }
  if (taux >= 100) return 'bg-emerald-500';
  if (taux >= 50) return 'bg-orange-500';
  return 'bg-destructive';
};

const getTauxTextColor = (taux: number, isDepense: boolean): string => {
  if (isDepense) {
    if (taux > 100) return 'text-destructive';
    if (taux >= 80) return 'text-orange-500';
    return 'text-emerald-600';
  }
  if (taux >= 100) return 'text-emerald-600';
  if (taux >= 50) return 'text-orange-500';
  return 'text-destructive';
};

export function PrevisionProgressItem({ item, isDepense = false, formatMontant }: PrevisionProgressItemProps) {
  const isOverBudget = isDepense && item.taux > 100;

  return (
    <div className={`space-y-2.5 p-3 rounded-lg border transition-colors ${
      isOverBudget
        ? 'bg-destructive/5 border-destructive/20'
        : 'bg-card border-transparent hover:border-border'
    }`}>
      {/* Header row */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{item.categorie}</span>
          {getStatutBadge(item.statut)}
        </div>
        <div className="text-right">
          <span className={`text-base font-bold ${getTauxTextColor(item.taux, isDepense)}`}>
            {formatMontant(item.montant_realise)}
          </span>
          <span className="text-xs text-muted-foreground ml-1">/ {formatMontant(item.montant_prevu)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1 h-3 rounded-full bg-muted overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${getBarColor(item.taux, isDepense)}`}
            style={{ width: `${Math.min(item.taux, 100)}%` }}
          />
          {/* Overflow indicator for > 100% */}
          {isOverBudget && (
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="absolute inset-y-0 rounded-full bg-destructive"
                style={{ left: 0, width: '100%' }}
              />
              {/* Animated hatch pattern overlay */}
              <div
                className="absolute inset-y-0 right-0 flex items-center animate-pulse"
                style={{ width: `${Math.min((item.taux - 100) / item.taux * 100, 40)}%` }}
              >
                <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.3)_2px,rgba(255,255,255,0.3)_4px)]" />
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 min-w-[4.5rem] justify-end">
          {isOverBudget && <ChevronsRight className="h-3.5 w-3.5 text-destructive animate-pulse" />}
          <span className={`text-sm font-bold ${getTauxTextColor(item.taux, isDepense)}`}>
            {item.taux}%
          </span>
        </div>
      </div>

      {/* Detail row — bigger text */}
      <div className="flex gap-5 text-[13px]">
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground/70">Caisse:</span> {formatMontant(item.realise_caisse)}
        </span>
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground/70">Banque:</span> {formatMontant(item.realise_banque)}
        </span>
        {isDepense && (
          <span className={`font-medium ${item.ecart > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
            Écart: {item.ecart > 0 ? '+' : ''}{formatMontant(item.ecart)}
          </span>
        )}
        {!isDepense && (
          <span className={`font-medium ${item.ecart >= 0 ? 'text-emerald-600' : 'text-orange-500'}`}>
            Écart: {item.ecart > 0 ? '+' : ''}{formatMontant(item.ecart)}
          </span>
        )}
      </div>
    </div>
  );
}
