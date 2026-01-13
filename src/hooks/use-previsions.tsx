import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { previsionsApi, PrevisionFilters, CreatePrevisionData, UpdatePrevisionData } from '@/lib/api/previsions';
import { toast } from 'sonner';

function getApiErrorMessage(error: any, fallback: string) {
  const data = error?.response?.data;
  const firstValidationError = data?.errors
    ? (Object.values(data.errors).flat() as string[])[0]
    : undefined;

  return data?.message || firstValidationError || fallback;
}

export function usePrevisions(filters: PrevisionFilters = {}) {
  return useQuery({
    queryKey: ['previsions', filters],
    queryFn: () => previsionsApi.getAll(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function usePrevision(id: number) {
  return useQuery({
    queryKey: ['prevision', id],
    queryFn: () => previsionsApi.getById(id),
    enabled: !!id,
  });
}

export function usePrevisionStats(annee?: number) {
  return useQuery({
    queryKey: ['previsions', 'stats', annee],
    queryFn: () => previsionsApi.getStats(annee),
    staleTime: 2 * 60 * 1000,
  });
}

export function usePrevisionCategories() {
  return useQuery({
    queryKey: ['previsions', 'categories'],
    queryFn: () => previsionsApi.getCategories(),
    staleTime: 30 * 60 * 1000,
  });
}

export function usePrevisionComparaison(annee?: number, mois?: number, source?: string) {
  return useQuery({
    queryKey: ['previsions', 'comparaison', annee, mois, source],
    queryFn: () => previsionsApi.getComparaison(annee, mois, source),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreatePrevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePrevisionData) => previsionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['previsions'] });
      toast.success('Prévision créée avec succès');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la création'));
    },
  });
}

export function useUpdatePrevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePrevisionData }) => 
      previsionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['previsions'] });
      toast.success('Prévision mise à jour');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la mise à jour'));
    },
  });
}

export function useDeletePrevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => previsionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['previsions'] });
      toast.success('Prévision supprimée');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la suppression'));
    },
  });
}

export function useUpdatePrevisionRealise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, montant, mode }: { id: number; montant: number; mode?: 'ajouter' | 'remplacer' }) =>
      previsionsApi.updateRealise(id, montant, mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['previsions'] });
      toast.success('Montant réalisé mis à jour');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la mise à jour'));
    },
  });
}

export function useSyncPrevisionRealise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ annee, mois }: { annee: number; mois: number }) =>
      previsionsApi.syncRealise(annee, mois),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['previsions'] });
      toast.success('Synchronisation effectuée');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Erreur de synchronisation'));
    },
  });
}
