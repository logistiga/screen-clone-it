import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Lock, Users, Layers } from "lucide-react";
import { MODULES } from "@/config/permissionsConfig";

interface RolesStatsCardsProps {
  isLoading: boolean;
  stats: {
    totalRoles: number;
    totalPermissions: number;
    totalUsers: number;
  } | null;
  totalLocalPermissions: number;
}

export function RolesStatsCards({ isLoading, stats, totalLocalPermissions }: RolesStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-8 w-16" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const cards = [
    { label: "Total Rôles", value: stats?.totalRoles || 0, icon: Shield, color: "border-primary/20 bg-primary/5", iconColor: "bg-primary/10 text-primary", delay: 0 },
    { label: "Permissions", value: totalLocalPermissions, icon: Lock, color: "border-blue-500/20 bg-blue-500/5", iconColor: "bg-blue-500/10 text-blue-500", delay: 0.1 },
    { label: "Utilisateurs", value: stats?.totalUsers || 0, icon: Users, color: "border-green-500/20 bg-green-500/5", iconColor: "bg-green-500/10 text-green-500", delay: 0.2 },
    { label: "Modules", value: MODULES.length, icon: Layers, color: "border-amber-500/20 bg-amber-500/5", iconColor: "bg-amber-500/10 text-amber-500", delay: 0.3 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, color, iconColor, delay }) => (
        <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
          <Card className={color}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
                <div className={`p-3 rounded-full ${iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
