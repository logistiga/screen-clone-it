import { useQuery } from '@tanstack/react-query';
import { reportingApi } from '@/lib/api/reporting';

export function useTableauDeBord(annee?: number) {
  return useQuery({
    queryKey: ['reporting', 'tableau-de-bord', annee],
    queryFn: () => reportingApi.getTableauDeBord(annee),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useChiffreAffaires(annee?: number, mois?: number) {
  return useQuery({
    queryKey: ['reporting', 'chiffre-affaires', annee, mois],
    queryFn: () => reportingApi.getChiffreAffaires(annee, mois),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRentabilite(annee?: number) {
  return useQuery({
    queryKey: ['reporting', 'rentabilite', annee],
    queryFn: () => reportingApi.getRentabilite(annee),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreances() {
  return useQuery({
    queryKey: ['reporting', 'creances'],
    queryFn: () => reportingApi.getCreances(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTresorerie(dateDebut: string, dateFin: string) {
  return useQuery({
    queryKey: ['reporting', 'tresorerie', dateDebut, dateFin],
    queryFn: () => reportingApi.getTresorerie(dateDebut, dateFin),
    enabled: !!dateDebut && !!dateFin,
    staleTime: 5 * 60 * 1000,
  });
}

export function useComparatif(annee1: number, annee2: number) {
  return useQuery({
    queryKey: ['reporting', 'comparatif', annee1, annee2],
    queryFn: () => reportingApi.getComparatif(annee1, annee2),
    staleTime: 5 * 60 * 1000,
  });
}

export function useActiviteClients(dateDebut: string, dateFin: string, limit?: number) {
  return useQuery({
    queryKey: ['reporting', 'activite-clients', dateDebut, dateFin, limit],
    queryFn: () => reportingApi.getActiviteClients(dateDebut, dateFin, limit),
    enabled: !!dateDebut && !!dateFin,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStatistiquesDocuments(annee?: number) {
  return useQuery({
    queryKey: ['reporting', 'statistiques-documents', annee],
    queryFn: () => reportingApi.getStatistiquesDocuments(annee),
    staleTime: 5 * 60 * 1000,
  });
}
