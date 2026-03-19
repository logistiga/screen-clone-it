import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { DetailCategorie } from "@/lib/api/previsions";

interface PrevisionProgressItemProps {
  item: DetailCategorie;
  isDepense?: boolean;
  formatMontant: (montant: number) => string;
}

const getStatutBadge = (statut: string) => {
  switch (statut) {
    case 'en_cours': return <Badge variant="outline" className="border-primary text-primary"><Clock className="h-3 w-3 mr-1" />En cours</Badge>;
    case 'atteint': return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="h-3 w-3 mr-1" />Atteint</Badge>;
    case 'depasse': return <Badge className="bg-info text-info-foreground"><TrendingUp className="h-3 w-3 mr-1" />Dépassé</Badge>;
    case 'non_atteint': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Non atteint</Badge>;
    default: return <Badge variant="outline">{statut}</Badge>;
  }
};

const getTauxColor = (taux: number, isDepense = false) => {
  if (isDepense) {
    if (taux > 100) return 'text-destructive';
    if (taux >= 80) return 'text-warning';
    return 'text-success';
  }
  if (taux >= 100) return 'text-success';
  if (taux >= 50) return 'text-warning';
  return 'text-destructive';
};

export function PrevisionProgressItem({ item, isDepense = false, formatMontant }: PrevisionProgressItemProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-medium">{item.categorie}</span>
          {getStatutBadge(item.statut)}
        </div>
        <div className="text-right">
          <span className={`font-bold ${getTauxColor(item.taux, isDepense)}`}>
            {formatMontant(item.montant_realise)}
          </span>
          <span className="text-muted-foreground"> / {formatMontant(item.montant_prevu)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Progress
          value={Math.min(item.taux, 100)}
          className={`flex-1 h-3 ${isDepense && item.taux > 100 ? '[&>div]:bg-destructive' : ''}`}
        />
        <span className={`text-sm font-medium w-16 text-right ${getTauxColor(item.taux, isDepense)}`}>
          {item.taux}%
        </span>
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>Caisse: {formatMontant(item.realise_caisse)}</span>
        <span>Banque: {formatMontant(item.realise_banque)}</span>
        {isDepense && (
          <span className={item.ecart > 0 ? 'text-destructive' : 'text-success'}>
            Écart: {item.ecart > 0 ? '+' : ''}{formatMontant(item.ecart)}
          </span>
        )}
      </div>
    </div>
  );
}
