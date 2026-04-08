import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Plus, Edit, Trash2 } from "lucide-react";
import { itemVariants } from "./constants";

interface TracabiliteStatsCardsProps {
  stats: any;
  isLoadingStats: boolean;
}

export function TracabiliteStatsCards({ stats, isLoadingStats }: TracabiliteStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <motion.div variants={itemVariants}>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total actions</p>
                {isLoadingStats ? <Skeleton className="h-8 w-16 mt-1" /> : <p className="text-2xl font-bold">{stats?.total?.toLocaleString() || 0}</p>}
              </div>
              <div className="p-3 rounded-full bg-primary/10"><Activity className="h-5 w-5 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Créations</p>
                {isLoadingStats ? <Skeleton className="h-8 w-16 mt-1" /> : <p className="text-2xl font-bold text-emerald-600">{stats?.par_action?.find((a: any) => a.action === 'create')?.total || 0}</p>}
              </div>
              <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30"><Plus className="h-5 w-5 text-emerald-600" /></div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Modifications</p>
                {isLoadingStats ? <Skeleton className="h-8 w-16 mt-1" /> : <p className="text-2xl font-bold text-blue-600">{stats?.par_action?.find((a: any) => a.action === 'update')?.total || 0}</p>}
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30"><Edit className="h-5 w-5 text-blue-600" /></div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Suppressions</p>
                {isLoadingStats ? <Skeleton className="h-8 w-16 mt-1" /> : <p className="text-2xl font-bold text-red-600">{stats?.par_action?.find((a: any) => a.action === 'delete')?.total || 0}</p>}
              </div>
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30"><Trash2 className="h-5 w-5 text-red-600" /></div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
