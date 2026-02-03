/**
 * Configuration centralisée des permissions par route
 * Mapping entre les routes et les permissions requises
 */

export interface RoutePermission {
  path: string;
  permission?: string;
  permissions?: string[];
  requireAny?: boolean;
  role?: string;
}

// Mapping des routes vers les permissions requises
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  // === Dashboard === (accessible à tous les utilisateurs authentifiés, pas de permission spécifique)
  // { path: '/', permission: 'dashboard.voir' }, // Désactivé - le dashboard est accessible à tous

  // === Clients ===
  { path: '/clients', permission: 'clients.voir' },
  { path: '/clients/nouveau', permission: 'clients.creer' },
  { path: '/clients/:id', permission: 'clients.voir' },
  { path: '/clients/:id/modifier', permission: 'clients.modifier' },

  // === Devis ===
  { path: '/devis', permission: 'devis.voir' },
  { path: '/devis/nouveau', permission: 'devis.creer' },
  { path: '/devis/:id', permission: 'devis.voir' },
  { path: '/devis/:id/pdf', permission: 'devis.voir' },
  { path: '/devis/:id/modifier', permission: 'devis.modifier' },

  // === Ordres de travail ===
  { path: '/ordres', permission: 'ordres.voir' },
  { path: '/ordres/nouveau', permission: 'ordres.creer' },
  { path: '/ordres/:id', permission: 'ordres.voir' },
  { path: '/ordres/:id/pdf', permission: 'ordres.voir' },
  { path: '/ordres/:id/connaissement', permission: 'ordres.voir' },
  { path: '/ordres/:id/modifier', permission: 'ordres.modifier' },

  // === Factures ===
  { path: '/factures', permission: 'factures.voir' },
  { path: '/factures/nouvelle', permission: 'factures.creer' },
  { path: '/factures/:id', permission: 'factures.voir' },
  { path: '/factures/:id/pdf', permission: 'factures.voir' },
  { path: '/factures/:id/modifier', permission: 'factures.modifier' },

  // === Annulations ===
  { path: '/annulations', permission: 'factures.annuler' },
  { path: '/annulations/:id/avoir', permission: 'factures.voir' },

  // === Notes de débit ===
  { path: '/notes-debut', permission: 'notes.voir' },
  { path: '/notes-debut/nouvelle', permission: 'notes.creer' },
  { path: '/notes-debut/ouverture-port', permission: 'notes.creer' },
  { path: '/notes-debut/detention', permission: 'notes.creer' },
  { path: '/notes-debut/reparation', permission: 'notes.creer' },
  { path: '/notes-debut/relache', permission: 'notes.creer' },
  { path: '/notes-debut/:id', permission: 'notes.voir' },
  { path: '/notes-debut/:id/pdf', permission: 'notes.voir' },
  { path: '/notes-debut/:id/modifier', permission: 'notes.modifier' },

  // === Finance ===
  { path: '/caisse', permission: 'caisse.voir' },
  { path: '/banque', permission: 'banques.voir' },
  { path: '/caisse-globale', permission: 'caisse.voir' },
  { path: '/primes-decaissement', permission: 'caisse.voir' },

  // === Reporting ===
  { path: '/reporting', permission: 'reporting.voir' },
  { path: '/previsions', permission: 'reporting.voir' },

  // === Crédits ===
  { path: '/credits', permission: 'credits.voir' },
  { path: '/credits/:id', permission: 'credits.voir' },

  // === Administration ===
  { path: '/utilisateurs', permission: 'utilisateurs.voir', role: 'administrateur' },
  { path: '/roles', permission: 'roles.voir', role: 'administrateur' },
  { path: '/roles/nouveau', permission: 'roles.creer', role: 'administrateur' },
  { path: '/roles/:id/modifier', permission: 'roles.modifier', role: 'administrateur' },
  { path: '/profil' }, // Pas de permission requise, chaque utilisateur peut voir son profil
  { path: '/notifications' }, // Pas de permission requise

  // === Configuration ===
  { path: '/tracabilite', permission: 'audit.voir' },
  { path: '/emails', permission: 'configuration.voir' },
  { path: '/taxes', permission: 'taxes.voir' },
  { path: '/banques', permission: 'banques.voir' },
  { path: '/numerotation', permission: 'configuration.voir' },
  { path: '/categories-depenses', permission: 'configuration.voir' },
  { path: '/categories-depenses/:id', permission: 'configuration.voir' },
  { path: '/verification', permission: 'factures.voir' },

  // === Partenaires ===
  { path: '/partenaires', permission: 'partenaires.voir' },
  { path: '/partenaires/transitaires/:id', permission: 'transitaires.voir' },
  { path: '/partenaires/representants/:id', permission: 'partenaires.voir' },
  { path: '/partenaires/armateurs/:id', permission: 'partenaires.voir' },
  { path: '/partenaires/recu-prime/:id', permission: 'partenaires.voir' },

  // === Autres ===
  { path: '/guide' }, // Pas de permission requise
  { path: '/securite/connexions-suspectes', permission: 'securite.voir', role: 'administrateur' },
];

// Fonction pour obtenir les permissions d'une route
export function getRoutePermission(pathname: string): RoutePermission | undefined {
  // Essayer de trouver une correspondance exacte
  let route = ROUTE_PERMISSIONS.find(r => r.path === pathname);
  
  if (!route) {
    // Essayer avec un pattern (remplacer les IDs par :id)
    const normalizedPath = pathname.replace(/\/\d+/g, '/:id');
    route = ROUTE_PERMISSIONS.find(r => r.path === normalizedPath);
  }
  
  if (!route) {
    // Essayer un match partiel pour les sous-routes
    const pathParts = pathname.split('/').filter(Boolean);
    for (let i = pathParts.length; i > 0; i--) {
      const partialPath = '/' + pathParts.slice(0, i).join('/');
      const normalizedPartialPath = partialPath.replace(/\/\d+/g, '/:id');
      route = ROUTE_PERMISSIONS.find(r => 
        r.path === partialPath || r.path === normalizedPartialPath
      );
      if (route) break;
    }
  }
  
  return route;
}

// Fonction pour vérifier si un utilisateur a accès à une route
export function canAccessRoute(
  pathname: string, 
  hasPermission: (p: string) => boolean, 
  hasRole: (r: string) => boolean,
  isAdmin: boolean
): boolean {
  if (isAdmin) return true;
  
  const route = getRoutePermission(pathname);
  if (!route) return true; // Route non protégée
  
  // Vérifier le rôle si requis
  if (route.role && !hasRole(route.role)) {
    return false;
  }
  
  // Vérifier la permission si requise
  if (route.permission && !hasPermission(route.permission)) {
    return false;
  }
  
  // Vérifier les permissions multiples si requises
  if (route.permissions && route.permissions.length > 0) {
    if (route.requireAny) {
      return route.permissions.some(p => hasPermission(p));
    }
    return route.permissions.every(p => hasPermission(p));
  }
  
  return true;
}
