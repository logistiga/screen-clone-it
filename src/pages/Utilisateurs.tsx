import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, Pencil, Trash2, UserCheck, UserX, Mail, Calendar, Shield, Users, 
  RefreshCw, Search, Eye, EyeOff, Lock, Loader2, ChevronLeft, ChevronRight,
  TrendingUp, Clock, BarChart3, CheckCircle2, XCircle, AlertTriangle
} from "lucide-react";
import { 
  useUsers, 
  useUserStats, 
  useUserRoles, 
  useCreateUser, 
  useUpdateUser, 
  useDeleteUser, 
  useToggleUserActif 
} from "@/hooks/use-users";
import { User, UserRole, CreateUserData, UpdateUserData } from "@/services/userService";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

// Couleurs pour les graphiques
const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(142, 76%, 36%)',
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function UtilisateursPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("liste");
  const perPage = 10;
  
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: '',
    actif: true
  });

  // React Query hooks
  const { 
    data: usersData, 
    isLoading: isLoadingUsers, 
    refetch: refetchUsers,
    isFetching 
  } = useUsers({
    search: searchTerm || undefined,
    role: filterRole !== 'all' ? filterRole : undefined,
    actif: filterStatut === 'actif' ? true : filterStatut === 'inactif' ? false : undefined,
    per_page: perPage,
    page: currentPage,
  });
  
  const { data: statsData, isLoading: isLoadingStats } = useUserStats();
  const { data: rolesData, isLoading: isLoadingRoles } = useUserRoles();
  
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const toggleActif = useToggleUserActif();

  const users = usersData?.data || [];
  const totalPages = usersData?.last_page || 1;
  const totalUsers = usersData?.total || 0;
  const roles = Array.isArray(rolesData) ? rolesData : [];

  // Stats
  const stats = useMemo(() => {
    if (!statsData) return null;
    return statsData;
  }, [statsData]);

  // Données pour les graphiques
  const pieChartData = useMemo(() => {
    if (!stats?.par_role) return [];
    return stats.par_role.map((r, i) => ({
      name: r.role,
      value: r.count,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [stats]);

  // Fonctions utilitaires
  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleName = (user: User): string => {
    return user.roles[0]?.name || 'Sans rôle';
  };

  const formatDate = (date: string): string => {
    return format(new Date(date), 'dd MMM yyyy', { locale: fr });
  };

  const formatDateTime = (date: string): string => {
    return format(new Date(date), 'dd MMM yyyy à HH:mm', { locale: fr });
  };

  // Gestion du formulaire
  const resetForm = () => {
    setFormData({
      nom: '',
      email: '',
      password: '',
      password_confirmation: '',
      role: roles[0]?.name || '',
      actif: true
    });
    setSelectedUser(null);
    setIsEditing(false);
    setShowPassword(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setFormData(prev => ({ ...prev, role: roles[0]?.name || '' }));
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditing(true);
    setFormData({
      nom: user.nom,
      email: user.email,
      password: '',
      password_confirmation: '',
      role: user.roles[0]?.name || '',
      actif: user.actif
    });
    setShowModal(true);
  };

  const handleOpenDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleToggleActif = async (user: User) => {
    try {
      await toggleActif.mutateAsync(user.id);
    } catch {
      // Error already handled by onError in useToggleUserActif
    }
  };

  const validateForm = (): boolean => {
    const nom = formData.nom.trim();
    const email = formData.email.trim();

    if (!nom) return false;
    if (nom.length > 100) return false;

    if (!email) return false;

    if (!isEditing && (!formData.password || formData.password.length < 8)) return false;
    if (!isEditing && formData.password !== formData.password_confirmation) return false;
    if (isEditing && formData.password && formData.password !== formData.password_confirmation) return false;

    if (!formData.role) return false;

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (isEditing && selectedUser) {
        const updateData: UpdateUserData = {
          nom: formData.nom.trim().slice(0, 100),
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
          actif: formData.actif,
        };

        if (formData.password) {
          updateData.password = formData.password;
          updateData.password_confirmation = formData.password_confirmation;
        }

        await updateUser.mutateAsync({ id: selectedUser.id, data: updateData });
      } else {
        const createData: CreateUserData = {
          nom: formData.nom.trim().slice(0, 100),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          password_confirmation: formData.password_confirmation,
          role: formData.role,
          actif: formData.actif ?? true,
        };

        await createUser.mutateAsync(createData);
      }

      setShowModal(false);
      resetForm();
    } catch {
      // L'erreur est déjà gérée par React Query (toast), on évite juste une rejection non gérée.
      return;
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    await deleteUser.mutateAsync(selectedUser.id);
    setShowDeleteDialog(false);
    setSelectedUser(null);
  };

  // Options pour les filtres
  const statutOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'actif', label: 'Actifs' },
    { value: 'inactif', label: 'Inactifs' },
  ];

  const roleOptions = [
    { value: 'all', label: 'Tous les rôles' },
    ...roles.map(role => ({ value: role.name, label: role.name }))
  ];

  return (
    <MainLayout title="Gestion des Utilisateurs">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Utilisateurs</p>
                      <p className="text-2xl font-bold">{stats?.total || 0}</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-500/20 bg-green-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Actifs</p>
                      <p className="text-2xl font-bold text-green-600">{stats?.actifs || 0}</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-full">
                      <UserCheck className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                  {stats && stats.total > 0 && (
                    <Progress 
                      value={(stats.actifs / stats.total) * 100} 
                      className="h-1.5 mt-3"
                    />
                  )}
                </CardContent>
              </Card>

              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Inactifs</p>
                      <p className="text-2xl font-bold text-amber-600">{stats?.inactifs || 0}</p>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-full">
                      <UserX className="h-5 w-5 text-amber-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Nouveaux ce mois</p>
                      <p className="text-2xl font-bold text-blue-600">{stats?.nouveaux_ce_mois || 0}</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-full">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>

        {/* Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList>
                <TabsTrigger value="liste" className="gap-2">
                  <Users className="h-4 w-4" />
                  Liste
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
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" size="icon" onClick={() => refetchUsers()} disabled={isFetching}>
                  <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                </Button>
                <Button onClick={handleOpenAdd} className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nouvel utilisateur</span>
                </Button>
              </div>
            </div>

            {/* Tab: Liste */}
            <TabsContent value="liste" className="mt-6 space-y-4">
              {/* Filtres */}
              <div className="flex flex-wrap gap-3">
                <Select value={filterStatut} onValueChange={(v) => { setFilterStatut(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {statutOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterRole} onValueChange={(v) => { setFilterRole(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(filterStatut !== 'all' || filterRole !== 'all' || searchTerm) && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatut('all');
                      setFilterRole('all');
                      setCurrentPage(1);
                    }}
                  >
                    Réinitialiser
                  </Button>
                )}
              </div>

              {/* Table */}
              {isLoadingUsers ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-60" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : users.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Aucun utilisateur trouvé</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || filterRole !== 'all' || filterStatut !== 'all'
                        ? "Aucun utilisateur ne correspond à vos critères."
                        : "Commencez par créer votre premier utilisateur."}
                    </p>
                    {!searchTerm && filterRole === 'all' && filterStatut === 'all' && (
                      <Button onClick={handleOpenAdd} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Nouvel utilisateur
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="h-5 w-5 text-primary" />
                          Liste des utilisateurs
                        </CardTitle>
                        <CardDescription>
                          {totalUsers} utilisateur{totalUsers > 1 ? 's' : ''} au total
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="font-semibold">Utilisateur</TableHead>
                            <TableHead className="font-semibold">Rôle</TableHead>
                            <TableHead className="font-semibold">Statut</TableHead>
                            <TableHead className="font-semibold">Créé le</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <AnimatePresence mode="popLayout">
                            {users.map((user, index) => (
                              <motion.tr
                                key={user.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.03 }}
                                className="border-b hover:bg-muted/30 transition-colors"
                              >
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                                      <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                                        {getInitials(user.nom)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-foreground">{user.nom}</p>
                                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <Mail className="h-3.5 w-3.5" />
                                        {user.email}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="gap-1.5 font-medium border-primary/30 bg-primary/5 capitalize">
                                    <Shield className="h-3 w-3 text-primary" />
                                    {getRoleName(user)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={user.actif}
                                      onCheckedChange={() => handleToggleActif(user)}
                                      disabled={toggleActif.isPending}
                                    />
                                    <Badge 
                                      className={user.actif 
                                        ? "bg-green-500/10 text-green-600 border-green-500/20" 
                                        : "bg-muted text-muted-foreground"
                                      }
                                    >
                                      {user.actif ? (
                                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Actif</>
                                      ) : (
                                        <><XCircle className="h-3 w-3 mr-1" /> Inactif</>
                                      )}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {formatDate(user.created_at)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-end gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => handleOpenEdit(user)} 
                                      title="Modifier"
                                      className="hover:bg-primary/10 hover:text-primary"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10" 
                                      onClick={() => handleOpenDelete(user)}
                                      title="Supprimer"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t">
                        <p className="text-sm text-muted-foreground">
                          Page {currentPage} sur {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab: Statistiques */}
            <TabsContent value="statistiques" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Répartition par rôle */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Répartition par rôle</CardTitle>
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

                {/* Détail par rôle */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Détail par rôle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingStats ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                      </div>
                    ) : stats?.par_role && stats.par_role.length > 0 ? (
                      <div className="space-y-3">
                        {stats.par_role.map((item, index) => (
                          <div key={item.role} className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium capitalize">{item.role}</span>
                                <span className="text-sm text-muted-foreground">{item.count}</span>
                              </div>
                              <Progress 
                                value={(item.count / (stats?.total || 1)) * 100} 
                                className="h-2"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        Aucune donnée disponible
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tableau récapitulatif */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Résumé des utilisateurs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                        <p className="text-2xl font-bold">{stats?.total || 0}</p>
                        <p className="text-sm text-muted-foreground">Total</p>
                      </div>
                      <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 text-center">
                        <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-600" />
                        <p className="text-2xl font-bold text-green-600">{stats?.actifs || 0}</p>
                        <p className="text-sm text-muted-foreground">Actifs</p>
                      </div>
                      <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-center">
                        <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-amber-600" />
                        <p className="text-2xl font-bold text-amber-600">{stats?.inactifs || 0}</p>
                        <p className="text-sm text-muted-foreground">Inactifs</p>
                      </div>
                      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-center">
                        <TrendingUp className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                        <p className="text-2xl font-bold text-blue-600">{stats?.nouveaux_ce_mois || 0}</p>
                        <p className="text-sm text-muted-foreground">Nouveaux ce mois</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Modal Ajout/Modification */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {isEditing ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                {isEditing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </DialogTitle>
              <DialogDescription>
                {isEditing ? 'Modifiez les informations de l\'utilisateur' : 'Créez un nouveau compte utilisateur'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom complet *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  maxLength={100}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Jean Dupont"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  maxLength={255}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jean.dupont@exemple.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Mot de passe {!isEditing && '*'}
                  {isEditing && <span className="text-muted-foreground font-normal"> (laisser vide pour conserver)</span>}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    maxLength={100}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={isEditing ? '••••••••' : 'Min. 8 caractères'}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

                {(formData.password || !isEditing) && (
                <div className="space-y-2">
                  <Label htmlFor="password_confirmation">Confirmer le mot de passe *</Label>
                  <Input
                    id="password_confirmation"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password_confirmation}
                    maxLength={100}
                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                    placeholder="Confirmer le mot de passe"
                  />
                  {formData.password && formData.password_confirmation && formData.password !== formData.password_confirmation && (
                    <p className="text-sm text-destructive">Les mots de passe ne correspondent pas</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="role">Rôle *</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.name}>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <span className="capitalize">{role.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div>
                  <Label htmlFor="actif" className="font-medium">Compte actif</Label>
                  <p className="text-sm text-muted-foreground">L'utilisateur peut se connecter</p>
                </div>
                <Switch
                  id="actif"
                  checked={formData.actif}
                  onCheckedChange={(checked) => setFormData({ ...formData, actif: checked })}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!validateForm() || createUser.isPending || updateUser.isPending}
                className="gap-2"
              >
                {(createUser.isPending || updateUser.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {isEditing ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation de suppression */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Supprimer cet utilisateur ?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer l'utilisateur "<strong>{selectedUser?.nom}</strong>" ?
                Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete} 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteUser.isPending}
              >
                {deleteUser.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </MainLayout>
  );
}
