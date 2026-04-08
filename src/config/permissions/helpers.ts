import { GLOBAL_ACTIONS, SPECIFIC_ACTIONS, CATEGORY_LABELS } from './actions';
import type { ModuleDefinition } from './actions';
import { MODULES } from './modules';

// Génère toutes les permissions à partir de la config
export function generateAllPermissions(): Array<{ module: string; action: string; permission: string; label: string }> {
  const permissions: Array<{ module: string; action: string; permission: string; label: string }> = [];
  for (const module of MODULES) {
    for (const actionKey of module.actions.global) {
      const action = GLOBAL_ACTIONS[actionKey];
      permissions.push({ module: module.key, action: action.key, permission: `${module.key}.${action.key}`, label: action.label });
    }
    for (const actionKey of module.actions.specific) {
      const action = SPECIFIC_ACTIONS[actionKey];
      permissions.push({ module: module.key, action: action.key, permission: `${module.key}.${action.key}`, label: action.label });
    }
  }
  return permissions;
}

export function getPermissionsByModule(): Array<{
  module: string; label: string; description: string; category: string; categoryLabel: string;
  permissions: Array<{ name: string; label: string; action: string }>;
}> {
  return MODULES.map(module => ({
    module: module.key, label: module.label, description: module.description,
    category: module.category, categoryLabel: CATEGORY_LABELS[module.category],
    permissions: [
      ...module.actions.global.map(actionKey => {
        const action = GLOBAL_ACTIONS[actionKey];
        return { name: `${module.key}.${action.key}`, label: action.label, action: action.key };
      }),
      ...module.actions.specific.map(actionKey => {
        const action = SPECIFIC_ACTIONS[actionKey];
        return { name: `${module.key}.${action.key}`, label: action.label, action: action.key };
      }),
    ],
  }));
}

export function getModulesByCategory(): Record<string, typeof MODULES> {
  const grouped: Record<string, typeof MODULES> = {};
  for (const module of MODULES) {
    if (!grouped[module.category]) grouped[module.category] = [];
    grouped[module.category].push(module);
  }
  return grouped;
}

export function isValidPermission(permission: string): boolean {
  return generateAllPermissions().some(p => p.permission === permission);
}

export function getPermissionLabel(permission: string): string {
  const [moduleKey, actionKey] = permission.split('.');
  const module = MODULES.find(m => m.key === moduleKey);
  if (!module) return permission;
  for (const [, action] of Object.entries(GLOBAL_ACTIONS)) {
    if (action.key === actionKey) return `${module.label} - ${action.label}`;
  }
  for (const [, action] of Object.entries(SPECIFIC_ACTIONS)) {
    if (action.key === actionKey) return `${module.label} - ${action.label}`;
  }
  return permission;
}

export function getBackendConfig() {
  return {
    modules: MODULES.map(m => m.key),
    globalActions: Object.values(GLOBAL_ACTIONS).map(a => a.key),
    specificActions: Object.fromEntries(MODULES.map(m => [m.key, m.actions.specific.map(k => SPECIFIC_ACTIONS[k].key)])),
  };
}

// Rôles prédéfinis
export const PREDEFINED_ROLES = {
  administrateur: { label: 'Administrateur', description: 'Accès complet à toutes les fonctionnalités', permissions: 'all' as const },
  directeur: { label: 'Directeur', description: 'Accès complet avec supervision', permissions: 'all' as const },
  comptable: {
    label: 'Comptable', description: 'Gestion financière et comptabilité',
    permissions: [
      'profil.voir', 'profil.modifier',
      'clients.voir', 'clients.modifier', 'clients.exporter',
      'devis.voir', 'devis.exporter', 'devis.imprimer', 'devis.telecharger',
      'ordres.voir', 'ordres.creer', 'ordres.modifier', 'ordres.valider', 'ordres.exporter', 'ordres.imprimer', 'ordres.envoyer', 'ordres.paiement', 'ordres.telecharger', 'ordres.convertir',
      'factures.voir', 'factures.creer', 'factures.modifier', 'factures.valider', 'factures.exporter', 'factures.imprimer', 'factures.envoyer', 'factures.telecharger',
      'paiements.voir', 'paiements.creer', 'paiements.modifier', 'paiements.valider', 'paiements.exporter',
      'caisse.voir', 'caisse.creer', 'caisse.modifier', 'caisse.exporter',
      'banques.voir', 'banques.creer', 'banques.modifier', 'banques.exporter',
      'credits.voir', 'credits.creer', 'credits.modifier', 'credits.exporter',
      'notes.voir', 'notes.creer', 'notes.modifier', 'notes.valider', 'notes.exporter', 'notes.imprimer', 'notes.envoyer', 'notes.paiement', 'notes.telecharger',
      'taxes.voir', 'taxes.modifier', 'taxes.exporter', 'taxes.cloturer',
      'reporting.voir', 'reporting.exporter', 'dashboard.voir',
    ],
  },
  caissier: {
    label: 'Caissier', description: 'Gestion de la caisse et paiements',
    permissions: [
      'profil.voir', 'profil.modifier', 'clients.voir',
      'factures.voir', 'factures.imprimer',
      'paiements.voir', 'paiements.creer', 'paiements.modifier',
      'caisse.voir', 'caisse.creer', 'caisse.modifier',
      'banques.voir', 'dashboard.voir',
    ],
  },
  commercial: {
    label: 'Commercial', description: 'Gestion commerciale et relation client',
    permissions: [
      'profil.voir', 'profil.modifier',
      'clients.voir', 'clients.creer', 'clients.modifier', 'clients.exporter',
      'devis.voir', 'devis.creer', 'devis.modifier', 'devis.dupliquer', 'devis.valider', 'devis.exporter', 'devis.imprimer', 'devis.envoyer', 'devis.convertir', 'devis.telecharger',
      'ordres.voir', 'ordres.creer', 'ordres.modifier', 'ordres.valider', 'ordres.exporter', 'ordres.imprimer', 'ordres.envoyer', 'ordres.paiement', 'ordres.telecharger', 'ordres.convertir',
      'factures.voir', 'factures.modifier', 'factures.exporter', 'factures.imprimer', 'factures.envoyer', 'factures.telecharger',
      'partenaires.voir', 'transitaires.voir', 'transporteurs.voir',
      'reporting.voir', 'dashboard.voir',
    ],
  },
  operateur: {
    label: 'Opérateur', description: 'Suivi des ordres et exécution',
    permissions: [
      'profil.voir', 'profil.modifier', 'clients.voir',
      'ordres.voir', 'ordres.modifier', 'ordres.imprimer', 'ordres.telecharger',
      'factures.voir', 'factures.imprimer',
      'stocks.voir', 'stocks.modifier', 'dashboard.voir',
    ],
  },
};

export type PredefinedRoleName = keyof typeof PREDEFINED_ROLES;
