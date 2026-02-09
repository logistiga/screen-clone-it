import * as React from "react";
import { motion } from "framer-motion";
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
  compact?: boolean;
}

const variantStyles: Record<DocumentStatVariant, {
  iconBg: string;
  iconColor: string;
  valueColor: string;
  borderColor: string;
}> = {
  default: {
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    valueColor: "text-foreground",
    borderColor: "border-border",
  },
  primary: {
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    valueColor: "text-primary",
    borderColor: "border-primary/30",
  },
  success: {
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    valueColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-500/30",
  },
  warning: {
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    valueColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-500/30",
  },
  danger: {
    iconBg: "bg-red-500/10",
    iconColor: "text-red-600 dark:text-red-400",
    valueColor: "text-red-600 dark:text-red-400",
    borderColor: "border-red-500/30",
  },
  info: {
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    valueColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-500/30",
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
  compact = false,
}, ref) => {
  const styles = variantStyles[variant];
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className={cn(
        "relative bg-card rounded-xl border p-4 transition-all duration-200 hover:shadow-md",
        styles.borderColor,
        compact && "p-3"
      )}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          <div className={cn("p-1.5 rounded-lg", styles.iconBg)}>
            <Icon className={cn("h-3.5 w-3.5", styles.iconColor)} />
          </div>
        </div>
        <motion.div
          className={cn(
            "font-bold tracking-tight leading-none",
            styles.valueColor,
            compact ? "text-lg" : "text-xl"
          )}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: delay + 0.15, duration: 0.25 }}
        >
          {value}
        </motion.div>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground mt-1.5">{subtitle}</p>
        )}
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-[11px] font-medium mt-1.5",
            trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          )}>
            <span>{trend.isPositive ? "↑" : "↓"}</span>
            <span>{Math.abs(trend.value)}%</span>
            <span className="text-muted-foreground">vs mois dernier</span>
          </div>
        )}
      </div>
    </motion.div>
  );
});
DocumentStatCard.displayName = "DocumentStatCard";

export function DocumentStatCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border p-4 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-3 w-16 bg-muted rounded" />
        <div className="h-7 w-7 bg-muted rounded-lg" />
      </div>
      <div className="h-6 w-24 bg-muted rounded mt-1" />
    </div>
  );
}
