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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ArrowUpCircle, ArrowDownCircle, Building2, CreditCard, FileText, Receipt } from "lucide-react";
import { SortieCaisseModal } from "@/components/SortieCaisseModal";
import { mouvementsCaisse, banques, paiements, ordresTravail, factures, clients, formatMontant, formatDate } from "@/data/mockData";

export default function BanquePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [banqueFilter, setBanqueFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("mouvements");
  const [sortieModalOpen, setSortieModalOpen] = useState(false);
  const [selectedBanqueId, setSelectedBanqueId] = useState("");

  // Paiements par banque (chèques et virements)
  const paiementsBanque = paiements.filter(p => p.modePaiement === 'virement' || p.modePaiement === 'cheque');
  
  // Créer une liste des entrées bancaires
  const entreesBanque = paiementsBanque.map(p => {
    const ordre = ordresTravail.find(o => o.id === p.ordreId);
    const facture = factures.find(f => f.id === p.factureId);
    const client = clients.find(c => c.id === p.clientId);
    const banque = banques.find(b => b.id === p.banqueId);
    
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
      modePaiement: p.modePaiement,
      reference: p.reference || p.numeroCheque || '',
      banqueId: p.banqueId || '',
      banqueNom: banque?.nom || '',
      documentNumero: ordre?.numero || facture?.numero || '',
      clientNom: client?.nom || '',
    };
  });

  // Sorties bancaires (mouvements manuels)
  const sortiesBanque = mouvementsCaisse
    .filter(m => m.source === 'banque' && m.type === 'sortie')
    .map(m => {
      const banque = banques.find(b => b.id === m.banqueId);
      return {
        id: m.id,
        type: 'sortie' as const,
        montant: m.montant,
        date: m.date,
        description: m.description,
        modePaiement: 'virement' as const,
        reference: '',
        banqueId: m.banqueId || '',
        banqueNom: banque?.nom || '',
        documentNumero: '',
        clientNom: '',
      };
    });

  const allMouvements = [...entreesBanque, ...sortiesBanque].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalBanques = banques.reduce((sum, b) => sum + b.solde, 0);
  const totalEntrees = entreesBanque.reduce((sum, m) => sum + m.montant, 0);
  const totalSorties = sortiesBanque.reduce((sum, m) => sum + m.montant, 0);
  const totalVirements = paiementsBanque.filter(p => p.modePaiement === 'virement').reduce((sum, p) => sum + p.montant, 0);
  const totalCheques = paiementsBanque.filter(p => p.modePaiement === 'cheque').reduce((sum, p) => sum + p.montant, 0);

  const filteredMouvements = allMouvements.filter(m => {
    const matchSearch = m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.clientNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.documentNumero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchBanque = banqueFilter === "all" || m.banqueId === banqueFilter;
    const matchType = typeFilter === "all" || m.type === typeFilter;
    return matchSearch && matchBanque && matchType;
  });

  const openSortieModal = (banqueId?: string) => {
    setSelectedBanqueId(banqueId || "");
    setSortieModalOpen(true);
  };

  return (
    <MainLayout title="Banque">
      <div className="space-y-6">
        {/* Stats globales */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Solde Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMontant(totalBanques)}</div>
              <p className="text-xs text-muted-foreground mt-1">{banques.filter(b => b.actif).length} comptes</p>
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
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Virements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{formatMontant(totalVirements)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Chèques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatMontant(totalCheques)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="mouvements">Mouvements</TabsTrigger>
            <TabsTrigger value="comptes">Comptes bancaires</TabsTrigger>
          </TabsList>

          <TabsContent value="mouvements" className="space-y-4 mt-4">
            {/* Filtres */}
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
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="entree">Entrées</SelectItem>
                    <SelectItem value="sortie">Sorties</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="outline" 
                className="gap-2 text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => openSortieModal()}
              >
                <ArrowUpCircle className="h-4 w-4" />
                Nouvelle sortie
              </Button>
            </div>

            {/* Table mouvements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Mouvements bancaires
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Banque</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMouvements.map((mouvement) => (
                      <TableRow key={mouvement.id}>
                        <TableCell>{formatDate(mouvement.date)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <Building2 className="h-3 w-3" />
                            {mouvement.banqueNom}
                          </Badge>
                        </TableCell>
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
                        <TableCell>
                          {mouvement.modePaiement === 'virement' ? (
                            <Badge variant="secondary" className="gap-1">
                              <Building2 className="h-3 w-3" />
                              Virement
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <CreditCard className="h-3 w-3" />
                              Chèque
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{mouvement.description}</TableCell>
                        <TableCell>
                          {mouvement.reference ? (
                            <code className="text-xs bg-muted px-2 py-1 rounded">{mouvement.reference}</code>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
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
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          Aucun mouvement bancaire
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comptes" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {banques.filter(b => b.actif).map((banque) => {
                // Calculer les stats pour cette banque
                const mouvementsBanque = allMouvements.filter(m => m.banqueId === banque.id);
                const entreesBanqueCompte = mouvementsBanque.filter(m => m.type === 'entree');
                const sortiesBanqueCompte = mouvementsBanque.filter(m => m.type === 'sortie');
                
                return (
                  <Card key={banque.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          {banque.nom}
                        </div>
                        <Badge variant="default">Actif</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Solde actuel</p>
                          <p className="text-3xl font-bold text-primary">{formatMontant(banque.solde)}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">Entrées</p>
                            <p className="text-sm font-semibold text-green-600">
                              +{formatMontant(entreesBanqueCompte.reduce((s, m) => s + m.montant, 0))}
                            </p>
                            <p className="text-xs text-muted-foreground">{entreesBanqueCompte.length} opérations</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Sorties</p>
                            <p className="text-sm font-semibold text-destructive">
                              -{formatMontant(sortiesBanqueCompte.reduce((s, m) => s + m.montant, 0))}
                            </p>
                            <p className="text-xs text-muted-foreground">{sortiesBanqueCompte.length} opérations</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t space-y-1 text-xs text-muted-foreground">
                          <p><strong>N° Compte:</strong> {banque.numeroCompte}</p>
                          {banque.iban && <p><strong>IBAN:</strong> {banque.iban}</p>}
                          {banque.swift && <p><strong>SWIFT:</strong> {banque.swift}</p>}
                        </div>

                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full gap-2 text-destructive"
                          onClick={() => openSortieModal(banque.id)}
                        >
                          <ArrowUpCircle className="h-4 w-4" />
                          Nouvelle sortie
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal Sortie */}
      <SortieCaisseModal
        open={sortieModalOpen}
        onOpenChange={setSortieModalOpen}
        type="banque"
        banqueId={selectedBanqueId}
      />
    </MainLayout>
  );
}
