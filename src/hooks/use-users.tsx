import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, UserFilters, CreateUserData, UpdateUserData } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

// Query keys
const USERS_KEY = 'users';
const USER_KEY = 'user';
const USER_STATS_KEY = 'user-stats';
const USER_ROLES_KEY = 'user-roles';
const PROFILE_KEY = 'profile';

// Liste des utilisateurs
export function useUsers(filters?: UserFilters) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [USERS_KEY, filters],
    queryFn: () => userService.getUsers(filters),
    enabled: isAuthenticated,
  });
}

// Statistiques des utilisateurs
export function useUserStats() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [USER_STATS_KEY],
    queryFn: () => userService.getStats(),
    enabled: isAuthenticated,
    staleTime: 30000, // 30 secondes
  });
}

// Détail d'un utilisateur
export function useUser(id: number | null) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [USER_KEY, id],
    queryFn: () => userService.getUser(id!),
    enabled: isAuthenticated && !!id,
  });
}

// Liste des rôles
export function useUserRoles() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [USER_ROLES_KEY],
    queryFn: () => userService.getRoles(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Profil utilisateur connecté
export function useProfile() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [PROFILE_KEY],
    queryFn: () => userService.getProfile(),
    enabled: isAuthenticated,
  });
}

// Créer un utilisateur
export function useCreateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateUserData) => userService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [USER_STATS_KEY] });
      toast({
        title: 'Succès',
        description: 'Utilisateur créé avec succès',
      });
    },
    onError: (error: any) => {
      console.error('Erreur création utilisateur:', error.response?.data);
      
      const errors = error.response?.data?.errors;
      let message = error.response?.data?.message || 'Erreur lors de la création';
      
      if (errors && typeof errors === 'object') {
        const errorMessages = Object.values(errors)
          .flat()
          .filter(Boolean)
          .join(' | ');
        message = errorMessages || message;
      }
      
      toast({
        title: 'Erreur de validation',
        description: message,
        variant: 'destructive',
      });
    },
  });
}

// Mettre à jour un utilisateur
export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserData }) =>
      userService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [USER_STATS_KEY] });
      queryClient.invalidateQueries({ queryKey: [USER_KEY] });
      toast({
        title: 'Succès',
        description: 'Utilisateur mis à jour avec succès',
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 
                     Object.values(error.response?.data?.errors || {}).flat().join(', ') ||
                     'Erreur lors de la mise à jour';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    },
  });
}

// Supprimer un utilisateur
export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => userService.deleteUser(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [USER_STATS_KEY] });
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

// Activer/Désactiver un utilisateur
export function useToggleUserActif() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => userService.toggleActif(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [USER_STATS_KEY] });
      toast({
        title: 'Succès',
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors du changement de statut',
        variant: 'destructive',
      });
    },
  });
}

// Mettre à jour le profil
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { nom?: string; email?: string }) =>
      userService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROFILE_KEY] });
      toast({
        title: 'Succès',
        description: 'Profil mis à jour avec succès',
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 
                     Object.values(error.response?.data?.errors || {}).flat().join(', ') ||
                     'Erreur lors de la mise à jour du profil';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    },
  });
}

// Changer le mot de passe
export function useUpdatePassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      current_password: string;
      password: string;
      password_confirmation: string;
    }) => userService.updatePassword(data),
    onSuccess: (response) => {
      toast({
        title: 'Succès',
        description: response.message,
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 
                     Object.values(error.response?.data?.errors || {}).flat().join(', ') ||
                     'Erreur lors du changement de mot de passe';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    },
  });
}

// Télécharger une photo de profil
export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (file: File) => userService.uploadAvatar(file),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [PROFILE_KEY] });
      toast({
        title: 'Succès',
        description: 'Photo de profil mise à jour',
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 
                     'Erreur lors du téléchargement de la photo';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    },
  });
}

// Supprimer la photo de profil
export function useDeleteAvatar() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => userService.deleteAvatar(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [PROFILE_KEY] });
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
