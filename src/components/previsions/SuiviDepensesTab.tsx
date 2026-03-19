import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";
import { DetailCategorie } from "@/lib/api/previsions";
import { PrevisionProgressItem } from "./PrevisionProgressItem";

interface SuiviDepensesTabProps {
  depenses: DetailCategorie[];
  formatMontant: (montant: number) => string;
}

export function SuiviDepensesTab({ depenses, formatMontant }: SuiviDepensesTabProps) {
  const totalPrevu = depenses.reduce((s, d) => s + d.montant_prevu, 0);
  const totalRealise = depenses.reduce((s, d) => s + d.montant_realise, 0);
  const tauxGlobal = totalPrevu > 0 ? Math.round((totalRealise / totalPrevu) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Résumé */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-muted/50">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-muted-foreground">Budget prévu</p>
            <p className="text-lg font-bold">{formatMontant(totalPrevu)}</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-muted-foreground">Dépensé</p>
            <p className="text-lg font-bold text-destructive">{formatMontant(totalRealise)}</p>
          </CardContent>
        </Card>
        <Card className={`${tauxGlobal > 100 ? 'bg-destructive/5 border-destructive/20' : 'bg-success/5 border-success/20'}`}>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-muted-foreground">Taux global</p>
            <p className={`text-lg font-bold ${tauxGlobal > 100 ? 'text-destructive' : 'text-success'}`}>{tauxGlobal}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Détail par catégorie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-destructive" />
            Détail par catégorie
            <span className="text-sm font-normal text-muted-foreground">({depenses.length} catégories)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {depenses.length > 0 ? (
            depenses.map((dep) => (
              <PrevisionProgressItem
                key={dep.id}
                item={dep}
                isDepense
                formatMontant={formatMontant}
              />
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">Aucune prévision de dépense pour ce mois</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
