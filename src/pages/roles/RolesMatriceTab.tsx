import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Check } from "lucide-react";
import { CATEGORY_LABELS, getPermissionsByModule } from "@/config/permissionsConfig";

// Module icons
import {
  Users, FileText, ClipboardList, Receipt, CreditCard, Wallet,
  Building2, TrendingUp, Handshake, Ship, Truck, Store,
  Package, Warehouse, FileStack, Settings, History,
  LayoutDashboard, BarChart3, ShieldCheck, Download,
} from "lucide-react";

const MODULE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  clients: Users, devis: FileText, ordres: ClipboardList, factures: Receipt,
  paiements: CreditCard, caisse: Wallet, banques: Building2, credits: TrendingUp,
  partenaires: Handshake, transitaires: Ship, transporteurs: Truck, fournisseurs: Store,
  produits: Package, stocks: Warehouse, notes: FileStack, utilisateurs: Users,
  roles: Shield, configuration: Settings, reporting: BarChart3, dashboard: LayoutDashboard,
  audit: History, securite: ShieldCheck, exports: Download,
};

const CATEGORY_COLORS: Record<string, string> = {
  commercial: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800',
  finance: 'bg-green-500/10 text-green-600 border-green-200 dark:border-green-800',
  stock: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800',
  administration: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800',
  reporting: 'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800',
};

export function RolesMatriceTab() {
  const localPermissionModules = useMemo(() => getPermissionsByModule(), []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matrice Modules × Actions</CardTitle>
        <CardDescription>Vue d'ensemble de toutes les permissions disponibles organisées par module et action</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-6">
            {Object.entries(CATEGORY_LABELS).map(([categoryKey, categoryLabel]) => {
              const categoryModules = localPermissionModules.filter(m => m.category === categoryKey);
              if (categoryModules.length === 0) return null;

              return (
                <div key={categoryKey} className="space-y-3">
                  <div className={`flex items-center gap-2 p-2 rounded-lg border ${CATEGORY_COLORS[categoryKey] || ''}`}>
                    <h3 className="font-semibold">{categoryLabel}</h3>
                    <Badge variant="outline" className="ml-auto">{categoryModules.length} modules</Badge>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium w-48">Module</th>
                          <th className="text-center py-2 px-2 font-medium">Voir</th>
                          <th className="text-center py-2 px-2 font-medium">Créer</th>
                          <th className="text-center py-2 px-2 font-medium">Modifier</th>
                          <th className="text-center py-2 px-2 font-medium">Supprimer</th>
                          <th className="text-left py-2 px-3 font-medium">Actions spécifiques</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryModules.map(module => {
                          const Icon = MODULE_ICONS[module.module] || Shield;
                          const hasAction = (action: string) => module.permissions.some(p => p.action === action);
                          const specificActions = module.permissions.filter(p => !['voir', 'creer', 'modifier', 'supprimer'].includes(p.action));

                          return (
                            <tr key={module.module} className="border-b last:border-0 hover:bg-muted/50">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{module.label}</span>
                                </div>
                              </td>
                              {['voir', 'creer', 'modifier', 'supprimer'].map(action => (
                                <td key={action} className="text-center py-3 px-2">
                                  {hasAction(action) ? <Check className="h-4 w-4 text-green-600 mx-auto" /> : <span className="text-muted-foreground">-</span>}
                                </td>
                              ))}
                              <td className="py-3 px-3">
                                <div className="flex flex-wrap gap-1">
                                  {specificActions.map(action => (
                                    <Badge key={action.name} variant="outline" className="text-xs">{action.label}</Badge>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
