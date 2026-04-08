import { useState, useMemo } from "react";
import { format, subDays } from "date-fns";
import { useAuditLogs, useAuditActions, useAuditModules, useAuditStats, useUsers } from "@/hooks/use-audit";
import type { AuditEntry } from "@/services/auditService";
import { fr } from "date-fns/locale";
import { getActionConfig } from "./constants";

export function useTracabiliteData() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30), to: new Date(),
  });
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [selectedAudit, setSelectedAudit] = useState<AuditEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filters = useMemo(() => ({
    search: searchTerm || undefined,
    action: actionFilter !== "all" ? actionFilter : undefined,
    module: moduleFilter !== "all" ? moduleFilter : undefined,
    user_id: userFilter !== "all" ? parseInt(userFilter) : undefined,
    date_debut: format(dateRange.from, "yyyy-MM-dd"),
    date_fin: format(dateRange.to, "yyyy-MM-dd"),
    page, per_page: perPage,
  }), [searchTerm, actionFilter, moduleFilter, userFilter, dateRange, page, perPage]);

  const { data: auditData, isLoading: isLoadingAudits, isFetching, refetch } = useAuditLogs(filters);
  const { data: actions } = useAuditActions();
  const { data: modules } = useAuditModules();
  const { data: users } = useUsers();
  const { data: stats, isLoading: isLoadingStats } = useAuditStats(
    format(dateRange.from, "yyyy-MM-dd"), format(dateRange.to, "yyyy-MM-dd")
  );

  const audits = auditData?.data || [];
  const totalPages = auditData?.last_page || 1;
  const totalItems = auditData?.total || 0;

  const handleRefresh = () => refetch();
  const handleViewDetail = (audit: AuditEntry) => { setSelectedAudit(audit); setShowDetailModal(true); };
  const handleExport = () => console.log("Export des données...");

  const activityChartData = useMemo(() => {
    if (!stats?.par_jour) return [];
    return stats.par_jour.map((item: any) => ({
      date: format(new Date(item.date), "dd/MM", { locale: fr }),
      total: item.total,
    }));
  }, [stats]);

  const actionsPieData = useMemo(() => {
    if (!stats?.par_action) return [];
    return stats.par_action.map((item: any) => ({
      name: getActionConfig(item.action).label,
      value: item.total,
    }));
  }, [stats]);

  return {
    searchTerm, setSearchTerm, actionFilter, setActionFilter,
    moduleFilter, setModuleFilter, userFilter, setUserFilter,
    dateRange, setDateRange, page, setPage,
    selectedAudit, setSelectedAudit, showDetailModal, setShowDetailModal,
    audits, totalPages, totalItems, isLoadingAudits, isFetching, isLoadingStats,
    actions, modules, users, stats,
    activityChartData, actionsPieData,
    handleRefresh, handleViewDetail, handleExport,
  };
}
