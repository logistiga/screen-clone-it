import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit } from "lucide-react";
import { banques, formatMontant } from "@/data/mockData";

export default function BanquesPage() {
  return (
    <MainLayout title="Gestion des Banques">
      <div className="space-y-6">
        <div className="flex justify-end"><Button className="gap-2"><Plus className="h-4 w-4" />Nouvelle banque</Button></div>
        <Card><CardContent className="p-0">
          <Table><TableHeader><TableRow className="bg-muted/50"><TableHead>Banque</TableHead><TableHead>N° Compte</TableHead><TableHead>IBAN</TableHead><TableHead>SWIFT</TableHead><TableHead>Solde</TableHead><TableHead>Statut</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>{banques.map(b => (
              <TableRow key={b.id}><TableCell className="font-medium">{b.nom}</TableCell><TableCell>{b.numeroCompte}</TableCell><TableCell>{b.iban}</TableCell><TableCell>{b.swift}</TableCell><TableCell>{formatMontant(b.solde)}</TableCell><TableCell>{b.actif ? <Badge className="bg-green-100 text-green-800">Actif</Badge> : <Badge variant="secondary">Inactif</Badge>}</TableCell><TableCell><Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button></TableCell></TableRow>
            ))}</TableBody></Table>
        </CardContent></Card>
      </div>
    </MainLayout>
  );
}
