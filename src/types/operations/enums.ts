// Énumérations partagées avec l'app Logistiga (spec v1.0 section 5)
// NE PAS MODIFIER sans coordination avec l'équipe Logistiga.

export type LineType = "TRANSPORT" | "LOCATION" | "MANUTENTION" | "AUTRE";

export type OperationStatus =
  | "brouillon"
  | "validee"
  | "en_cours"
  | "terminee"
  | "annulee";

export type TransportType =
  | "conteneur"
  | "plateau"
  | "porte_char"
  | "ac"
  | "benne"
  | "autre";

export type ModeTrajet = "aller_simple" | "aller_retour" | "retour_simple";

export type PaymentMode =
  | "especes"
  | "virement"
  | "cheque"
  | "mobile_money"
  | "autre";

export type OperationChargeSource = "auto_transport" | "manual";

export type BonusKind = "prime" | "commission";
export type BonusBeneficiaryType = "chauffeur" | "responsable" | "autre";
export type BonusSource = "auto" | "manual";

export const LINE_TYPES: LineType[] = ["TRANSPORT", "LOCATION", "MANUTENTION", "AUTRE"];
export const OPERATION_STATUSES: OperationStatus[] = ["brouillon", "validee", "en_cours", "terminee", "annulee"];
export const TRANSPORT_TYPES: TransportType[] = ["conteneur", "plateau", "porte_char", "ac", "benne", "autre"];
export const MODES_TRAJET: ModeTrajet[] = ["aller_simple", "aller_retour", "retour_simple"];
export const PAYMENT_MODES: PaymentMode[] = ["especes", "virement", "cheque", "mobile_money", "autre"];

export const LINE_TYPE_LABELS: Record<LineType, string> = {
  TRANSPORT: "Transport",
  LOCATION: "Location",
  MANUTENTION: "Manutention",
  AUTRE: "Autre",
};

export const OPERATION_STATUS_LABELS: Record<OperationStatus, string> = {
  brouillon: "Brouillon",
  validee: "Validée",
  en_cours: "En cours",
  terminee: "Terminée",
  annulee: "Annulée",
};

export const TRANSPORT_TYPE_LABELS: Record<TransportType, string> = {
  conteneur: "Conteneur",
  plateau: "Plateau",
  porte_char: "Porte-char",
  ac: "AC",
  benne: "Benne",
  autre: "Autre",
};

export const MODE_TRAJET_LABELS: Record<ModeTrajet, string> = {
  aller_simple: "Aller simple",
  aller_retour: "Aller-retour",
  retour_simple: "Retour simple",
};

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  especes: "Espèces",
  virement: "Virement",
  cheque: "Chèque",
  mobile_money: "Mobile Money",
  autre: "Autre",
};
