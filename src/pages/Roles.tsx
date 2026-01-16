import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { 
  Plus, Pencil, Trash2, Shield, Copy, Users, Search, 
  ShieldCheck, Lock, Unlock, Eye, ChevronRight, RefreshCw,
  BarChart3, Layers, AlertTriangle, CheckCircle2, XCircle, Loader2,
  Download, FileSpreadsheet, FileText, MoreHorizontal, Filter,
  ArrowUpDown, SortAsc, SortDesc
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  useRoles, 
  useRolesStats, 
  usePermissions, 
  useCreateRole, 
  useUpdateRole, 
  useDeleteRole, 
  useDuplicateRole,
  useRole,
  useAvailableUsers,
  useAssignUsers,
  useUnassignUser
} from "@/hooks/use-roles";
import { Role, PermissionModule, RoleFormData, RoleFilters } from "@/services/roleService";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// Couleurs pour les graphiques
const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(142, 76%, 36%)',
];

// Icônes pour les modules
const MODULE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  clients: Users,
  devis: Layers,
  ordres: Layers,
  factures: Layers,
  paiements: Layers,
  caisse: Layers,
  banques: Layers,
  credits: Layers,
  partenaires: Users,
  notes: Layers,
  utilisateurs: Users,
  configuration: Shield,
  reporting: BarChart3,
  audit: Eye,
};

export default function RolesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("liste");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedRoles, setExpandedRoles] = useState<number[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  
  // Pour la modal utilisateurs
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<number[]>([]);
  const [showAddUsers, setShowAddUsers] = useState(false);
  
  // Pagination & filtres
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filterHasUsers, setFilterHasUsers] = useState<boolean | undefined>(undefined);
  const [filterIsSystem, setFilterIsSystem] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>("asc");
  
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    permissions: string[];
  }>({
    name: '',
    description: '',
    permissions: []
  });

  // Filtres combinés
  const filters: RoleFilters = useMemo(() => ({
    search: searchTerm || undefined,
    page: currentPage,
    per_page: perPage,
    has_users: filterHasUsers,
    is_system: filterIsSystem,
    sort_by: sortBy,
    sort_order: sortOrder,
  }), [searchTerm, currentPage, perPage, filterHasUsers, filterIsSystem, sortBy, sortOrder]);

  // React Query hooks
  const { data: rolesData, isLoading: isLoadingRoles, refetch: refetchRoles, isFetching } = useRoles(filters);
  const { data: statsData, isLoading: isLoadingStats } = useRolesStats();
  const { data: permissionsData, isLoading: isLoadingPermissions } = usePermissions();
  const { data: roleDetail, isLoading: isLoadingRoleDetail, refetch: refetchRoleDetail } = useRole(showUsersModal && selectedRole ? selectedRole.id : null);
  const { data: availableUsersData, isLoading: isLoadingAvailableUsers } = useAvailableUsers(
    showAddUsers && selectedRole ? selectedRole.id : null,
    userSearchTerm || undefined
  );
  
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const duplicateRole = useDuplicateRole();
  const assignUsers = useAssignUsers();
  const unassignUser = useUnassignUser();

  const roles = rolesData?.data || [];
  const totalRoles = rolesData?.total || 0;
  const lastPage = rolesData?.last_page || 1;
  const permissionModules = permissionsData?.data || [];
  const totalPermissions = permissionsData?.total || 0;

  // Stats
  const stats = useMemo(() => {
    if (!statsData) return null;
    return {
      totalRoles: statsData.total_roles,
      totalPermissions: statsData.total_permissions,
      totalUsers: statsData.total_users,
      rolesDistribution: statsData.roles_distribution,
      permissionsByModule: statsData.permissions_by_module,
    };
  }, [statsData]);

  // Reset la page quand les filtres changent
  const resetFilters = () => {
    setCurrentPage(1);
    setFilterHasUsers(undefined);
    setFilterIsSystem(undefined);
    setSortBy("name");
    setSortOrder("asc");
    setSearchTerm("");
  };

  // Fonctions de gestion
  const resetForm = () => {
    setFormData({ name: '', description: '', permissions: [] });
    setSelectedRole(null);
    setIsEditing(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (role: Role) => {
    setSelectedRole(role);
    setIsEditing(true);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: [...role.permissions]
    });
    setShowModal(true);
  };

  const handleDuplicate = async (role: Role) => {
    duplicateRole.mutate(role.id);
  };

  const handleOpenDelete = (role: Role) => {
    setSelectedRole(role);
    setShowDeleteDialog(true);
  };

  const handleShowUsers = (role: Role) => {
    setSelectedRole(role);
    setShowUsersModal(true);
    setShowAddUsers(false);
    setSelectedUsersToAdd([]);
    setUserSearchTerm("");
  };

  const handleUnassignUser = async (userId: number) => {
    if (!selectedRole) return;
    await unassignUser.mutateAsync({ roleId: selectedRole.id, userId });
    refetchRoleDetail();
  };

  const handleAssignUsers = async () => {
    if (!selectedRole || selectedUsersToAdd.length === 0) return;
    await assignUsers.mutateAsync({ roleId: selectedRole.id, userIds: selectedUsersToAdd });
    setSelectedUsersToAdd([]);
    setShowAddUsers(false);
    setUserSearchTerm("");
    refetchRoleDetail();
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsersToAdd(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleRoleExpanded = (roleId: number) => {
    setExpandedRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  // Export functions
  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (searchTerm) params.append('search', searchTerm);
      if (filterHasUsers !== undefined) params.append('has_users', filterHasUsers.toString());
      if (filterIsSystem !== undefined) params.append('is_system', filterIsSystem.toString());

      const response = await api.get(`/exports/roles?${params.toString()}`, {
        responseType: 'blob'
      });

      const contentType = response.headers['content-type'];
      const extension = format === 'pdf' ? 'pdf' : 'csv';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `roles-permissions-${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export réussi",
        description: `Le fichier ${format.toUpperCase()} a été téléchargé.`,
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible de générer l'export.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Gestion des permissions dans le formulaire
  const hasPermission = (permName: string): boolean => {
    return formData.permissions.includes(permName);
  };

  const togglePermission = (permName: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permName)
        ? prev.permissions.filter(p => p !== permName)
        : [...prev.permissions, permName]
    }));
  };

  const toggleModuleAll = (module: PermissionModule) => {
    const modulePermNames = module.permissions.map(p => p.name);
    const allActive = modulePermNames.every(name => formData.permissions.includes(name));
    
    setFormData(prev => ({
      ...prev,
      permissions: allActive
        ? prev.permissions.filter(p => !modulePermNames.includes(p))
        : [...new Set([...prev.permissions, ...modulePermNames])]
    }));
  };

  const isModuleFullyActive = (module: PermissionModule): boolean => {
    return module.permissions.every(p => formData.permissions.includes(p.name));
  };

  const isModulePartiallyActive = (module: PermissionModule): boolean => {
    const count = module.permissions.filter(p => formData.permissions.includes(p.name)).length;
    return count > 0 && count < module.permissions.length;
  };

  const selectAllPermissions = () => {
    const allPerms = permissionModules.flatMap(m => m.permissions.map(p => p.name));
    setFormData(prev => ({ ...prev, permissions: allPerms }));
  };

  const deselectAllPermissions = () => {
    setFormData(prev => ({ ...prev, permissions: [] }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    const payload: RoleFormData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      permissions: formData.permissions,
    };

    if (isEditing && selectedRole) {
      await updateRole.mutateAsync({ id: selectedRole.id, data: payload });
    } else {
      await createRole.mutateAsync(payload);
    }

    setShowModal(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedRole) return;
    await deleteRole.mutateAsync(selectedRole.id);
    setShowDeleteDialog(false);
    setSelectedRole(null);
  };

  // Helper pour calculer le pourcentage de permissions
  const getPermissionPercentage = (role: Role): number => {
    if (totalPermissions === 0) return 0;
    return Math.round((role.permissions_count / totalPermissions) * 100);
  };

  const getModulePermissionCount = (role: Role, moduleName: string): number => {
    return role.permissions.filter(p => p.startsWith(`${moduleName}.`)).length;
  };

  // Toggle sort
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Données pour les graphiques
  const pieChartData = useMemo(() => {
    if (!stats?.rolesDistribution) return [];
    return stats.rolesDistribution.map((r, i) => ({
      name: r.name,
      value: r.users_count,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [stats]);

  const barChartData = useMemo(() => {
    if (!stats?.permissionsByModule) return [];
    return stats.permissionsByModule.map(m => ({
      module: m.module,
      count: m.count,
    }));
  }, [stats]);

  // Check if any filter is active
  const hasActiveFilters = filterHasUsers !== undefined || filterIsSystem !== undefined;

  return (
    <MainLayout title="Gestion des Rôles et Permissions">
      <div className="space-y-6">
        {/* Header avec statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {isLoadingStats ? (
            <>
              {[1, 2, 3, 4].map(i => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Rôles</p>
                        <p className="text-2xl font-bold">{stats?.totalRoles || 0}</p>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-full">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-blue-500/20 bg-blue-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Permissions</p>
                        <p className="text-2xl font-bold">{stats?.totalPermissions || 0}</p>
                      </div>
                      <div className="p-3 bg-blue-500/10 rounded-full">
                        <Lock className="h-5 w-5 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-green-500/20 bg-green-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Utilisateurs</p>
                        <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                      </div>
                      <div className="p-3 bg-green-500/10 rounded-full">
                        <Users className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="border-amber-500/20 bg-amber-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Modules</p>
                        <p className="text-2xl font-bold">{stats?.permissionsByModule?.length || 0}</p>
                      </div>
                      <div className="p-3 bg-amber-500/10 rounded-full">
                        <Layers className="h-5 w-5 text-amber-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList>
                <TabsTrigger value="liste" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Liste des rôles
                </TabsTrigger>
                <TabsTrigger value="statistiques" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Statistiques
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un rôle..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="pl-9"
                  />
                </div>

                {/* Filtre dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className={hasActiveFilters ? "border-primary" : ""}>
                      <Filter className={`h-4 w-4 ${hasActiveFilters ? "text-primary" : ""}`} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="p-2">
                      <Label className="text-xs text-muted-foreground">Utilisateurs</Label>
                      <Select 
                        value={filterHasUsers === undefined ? "all" : filterHasUsers ? "yes" : "no"}
                        onValueChange={(v) => {
                          setFilterHasUsers(v === "all" ? undefined : v === "yes");
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous</SelectItem>
                          <SelectItem value="yes">Avec utilisateurs</SelectItem>
                          <SelectItem value="no">Sans utilisateurs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="p-2">
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <Select 
                        value={filterIsSystem === undefined ? "all" : filterIsSystem ? "system" : "custom"}
                        onValueChange={(v) => {
                          setFilterIsSystem(v === "all" ? undefined : v === "system");
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous</SelectItem>
                          <SelectItem value="system">Système</SelectItem>
                          <SelectItem value="custom">Personnalisés</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={resetFilters}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Réinitialiser les filtres
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Tri */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleSort('name')}>
                      {sortBy === 'name' && (sortOrder === 'asc' ? <SortAsc className="h-4 w-4 mr-2" /> : <SortDesc className="h-4 w-4 mr-2" />)}
                      Nom
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('users_count')}>
                      {sortBy === 'users_count' && (sortOrder === 'asc' ? <SortAsc className="h-4 w-4 mr-2" /> : <SortDesc className="h-4 w-4 mr-2" />)}
                      Utilisateurs
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('permissions_count')}>
                      {sortBy === 'permissions_count' && (sortOrder === 'asc' ? <SortAsc className="h-4 w-4 mr-2" /> : <SortDesc className="h-4 w-4 mr-2" />)}
                      Permissions
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" size="icon" onClick={() => refetchRoles()} disabled={isFetching}>
                  <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                </Button>

                {/* Export */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={isExporting}>
                      {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      <span className="hidden sm:inline ml-2">Exporter</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Exporter en PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('excel')}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Exporter en Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button onClick={handleOpenAdd} className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nouveau rôle</span>
                </Button>
              </div>
            </div>

            {/* Info de résultats */}
            {activeTab === "liste" && !isLoadingRoles && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {totalRoles} rôle{totalRoles > 1 ? 's' : ''} trouvé{totalRoles > 1 ? 's' : ''}
                  {hasActiveFilters && " (filtré)"}
                </span>
                <div className="flex items-center gap-2">
                  <span>Afficher:</span>
                  <Select 
                    value={perPage.toString()} 
                    onValueChange={(v) => { setPerPage(parseInt(v)); setCurrentPage(1); }}
                  >
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Tab: Liste des rôles */}
          <TabsContent value="liste" className="mt-6">
            {isLoadingRoles ? (
              <div className="grid gap-4">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-4 w-60" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : roles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucun rôle trouvé</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || hasActiveFilters ? "Aucun rôle ne correspond à vos critères" : "Commencez par créer un rôle"}
                  </p>
                  {(searchTerm || hasActiveFilters) ? (
                    <Button variant="outline" onClick={resetFilters}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Réinitialiser les filtres
                    </Button>
                  ) : (
                    <Button onClick={handleOpenAdd} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Créer un rôle
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-4">
                  <AnimatePresence mode="popLayout">
                    {roles.map((role, index) => (
                      <motion.div
                        key={role.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={`transition-all hover:shadow-md ${expandedRoles.includes(role.id) ? 'ring-2 ring-primary/20' : ''}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div 
                                className="flex items-center gap-4 cursor-pointer flex-1"
                                onClick={() => toggleRoleExpanded(role.id)}
                              >
                                <div className={`p-3 rounded-xl ${role.is_system ? 'bg-primary text-primary-foreground' : 'bg-primary/10'}`}>
                                  {role.is_system ? (
                                    <ShieldCheck className="h-6 w-6" />
                                  ) : (
                                    <Shield className="h-6 w-6 text-primary" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <CardTitle className="text-lg capitalize">{role.name}</CardTitle>
                                    {role.is_system && (
                                      <Badge variant="secondary" className="text-xs">
                                        Système
                                      </Badge>
                                    )}
                                  </div>
                                  <CardDescription className="mt-1">
                                    {role.description}
                                  </CardDescription>
                                  <div className="flex items-center gap-4 mt-2">
                                    <button 
                                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                                      onClick={(e) => { e.stopPropagation(); handleShowUsers(role); }}
                                    >
                                      <Users className="h-3.5 w-3.5" />
                                      <span>{role.users_count} utilisateur{role.users_count > 1 ? 's' : ''}</span>
                                    </button>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Lock className="h-3.5 w-3.5" />
                                      <span>{role.permissions_count} permission{role.permissions_count > 1 ? 's' : ''}</span>
                                    </div>
                                  </div>
                                </div>
                                <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${expandedRoles.includes(role.id) ? 'rotate-90' : ''}`} />
                              </div>
                              
                              {/* Actions dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="ml-2" onClick={(e) => e.stopPropagation()}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleShowUsers(role)}>
                                    <Users className="h-4 w-4 mr-2" />
                                    Voir les utilisateurs
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDuplicate(role)} disabled={duplicateRole.isPending}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Dupliquer
                                  </DropdownMenuItem>
                                  {!role.is_system && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleOpenEdit(role)}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Modifier
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleOpenDelete(role)}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Supprimer
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Barre de progression des permissions */}
                            <div className="mt-4">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Niveau d'accès</span>
                                <span className="font-medium">{getPermissionPercentage(role)}%</span>
                              </div>
                              <Progress value={getPermissionPercentage(role)} className="h-2" />
                            </div>
                          </CardHeader>

                          {/* Contenu étendu */}
                          <AnimatePresence>
                            {expandedRoles.includes(role.id) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <CardContent className="pt-0">
                                  <div className="border-t pt-4">
                                    <h4 className="text-sm font-medium mb-3">Permissions par module</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                      {permissionModules.map(module => {
                                        const moduleCount = getModulePermissionCount(role, module.module);
                                        const totalModulePerms = module.permissions.length;
                                        const Icon = MODULE_ICONS[module.module] || Shield;
                                        
                                        return (
                                          <div 
                                            key={module.module}
                                            className={`p-3 rounded-lg border ${moduleCount === totalModulePerms ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : moduleCount > 0 ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' : 'bg-muted/30'}`}
                                          >
                                            <div className="flex items-center gap-2 mb-1">
                                              <Icon className={`h-4 w-4 ${moduleCount === totalModulePerms ? 'text-green-600' : moduleCount > 0 ? 'text-amber-600' : 'text-muted-foreground'}`} />
                                              <span className="text-sm font-medium capitalize">{module.label}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              {moduleCount === totalModulePerms ? (
                                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                              ) : moduleCount > 0 ? (
                                                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                              ) : (
                                                <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                              )}
                                              <span className="text-xs text-muted-foreground">
                                                {moduleCount}/{totalModulePerms}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </CardContent>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Pagination */}
                {lastPage > 1 && (
                  <div className="mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: lastPage }, (_, i) => i + 1)
                          .filter(page => {
                            if (lastPage <= 5) return true;
                            if (page === 1 || page === lastPage) return true;
                            if (Math.abs(page - currentPage) <= 1) return true;
                            return false;
                          })
                          .map((page, idx, arr) => (
                            <PaginationItem key={page}>
                              {idx > 0 && arr[idx - 1] !== page - 1 && (
                                <span className="px-2">...</span>
                              )}
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(p => Math.min(lastPage, p + 1))}
                            className={currentPage === lastPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Tab: Statistiques */}
          <TabsContent value="statistiques" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Distribution des utilisateurs */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Répartition des utilisateurs par rôle</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingStats ? (
                    <div className="h-64 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : pieChartData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                            labelLine={false}
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      Aucune donnée disponible
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Permissions par module */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Permissions par module</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingStats ? (
                    <div className="h-64 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : barChartData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barChartData} layout="vertical">
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="module" width={100} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      Aucune donnée disponible
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Liste détaillée des rôles */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Détail des rôles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Rôle</th>
                          <th className="text-center py-3 px-4 font-medium">Utilisateurs</th>
                          <th className="text-center py-3 px-4 font-medium">Permissions</th>
                          <th className="text-center py-3 px-4 font-medium">Niveau d'accès</th>
                          <th className="text-center py-3 px-4 font-medium">Type</th>
                          <th className="text-center py-3 px-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roles.map(role => (
                          <tr key={role.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-primary" />
                                <span className="font-medium capitalize">{role.name}</span>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">
                              <Badge variant="secondary">{role.users_count}</Badge>
                            </td>
                            <td className="text-center py-3 px-4">{role.permissions_count}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Progress value={getPermissionPercentage(role)} className="h-2 w-20" />
                                <span className="text-xs text-muted-foreground">{getPermissionPercentage(role)}%</span>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">
                              {role.is_system ? (
                                <Badge>Système</Badge>
                              ) : (
                                <Badge variant="outline">Personnalisé</Badge>
                              )}
                            </td>
                            <td className="text-center py-3 px-4">
                              <Button variant="ghost" size="sm" onClick={() => handleShowUsers(role)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal Ajout/Modification */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Modifier le rôle' : 'Nouveau rôle'}</DialogTitle>
              <DialogDescription>
                {isEditing ? 'Modifiez les informations et permissions du rôle' : 'Créez un nouveau rôle avec ses permissions'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {/* Infos de base */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du rôle *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Comptable, Commercial..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description du rôle..."
                    rows={1}
                  />
                </div>
              </div>

              {/* Résumé des permissions */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{formData.permissions.length}</strong> permissions sélectionnées sur {totalPermissions}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllPermissions}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Tout sélectionner
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAllPermissions}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Tout désélectionner
                  </Button>
                </div>
              </div>

              {/* Permissions par module */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Permissions par module</Label>

                {isLoadingPermissions ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                  </div>
                ) : (
                  <Accordion type="multiple" className="w-full border rounded-lg">
                    {permissionModules.map(module => {
                      const Icon = MODULE_ICONS[module.module] || Shield;
                      const fullyActive = isModuleFullyActive(module);
                      const partiallyActive = isModulePartiallyActive(module);
                      const activeCount = module.permissions.filter(p => formData.permissions.includes(p.name)).length;
                      
                      return (
                        <AccordionItem key={module.module} value={module.module} className="border-b last:border-0">
                          <AccordionTrigger className="hover:no-underline px-4">
                            <div className="flex items-center gap-3 flex-1">
                              <Checkbox
                                checked={fullyActive}
                                className={partiallyActive ? "data-[state=checked]:bg-amber-500 border-amber-500" : ""}
                                onCheckedChange={() => toggleModuleAll(module)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{module.label}</span>
                              <Badge 
                                variant={fullyActive ? "default" : partiallyActive ? "secondary" : "outline"}
                                className="ml-auto"
                              >
                                {activeCount}/{module.permissions.length}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8 pt-2">
                              {module.permissions.map(perm => (
                                <div 
                                  key={perm.name} 
                                  className={`flex items-center gap-2 p-2 rounded transition-colors ${hasPermission(perm.name) ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
                                >
                                  <Checkbox
                                    id={perm.name}
                                    checked={hasPermission(perm.name)}
                                    onCheckedChange={() => togglePermission(perm.name)}
                                  />
                                  <Label htmlFor={perm.name} className="text-sm cursor-pointer flex-1">
                                    {perm.label}
                                  </Label>
                                  {hasPermission(perm.name) && (
                                    <Unlock className="h-3.5 w-3.5 text-primary" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!formData.name.trim() || createRole.isPending || updateRole.isPending}
              >
                {(createRole.isPending || updateRole.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {isEditing ? 'Enregistrer' : 'Créer le rôle'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Utilisateurs du rôle */}
        <Dialog open={showUsersModal} onOpenChange={(open) => {
          setShowUsersModal(open);
          if (!open) {
            setShowAddUsers(false);
            setSelectedUsersToAdd([]);
            setUserSearchTerm("");
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestion des utilisateurs - Rôle "{selectedRole?.name}"
              </DialogTitle>
              <DialogDescription>
                {roleDetail?.users?.length || 0} utilisateur(s) assigné(s) à ce rôle
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden">
              {/* Tabs: Liste / Ajouter */}
              <div className="flex gap-2 mb-4">
                <Button 
                  variant={!showAddUsers ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setShowAddUsers(false)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Utilisateurs actuels
                </Button>
                <Button 
                  variant={showAddUsers ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setShowAddUsers(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter des utilisateurs
                </Button>
              </div>

              {!showAddUsers ? (
                // Liste des utilisateurs actuels
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {isLoadingRoleDetail ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-1 flex-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : roleDetail?.users && roleDetail.users.length > 0 ? (
                    <>
                      {roleDetail.users.map(user => (
                        <div 
                          key={user.id} 
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                        >
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-primary">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{user.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          </div>
                          <Badge variant={user.actif ? "default" : "secondary"} className="flex-shrink-0">
                            {user.actif ? "Actif" : "Inactif"}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleUnassignUser(user.id)}
                            disabled={unassignUser.isPending}
                          >
                            {unassignUser.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground mb-4">Aucun utilisateur n'a ce rôle</p>
                      <Button size="sm" onClick={() => setShowAddUsers(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter des utilisateurs
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                // Interface d'ajout d'utilisateurs
                <div className="space-y-4">
                  {/* Recherche */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un utilisateur..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* Sélection en cours */}
                  {selectedUsersToAdd.length > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {selectedUsersToAdd.length} utilisateur(s) sélectionné(s)
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-auto"
                        onClick={() => setSelectedUsersToAdd([])}
                      >
                        Tout désélectionner
                      </Button>
                    </div>
                  )}

                  {/* Liste des utilisateurs disponibles */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {isLoadingAvailableUsers ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex items-center gap-3 p-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-1 flex-1">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-48" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : availableUsersData?.data && availableUsersData.data.length > 0 ? (
                      <>
                        {availableUsersData.data.map(user => {
                          const isSelected = selectedUsersToAdd.includes(user.id);
                          return (
                            <div 
                              key={user.id} 
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                isSelected 
                                  ? 'bg-primary/10 border-primary' 
                                  : 'bg-card hover:bg-muted/50'
                              }`}
                              onClick={() => toggleUserSelection(user.id)}
                            >
                              <Checkbox 
                                checked={isSelected}
                                onCheckedChange={() => toggleUserSelection(user.id)}
                              />
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-semibold">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{user.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              </div>
                              {user.current_role && (
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  {user.current_role}
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {userSearchTerm 
                            ? "Aucun utilisateur trouvé" 
                            : "Tous les utilisateurs ont déjà un rôle assigné"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 pt-4 border-t">
              {showAddUsers ? (
                <>
                  <Button variant="outline" onClick={() => setShowAddUsers(false)}>
                    Retour
                  </Button>
                  <Button 
                    onClick={handleAssignUsers}
                    disabled={selectedUsersToAdd.length === 0 || assignUsers.isPending}
                  >
                    {assignUsers.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Assigner {selectedUsersToAdd.length > 0 && `(${selectedUsersToAdd.length})`}
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setShowUsersModal(false)}>
                  Fermer
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation de suppression */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce rôle ?</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le rôle "<strong className="capitalize">{selectedRole?.name}</strong>" ?
                {selectedRole && selectedRole.users_count > 0 && (
                  <span className="block mt-2 text-destructive">
                    ⚠️ Ce rôle est assigné à {selectedRole.users_count} utilisateur(s).
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete} 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteRole.isPending}
              >
                {deleteRole.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
