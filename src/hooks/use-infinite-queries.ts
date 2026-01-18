import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { 
  clientsApi, 
  devisApi, 
  ordresApi, 
  facturesApi,
  PaginatedResponse,
  Client,
  Devis,
  OrdreTravail,
  Facture
} from '@/lib/api/commercial';

// Configuration de cache
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const STALE_TIME = 2 * 60 * 1000; // 2 minutes

// Types pour les paramètres de filtre
interface BaseFilterParams {
  search?: string;
  per_page?: number;
}

interface DevisFilterParams extends BaseFilterParams {
  statut?: string;
  client_id?: string;
}

interface OrdresFilterParams extends BaseFilterParams {
  statut?: string;
  categorie?: string;
  client_id?: string;
}

interface FacturesFilterParams extends BaseFilterParams {
  statut?: string;
  categorie?: string;
  client_id?: string;
}

// Hook générique pour infinite scroll
function useInfiniteList<T, P extends BaseFilterParams>(
  queryKey: string,
  apiFn: (params: P & { page: number }) => Promise<PaginatedResponse<T>>,
  params: P
) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: [queryKey, 'infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await apiFn({ ...params, page: pageParam as number });
      return result;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.current_page < lastPage.meta.last_page) {
        return lastPage.meta.current_page + 1;
      }
      return undefined;
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Préchargement de la page suivante
  const prefetchNextPage = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      const nextPage = (query.data?.pages.length || 0) + 1;
      queryClient.prefetchInfiniteQuery({
        queryKey: [queryKey, 'infinite', params],
        queryFn: async ({ pageParam = nextPage }) => {
          return await apiFn({ ...params, page: pageParam as number });
        },
        initialPageParam: nextPage,
      });
    }
  }, [query.hasNextPage, query.isFetchingNextPage, query.data?.pages.length, queryClient, queryKey, params, apiFn]);

  // Données aplaties
  const flatData = query.data?.pages.flatMap(page => page.data) || [];
  
  // Métadonnées totales
  const totalItems = query.data?.pages[0]?.meta.total || 0;

  return {
    ...query,
    flatData,
    totalItems,
    prefetchNextPage,
  };
}

// Hook pour l'observation de l'intersection (scroll infini)
export function useInfiniteScroll(
  fetchNextPage: () => void,
  hasNextPage: boolean | undefined,
  isFetchingNextPage: boolean
) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return loadMoreRef;
}

// Hooks spécifiques pour chaque entité
export function useInfiniteClients(params: BaseFilterParams = {}) {
  return useInfiniteList<Client, BaseFilterParams>(
    'clients',
    (p) => clientsApi.getAll({ ...p }),
    { per_page: 20, ...params }
  );
}

export function useInfiniteDevis(params: DevisFilterParams = {}) {
  return useInfiniteList<Devis, DevisFilterParams>(
    'devis',
    (p) => devisApi.getAll({ ...p }),
    { per_page: 20, ...params }
  );
}

export function useInfiniteOrdres(params: OrdresFilterParams = {}) {
  return useInfiniteList<OrdreTravail, OrdresFilterParams>(
    'ordres',
    (p) => ordresApi.getAll({ ...p }),
    { per_page: 20, ...params }
  );
}

export function useInfiniteFactures(params: FacturesFilterParams = {}) {
  return useInfiniteList<Facture, FacturesFilterParams>(
    'factures',
    (p) => facturesApi.getAll({ ...p }),
    { per_page: 20, ...params }
  );
}

// Hook pour la pagination traditionnelle avec préchargement
export function usePaginatedWithPrefetch<T, P extends BaseFilterParams>(
  queryKey: string,
  apiFn: (params: P & { page: number }) => Promise<PaginatedResponse<T>>,
  params: P & { page: number }
) {
  const queryClient = useQueryClient();

  // Précharger la page suivante
  useEffect(() => {
    const nextPage = params.page + 1;
    queryClient.prefetchQuery({
      queryKey: [queryKey, { ...params, page: nextPage }],
      queryFn: () => apiFn({ ...params, page: nextPage }),
      staleTime: STALE_TIME,
    });
  }, [params, queryClient, queryKey, apiFn]);

  return queryClient;
}

// Export des types
export type { BaseFilterParams, DevisFilterParams, OrdresFilterParams, FacturesFilterParams };
