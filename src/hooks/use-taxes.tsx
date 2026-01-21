import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taxesApi, Taxe, TaxeFormData, MoisCourantData, HistoriqueAnnuelData } from '@/lib/api/taxes';
import { toast } from 'sonner';

const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const STALE_TIME = 2 * 60 * 1000; // 2 minutes

// ====== Hooks pour le CRUD des taxes ======

// Récupérer toutes les taxes
export function useTaxes(activeOnly?: boolean) {
  return useQuery<{ data: Taxe[]; total: number }>({
    queryKey: ['taxes', 'list', activeOnly],
    queryFn: () => taxesApi.getAll(activeOnly),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnMount: true,
  });
}

// Récupérer les taxes actives (pour formulaires)
export function useTaxesActives() {
  return useQuery<{ data: Taxe[] }>({
    queryKey: ['taxes', 'actives'],
    queryFn: () => taxesApi.getActives(),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnMount: true,
  });
}

// Récupérer une taxe par ID
export function useTaxe(id: number | null) {
  return useQuery<{ data: Taxe }>({
    queryKey: ['taxes', 'detail', id],
    queryFn: () => taxesApi.getById(id!),
    enabled: id !== null,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

// Créer une taxe
export function useCreateTaxe() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: TaxeFormData) => taxesApi.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      toast.success(result.message || 'Taxe créée avec succès');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Erreur lors de la création';
      toast.error(message);
    },
  });
}

// Mettre à jour une taxe
export function useUpdateTaxe() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TaxeFormData> }) => 
      taxesApi.update(id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      toast.success(result.message || 'Taxe mise à jour');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour';
      toast.error(message);
    },
  });
}

// Supprimer une taxe
export function useDeleteTaxe() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => taxesApi.delete(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      toast.success(result.message || 'Taxe supprimée');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Erreur lors de la suppression';
      toast.error(message);
    },
  });
}

// Toggle actif/inactif
export function useToggleTaxeActive() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => taxesApi.toggleActive(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      toast.success(result.data.active ? 'Taxe activée' : 'Taxe désactivée');
    },
    onError: () => {
      toast.error('Erreur lors du changement de statut');
    },
  });
}

// Réordonner les taxes
export function useReorderTaxes() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (ordres: { id: number; ordre: number }[]) => taxesApi.reorder(ordres),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      toast.success('Ordre mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour de l\'ordre');
    },
  });
}

// ====== Hooks pour les angles mensuels ======

// Récupérer les angles du mois courant
export function useTaxesMoisCourant() {
  return useQuery<MoisCourantData>({
    queryKey: ['taxes', 'mois-courant'],
    queryFn: () => taxesApi.getMoisCourant(),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnMount: true,
  });
}

// Récupérer l'historique annuel
export function useTaxesHistorique(annee?: number) {
  return useQuery<HistoriqueAnnuelData>({
    queryKey: ['taxes', 'historique', annee || new Date().getFullYear()],
    queryFn: () => taxesApi.getHistorique(annee),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

// Recalculer les taxes d'un mois
export function useRecalculerTaxes() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ annee, mois }: { annee: number; mois: number }) => 
      taxesApi.recalculer(annee, mois),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      toast.success('Taxes recalculées avec succès');
    },
    onError: () => {
      toast.error('Erreur lors du recalcul');
    },
  });
}

// Clôturer un mois
export function useCloturerMois() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ annee, mois }: { annee: number; mois: number }) => 
      taxesApi.cloturerMois(annee, mois),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.info(data.message);
      }
    },
    onError: () => {
      toast.error('Erreur lors de la clôture');
    },
  });
}
