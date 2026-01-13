import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface DetailStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

const variantStyles = {
  default: {
    container: "bg-card border",
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    value: "text-foreground",
  },
  primary: {
    container: "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20",
    iconBg: "bg-primary/20",
    iconColor: "text-primary",
    value: "text-primary",
  },
  success: {
    container: "bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    value: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    container: "bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    value: "text-amber-600 dark:text-amber-400",
  },
  danger: {
    container: "bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border-red-500/20",
    iconBg: "bg-red-500/20",
    iconColor: "text-red-600 dark:text-red-400",
    value: "text-red-600 dark:text-red-400",
  },
};

export function DetailStatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = "default",
  className 
}: DetailStatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className={cn(
      "rounded-xl border p-4 transition-all hover:shadow-md",
      styles.container,
      className
    )}>
      <div className="flex items-center gap-3">
        <div className={cn("p-2.5 rounded-lg", styles.iconBg)}>
          <Icon className={cn("h-5 w-5", styles.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
          <p className={cn("text-xl font-bold", styles.value)}>{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function DetailStatCardSkeleton() {
  return (
    <div className="rounded-xl border p-4 bg-card">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
    </div>
  );
}
