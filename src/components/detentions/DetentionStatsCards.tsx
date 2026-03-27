import { Container, Users, Building2, Calendar, AlertTriangle, DollarSign } from "lucide-react";
import { DocumentStatCard } from "@/components/shared/documents/DocumentStatCard";
import { formatMontant } from "@/data/mockData";
import type { DetentionStats } from "@/hooks/use-detentions-attente";

interface Props {
  stats: DetentionStats | undefined;
  isLoading: boolean;
}

export function DetentionStatsCards({ stats, isLoading }: Props) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <DocumentStatCard
        title="Total conteneurs"
        value={stats.total}
        icon={Container}
        subtitle={`${stats.total_client} client · ${stats.total_compagnie} compagnie`}
      />
      <DocumentStatCard
        title="Coût total"
        value={formatMontant(stats.cout_total)}
        icon={DollarSign}
        subtitle={`Client: ${formatMontant(stats.cout_client)} · Cie: ${formatMontant(stats.cout_compagnie)}`}
      />
      <DocumentStatCard
        title="Jours détention"
        value={`Moy: ${stats.jours_moyen}j`}
        icon={Calendar}
        subtitle={`Max: ${stats.jours_max} jours`}
      />
      <DocumentStatCard
        title="Non payés"
        value={stats.non_payes}
        icon={AlertTriangle}
        subtitle="En attente de paiement"
      />
    </div>
  );
}
