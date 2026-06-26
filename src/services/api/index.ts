/**
 * Couche services API centralisée.
 * Toute communication réseau depuis les composants/pages/hooks doit passer par ici.
 * NE PAS importer @/lib/api directement depuis l'UI.
 */
export * from './auth.api';
export * from './network.api';
export * from './sync.api';
export * from './detentions.api';
export * from './caisse.api';
export * from './export.api';
export * from './paiements-fournisseurs.api';
