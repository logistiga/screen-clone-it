import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Receipt, Banknote, TrendingUp } from "lucide-react";
import { formatMontant } from "@/data/mockData";

interface Props {
  stats: {
    total: number;
    totalSolde: number;
    totalAvoirs: number;
    withSolde: number;
    serverTotal: number;
  };
}

export function ClientsStatsCards({ stats }: Props) {
  const cards = [
    {
      title: "Total clients", value: String(stats.serverTotal || stats.total), subtitle: "clients actifs",
      icon: Users, gradient: "from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200/50 dark:border-blue-800/50",
      titleColor: "text-blue-700 dark:text-blue-300", iconColor: "text-blue-600 dark:text-blue-400",
      valueColor: "text-blue-900 dark:text-blue-100", subtitleColor: "text-blue-600/70 dark:text-blue-400/70",
      large: true,
    },
    {
      title: "Solde total dû", value: formatMontant(stats.totalSolde), subtitle: "créances en cours",
      icon: Receipt, gradient: "from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30 border-amber-200/50 dark:border-amber-800/50",
      titleColor: "text-amber-700 dark:text-amber-300", iconColor: "text-amber-600 dark:text-amber-400",
      valueColor: "text-amber-900 dark:text-amber-100", subtitleColor: "text-amber-600/70 dark:text-amber-400/70",
    },
    {
      title: "Total avoirs", value: formatMontant(stats.totalAvoirs), subtitle: "avoirs disponibles",
      icon: Banknote, gradient: "from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30 border-emerald-200/50 dark:border-emerald-800/50",
      titleColor: "text-emerald-700 dark:text-emerald-300", iconColor: "text-emerald-600 dark:text-emerald-400",
      valueColor: "text-emerald-900 dark:text-emerald-100", subtitleColor: "text-emerald-600/70 dark:text-emerald-400/70",
    },
    {
      title: "Avec solde", value: String(stats.withSolde),
      subtitle: `${stats.total > 0 ? Math.round((stats.withSolde / stats.total) * 100) : 0}% des clients`,
      icon: TrendingUp, gradient: "from-rose-50 to-rose-100/50 dark:from-rose-950/50 dark:to-rose-900/30 border-rose-200/50 dark:border-rose-800/50",
      titleColor: "text-rose-700 dark:text-rose-300", iconColor: "text-rose-600 dark:text-rose-400",
      valueColor: "text-rose-900 dark:text-rose-100", subtitleColor: "text-rose-600/70 dark:text-rose-400/70",
      large: true,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ title, value, subtitle, icon: Icon, gradient, titleColor, iconColor, valueColor, subtitleColor, large }) => (
        <Card key={title} className={`hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br ${gradient}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${titleColor}`}>{title}</CardTitle>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </CardHeader>
          <CardContent>
            <div className={`${large ? 'text-3xl' : 'text-2xl'} font-bold ${valueColor}`}>{value}</div>
            <p className={`text-xs ${subtitleColor} mt-1`}>{subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
