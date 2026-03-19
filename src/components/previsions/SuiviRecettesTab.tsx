import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { DetailCategorie } from "@/lib/api/previsions";
import { PrevisionProgressItem } from "./PrevisionProgressItem";
import { BudgetHealthGauge } from "./BudgetHealthGauge";

interface SuiviRecettesTabProps {
  recettes: DetailCategorie[];
  formatMontant: (montant: number) => string;
}

export function SuiviRecettesTab({ recettes, formatMontant }: SuiviRecettesTabProps) {
  const totalPrevu = recettes.reduce((s, r) => s + r.montant_prevu, 0);
  const totalRealise = recettes.reduce((s, r) => s + r.montant_realise, 0);
  const tauxGlobal = totalPrevu > 0 ? Math.round((totalRealise / totalPrevu) * 100) : 0;

  // Health = taux directly (higher is better for revenue)
  const sante = Math.min(100, tauxGlobal);

  return (
    <div className="space-y-4">
      {/* Résumé + jauge */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <BudgetHealthGauge score={sante} label="Performance recettes" />

        <Card className="bg-muted/50">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Objectif</p>
            <p className="text-2xl font-extrabold mt-1">{formatMontant(totalPrevu)}</p>
            <p className="text-[11px] text-muted-foreground">{recettes.length} sources</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Encaissé</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{formatMontant(totalRealise)}</p>
            <p className="text-[11px] text-muted-foreground">{tauxGlobal}% de l'objectif</p>
          </CardContent>
        </Card>
        <Card className={tauxGlobal >= 100 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-orange-500/5 border-orange-500/20'}>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Écart</p>
            <p className={`text-2xl font-extrabold mt-1 ${totalRealise - totalPrevu >= 0 ? 'text-emerald-600' : 'text-orange-500'}`}>
              {totalRealise - totalPrevu >= 0 ? '+' : ''}{formatMontant(totalRealise - totalPrevu)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {totalRealise >= totalPrevu ? 'Objectif atteint' : 'En dessous de l\'objectif'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Détail par catégorie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            Détail par catégorie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recettes.length > 0 ? (
            recettes
              .sort((a, b) => b.montant_realise - a.montant_realise)
              .map((rec) => (
                <PrevisionProgressItem key={rec.id} item={rec} formatMontant={formatMontant} />
              ))
          ) : (
            <p className="text-muted-foreground text-center py-4">Aucune prévision de recette pour ce mois</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
