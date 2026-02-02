import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type DocumentStatVariant = "default" | "primary" | "success" | "warning" | "danger" | "info";

interface DocumentStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: DocumentStatVariant;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  delay?: number;
}

const variantStyles: Record<DocumentStatVariant, {
  gradient: string;
  iconBg: string;
  iconColor: string;
  valueColor: string;
  borderColor: string;
}> = {
  default: {
    gradient: "from-muted/50 to-muted/30",
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    valueColor: "text-foreground",
    borderColor: "border-l-muted-foreground",
  },
  primary: {
    gradient: "from-primary/10 to-primary/5",
    iconBg: "bg-primary/20",
    iconColor: "text-primary",
    valueColor: "text-primary",
    borderColor: "border-l-primary",
  },
  success: {
    gradient: "from-emerald-500/10 to-emerald-500/5",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    valueColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-l-emerald-500",
  },
  warning: {
    gradient: "from-amber-500/10 to-amber-500/5",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    valueColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-l-amber-500",
  },
  danger: {
    gradient: "from-red-500/10 to-red-500/5",
    iconBg: "bg-red-500/20",
    iconColor: "text-red-600 dark:text-red-400",
    valueColor: "text-red-600 dark:text-red-400",
    borderColor: "border-l-red-500",
  },
  info: {
    gradient: "from-blue-500/10 to-blue-500/5",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    valueColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-l-blue-500",
  },
};

export const DocumentStatCard = React.forwardRef<
  HTMLDivElement,
  DocumentStatCardProps
>(({
  title,
  value,
  icon: Icon,
  variant = "default",
  subtitle,
  trend,
  delay = 0,
}, ref) => {
  const styles = variantStyles[variant];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        "bg-gradient-to-br border-l-4",
        styles.gradient,
        styles.borderColor
      )}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", styles.iconBg)}>
            <Icon className={cn("h-4 w-4", styles.iconColor)} />
          </div>
        </CardHeader>
        <CardContent>
          <motion.div
            className={cn("text-2xl md:text-3xl font-bold tracking-tight", styles.valueColor)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.2, duration: 0.3 }}
          >
            {value}
          </motion.div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium mt-2",
              trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            )}>
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground">vs mois dernier</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});
DocumentStatCard.displayName = "DocumentStatCard";

export function DocumentStatCardSkeleton() {
  return (
    <Card className="overflow-hidden border-l-4 border-l-muted">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-20 mt-2" />
      </CardContent>
    </Card>
  );
}
