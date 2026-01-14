import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';

export const DASHBOARD_KEY = ['dashboard'];

export function useDashboardStats(dateDebut?: string, dateFin?: string) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'stats', dateDebut, dateFin],
    queryFn: () => dashboardService.getStats(dateDebut, dateFin),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}

export function useDashboardGraphiques(annee?: number) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'graphiques', annee],
    queryFn: () => dashboardService.getGraphiques(annee),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardAlertes() {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'alertes'],
    queryFn: () => dashboardService.getAlertes(),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useDashboardActivite() {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'activite'],
    queryFn: () => dashboardService.getActiviteRecente(),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000,
  });
}

export function useDashboard(annee?: number) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'all', annee],
    queryFn: () => dashboardService.getAll(annee),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
