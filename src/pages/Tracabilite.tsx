import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, RefreshCw, Download, FileText, BarChart3 } from "lucide-react";
import { useTracabiliteData } from "./tracabilite/useTracabiliteData";
import { TracabiliteStatsCards } from "./tracabilite/TracabiliteStatsCards";
import { TracabiliteFilters } from "./tracabilite/TracabiliteFilters";
import { TracabiliteTable } from "./tracabilite/TracabiliteTable";
import { TracabiliteCharts } from "./tracabilite/TracabiliteCharts";
import { TracabiliteDetailModal } from "./tracabilite/TracabiliteDetailModal";

export default function TracabilitePage() {
  const d = useTracabiliteData();

  return (
    <MainLayout title="Traçabilité & Audit">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />Traçabilité & Audit
            </h1>
            <p className="text-muted-foreground mt-1">Suivi complet de toutes les actions effectuées dans le système</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={d.handleRefresh} disabled={d.isFetching} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${d.isFetching ? 'animate-spin' : ''}`} />Actualiser
            </Button>
            <Button variant="outline" size="sm" onClick={d.handleExport} className="gap-2"><Download className="h-4 w-4" />Exporter</Button>
          </div>
        </div>

        <TracabiliteStatsCards stats={d.stats} isLoadingStats={d.isLoadingStats} />

        <Tabs defaultValue="journal" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="journal" className="gap-2"><FileText className="h-4 w-4" />Journal d'audit</TabsTrigger>
            <TabsTrigger value="stats" className="gap-2"><BarChart3 className="h-4 w-4" />Statistiques</TabsTrigger>
          </TabsList>

          <TabsContent value="journal" className="space-y-4">
            <TracabiliteFilters
              searchTerm={d.searchTerm} onSearchChange={d.setSearchTerm}
              actionFilter={d.actionFilter} onActionChange={d.setActionFilter}
              moduleFilter={d.moduleFilter} onModuleChange={d.setModuleFilter}
              userFilter={d.userFilter} onUserChange={d.setUserFilter}
              dateRange={d.dateRange} onDateRangeChange={d.setDateRange}
              actions={d.actions} modules={d.modules} users={d.users}
              totalItems={d.totalItems} onResetPage={() => d.setPage(1)}
            />
            <TracabiliteTable audits={d.audits} isLoading={d.isLoadingAudits} page={d.page} totalPages={d.totalPages} onPageChange={d.setPage} onViewDetail={d.handleViewDetail} />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <TracabiliteCharts activityChartData={d.activityChartData} actionsPieData={d.actionsPieData} stats={d.stats} isLoadingStats={d.isLoadingStats} />
          </TabsContent>
        </Tabs>

        <TracabiliteDetailModal open={d.showDetailModal} onOpenChange={d.setShowDetailModal} audit={d.selectedAudit} />
      </motion.div>
    </MainLayout>
  );
}
