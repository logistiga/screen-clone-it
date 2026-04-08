// Types commerciaux centralisés

export interface Client {
  id: number;
  code: string;
  nom: string;
  type: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  pays: string;
  nif?: string;
  rccm?: string;
  limite_credit: number;
  solde: number;
  solde_avoirs?: number;
  notes?: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Devis {
  id: string;
  numero: string;
  client_id: string;
  client?: Client;
  transitaire_id?: string;
  representant_id?: string;
  armateur_id?: string;
  date: string;
  date_creation: string;
  date_validite: string;
  categorie?: string;
  type_document?: string;
  type_operation?: string;
  type_operation_indep?: string;
  reference_client?: string;
  navire?: string;
  numero_bl?: string;
  bl_numero?: string;
  montant_ht: number;
  montant_tva: number;
  montant_css: number;
  montant_ttc: number;
  tva: number;
  css: number;
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire' | 'converti';
  conditions?: string;
  notes?: string;
  conteneurs?: any[];
  lots?: any[];
  lignes?: any[];
  created_at: string;
  updated_at: string;
}

export interface OrdreTravail {
  id: string;
  numero: string;
  date: string;
  date_creation?: string;
  client_id: string;
  client?: Client;
  devis_id?: string;
  type_document: string;
  categorie?: string;
  type_operation?: string;
  type_operation_indep?: string;
  bl_numero?: string;
  numero_bl?: string;
  navire?: string;
  date_arrivee?: string;
  armateur_id?: string;
  transitaire_id?: string;
  representant_id?: string;
  transitaire?: Transitaire;
  montant_ht: number;
  montant_tva: number;
  montant_css: number;
  montant_ttc: number;
  montant_paye?: number;
  taux_tva?: number;
  taux_css?: number;
  remise_type?: string | null;
  remise_valeur?: number;
  remise_montant?: number;
  exonere_tva?: boolean;
  exonere_css?: boolean;
  motif_exoneration?: string;
  montant_effectif?: number;
  statut: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  conteneurs?: any[];
  lots?: any[];
  lignes?: any[];
  primes?: Prime[];
  facture?: { id: string; numero: string } | null;
  logistiga_synced_at?: string;
}

export interface Facture {
  id: string;
  numero: string;
  date?: string;
  date_facture: string;
  date_creation?: string;
  date_echeance: string;
  client_id: string;
  client?: Client;
  ordre_id?: string;
  type_document: string;
  categorie?: string;
  bl_numero?: string;
  numero_bl?: string;
  navire?: string;
  armateur_id?: string;
  transitaire_id?: string;
  representant_id?: string;
  transitaire?: Transitaire;
  montant_ht: number;
  montant_tva: number;
  montant_css: number;
  montant_ttc: number;
  montant_paye?: number;
  reste_a_payer?: number;
  taux_tva?: number;
  taux_css?: number;
  remise_type?: string | null;
  remise_valeur?: number;
  remise_montant?: number;
  exonere_tva?: boolean;
  exonere_css?: boolean;
  motif_exoneration?: string;
  montant_effectif?: number;
  taxes_selection?: {
    selected_tax_codes: string[];
    has_exoneration: boolean;
    exonerated_tax_codes: string[];
    motif_exoneration: string;
  } | null;
  statut: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  conteneurs?: any[];
  lots?: any[];
  lignes?: any[];
  ordre_travail?: { id: string; numero: string } | null;
  annulation?: { id: number; motif: string; avoir_genere: boolean; numero_avoir?: string; date?: string } | null;
}

export interface Armateur {
  id: string;
  nom: string;
  code?: string;
  type_conteneur?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
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
  actif: boolean;
  created_at?: string;
  updated_at?: string;
  primes_dues?: number;
  primes_payees?: number;
  ordres_travail?: OrdreTravail[];
  factures?: Facture[];
  devis?: Devis[];
  primes?: Prime[];
  paiements_primes?: PaiementPrimeGrouped[];
  counts?: {
    devis: number;
    ordres: number;
    factures: number;
  };
}

export interface Prime {
  id: string;
  ordre_id?: string;
  transitaire_id?: string;
  representant_id?: string;
  facture_id?: string;
  montant: number;
  montant_paye?: number;
  reste_a_payer?: number;
  description?: string;
  statut: string;
  ordre?: OrdreTravail;
  facture?: Facture;
  transitaire?: Transitaire;
  representant?: Representant;
  paiements?: PaiementPrime[];
  created_at?: string;
  updated_at?: string;
}

export interface PaiementPrime {
  id: string;
  prime_id?: string;
  montant: number;
  mode_paiement: string;
  reference?: string;
  date?: string;
  date_paiement?: string;
  notes?: string;
  created_at?: string;
}

export interface PaiementPrimeGrouped {
  id: string;
  transitaire_id?: string;
  representant_id?: string;
  montant: number;
  mode_paiement: string;
  reference?: string;
  date?: string;
  notes?: string;
  created_at?: string;
  primes?: Prime[];
}

export interface Representant {
  id: string;
  nom: string;
  prenom?: string;
  nom_complet?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  zone?: string;
  taux_commission?: number;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
  primes_dues?: number;
  primes_payees?: number;
  primes?: Prime[];
  paiements_primes?: PaiementPrimeGrouped[];
  ordres_travail?: OrdreTravail[];
  factures?: Facture[];
  devis?: Devis[];
  counts?: {
    primes: number;
    primes_sum_montant: number;
    ordres?: number;
    factures?: number;
    devis?: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface Banque {
  id: string;
  nom: string;
  code?: string;
  numero_compte?: string;
  rib?: string;
  iban?: string;
  swift?: string;
  solde?: number;
  actif: boolean;
  paiements_count?: number;
  paiements_sum_montant?: number;
}

export interface MouvementBancaire {
  id: string;
  type: 'entree' | 'sortie';
  date: string;
  montant: number;
  categorie: string;
  description: string | null;
  tiers: string | null;
  banque: { id: string; nom: string } | null;
  reference: string | null;
  source_type: 'paiement' | 'mouvement';
  source_id: number;
  document_type: 'facture' | 'ordre' | null;
  document_id: string | null;
}

export interface MouvementsBancairesResponse {
  data: MouvementBancaire[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  stats: {
    total_encaissements: number;
    total_decaissements: number;
    nombre_encaissements: number;
    nombre_decaissements: number;
    solde_periode: number;
  };
}

export interface MouvementsBancairesParams {
  banque_id?: string;
  type?: 'entree' | 'sortie';
  search?: string;
  date_debut?: string;
  date_fin?: string;
  page?: number;
  per_page?: number;
}

export interface PaiementData {
  facture_id?: string | number;
  ordre_id?: string | number;
  note_debut_id?: string | number;
  montant: number;
  mode_paiement: 'Espèces' | 'Chèque' | 'Virement' | 'Mobile Money';
  reference?: string;
  banque_id?: string | number;
  notes?: string;
  exonere_tva?: boolean;
  exonere_css?: boolean;
  motif_exoneration?: string;
}

export interface Paiement {
  id: string;
  montant: number;
  mode_paiement: string;
  reference?: string;
  numero_cheque?: string;
  date: string;
  date_paiement?: string;
  notes?: string;
  document_numero?: string;
  document_type?: 'facture' | 'ordre';
  facture_id?: string;
  ordre_id?: string;
  client_id?: string;
  banque_id?: string;
  facture?: Facture;
  ordre?: OrdreTravail;
  client?: Client;
  banque?: Banque;
  created_at?: string;
}

export interface PaiementsParams {
  search?: string;
  type?: 'facture' | 'ordre';
  mode_paiement?: string;
  client_id?: string;
  banque_id?: string;
  date_debut?: string;
  date_fin?: string;
  page?: number;
  per_page?: number;
}

export interface MouvementCaisseData {
  type: 'Entrée' | 'Sortie';
  source?: 'caisse' | 'banque';
  montant: number;
  description: string;
  categorie: string;
  banque_id?: string;
  beneficiaire?: string;
}

export interface MouvementCaisse {
  id: string;
  type: string;
  source: string;
  montant: number;
  description: string;
  categorie: string;
  beneficiaire?: string;
  reference?: string;
  date: string;
  banque_id?: string;
  banque?: Banque;
  user?: { id: string; name: string };
  created_at: string;
}

export interface CategorieDepense {
  id: string;
  nom: string;
  description?: string;
  type: 'Entrée' | 'Sortie';
  couleur?: string;
  actif: boolean;
  total_depenses?: number;
  nombre_mouvements?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CategorieDepenseData {
  nom: string;
  description?: string;
  type: 'Entrée' | 'Sortie';
  couleur?: string;
  actif?: boolean;
}

export interface OrdresStats {
  total_ordres: number;
  montant_total: number;
  total_paye: number;
  reste_a_payer: number;
  en_cours: number;
  termine: number;
  facture: number;
  annule: number;
  par_categorie: {
    conteneurs: number;
    conventionnel: number;
    operations_independantes: number;
  };
}

export interface PayerPrimeData {
  montant: number;
  mode_paiement: string;
  reference?: string;
  notes?: string;
}
