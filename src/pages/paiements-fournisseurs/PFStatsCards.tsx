import { Receipt, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { DocumentStatCard } from "@/components/shared/documents";

interface PFStatsCardsProps {
  stats: any;
}

export function PFStatsCards({ stats }: PFStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <DocumentStatCard
        title="Total factures"
        value={stats?.total_factures || 0}
        icon={Receipt}
        subtitle={formatMontant(stats?.montant_total || 0)}
        variant="primary"
        delay={0}
      />
      <DocumentStatCard
        title="Total payé"
        value={formatMontant(stats?.total_paye || 0)}
        icon={CheckCircle2}
        subtitle={`${stats?.soldes || 0} factures soldées`}
        variant="success"
        delay={0.1}
      />
      <DocumentStatCard
        title="Reste à payer"
        value={formatMontant(stats?.reste_a_payer || 0)}
        icon={Clock}
        subtitle={`${stats?.en_cours || 0} en cours`}
        variant="warning"
        delay={0.2}
      />
      <DocumentStatCard
        title="Progression globale"
        value={stats?.montant_total > 0 ? `${Math.round((stats?.total_paye / stats?.montant_total) * 100)}%` : '0%'}
        icon={TrendingUp}
        subtitle="Taux de paiement"
        delay={0.3}
      />
    </div>
  );
}
