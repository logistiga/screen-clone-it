import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Client,
  Devis,
  OrdreTravail,
  Facture,
  Armateur,
  Transitaire,
  Representant,
  Banque,
  PaiementData
} from '@/lib/api/commercial';
import { toast } from 'sonner';

// Clients hooks
export function useClients(params?: { search?: string; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ['clients', params],
    queryFn: () => clientsApi.getAll(params),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientsApi.getById(id),
    enabled: !!id,
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
  return useQuery({
    queryKey: ['devis', params],
    queryFn: () => devisApi.getAll(params),
  });
}

export function useDevisById(id: string) {
  return useQuery({
    queryKey: ['devis', id],
    queryFn: () => devisApi.getById(id),
    enabled: !!id,
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création du devis');
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
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du devis');
    },
  });
}

export function useConvertDevisToOrdre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: devisApi.convertToOrdre,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devis'] });
      queryClient.invalidateQueries({ queryKey: ['ordres'] });
      toast.success('Devis converti en ordre de travail');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la conversion');
    },
  });
}

// Ordres hooks
export function useOrdres(params?: { search?: string; statut?: string; client_id?: string; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ['ordres', params],
    queryFn: () => ordresApi.getAll(params),
  });
}

export function useOrdreById(id: string) {
  return useQuery({
    queryKey: ['ordres', id],
    queryFn: () => ordresApi.getById(id),
    enabled: !!id,
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

// Factures hooks
export function useFactures(params?: { search?: string; statut?: string; client_id?: string; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ['factures', params],
    queryFn: () => facturesApi.getAll(params),
  });
}

export function useFactureById(id: string) {
  return useQuery({
    queryKey: ['factures', id],
    queryFn: () => facturesApi.getById(id),
    enabled: !!id,
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
  });
}

// Armateurs hooks
export function useArmateurs() {
  return useQuery({
    queryKey: ['armateurs'],
    queryFn: armateursApi.getAll,
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

// Transitaires hooks
export function useTransitaires() {
  return useQuery({
    queryKey: ['transitaires'],
    queryFn: transitairesApi.getAll,
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

// Representants hooks
export function useRepresentants() {
  return useQuery({
    queryKey: ['representants'],
    queryFn: representantsApi.getAll,
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
export function useBanques() {
  return useQuery({
    queryKey: ['banques'],
    queryFn: banquesApi.getAll,
  });
}

// Paiements hooks
export function useCreatePaiement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PaiementData) => paiementsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      queryClient.invalidateQueries({ queryKey: ['ordres'] });
      toast.success('Paiement enregistré avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement du paiement');
    },
  });
}

export function useCreatePaiementGlobal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: paiementsApi.createGlobal,
    onSuccess: () => {
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
