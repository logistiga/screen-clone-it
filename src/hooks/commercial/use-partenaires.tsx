import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { armateursApi, transitairesApi, representantsApi, Armateur, Transitaire, Representant } from '@/lib/api/commercial';
import { toast } from 'sonner';

const CACHE_TIME = 5 * 60 * 1000;
const STALE_TIME = 2 * 60 * 1000;

// Helper: normaliser une réponse API en tableau
function normalizeToArray<T = unknown>(res: unknown): T[] {
  if (Array.isArray(res)) return res;
  const anyRes = res as Record<string, unknown>;
  if (Array.isArray(anyRes?.data)) return anyRes.data as T[];
  const nestedData = anyRes?.data as Record<string, unknown> | undefined;
  if (Array.isArray(nestedData?.data)) return nestedData.data as T[];
  if (Array.isArray(anyRes?.items)) return anyRes.items as T[];
  const dataObj = anyRes?.data as Record<string, unknown> | undefined;
  if (Array.isArray(dataObj?.items)) return dataObj.items as T[];
  return [];
}

// Armateurs hooks
export function useArmateurs() {
  return useQuery({
    queryKey: ['armateurs'],
    queryFn: async () => {
      const res = await armateursApi.getAll();
      return normalizeToArray<Armateur>(res);
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnMount: true,
  });
}

export function useArmateurById(id: string | undefined) {
  return useQuery({
    queryKey: ['armateurs', id],
    queryFn: () => armateursApi.getById(id!),
    enabled: !!id,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useCreateArmateur() {
  return useMutation({
    mutationFn: () => Promise.reject(new Error('Création désactivée - les armateurs sont synchronisés depuis OPS')),
    onError: (error: any) => { toast.error(error.message || 'Création désactivée'); },
  });
}

export function useUpdateArmateur() {
  return useMutation({
    mutationFn: () => Promise.reject(new Error('Modification désactivée - les armateurs sont synchronisés depuis OPS')),
    onError: (error: any) => { toast.error(error.message || 'Modification désactivée'); },
  });
}

export function useDeleteArmateur() {
  return useMutation({
    mutationFn: () => Promise.reject(new Error('Suppression désactivée - les armateurs sont synchronisés depuis OPS')),
    onError: (error: any) => { toast.error(error.message || 'Suppression désactivée'); },
  });
}

export function useSyncArmateurs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: armateursApi.syncFromOps,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['armateurs'] });
      toast.success(data?.message || 'Armateurs synchronisés avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la synchronisation des armateurs');
    },
  });
}

export function useUpdateArmateurTypeConteneur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type_conteneur }: { id: number | string; type_conteneur: string }) =>
      armateursApi.updateTypeConteneur(id, type_conteneur),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armateurs'] });
      toast.success('Type de conteneur mis à jour');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });
}

// Transitaires hooks
export function useTransitaires() {
  return useQuery({
    queryKey: ['transitaires'],
    queryFn: async () => {
      const res = await transitairesApi.getAll();
      return normalizeToArray<Transitaire>(res);
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnMount: true,
  });
}

export function useTransitaireById(id: string | undefined) {
  return useQuery({
    queryKey: ['transitaires', id],
    queryFn: () => transitairesApi.getById(id!),
    enabled: !!id,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useCreateTransitaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: transitairesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transitaires'] });
      toast.success('Transitaire créé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création du transitaire');
    },
  });
}

export function useUpdateTransitaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Transitaire> }) => transitairesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transitaires'] });
      toast.success('Transitaire modifié avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification du transitaire');
    },
  });
}

export function useDeleteTransitaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: transitairesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transitaires'] });
      toast.success('Transitaire supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du transitaire');
    },
  });
}

// Representants hooks
export function useRepresentants(params?: { per_page?: number }) {
  return useQuery({
    queryKey: ['representants', params],
    queryFn: async () => {
      const res = await representantsApi.getAll(params);
      return normalizeToArray<Representant>(res);
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnMount: true,
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useRepresentantById(id: string | undefined) {
  return useQuery({
    queryKey: ['representants', id],
    queryFn: () => representantsApi.getById(id!),
    enabled: !!id,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useCreateRepresentant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: representantsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representants'] });
      toast.success('Représentant créé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création du représentant');
    },
  });
}

export function useUpdateRepresentant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Representant> }) => representantsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representants'] });
      toast.success('Représentant modifié avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification du représentant');
    },
  });
}

export function useDeleteRepresentant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: representantsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representants'] });
      toast.success('Représentant supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du représentant');
    },
  });
}
