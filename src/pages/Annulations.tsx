import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Ban, FileText, RefreshCw, Download, Calculator, Clock, CheckCircle } from "lucide-react";
import { formatMontant, formatDate } from "@/data/mockData";
import { useAnnulations, useAnnulationsStats, useGenererAvoir } from "@/hooks/use-annulations";
import { TablePagination } from "@/components/TablePagination";
import { RemboursementAnnulationModal } from "@/components/RemboursementAnnulationModal";
import type { Annulation } from "@/lib/api/annulations";
import {
  DocumentStatCard,
  DocumentFilters,
  DocumentEmptyState,
  DocumentLoadingState,
} from "@/components/shared/documents";

const typeFilterOptions = [
  { value: "all", label: "Tous les types" },
  { value: "devis", label: "Devis" },
  { value: "ordre", label: "Ordres" },
  { value: "facture", label: "Factures" },
];

const typeColors: Record<string, string> = {
  devis: "bg-muted text-muted-foreground",
  ordre: "bg-primary/10 text-primary border-primary/20",
  facture: "bg-accent text-accent-foreground",
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function AnnulationsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedAnnulation, setSelectedAnnulation] = useState<Annulation | null>(null);
  const [remboursementModalOpen, setRemboursementModalOpen] = useState(false);
  const [perPage, setPerPage] = useState(15);

  const { data: annulationsData, isLoading } = useAnnulations({
    search: search || undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
    page,
    per_page: perPage,
  });

  const { data: stats } = useAnnulationsStats();
  const genererAvoir = useGenererAvoir();

  const annulations = annulationsData?.data || [];
  const meta = annulationsData?.meta;

  const hasFilters = !!search || typeFilter !== "all";

  const getTypeBadge = (type: string) => {
    return <Badge className={typeColors[type] || typeColors.devis}>{type.charAt(0).toUpperCase() + type.slice(1)}</Badge>;
  };

  const handleGenererAvoir = (annulation: Annulation) => {
    genererAvoir.mutate(annulation.id);
  };

  const handleRembourser = (annulation: Annulation) => {
    setSelectedAnnulation(annulation);
    setRemboursementModalOpen(true);
  };

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setPage(1);
  };

  // Loading
  if (isLoading) {
    return (
      <MainLayout title="Annulations & Avoirs">
        <DocumentLoadingState message="Chargement des annulations..." />
      </MainLayout>
    );
  }

  // État vide
  if (annulations.length === 0 && !hasFilters) {
    return (
      <MainLayout title="Annulations & Avoirs">
        <DocumentEmptyState
          icon={Ban}
          title="Aucune annulation"
          description="Les annulations de devis, ordres et factures apparaîtront ici. Vous pouvez annuler un document depuis sa page de détail."
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Annulations & Avoirs">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Annulations & Avoirs</h1>
            <p className="text-muted-foreground mt-1">Gérez les annulations et les avoirs</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <DocumentStatCard
            title="Total Annulations"
            value={stats?.total || annulations.length}
            icon={Ban}
            subtitle="annulations"
            delay={0}
          />
          <DocumentStatCard
            title="Montant Total"
            value={formatMontant(stats?.montant_total || annulations.reduce((sum, a) => sum + a.montant, 0))}
            icon={Calculator}
            subtitle="FCFA"
            variant="danger"
            delay={0.1}
          />
          <DocumentStatCard
            title="Avoirs Générés"
            value={stats?.avoirs_generes || annulations.filter(a => a.avoir_genere).length}
            icon={CheckCircle}
            subtitle="avoirs"
            variant="success"
            delay={0.2}
          />
          <DocumentStatCard
            title="En attente"
            value={annulations.filter(a => !a.avoir_genere).length}
            icon={Clock}
            subtitle="à traiter"
            variant="warning"
            delay={0.3}
          />
        </div>

        {/* Filtres */}
        <DocumentFilters
          searchTerm={search}
          onSearchChange={(value) => { setSearch(value); setPage(1); }}
          searchPlaceholder="Rechercher par numéro, client..."
          statutFilter={typeFilter}
          onStatutChange={(v) => { setTypeFilter(v); setPage(1); }}
          statutOptions={typeFilterOptions}
        />

        {/* Table */}
        <Card className="border-border/50 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/50">
                    <TableHead>N° Annulation</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Avoir</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {annulations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Ban className="h-8 w-8 opacity-50" />
                          <p>Aucune annulation trouvée</p>
                          {hasFilters && (
                            <Button variant="link" onClick={clearFilters} className="text-primary">
                              Réinitialiser les filtres
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    annulations.map((annulation, index) => (
                      <motion.tr
                        key={annulation.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.03 }}
                        className="group hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium font-mono">{annulation.numero}</TableCell>
                        <TableCell>{getTypeBadge(annulation.type)}</TableCell>
                        <TableCell className="font-mono text-sm">{annulation.document_numero}</TableCell>
                        <TableCell>{annulation.client?.nom || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(annulation.date)}</TableCell>
                        <TableCell className="text-right text-destructive font-semibold">
                          -{formatMontant(annulation.montant)}
                        </TableCell>
                        <TableCell>
                          {annulation.avoir_genere ? (
                            <div>
                              <Badge className="bg-success/20 text-success">
                                {annulation.numero_avoir || 'Généré'}
                              </Badge>
                              {annulation.solde_avoir > 0 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Solde: {formatMontant(annulation.solde_avoir)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Non généré</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {annulation.rembourse ? (
                            <Badge className="bg-info/20 text-info">Remboursé</Badge>
                          ) : annulation.avoir_genere ? (
                            <Badge variant="secondary">Avoir actif</Badge>
                          ) : (
                            <Badge className="bg-warning/20 text-warning">En attente</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {annulation.avoir_genere && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => navigate(`/annulations/${annulation.id}/avoir`)}
                                title="Télécharger l'avoir PDF"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            {!annulation.avoir_genere && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleGenererAvoir(annulation)}
                                disabled={genererAvoir.isPending}
                                title="Générer un avoir"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            )}
                            {!annulation.rembourse && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleRembourser(annulation)}
                                title="Rembourser le client"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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
        {meta && (
          <TablePagination
            currentPage={page}
            totalPages={meta.last_page}
            pageSize={perPage}
            totalItems={meta.total}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPerPage(size); setPage(1); }}
          />
        )}
      </div>

      {/* Modal de remboursement */}
      <RemboursementAnnulationModal
        open={remboursementModalOpen}
        onOpenChange={setRemboursementModalOpen}
        annulation={selectedAnnulation}
      />
    </MainLayout>
  );
}
