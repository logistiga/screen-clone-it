import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { DetailCategorie } from "@/lib/api/previsions";
import { PrevisionProgressItem } from "./PrevisionProgressItem";

interface SuiviRecettesTabProps {
  recettes: DetailCategorie[];
  formatMontant: (montant: number) => string;
}

export function SuiviRecettesTab({ recettes, formatMontant }: SuiviRecettesTabProps) {
  const totalPrevu = recettes.reduce((s, r) => s + r.montant_prevu, 0);
  const totalRealise = recettes.reduce((s, r) => s + r.montant_realise, 0);
  const tauxGlobal = totalPrevu > 0 ? Math.round((totalRealise / totalPrevu) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Résumé */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-muted/50">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-muted-foreground">Objectif recettes</p>
            <p className="text-lg font-bold">{formatMontant(totalPrevu)}</p>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/20">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-muted-foreground">Encaissé</p>
            <p className="text-lg font-bold text-success">{formatMontant(totalRealise)}</p>
          </CardContent>
        </Card>
        <Card className={`${tauxGlobal >= 100 ? 'bg-success/5 border-success/20' : 'bg-warning/5 border-warning/20'}`}>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-muted-foreground">Taux global</p>
            <p className={`text-lg font-bold ${tauxGlobal >= 100 ? 'text-success' : tauxGlobal >= 50 ? 'text-warning' : 'text-destructive'}`}>{tauxGlobal}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Détail par catégorie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            Détail par catégorie
            <span className="text-sm font-normal text-muted-foreground">({recettes.length} catégories)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {recettes.length > 0 ? (
            recettes.map((rec) => (
              <PrevisionProgressItem
                key={rec.id}
                item={rec}
                formatMontant={formatMontant}
              />
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">Aucune prévision de recette pour ce mois</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
