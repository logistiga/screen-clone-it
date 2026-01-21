import { useMemo, useCallback } from 'react';
import { useTaxesActives } from './use-taxes';
import { TaxeItem, TaxesSelectionData } from '@/components/shared/TaxesSelector';

/**
 * Hook unifié pour la gestion des taxes dans les documents (OT/Factures)
 * - Charge les taxes actives depuis la table taxes via l'API
 * - Fournit les taux et availableTaxes mémorisés
 * - Fournit un helper pour créer des handlers onChange stables
 */
export function useDocumentTaxes() {
  // Fetch les taxes actives depuis /api/taxes/actives
  const { data: taxesResponse, isLoading, error } = useTaxesActives();
  
  // Extraire le tableau de taxes de la réponse
  const taxesList = taxesResponse?.data ?? [];

  // Calculer les taux depuis les taxes actives
  const taxRates = useMemo(() => {
    const tvaRate = taxesList.find(t => t.code?.toUpperCase() === 'TVA')?.taux ?? 18;
    const cssRate = taxesList.find(t => t.code?.toUpperCase() === 'CSS')?.taux ?? 1;
    return {
      TVA: tvaRate,
      CSS: cssRate,
      TAUX_TVA: tvaRate / 100,
      TAUX_CSS: cssRate / 100,
    };
  }, [taxesList]);

  // Générer availableTaxes stabilisé pour TaxesSelector
  const availableTaxes = useMemo<TaxeItem[]>(() => {
    if (taxesList.length === 0) {
      // Valeurs par défaut si aucune taxe configurée
      return [
        { code: 'TVA', nom: 'Taxe sur la Valeur Ajoutée', taux: 18, active: true, obligatoire: true },
        { code: 'CSS', nom: 'Contribution Spéciale de Solidarité', taux: 1, active: true, obligatoire: true },
      ];
    }
    
    return taxesList
      .filter(t => t.active)
      .map(t => ({
        code: t.code,
        nom: t.nom,
        taux: t.taux,
        active: true,
        obligatoire: t.obligatoire ?? false,
      }));
  }, [taxesList]);

  // Helper pour initialiser taxesSelectionData
  const getInitialTaxesSelection = useCallback((): TaxesSelectionData => {
    return {
      taxesAppliquees: availableTaxes,
      exonere: false,
      motifExoneration: '',
    };
  }, [availableTaxes]);

  // Helper pour initialiser depuis des données existantes (modification)
  const getTaxesSelectionFromDocument = useCallback((
    exonereTva: boolean,
    exonereCss: boolean,
    motifExoneration: string
  ): TaxesSelectionData => {
    const isFullyExempt = exonereTva && exonereCss;
    
    if (isFullyExempt) {
      return {
        taxesAppliquees: [],
        exonere: true,
        motifExoneration: motifExoneration || '',
      };
    }
    
    return {
      taxesAppliquees: availableTaxes.filter(t => 
        (t.code === 'TVA' && !exonereTva) || 
        (t.code === 'CSS' && !exonereCss)
      ),
      exonere: false,
      motifExoneration: '',
    };
  }, [availableTaxes]);

  // Helper pour calculer les montants de taxes
  const calculateTaxes = useCallback((
    montantHTApresRemise: number,
    taxesSelection: TaxesSelectionData
  ) => {
    if (taxesSelection.exonere) {
      return { tva: 0, css: 0, totalTaxes: 0 };
    }
    
    const tvaAppliquee = taxesSelection.taxesAppliquees.find(t => t.code === 'TVA');
    const cssAppliquee = taxesSelection.taxesAppliquees.find(t => t.code === 'CSS');
    
    const tva = tvaAppliquee ? Math.round(montantHTApresRemise * (tvaAppliquee.taux / 100)) : 0;
    const css = cssAppliquee ? Math.round(montantHTApresRemise * (cssAppliquee.taux / 100)) : 0;
    
    return { tva, css, totalTaxes: tva + css };
  }, []);

  return {
    // Données
    taxRates,
    availableTaxes,
    isLoading,
    error,
    
    // Helpers
    getInitialTaxesSelection,
    getTaxesSelectionFromDocument,
    calculateTaxes,
  };
}

/**
 * Utilitaire pour comparer deux TaxesSelectionData
 * Utilisé pour éviter les updates inutiles
 */
export function areTaxesSelectionDataEqual(
  a: TaxesSelectionData,
  b: TaxesSelectionData
): boolean {
  if (a.exonere !== b.exonere) return false;
  if (a.motifExoneration !== b.motifExoneration) return false;
  if (a.taxesAppliquees.length !== b.taxesAppliquees.length) return false;
  
  const aCodes = a.taxesAppliquees.map(t => t.code).sort();
  const bCodes = b.taxesAppliquees.map(t => t.code).sort();
  
  return aCodes.every((code, i) => code === bCodes[i]);
}
