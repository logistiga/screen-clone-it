import { motion } from "framer-motion";
import { CreditCard, TrendingDown, Wallet, Target, AlertTriangle } from "lucide-react";
import { DocumentStatCard, DocumentStatCardSkeleton } from "@/components/shared/documents/DocumentStatCard";
import { formatMontantCompact } from "./useCreditsData";
import { itemVariants } from "./constants";

interface CreditsStatsCardsProps {
  stats: any;
  loadingStats: boolean;
}

export function CreditsStatsCards({ stats, loadingStats }: CreditsStatsCardsProps) {
  return (
    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {loadingStats ? (
        Array.from({ length: 5 }).map((_, i) => <DocumentStatCardSkeleton key={i} />)
      ) : (
        <>
          <DocumentStatCard title="Total emprunté" value={formatMontantCompact(stats?.total_credits_actifs || 0)} icon={CreditCard} subtitle={`${stats?.nombre_credits_actifs || 0} crédits actifs`} variant="primary" delay={0} />
          <DocumentStatCard title="Total remboursé" value={formatMontantCompact(stats?.total_rembourse || 0)} icon={TrendingDown} subtitle={`${stats?.taux_remboursement_global?.toFixed(1) || 0}% du total`} variant="success" delay={0.1} />
          <DocumentStatCard title="Reste à payer" value={formatMontantCompact(stats?.reste_global || 0)} icon={Wallet} variant="warning" delay={0.2} />
          <DocumentStatCard title="Total intérêts" value={formatMontantCompact(stats?.total_interets || 0)} icon={Target} subtitle="Coût du financement" variant="info" delay={0.3} />
          <DocumentStatCard title="Échéances retard" value={stats?.echeances_en_retard || 0} icon={AlertTriangle} subtitle={(stats?.echeances_en_retard || 0) > 0 ? 'Action requise' : 'Tout est à jour'} variant={(stats?.echeances_en_retard || 0) > 0 ? "danger" : "default"} delay={0.4} />
        </>
      )}
    </motion.div>
  );
}
