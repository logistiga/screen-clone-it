import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { mouvementsCaisse, paiements, formatMontant, formatDate } from "@/data/mockData";

export default function CaissePage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrer uniquement les mouvements de caisse (espèces)
  const mouvementsCaisseFiltered = mouvementsCaisse.filter(m => m.source === 'caisse');
  
  const totalEntrees = mouvementsCaisseFiltered
    .filter(m => m.type === 'entree')
    .reduce((sum, m) => sum + m.montant, 0);
  
  const totalSorties = mouvementsCaisseFiltered
    .filter(m => m.type === 'sortie')
    .reduce((sum, m) => sum + m.montant, 0);

  const soldeCaisse = totalEntrees - totalSorties;

  const filteredMouvements = mouvementsCaisseFiltered.filter(m =>
    m.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout title="Caisse">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Solde Caisse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMontant(soldeCaisse)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Entrées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatMontant(totalEntrees)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Sorties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatMontant(totalSorties)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Opérations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mouvementsCaisseFiltered.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 text-green-600">
              <ArrowDownCircle className="h-4 w-4" />
              Entrée
            </Button>
            <Button variant="outline" className="gap-2 text-destructive">
              <ArrowUpCircle className="h-4 w-4" />
              Sortie
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMouvements.map((mouvement) => (
                  <TableRow key={mouvement.id}>
                    <TableCell>{formatDate(mouvement.date)}</TableCell>
                    <TableCell>
                      {mouvement.type === 'entree' ? (
                        <Badge className="bg-green-100 text-green-800">Entrée</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">Sortie</Badge>
                      )}
                    </TableCell>
                    <TableCell>{mouvement.description}</TableCell>
                    <TableCell className={`text-right font-medium ${
                      mouvement.type === 'entree' ? 'text-green-600' : 'text-destructive'
                    }`}>
                      {mouvement.type === 'entree' ? '+' : '-'}{formatMontant(mouvement.montant)}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredMouvements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Aucun mouvement de caisse
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
