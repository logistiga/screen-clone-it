import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creditsApi, CreditFilters, CreateCreditData, CreateRemboursementData } from '@/lib/api/credits';
import { toast } from 'sonner';

export function useCredits(filters: CreditFilters = {}) {
  return useQuery({
    queryKey: ['credits', filters],
    queryFn: () => creditsApi.getAll(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCredit(id: number) {
  return useQuery({
    queryKey: ['credit', id],
    queryFn: () => creditsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreditStats(annee?: number) {
  return useQuery({
    queryKey: ['credits', 'stats', annee],
    queryFn: () => creditsApi.getStats(annee),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreditDashboard(annee?: number) {
  return useQuery({
    queryKey: ['credits', 'dashboard', annee],
    queryFn: () => creditsApi.getDashboard(annee),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreditComparaison(annee?: number) {
  return useQuery({
    queryKey: ['credits', 'comparaison', annee],
    queryFn: () => creditsApi.getComparaison(annee),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreditEcheances(id: number) {
  return useQuery({
    queryKey: ['credit', id, 'echeances'],
    queryFn: () => creditsApi.getEcheances(id),
    enabled: !!id,
  });
}

export function useCreateCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCreditData) => creditsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      toast.success('Crédit créé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    },
  });
}

export function useUpdateCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => creditsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      toast.success('Crédit mis à jour');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });
}

export function useDeleteCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => creditsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      toast.success('Crédit supprimé');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    },
  });
}

export function useRembourserCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateRemboursementData }) => 
      creditsApi.rembourser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      toast.success('Remboursement enregistré');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors du remboursement');
    },
  });
}
