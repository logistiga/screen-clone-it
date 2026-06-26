import type { DocumentType } from "./types";

export interface LignesFormConfig {
  cardTitle: string;
  descriptionLabel: string;
  descriptionField: string;
  amountLabel: string;
  amountField: string;
  hasUnite: boolean;
  useDecimalInput: boolean;
  /** Si true le champ description occupe toute la largeur (layout vertical). */
  fullWidthDescription: boolean;
}

export const LIGNES_CONFIG: Record<DocumentType, LignesFormConfig> = {
  devis: {
    cardTitle: "Lignes du devis",
    descriptionLabel: "Désignation *",
    descriptionField: "designation",
    amountLabel: "Montant",
    amountField: "montant",
    hasUnite: false, // unite existe sur LigneDevis mais n'était pas rendu côté UI
    useDecimalInput: false,
    fullWidthDescription: true,
  },
  ordre: {
    cardTitle: "Lignes de l'ordre",
    descriptionLabel: "Description *",
    descriptionField: "description",
    amountLabel: "Montant HT",
    amountField: "montantHT",
    hasUnite: false,
    useDecimalInput: true,
    fullWidthDescription: false,
  },
  facture: {
    cardTitle: "Lignes de facture",
    descriptionLabel: "Description *",
    descriptionField: "description",
    amountLabel: "Montant HT",
    amountField: "montantHT",
    hasUnite: false,
    useDecimalInput: false,
    fullWidthDescription: true,
  },
};
