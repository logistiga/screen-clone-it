import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ArrowDownCircle, ArrowUpCircle, Wallet, Receipt } from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { DocumentStatCard } from "@/components/shared/documents";

interface CaisseStatsProps {
  soldeJour: number;
  entreesJour: number;
  sortiesJour: number;
  soldeCaisse: number;
  totalEntrees: number;
  totalSorties: number;
  totalItems: number;
  entreesCount: number;
  sortiesCount: number;
}

export function CaisseStats({
  soldeJour, entreesJour, sortiesJour,
  soldeCaisse, totalEntrees, totalSorties,
  totalItems, entreesCount, sortiesCount,
}: CaisseStatsProps) {
  return (
    <>
      {/* Solde du jour */}
      <Card className={`border-2 ${soldeJour >= 0 ? 'border-success/50 bg-success/5' : 'border-destructive/50 bg-destructive/5'}`}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${soldeJour >= 0 ? 'bg-success/20' : 'bg-destructive/20'}`}>
                <Calendar className={`h-6 w-6 ${soldeJour >= 0 ? 'text-success' : 'text-destructive'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Solde du jour</p>
                <p className={`text-2xl font-bold ${soldeJour >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {soldeJour >= 0 ? '+' : ''}{formatMontant(soldeJour)}
                </p>
              </div>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <p className="text-muted-foreground">Entrées</p>
                <p className="font-semibold text-success">+{formatMontant(entreesJour)}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Sorties</p>
                <p className="font-semibold text-destructive">-{formatMontant(sortiesJour)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <DocumentStatCard title="Solde Caisse" value={formatMontant(soldeCaisse)} icon={Wallet} subtitle="espèces" variant={soldeCaisse >= 0 ? "primary" : "danger"} delay={0} />
        <DocumentStatCard title="Total Entrées" value={formatMontant(totalEntrees)} icon={ArrowDownCircle} subtitle="paiements reçus" variant="success" delay={0.1} />
        <DocumentStatCard title="Total Sorties" value={formatMontant(totalSorties)} icon={ArrowUpCircle} subtitle="dépenses" variant="danger" delay={0.2} />
        <DocumentStatCard title="Opérations" value={totalItems} icon={Receipt} subtitle={`${entreesCount} entrées, ${sortiesCount} sorties`} delay={0.3} />
      </div>
    </>
  );
}
