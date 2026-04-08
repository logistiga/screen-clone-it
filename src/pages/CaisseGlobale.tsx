import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, X, FileSpreadsheet, PieChart } from "lucide-react";
import { ExportCaisseGlobaleModal } from "@/components/caisse/ExportCaisseGlobaleModal";
import { TablePagination } from "@/components/TablePagination";
import { DocumentLoadingState, DocumentEmptyState } from "@/components/shared/documents";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useCaisseGlobaleData } from "./caisse/useCaisseGlobaleData";
import { CaisseGlobaleStats } from "./caisse/CaisseGlobaleStats";
import { CaisseGlobaleTable } from "./caisse/CaisseGlobaleTable";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function CaisseGlobalePage() {
  const d = useCaisseGlobaleData();

  if (d.isLoading) return <MainLayout title="Caisse Globale"><DocumentLoadingState message="Chargement des mouvements..." /></MainLayout>;

  if (d.mouvements.length === 0 && d.sourceFilter === 'all' && !d.dateRange.from) {
    return <MainLayout title="Caisse Globale"><DocumentEmptyState icon={PieChart} title="Aucun mouvement" description="Les mouvements de caisse et banque apparaîtront ici pour une vue globale de votre trésorerie." /></MainLayout>;
  }

  return (
    <MainLayout title="Caisse Globale">
      <motion.div className="space-y-6" initial="hidden" animate="visible" variants={containerVariants}>
        <motion.div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" variants={itemVariants}>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10"><PieChart className="h-6 w-6 text-primary" /></div>
              Caisse Globale
            </h1>
            <p className="text-muted-foreground mt-1">Vue d'ensemble de votre trésorerie</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => d.setExportModalOpen(true)}><FileSpreadsheet className="h-4 w-4" />Exporter</Button>
          </div>
        </motion.div>

        <CaisseGlobaleStats
          soldeGlobal={d.soldeGlobal} soldeCaisse={d.soldeCaisse} soldeBanques={d.soldeBanques}
          totalEntrees={d.totalEntrees} totalSorties={d.totalSorties}
          totalEntreesCaisse={d.totalEntreesCaisse} totalSortiesCaisse={d.totalSortiesCaisse}
          totalEntreesBanque={d.totalEntreesBanque} totalSortiesBanque={d.totalSortiesBanque}
        />

        <motion.div variants={itemVariants} className="flex flex-col gap-3 sm:flex-row sm:items-center bg-card/50 backdrop-blur-sm p-4 rounded-lg border">
          <div className="flex flex-wrap gap-2 flex-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {d.dateRange.from ? (d.dateRange.to ? <>{format(d.dateRange.from, "dd/MM/yyyy")} - {format(d.dateRange.to, "dd/MM/yyyy")}</> : format(d.dateRange.from, "dd/MM/yyyy")) : "Période"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="range" selected={d.dateRange} onSelect={(range) => d.setDateRange({ from: range?.from, to: range?.to })} locale={fr} />
              </PopoverContent>
            </Popover>
            <Select value={d.sourceFilter} onValueChange={(v) => { d.setSourceFilter(v); d.setCurrentPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes sources</SelectItem>
                <SelectItem value="caisse">Caisse</SelectItem>
                <SelectItem value="banque">Banque</SelectItem>
              </SelectContent>
            </Select>
            {d.hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={d.clearFilters} className="gap-1 text-muted-foreground hover:text-foreground"><X className="h-3 w-3" />Réinitialiser</Button>
            )}
          </div>
        </motion.div>

        <CaisseGlobaleTable mouvements={d.mouvements} totalItems={d.totalItems} hasActiveFilters={d.hasActiveFilters} onClearFilters={d.clearFilters} />

        {d.totalPages > 1 && (
          <motion.div variants={itemVariants}>
            <TablePagination currentPage={d.currentPage} totalPages={d.totalPages} pageSize={d.pageSize} totalItems={d.totalItems} onPageChange={d.setCurrentPage} onPageSizeChange={(s) => { d.setPageSize(s); d.setCurrentPage(1); }} />
          </motion.div>
        )}
      </motion.div>

      <ExportCaisseGlobaleModal open={d.exportModalOpen} onOpenChange={d.setExportModalOpen} />
    </MainLayout>
  );
}
