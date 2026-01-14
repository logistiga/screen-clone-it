import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Search, 
  RefreshCw, 
  Download, 
  Eye, 
  Calendar as CalendarIcon,
  Activity,
  Users,
  FileText,
  Edit,
  Trash2,
  Plus,
  Shield,
  Clock,
  Monitor,
  Globe,
  ChevronLeft,
  ChevronRight,
  Filter,
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Loader2
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";

import { 
  useAuditLogs, 
  useAuditActions, 
  useAuditModules, 
  useAuditStats,
  useUsers 
} from "@/hooks/use-audit";
import type { AuditEntry } from "@/services/auditService";

// Couleurs pour les graphiques
const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
];

// Labels et icônes pour les actions
const actionConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  create: { 
    label: "Création", 
    icon: <Plus className="h-3 w-3" />, 
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" 
  },
  update: { 
    label: "Modification", 
    icon: <Edit className="h-3 w-3" />, 
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" 
  },
  delete: { 
    label: "Suppression", 
    icon: <Trash2 className="h-3 w-3" />, 
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" 
  },
  view: { 
    label: "Consultation", 
    icon: <Eye className="h-3 w-3" />, 
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" 
  },
  login: { 
    label: "Connexion", 
    icon: <Shield className="h-3 w-3" />, 
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" 
  },
  logout: { 
    label: "Déconnexion", 
    icon: <Shield className="h-3 w-3" />, 
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" 
  },
  export: { 
    label: "Export", 
    icon: <Download className="h-3 w-3" />, 
    color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400" 
  },
};

// Labels pour les modules
const moduleLabels: Record<string, string> = {
  clients: "Clients",
  devis: "Devis",
  factures: "Factures",
  ordres: "Ordres de travail",
  paiements: "Paiements",
  banques: "Banques",
  caisse: "Caisse",
  users: "Utilisateurs",
  auth: "Authentification",
  configuration: "Configuration",
  reporting: "Reporting",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export default function TracabilitePage() {
  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  
  // Modal state
  const [selectedAudit, setSelectedAudit] = useState<AuditEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Build filters object
  const filters = useMemo(() => ({
    search: searchTerm || undefined,
    action: actionFilter !== "all" ? actionFilter : undefined,
    module: moduleFilter !== "all" ? moduleFilter : undefined,
    user_id: userFilter !== "all" ? parseInt(userFilter) : undefined,
    date_debut: format(dateRange.from, "yyyy-MM-dd"),
    date_fin: format(dateRange.to, "yyyy-MM-dd"),
    page,
    per_page: perPage,
  }), [searchTerm, actionFilter, moduleFilter, userFilter, dateRange, page, perPage]);

  // React Query hooks
  const { 
    data: auditData, 
    isLoading: isLoadingAudits, 
    isFetching,
    refetch 
  } = useAuditLogs(filters);

  const { data: actions } = useAuditActions();
  const { data: modules } = useAuditModules();
  const { data: users } = useUsers();
  const { 
    data: stats, 
    isLoading: isLoadingStats 
  } = useAuditStats(
    format(dateRange.from, "yyyy-MM-dd"),
    format(dateRange.to, "yyyy-MM-dd")
  );

  const audits = auditData?.data || [];
  const totalPages = auditData?.last_page || 1;
  const totalItems = auditData?.total || 0;

  // Handlers
  const handleRefresh = () => {
    refetch();
  };

  const handleViewDetail = (audit: AuditEntry) => {
    setSelectedAudit(audit);
    setShowDetailModal(true);
  };

  const handleExport = () => {
    // TODO: Implémenter l'export CSV
    console.log("Export des données...");
  };

  const getActionConfig = (action: string) => {
    return actionConfig[action.toLowerCase()] || {
      label: action,
      icon: <Activity className="h-3 w-3" />,
      color: "bg-muted text-muted-foreground"
    };
  };

  const getModuleLabel = (module: string) => {
    return moduleLabels[module?.toLowerCase()] || module || "Système";
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm:ss", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const formatDateShort = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM HH:mm", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  // Prepare chart data
  const activityChartData = useMemo(() => {
    if (!stats?.par_jour) return [];
    return stats.par_jour.map(item => ({
      date: format(new Date(item.date), "dd/MM", { locale: fr }),
      total: item.total,
    }));
  }, [stats]);

  const actionsPieData = useMemo(() => {
    if (!stats?.par_action) return [];
    return stats.par_action.map(item => ({
      name: getActionConfig(item.action).label,
      value: item.total,
    }));
  }, [stats]);

  return (
    <MainLayout title="Traçabilité & Audit">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Traçabilité & Audit
            </h1>
            <p className="text-muted-foreground mt-1">
              Suivi complet de toutes les actions effectuées dans le système
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isFetching}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div variants={itemVariants}>
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total actions</p>
                    {isLoadingStats ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold">{stats?.total?.toLocaleString() || 0}</p>
                    )}
                  </div>
                  <div className="p-3 rounded-full bg-primary/10">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Créations</p>
                    {isLoadingStats ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-emerald-600">
                        {stats?.par_action?.find(a => a.action === 'create')?.total || 0}
                      </p>
                    )}
                  </div>
                  <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <Plus className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Modifications</p>
                    {isLoadingStats ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-blue-600">
                        {stats?.par_action?.find(a => a.action === 'update')?.total || 0}
                      </p>
                    )}
                  </div>
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Edit className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Suppressions</p>
                    {isLoadingStats ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-red-600">
                        {stats?.par_action?.find(a => a.action === 'delete')?.total || 0}
                      </p>
                    )}
                  </div>
                  <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs: Journal & Statistiques */}
        <Tabs defaultValue="journal" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="journal" className="gap-2">
              <FileText className="h-4 w-4" />
              Journal d'audit
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistiques
            </TabsTrigger>
          </TabsList>

          {/* Journal Tab */}
          <TabsContent value="journal" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Search */}
                  <div className="relative lg:col-span-2">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher dans les logs..."
                      value={searchTerm}
                      onChange={e => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                      }}
                      className="pl-9"
                    />
                  </div>

                  {/* Action Filter */}
                  <Select 
                    value={actionFilter} 
                    onValueChange={value => {
                      setActionFilter(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les actions</SelectItem>
                      {actions?.map(action => (
                        <SelectItem key={action} value={action}>
                          {getActionConfig(action).label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Module Filter */}
                  <Select 
                    value={moduleFilter} 
                    onValueChange={value => {
                      setModuleFilter(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les modules</SelectItem>
                      {modules?.map(module => (
                        <SelectItem key={module} value={module}>
                          {getModuleLabel(module)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* User Filter */}
                  <Select 
                    value={userFilter} 
                    onValueChange={value => {
                      setUserFilter(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Utilisateur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les utilisateurs</SelectItem>
                      {users?.map(user => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    Période:
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        {format(dateRange.from, "dd/MM/yyyy", { locale: fr })}
                        <span>→</span>
                        {format(dateRange.to, "dd/MM/yyyy", { locale: fr })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        defaultMonth={dateRange.from}
                        selected={{ from: dateRange.from, to: dateRange.to }}
                        onSelect={(range) => {
                          if (range?.from && range?.to) {
                            setDateRange({ from: range.from, to: range.to });
                            setPage(1);
                          }
                        }}
                        numberOfMonths={2}
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Quick date filters */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDateRange({ from: subDays(new Date(), 7), to: new Date() });
                        setPage(1);
                      }}
                    >
                      7 jours
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDateRange({ from: subDays(new Date(), 30), to: new Date() });
                        setPage(1);
                      }}
                    >
                      30 jours
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDateRange({ 
                          from: startOfMonth(new Date()), 
                          to: endOfMonth(new Date()) 
                        });
                        setPage(1);
                      }}
                    >
                      Ce mois
                    </Button>
                  </div>

                  {/* Results count */}
                  <div className="ml-auto text-sm text-muted-foreground">
                    {totalItems.toLocaleString()} résultat{totalItems !== 1 ? 's' : ''}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                {isLoadingAudits ? (
                  <div className="p-6 space-y-4">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 w-10" />
                      </div>
                    ))}
                  </div>
                ) : audits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="p-4 rounded-full bg-muted mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-lg">Aucun log trouvé</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Aucune action ne correspond aux critères de recherche
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead className="w-[140px]">Date & Heure</TableHead>
                          <TableHead className="w-[150px]">Utilisateur</TableHead>
                          <TableHead className="w-[120px]">Action</TableHead>
                          <TableHead className="w-[120px]">Module</TableHead>
                          <TableHead className="w-[120px]">Document</TableHead>
                          <TableHead>Détails</TableHead>
                          <TableHead className="w-[100px]">IP</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence mode="popLayout">
                          {audits.map((audit, index) => {
                            const actionCfg = getActionConfig(audit.action);
                            return (
                              <motion.tr
                                key={audit.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ delay: index * 0.02 }}
                                className="group hover:bg-muted/30 transition-colors"
                              >
                                <TableCell className="font-mono text-xs">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    {formatDateShort(audit.created_at)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                      {audit.user?.name?.charAt(0).toUpperCase() || "?"}
                                    </div>
                                    <span className="truncate max-w-[100px]">
                                      {audit.user?.name || "Système"}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={`${actionCfg.color} gap-1`}>
                                    {actionCfg.icon}
                                    {actionCfg.label}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="font-normal">
                                    {getModuleLabel(audit.module)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {audit.document_numero ? (
                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                      {audit.document_numero}
                                    </code>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">—</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <p className="text-sm truncate max-w-[300px]" title={audit.details || ""}>
                                    {audit.details || "—"}
                                  </p>
                                </TableCell>
                                <TableCell>
                                  <code className="text-xs text-muted-foreground">
                                    {audit.ip_address || "—"}
                                  </code>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleViewDetail(audit)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </motion.tr>
                            );
                          })}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="text-sm text-muted-foreground">
                      Page {page} sur {totalPages}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                        if (pageNum > totalPages) return null;
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Activité journalière
                  </CardTitle>
                  <CardDescription>
                    Nombre d'actions par jour sur la période sélectionnée
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingStats ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={activityChartData}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }} 
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }} 
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="total"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fill="url(#colorTotal)"
                          name="Actions"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Actions Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Répartition par action
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingStats ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={actionsPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {actionsPieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Top Users */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Utilisateurs les plus actifs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingStats ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats?.par_utilisateur?.slice(0, 5).map((item, index) => (
                        <div key={item.user_id} className="flex items-center gap-3">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {item.user?.name || `Utilisateur #${item.user_id}`}
                            </p>
                            <div className="h-2 bg-muted rounded-full mt-1 overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ 
                                  width: `${(item.total / (stats?.total || 1)) * 100}%` 
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-medium text-muted-foreground">
                            {item.total}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Détail de l'action
              </DialogTitle>
            </DialogHeader>
            
            {selectedAudit && (
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-6">
                  {/* Header info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Date & Heure</p>
                      <p className="font-medium">{formatDateTime(selectedAudit.created_at)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Utilisateur</p>
                      <p className="font-medium">{selectedAudit.user?.name || "Système"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Action</p>
                      <Badge className={getActionConfig(selectedAudit.action).color}>
                        {getActionConfig(selectedAudit.action).label}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Module</p>
                      <Badge variant="outline">{getModuleLabel(selectedAudit.module)}</Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Document info */}
                  {selectedAudit.document_numero && (
                    <>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Document</p>
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-mono font-medium">{selectedAudit.document_numero}</p>
                            <p className="text-xs text-muted-foreground">
                              {selectedAudit.document_type} #{selectedAudit.document_id}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Details */}
                  {selectedAudit.details && (
                    <>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Détails</p>
                        <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedAudit.details}</p>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Old/New Values */}
                  {(selectedAudit.old_values || selectedAudit.new_values) && (
                    <div className="space-y-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Modifications</p>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedAudit.old_values && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-red-600 flex items-center gap-1">
                              <XCircle className="h-4 w-4" />
                              Anciennes valeurs
                            </p>
                            <pre className="text-xs bg-red-50 dark:bg-red-900/20 p-3 rounded-lg overflow-auto max-h-48">
                              {JSON.stringify(selectedAudit.old_values, null, 2)}
                            </pre>
                          </div>
                        )}
                        {selectedAudit.new_values && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              Nouvelles valeurs
                            </p>
                            <pre className="text-xs bg-green-50 dark:bg-green-900/20 p-3 rounded-lg overflow-auto max-h-48">
                              {JSON.stringify(selectedAudit.new_values, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Technical info */}
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Informations techniques</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">IP:</span>
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                          {selectedAudit.ip_address || "N/A"}
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">ID:</span>
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                          #{selectedAudit.id}
                        </code>
                      </div>
                    </div>
                    {selectedAudit.user_agent && (
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded overflow-x-auto">
                        {selectedAudit.user_agent}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </MainLayout>
  );
}
