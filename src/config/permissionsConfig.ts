/**
 * Configuration centrale des permissions RBAC
 * Ce fichier sert de source unique pour:
 * - Le backend (seeding des permissions)
 * - Le frontend (affichage de la matrice)
 */

// Actions globales disponibles pour tous les modules
export const GLOBAL_ACTIONS = {
  view: { key: 'voir', label: 'Voir', description: 'Consulter les données' },
  create: { key: 'creer', label: 'Créer', description: 'Créer de nouveaux éléments' },
  edit: { key: 'modifier', label: 'Modifier', description: 'Modifier les éléments existants' },
  delete: { key: 'supprimer', label: 'Supprimer', description: 'Supprimer des éléments' },
} as const;

// Actions spécifiques par contexte
export const SPECIFIC_ACTIONS = {
  validate: { key: 'valider', label: 'Valider', description: 'Valider/approuver' },
  cancel: { key: 'annuler', label: 'Annuler', description: 'Annuler un élément' },
  export: { key: 'exporter', label: 'Exporter', description: 'Exporter les données' },
  import: { key: 'importer', label: 'Importer', description: 'Importer des données' },
  print: { key: 'imprimer', label: 'Imprimer', description: 'Imprimer' },
  send: { key: 'envoyer', label: 'Envoyer', description: 'Envoyer par email' },
  duplicate: { key: 'dupliquer', label: 'Dupliquer', description: 'Dupliquer un élément' },
  assign: { key: 'assigner', label: 'Assigner', description: 'Assigner à un utilisateur' },
  unassign: { key: 'desassigner', label: 'Désassigner', description: 'Retirer une assignation' },
  close: { key: 'cloturer', label: 'Clôturer', description: 'Clôturer définitivement' },
  reopen: { key: 'reouvrir', label: 'Réouvrir', description: 'Réouvrir un élément clôturé' },
  approve: { key: 'approuver', label: 'Approuver', description: 'Donner son approbation' },
  reject: { key: 'rejeter', label: 'Rejeter', description: 'Rejeter une demande' },
  activate: { key: 'activer', label: 'Activer', description: 'Activer un élément' },
  deactivate: { key: 'desactiver', label: 'Désactiver', description: 'Désactiver un élément' },
  merge: { key: 'fusionner', label: 'Fusionner', description: 'Fusionner des éléments' },
  inventory: { key: 'inventaire', label: 'Inventaire', description: 'Gérer l\'inventaire' },
  stockIn: { key: 'entree', label: 'Entrée stock', description: 'Enregistrer une entrée de stock' },
  stockOut: { key: 'sortie', label: 'Sortie stock', description: 'Enregistrer une sortie de stock' },
  assignRole: { key: 'assigner_role', label: 'Assigner rôle', description: 'Assigner un rôle à un utilisateur' },
} as const;

// Type pour les clés d'actions
export type GlobalActionKey = keyof typeof GLOBAL_ACTIONS;
export type SpecificActionKey = keyof typeof SPECIFIC_ACTIONS;
export type ActionKey = GlobalActionKey | SpecificActionKey;

// Définition d'un module avec ses actions
export interface ModuleDefinition {
  key: string;
  label: string;
  description: string;
  icon?: string;
  category: 'commercial' | 'finance' | 'stock' | 'administration' | 'reporting';
  actions: {
    global: GlobalActionKey[];
    specific: SpecificActionKey[];
  };
}

// Configuration des modules/pages de l'application
export const MODULES: ModuleDefinition[] = [
  // === COMMERCIAL ===
  {
    key: 'clients',
    label: 'Clients',
    description: 'Gestion des clients et prospects',
    icon: 'Users',
    category: 'commercial',
    actions: {
      global: ['view', 'create', 'edit', 'delete'],
      specific: ['export', 'import', 'merge'],
    },
  },
  {
    key: 'devis',
    label: 'Devis',
    description: 'Création et suivi des devis',
    icon: 'FileText',
    category: 'commercial',
    actions: {
      global: ['view', 'create', 'edit', 'delete'],
      specific: ['validate', 'cancel', 'duplicate', 'export', 'print', 'send'],
    },
  },
  {
    key: 'ordres',
    label: 'Ordres de travail',
    description: 'Gestion des ordres de travail',
    icon: 'ClipboardList',
    category: 'commercial',
    actions: {
      global: ['view', 'create', 'edit', 'delete'],
      specific: ['validate', 'cancel', 'assign', 'export', 'print'],
    },
  },
  {
    key: 'factures',
    label: 'Factures',
    description: 'Facturation et suivi',
    icon: 'Receipt',
    category: 'commercial',
    actions: {
      global: ['view', 'create', 'edit', 'delete'],
      specific: ['validate', 'cancel', 'export', 'print', 'send'],
    },
  },
  {
    key: 'partenaires',
    label: 'Partenaires',
    description: 'Gestion des partenaires commerciaux',
    icon: 'Handshake',
    category: 'commercial',
    actions: {
      global: ['view', 'create', 'edit', 'delete'],
      specific: ['export'],
    },
  },
  {
    key: 'transitaires',
    label: 'Transitaires',
    description: 'Gestion des transitaires',
    icon: 'Ship',
    category: 'commercial',
    actions: {
      global: ['view', 'create', 'edit', 'delete'],
      specific: ['export', 'assign'],
    },
  },
  {
    key: 'transporteurs',
    label: 'Transporteurs',
    description: 'Gestion des transporteurs',
    icon: 'Truck',
    category: 'commercial',
    actions: {
      global: ['view', 'create', 'edit', 'delete'],
      specific: ['export'],
    },
  },
  {
    key: 'fournisseurs',
    label: 'Fournisseurs',
    description: 'Gestion des fournisseurs',
    icon: 'Store',
    category: 'commercial',
    actions: {
      global: ['view', 'create', 'edit', 'delete'],
      specific: ['export', 'import'],
    },
  },
  
  // === FINANCE ===
  {
    key: 'paiements',
    label: 'Paiements',
    description: 'Enregistrement des paiements',
    icon: 'CreditCard',
    category: 'finance',
    actions: {
      global: ['view', 'create', 'edit', 'delete'],
      specific: ['validate', 'cancel', 'export'],
    },
  },
  {
    key: 'caisse',
    label: 'Caisse',
    description: 'Gestion de la caisse',
    icon: 'Wallet',
    category: 'finance',
    actions: {
      global: ['view', 'create', 'edit', 'delete'],
      specific: ['validate', 'cancel', 'export', 'close'],
    },
  },
  {
    key: 'banques',
    label: 'Banques',
    description: 'Comptes bancaires et opérations',
    icon: 'Building2',
    category: 'finance',
    actions: {
      global: ['view', 'create', 'edit', 'delete'],
      specific: ['export'],
    },
  },
  {
    key: 'credits',
    label: 'Crédits',
    description: 'Gestion des crédits clients',
    icon: 'TrendingUp',
    category: 'finance',
    actions: {
      global: ['view', 'create', 'edit', 'delete'],
      specific: ['validate', 'approve', 'reject', 'export'],
    },
  },
  {
    key: 'notes',
    label: 'Notes de frais',
    description: 'Gestion des notes de frais',
    icon: 'FileSpreadsheet',
    category: 'finance',
    actions: {
      global: ['view', 'create', 'edit', 'delete'],
      specific: ['validate', 'approve', 'reject', 'export'],
    },
  },
  
  // === STOCK & PRODUITS ===
  {
    key: 'produits',
    label: 'Produits',
    description: 'Catalogue de produits',
    icon: 'Package',
    category: 'stock',
    actions: {
      global: ['view', 'create', 'edit', 'delete'],
      specific: ['export', 'import', 'activate', 'deactivate'],
    },
  },
  {
    key: 'stocks',
    label: 'Stocks',
    description: 'Gestion des stocks',
    icon: 'Warehouse',
    category: 'stock',
    actions: {
      global: ['view', 'create', 'edit', 'delete'],
      specific: ['stockIn', 'stockOut', 'inventory', 'export'],
    },
  },
  
  // === ADMINISTRATION ===
  {
    key: 'utilisateurs',
    label: 'Utilisateurs',
    description: 'Gestion des utilisateurs',
    icon: 'Users',
    category: 'administration',
    actions: {
      global: ['view', 'create', 'edit', 'delete'],
      specific: ['activate', 'deactivate', 'assignRole', 'export'],
    },
  },
  {
    key: 'roles',
    label: 'Rôles',
    description: 'Gestion des rôles et permissions',
    icon: 'Shield',
    category: 'administration',
    actions: {
      global: ['view', 'create', 'edit', 'delete'],
      specific: ['assign', 'duplicate'],
    },
  },
  {
    key: 'configuration',
    label: 'Configuration',
    description: 'Paramètres de l\'application',
    icon: 'Settings',
    category: 'administration',
    actions: {
      global: ['view', 'edit'],
      specific: ['export', 'import'],
    },
  },
  
  // === REPORTING & SECURITE ===
  {
    key: 'reporting',
    label: 'Rapports',
    description: 'Tableaux de bord et rapports',
    icon: 'BarChart3',
    category: 'reporting',
    actions: {
      global: ['view'],
      specific: ['export', 'print'],
    },
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Tableau de bord principal',
    icon: 'LayoutDashboard',
    category: 'reporting',
    actions: {
      global: ['view'],
      specific: ['export'],
    },
  },
  {
    key: 'audit',
    label: 'Audit',
    description: 'Journal d\'audit et traçabilité',
    icon: 'History',
    category: 'reporting',
    actions: {
      global: ['view'],
      specific: ['export'],
    },
  },
  {
    key: 'securite',
    label: 'Sécurité',
    description: 'Paramètres de sécurité',
    icon: 'ShieldCheck',
    category: 'reporting',
    actions: {
      global: ['view', 'edit'],
      specific: ['export'],
    },
  },
  {
    key: 'exports',
    label: 'Exports',
    description: 'Gestion des exports de données',
    icon: 'Download',
    category: 'reporting',
    actions: {
      global: ['view', 'create'],
      specific: [],
    },
  },
];

// Labels des catégories
export const CATEGORY_LABELS: Record<ModuleDefinition['category'], string> = {
  commercial: 'Commercial',
  finance: 'Finance',
  stock: 'Stock & Produits',
  administration: 'Administration',
  reporting: 'Reporting & Sécurité',
};

// Génère toutes les permissions à partir de la config
export function generateAllPermissions(): Array<{ module: string; action: string; permission: string; label: string }> {
  const permissions: Array<{ module: string; action: string; permission: string; label: string }> = [];
  
  for (const module of MODULES) {
    // Actions globales
    for (const actionKey of module.actions.global) {
      const action = GLOBAL_ACTIONS[actionKey];
      permissions.push({
        module: module.key,
        action: action.key,
        permission: `${module.key}.${action.key}`,
        label: action.label,
      });
    }
    
    // Actions spécifiques
    for (const actionKey of module.actions.specific) {
      const action = SPECIFIC_ACTIONS[actionKey];
      permissions.push({
        module: module.key,
        action: action.key,
        permission: `${module.key}.${action.key}`,
        label: action.label,
      });
    }
  }
  
  return permissions;
}

// Génère les permissions groupées par module pour l'UI
export function getPermissionsByModule(): Array<{
  module: string;
  label: string;
  description: string;
  category: string;
  categoryLabel: string;
  permissions: Array<{ name: string; label: string; action: string }>;
}> {
  return MODULES.map(module => ({
    module: module.key,
    label: module.label,
    description: module.description,
    category: module.category,
    categoryLabel: CATEGORY_LABELS[module.category],
    permissions: [
      ...module.actions.global.map(actionKey => {
        const action = GLOBAL_ACTIONS[actionKey];
        return {
          name: `${module.key}.${action.key}`,
          label: action.label,
          action: action.key,
        };
      }),
      ...module.actions.specific.map(actionKey => {
        const action = SPECIFIC_ACTIONS[actionKey];
        return {
          name: `${module.key}.${action.key}`,
          label: action.label,
          action: action.key,
        };
      }),
    ],
  }));
}

// Obtenir les modules par catégorie
export function getModulesByCategory(): Record<string, typeof MODULES> {
  const grouped: Record<string, typeof MODULES> = {};
  
  for (const module of MODULES) {
    if (!grouped[module.category]) {
      grouped[module.category] = [];
    }
    grouped[module.category].push(module);
  }
  
  return grouped;
}

// Vérifier si une permission existe
export function isValidPermission(permission: string): boolean {
  const allPermissions = generateAllPermissions();
  return allPermissions.some(p => p.permission === permission);
}

// Obtenir le label d'une permission
export function getPermissionLabel(permission: string): string {
  const [moduleKey, actionKey] = permission.split('.');
  const module = MODULES.find(m => m.key === moduleKey);
  
  if (!module) return permission;
  
  // Chercher dans les actions globales
  for (const [key, action] of Object.entries(GLOBAL_ACTIONS)) {
    if (action.key === actionKey) {
      return `${module.label} - ${action.label}`;
    }
  }
  
  // Chercher dans les actions spécifiques
  for (const [key, action] of Object.entries(SPECIFIC_ACTIONS)) {
    if (action.key === actionKey) {
      return `${module.label} - ${action.label}`;
    }
  }
  
  return permission;
}

// Export pour le backend (format simplifié)
export function getBackendConfig() {
  return {
    modules: MODULES.map(m => m.key),
    globalActions: Object.values(GLOBAL_ACTIONS).map(a => a.key),
    specificActions: Object.fromEntries(
      MODULES.map(m => [
        m.key,
        m.actions.specific.map(k => SPECIFIC_ACTIONS[k].key)
      ])
    ),
  };
}

// Rôles prédéfinis avec leurs permissions
export const PREDEFINED_ROLES = {
  administrateur: {
    label: 'Administrateur',
    description: 'Accès complet à toutes les fonctionnalités',
    permissions: 'all', // Toutes les permissions
  },
  directeur: {
    label: 'Directeur',
    description: 'Accès complet avec supervision',
    permissions: 'all',
  },
  comptable: {
    label: 'Comptable',
    description: 'Gestion financière et comptabilité',
    permissions: [
      'clients.voir',
      'devis.voir',
      'ordres.voir',
      'factures.voir', 'factures.creer', 'factures.modifier', 'factures.exporter', 'factures.imprimer',
      'paiements.voir', 'paiements.creer', 'paiements.valider', 'paiements.exporter',
      'caisse.voir', 'caisse.creer', 'caisse.exporter',
      'banques.voir', 'banques.exporter',
      'credits.voir', 'credits.creer', 'credits.exporter',
      'notes.voir', 'notes.creer', 'notes.valider', 'notes.exporter',
      'reporting.voir', 'reporting.exporter',
      'dashboard.voir',
    ],
  },
  caissier: {
    label: 'Caissier',
    description: 'Gestion de la caisse et paiements',
    permissions: [
      'clients.voir',
      'factures.voir',
      'paiements.voir', 'paiements.creer',
      'caisse.voir', 'caisse.creer',
      'banques.voir',
    ],
  },
  commercial: {
    label: 'Commercial',
    description: 'Gestion commerciale et relation client',
    permissions: [
      'clients.voir', 'clients.creer', 'clients.modifier', 'clients.exporter',
      'devis.voir', 'devis.creer', 'devis.modifier', 'devis.dupliquer', 'devis.exporter', 'devis.imprimer', 'devis.envoyer',
      'ordres.voir', 'ordres.creer',
      'factures.voir',
      'partenaires.voir',
      'transitaires.voir',
      'transporteurs.voir',
      'reporting.voir',
      'dashboard.voir',
    ],
  },
  operateur: {
    label: 'Opérateur',
    description: 'Suivi des ordres et exécution',
    permissions: [
      'clients.voir',
      'ordres.voir', 'ordres.modifier',
      'factures.voir',
      'stocks.voir',
      'dashboard.voir',
    ],
  },
};

export type PredefinedRoleName = keyof typeof PREDEFINED_ROLES;
