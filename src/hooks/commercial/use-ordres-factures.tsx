import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ordresApi, facturesApi } from '@/lib/api/commercial';
import { toast } from 'sonner';

const CACHE_TIME = 5 * 60 * 1000;
const STALE_TIME = 2 * 60 * 1000;

// Ordres hooks
export function useOrdres(params?: { search?: string; statut?: string; categorie?: string; client_id?: string; page?: number; per_page?: number }) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['ordres', params],
    queryFn: () => ordresApi.getAll(params),
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  useEffect(() => {
    if (query.data?.meta && params?.page) {
      const { current_page, last_page } = query.data.meta;
      if (current_page < last_page) {
        const nextPageParams = { ...params, page: current_page + 1 };
        queryClient.prefetchQuery({
          queryKey: ['ordres', nextPageParams],
          queryFn: () => ordresApi.getAll(nextPageParams),
          staleTime: STALE_TIME,
        });
      }
    }
  }, [query.data?.meta, params, queryClient]);

  return query;
}

export function useOrdresStats(params?: { search?: string; statut?: string; categorie?: string; client_id?: string }) {
  return useQuery({
    queryKey: ['ordres', 'stats', params],
    queryFn: () => ordresApi.getStats(params),
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useOrdreById(id: string) {
  return useQuery({
    queryKey: ['ordres', id],
    queryFn: () => ordresApi.getById(id),
    enabled: !!id,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useCreateOrdre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ordresApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordres'] });
      toast.success('Ordre de travail créé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création de l\'ordre');
    },
  });
}

export function useUpdateOrdre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ordresApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordres'] });
      queryClient.invalidateQueries({ queryKey: ['primes'] });
      queryClient.invalidateQueries({ queryKey: ['transitaires'] });
      queryClient.invalidateQueries({ queryKey: ['representants'] });
      toast.success('Ordre de travail modifié avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification de l\'ordre');
    },
  });
}

export function useDeleteOrdre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ordresApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordres'] });
      toast.success('Ordre de travail supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression de l\'ordre');
    },
  });
}

export function useConvertOrdreToFacture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ordresApi.convertToFacture,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordres'] });
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      toast.success('Ordre converti en facture');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la conversion');
    },
  });
}

export function useCheckConteneur() {
  return useMutation({ mutationFn: ordresApi.checkConteneur });
}

export function useCheckBL() {
  return useMutation({ mutationFn: ordresApi.checkBL });
}

export function useDescriptionSuggestions(search?: string) {
  return useQuery({
    queryKey: ['description-suggestions', search],
    queryFn: () => ordresApi.getDescriptionSuggestions(search),
    enabled: true,
    staleTime: 60000,
    gcTime: 300000,
  });
}

// Factures hooks
export function useFactures(params?: { search?: string; statut?: string; categorie?: string; client_id?: string; page?: number; per_page?: number }) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['factures', params],
    queryFn: () => facturesApi.getAll(params),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  useEffect(() => {
    if (query.data?.meta && params?.page) {
      const { current_page, last_page } = query.data.meta;
      if (current_page < last_page) {
        const nextPageParams = { ...params, page: current_page + 1 };
        queryClient.prefetchQuery({
          queryKey: ['factures', nextPageParams],
          queryFn: () => facturesApi.getAll(nextPageParams),
          staleTime: STALE_TIME,
        });
      }
    }
  }, [query.data?.meta, params, queryClient]);

  return query;
}

export function useFactureById(id: string) {
  return useQuery({
    queryKey: ['factures', id],
    queryFn: () => facturesApi.getById(id),
    enabled: !!id,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useCreateFacture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: facturesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      toast.success('Facture créée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création de la facture');
    },
  });
}

export function useUpdateFacture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => facturesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      toast.success('Facture modifiée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification de la facture');
    },
  });
}

export function useDeleteFacture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: facturesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      toast.success('Facture supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression de la facture');
    },
  });
}

export function useAnnulerFacture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { motif: string; avoir?: boolean } }) => facturesApi.annuler(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      toast.success('Facture annulée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'annulation de la facture');
    },
  });
}

export function useFacturesImpayes(clientId?: string) {
  return useQuery({
    queryKey: ['factures', 'impayes', clientId],
    queryFn: () => facturesApi.getImpayes(clientId),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useDuplicateFacture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: facturesApi.duplicate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      toast.success('Facture dupliquée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la duplication de la facture');
    },
  });
}

export function useSendFactureEmail() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { destinataire: string; sujet: string; message: string } }) => 
      facturesApi.sendEmail(id, data),
    onSuccess: () => { toast.success('Email envoyé avec succès'); },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi de l\'email');
    },
  });
}
