import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, Shield, Lock, Unlock, Search, 
  CheckCircle2, XCircle, Loader2, ChevronDown, Save,
  Building2, CreditCard, Package, Warehouse, Settings, History,
  LayoutDashboard, Receipt, FileStack, Truck, Store, Ship,
  Handshake, TrendingUp, Wallet, ClipboardList, Users, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  usePermissions, 
  useCreateRole, 
  useUpdateRole, 
  useRole
} from "@/hooks/use-roles";
import { RoleFormData } from "@/services/roleService";
import { 
  MODULES, 
  CATEGORY_LABELS, 
  getPermissionsByModule 
} from "@/config/permissionsConfig";

// Icônes pour les modules
const MODULE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  clients: Users,
  devis: FileText,
  ordres: ClipboardList,
  factures: Receipt,
  paiements: CreditCard,
  caisse: Wallet,
  banques: Building2,
  credits: TrendingUp,
  partenaires: Handshake,
  transitaires: Ship,
  transporteurs: Truck,
  fournisseurs: Store,
  produits: Package,
  stocks: Warehouse,
  notes: FileStack,
  utilisateurs: Users,
  roles: Shield,
  configuration: Settings,
  reporting: LayoutDashboard,
  dashboard: LayoutDashboard,
  audit: History,
  securite: Shield,
  exports: FileStack,
};

// Couleurs par catégorie
const CATEGORY_COLORS: Record<string, string> = {
  commercial: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800',
  finance: 'bg-green-500/10 text-green-600 border-green-200 dark:border-green-800',
  stock: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800',
  administration: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800',
  reporting: 'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800',
};

export default function RoleFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const roleId = id ? parseInt(id) : null;

  // État du formulaire
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    permissions: string[];
  }>({
    name: '',
    description: '',
    permissions: []
  });

  // Filtres
  const [permissionSearch, setPermissionSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  // React Query hooks
  const { data: permissionsData, isLoading: isLoadingPermissions } = usePermissions();
  const { data: roleData, isLoading: isLoadingRole } = useRole(roleId);
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  const totalPermissions = permissionsData?.total || 0;

  // Utiliser la config locale pour l'UI de la matrice
  const localPermissionModules = useMemo(() => getPermissionsByModule(), []);

  // Charger les données du rôle en mode édition
  useEffect(() => {
    if (isEditing && roleData) {
      setFormData({
        name: roleData.name,
        description: roleData.description || '',
        permissions: [...roleData.permissions]
      });
    }
  }, [isEditing, roleData]);

  // Filtrage des modules par recherche et catégorie
  const filteredModules = useMemo(() => {
    let modules = localPermissionModules;
    
    if (selectedCategory) {
      modules = modules.filter(m => m.category === selectedCategory);
    }
    
    if (permissionSearch) {
      const search = permissionSearch.toLowerCase();
      modules = modules.filter(m => 
        m.label.toLowerCase().includes(search) ||
        m.module.toLowerCase().includes(search) ||
        m.permissions.some(p => p.label.toLowerCase().includes(search))
      );
    }
    
    return modules;
  }, [localPermissionModules, selectedCategory, permissionSearch]);

  // Total permissions from local config
  const totalLocalPermissions = localPermissionModules.reduce((sum, m) => sum + m.permissions.length, 0);

  // Fonctions de gestion des permissions
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

  const toggleModuleAll = (moduleKey: string, permissions: Array<{ name: string }>) => {
    const modulePermNames = permissions.map(p => p.name);
    const allActive = modulePermNames.every(name => formData.permissions.includes(name));
    
    setFormData(prev => ({
      ...prev,
      permissions: allActive
        ? prev.permissions.filter(p => !modulePermNames.includes(p))
        : [...new Set([...prev.permissions, ...modulePermNames])]
    }));
  };

  const toggleCategoryAll = (category: string) => {
    const categoryModules = localPermissionModules.filter(m => m.category === category);
    const categoryPerms = categoryModules.flatMap(m => m.permissions.map(p => p.name));
    const allActive = categoryPerms.every(p => formData.permissions.includes(p));
    
    setFormData(prev => ({
      ...prev,
      permissions: allActive
        ? prev.permissions.filter(p => !categoryPerms.includes(p))
        : [...new Set([...prev.permissions, ...categoryPerms])]
    }));
  };

  const isModuleFullyActive = (permissions: Array<{ name: string }>): boolean => {
    return permissions.every(p => formData.permissions.includes(p.name));
  };

  const isModulePartiallyActive = (permissions: Array<{ name: string }>): boolean => {
    const count = permissions.filter(p => formData.permissions.includes(p.name)).length;
    return count > 0 && count < permissions.length;
  };

  const isCategoryFullyActive = (category: string): boolean => {
    const categoryModules = localPermissionModules.filter(m => m.category === category);
    return categoryModules.every(m => isModuleFullyActive(m.permissions));
  };

  const isCategoryPartiallyActive = (category: string): boolean => {
    const categoryModules = localPermissionModules.filter(m => m.category === category);
    const hasAny = categoryModules.some(m => m.permissions.some(p => formData.permissions.includes(p.name)));
    const hasAll = isCategoryFullyActive(category);
    return hasAny && !hasAll;
  };

  const getCategoryPermissionCount = (category: string): { active: number; total: number } => {
    const categoryModules = localPermissionModules.filter(m => m.category === category);
    const total = categoryModules.reduce((sum, m) => sum + m.permissions.length, 0);
    const active = categoryModules.reduce((sum, m) => 
      sum + m.permissions.filter(p => formData.permissions.includes(p.name)).length, 0
    );
    return { active, total };
  };

  const selectAllPermissions = () => {
    const allPerms = localPermissionModules.flatMap(m => m.permissions.map(p => p.name));
    setFormData(prev => ({ ...prev, permissions: allPerms }));
  };

  const deselectAllPermissions = () => {
    setFormData(prev => ({ ...prev, permissions: [] }));
  };

  const toggleModuleExpanded = (moduleKey: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleKey) 
        ? prev.filter(k => k !== moduleKey)
        : [...prev, moduleKey]
    );
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    const payload: RoleFormData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      permissions: formData.permissions,
    };

    try {
      if (isEditing && roleId) {
        await updateRole.mutateAsync({ id: roleId, data: payload });
      } else {
        await createRole.mutateAsync(payload);
      }
      navigate('/roles');
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const isSubmitting = createRole.isPending || updateRole.isPending;
  const isLoading = isLoadingPermissions || (isEditing && isLoadingRole);

  if (isLoading) {
    return (
      <MainLayout title={isEditing ? "Modifier le rôle" : "Nouveau rôle"}>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={isEditing ? "Modifier le rôle" : "Nouveau rôle"}>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/roles')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? "Modifier le rôle" : "Nouveau rôle"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? "Modifiez les informations et permissions du rôle" : "Créez un nouveau rôle avec ses permissions"}
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
          {/* Colonne gauche - Infos de base */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Informations du rôle
                </CardTitle>
                <CardDescription>
                  Définissez le nom et la description du rôle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Résumé des permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Résumé des permissions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Permissions sélectionnées</span>
                  <span className="font-semibold">
                    {formData.permissions.length} / {totalLocalPermissions}
                  </span>
                </div>
                <Progress 
                  value={(formData.permissions.length / totalLocalPermissions) * 100} 
                  className="h-2" 
                />
                
                <div className="space-y-2 pt-2">
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                    const { active, total } = getCategoryPermissionCount(key);
                    const percentage = total > 0 ? (active / total) * 100 : 0;
                    
                    return (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="h-1.5 w-16" />
                          <span className="w-12 text-right">{active}/{total}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Boutons d'action */}
            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleSubmit} 
                disabled={!formData.name.trim() || isSubmitting}
                className="w-full"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Enregistrer les modifications' : 'Créer le rôle'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/roles')}
                className="w-full"
              >
                Annuler
              </Button>
            </div>
          </div>

          {/* Colonne droite - Matrice de permissions */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Permissions
                </CardTitle>
                
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={permissionSearch}
                      onChange={(e) => setPermissionSearch(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                  
                  <Select value={selectedCategory || "all"} onValueChange={(v) => setSelectedCategory(v === "all" ? null : v)}>
                    <SelectTrigger className="w-40 h-9">
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" size="sm" onClick={selectAllPermissions}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Tout
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAllPermissions}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Aucun
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-320px)] min-h-[400px]">
                <div className="p-4 space-y-4">
                  {Object.entries(CATEGORY_LABELS).map(([categoryKey, categoryLabel]) => {
                    const categoryModules = filteredModules.filter(m => m.category === categoryKey);
                    if (categoryModules.length === 0) return null;
                    
                    const { active, total } = getCategoryPermissionCount(categoryKey);
                    const isFullyActive = isCategoryFullyActive(categoryKey);
                    const isPartiallyActive = isCategoryPartiallyActive(categoryKey);
                    
                    return (
                      <div key={categoryKey} className="space-y-2">
                        {/* En-tête catégorie */}
                        <div 
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${CATEGORY_COLORS[categoryKey] || ''}`}
                          onClick={() => toggleCategoryAll(categoryKey)}
                        >
                          <Checkbox
                            checked={isFullyActive}
                            className={isPartiallyActive ? "data-[state=checked]:bg-amber-500 border-amber-500" : ""}
                            onCheckedChange={() => toggleCategoryAll(categoryKey)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="font-semibold flex-1">{categoryLabel}</span>
                          <Badge variant={isFullyActive ? "default" : isPartiallyActive ? "secondary" : "outline"}>
                            {active}/{total}
                          </Badge>
                        </div>
                        
                        {/* Modules de cette catégorie */}
                        <div className="ml-4 space-y-1">
                          {categoryModules.map(module => {
                            const Icon = MODULE_ICONS[module.module] || Shield;
                            const isModuleFull = isModuleFullyActive(module.permissions);
                            const isModulePartial = isModulePartiallyActive(module.permissions);
                            const activeCount = module.permissions.filter(p => formData.permissions.includes(p.name)).length;
                            const isExpanded = expandedModules.includes(module.module);
                            
                            return (
                              <div key={module.module} className="border rounded-lg overflow-hidden">
                                {/* En-tête module */}
                                <div 
                                  className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${isExpanded ? 'border-b' : ''}`}
                                  onClick={() => toggleModuleExpanded(module.module)}
                                >
                                  <Checkbox
                                    checked={isModuleFull}
                                    className={isModulePartial ? "data-[state=checked]:bg-amber-500 border-amber-500" : ""}
                                    onCheckedChange={() => toggleModuleAll(module.module, module.permissions)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium flex-1">{module.label}</span>
                                  <Badge variant={isModuleFull ? "default" : isModulePartial ? "secondary" : "outline"} className="mr-2">
                                    {activeCount}/{module.permissions.length}
                                  </Badge>
                                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                                
                                {/* Actions du module */}
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.15 }}
                                    >
                                      <div className="p-3 bg-muted/30 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                        {module.permissions.map(perm => (
                                          <div 
                                            key={perm.name}
                                            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                                              hasPermission(perm.name) 
                                                ? 'bg-primary/10 border border-primary/20' 
                                                : 'bg-background border hover:bg-muted/50'
                                            }`}
                                            onClick={() => togglePermission(perm.name)}
                                          >
                                            <Checkbox
                                              checked={hasPermission(perm.name)}
                                              onCheckedChange={() => togglePermission(perm.name)}
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                            <span className="text-sm">{perm.label}</span>
                                            {hasPermission(perm.name) && (
                                              <Unlock className="h-3 w-3 text-primary ml-auto" />
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
