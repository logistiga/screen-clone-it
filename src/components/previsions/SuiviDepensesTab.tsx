import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, AlertOctagon, ShieldCheck } from "lucide-react";
import { DetailCategorie } from "@/lib/api/previsions";
import { PrevisionProgressItem } from "./PrevisionProgressItem";
import { BudgetHealthGauge } from "./BudgetHealthGauge";

interface SuiviDepensesTabProps {
  depenses: DetailCategorie[];
  formatMontant: (montant: number) => string;
}

export function SuiviDepensesTab({ depenses, formatMontant }: SuiviDepensesTabProps) {
  const totalPrevu = depenses.reduce((s, d) => s + d.montant_prevu, 0);
  const totalRealise = depenses.reduce((s, d) => s + d.montant_realise, 0);
  const tauxGlobal = totalPrevu > 0 ? Math.round((totalRealise / totalPrevu) * 100) : 0;
  const nbDepassements = depenses.filter(d => d.taux > 100).length;

  // Health = 100 - overspend%. If under budget → 100. If 120% → 80, etc.
  const sante = Math.max(0, Math.min(100, Math.round(200 - tauxGlobal)));

  return (
    <div className="space-y-4">
      {/* Résumé + jauge */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <BudgetHealthGauge score={sante} label="Santé dépenses" />

        <Card className="bg-muted/50">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Budget prévu</p>
            <p className="text-2xl font-extrabold mt-1">{formatMontant(totalPrevu)}</p>
            <p className="text-[11px] text-muted-foreground">{depenses.length} catégories</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Dépensé</p>
            <p className="text-2xl font-extrabold text-destructive mt-1">{formatMontant(totalRealise)}</p>
            <p className="text-[11px] text-muted-foreground">{tauxGlobal}% du budget</p>
          </CardContent>
        </Card>
        <Card className={nbDepassements > 0 ? 'bg-destructive/5 border-destructive/20' : 'bg-emerald-500/5 border-emerald-500/20'}>
          <CardContent className="pt-4 pb-3 text-center">
            {nbDepassements > 0 ? (
              <>
                <AlertOctagon className="h-5 w-5 text-destructive mx-auto mb-1" />
                <p className="text-2xl font-extrabold text-destructive">{nbDepassements}</p>
                <p className="text-[11px] text-muted-foreground">dépassement{nbDepassements > 1 ? 's' : ''}</p>
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-sm font-bold text-emerald-600">Dans le budget</p>
                <p className="text-[11px] text-muted-foreground">Aucun dépassement</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Détail par catégorie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-destructive" />
            Détail par catégorie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {depenses.length > 0 ? (
            depenses
              .sort((a, b) => b.taux - a.taux) // Highest consumption first
              .map((dep) => (
                <PrevisionProgressItem key={dep.id} item={dep} isDepense formatMontant={formatMontant} />
              ))
          ) : (
            <p className="text-muted-foreground text-center py-4">Aucune prévision de dépense pour ce mois</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
