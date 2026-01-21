import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taxesApi, TaxeConfig, MoisCourantData, HistoriqueAnnuelData } from '@/lib/api/taxes';
import { toast } from 'sonner';

const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const STALE_TIME = 2 * 60 * 1000; // 2 minutes

// Hook pour récupérer la configuration des taxes
export function useTaxesConfig() {
  return useQuery<{ data: TaxeConfig[]; taux_tva: number; taux_css: number }>({
    queryKey: ['taxes', 'config'],
    queryFn: () => taxesApi.getConfig(),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnMount: true,
  });
}

// Hook pour mettre à jour les taux de taxes
export function useUpdateTaxesConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { taux_tva: number; taux_css: number; tva_actif?: boolean; css_actif?: boolean }) => 
      taxesApi.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      queryClient.invalidateQueries({ queryKey: ['configuration'] });
      toast.success('Taux de taxes mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour des taxes');
    },
  });
}

// Hook pour récupérer les angles du mois courant
export function useTaxesMoisCourant() {
  return useQuery<MoisCourantData>({
    queryKey: ['taxes', 'mois-courant'],
    queryFn: () => taxesApi.getMoisCourant(),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnMount: true,
  });
}

// Hook pour récupérer l'historique annuel
export function useTaxesHistorique(annee?: number) {
  return useQuery<HistoriqueAnnuelData>({
    queryKey: ['taxes', 'historique', annee || new Date().getFullYear()],
    queryFn: () => taxesApi.getHistorique(annee),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

// Hook pour recalculer les taxes d'un mois
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

// Hook pour clôturer un mois
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
