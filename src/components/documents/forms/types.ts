/**
 * Types unifiés pour les formulaires Devis / Ordre / Facture.
 * Permet de mutualiser les composants en gardant une typologie distincte
 * par catégorie de document.
 */

export type DocumentType = "devis" | "ordre" | "facture";

/** Ligne d'un devis : utilise les clés snake_case + champ `unite`. */
export interface LigneDevis {
  id: string;
  designation: string;
  unite: string;
  quantite: number;
  prix_unitaire: number;
  montant: number;
}

/** Ligne d'un ordre de travail. */
export interface LigneOrdre {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  montantHT: number;
}

/** Ligne d'une facture (identique structurellement à l'ordre). */
export interface LigneFacture {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  montantHT: number;
}

export type DocumentLigne = LigneDevis | LigneOrdre | LigneFacture;
