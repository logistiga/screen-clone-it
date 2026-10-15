import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Lock } from "lucide-react";
import { CATEGORY_LABELS, getPermissionsByModule } from "@/config/permissionsConfig";
import { useRoles, useRole, useUpdateRole } from "@/hooks/use-roles";

const GLOBAL = ['voir', 'creer', 'modifier', 'supprimer'];
const GLOBAL_LABELS: Record<string, string> = { voir: 'Voir', creer: 'Créer', modifier: 'Modifier', supprimer: 'Supprimer' };
const SYSTEM_ROLES = ['administrateur', 'directeur'];

export function RolesMatriceTab() {
  const modules = useMemo(() => getPermissionsByModule(), []);
  const { data: rolesData } = useRoles({ per_page: 100 });
  const roles = rolesData?.data ?? [];
  const [roleId, setRoleId] = useState<number | null>(null);
  const { data: role, isLoading } = useRole(roleId);
  const updateRole = useUpdateRole();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!roleId && roles.length) {
      const first = roles.find(r => !SYSTEM_ROLES.includes(r.name)) ?? roles[0];
      setRoleId(first.id);
    }
  }, [roles, roleId]);

  useEffect(() => { setSelected(new Set(role?.permissions ?? [])); }, [role]);

  const locked = !!role && SYSTEM_ROLES.includes(role.name);
  const dirty = useMemo(() => {
    const orig = new Set(role?.permissions ?? []);
    return orig.size !== selected.size || [...selected].some(p => !orig.has(p));
  }, [role, selected]);

  const toggle = (name: string) => {
    if (locked) return;
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(name)) n.delete(name); else n.add(name);
      return n;
    });
  };

  const toggleModule = (names: string[]) => {
    if (locked) return;
    const all = names.every(n => selected.has(n));
    setSelected(prev => {
      const n = new Set(prev);
      names.forEach(p => (all ? n.delete(p) : n.add(p)));
      return n;
    });
  };

  const save = () => {
    if (!role || locked) return;
    updateRole.mutate({ id: role.id, data: { permissions: [...selected] } });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Matrice des droits</CardTitle>
          <CardDescription>Choisissez un rôle, cochez ses droits puis enregistrez.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={roleId ? String(roleId) : undefined} onValueChange={v => setRoleId(Number(v))}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Choisir un rôle" /></SelectTrigger>
            <SelectContent>
              {roles.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={save} disabled={!dirty || locked || updateRole.isPending} className="gap-1.5">
            {updateRole.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {locked && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" /> Ce rôle système a tous les droits et ne peut pas être modifié.
          </div>
        )}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-6 pr-3">
              {Object.entries(CATEGORY_LABELS).map(([cat, catLabel]) => {
                const mods = modules.filter(m => m.category === cat);
                if (!mods.length) return null;
                return (
                  <div key={cat} className="space-y-2">
                    <h3 className="font-semibold text-sm">{catLabel}</h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left py-2 px-3 font-medium w-48">Module</th>
                          {GLOBAL.map(a => <th key={a} className="text-center py-2 px-2 font-medium">{GLOBAL_LABELS[a]}</th>)}
                          <th className="text-left py-2 px-3 font-medium">Actions spécifiques</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mods.map(m => {
                          const names = m.permissions.map(p => p.name);
                          const count = names.filter(n => locked || selected.has(n)).length;
                          const specific = m.permissions.filter(p => !GLOBAL.includes(p.action));
                          return (
                            <tr key={m.module} className="border-b last:border-0 hover:bg-muted/50">
                              <td className="py-2 px-3">
                                <button type="button" onClick={() => toggleModule(names)} className="flex items-center gap-2 text-left font-medium">
                                  {m.label}
                                  <Badge variant="outline" className="text-xs">{count}/{names.length}</Badge>
                                </button>
                              </td>
                              {GLOBAL.map(a => {
                                const p = m.permissions.find(x => x.action === a);
                                return (
                                  <td key={a} className="text-center py-2 px-2">
                                    {p ? <Checkbox checked={locked || selected.has(p.name)} disabled={locked} onCheckedChange={() => toggle(p.name)} /> : <span className="text-muted-foreground">-</span>}
                                  </td>
                                );
                              })}
                              <td className="py-2 px-3">
                                <div className="flex flex-wrap gap-3">
                                  {specific.map(p => (
                                    <label key={p.name} className="flex items-center gap-1.5 text-xs cursor-pointer">
                                      <Checkbox checked={locked || selected.has(p.name)} disabled={locked} onCheckedChange={() => toggle(p.name)} />
                                      {p.label}
                                    </label>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
