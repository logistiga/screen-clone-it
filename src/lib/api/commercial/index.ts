// Barrel file - re-exports everything for backward compatibility
// All imports from '@/lib/api/commercial' continue to work

export * from './types';
export { clientsApi, devisApi, ordresApi, facturesApi } from './documents-api';
export { armateursApi, transitairesApi, representantsApi } from './partners-api';
export { banquesApi, paiementsApi, mouvementsCaisseApi, configurationApi, categoriesDepensesApi, primesApi } from './finance-api';
