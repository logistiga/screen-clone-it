import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
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
import { ArrowUpCircle, ArrowDownCircle, Wallet, FileText, Receipt, ClipboardList } from "lucide-react";
import { SortieCaisseModal } from "@/components/SortieCaisseModal";
import { formatMontant, formatDate } from "@/data/mockData";
import api from "@/lib/api";
import { TablePagination } from "@/components/TablePagination";
import {
  DocumentStatCard,
  DocumentFilters,
  DocumentEmptyState,
  DocumentLoadingState,
} from "@/components/shared/documents";

const typeFilterOptions = [
  { value: "all", label: "Tous les types" },
  { value: "entree", label: "Entrées" },
  { value: "sortie", label: "Sorties" },
];

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

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

  const hasFilters = !!searchTerm || typeFilter !== 'all';

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <MainLayout title="Caisse">
        <DocumentLoadingState message="Chargement des mouvements..." />
      </MainLayout>
    );
  }

  // État vide
  if (mouvements.length === 0 && !hasFilters) {
    return (
      <MainLayout title="Caisse">
        <DocumentEmptyState
          icon={Wallet}
          title="Aucun mouvement de caisse"
          description="Les paiements en espèces sur les ordres de travail et sorties de caisse apparaîtront ici."
          actionLabel="Nouvelle sortie"
          onAction={() => setSortieModalOpen(true)}
        />
        <SortieCaisseModal open={sortieModalOpen} onOpenChange={setSortieModalOpen} type="caisse" onSuccess={handleSortieSuccess} />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Caisse">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Caisse</h1>
            <p className="text-muted-foreground mt-1">Gérez les mouvements de caisse (espèces)</p>
          </div>
          <Button variant="outline" className="gap-2 text-destructive border-destructive hover:bg-destructive/10" onClick={() => setSortieModalOpen(true)}>
            <ArrowUpCircle className="h-4 w-4" />
            Nouvelle sortie
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <DocumentStatCard
            title="Solde Caisse"
            value={formatMontant(soldeCaisse)}
            icon={Wallet}
            subtitle="espèces"
            variant={soldeCaisse >= 0 ? "primary" : "danger"}
            delay={0}
          />
          <DocumentStatCard
            title="Total Entrées"
            value={formatMontant(totalEntrees)}
            icon={ArrowDownCircle}
            subtitle="paiements reçus"
            variant="success"
            delay={0.1}
          />
          <DocumentStatCard
            title="Total Sorties"
            value={formatMontant(totalSorties)}
            icon={ArrowUpCircle}
            subtitle="dépenses"
            variant="danger"
            delay={0.2}
          />
          <DocumentStatCard
            title="Opérations"
            value={totalItems}
            icon={Receipt}
            subtitle={`${entreesCount} entrées, ${sortiesCount} sorties`}
            delay={0.3}
          />
        </div>

        {/* Filtres */}
        <DocumentFilters
          searchTerm={searchTerm}
          onSearchChange={(value) => { setSearchTerm(value); setCurrentPage(1); }}
          searchPlaceholder="Rechercher (n° ordre, description)..."
          statutFilter={typeFilter}
          onStatutChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}
          statutOptions={typeFilterOptions}
        />

        {/* Table */}
        <Card className="border-border/50 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Mouvements de caisse (Espèces)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>N° Ordre</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mouvements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Receipt className="h-8 w-8 opacity-50" />
                          <p>Aucun mouvement trouvé</p>
                          {hasFilters && (
                            <Button variant="link" onClick={clearFilters} className="text-primary">
                              Réinitialiser les filtres
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    mouvements.map((mouvement, index) => (
                      <motion.tr
                        key={mouvement.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.03 }}
                        className="group hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="text-muted-foreground">{formatDate(mouvement.date || mouvement.date_mouvement)}</TableCell>
                        <TableCell>
                          {mouvement.type === 'entree' ? (
                            <Badge className="bg-success/20 text-success gap-1">
                              <ArrowDownCircle className="h-3 w-3" />
                              Entrée
                            </Badge>
                          ) : (
                            <Badge className="bg-destructive/20 text-destructive gap-1">
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
                        <TableCell className={`text-right font-semibold ${mouvement.type === 'entree' ? 'text-success' : 'text-destructive'}`}>
                          {mouvement.type === 'entree' ? '+' : '-'}{formatMontant(mouvement.montant)}
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
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
