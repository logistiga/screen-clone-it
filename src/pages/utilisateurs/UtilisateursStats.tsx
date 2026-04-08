import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Users, CheckCircle2, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLORS } from "./useUtilisateursData";

interface Props {
  stats: any;
  pieChartData: any[];
  isLoadingStats: boolean;
}

export function UtilisateursStats({ stats, pieChartData, isLoadingStats }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">Répartition par rôle</CardTitle></CardHeader>
        <CardContent>
          {isLoadingStats ? (
            <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : pieChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">Aucune donnée disponible</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Détail par rôle</CardTitle></CardHeader>
        <CardContent>
          {isLoadingStats ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : stats?.par_role && stats.par_role.length > 0 ? (
            <div className="space-y-3">
              {stats.par_role.map((item: any, index: number) => (
                <div key={item.role} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize">{item.role}</span>
                      <span className="text-sm text-muted-foreground">{item.count}</span>
                    </div>
                    <Progress value={(item.count / (stats?.total || 1)) * 100} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">Aucune donnée disponible</div>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader><CardTitle className="text-base">Résumé des utilisateurs</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center"><Users className="h-6 w-6 mx-auto mb-2 text-primary" /><p className="text-2xl font-bold">{stats?.total || 0}</p><p className="text-sm text-muted-foreground">Total</p></div>
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 text-center"><CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-600" /><p className="text-2xl font-bold text-green-600">{stats?.actifs || 0}</p><p className="text-sm text-muted-foreground">Actifs</p></div>
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-center"><AlertTriangle className="h-6 w-6 mx-auto mb-2 text-amber-600" /><p className="text-2xl font-bold text-amber-600">{stats?.inactifs || 0}</p><p className="text-sm text-muted-foreground">Inactifs</p></div>
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-center"><TrendingUp className="h-6 w-6 mx-auto mb-2 text-blue-600" /><p className="text-2xl font-bold text-blue-600">{stats?.nouveaux_ce_mois || 0}</p><p className="text-sm text-muted-foreground">Nouveaux ce mois</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
