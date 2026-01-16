import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService, RoleFilters, RoleFormData } from '@/services/roleService';
import { useToast } from '@/hooks/use-toast';

// Query keys
const ROLES_KEY = 'roles';
const ROLE_KEY = 'role';
const ROLES_STATS_KEY = 'roles-stats';
const PERMISSIONS_KEY = 'permissions';

// Liste des rôles
export function useRoles(filters?: RoleFilters) {
  return useQuery({
    queryKey: [ROLES_KEY, filters],
    queryFn: () => roleService.getRoles(filters),
  });
}

// Statistiques des rôles
export function useRolesStats() {
  return useQuery({
    queryKey: [ROLES_STATS_KEY],
    queryFn: () => roleService.getStats(),
  });
}

// Liste des permissions
export function usePermissions() {
  return useQuery({
    queryKey: [PERMISSIONS_KEY],
    queryFn: () => roleService.getPermissions(),
  });
}

// Détail d'un rôle
export function useRole(id: number | null) {
  return useQuery({
    queryKey: [ROLE_KEY, id],
    queryFn: () => roleService.getRole(id!),
    enabled: !!id,
  });
}

// Créer un rôle
export function useCreateRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: RoleFormData) => roleService.createRole(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [ROLES_KEY] });
      queryClient.invalidateQueries({ queryKey: [ROLES_STATS_KEY] });
      toast({
        title: 'Succès',
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors de la création',
        variant: 'destructive',
      });
    },
  });
}

// Mettre à jour un rôle
export function useUpdateRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<RoleFormData> }) =>
      roleService.updateRole(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [ROLES_KEY] });
      queryClient.invalidateQueries({ queryKey: [ROLES_STATS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ROLE_KEY] });
      toast({
        title: 'Succès',
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors de la mise à jour',
        variant: 'destructive',
      });
    },
  });
}

// Supprimer un rôle
export function useDeleteRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => roleService.deleteRole(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [ROLES_KEY] });
      queryClient.invalidateQueries({ queryKey: [ROLES_STATS_KEY] });
      toast({
        title: 'Succès',
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors de la suppression',
        variant: 'destructive',
      });
    },
  });
}

// Dupliquer un rôle
export function useDuplicateRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => roleService.duplicateRole(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [ROLES_KEY] });
      queryClient.invalidateQueries({ queryKey: [ROLES_STATS_KEY] });
      toast({
        title: 'Succès',
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors de la duplication',
        variant: 'destructive',
      });
    },
  });
}

// Utilisateurs disponibles pour un rôle
export function useAvailableUsers(roleId: number | null, search?: string) {
  return useQuery({
    queryKey: ['available-users', roleId, search],
    queryFn: () => roleService.getAvailableUsers(roleId!, search),
    enabled: !!roleId,
  });
}

// Assigner des utilisateurs à un rôle
export function useAssignUsers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ roleId, userIds }: { roleId: number; userIds: number[] }) =>
      roleService.assignUsers(roleId, userIds),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [ROLES_KEY] });
      queryClient.invalidateQueries({ queryKey: [ROLES_STATS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ROLE_KEY] });
      queryClient.invalidateQueries({ queryKey: ['available-users'] });
      toast({
        title: 'Succès',
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors de l\'assignation',
        variant: 'destructive',
      });
    },
  });
}

// Désassigner un utilisateur d'un rôle
export function useUnassignUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ roleId, userId }: { roleId: number; userId: number }) =>
      roleService.unassignUser(roleId, userId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [ROLES_KEY] });
      queryClient.invalidateQueries({ queryKey: [ROLES_STATS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ROLE_KEY] });
      queryClient.invalidateQueries({ queryKey: ['available-users'] });
      toast({
        title: 'Succès',
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors du retrait',
        variant: 'destructive',
      });
    },
  });
}
