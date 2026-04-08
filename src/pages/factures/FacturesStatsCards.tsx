import { Receipt, TrendingUp, CreditCard, Clock } from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { DocumentStatCard } from "@/components/shared/documents";

interface FacturesStatsCardsProps {
  totalItems: number;
  totalFactures: number;
  totalPaye: number;
  facturesEnAttente: number;
}

export function FacturesStatsCards({ totalItems, totalFactures, totalPaye, facturesEnAttente }: FacturesStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <DocumentStatCard title="Total Factures" value={totalItems} icon={Receipt} variant="primary" subtitle="Documents créés" delay={0} />
      <DocumentStatCard title="Montant Total" value={formatMontant(totalFactures)} icon={TrendingUp} variant="info" subtitle="Valeur cumulée" delay={0.1} />
      <DocumentStatCard title="Total Encaissé" value={formatMontant(totalPaye)} icon={CreditCard} variant="success" subtitle={`${totalFactures > 0 ? Math.round((totalPaye / totalFactures) * 100) : 0}% encaissé`} delay={0.2} />
      <DocumentStatCard title="En attente" value={facturesEnAttente} icon={Clock} variant="warning" subtitle="Brouillons et validées" delay={0.3} />
    </div>
  );
}
