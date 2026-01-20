import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, ShieldX, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[]; // Pour vérifier plusieurs permissions (OR)
  requiredRole?: string;
  requireAny?: boolean; // true = OR, false = AND pour requiredPermissions
}

export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  requiredPermissions,
  requiredRole,
  requireAny = true 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission, hasRole, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérification des permissions
  const checkPermissions = (): boolean => {
    // Admin a toujours accès
    if (user?.role === 'admin' || user?.role === 'administrateur' || hasRole('administrateur')) {
      return true;
    }

    // Vérification d'une permission unique
    if (requiredPermission) {
      return hasPermission(requiredPermission);
    }

    // Vérification de plusieurs permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      if (requireAny) {
        // OR: au moins une permission requise
        return requiredPermissions.some(p => hasPermission(p));
      } else {
        // AND: toutes les permissions requises
        return requiredPermissions.every(p => hasPermission(p));
      }
    }

    // Pas de permission spécifiée = accès autorisé (route protégée mais sans permission spécifique)
    return true;
  };

  const checkRoles = (): boolean => {
    if (!requiredRole) return true;
    
    // Admin a toujours accès
    if (user?.role === 'admin' || user?.role === 'administrateur' || hasRole('administrateur')) {
      return true;
    }

    return hasRole(requiredRole);
  };

  if (!checkPermissions()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 max-w-md p-8">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-destructive">Accès refusé</h1>
            <p className="text-muted-foreground">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </p>
            {requiredPermission && (
              <p className="text-sm text-muted-foreground mt-2">
                Permission requise: <code className="bg-muted px-2 py-1 rounded">{requiredPermission}</code>
              </p>
            )}
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="mt-4"
          >
            Retour
          </Button>
        </div>
      </div>
    );
  }

  if (!checkRoles()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 max-w-md p-8">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-destructive">Accès refusé</h1>
            <p className="text-muted-foreground">
              Votre rôle ne vous permet pas d'accéder à cette page.
            </p>
            {requiredRole && (
              <p className="text-sm text-muted-foreground mt-2">
                Rôle requis: <code className="bg-muted px-2 py-1 rounded">{requiredRole}</code>
              </p>
            )}
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="mt-4"
          >
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Hook utilitaire pour vérifier les permissions dans les composants
export function usePermission(permission: string): boolean {
  const { hasPermission, hasRole, user } = useAuth();
  
  // Admin a toujours accès
  if (user?.role === 'admin' || user?.role === 'administrateur' || hasRole('administrateur')) {
    return true;
  }
  
  return hasPermission(permission);
}

// Hook pour vérifier plusieurs permissions
export function usePermissions(permissions: string[], requireAny = true): boolean {
  const { hasPermission, hasRole, user } = useAuth();
  
  // Admin a toujours accès
  if (user?.role === 'admin' || user?.role === 'administrateur' || hasRole('administrateur')) {
    return true;
  }
  
  if (requireAny) {
    return permissions.some(p => hasPermission(p));
  }
  return permissions.every(p => hasPermission(p));
}
