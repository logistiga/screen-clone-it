import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DevisStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const variantStyles = {
  default: {
    gradient: "from-muted/50 to-muted/30",
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    valueColor: "text-foreground",
  },
  primary: {
    gradient: "from-primary/10 to-primary/5",
    iconBg: "bg-primary/20",
    iconColor: "text-primary",
    valueColor: "text-primary",
  },
  success: {
    gradient: "from-emerald-500/10 to-emerald-500/5",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-600",
    valueColor: "text-emerald-600",
  },
  warning: {
    gradient: "from-amber-500/10 to-amber-500/5",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-600",
    valueColor: "text-amber-600",
  },
  danger: {
    gradient: "from-red-500/10 to-red-500/5",
    iconBg: "bg-red-500/20",
    iconColor: "text-red-600",
    valueColor: "text-red-600",
  },
  info: {
    gradient: "from-blue-500/10 to-blue-500/5",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-600",
    valueColor: "text-blue-600",
  },
};

export function DevisStatCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  subtitle,
  trend,
}: DevisStatCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
      "bg-gradient-to-br",
      styles.gradient
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn("text-2xl font-bold tracking-tight", styles.valueColor)}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend.isPositive ? "text-emerald-600" : "text-red-600"
              )}>
                <span>{trend.isPositive ? "↑" : "↓"}</span>
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-xl",
            styles.iconBg
          )}>
            <Icon className={cn("h-5 w-5", styles.iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DevisStatCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}
