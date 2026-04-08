import { Clock, Link as LinkIcon, CheckCircle2, Package } from "lucide-react";
import { DocumentStatCard } from "@/components/shared/documents";
import { ConteneursTraitesStats } from "@/lib/api/conteneurs-traites";

interface Props {
  stats: ConteneursTraitesStats | undefined;
}

export function ConteneursStatsCards({ stats }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <DocumentStatCard title="En attente" value={stats?.en_attente || 0} icon={Clock} variant="warning" subtitle="À traiter" delay={0} />
      <DocumentStatCard title="Affectés" value={stats?.affectes || 0} icon={LinkIcon} variant="info" subtitle="Ordres créés" delay={0.1} />
      <DocumentStatCard title="Facturés" value={stats?.factures || 0} icon={CheckCircle2} variant="success" subtitle="Terminés" delay={0.2} />
      <DocumentStatCard title="Total" value={stats?.total || 0} icon={Package} variant="primary" subtitle="Tous conteneurs" delay={0.3} />
    </div>
  );
}
