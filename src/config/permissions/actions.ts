// Actions et types pour le système de permissions RBAC

export const GLOBAL_ACTIONS = {
  view: { key: 'voir', label: 'Voir', description: 'Consulter les données' },
  create: { key: 'creer', label: 'Créer', description: 'Créer de nouveaux éléments' },
  edit: { key: 'modifier', label: 'Modifier', description: 'Modifier les éléments existants' },
  delete: { key: 'supprimer', label: 'Supprimer', description: 'Supprimer des éléments' },
} as const;

export const SPECIFIC_ACTIONS = {
  validate: { key: 'valider', label: 'Valider', description: 'Valider/approuver' },
  cancel: { key: 'annuler', label: 'Annuler', description: 'Annuler un élément' },
  export: { key: 'exporter', label: 'Exporter', description: 'Exporter les données' },
  import: { key: 'importer', label: 'Importer', description: 'Importer des données' },
  print: { key: 'imprimer', label: 'Imprimer', description: 'Imprimer' },
  send: { key: 'envoyer', label: 'Envoyer', description: 'Envoyer par email/WhatsApp' },
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
  convert: { key: 'convertir', label: 'Convertir', description: 'Convertir en autre document' },
  payment: { key: 'paiement', label: 'Paiement', description: 'Enregistrer un paiement' },
  download: { key: 'telecharger', label: 'Télécharger', description: 'Télécharger le document' },
} as const;

export type GlobalActionKey = keyof typeof GLOBAL_ACTIONS;
export type SpecificActionKey = keyof typeof SPECIFIC_ACTIONS;
export type ActionKey = GlobalActionKey | SpecificActionKey;

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

export const CATEGORY_LABELS: Record<ModuleDefinition['category'], string> = {
  commercial: 'Commercial',
  finance: 'Finance',
  stock: 'Stock & Produits',
  administration: 'Administration',
  reporting: 'Reporting & Sécurité',
};
