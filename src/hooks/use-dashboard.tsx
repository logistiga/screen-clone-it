import { useQuery } from '@tanstack/react-query';
import { dashboardService, DashboardStats, DashboardGraphiques, DashboardAlerte, DashboardActivite } from '@/services/dashboardService';
import { useAuth } from '@/hooks/use-auth';

export const DASHBOARD_KEY = ['dashboard'];

// Default empty data to prevent crashes when API is unavailable
const defaultStats: DashboardStats = {
  clients: 0,
  devis: 0,
  ordres: 0,
  factures: 0,
  paiements: 0,
  caisse: 0,
  banque: 0,
  creances: 0,
  ca_mensuel: 0,
  ca_annuel: 0,
};

const defaultGraphiques: DashboardGraphiques = {
  ca_mensuel: [],
  paiements_mensuel: [],
  top_clients: [],
  factures_par_categorie: [],
};

const defaultAlertes: DashboardAlerte[] = [];

const defaultActivite: DashboardActivite[] = [];

export function useDashboardStats(dateDebut?: string, dateFin?: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'stats', dateDebut, dateFin],
    queryFn: () => dashboardService.getStats(dateDebut, dateFin),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    refetchInterval: false, // Disable auto-refetch to avoid API spam
    refetchOnWindowFocus: false,
    retry: 1, // Only retry once
    placeholderData: defaultStats,
  });
}

export function useDashboardGraphiques(annee?: number) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'graphiques', annee],
    queryFn: () => dashboardService.getGraphiques(annee),
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: defaultGraphiques,
  });
}

export function useDashboardAlertes() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'alertes'],
    queryFn: () => dashboardService.getAlertes(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: defaultAlertes,
  });
}

export function useDashboardActivite() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'activite'],
    queryFn: () => dashboardService.getActiviteRecente(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: defaultActivite,
  });
}

export function useDashboard(annee?: number) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'all', annee],
    queryFn: () => dashboardService.getAll(annee),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
