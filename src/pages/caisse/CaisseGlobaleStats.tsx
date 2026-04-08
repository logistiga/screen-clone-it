import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownCircle, ArrowUpCircle, Building2, Wallet, PieChart } from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { DocumentStatCard } from "@/components/shared/documents/DocumentStatCard";

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

interface CaisseGlobaleStatsProps {
  soldeGlobal: number;
  soldeCaisse: number;
  soldeBanques: number;
  totalEntrees: number;
  totalSorties: number;
  totalEntreesCaisse: number;
  totalSortiesCaisse: number;
  totalEntreesBanque: number;
  totalSortiesBanque: number;
}

export function CaisseGlobaleStats({
  soldeGlobal, soldeCaisse, soldeBanques, totalEntrees, totalSorties,
  totalEntreesCaisse, totalSortiesCaisse, totalEntreesBanque, totalSortiesBanque,
}: CaisseGlobaleStatsProps) {
  return (
    <>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <DocumentStatCard title="Solde Global" value={formatMontant(soldeGlobal)} icon={PieChart} subtitle="trésorerie totale" variant={soldeGlobal >= 0 ? "primary" : "danger"} delay={0} />
        <DocumentStatCard title="Solde Caisse" value={formatMontant(soldeCaisse)} icon={Wallet} subtitle="espèces" variant="info" delay={0.1} />
        <DocumentStatCard title="Solde Banques" value={formatMontant(soldeBanques)} icon={Building2} subtitle="virements & chèques" variant="info" delay={0.2} />
        <DocumentStatCard title="Total Entrées" value={formatMontant(totalEntrees)} icon={ArrowDownCircle} subtitle="encaissements" variant="success" delay={0.3} />
        <DocumentStatCard title="Total Sorties" value={formatMontant(totalSorties)} icon={ArrowUpCircle} subtitle="décaissements" variant="danger" delay={0.4} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-emerald-500/10 to-transparent border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-lg bg-emerald-500/20"><Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
                Caisse (Espèces)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-sm text-muted-foreground">Entrées</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">+{formatMontant(totalEntreesCaisse)}</p>
                </div>
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                  <p className="text-sm text-muted-foreground">Sorties</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">-{formatMontant(totalSortiesCaisse)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/10 to-transparent border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-lg bg-blue-500/20"><Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
                Banques
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-sm text-muted-foreground">Entrées</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">+{formatMontant(totalEntreesBanque)}</p>
                </div>
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                  <p className="text-sm text-muted-foreground">Sorties</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">-{formatMontant(totalSortiesBanque)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
