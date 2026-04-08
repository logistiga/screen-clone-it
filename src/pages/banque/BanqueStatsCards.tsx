import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface BanqueStatsCardsProps {
  totalSoldeBanques: number;
  totalEncaissements: number;
  totalDecaissements: number;
  soldePeriode: number;
  banquesCount: number;
  encaissementsCount: number;
  decaissementsCount: number;
}

export function BanqueStatsCards({
  totalSoldeBanques, totalEncaissements, totalDecaissements, soldePeriode,
  banquesCount, encaissementsCount, decaissementsCount,
}: BanqueStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-l-4 border-l-primary transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4" />Solde Total Banques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatMontant(totalSoldeBanques)}</div>
          <p className="text-xs text-muted-foreground mt-1">{banquesCount} compte{banquesCount > 1 ? 's' : ''} actif{banquesCount > 1 ? 's' : ''}</p>
        </CardContent>
      </Card>

      <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />Encaissements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">+{formatMontant(totalEncaissements)}</div>
          <p className="text-xs text-muted-foreground mt-1">{encaissementsCount} opération{encaissementsCount > 1 ? 's' : ''}</p>
        </CardContent>
      </Card>

      <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-600" />Décaissements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">-{formatMontant(totalDecaissements)}</div>
          <p className="text-xs text-muted-foreground mt-1">{decaissementsCount} opération{decaissementsCount > 1 ? 's' : ''}</p>
        </CardContent>
      </Card>

      <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Wallet className="h-4 w-4" />Solde Période
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn("text-2xl font-bold", soldePeriode >= 0 ? "text-green-600" : "text-red-600")}>
            {soldePeriode >= 0 ? '+' : ''}{formatMontant(soldePeriode)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Encaissements - Décaissements</p>
        </CardContent>
      </Card>
    </div>
  );
}
