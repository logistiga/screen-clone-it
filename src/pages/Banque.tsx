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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { mouvementsCaisse, banques, paiements, formatMontant, formatDate } from "@/data/mockData";

export default function BanquePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [banqueFilter, setBanqueFilter] = useState<string>("all");

  // Filtrer les mouvements de banque
  const mouvementsBanque = mouvementsCaisse.filter(m => m.source === 'banque');
  
  const totalBanque = banques.reduce((sum, b) => sum + b.solde, 0);
  
  // Paiements par virement
  const paiementsVirement = paiements.filter(p => p.modePaiement === 'virement');
  const totalVirements = paiementsVirement.reduce((sum, p) => sum + p.montant, 0);
  
  // Paiements par chèque
  const paiementsCheque = paiements.filter(p => p.modePaiement === 'cheque');
  const totalCheques = paiementsCheque.reduce((sum, p) => sum + p.montant, 0);

  const filteredMouvements = mouvementsBanque.filter(m => {
    const matchSearch = m.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchBanque = banqueFilter === "all" || m.banqueId === banqueFilter;
    return matchSearch && matchBanque;
  });

  return (
    <MainLayout title="Banque">
      <div className="space-y-6">
        {/* Cartes des banques */}
        <div className="grid gap-4 md:grid-cols-3">
          {banques.filter(b => b.actif).map((banque) => (
            <Card key={banque.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {banque.nom}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMontant(banque.solde)}</div>
                <p className="text-xs text-muted-foreground mt-1">{banque.numeroCompte}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats globales */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Solde Total Banques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMontant(totalBanque)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Virements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatMontant(totalVirements)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Chèques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatMontant(totalCheques)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={banqueFilter} onValueChange={setBanqueFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Toutes les banques" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les banques</SelectItem>
              {banques.filter(b => b.actif).map((banque) => (
                <SelectItem key={banque.id} value={banque.id}>{banque.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Banque</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMouvements.map((mouvement) => {
                  const banque = banques.find(b => b.id === mouvement.banqueId);
                  return (
                    <TableRow key={mouvement.id}>
                      <TableCell>{formatDate(mouvement.date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{banque?.nom}</Badge>
                      </TableCell>
                      <TableCell>{mouvement.description}</TableCell>
                      <TableCell className={`text-right font-medium ${
                        mouvement.type === 'entree' ? 'text-green-600' : 'text-destructive'
                      }`}>
                        {mouvement.type === 'entree' ? '+' : '-'}{formatMontant(mouvement.montant)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredMouvements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Aucun mouvement bancaire
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
