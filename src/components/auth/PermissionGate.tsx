import { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface PermissionGateProps {
  /** Permission unique requise (ex: "clients.creer") */
  permission?: string;
  /** Plusieurs permissions (utilisé avec requireAny/requireAll) */
  permissions?: string[];
  /** true = au moins une permission (OR), false = toutes requises (AND) */
  requireAny?: boolean;
  /** Rôle requis (ex: "administrateur") */
  role?: string;
  /** Contenu affiché si l'utilisateur a les permissions */
  children: ReactNode;
  /** Contenu alternatif si l'utilisateur n'a pas les permissions */
  fallback?: ReactNode;
  /** Si true, inverse la logique (affiche si l'utilisateur N'A PAS la permission) */
  invert?: boolean;
}

/**
 * Composant PermissionGate pour afficher/masquer du contenu selon les permissions
 * 
 * @example
 * // Permission unique
 * <PermissionGate permission="clients.creer">
 *   <Button>Nouveau client</Button>
 * </PermissionGate>
 * 
 * @example
 * // Plusieurs permissions (OR)
 * <PermissionGate permissions={["devis.modifier", "devis.supprimer"]} requireAny>
 *   <ActionsMenu />
 * </PermissionGate>
 * 
 * @example
 * // Avec fallback
 * <PermissionGate permission="rapports.exporter" fallback={<span>Non autorisé</span>}>
 *   <ExportButton />
 * </PermissionGate>
 * 
 * @example
 * // Avec rôle
 * <PermissionGate role="administrateur">
 *   <AdminPanel />
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  permissions,
  requireAny = true,
  role,
  children,
  fallback = null,
  invert = false,
}: PermissionGateProps) {
  const { hasPermission, hasRole, user } = useAuth();

  const checkAccess = (): boolean => {
    // Admin a toujours accès
    const isAdmin = user?.role === 'admin' || 
                    user?.role === 'administrateur' || 
                    hasRole('administrateur');
    
    if (isAdmin && !invert) return true;

    // Vérifier le rôle si requis
    if (role && !hasRole(role)) {
      return false;
    }

    // Vérifier permission unique
    if (permission) {
      return hasPermission(permission);
    }

    // Vérifier permissions multiples
    if (permissions && permissions.length > 0) {
      if (requireAny) {
        return permissions.some(p => hasPermission(p));
      }
      return permissions.every(p => hasPermission(p));
    }

    // Pas de permission spécifiée = accès autorisé
    return true;
  };

  const hasAccess = invert ? !checkAccess() : checkAccess();

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Hook pour vérifier une permission unique
 */
export function useHasPermission(permission: string): boolean {
  const { hasPermission, hasRole, user } = useAuth();
  
  const isAdmin = user?.role === 'admin' || 
                  user?.role === 'administrateur' || 
                  hasRole('administrateur');
  
  if (isAdmin) return true;
  return hasPermission(permission);
}

/**
 * Hook pour vérifier plusieurs permissions
 */
export function useHasPermissions(permissions: string[], requireAny = true): boolean {
  const { hasPermission, hasRole, user } = useAuth();
  
  const isAdmin = user?.role === 'admin' || 
                  user?.role === 'administrateur' || 
                  hasRole('administrateur');
  
  if (isAdmin) return true;
  
  if (requireAny) {
    return permissions.some(p => hasPermission(p));
  }
  return permissions.every(p => hasPermission(p));
}

/**
 * Hook pour vérifier un rôle
 */
export function useHasRole(role: string): boolean {
  const { hasRole, user } = useAuth();
  
  const isAdmin = user?.role === 'admin' || 
                  user?.role === 'administrateur' || 
                  hasRole('administrateur');
  
  if (isAdmin) return true;
  return hasRole(role);
}

/**
 * Hook combiné pour vérifier permissions ET rôle
 */
export function useCanAccess(options: {
  permission?: string;
  permissions?: string[];
  requireAny?: boolean;
  role?: string;
}): boolean {
  const { hasPermission, hasRole, user } = useAuth();
  const { permission, permissions, requireAny = true, role } = options;
  
  const isAdmin = user?.role === 'admin' || 
                  user?.role === 'administrateur' || 
                  hasRole('administrateur');
  
  if (isAdmin) return true;

  // Vérifier le rôle
  if (role && !hasRole(role)) {
    return false;
  }

  // Vérifier permission unique
  if (permission && !hasPermission(permission)) {
    return false;
  }

  // Vérifier permissions multiples
  if (permissions && permissions.length > 0) {
    if (requireAny) {
      return permissions.some(p => hasPermission(p));
    }
    return permissions.every(p => hasPermission(p));
  }

  return true;
}

// Export des constantes de permissions pour usage facile
export const PERMISSIONS = {
  // Clients
  CLIENTS_VIEW: 'clients.voir',
  CLIENTS_CREATE: 'clients.creer',
  CLIENTS_EDIT: 'clients.modifier',
  CLIENTS_DELETE: 'clients.supprimer',
  CLIENTS_EXPORT: 'clients.exporter',
  
  // Devis
  DEVIS_VIEW: 'devis.voir',
  DEVIS_CREATE: 'devis.creer',
  DEVIS_EDIT: 'devis.modifier',
  DEVIS_DELETE: 'devis.supprimer',
  DEVIS_VALIDATE: 'devis.valider',
  DEVIS_CANCEL: 'devis.annuler',
  DEVIS_EXPORT: 'devis.exporter',
  
  // Ordres
  ORDRES_VIEW: 'ordres.voir',
  ORDRES_CREATE: 'ordres.creer',
  ORDRES_EDIT: 'ordres.modifier',
  ORDRES_DELETE: 'ordres.supprimer',
  ORDRES_VALIDATE: 'ordres.valider',
  
  // Factures
  FACTURES_VIEW: 'factures.voir',
  FACTURES_CREATE: 'factures.creer',
  FACTURES_EDIT: 'factures.modifier',
  FACTURES_DELETE: 'factures.supprimer',
  FACTURES_VALIDATE: 'factures.valider',
  FACTURES_CANCEL: 'factures.annuler',
  FACTURES_EXPORT: 'factures.exporter',
  
  // Paiements
  PAIEMENTS_VIEW: 'paiements.voir',
  PAIEMENTS_CREATE: 'paiements.creer',
  PAIEMENTS_VALIDATE: 'paiements.valider',
  
  // Caisse
  CAISSE_VIEW: 'caisse.voir',
  CAISSE_CREATE: 'caisse.creer',
  CAISSE_CLOSE: 'caisse.cloturer',
  
  // Administration
  USERS_VIEW: 'utilisateurs.voir',
  USERS_CREATE: 'utilisateurs.creer',
  USERS_EDIT: 'utilisateurs.modifier',
  USERS_DELETE: 'utilisateurs.supprimer',
  
  ROLES_VIEW: 'roles.voir',
  ROLES_CREATE: 'roles.creer',
  ROLES_EDIT: 'roles.modifier',
  ROLES_DELETE: 'roles.supprimer',
  
  CONFIG_VIEW: 'configuration.voir',
  CONFIG_EDIT: 'configuration.modifier',
  
  AUDIT_VIEW: 'audit.voir',
  AUDIT_EXPORT: 'audit.exporter',
  
  // Reporting
  REPORTING_VIEW: 'reporting.voir',
  REPORTING_EXPORT: 'reporting.exporter',
  
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.voir',
} as const;
