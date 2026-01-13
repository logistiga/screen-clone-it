import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "primary" | "success" | "warning" | "muted";
  className?: string;
}

const variantStyles = {
  default: {
    card: "bg-card border",
    icon: "bg-muted text-muted-foreground",
    value: "text-foreground",
  },
  primary: {
    card: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20",
    icon: "bg-primary/20 text-primary",
    value: "text-primary",
  },
  success: {
    card: "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
    icon: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    value: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    card: "bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20",
    icon: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
    value: "text-amber-600 dark:text-amber-400",
  },
  muted: {
    card: "bg-muted/50 border-muted",
    icon: "bg-muted-foreground/10 text-muted-foreground",
    value: "text-muted-foreground",
  },
};

export function StatCard({ title, value, subtitle, icon: Icon, variant = "default", className }: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className={cn("rounded-xl border p-4 transition-all hover:shadow-md", styles.card, className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn("text-2xl font-bold", styles.value)}>{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn("rounded-lg p-2.5", styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
