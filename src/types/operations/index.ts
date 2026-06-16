export * from "./enums";
export * from "./operation";

import type {
  LineType,
  TransportType,
  ModeTrajet,
  OperationChargeSource,
  PaymentMode,
  BonusKind,
  BonusBeneficiaryType,
  BonusSource,
} from "./enums";

// Lignes typées
export interface TransportLine {
  id: string;
  operation_id: string;
  point_depart: string;
  point_arrivee: string;
  destination_id: string | null;
  description_ligne: string | null;
  type_transport: TransportType;
  mode_trajet: ModeTrajet;
  quantite: number;
  prix_transport_fcfa: number;
  total_ligne_fcfa: number;
}

export interface LocationLine {
  id: string;
  operation_id: string;
  location_tariff_id: string | null;
  libelle: string;
  date_debut: string;
  date_fin: string;
  nombre_jours: number;
  prix_jour_fcfa: number;
  description_ligne: string | null;
  total_ligne_fcfa: number;
}

export interface ManutentionLine {
  id: string;
  operation_id: string;
  location_tariff_id: string | null;
  libelle: string;
  description_ligne: string | null;
  quantite: number;
  prix_unitaire_fcfa: number;
  total_ligne_fcfa: number;
}

export interface AutreLine {
  id: string;
  operation_id: string;
  description_ligne: string;
  quantite: number;
  prix_unitaire_fcfa: number;
  total_ligne_fcfa: number;
}

// Pivot
export interface OperationLineEnvelope {
  id: string;
  position: number;
  type: LineType;
  total_ligne_fcfa: number;
  transport: TransportLine | null;
  location: LocationLine | null;
  manutention: ManutentionLine | null;
  autre: AutreLine | null;
}

// Charges / Paiements / Primes
export interface OperationCharge {
  id: string;
  operation_id: string;
  line_position: number;
  line_type: LineType;
  source: OperationChargeSource;
  libelle: string;
  montant_fcfa: number;
  details: string | null;
}

export interface OperationPayment {
  id: string;
  operation_id: string;
  date_paiement: string;
  montant_fcfa: number;
  mode: PaymentMode;
  reference: string | null;
  notes: string | null;
}

export interface OperationBonus {
  id: string;
  operation_id: string;
  line_position: number | null;
  line_type: LineType | null;
  kind: BonusKind;
  beneficiary_type: BonusBeneficiaryType;
  beneficiary_name: string;
  montant_fcfa: number;
  source: BonusSource;
  details: string | null;
  validated_at: string | null;
  validated_by: string | null;
}
