import { useQuery } from "@tanstack/react-query";
import {
  auditService,
  userService,
  AuditFilters,
} from "@/services/auditService";

// Hook pour la liste des audits avec pagination
export function useAuditLogs(filters?: AuditFilters) {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () => auditService.getAll(filters),
    staleTime: 30 * 1000, // 30 secondes
    placeholderData: (previousData) => previousData,
  });
}

// Hook pour un audit spécifique
export function useAuditDetail(id: number) {
  return useQuery({
    queryKey: ["audit-detail", id],
    queryFn: () => auditService.getById(id),
    enabled: !!id,
  });
}

// Hook pour les actions distinctes
export function useAuditActions() {
  return useQuery({
    queryKey: ["audit-actions"],
    queryFn: () => auditService.getActions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook pour les modules/tables distinctes
export function useAuditModules() {
  return useQuery({
    queryKey: ["audit-modules"],
    queryFn: () => auditService.getTables(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook pour les statistiques
export function useAuditStats(dateDebut?: string, dateFin?: string) {
  return useQuery({
    queryKey: ["audit-stats", dateDebut, dateFin],
    queryFn: () => auditService.getStats(dateDebut, dateFin),
    staleTime: 60 * 1000, // 1 minute
  });
}

// Hook pour l'export
export function useAuditExport(dateDebut?: string, dateFin?: string) {
  return useQuery({
    queryKey: ["audit-export", dateDebut, dateFin],
    queryFn: () => auditService.export(dateDebut, dateFin),
    enabled: false, // Manuel seulement
  });
}

// Hook pour les utilisateurs (filtres)
export function useUsers() {
  return useQuery({
    queryKey: ["users-list"],
    queryFn: () => userService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
