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

export function useStatsMensuelles(annee: number, mois: number) {
  return useQuery({
    queryKey: ['previsions', 'stats-mensuelles', annee, mois],
    queryFn: () => previsionsApi.getStatsMensuelles(annee, mois),
    staleTime: 2 * 60 * 1000,
    enabled: !!annee && !!mois,
  });
}

export function useHistoriquePrevisions(annee: number) {
  return useQuery({
    queryKey: ['previsions', 'historique', annee],
    queryFn: () => previsionsApi.getHistorique(annee),
    staleTime: 2 * 60 * 1000,
    enabled: !!annee,
  });
}

export function usePrevisionCategories() {
  return useQuery({
    queryKey: ['previsions', 'categories'],
    queryFn: () => previsionsApi.getCategories(),
    staleTime: 30 * 60 * 1000,
  });
}

export function useExportMois(annee: number, mois: number) {
  return useQuery({
    queryKey: ['previsions', 'export', annee, mois],
    queryFn: () => previsionsApi.getExportMois(annee, mois),
    enabled: false,
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
