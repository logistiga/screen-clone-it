import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TablePagination } from "@/components/TablePagination";
import { useFactures } from "@/hooks/use-commercial";
import { formatMontant, formatDate } from "@/data/mockData";
import { 
  Percent, 
  Search, 
  Eye, 
  FileText,
  CheckCircle2,
  TrendingDown,
  Receipt,
  Loader2,
  AlertCircle,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedTableBody, AnimatedTableRow } from "@/components/ui/animated-table";

const typeExonerationOptions = [
  { value: "all", label: "Tous types" },
  { value: "tva", label: "TVA uniquement" },
  { value: "css", label: "CSS uniquement" },
  { value: "both", label: "TVA + CSS" },
];

export default function FacturesExonereesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Fetch all invoices and filter client-side for exempted ones
  const { data: facturesData, isLoading, error } = useFactures({
    page: 1,
    per_page: 500, // Fetch more to filter
  });

  // Filter for exempted invoices
  const facturesList = (facturesData?.data || []).filter((f: any) => {
    const hasExoneration = f.exonere_tva || f.exonere_css;
    if (!hasExoneration) return false;

    // Type filter
    if (typeFilter === "tva" && !f.exonere_tva) return false;
    if (typeFilter === "css" && !f.exonere_css) return false;
    if (typeFilter === "both" && !(f.exonere_tva && f.exonere_css)) return false;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchNumero = f.numero?.toLowerCase().includes(search);
      const matchClient = f.client?.nom?.toLowerCase().includes(search);
      const matchMotif = f.motif_exoneration?.toLowerCase().includes(search);
      return matchNumero || matchClient || matchMotif;
    }

    return true;
  });

  // Pagination
  const totalItems = facturesList.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedFactures = facturesList.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Statistics
  const totalExonerationTva = facturesList
    .filter((f: any) => f.exonere_tva)
    .reduce((sum: number, f: any) => sum + (f.montant_tva || 0), 0);
  
  const totalExonerationCss = facturesList
    .filter((f: any) => f.exonere_css)
    .reduce((sum: number, f: any) => sum + (f.montant_css || 0), 0);

  const totalEconomie = totalExonerationTva + totalExonerationCss;

  const countTvaOnly = facturesList.filter((f: any) => f.exonere_tva && !f.exonere_css).length;
  const countCssOnly = facturesList.filter((f: any) => f.exonere_css && !f.exonere_tva).length;
  const countBoth = facturesList.filter((f: any) => f.exonere_tva && f.exonere_css).length;

  const getExonerationBadges = (facture: any) => {
    const badges = [];
    if (facture.exonere_tva) {
      badges.push(
        <Badge key="tva" variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 text-xs">
          TVA
        </Badge>
      );
    }
    if (facture.exonere_css) {
      badges.push(
        <Badge key="css" variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
          CSS
        </Badge>
      );
    }
    return badges;
  };

  const getStatutBadge = (statut: string) => {
    const config: Record<string, { color: string; label: string }> = {
      brouillon: { color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", label: "Brouillon" },
      envoyee: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300", label: "Envoyée" },
      partiellement_payee: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300", label: "Partiel" },
      payee: { color: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300", label: "Payée" },
      annulee: { color: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300", label: "Annulée" },
    };
    const cfg = config[statut] || config.brouillon;
    return <Badge className={cfg.color}>{cfg.label}</Badge>;
  };

  if (isLoading) {
    return (
      <MainLayout title="Factures exonérées">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Loader2 className="h-10 w-10 text-primary" />
          </motion.div>
          <p className="text-muted-foreground">Chargement des factures...</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Factures exonérées">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-16 w-16 text-destructive/50 mb-4" />
          <p className="text-muted-foreground">Erreur lors du chargement</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Factures exonérées">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Total factures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{facturesList.length}</div>
              <p className="text-xs text-muted-foreground">factures exonérées</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-card to-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Économie totale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatMontant(totalEconomie)}</div>
              <p className="text-xs text-muted-foreground">taxes non collectées</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-card to-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Percent className="h-4 w-4" />
                TVA exonérée
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{formatMontant(totalExonerationTva)}</div>
              <p className="text-xs text-muted-foreground">{countTvaOnly + countBoth} factures</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-card to-blue-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Percent className="h-4 w-4" />
                CSS exonéré
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatMontant(totalExonerationCss)}</div>
              <p className="text-xs text-muted-foreground">{countCssOnly + countBoth} factures</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par n°, client, motif..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 pr-9"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Type d'exonération" />
                </SelectTrigger>
                <SelectContent>
                  {typeExonerationOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>N° Facture</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Exonération</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead className="text-right">Montant TTC</TableHead>
                <TableHead className="text-right">Économie</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <AnimatedTableBody>
              {paginatedFactures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-10 w-10 text-muted-foreground/50" />
                      <p className="text-muted-foreground">Aucune facture exonérée trouvée</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedFactures.map((facture: any, index: number) => {
                  const economie = 
                    (facture.exonere_tva ? (facture.montant_tva || 0) : 0) + 
                    (facture.exonere_css ? (facture.montant_css || 0) : 0);

                  return (
                    <AnimatedTableRow key={facture.id} index={index} className="hover:bg-muted/50">
                      <TableCell className="font-mono font-medium">{facture.numero}</TableCell>
                      <TableCell>{formatDate(facture.date_facture || facture.date_creation)}</TableCell>
                      <TableCell>{facture.client?.nom || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {getExonerationBadges(facture)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={facture.motif_exoneration}>
                        {facture.motif_exoneration || "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMontant(facture.montant_ttc)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatMontant(economie)}
                      </TableCell>
                      <TableCell>{getStatutBadge(facture.statut)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/factures/${facture.id}`)}
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </AnimatedTableRow>
                  );
                })
              )}
            </AnimatedTableBody>
          </Table>

          {totalItems > 0 && (
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
        </Card>
      </motion.div>
    </MainLayout>
  );
}
