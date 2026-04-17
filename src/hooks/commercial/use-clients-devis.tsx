import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { clientsApi, devisApi, Client, Devis } from '@/lib/api/commercial';
import { toast } from 'sonner';
import { extractApiErrorInfo, formatApiErrorDebug } from '@/lib/api-error';

const CACHE_TIME = 5 * 60 * 1000;
const STALE_TIME = 2 * 60 * 1000;

// Clients hooks
export function useClients(params?: { search?: string; page?: number; per_page?: number }) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['clients', params],
    queryFn: () => clientsApi.getAll(params),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  useEffect(() => {
    if (query.data?.meta && params?.page) {
      const { current_page, last_page } = query.data.meta;
      if (current_page < last_page) {
        const nextPageParams = { ...params, page: current_page + 1 };
        queryClient.prefetchQuery({
          queryKey: ['clients', nextPageParams],
          queryFn: () => clientsApi.getAll(nextPageParams),
          staleTime: STALE_TIME,
        });
      }
    }
  }, [query.data?.meta, params, queryClient]);

  return query;
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientsApi.getById(id),
    enabled: !!id,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clientsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client créé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création du client');
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Client> }) => clientsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client modifié avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification du client');
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clientsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du client');
    },
  });
}

// Devis hooks
export function useDevis(params?: { search?: string; statut?: string; client_id?: string; page?: number; per_page?: number }) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['devis', params],
    queryFn: () => devisApi.getAll(params),
    retry: 0,
    refetchOnWindowFocus: false,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  useEffect(() => {
    if (query.data?.meta && params?.page) {
      const { current_page, last_page } = query.data.meta;
      if (current_page < last_page) {
        const nextPageParams = { ...params, page: current_page + 1 };
        queryClient.prefetchQuery({
          queryKey: ['devis', nextPageParams],
          queryFn: () => devisApi.getAll(nextPageParams),
          staleTime: STALE_TIME,
        });
      }
    }
  }, [query.data?.meta, params, queryClient]);

  return query;
}

export function useDevisById(id: string) {
  return useQuery({
    queryKey: ['devis', id],
    queryFn: () => devisApi.getById(id),
    enabled: !!id,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useCreateDevis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: devisApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devis'] });
      toast.success('Devis créé avec succès');
    },
    onError: (error: unknown) => {
      const info = extractApiErrorInfo(error);
      console.error('Erreur création devis:', info);
      console.error('Erreur création devis (debug):', formatApiErrorDebug(info));
      toast.error(info.message);
    },
  });
}

export function useUpdateDevis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => devisApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['devis'] });
      queryClient.invalidateQueries({ queryKey: ['devis', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['reporting'] });
      toast.success('Devis modifié avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification du devis');
    },
  });
}

export function useDeleteDevis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: devisApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devis'] });
      toast.success('Devis supprimé avec succès');
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      const responseData = error?.response?.data;
      if (status === 404) {
        queryClient.invalidateQueries({ queryKey: ['devis'] });
        toast.success('Devis déjà supprimé');
        return;
      }
      console.error('Erreur suppression devis:', { status, data: responseData, message: error?.message });
      try { console.error('Erreur suppression devis (json):', JSON.stringify(responseData, null, 2)); } catch {}
      toast.error(
        (typeof responseData === 'string' ? responseData : responseData?.error) ||
          responseData?.message || 'Erreur lors de la suppression du devis'
      );
    },
  });
}

export function useConvertDevisToOrdre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: devisApi.convertToOrdre,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['devis'] });
      queryClient.invalidateQueries({ queryKey: ['ordres'] });
      const ordreId = result?.data?.id;
      toast.success('Devis converti en ordre de travail', {
        description: ordreId ? 'Vous allez être redirigé vers l\'ordre créé' : undefined,
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la conversion');
    },
  });
}

export function useConvertDevisToFacture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: devisApi.convertToFacture,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['devis'] });
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      const factureId = result?.data?.id;
      toast.success('Devis converti en facture', {
        description: factureId ? 'Vous allez être redirigé vers la facture créée' : undefined,
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la conversion en facture');
    },
  });
}

export function useDuplicateDevis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: devisApi.duplicate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devis'] });
      toast.success('Devis dupliqué avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la duplication du devis');
    },
  });
}

export function useSendDevisEmail() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { destinataire: string; sujet: string; message: string } }) => 
      devisApi.sendEmail(id, data),
    onSuccess: () => { toast.success('Email envoyé avec succès'); },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi de l\'email');
    },
  });
}
