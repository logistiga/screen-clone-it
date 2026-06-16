import type { LineType, OperationStatus } from "./enums";

export interface Operation {
  id: string;
  numero_operation: string;
  date_operation: string;

  external_client_id: string;
  snapshot_client_name: string;

  type_marchandise: string | null;
  description_generale: string | null;
  observation_interne: string | null;

  total_transport_fcfa: number;

  statut: OperationStatus;
  charges_validated_at: string | null;
  charges_validated_by: string | null;

  facture_id: string | null;
  facture_numero: string | null;

  lines_count: number;
  types_used: LineType[];

  created_at: string;
  updated_at: string;
}
