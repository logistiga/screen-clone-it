import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";

interface Props {
  stats: any;
  isLoadingStats: boolean;
}

export function UtilisateursStatsCards({ stats, isLoadingStats }: Props) {
  if (isLoadingStats) {
    return (
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-8 w-16" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Total Utilisateurs</p><p className="text-2xl font-bold">{stats?.total || 0}</p></div>
            <div className="p-3 bg-primary/10 rounded-full"><Users className="h-5 w-5 text-primary" /></div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Actifs</p><p className="text-2xl font-bold text-green-600">{stats?.actifs || 0}</p></div>
            <div className="p-3 bg-green-500/10 rounded-full"><UserCheck className="h-5 w-5 text-green-500" /></div>
          </div>
          {stats && stats.total > 0 && <Progress value={(stats.actifs / stats.total) * 100} className="h-1.5 mt-3" />}
        </CardContent>
      </Card>
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Inactifs</p><p className="text-2xl font-bold text-amber-600">{stats?.inactifs || 0}</p></div>
            <div className="p-3 bg-amber-500/10 rounded-full"><UserX className="h-5 w-5 text-amber-500" /></div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Nouveaux ce mois</p><p className="text-2xl font-bold text-blue-600">{stats?.nouveaux_ce_mois || 0}</p></div>
            <div className="p-3 bg-blue-500/10 rounded-full"><TrendingUp className="h-5 w-5 text-blue-500" /></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
