import { useState, useMemo } from "react";
import {
  useUsers, useUserStats, useUserRoles,
  useCreateUser, useUpdateUser, useDeleteUser, useToggleUserActif
} from "@/hooks/use-users";
import { User, CreateUserData, UpdateUserData } from "@/services/userService";

export const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(142, 76%, 36%)',
];

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function useUtilisateursData() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("liste");
  const perPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    nom: '', email: '', password: '', password_confirmation: '', role: '', actif: true
  });

  const { data: usersData, isLoading: isLoadingUsers, refetch: refetchUsers, isFetching } = useUsers({
    search: searchTerm || undefined,
    role: filterRole !== 'all' ? filterRole : undefined,
    actif: filterStatut === 'actif' ? true : filterStatut === 'inactif' ? false : undefined,
    per_page: perPage, page: currentPage,
  });

  const { data: statsData, isLoading: isLoadingStats } = useUserStats();
  const { data: rolesData } = useUserRoles();

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const toggleActif = useToggleUserActif();

  const users = usersData?.data || [];
  const totalPages = usersData?.last_page || 1;
  const totalUsers = usersData?.total || 0;
  const roles = Array.isArray(rolesData) ? rolesData : [];
  const stats = useMemo(() => statsData || null, [statsData]);

  const pieChartData = useMemo(() => {
    if (!stats?.par_role) return [];
    return stats.par_role.map((r: any, i: number) => ({
      name: r.role, value: r.count, color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [stats]);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const getRoleName = (user: User) => user.roles[0]?.name || 'Sans rôle';
  const formatDate = (date: string) => {
    const { format } = require('date-fns');
    const { fr } = require('date-fns/locale');
    return format(new Date(date), 'dd MMM yyyy', { locale: fr });
  };

  const resetForm = () => {
    setFormData({ nom: '', email: '', password: '', password_confirmation: '', role: roles[0]?.name || '', actif: true });
    setSelectedUser(null); setIsEditing(false); setShowPassword(false);
  };

  const handleOpenAdd = () => { resetForm(); setFormData(prev => ({ ...prev, role: roles[0]?.name || '' })); setShowModal(true); };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user); setIsEditing(true);
    setFormData({ nom: user.nom, email: user.email, password: '', password_confirmation: '', role: user.roles[0]?.name || '', actif: user.actif });
    setShowModal(true);
  };

  const handleOpenDelete = (user: User) => { setSelectedUser(user); setShowDeleteDialog(true); };

  const handleToggleActif = async (user: User) => { try { await toggleActif.mutateAsync(user.id); } catch {} };

  const validateForm = (): boolean => {
    const nom = formData.nom.trim();
    const email = formData.email.trim();
    if (!nom || nom.length > 100 || !email) return false;
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
        const updateData: UpdateUserData = { nom: formData.nom.trim().slice(0, 100), email: formData.email.trim().toLowerCase(), role: formData.role, actif: formData.actif };
        if (formData.password) { updateData.password = formData.password; updateData.password_confirmation = formData.password_confirmation; }
        await updateUser.mutateAsync({ id: selectedUser.id, data: updateData });
      } else {
        const createData: CreateUserData = { nom: formData.nom.trim().slice(0, 100), email: formData.email.trim().toLowerCase(), password: formData.password, password_confirmation: formData.password_confirmation, role: formData.role, actif: formData.actif ?? true };
        await createUser.mutateAsync(createData);
      }
      setShowModal(false); resetForm();
    } catch { return; }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    await deleteUser.mutateAsync(selectedUser.id);
    setShowDeleteDialog(false); setSelectedUser(null);
  };

  const statutOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'actif', label: 'Actifs' },
    { value: 'inactif', label: 'Inactifs' },
  ];

  const roleOptions = [
    { value: 'all', label: 'Tous les rôles' },
    ...roles.map(role => ({ value: role.name, label: role.name }))
  ];

  return {
    searchTerm, setSearchTerm, filterRole, setFilterRole, filterStatut, setFilterStatut,
    currentPage, setCurrentPage, activeTab, setActiveTab,
    showModal, setShowModal, showDeleteDialog, setShowDeleteDialog,
    selectedUser, isEditing, showPassword, setShowPassword,
    formData, setFormData,
    users, totalPages, totalUsers, roles, stats, pieChartData,
    isLoadingUsers, isLoadingStats, isFetching,
    refetchUsers, createUser, updateUser, deleteUser, toggleActif,
    getInitials, getRoleName, formatDate,
    handleOpenAdd, handleOpenEdit, handleOpenDelete, handleToggleActif,
    validateForm, handleSubmit, handleDelete,
    statutOptions, roleOptions, resetForm,
  };
}
