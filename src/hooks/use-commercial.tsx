import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { 
  clientsApi, 
  devisApi, 
  ordresApi, 
  facturesApi, 
  armateursApi,
  transitairesApi,
  representantsApi,
  paiementsApi,
  banquesApi,
  configurationApi,
  mouvementsCaisseApi,
  categoriesDepensesApi,
  Client,
  Devis,
  OrdreTravail,
  Facture,
  Armateur,
  Transitaire,
  Representant,
  Banque,
  PaiementData,
  Paiement,
  PaiementsParams,
  MouvementCaisseData,
  MouvementCaisse,
  CategorieDepense,
  CategorieDepenseData,
  MouvementsBancairesParams
} from '@/lib/api/commercial';
import { toast } from 'sonner';
import { extractApiErrorInfo, formatApiErrorDebug } from '@/lib/api-error';

// Configuration de cache globale
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const STALE_TIME = 2 * 60 * 1000; // 2 minutes

// Helper: normaliser une réponse API en tableau (supporte: array | {data:[]} | {data:{data:[]}} | AxiosResponse-like)
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

// Clients hooks avec préchargement de la page suivante
export function useClients(params?: { search?: string; page?: number; per_page?: number }) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['clients', params],
    queryFn: () => clientsApi.getAll(params),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Précharger la page suivante automatiquement
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

// Devis hooks avec préchargement
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

  // Précharger la page suivante
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

      // Garder une trace exploitable côté navigateur pour diagnostiquer les erreurs backend / réseau
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devis'] });
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

      // Si le devis n'existe plus côté backend, on considère que l'état est déjà "supprimé"
      if (status === 404) {
        queryClient.invalidateQueries({ queryKey: ['devis'] });
        toast.success('Devis déjà supprimé');
        return;
      }

      console.error('Erreur suppression devis:', {
        status,
        data: responseData,
        message: error?.message,
      });
      try {
        console.error('Erreur suppression devis (json):', JSON.stringify(responseData, null, 2));
      } catch {
        // ignore
      }

      toast.error(
        (typeof responseData === 'string' ? responseData : responseData?.error) ||
          responseData?.message ||
          'Erreur lors de la suppression du devis'
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

// Ordres hooks avec préchargement
export function useOrdres(params?: { search?: string; statut?: string; categorie?: string; client_id?: string; page?: number; per_page?: number }) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['ordres', params],
    queryFn: () => ordresApi.getAll(params),
    // IMPORTANT: éviter de marteler le backend quand il répond 500
    // (React Query retry par défaut + préfetch peuvent provoquer des rafales de requêtes)
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Précharger la page suivante
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

// Stats globales des ordres (avec les mêmes filtres)
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
      // Un OT peut impacter les primes (transitaire/représentant) et donc la vue /partenaires
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
  return useMutation({
    mutationFn: ordresApi.checkConteneur,
  });
}

export function useCheckBL() {
  return useMutation({
    mutationFn: ordresApi.checkBL,
  });
}

export function useDescriptionSuggestions(search?: string) {
  return useQuery({
    queryKey: ['description-suggestions', search],
    queryFn: () => ordresApi.getDescriptionSuggestions(search),
    enabled: true,
    staleTime: 60000, // Cache 1 minute
    gcTime: 300000,
  });
}

// Factures hooks avec préchargement
export function useFactures(params?: { search?: string; statut?: string; categorie?: string; client_id?: string; page?: number; per_page?: number }) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['factures', params],
    queryFn: () => facturesApi.getAll(params),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Précharger la page suivante
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

// Armateurs hooks (✅ NORMALISE EN TABLEAU)
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

export function useCreateArmateur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: armateursApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armateurs'] });
      toast.success('Armateur créé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création de l\'armateur');
    },
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

export function useDeleteArmateur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: armateursApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armateurs'] });
      toast.success('Armateur supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression de l\'armateur');
    },
  });
}

// Transitaires hooks (✅ NORMALISE EN TABLEAU)
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

// Representants hooks (✅ NORMALISE EN TABLEAU)
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

// Banques hooks
export function useBanques(params?: { actif?: boolean; search?: string }) {
  return useQuery<Banque[]>({
    queryKey: ['banques', params],
    queryFn: () => banquesApi.getAll(params),
  });
}

export function useBanqueById(id: string) {
  return useQuery({
    queryKey: ['banques', id],
    queryFn: () => banquesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateBanque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: banquesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banques'] });
      toast.success('Banque créée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création de la banque');
    },
  });
}

export function useUpdateBanque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Banque> }) => banquesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banques'] });
      toast.success('Banque modifiée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification de la banque');
    },
  });
}

export function useDeleteBanque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: banquesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banques'] });
      toast.success('Banque supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression de la banque');
    },
  });
}

// Hook pour les mouvements bancaires unifiés (encaissements + décaissements)
export function useMouvementsBancaires(params?: MouvementsBancairesParams) {
  return useQuery({
    queryKey: ['mouvements-bancaires', params],
    queryFn: () => banquesApi.getMouvementsUnifies(params),
  });
}

// Paiements hooks
export function usePaiements(params?: PaiementsParams) {
  return useQuery({
    queryKey: ['paiements', params],
    queryFn: () => paiementsApi.getAll(params),
  });
}

export function useCreatePaiement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PaiementData) => paiementsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      queryClient.invalidateQueries({ queryKey: ['ordres'] });
      queryClient.invalidateQueries({ queryKey: ['notes-debut'] });
      toast.success('Paiement enregistré avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement du paiement');
    },
  });
}

export function useDeletePaiement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: paiementsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      queryClient.invalidateQueries({ queryKey: ['ordres'] });
      toast.success('Paiement supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du paiement');
    },
  });
}

export function useCreatePaiementGlobal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: paiementsApi.createGlobal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Paiement global enregistré avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement du paiement global');
    },
  });
}

// Configuration hooks
export function useConfiguration() {
  return useQuery({
    queryKey: ['configuration'],
    queryFn: configurationApi.get,
  });
}

export function useTaxes() {
  return useQuery({
    queryKey: ['configuration', 'taxes'],
    queryFn: configurationApi.getTaxes,
  });
}

export function useNumerotation() {
  return useQuery({
    queryKey: ['configuration', 'numerotation'],
    queryFn: configurationApi.getNumerotation,
  });
}

// Mouvements Caisse hooks
export function useMouvementsCaisse(params?: {
  type?: string;
  source?: string;
  banque_id?: string;
  categorie?: string;
  date_debut?: string;
  date_fin?: string;
  search?: string;
  page?: number;
  per_page?: number;
}) {
  return useQuery({
    queryKey: ['mouvements-caisse', params],
    queryFn: () => mouvementsCaisseApi.getAll(params),
  });
}

export function useCreateMouvementCaisse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MouvementCaisseData) => mouvementsCaisseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mouvements-caisse'] });
      queryClient.invalidateQueries({ queryKey: ['banques'] });
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
      toast.success('Mouvement enregistré avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement du mouvement');
    },
  });
}

export function useUpdateMouvementCaisse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MouvementCaisseData> }) => 
      mouvementsCaisseApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mouvements-caisse'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-mouvements'] });
      queryClient.invalidateQueries({ queryKey: ['caisse'] });
      queryClient.invalidateQueries({ queryKey: ['banques'] });
      toast.success('Mouvement modifié avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification du mouvement');
    },
  });
}

export function useDeleteMouvementCaisse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mouvementsCaisseApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mouvements-caisse'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-mouvements'] });
      queryClient.invalidateQueries({ queryKey: ['caisse'] });
      queryClient.invalidateQueries({ queryKey: ['banques'] });
      toast.success('Mouvement supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du mouvement');
    },
  });
}

export function useSoldeCaisse() {
  return useQuery({
    queryKey: ['caisse', 'solde'],
    queryFn: mouvementsCaisseApi.getSolde,
  });
}

// Categories de dépenses hooks
export function useCategoriesDepenses(params?: { search?: string; type?: string; actif?: boolean; with_stats?: boolean }) {
  return useQuery({
    queryKey: ['categories-depenses', params],
    queryFn: () => categoriesDepensesApi.getAll(params),
  });
}

export function useCategorieDepense(id: string) {
  return useQuery({
    queryKey: ['categories-depenses', id],
    queryFn: () => categoriesDepensesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateCategorieDepense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CategorieDepenseData) => categoriesDepensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-depenses'] });
      toast.success('Catégorie créée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création de la catégorie');
    },
  });
}

export function useUpdateCategorieDepense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategorieDepenseData> }) => categoriesDepensesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-depenses'] });
      toast.success('Catégorie modifiée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification de la catégorie');
    },
  });
}

export function useDeleteCategorieDepense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesDepensesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-depenses'] });
      toast.success('Catégorie supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression de la catégorie');
    },
  });
}

export function useCategorieMouvements(id: string, params?: { date_debut?: string; date_fin?: string; source?: string; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ['categories-depenses', id, 'mouvements', params],
    queryFn: () => categoriesDepensesApi.getMouvements(id, params),
    enabled: !!id,
  });
}

// ============ PRIMES HOOKS ============
import { primesApi, Prime, PayerPrimeData } from '@/lib/api/commercial';

export function usePrimes(params?: { search?: string; representant_id?: string; transitaire_id?: string; statut?: string; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ['primes', params],
    queryFn: () => primesApi.getAll(params),
  });
}

export function usePrimeById(id: string) {
  return useQuery({
    queryKey: ['primes', id],
    queryFn: () => primesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreatePrime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: primesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['primes'] });
      queryClient.invalidateQueries({ queryKey: ['transitaires'] });
      queryClient.invalidateQueries({ queryKey: ['representants'] });
      toast.success('Prime créée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création de la prime');
    },
  });
}

export function useUpdatePrime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Prime> }) => primesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['primes'] });
      toast.success('Prime modifiée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification de la prime');
    },
  });
}

export function useDeletePrime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: primesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['primes'] });
      queryClient.invalidateQueries({ queryKey: ['transitaires'] });
      queryClient.invalidateQueries({ queryKey: ['representants'] });
      toast.success('Prime supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression de la prime');
    },
  });
}

export function usePayerPrime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PayerPrimeData }) => primesApi.payer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['primes'] });
      queryClient.invalidateQueries({ queryKey: ['transitaires'] });
      queryClient.invalidateQueries({ queryKey: ['representants'] });
      queryClient.invalidateQueries({ queryKey: ['mouvements-caisse'] });
      toast.success('Paiement de prime enregistré avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors du paiement de la prime');
    },
  });
}

export function usePrimesStats(params?: { date_debut?: string; date_fin?: string }) {
  return useQuery({
    queryKey: ['primes', 'stats', params],
    queryFn: () => primesApi.getStats(params),
  });
}

// ============ ADDITIONAL HOOKS ============

// Paiements stats
export function usePaiementsStats(params?: { date_debut?: string; date_fin?: string }) {
  return useQuery({
    queryKey: ['paiements', 'stats', params],
    queryFn: () => paiementsApi.getStats(params),
  });
}

// Paiement global pour ordres
export function useCreatePaiementGlobalOrdres() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: paiementsApi.createGlobalOrdres,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
      queryClient.invalidateQueries({ queryKey: ['ordres'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Paiement global enregistré avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement du paiement global');
    },
  });
}

// Banque stats
export function useBanqueStats(id: string, params?: { date_debut?: string; date_fin?: string }) {
  return useQuery({
    queryKey: ['banques', id, 'stats', params],
    queryFn: () => banquesApi.getStats(id, params),
    enabled: !!id,
  });
}

// Categories depenses stats
export function useCategoriesDepensesStats() {
  return useQuery({
    queryKey: ['categories-depenses', 'stats'],
    queryFn: categoriesDepensesApi.getStats,
  });
}

// Update configuration numerotation
export function useUpdateNumerotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: configurationApi.updateNumerotation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuration'] });
      toast.success('Numérotation mise à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour de la numérotation');
    },
  });
}

// Sync compteurs
export function useSyncCompteurs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: configurationApi.syncCompteurs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuration'] });
      toast.success('Compteurs synchronisés avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la synchronisation des compteurs');
    },
  });
}

// Duplicate devis
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

// Send devis email
export function useSendDevisEmail() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { destinataire: string; sujet: string; message: string } }) => 
      devisApi.sendEmail(id, data),
    onSuccess: () => {
      toast.success('Email envoyé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi de l\'email');
    },
  });
}

// Duplicate facture
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

// Send facture email
export function useSendFactureEmail() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { destinataire: string; sujet: string; message: string } }) => 
      facturesApi.sendEmail(id, data),
    onSuccess: () => {
      toast.success('Email envoyé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi de l\'email');
    },
  });
}

// Update armateur
export function useUpdateArmateur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Armateur> }) => armateursApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armateurs'] });
      toast.success('Armateur modifié avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification de l\'armateur');
    },
  });
}

// Update transitaire
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

// Update representant
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
