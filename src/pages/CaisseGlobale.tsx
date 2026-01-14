import { useState } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Download, ArrowUpCircle, ArrowDownCircle, Building2, Wallet, PieChart, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatMontant, formatDate } from "@/data/mockData";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useMouvementsCaisse, useSoldeCaisse, usePaiements } from "@/hooks/use-commercial";
import { TablePagination } from "@/components/TablePagination";
import { DocumentStatCard } from "@/components/shared/documents/DocumentStatCard";
import { DocumentLoadingState } from "@/components/shared/documents/DocumentLoadingState";
import { DocumentEmptyState } from "@/components/shared/documents/DocumentEmptyState";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function CaisseGlobalePage() {
  const { toast } = useToast();
  
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Charger tous les mouvements (caisse et banque)
  const { data: mouvementsData, isLoading: mouvementsLoading } = useMouvementsCaisse({
    source: sourceFilter !== 'all' ? sourceFilter : undefined,
    date_debut: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    date_fin: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    page: currentPage,
    per_page: pageSize,
  });

  // Charger les soldes
  const { data: soldeData } = useSoldeCaisse();

  // Charger les paiements pour les stats (tous les paiements)
  const { data: paiementsCaisseData } = usePaiements({ mode_paiement: 'Espèces', per_page: 1000 });
  const { data: paiementsBanqueData } = usePaiements({ per_page: 1000 });

  const mouvements = mouvementsData?.data || [];
  const totalPages = mouvementsData?.meta?.last_page || 1;
  const totalItems = mouvementsData?.meta?.total || 0;

  // Calcul des stats
  const soldeCaisse = soldeData?.solde || 0;
  const soldeBanques = soldeData?.solde_banques || 0;
  const soldeGlobal = soldeData?.solde_total || (soldeCaisse + soldeBanques);
  const totalEntrees = soldeData?.total_entrees || 0;
  const totalSorties = soldeData?.total_sorties || 0;

  // Stats par source (depuis les paiements)
  const paiementsCaisse = paiementsCaisseData?.data || [];
  const paiementsBanque = (paiementsBanqueData?.data || []).filter((p: any) => 
    p.mode_paiement === 'Virement' || p.mode_paiement === 'Chèque'
  );

  const totalEntreesCaisse = paiementsCaisse.reduce((sum: number, p: any) => sum + (p.montant || 0), 0);
  const totalEntreesBanque = paiementsBanque.reduce((sum: number, p: any) => sum + (p.montant || 0), 0);

  // Les sorties par source depuis les mouvements
  const sortiesCaisse = mouvements.filter((m: any) => m.type === 'sortie' && m.source === 'caisse');
  const sortiesBanque = mouvements.filter((m: any) => m.type === 'sortie' && m.source === 'banque');
  const totalSortiesCaisse = sortiesCaisse.reduce((sum: number, m: any) => sum + (m.montant || 0), 0);
  const totalSortiesBanque = sortiesBanque.reduce((sum: number, m: any) => sum + (m.montant || 0), 0);

  const handleExport = (exportFormat: 'pdf' | 'excel') => {
    toast({ title: `Export ${exportFormat.toUpperCase()}`, description: `Export des données comptables en cours...` });
  };

  const hasActiveFilters = dateRange.from || sourceFilter !== "all";

  const clearFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setSourceFilter("all");
    setCurrentPage(1);
  };

  const isLoading = mouvementsLoading;

  if (isLoading) {
    return (
      <MainLayout title="Caisse Globale">
        <DocumentLoadingState message="Chargement des mouvements..." />
      </MainLayout>
    );
  }

  // État vide
  if (mouvements.length === 0 && sourceFilter === 'all' && !dateRange.from) {
    return (
      <MainLayout title="Caisse Globale">
        <DocumentEmptyState
          icon={PieChart}
          title="Aucun mouvement"
          description="Les mouvements de caisse et banque apparaîtront ici pour une vue globale de votre trésorerie."
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Caisse Globale">
      <motion.div 
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          variants={itemVariants}
        >
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10">
                <PieChart className="h-6 w-6 text-primary" />
              </div>
              Caisse Globale
            </h1>
            <p className="text-muted-foreground mt-1">Vue d'ensemble de votre trésorerie</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => handleExport('pdf')}>
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => handleExport('excel')}>
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </motion.div>

        {/* Stats principales */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <DocumentStatCard
            title="Solde Global"
            value={formatMontant(soldeGlobal)}
            icon={PieChart}
            subtitle="trésorerie totale"
            variant={soldeGlobal >= 0 ? "primary" : "danger"}
            delay={0}
          />
          <DocumentStatCard
            title="Solde Caisse"
            value={formatMontant(soldeCaisse)}
            icon={Wallet}
            subtitle="espèces"
            variant="info"
            delay={0.1}
          />
          <DocumentStatCard
            title="Solde Banques"
            value={formatMontant(soldeBanques)}
            icon={Building2}
            subtitle="virements & chèques"
            variant="info"
            delay={0.2}
          />
          <DocumentStatCard
            title="Total Entrées"
            value={formatMontant(totalEntrees)}
            icon={ArrowDownCircle}
            subtitle="encaissements"
            variant="success"
            delay={0.3}
          />
          <DocumentStatCard
            title="Total Sorties"
            value={formatMontant(totalSorties)}
            icon={ArrowUpCircle}
            subtitle="décaissements"
            variant="danger"
            delay={0.4}
          />
        </div>

        {/* Détail par source */}
        <div className="grid gap-4 md:grid-cols-2">
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-emerald-500/10 to-transparent border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  Caisse (Espèces)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <p className="text-sm text-muted-foreground">Entrées</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">+{formatMontant(totalEntreesCaisse)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                    <p className="text-sm text-muted-foreground">Sorties</p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">-{formatMontant(totalSortiesCaisse)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/10 to-transparent border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Banques
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <p className="text-sm text-muted-foreground">Entrées</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">+{formatMontant(totalEntreesBanque)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                    <p className="text-sm text-muted-foreground">Sorties</p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">-{formatMontant(totalSortiesBanque)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filtres */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col gap-3 sm:flex-row sm:items-center bg-card/50 backdrop-blur-sm p-4 rounded-lg border"
        >
          <div className="flex flex-wrap gap-2 flex-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>{format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}</>
                    ) : format(dateRange.from, "dd/MM/yyyy")
                  ) : "Période"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="range" selected={dateRange} onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })} locale={fr} />
              </PopoverContent>
            </Popover>
            <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes sources</SelectItem>
                <SelectItem value="caisse">Caisse</SelectItem>
                <SelectItem value="banque">Banque</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="gap-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Réinitialiser
              </Button>
            )}
          </div>
        </motion.div>

        {/* Table des mouvements */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Tous les mouvements comptables
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({totalItems} {totalItems > 1 ? "mouvements" : "mouvement"})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {mouvements.length === 0 ? (
                <div className="py-12 text-center">
                  <PieChart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Aucun mouvement pour cette période</p>
                  {hasActiveFilters && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={clearFilters}
                    >
                      Réinitialiser les filtres
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Client / Bénéficiaire</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mouvements.map((mouvement: any, index: number) => (
                      <motion.tr
                        key={mouvement.id}
                        variants={itemVariants}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <TableCell>{formatDate(mouvement.date_mouvement || mouvement.date)}</TableCell>
                        <TableCell>
                          {mouvement.source === 'caisse' ? (
                            <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                              <Wallet className="h-3 w-3" />Caisse
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                              <Building2 className="h-3 w-3" />{mouvement.banque?.nom || 'Banque'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {mouvement.type === 'entree' ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 gap-1">
                              <ArrowDownCircle className="h-3 w-3" />Entrée
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 gap-1">
                              <ArrowUpCircle className="h-3 w-3" />Sortie
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{mouvement.categorie || '-'}</span>
                        </TableCell>
                        <TableCell>{mouvement.description}</TableCell>
                        <TableCell>{mouvement.client_nom || mouvement.beneficiaire || <span className="text-muted-foreground">-</span>}</TableCell>
                        <TableCell className={`text-right font-medium ${mouvement.type === 'entree' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {mouvement.type === 'entree' ? '+' : '-'}{formatMontant(mouvement.montant)}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div variants={itemVariants}>
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
          </motion.div>
        )}
      </motion.div>
    </MainLayout>
  );
}
