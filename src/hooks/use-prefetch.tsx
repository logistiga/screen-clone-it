import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { 
  clientsApi, 
  devisApi, 
  ordresApi, 
  facturesApi,
  transitairesApi,
  representantsApi,
  paiementsApi,
  mouvementsCaisseApi,
} from '@/lib/api/commercial';
import { dashboardService } from '@/services/dashboardService';
import { reportingApi } from '@/lib/api/reporting';

// Configuration du préchargement
const PREFETCH_STALE_TIME = 2 * 60 * 1000; // 2 minutes

// Mapping des routes vers les fonctions de préchargement
const prefetchMap: Record<string, () => Promise<any>> = {
  '/': () => dashboardService.getStats(),
  '/clients': () => clientsApi.getAll({ page: 1, per_page: 20 }),
  '/devis': () => devisApi.getAll({ page: 1, per_page: 20 }),
  '/ordres': () => ordresApi.getAll({ page: 1, per_page: 20 }),
  '/factures': () => facturesApi.getAll({ page: 1, per_page: 20 }),
  '/partenaires': async () => {
    const [transitaires, representants] = await Promise.all([
      transitairesApi.getAll(),
      representantsApi.getAll(),
    ]);
    return { transitaires, representants };
  },
  '/caisse': () => mouvementsCaisseApi.getAll({ page: 1, per_page: 20 }),
  '/reporting': () => reportingApi.getTableauDeBord(),
};

// Mapping des queryKeys pour le cache
const queryKeyMap: Record<string, string[]> = {
  '/': ['dashboard', 'stats'],
  '/clients': ['clients'],
  '/devis': ['devis'],
  '/ordres': ['ordres'],
  '/factures': ['factures'],
  '/partenaires': ['transitaires'],
  '/caisse': ['mouvements-caisse'],
  '/reporting': ['reporting', 'tableau-de-bord'],
};

export function usePrefetch() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const prefetchRoute = useCallback(async (url: string) => {
    // Ne pas précharger tant que l'utilisateur n'est pas authentifié
    if (!isAuthenticated) return;

    // Vérifier les routes dynamiques (ex: /clients/123)
    const clientDetailMatch = url.match(/^\/clients\/(\d+)$/);
    if (clientDetailMatch) {
      const clientId = clientDetailMatch[1];
      const queryKey = ['clients', clientId];
      
      const existingData = queryClient.getQueryData(queryKey);
      const queryState = queryClient.getQueryState(queryKey);
      
      if (existingData && queryState?.dataUpdatedAt) {
        const isStale = Date.now() - queryState.dataUpdatedAt > PREFETCH_STALE_TIME;
        if (!isStale) return;
      }
      
      try {
        await queryClient.prefetchQuery({
          queryKey,
          queryFn: () => clientsApi.getById(clientId),
          staleTime: PREFETCH_STALE_TIME,
        });
      } catch (error) {
        console.debug('Prefetch error for client', clientId, error);
      }
      return;
    }
    
    const prefetchFn = prefetchMap[url];
    const queryKey = queryKeyMap[url];
    
    if (!prefetchFn || !queryKey) return;
    
    // Vérifier si les données sont déjà en cache et fraîches
    const existingData = queryClient.getQueryData(queryKey);
    const queryState = queryClient.getQueryState(queryKey);
    
    if (existingData && queryState?.dataUpdatedAt) {
      const isStale = Date.now() - queryState.dataUpdatedAt > PREFETCH_STALE_TIME;
      if (!isStale) {
        // Données en cache et fraîches, pas besoin de précharger
        return;
      }
    }
    
    // Précharger les données en arrière-plan
    try {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn: prefetchFn,
        staleTime: PREFETCH_STALE_TIME,
      });
    } catch (error) {
      // Ignorer les erreurs de préchargement silencieusement
      console.debug('Prefetch error for', url, error);
    }
  }, [queryClient, isAuthenticated]);

  // Précharger un client spécifique
  const prefetchClient = useCallback(async (clientId: string | number) => {
    if (!isAuthenticated) return;

    const queryKey = ['clients', String(clientId)];
    
    const existingData = queryClient.getQueryData(queryKey);
    const queryState = queryClient.getQueryState(queryKey);
    
    if (existingData && queryState?.dataUpdatedAt) {
      const isStale = Date.now() - queryState.dataUpdatedAt > PREFETCH_STALE_TIME;
      if (!isStale) return;
    }
    
    try {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn: () => clientsApi.getById(String(clientId)),
        staleTime: PREFETCH_STALE_TIME,
      });
    } catch (error) {
      console.debug('Prefetch error for client', clientId, error);
    }
  }, [queryClient, isAuthenticated]);

  return { prefetchRoute, prefetchClient };
}
