import { FileText, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { DocumentStatCard } from "@/components/shared/documents";

interface DevisStatsCardsProps {
  totalItems: number;
  totalMontant: number;
  devisAcceptes: number;
  devisEnAttente: number;
}

export function DevisStatsCards({ totalItems, totalMontant, devisAcceptes, devisEnAttente }: DevisStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <DocumentStatCard title="Total Devis" value={totalItems} icon={FileText} variant="primary" subtitle="Documents créés" delay={0} />
      <DocumentStatCard title="Montant Total" value={formatMontant(totalMontant)} icon={TrendingUp} variant="info" subtitle="Valeur cumulée" delay={0.1} />
      <DocumentStatCard title="Acceptés" value={devisAcceptes} icon={CheckCircle} variant="success" subtitle={`${totalItems > 0 ? Math.round((devisAcceptes / totalItems) * 100) : 0}% de conversion`} delay={0.2} />
      <DocumentStatCard title="En attente" value={devisEnAttente} icon={Clock} variant="warning" subtitle="Brouillons et envoyés" delay={0.3} />
    </div>
  );
}
