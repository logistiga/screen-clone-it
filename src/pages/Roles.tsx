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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, Pencil, Trash2, Shield, Copy, Users, Search, 
  ShieldCheck, Lock, Unlock, Eye, ChevronRight, RefreshCw,
  BarChart3, Layers, AlertTriangle, CheckCircle2, XCircle, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  useRoles, 
  useRolesStats, 
  usePermissions, 
  useCreateRole, 
  useUpdateRole, 
  useDeleteRole, 
  useDuplicateRole 
} from "@/hooks/use-roles";
import { Role, PermissionModule, RoleFormData } from "@/services/roleService";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("liste");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedRoles, setExpandedRoles] = useState<number[]>([]);
  
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    permissions: string[];
  }>({
    name: '',
    description: '',
    permissions: []
  });

  // React Query hooks
  const { data: rolesData, isLoading: isLoadingRoles, refetch: refetchRoles, isFetching } = useRoles({ search: searchTerm || undefined });
  const { data: statsData, isLoading: isLoadingStats } = useRolesStats();
  const { data: permissionsData, isLoading: isLoadingPermissions } = usePermissions();
  
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const duplicateRole = useDuplicateRole();

  const roles = rolesData?.data || [];
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

  const toggleRoleExpanded = (roleId: number) => {
    setExpandedRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
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

            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un rôle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => refetchRoles()} disabled={isFetching}>
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={handleOpenAdd} className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nouveau rôle</span>
              </Button>
            </div>
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
                    {searchTerm ? "Aucun rôle ne correspond à votre recherche" : "Commencez par créer un rôle"}
                  </p>
                  {!searchTerm && (
                    <Button onClick={handleOpenAdd} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Créer un rôle
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
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
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>{role.users_count} utilisateur{role.users_count > 1 ? 's' : ''}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Lock className="h-3.5 w-3.5" />
                                    <span>{role.permissions_count} permission{role.permissions_count > 1 ? 's' : ''}</span>
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${expandedRoles.includes(role.id) ? 'rotate-90' : ''}`} />
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => { e.stopPropagation(); handleDuplicate(role); }}
                                disabled={duplicateRole.isPending}
                                title="Dupliquer"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              {!role.is_system && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(role); }}
                                    title="Modifier"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-destructive hover:text-destructive"
                                    onClick={(e) => { e.stopPropagation(); handleOpenDelete(role); }}
                                    title="Supprimer"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
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
