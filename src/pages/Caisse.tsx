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
import { Search, ArrowUpCircle, ArrowDownCircle, Wallet, FileText, Receipt } from "lucide-react";
import { SortieCaisseModal } from "@/components/SortieCaisseModal";
import { mouvementsCaisse, paiements, ordresTravail, factures, clients, formatMontant, formatDate } from "@/data/mockData";

export default function CaissePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortieModalOpen, setSortieModalOpen] = useState(false);

  // Paiements en espèces (entrées de caisse)
  const paiementsEspeces = paiements.filter(p => p.modePaiement === 'especes');
  
  // Créer une liste complète des mouvements de caisse
  const entresCaisse = paiementsEspeces.map(p => {
    const ordre = ordresTravail.find(o => o.id === p.ordreId);
    const facture = factures.find(f => f.id === p.factureId);
    const client = clients.find(c => c.id === p.clientId);
    
    return {
      id: `paiement-${p.id}`,
      type: 'entree' as const,
      montant: p.montant,
      date: p.date,
      description: ordre 
        ? `Paiement ordre ${ordre.numero}` 
        : facture 
          ? `Paiement facture ${facture.numero}` 
          : 'Paiement',
      source: 'paiement' as const,
      documentNumero: ordre?.numero || facture?.numero || '',
      clientNom: client?.nom || '',
    };
  });

  // Sorties de caisse (mouvements manuels)
  const sortiesCaisse = mouvementsCaisse
    .filter(m => m.source === 'caisse' && m.type === 'sortie')
    .map(m => ({
      id: m.id,
      type: 'sortie' as const,
      montant: m.montant,
      date: m.date,
      description: m.description,
      source: 'manuel' as const,
      documentNumero: '',
      clientNom: '',
    }));

  const allMouvements = [...entresCaisse, ...sortiesCaisse].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalEntrees = entresCaisse.reduce((sum, m) => sum + m.montant, 0);
  const totalSorties = sortiesCaisse.reduce((sum, m) => sum + m.montant, 0);
  const soldeCaisse = totalEntrees - totalSorties;

  const filteredMouvements = allMouvements.filter(m => {
    const matchSearch = m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.clientNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.documentNumero.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === "all" || m.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <MainLayout title="Caisse">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Solde Caisse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMontant(soldeCaisse)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4 text-green-600" />
                Total Entrées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatMontant(totalEntrees)}</div>
              <p className="text-xs text-muted-foreground mt-1">{entresCaisse.length} paiements</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-destructive" />
                Total Sorties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatMontant(totalSorties)}</div>
              <p className="text-xs text-muted-foreground mt-1">{sortiesCaisse.length} sorties</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Opérations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allMouvements.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="entree">Entrées</SelectItem>
                <SelectItem value="sortie">Sorties</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            variant="outline" 
            className="gap-2 text-destructive border-destructive hover:bg-destructive/10"
            onClick={() => setSortieModalOpen(true)}
          >
            <ArrowUpCircle className="h-4 w-4" />
            Nouvelle sortie
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Mouvements de caisse (Espèces)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMouvements.map((mouvement) => (
                  <TableRow key={mouvement.id}>
                    <TableCell>{formatDate(mouvement.date)}</TableCell>
                    <TableCell>
                      {mouvement.type === 'entree' ? (
                        <Badge className="bg-green-100 text-green-800 gap-1">
                          <ArrowDownCircle className="h-3 w-3" />
                          Entrée
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 gap-1">
                          <ArrowUpCircle className="h-3 w-3" />
                          Sortie
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{mouvement.description}</TableCell>
                    <TableCell>
                      {mouvement.documentNumero ? (
                        <Badge variant="outline" className="gap-1">
                          <FileText className="h-3 w-3" />
                          {mouvement.documentNumero}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {mouvement.clientNom || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      mouvement.type === 'entree' ? 'text-green-600' : 'text-destructive'
                    }`}>
                      {mouvement.type === 'entree' ? '+' : '-'}{formatMontant(mouvement.montant)}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredMouvements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Aucun mouvement de caisse
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modal Sortie */}
      <SortieCaisseModal
        open={sortieModalOpen}
        onOpenChange={setSortieModalOpen}
        type="caisse"
      />
    </MainLayout>
  );
}
