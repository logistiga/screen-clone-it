import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ban, Search, MoreHorizontal, FileText, RefreshCw, Loader2, Download } from "lucide-react";
import { formatMontant, formatDate } from "@/data/mockData";
import { useAnnulations, useAnnulationsStats, useGenererAvoir, useRembourserAnnulation } from "@/hooks/use-annulations";
import { TablePagination } from "@/components/TablePagination";
import { RemboursementAnnulationModal } from "@/components/RemboursementAnnulationModal";
import type { Annulation } from "@/lib/api/annulations";

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

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      devis: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      ordre: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      facture: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    };
    return <Badge className={colors[type]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Badge>;
  };

  const handleGenererAvoir = (annulation: Annulation) => {
    genererAvoir.mutate(annulation.id);
  };

  const handleRembourser = (annulation: Annulation) => {
    setSelectedAnnulation(annulation);
    setRemboursementModalOpen(true);
  };

  // État vide
  if (!isLoading && annulations.length === 0 && !search && typeFilter === "all") {
    return (
      <MainLayout title="Annulations & Avoirs">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Ban className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Aucune annulation</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Les annulations de devis, ordres et factures apparaîtront ici.
            Vous pouvez annuler un document depuis sa page de détail.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Annulations & Avoirs">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Annulations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || annulations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Montant Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatMontant(stats?.montant_total || annulations.reduce((sum, a) => sum + a.montant, 0))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avoirs Générés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.avoirs_generes || annulations.filter(a => a.avoir_genere).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {annulations.filter(a => !a.avoir_genere).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type de document" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="devis">Devis</SelectItem>
              <SelectItem value="ordre">Ordres</SelectItem>
              <SelectItem value="facture">Factures</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
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
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Aucune annulation trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    annulations.map((annulation) => (
                      <TableRow key={annulation.id}>
                        <TableCell className="font-medium">{annulation.numero}</TableCell>
                        <TableCell>{getTypeBadge(annulation.type)}</TableCell>
                        <TableCell className="font-mono text-sm">{annulation.document_numero}</TableCell>
                        <TableCell>{annulation.client?.nom || '-'}</TableCell>
                        <TableCell>{formatDate(annulation.date)}</TableCell>
                        <TableCell className="text-right text-destructive font-medium">
                          -{formatMontant(annulation.montant)}
                        </TableCell>
                        <TableCell>
                          {annulation.avoir_genere ? (
                            <div>
                              <Badge variant="default" className="bg-green-600">
                                {annulation.numero_avoir || 'Généré'}
                              </Badge>
                              {annulation.solde_avoir > 0 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Solde: {formatMontant(annulation.solde_avoir)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline">Non généré</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {annulation.rembourse ? (
                            <Badge variant="default" className="bg-blue-600">
                              Remboursé
                            </Badge>
                          ) : annulation.avoir_genere ? (
                            <Badge variant="secondary">Avoir actif</Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                              En attente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {annulation.avoir_genere && (
                                <DropdownMenuItem
                                  onClick={() => navigate(`/annulations/${annulation.id}/avoir`)}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Télécharger l'avoir PDF
                                </DropdownMenuItem>
                              )}
                              {!annulation.avoir_genere && (
                                <DropdownMenuItem
                                  onClick={() => handleGenererAvoir(annulation)}
                                  disabled={genererAvoir.isPending}
                                >
                                  <FileText className="mr-2 h-4 w-4" />
                                  Générer un avoir
                                </DropdownMenuItem>
                              )}
                              {!annulation.rembourse && (
                                <DropdownMenuItem onClick={() => handleRembourser(annulation)}>
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Rembourser le client
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
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
