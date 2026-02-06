import { useQuery } from '@tanstack/react-query';
import { reportingApi } from '@/lib/api/reporting';

const REPORTING_STALE_TIME = 10 * 60 * 1000; // 10 minutes — ces données changent peu

export function useTableauDeBord(annee?: number) {
  return useQuery({
    queryKey: ['reporting', 'tableau-de-bord', annee],
    queryFn: () => reportingApi.getTableauDeBord(annee),
    staleTime: REPORTING_STALE_TIME,
    retry: false, // Le retry 429 est géré dans reportingCall
    refetchOnWindowFocus: false,
  });
}

export function useChiffreAffaires(annee?: number, mois?: number) {
  return useQuery({
    queryKey: ['reporting', 'chiffre-affaires', annee, mois],
    queryFn: () => reportingApi.getChiffreAffaires(annee, mois),
    staleTime: REPORTING_STALE_TIME,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useRentabilite(annee?: number) {
  return useQuery({
    queryKey: ['reporting', 'rentabilite', annee],
    queryFn: () => reportingApi.getRentabilite(annee),
    staleTime: REPORTING_STALE_TIME,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useCreances() {
  return useQuery({
    queryKey: ['reporting', 'creances'],
    queryFn: () => reportingApi.getCreances(),
    staleTime: REPORTING_STALE_TIME,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useTresorerie(dateDebut: string, dateFin: string) {
  return useQuery({
    queryKey: ['reporting', 'tresorerie', dateDebut, dateFin],
    queryFn: () => reportingApi.getTresorerie(dateDebut, dateFin),
    enabled: !!dateDebut && !!dateFin,
    staleTime: REPORTING_STALE_TIME,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useComparatif(annee1: number, annee2: number) {
  return useQuery({
    queryKey: ['reporting', 'comparatif', annee1, annee2],
    queryFn: () => reportingApi.getComparatif(annee1, annee2),
    staleTime: REPORTING_STALE_TIME,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useActiviteClients(dateDebut: string, dateFin: string, limit?: number) {
  return useQuery({
    queryKey: ['reporting', 'activite-clients', dateDebut, dateFin, limit],
    queryFn: () => reportingApi.getActiviteClients(dateDebut, dateFin, limit),
    enabled: !!dateDebut && !!dateFin,
    staleTime: REPORTING_STALE_TIME,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useStatistiquesDocuments(annee?: number) {
  return useQuery({
    queryKey: ['reporting', 'statistiques-documents', annee],
    queryFn: () => reportingApi.getStatistiquesDocuments(annee),
    staleTime: REPORTING_STALE_TIME,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
