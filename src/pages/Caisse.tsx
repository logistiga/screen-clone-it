import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Search, ArrowUpCircle, ArrowDownCircle, Wallet, FileText, Receipt, Loader2, ClipboardList } from "lucide-react";
import { SortieCaisseModal } from "@/components/SortieCaisseModal";
import { formatMontant, formatDate } from "@/data/mockData";
import api from "@/lib/api";
import { TablePagination } from "@/components/TablePagination";

interface MouvementCaisse {
  id: string;
  type: 'entree' | 'sortie';
  montant: number;
  date: string;
  date_mouvement: string;
  description: string;
  source: string;
  categorie: string;
  document_numero: string | null;
  document_type: 'ordre' | 'facture' | null;
  client_nom: string | null;
  beneficiaire: string | null;
  banque_id: number | null;
}

interface CaisseResponse {
  data: MouvementCaisse[];
  meta?: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
}

interface SoldeResponse {
  solde: number;
  total_entrees: number;
  total_sorties: number;
  solde_banques: number;
  solde_total: number;
}

export default function CaissePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortieModalOpen, setSortieModalOpen] = useState(false);

  // Fetch mouvements from API
  const { data: mouvementsData, isLoading, refetch } = useQuery({
    queryKey: ['caisse-mouvements', currentPage, pageSize, searchTerm, typeFilter],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page: currentPage,
        per_page: pageSize,
        source: 'caisse', // Only caisse movements (espèces)
      };
      if (searchTerm) params.search = searchTerm;
      if (typeFilter !== 'all') params.type = typeFilter;
      
      const response = await api.get<CaisseResponse>('/caisse', { params });
      return response.data;
    },
  });

  // Fetch solde
  const { data: soldeData } = useQuery({
    queryKey: ['caisse-solde'],
    queryFn: async () => {
      const response = await api.get<SoldeResponse>('/caisse/solde');
      return response.data;
    },
  });

  const mouvements = mouvementsData?.data || [];
  const totalPages = mouvementsData?.meta?.last_page || 1;
  const totalItems = mouvementsData?.meta?.total || 0;

  const soldeCaisse = soldeData?.solde || 0;
  const totalEntrees = soldeData?.total_entrees || 0;
  const totalSorties = soldeData?.total_sorties || 0;

  // Count by type in current page
  const entreesCount = mouvements.filter(m => m.type === 'entree').length;
  const sortiesCount = mouvements.filter(m => m.type === 'sortie').length;

  const handleSortieSuccess = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <MainLayout title="Caisse">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Chargement des mouvements...</p>
        </div>
      </MainLayout>
    );
  }

  // État vide
  if (mouvements.length === 0 && !searchTerm && typeFilter === 'all') {
    return (
      <MainLayout title="Caisse">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Aucun mouvement de caisse</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Les paiements en espèces sur les ordres de travail et sorties de caisse apparaîtront ici.
          </p>
          <Button variant="outline" className="gap-2 text-destructive border-destructive" onClick={() => setSortieModalOpen(true)}>
            <ArrowUpCircle className="h-4 w-4" />
            Nouvelle sortie
          </Button>
        </div>
        <SortieCaisseModal open={sortieModalOpen} onOpenChange={setSortieModalOpen} type="caisse" onSuccess={handleSortieSuccess} />
      </MainLayout>
    );
  }

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
              <div className={`text-2xl font-bold ${soldeCaisse >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {formatMontant(soldeCaisse)}
              </div>
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
              <p className="text-xs text-muted-foreground mt-1">Paiements reçus</p>
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
              <p className="text-xs text-muted-foreground mt-1">Dépenses</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Opérations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-xs text-muted-foreground mt-1">{entreesCount} entrées, {sortiesCount} sorties</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Rechercher (n° ordre, description)..." 
                value={searchTerm} 
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }} 
                className="pl-9" 
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
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
          <Button variant="outline" className="gap-2 text-destructive border-destructive hover:bg-destructive/10" onClick={() => setSortieModalOpen(true)}>
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
                  <TableHead>N° Ordre</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mouvements.map((mouvement) => (
                  <TableRow key={mouvement.id}>
                    <TableCell>{formatDate(mouvement.date || mouvement.date_mouvement)}</TableCell>
                    <TableCell>
                      {mouvement.type === 'entree' ? (
                        <Badge className="bg-green-100 text-green-800 gap-1 dark:bg-green-900/40 dark:text-green-200">
                          <ArrowDownCircle className="h-3 w-3" />
                          Entrée
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 gap-1 dark:bg-red-900/40 dark:text-red-200">
                          <ArrowUpCircle className="h-3 w-3" />
                          Sortie
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{mouvement.description}</TableCell>
                    <TableCell>
                      {mouvement.document_numero ? (
                        <Badge variant="outline" className="gap-1">
                          {mouvement.document_type === 'ordre' ? (
                            <ClipboardList className="h-3 w-3" />
                          ) : (
                            <FileText className="h-3 w-3" />
                          )}
                          {mouvement.document_numero}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{mouvement.client_nom || mouvement.beneficiaire || <span className="text-muted-foreground">-</span>}</TableCell>
                    <TableCell className={`text-right font-medium ${mouvement.type === 'entree' ? 'text-green-600' : 'text-destructive'}`}>
                      {mouvement.type === 'entree' ? '+' : '-'}{formatMontant(mouvement.montant)}
                    </TableCell>
                  </TableRow>
                ))}
                {mouvements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Aucun mouvement trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      <SortieCaisseModal open={sortieModalOpen} onOpenChange={setSortieModalOpen} type="caisse" onSuccess={handleSortieSuccess} />
    </MainLayout>
  );
}
