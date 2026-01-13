import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ClientHealthBadgeProps {
  solde: number;
  totalFactures?: number;
  className?: string;
  showLabel?: boolean;
}

type HealthStatus = "excellent" | "good" | "warning" | "danger";

const getHealthStatus = (solde: number, totalFactures: number = 0): HealthStatus => {
  // Si pas de solde, excellent
  if (solde <= 0) return "excellent";
  
  // Si ratio solde/factures > 50%, danger
  if (totalFactures > 0 && (solde / totalFactures) > 0.5) return "danger";
  
  // Si solde > 1M, warning
  if (solde > 1000000) return "warning";
  
  // Si solde modéré
  if (solde > 100000) return "good";
  
  return "excellent";
};

const healthConfig: Record<HealthStatus, {
  icon: typeof CheckCircle2;
  color: string;
  bgColor: string;
  label: string;
  description: string;
}> = {
  excellent: {
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    label: "Excellent",
    description: "Client à jour de ses paiements",
  },
  good: {
    icon: TrendingUp,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    label: "Bon",
    description: "Solde modéré, suivi normal",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    label: "Attention",
    description: "Créances importantes, à surveiller",
  },
  danger: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    label: "Critique",
    description: "Ratio de créances élevé, action requise",
  },
};

export function ClientHealthBadge({ 
  solde, 
  totalFactures = 0, 
  className, 
  showLabel = false 
}: ClientHealthBadgeProps) {
  const status = getHealthStatus(solde, totalFactures);
  const config = healthConfig[status];
  const Icon = config.icon;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 cursor-default",
              config.bgColor,
              config.color,
              className
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {showLabel && <span>{config.label}</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{config.label}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
