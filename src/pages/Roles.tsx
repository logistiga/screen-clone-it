import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { roles } from "@/data/mockData";

const modules = ['clients', 'devis', 'ordres', 'factures', 'caisse', 'banque', 'reporting', 'parametrage'];
const actions = ['voir', 'creer', 'modifier', 'supprimer', 'valider', 'annuler', 'paiement', 'exporter'];

export default function RolesPage() {
  return (
    <MainLayout title="Gestion des Rôles">
      <div className="space-y-6">
        <div className="flex justify-end"><Button className="gap-2"><Plus className="h-4 w-4" />Nouveau rôle</Button></div>
        <div className="grid gap-6">{roles.map(role => (
          <Card key={role.id}><CardHeader><CardTitle>{role.nom}</CardTitle><p className="text-sm text-muted-foreground">{role.description}</p></CardHeader>
            <CardContent><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{modules.map(mod => (
              <div key={mod} className="space-y-2"><h4 className="font-medium capitalize">{mod}</h4>
                {actions.slice(0, 4).map(action => {
                  const perm = role.permissions.find(p => p.module === mod && p.action === action);
                  return <div key={action} className="flex items-center gap-2"><Checkbox checked={perm?.autorise} disabled /><span className="text-sm capitalize">{action}</span></div>;
                })}
              </div>
            ))}</div></CardContent>
          </Card>
        ))}</div>
      </div>
    </MainLayout>
  );
}
