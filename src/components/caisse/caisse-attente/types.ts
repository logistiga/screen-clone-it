export interface PrimeEnAttente {
  id: string;
  type: string | null;
  beneficiaire: string | null;
  responsable: string | null;
  montant: number;
  payee: boolean;
  reference_paiement: string | null;
  numero_paiement: string | null;
  paiement_valide: boolean;
  statut: string | null;
  camion_plaque: string | null;
  parc: string | null;
  responsable_nom: string | null;
  prestataire_nom: string | null;
  created_at: string;
  // Champs ajoutés par le backend
  source: 'OPS' | 'CNV' | 'HORSLBV' | 'GARAGE' | 'PRIME_REP' | 'PRIME_TRANS';
  decaisse: boolean;
  refusee: boolean;
  mouvement_id: number | null;
  date_decaissement: string | null;
  mode_paiement_decaissement: string | null;
  // CNV-specific
  conventionne_numero?: string | null;
  numero_parc?: string | null;
  // HORSLBV-specific
  numero_fiche?: string | null;
  numero_depense?: string | null;
  frais_route?: number | null;
  carburant?: number | null;
  logement?: number | null;
  prime_chauffeur?: number | null;
  gasoil_litres?: number | null;
  note?: string | null;
  nombre_primes?: number;
  prime_ids?: string[];
}

export interface StatsResponse {
  total_valide: number;
  nombre_primes: number;
  total_a_decaisser: number;
  nombre_a_decaisser: number;
  deja_decaissees: number;
  total_decaisse: number;
}

export const statutFilterOptions = [
  { value: "all", label: "Toutes les primes payées" },
  { value: "a_decaisser", label: "À décaisser" },
  { value: "decaisse", label: "Déjà décaissées" },
  { value: "refusee", label: "Refusées" },
];

export const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};
