// Types pour le module reporting

export interface ChiffreAffairesData {
  annee: number;
  mois: number | null;
  mensuel: {
    mois: number;
    label: string;
    total_ht: number;
    total_tva: number;
    total_css: number;
    total_ttc: number;
    nb_factures: number;
  }[];
  total_annuel: {
    total_ht: number;
    total_tva: number;
    total_css: number;
    total_ttc: number;
    nb_factures: number;
  };
}

export interface RentabiliteData {
  annee: number;
  chiffre_affaires: number;
  charges_exploitation: number;
  charges_financieres: number;
  commissions: number;
  marge_brute: number;
  resultat_net: number;
  taux_marge: number;
  mensuel: {
    mois: number;
    label: string;
    ca: number;
    charges: number;
    marge: number;
  }[];
}

export interface CreancesData {
  total_creances: number;
  nb_factures_impayees: number;
  age_moyen: number;
  par_tranche: {
    tranche: string;
    montant: number;
    nb_factures: number;
  }[];
  top_debiteurs: {
    client_id: number;
    client_nom: string;
    montant_du: number;
    nb_factures: number;
    plus_ancienne: string;
  }[];
}

export interface TresorerieData {
  date_debut: string;
  date_fin: string;
  solde_initial: number;
  solde_final: number;
  total_entrees: number;
  total_sorties: number;
  mouvements_quotidiens: {
    date: string;
    entrees: number;
    sorties: number;
    solde: number;
  }[];
  par_categorie: {
    categorie: string;
    entrees: number;
    sorties: number;
  }[];
}

export interface ComparatifData {
  annee1: number;
  annee2: number;
  ca_annee1: number;
  ca_annee2: number;
  variation_ca: number;
  nb_factures_annee1: number;
  nb_factures_annee2: number;
  variation_factures: number;
  nb_clients_annee1: number;
  nb_clients_annee2: number;
  variation_clients: number;
}

export interface ActiviteClientsData {
  date_debut: string;
  date_fin: string;
  total_clients: number;
  clients_actifs: number;
  top_clients: {
    client_id: number;
    client_nom: string;
    ca_total: number;
    nb_factures: number;
    paiements: number;
    solde_du: number;
  }[];
}

export interface StatistiquesDocumentsData {
  annee: number;
  devis: {
    total: number;
    brouillon: number;
    envoye: number;
    accepte: number;
    refuse: number;
    expire: number;
    taux_conversion: number;
  };
  ordres: {
    total: number;
    en_cours: number;
    termine: number;
    facture: number;
    taux_facturation: number;
  };
  factures: {
    total: number;
    brouillon: number;
    validee: number;
    partiellement_payee: number;
    payee: number;
    annulee: number;
    taux_recouvrement: number;
  };
}

export interface TableauDeBordData {
  annee: number;
  kpis: {
    ca_total: number;
    ca_mois_courant: number;
    creances_totales: number;
    taux_recouvrement: number;
    nb_factures: number;
    nb_ordres: number;
    nb_devis: number;
    nb_clients: number;
  };
  evolution_mensuelle: {
    mois: string;
    ca: number;
    encaissements: number;
  }[];
  alertes: {
    type: string;
    message: string;
    count: number;
  }[];
}

export type ExportType = 
  | 'factures' | 'devis' | 'ordres-travail' | 'paiements' | 'caisse' 
  | 'clients' | 'primes' | 'chiffre-affaires' | 'creances' | 'tresorerie' 
  | 'credits' | 'annulations' | 'activite-globale' | 'tableau-de-bord';

export interface ExportFilters {
  date_debut?: string;
  date_fin?: string;
  statut?: string;
  client_id?: string;
  mode_paiement?: string;
  type?: string;
  categorie?: string;
  banque_id?: string;
  representant_id?: string;
  annee?: number;
  actif?: boolean;
}
