import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import {
  Plus, Pencil, Trash2, Shield, Copy, Users, Search,
  ShieldCheck, Lock, Eye, ChevronRight, RefreshCw,
  BarChart3, Layers, CheckCircle2, XCircle, Loader2,
  Download, FileSpreadsheet, FileText, MoreHorizontal, Filter,
  ArrowUpDown, SortAsc, SortDesc,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useRoles, useRolesStats, usePermissions,
  useDeleteRole, useDuplicateRole,
} from "@/hooks/use-roles";
import { Role, RoleFilters } from "@/services/roleService";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { getPermissionsByModule } from "@/config/permissionsConfig";
import { RolesStatsCards } from "./roles/RolesStatsCards";
import { RolesMatriceTab } from "./roles/RolesMatriceTab";
import { RolesStatistiquesTab } from "./roles/RolesStatistiquesTab";
import { RolesUsersModal } from "./roles/RolesUsersModal";

// Module icons for expanded role view
import {
  Users as UsersIcon, FileText as FileTextIcon, ClipboardList, Receipt, CreditCard, Wallet,
  Building2, TrendingUp, Handshake, Ship, Truck, Store,
  Package, Warehouse, FileStack, Settings, History,
  LayoutDashboard, BarChart3 as BarChart3Icon, ShieldCheck as ShieldCheckIcon, Download as DownloadIcon,
} from "lucide-react";

const MODULE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  clients: UsersIcon, devis: FileTextIcon, ordres: ClipboardList, factures: Receipt,
  paiements: CreditCard, caisse: Wallet, banques: Building2, credits: TrendingUp,
  partenaires: Handshake, transitaires: Ship, transporteurs: Truck, fournisseurs: Store,
  produits: Package, stocks: Warehouse, notes: FileStack, utilisateurs: UsersIcon,
  roles: Shield, configuration: Settings, reporting: BarChart3Icon, dashboard: LayoutDashboard,
  audit: History, securite: ShieldCheckIcon, exports: DownloadIcon,
};

export default function RolesPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("liste");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [expandedRoles, setExpandedRoles] = useState<number[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filterHasUsers, setFilterHasUsers] = useState<boolean | undefined>(undefined);
  const [filterIsSystem, setFilterIsSystem] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>("asc");

  const filters: RoleFilters = useMemo(() => ({
    search: searchTerm || undefined, page: currentPage, per_page: perPage,
    has_users: filterHasUsers, is_system: filterIsSystem, sort_by: sortBy, sort_order: sortOrder,
  }), [searchTerm, currentPage, perPage, filterHasUsers, filterIsSystem, sortBy, sortOrder]);

  const { data: rolesData, isLoading: isLoadingRoles, refetch: refetchRoles, isFetching } = useRoles(filters);
  const { data: statsData, isLoading: isLoadingStats } = useRolesStats();
  const deleteRole = useDeleteRole();
  const duplicateRole = useDuplicateRole();

  const roles = rolesData?.data || [];
  const lastPage = rolesData?.last_page || 1;
  const totalRoles = rolesData?.total || 0;

  const localPermissionModules = useMemo(() => getPermissionsByModule(), []);
  const totalLocalPermissions = localPermissionModules.reduce((sum, m) => sum + m.permissions.length, 0);

  const stats = useMemo(() => {
    if (!statsData) return null;
    return { totalRoles: statsData.total_roles, totalPermissions: statsData.total_permissions, totalUsers: statsData.total_users };
  }, [statsData]);

  const hasActiveFilters = filterHasUsers !== undefined || filterIsSystem !== undefined;
  const resetFilters = () => { setCurrentPage(1); setFilterHasUsers(undefined); setFilterIsSystem(undefined); setSortBy("name"); setSortOrder("asc"); setSearchTerm(""); };

  const handleSort = (field: string) => { if (sortBy === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); else { setSortBy(field); setSortOrder('asc'); } setCurrentPage(1); };
  const getPermissionPercentage = (role: Role): number => { if (totalLocalPermissions === 0) return 0; return Math.round((role.permissions_count / totalLocalPermissions) * 100); };
  const getModulePermissionCount = (role: Role, moduleName: string): number => role.permissions.filter(p => p.startsWith(`${moduleName}.`)).length;

  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams(); params.append('format', format);
      if (searchTerm) params.append('search', searchTerm);
      const response = await api.get(`/exports/roles?${params.toString()}`, { responseType: 'blob' });
      const ext = format === 'pdf' ? 'pdf' : 'csv';
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = `roles-${new Date().toISOString().split('T')[0]}.${ext}`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(url);
      toast({ title: "Export réussi", description: `Fichier ${format.toUpperCase()} téléchargé.` });
    } catch { toast({ title: "Erreur d'export", variant: "destructive" }); }
    finally { setIsExporting(false); }
  };

  const handleDelete = async () => { if (!selectedRole) return; await deleteRole.mutateAsync(selectedRole.id); setShowDeleteDialog(false); setSelectedRole(null); };

  return (
    <MainLayout title="Gestion des Rôles et Permissions">
      <div className="space-y-6">
        <RolesStatsCards isLoading={isLoadingStats} stats={stats} totalLocalPermissions={totalLocalPermissions} />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList>
                <TabsTrigger value="liste" className="gap-2"><Shield className="h-4 w-4" />Liste des rôles</TabsTrigger>
                <TabsTrigger value="matrice" className="gap-2"><Layers className="h-4 w-4" />Matrice</TabsTrigger>
                <TabsTrigger value="statistiques" className="gap-2"><BarChart3 className="h-4 w-4" />Statistiques</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Rechercher un rôle..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-9" />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="outline" size="icon" className={hasActiveFilters ? "border-primary" : ""}><Filter className={`h-4 w-4 ${hasActiveFilters ? "text-primary" : ""}`} /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="p-2">
                      <Label className="text-xs text-muted-foreground">Utilisateurs</Label>
                      <Select value={filterHasUsers === undefined ? "all" : filterHasUsers ? "yes" : "no"} onValueChange={(v) => { setFilterHasUsers(v === "all" ? undefined : v === "yes"); setCurrentPage(1); }}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="all">Tous</SelectItem><SelectItem value="yes">Avec utilisateurs</SelectItem><SelectItem value="no">Sans utilisateurs</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="p-2">
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <Select value={filterIsSystem === undefined ? "all" : filterIsSystem ? "system" : "custom"} onValueChange={(v) => { setFilterIsSystem(v === "all" ? undefined : v === "system"); setCurrentPage(1); }}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="all">Tous</SelectItem><SelectItem value="system">Système</SelectItem><SelectItem value="custom">Personnalisés</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={resetFilters}><XCircle className="h-4 w-4 mr-2" />Réinitialiser</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="outline" size="icon"><ArrowUpDown className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {[{ field: 'name', label: 'Nom' }, { field: 'users_count', label: 'Utilisateurs' }, { field: 'permissions_count', label: 'Permissions' }].map(({ field, label }) => (
                      <DropdownMenuItem key={field} onClick={() => handleSort(field)}>
                        {sortBy === field && (sortOrder === 'asc' ? <SortAsc className="h-4 w-4 mr-2" /> : <SortDesc className="h-4 w-4 mr-2" />)}{label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" size="icon" onClick={() => refetchRoles()} disabled={isFetching}><RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /></Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="outline" disabled={isExporting}>{isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}<span className="hidden sm:inline ml-2">Exporter</span></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('pdf')}><FileText className="h-4 w-4 mr-2" />PDF</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('excel')}><FileSpreadsheet className="h-4 w-4 mr-2" />Excel</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button onClick={() => navigate('/roles/nouveau')} className="gap-2"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Nouveau rôle</span></Button>
              </div>
            </div>

            {activeTab === "liste" && !isLoadingRoles && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{totalRoles} rôle{totalRoles > 1 ? 's' : ''}{hasActiveFilters && " (filtré)"}</span>
                <div className="flex items-center gap-2">
                  <span>Afficher:</span>
                  <Select value={perPage.toString()} onValueChange={(v) => { setPerPage(parseInt(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{[5, 10, 20, 50].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <TabsContent value="liste" className="mt-6">
            {isLoadingRoles ? (
              <div className="grid gap-4">{[1, 2, 3].map(i => <Card key={i}><CardContent className="p-6"><div className="flex items-start gap-4"><Skeleton className="h-12 w-12 rounded-lg" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-60" /></div></div></CardContent></Card>)}</div>
            ) : roles.length === 0 ? (
              <Card><CardContent className="py-12 text-center"><Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" /><h3 className="text-lg font-medium mb-2">Aucun rôle trouvé</h3><p className="text-muted-foreground mb-4">{searchTerm || hasActiveFilters ? "Aucun rôle ne correspond" : "Commencez par créer un rôle"}</p>{(searchTerm || hasActiveFilters) ? <Button variant="outline" onClick={resetFilters}><XCircle className="h-4 w-4 mr-2" />Réinitialiser</Button> : <Button onClick={() => navigate('/roles/nouveau')} className="gap-2"><Plus className="h-4 w-4" />Créer un rôle</Button>}</CardContent></Card>
            ) : (
              <>
                <div className="grid gap-4">
                  <AnimatePresence mode="popLayout">
                    {roles.map((role, index) => (
                      <motion.div key={role.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: index * 0.05 }}>
                        <Card className={`transition-all hover:shadow-md ${expandedRoles.includes(role.id) ? 'ring-2 ring-primary/20' : ''}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => setExpandedRoles(prev => prev.includes(role.id) ? prev.filter(id => id !== role.id) : [...prev, role.id])}>
                                <div className={`p-3 rounded-xl ${role.is_system ? 'bg-primary text-primary-foreground' : 'bg-primary/10'}`}>
                                  {role.is_system ? <ShieldCheck className="h-6 w-6" /> : <Shield className="h-6 w-6 text-primary" />}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2"><CardTitle className="text-lg capitalize">{role.name}</CardTitle>{role.is_system && <Badge variant="secondary" className="text-xs">Système</Badge>}</div>
                                  <CardDescription className="mt-1">{role.description}</CardDescription>
                                  <div className="flex items-center gap-4 mt-2">
                                    <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors" onClick={(e) => { e.stopPropagation(); setSelectedRole(role); setShowUsersModal(true); }}>
                                      <Users className="h-3.5 w-3.5" /><span>{role.users_count} utilisateur{role.users_count > 1 ? 's' : ''}</span>
                                    </button>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground"><Lock className="h-3.5 w-3.5" /><span>{role.permissions_count} permission{role.permissions_count > 1 ? 's' : ''}</span></div>
                                  </div>
                                </div>
                                <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${expandedRoles.includes(role.id) ? 'rotate-90' : ''}`} />
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="ml-2" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setSelectedRole(role); setShowUsersModal(true); }}><Users className="h-4 w-4 mr-2" />Voir les utilisateurs</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => duplicateRole.mutate(role.id)} disabled={duplicateRole.isPending}><Copy className="h-4 w-4 mr-2" />Dupliquer</DropdownMenuItem>
                                  {!role.is_system && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={() => navigate(`/roles/${role.id}/modifier`)}><Pencil className="h-4 w-4 mr-2" />Modifier</DropdownMenuItem><DropdownMenuItem onClick={() => { setSelectedRole(role); setShowDeleteDialog(true); }} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4 mr-2" />Supprimer</DropdownMenuItem></>)}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="mt-4"><div className="flex items-center justify-between text-xs mb-1"><span className="text-muted-foreground">Niveau d'accès</span><span className="font-medium">{getPermissionPercentage(role)}%</span></div><Progress value={getPermissionPercentage(role)} className="h-2" /></div>
                          </CardHeader>
                          <AnimatePresence>
                            {expandedRoles.includes(role.id) && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                                <CardContent className="pt-0">
                                  <div className="border-t pt-4">
                                    <h4 className="text-sm font-medium mb-3">Permissions par module</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                      {localPermissionModules.map(module => {
                                        const moduleCount = getModulePermissionCount(role, module.module);
                                        const totalModulePerms = module.permissions.length;
                                        const Icon = MODULE_ICONS[module.module] || Shield;
                                        return (
                                          <div key={module.module} className={`p-3 rounded-lg border ${moduleCount === totalModulePerms ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : moduleCount > 0 ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' : 'bg-muted/30'}`}>
                                            <div className="flex items-center gap-2 mb-1"><Icon className={`h-4 w-4 ${moduleCount === totalModulePerms ? 'text-green-600' : moduleCount > 0 ? 'text-amber-600' : 'text-muted-foreground'}`} /><span className="text-sm font-medium truncate">{module.label}</span></div>
                                            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{moduleCount}/{totalModulePerms}</span>{moduleCount === totalModulePerms && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}</div>
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
                {lastPage > 1 && (
                  <div className="mt-6 flex justify-center">
                    <Pagination><PaginationContent>
                      <PaginationItem><PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
                      {Array.from({ length: lastPage }, (_, i) => i + 1).filter(page => page === 1 || page === lastPage || Math.abs(page - currentPage) <= 1).map((page, idx, arr) => (
                        <PaginationItem key={page}>{idx > 0 && arr[idx - 1] !== page - 1 && <span className="px-2">...</span>}<PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">{page}</PaginationLink></PaginationItem>
                      ))}
                      <PaginationItem><PaginationNext onClick={() => setCurrentPage(p => Math.min(lastPage, p + 1))} className={currentPage === lastPage ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
                    </PaginationContent></Pagination>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="matrice" className="mt-6"><RolesMatriceTab /></TabsContent>
          <TabsContent value="statistiques" className="mt-6"><RolesStatistiquesTab statsData={statsData} /></TabsContent>
        </Tabs>

        <RolesUsersModal open={showUsersModal} onOpenChange={setShowUsersModal} selectedRole={selectedRole} />

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Supprimer le rôle</AlertDialogTitle><AlertDialogDescription>Êtes-vous sûr de vouloir supprimer le rôle "{selectedRole?.name}" ? Cette action est irréversible.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteRole.isPending}>{deleteRole.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Supprimer</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
