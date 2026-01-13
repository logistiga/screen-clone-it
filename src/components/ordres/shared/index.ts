// Shared components for Ordres de Travail
export { OrdreStepper } from './OrdreStepper';
export { OrdrePreview } from './OrdrePreview';
export { OrdreStatCard } from './OrdreStatCard';

// New refactored components
export { OrdreHeader } from './OrdreHeader';
export { OrdreClientCard } from './OrdreClientCard';
export { OrdreFinancialCard } from './OrdreFinancialCard';
export { OrdreBLCard } from './OrdreBLCard';
export { OrdrePrestationsTable } from './OrdrePrestationsTable';
export { OrdreConteneursTable } from './OrdreConteneursTable';
export { OrdreLotsTable } from './OrdreLotsTable';
export { OrdrePrimesTable } from './OrdrePrimesTable';
export { OrdreNotesCard } from './OrdreNotesCard';
export { OrdreHistorique } from './OrdreHistorique';

// Config exports
export * from './ordreTypeConfigs';

// Re-export devis shared components that can be reused
export { 
  CategorieSelector,
  ClientInfoCard,
  TotauxCard,
  NotesCard,
  RecapitulatifCard,
} from '@/components/devis/shared';
