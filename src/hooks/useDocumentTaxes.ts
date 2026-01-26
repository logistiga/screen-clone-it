import { useMemo, useCallback, useRef } from 'react';
import { useTaxesActives } from './use-taxes';
import { TaxeItem, TaxesSelectionData } from '@/components/shared/TaxesSelector';

// Constante stable pour les taxes par défaut (évite les re-renders)
const DEFAULT_TAXES: TaxeItem[] = [
  { code: 'TVA', nom: 'Taxe sur la Valeur Ajoutée', taux: 18, active: true, obligatoire: true },
  { code: 'CSS', nom: 'Contribution Spéciale de Solidarité', taux: 1, active: true, obligatoire: true },
];

// Tableau vide stable
const EMPTY_ARRAY: any[] = [];

/**
 * Hook unifié pour la gestion des taxes dans les documents (OT/Factures)
 * - Charge les taxes actives depuis la table taxes via l'API
 * - Fournit les taux et availableTaxes mémorisés
 * - Fournit des helpers pour la nouvelle structure de données
 */
export function useDocumentTaxes() {
  // Fetch les taxes actives depuis /api/taxes/actives
  const { data: taxesResponse, isLoading, error } = useTaxesActives();
  
  // Extraire le tableau de taxes de la réponse - STABLE
  const taxesList = taxesResponse?.data ?? EMPTY_ARRAY;

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

  // Référence stable pour les taxes générées
  const taxesRef = useRef<TaxeItem[]>(DEFAULT_TAXES);

  // Générer availableTaxes stabilisé pour TaxesSelector
  // Force active: true car on filtre déjà via l'endpoint /taxes/actives
  // Normalise les codes en majuscules pour cohérence
  const availableTaxes = useMemo<TaxeItem[]>(() => {
    if (taxesList.length === 0) {
      // Utiliser la constante stable
      return DEFAULT_TAXES;
    }
    
    const newTaxes = taxesList.map(t => ({
      code: (t.code || '').toUpperCase(),
      nom: t.nom,
      taux: t.taux,
      active: true,
      obligatoire: t.obligatoire ?? (t.code?.toUpperCase() === 'TVA' || t.code?.toUpperCase() === 'CSS'),
    }));
    
    // Comparer avec la ref pour éviter les updates inutiles
    const isSame = newTaxes.length === taxesRef.current.length &&
      newTaxes.every((t, i) => 
        t.code === taxesRef.current[i]?.code &&
        t.taux === taxesRef.current[i]?.taux &&
        t.obligatoire === taxesRef.current[i]?.obligatoire
      );
    
    if (!isSame) {
      taxesRef.current = newTaxes;
    }
    
    return taxesRef.current;
  }, [taxesList]);

  // Codes des taxes obligatoires
  const mandatoryCodes = useMemo(() => {
    return availableTaxes.filter(t => t.obligatoire).map(t => t.code);
  }, [availableTaxes]);

  // Helper pour initialiser TaxesSelectionData (nouveau document)
  const getInitialTaxesSelection = useCallback((): TaxesSelectionData => {
    // Par défaut: sélectionner toutes les taxes obligatoires
    return {
      selectedTaxCodes: mandatoryCodes,
      hasExoneration: false,
      exoneratedTaxCodes: [],
      motifExoneration: '',
    };
  }, [mandatoryCodes]);

  // Helper pour initialiser depuis des données existantes (modification)
  // Compatible avec l'ancien format (exonere_tva, exonere_css) et le nouveau (taxes_selection JSON)
  const getTaxesSelectionFromDocument = useCallback((
    exonereTva: boolean,
    exonereCss: boolean,
   motifExoneration: string,
   taxesSelectionJson?: any
  ): TaxesSelectionData => {
   // Si le JSON taxes_selection existe, l'utiliser en priorité
   if (taxesSelectionJson && typeof taxesSelectionJson === 'object') {
     const selectedCodes = Array.isArray(taxesSelectionJson.selected_tax_codes)
       ? taxesSelectionJson.selected_tax_codes.map((c: string) => c.toUpperCase())
       : [];
     
     const exoneratedCodes = Array.isArray(taxesSelectionJson.exonerated_tax_codes)
       ? taxesSelectionJson.exonerated_tax_codes.map((c: string) => c.toUpperCase())
       : [];
     
     const hasExo = taxesSelectionJson.has_exoneration === true || exoneratedCodes.length > 0;
     const finalSelectedCodes = selectedCodes.length > 0 ? selectedCodes : ['TVA', 'CSS'];
     
     return {
       selectedTaxCodes: finalSelectedCodes,
       hasExoneration: hasExo,
       exoneratedTaxCodes: exoneratedCodes,
       motifExoneration: hasExo ? (taxesSelectionJson.motif_exoneration || motifExoneration || '') : '',
     };
   }
   
    // Taxes sélectionnées par défaut (toutes les obligatoires + celles qui ne sont pas exonérées)
    const selectedCodes = availableTaxes.map(t => t.code);
    
    // Déterminer les taxes exonérées
    const exoneratedCodes: string[] = [];
    if (exonereTva) exoneratedCodes.push('TVA');
    if (exonereCss) exoneratedCodes.push('CSS');
    
    const hasExo = exoneratedCodes.length > 0;
    
    return {
      selectedTaxCodes: selectedCodes,
      hasExoneration: hasExo,
      exoneratedTaxCodes: exoneratedCodes,
      motifExoneration: hasExo ? (motifExoneration || '') : '',
    };
  }, [availableTaxes]);

  // Helper pour calculer les montants de taxes
  const calculateTaxes = useCallback((
    montantHTApresRemise: number,
    taxesSelection: TaxesSelectionData
  ): { tva: number; css: number; totalTaxes: number; details: Record<string, number> } => {
    const { selectedTaxCodes, hasExoneration, exoneratedTaxCodes } = taxesSelection;
    
    const details: Record<string, number> = {};
    let totalTaxes = 0;
    let tva = 0;
    let css = 0;
    
    for (const taxe of availableTaxes) {
      // Taxe non sélectionnée → pas appliquée
      if (!selectedTaxCodes.includes(taxe.code)) {
        details[taxe.code] = 0;
        continue;
      }
      
      // Taxe exonérée → montant = 0
      const isExonerated = hasExoneration && exoneratedTaxCodes.includes(taxe.code);
      const montant = isExonerated ? 0 : Math.round(montantHTApresRemise * (taxe.taux / 100));
      
      details[taxe.code] = montant;
      totalTaxes += montant;
      
      // Mapping pour TVA/CSS (rétrocompatibilité)
      if (taxe.code === 'TVA') tva = montant;
      if (taxe.code === 'CSS') css = montant;
    }
    
    return { tva, css, totalTaxes, details };
  }, [availableTaxes]);

  // Helper pour convertir TaxesSelectionData vers le format API (taxes_selection JSON + legacy flags)
  const toApiPayload = useCallback((selection: TaxesSelectionData): {
    taxes_selection: {
      selected_tax_codes: string[];
      has_exoneration: boolean;
      exonerated_tax_codes: string[];
      motif_exoneration: string | null;
    };
    exonere_tva: boolean;
    exonere_css: boolean;
    motif_exoneration: string | null;
  } => {
    const { selectedTaxCodes, hasExoneration, exoneratedTaxCodes, motifExoneration } = selection;
    
    // TVA non sélectionnée OU exonérée = exonere_tva: true
    const exonereTva = !selectedTaxCodes.includes('TVA') || 
                       (hasExoneration && exoneratedTaxCodes.includes('TVA'));
    
    const exonereCss = !selectedTaxCodes.includes('CSS') || 
                       (hasExoneration && exoneratedTaxCodes.includes('CSS'));
    
    return {
      // Nouvelle structure JSON pour le backend
      taxes_selection: {
        selected_tax_codes: selectedTaxCodes,
        has_exoneration: hasExoneration,
        exonerated_tax_codes: hasExoneration ? exoneratedTaxCodes : [],
        motif_exoneration: hasExoneration && motifExoneration ? motifExoneration : null,
      },
      // Legacy flags pour rétrocompatibilité
      exonere_tva: exonereTva,
      exonere_css: exonereCss,
      motif_exoneration: hasExoneration && motifExoneration ? motifExoneration : null,
    };
  }, []);

  return {
    // Données
    taxRates,
    availableTaxes,
    mandatoryCodes,
    isLoading,
    error,
    
    // Helpers
    getInitialTaxesSelection,
    getTaxesSelectionFromDocument,
    calculateTaxes,
    toApiPayload,
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
  if (a.hasExoneration !== b.hasExoneration) return false;
  if (a.motifExoneration !== b.motifExoneration) return false;
  
  // Comparer selectedTaxCodes
  const aSelected = [...a.selectedTaxCodes].sort();
  const bSelected = [...b.selectedTaxCodes].sort();
  if (aSelected.length !== bSelected.length) return false;
  if (!aSelected.every((code, i) => code === bSelected[i])) return false;
  
  // Comparer exoneratedTaxCodes
  const aExo = [...a.exoneratedTaxCodes].sort();
  const bExo = [...b.exoneratedTaxCodes].sort();
  if (aExo.length !== bExo.length) return false;
  if (!aExo.every((code, i) => code === bExo[i])) return false;
  
  return true;
}
