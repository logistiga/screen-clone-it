import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  banquesApi, paiementsApi, mouvementsCaisseApi, configurationApi,
  categoriesDepensesApi, primesApi,
  Banque, PaiementData, MouvementCaisseData, CategorieDepenseData,
  PaiementsParams, MouvementsBancairesParams, PayerPrimeData, Prime,
} from '@/lib/api/commercial';
import { toast } from 'sonner';

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['banques'] }); toast.success('Banque créée avec succès'); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Erreur lors de la création de la banque'); },
  });
}

export function useUpdateBanque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Banque> }) => banquesApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['banques'] }); toast.success('Banque modifiée avec succès'); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Erreur lors de la modification de la banque'); },
  });
}

export function useDeleteBanque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: banquesApi.delete,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['banques'] }); toast.success('Banque supprimée avec succès'); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Erreur lors de la suppression de la banque'); },
  });
}

export function useBanqueStats(id: string, params?: { date_debut?: string; date_fin?: string }) {
  return useQuery({
    queryKey: ['banques', id, 'stats', params],
    queryFn: () => banquesApi.getStats(id, params),
    enabled: !!id,
  });
}

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
      console.error('[Paiement] Erreur 422:', error.response?.data);
      const errors = error.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors).flat()[0];
        toast.error(String(firstError) || 'Erreur de validation');
      } else {
        toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement du paiement');
      }
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
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Erreur lors de la suppression du paiement'); },
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
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement du paiement global'); },
  });
}

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
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement du paiement global'); },
  });
}

export function usePaiementsStats(params?: { date_debut?: string; date_fin?: string }) {
  return useQuery({
    queryKey: ['paiements', 'stats', params],
    queryFn: () => paiementsApi.getStats(params),
  });
}

// Configuration hooks
export function useConfiguration() {
  return useQuery({ queryKey: ['configuration'], queryFn: configurationApi.get });
}

export function useTaxes() {
  return useQuery({ queryKey: ['configuration', 'taxes'], queryFn: configurationApi.getTaxes });
}

export function useNumerotation() {
  return useQuery({ queryKey: ['configuration', 'numerotation'], queryFn: configurationApi.getNumerotation });
}

export function useUpdateNumerotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: configurationApi.updateNumerotation,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['configuration'] }); toast.success('Numérotation mise à jour avec succès'); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour de la numérotation'); },
  });
}

export function useSyncCompteurs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: configurationApi.syncCompteurs,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['configuration'] }); toast.success('Compteurs synchronisés avec succès'); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Erreur lors de la synchronisation des compteurs'); },
  });
}

// Mouvements Caisse hooks
export function useMouvementsCaisse(params?: {
  type?: string; source?: string; banque_id?: string; categorie?: string;
  date_debut?: string; date_fin?: string; search?: string; page?: number; per_page?: number;
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
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement du mouvement'); },
  });
}

export function useUpdateMouvementCaisse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MouvementCaisseData> }) => mouvementsCaisseApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mouvements-caisse'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-mouvements'] });
      queryClient.invalidateQueries({ queryKey: ['caisse'] });
      queryClient.invalidateQueries({ queryKey: ['banques'] });
      toast.success('Mouvement modifié avec succès');
    },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Erreur lors de la modification du mouvement'); },
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
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Erreur lors de la suppression du mouvement'); },
  });
}

export function useSoldeCaisse() {
  return useQuery({ queryKey: ['caisse', 'solde'], queryFn: mouvementsCaisseApi.getSolde });
}

// Categories de dépenses hooks
export function useCategoriesDepenses(params?: { search?: string; type?: string; actif?: boolean; with_stats?: boolean }) {
  return useQuery({ queryKey: ['categories-depenses', params], queryFn: () => categoriesDepensesApi.getAll(params) });
}

export function useCategorieDepense(id: string) {
  return useQuery({ queryKey: ['categories-depenses', id], queryFn: () => categoriesDepensesApi.getById(id), enabled: !!id });
}

export function useCreateCategorieDepense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CategorieDepenseData) => categoriesDepensesApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories-depenses'] }); toast.success('Catégorie créée avec succès'); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Erreur lors de la création de la catégorie'); },
  });
}

export function useUpdateCategorieDepense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategorieDepenseData> }) => categoriesDepensesApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories-depenses'] }); toast.success('Catégorie modifiée avec succès'); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Erreur lors de la modification de la catégorie'); },
  });
}

export function useDeleteCategorieDepense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesDepensesApi.delete,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories-depenses'] }); toast.success('Catégorie supprimée avec succès'); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Erreur lors de la suppression de la catégorie'); },
  });
}

export function useCategorieMouvements(id: string, params?: { date_debut?: string; date_fin?: string; source?: string; page?: number; per_page?: number }) {
  return useQuery({ queryKey: ['categories-depenses', id, 'mouvements', params], queryFn: () => categoriesDepensesApi.getMouvements(id, params), enabled: !!id });
}

export function useCategoriesDepensesStats() {
  return useQuery({ queryKey: ['categories-depenses', 'stats'], queryFn: categoriesDepensesApi.getStats });
}

// Primes hooks
export function usePrimes(params?: { search?: string; representant_id?: string; transitaire_id?: string; statut?: string; page?: number; per_page?: number }) {
  return useQuery({ queryKey: ['primes', params], queryFn: () => primesApi.getAll(params) });
}

export function usePrimeById(id: string) {
  return useQuery({ queryKey: ['primes', id], queryFn: () => primesApi.getById(id), enabled: !!id });
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
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Erreur lors de la création de la prime'); },
  });
}

export function useUpdatePrime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Prime> }) => primesApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['primes'] }); toast.success('Prime modifiée avec succès'); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Erreur lors de la modification de la prime'); },
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
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Erreur lors de la suppression de la prime'); },
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
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Erreur lors du paiement de la prime'); },
  });
}

export function usePrimesStats(params?: { date_debut?: string; date_fin?: string }) {
  return useQuery({ queryKey: ['primes', 'stats', params], queryFn: () => primesApi.getStats(params) });
}
