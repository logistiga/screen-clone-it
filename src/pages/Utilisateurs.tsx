import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { utilisateurs, roles, formatDate } from "@/data/mockData";

export default function UtilisateursPage() {
  return (
    <MainLayout title="Utilisateurs">
      <div className="space-y-6">
        <div className="flex justify-end"><Button className="gap-2"><Plus className="h-4 w-4" />Nouvel utilisateur</Button></div>
        <Card><CardContent className="p-0">
          <Table><TableHeader><TableRow className="bg-muted/50"><TableHead>Nom</TableHead><TableHead>Email</TableHead><TableHead>Rôle</TableHead><TableHead>Statut</TableHead><TableHead>Dernière connexion</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>{utilisateurs.map(u => {
              const role = roles.find(r => r.id === u.roleId);
              return <TableRow key={u.id}><TableCell className="font-medium">{u.nom}</TableCell><TableCell>{u.email}</TableCell><TableCell><Badge variant="outline">{role?.nom}</Badge></TableCell><TableCell>{u.actif ? <Badge className="bg-green-100 text-green-800">Actif</Badge> : <Badge variant="secondary">Inactif</Badge>}</TableCell><TableCell>{u.derniereConnexion ? formatDate(u.derniereConnexion) : '-'}</TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>;
            })}</TableBody></Table>
        </CardContent></Card>
      </div>
    </MainLayout>
  );
}
