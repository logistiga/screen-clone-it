import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as annulationsApi from '@/lib/api/annulations';

export function useAnnulations(params?: {
  search?: string;
  type?: string;
  client_id?: number;
  date_debut?: string;
  date_fin?: string;
  per_page?: number;
  page?: number;
}) {
  return useQuery({
    queryKey: ['annulations', params],
    queryFn: () => annulationsApi.getAnnulations(params),
  });
}

export function useAnnulation(id: number) {
  return useQuery({
    queryKey: ['annulation', id],
    queryFn: () => annulationsApi.getAnnulation(id),
    enabled: !!id,
  });
}

export function useAnnulationsStats(params?: {
  date_debut?: string;
  date_fin?: string;
  type?: string;
}) {
  return useQuery({
    queryKey: ['annulations-stats', params],
    queryFn: () => annulationsApi.getAnnulationsStats(params),
  });
}

export function useAnnulerFacture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ factureId, data }: { 
      factureId: number; 
      data: { motif: string; generer_avoir?: boolean } 
    }) => annulationsApi.annulerFacture(factureId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annulations'] });
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      queryClient.invalidateQueries({ queryKey: ['annulations-stats'] });
      toast.success('Facture annulée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erreur lors de l'annulation");
    },
  });
}

export function useAnnulerOrdre() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ordreId, data }: { ordreId: number; data: { motif: string } }) =>
      annulationsApi.annulerOrdre(ordreId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annulations'] });
      queryClient.invalidateQueries({ queryKey: ['ordres-travail'] });
      queryClient.invalidateQueries({ queryKey: ['annulations-stats'] });
      toast.success('Ordre de travail annulé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erreur lors de l'annulation");
    },
  });
}

export function useAnnulerDevis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ devisId, data }: { devisId: number; data: { motif: string } }) =>
      annulationsApi.annulerDevis(devisId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annulations'] });
      queryClient.invalidateQueries({ queryKey: ['devis'] });
      queryClient.invalidateQueries({ queryKey: ['annulations-stats'] });
      toast.success('Devis annulé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erreur lors de l'annulation");
    },
  });
}

export function useGenererAvoir() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (annulationId: number) => annulationsApi.genererAvoir(annulationId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['annulations'] });
      queryClient.invalidateQueries({ queryKey: ['annulations-stats'] });
      toast.success(`Avoir ${data.numero_avoir} généré avec succès`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erreur lors de la génération de l'avoir");
    },
  });
}

export function useRembourserAnnulation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ annulationId, data }: {
      annulationId: number;
      data: {
        montant: number;
        mode_paiement: string;
        banque_id?: number;
        reference?: string;
        notes?: string;
      };
    }) => annulationsApi.rembourserAnnulation(annulationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annulations'] });
      // Rafraîchir les écrans de caisse
      queryClient.invalidateQueries({ queryKey: ['caisse-mouvements'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-solde'] });
      queryClient.invalidateQueries({ queryKey: ['caisse', 'solde'] });
      // Rafraîchir les banques
      queryClient.invalidateQueries({ queryKey: ['banques'] });
      toast.success('Remboursement effectué avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors du remboursement');
    },
  });
}

export function useHistoriqueAnnulationsClient(clientId: number) {
  return useQuery({
    queryKey: ['annulations-client', clientId],
    queryFn: () => annulationsApi.getHistoriqueClient(clientId),
    enabled: !!clientId,
  });
}
