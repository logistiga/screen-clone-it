import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { actionsAudit, utilisateurs, formatDate } from "@/data/mockData";

export default function TracabilitePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("all");

  const filtered = actionsAudit.filter(a => {
    const matchSearch = a.details.toLowerCase().includes(searchTerm.toLowerCase()) || a.documentNumero?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchUser = userFilter === "all" || a.utilisateurId === userFilter;
    return matchSearch && matchUser;
  });

  return (
    <MainLayout title="Traçabilité">
      <div className="space-y-6">
        <div className="flex gap-4">
          <div className="relative w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" /></div>
          <Select value={userFilter} onValueChange={setUserFilter}><SelectTrigger className="w-48"><SelectValue placeholder="Tous les utilisateurs" /></SelectTrigger><SelectContent><SelectItem value="all">Tous</SelectItem>{utilisateurs.map(u => <SelectItem key={u.id} value={u.id}>{u.nom}</SelectItem>)}</SelectContent></Select>
        </div>
        <Card><CardContent className="p-0">
          <Table><TableHeader><TableRow className="bg-muted/50"><TableHead>Date</TableHead><TableHead>Utilisateur</TableHead><TableHead>Module</TableHead><TableHead>Action</TableHead><TableHead>Document</TableHead><TableHead>Détails</TableHead></TableRow></TableHeader>
            <TableBody>{filtered.map(a => {
              const user = utilisateurs.find(u => u.id === a.utilisateurId);
              return <TableRow key={a.id}><TableCell>{formatDate(a.date)}</TableCell><TableCell>{user?.nom}</TableCell><TableCell className="capitalize">{a.module}</TableCell><TableCell className="capitalize">{a.action}</TableCell><TableCell>{a.documentNumero || '-'}</TableCell><TableCell className="max-w-[300px] truncate">{a.details}</TableCell></TableRow>;
            })}</TableBody></Table>
        </CardContent></Card>
      </div>
    </MainLayout>
  );
}
