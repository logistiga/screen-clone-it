// Types pour les partenaires (Transitaires, Représentants, Armateurs)

export interface PrimePartenaire {
  id: string | number;
  ordre_id?: string | number;
  facture_id?: string | number;
  transitaire_id?: string | number;
  representant_id?: string | number;
  montant: number;
  montant_paye?: number;
  reste_a_payer?: number;
  description?: string;
  statut: string;
  created_at?: string;
  ordre?: { id: string | number; numero: string };
  facture?: { id: string | number; numero: string };
  paiements?: PaiementPrime[];
}

export interface PaiementPrime {
  id: string | number;
  numero_recu?: string;
  transitaire_id?: string | number;
  representant_id?: string | number;
  montant: number;
  date?: string;
  mode_paiement: string;
  reference?: string;
  notes?: string;
  created_at?: string;
  primes?: PrimePartenaire[];
}

export interface Transitaire {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  contact_principal?: string;
  nif?: string;
  rccm?: string;
  created_at?: string;
  actif: boolean;
  primes_dues?: number;
  primes_payees?: number;
  counts?: {
    devis?: number;
    ordres?: number;
    factures?: number;
  };
  devis?: any[];
  ordres_travail?: any[];
  factures?: any[];
  primes?: PrimePartenaire[];
  paiements_primes?: PaiementPrime[];
}

export interface Representant {
  id: string;
  nom: string;
  prenom?: string;
  nom_complet?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  taux_commission?: number;
  created_at?: string;
  actif: boolean;
  primes_dues?: number;
  primes_payees?: number;
  counts?: {
    primes?: number;
    ordres?: number;
    factures?: number;
    devis?: number;
  };
  totaux?: {
    total_primes?: number;
  };
  primes?: PrimePartenaire[];
  paiements_primes?: PaiementPrime[];
  ordres_travail?: any[];
  factures?: any[];
  devis?: any[];
}

export interface Armateur {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  created_at?: string;
  actif: boolean;
}
