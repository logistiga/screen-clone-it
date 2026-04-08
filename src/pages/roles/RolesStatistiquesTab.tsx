import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { CATEGORY_LABELS, getPermissionsByModule } from "@/config/permissionsConfig";

const CHART_COLORS = [
  'hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
  'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(142, 76%, 36%)',
];

const CATEGORY_COLORS: Record<string, string> = {
  commercial: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800',
  finance: 'bg-green-500/10 text-green-600 border-green-200 dark:border-green-800',
  stock: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800',
  administration: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800',
  reporting: 'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800',
};

interface Props {
  statsData: any;
}

export function RolesStatistiquesTab({ statsData }: Props) {
  const localPermissionModules = useMemo(() => getPermissionsByModule(), []);

  const pieChartData = useMemo(() => {
    if (!statsData?.roles_distribution) return [];
    return statsData.roles_distribution.map((r: any, i: number) => ({
      name: r.name, value: r.users_count, color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [statsData]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Distribution des utilisateurs par rôle</CardTitle></CardHeader>
        <CardContent className="h-80">
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieChartData.map((entry: any, index: number) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">Aucune donnée disponible</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Permissions par module</CardTitle></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={localPermissionModules.map(m => ({ module: m.label, count: m.permissions.length }))}>
              <XAxis dataKey="module" angle={-45} textAnchor="end" height={80} fontSize={11} />
              <YAxis /><Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader><CardTitle>Résumé par catégorie</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
              const categoryModules = localPermissionModules.filter(m => m.category === key);
              const totalPerms = categoryModules.reduce((sum, m) => sum + m.permissions.length, 0);
              return (
                <Card key={key} className={`border ${CATEGORY_COLORS[key] || ''}`}>
                  <CardContent className="p-4 text-center">
                    <h4 className="font-semibold text-sm mb-2">{label}</h4>
                    <p className="text-2xl font-bold">{categoryModules.length}</p>
                    <p className="text-xs text-muted-foreground">modules</p>
                    <p className="text-sm mt-2">{totalPerms} permissions</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
