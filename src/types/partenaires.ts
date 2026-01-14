// Types pour les partenaires (Transitaires, Représentants, Armateurs)
// NOTE: Ces types sont réexportés pour le composant PartenaireDetailContent
// Les types API sont dans src/lib/api/commercial.ts

export type PartenaireType = 'transitaire' | 'representant' | 'armateur';

export interface Prime {
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
  date_paiement?: string;
  created_at?: string;
  updated_at?: string;
  ordre?: { id?: string | number; numero: string };
  facture?: { id?: string | number; numero: string };
  paiements?: PaiementPrime[];
}

// Alias pour compatibilité
export type PrimePartenaire = Prime;

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
  primes?: Prime[];
}

export interface OrdreTravail {
  id: string | number;
  numero: string;
  date?: string;
  date_creation?: string;
  created_at?: string;
  montant_ttc?: number;
  statut: string;
  client?: { id?: string | number; nom: string };
}

export interface Facture {
  id: string | number;
  numero: string;
  date?: string;
  date_facture?: string;
  created_at?: string;
  montant_ttc?: number;
  statut: string;
  client?: { id?: string | number; nom: string };
}

export interface Devis {
  id: string | number;
  numero: string;
  date?: string;
  created_at?: string;
  montant_ttc?: number;
  statut: string;
  client?: { id?: string | number; nom: string };
}

export interface PartenaireBase {
  id: string | number;
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  actif?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Transitaire extends PartenaireBase {
  nif?: string;
  rccm?: string;
  contact_principal?: string;
  primes_dues?: number;
  primes_payees?: number;
  primes?: Prime[];
  paiements_primes?: PaiementPrime[];
  ordres_travail?: OrdreTravail[];
  factures?: Facture[];
  devis?: Devis[];
  counts?: {
    devis?: number;
    ordres?: number;
    factures?: number;
  };
}

export interface Representant extends PartenaireBase {
  taux_commission?: number;
  nom_complet?: string;
  primes_dues?: number;
  primes_payees?: number;
  primes?: Prime[];
  paiements_primes?: PaiementPrime[];
  ordres_travail?: OrdreTravail[];
  factures?: Facture[];
  devis?: Devis[];
  counts?: {
    primes?: number;
    ordres?: number;
    factures?: number;
    devis?: number;
  };
  totaux?: {
    total_primes?: number;
  };
}

export interface Armateur extends PartenaireBase {
  code?: string;
  chiffre_affaires?: number;
  montant_ordres?: number;
  ordres_travail?: OrdreTravail[];
  factures?: Facture[];
  devis?: Devis[];
  counts?: {
    devis?: number;
    ordres?: number;
    factures?: number;
  };
}

// Type union pour tous les partenaires
export type Partenaire = Transitaire | Representant | Armateur;
