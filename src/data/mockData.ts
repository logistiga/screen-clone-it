// Données de démonstration pour Lojistiga

export interface Client {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  rccm?: string;
  nif?: string;
  dateCreation: string;
  solde: number;
}

export interface LigneDocument {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  montantHT: number;
}

export interface Devis {
  id: string;
  numero: string;
  clientId: string;
  client?: Client;
  dateCreation: string;
  dateValidite: string;
  lignes: LigneDocument[];
  montantHT: number;
  tva: number;
  css: number;
  montantTTC: number;
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire';
  notes?: string;
}

export interface OrdreTravail {
  id: string;
  numero: string;
  devisId?: string;
  clientId: string;
  client?: Client;
  dateCreation: string;
  typeOperation: 'conteneurs' | 'conventionnel' | 'location' | 'transport' | 'manutention' | 'stockage';
  lignes: LigneDocument[];
  montantHT: number;
  tva: number;
  css: number;
  montantTTC: number;
  montantPaye: number;
  statut: 'en_cours' | 'termine' | 'facture' | 'annule';
  notes?: string;
}

export interface Facture {
  id: string;
  numero: string;
  ordreId?: string;
  clientId: string;
  client?: Client;
  dateCreation: string;
  dateEcheance: string;
  lignes: LigneDocument[];
  montantHT: number;
  tva: number;
  css: number;
  montantTTC: number;
  montantPaye: number;
  statut: 'emise' | 'payee' | 'partielle' | 'impayee' | 'annulee';
  notes?: string;
}

export interface Paiement {
  id: string;
  factureId?: string;
  ordreId?: string;
  clientId: string;
  montant: number;
  date: string;
  modePaiement: 'especes' | 'virement' | 'cheque';
  reference?: string;
  banqueId?: string;
  numeroCheque?: string;
  notes?: string;
}

export interface Annulation {
  id: string;
  numero: string;
  type: 'devis' | 'ordre' | 'facture';
  documentId: string;
  documentNumero: string;
  clientId: string;
  montant: number;
  date: string;
  motif: string;
  avoirGenere: boolean;
}

export interface Banque {
  id: string;
  nom: string;
  numeroCompte: string;
  rib?: string;
  iban?: string;
  swift?: string;
  solde: number;
  actif: boolean;
}

export interface MouvementCaisse {
  id: string;
  type: 'entree' | 'sortie';
  montant: number;
  date: string;
  description: string;
  paiementId?: string;
  source: 'caisse' | 'banque';
  banqueId?: string;
}

export interface Utilisateur {
  id: string;
  nom: string;
  email: string;
  telephone?: string;
  photo?: string;
  roleId: string;
  actif: boolean;
  dateCreation: string;
  derniereConnexion?: string;
}

export interface Role {
  id: string;
  nom: string;
  description: string;
  permissions: Permission[];
}

export interface Permission {
  module: string;
  action: string;
  autorise: boolean;
}

export interface ActionAudit {
  id: string;
  utilisateurId: string;
  utilisateur?: Utilisateur;
  action: string;
  module: string;
  documentType?: string;
  documentId?: string;
  documentNumero?: string;
  details: string;
  date: string;
  ip?: string;
}

// Interface pour les crédits bancaires
export interface CreditBancaire {
  id: string;
  numero: string;
  banqueId: string;
  banque?: Banque;
  montantEmprunte: number;
  tauxInteret: number; // en pourcentage annuel
  dureeEnMois: number;
  dateDebut: string;
  dateFin: string;
  mensualite: number;
  totalInterets: number;
  montantRembourse: number;
  statut: 'actif' | 'termine' | 'en_retard';
  objet: string;
  notes?: string;
}

export interface EcheanceCredit {
  id: string;
  creditId: string;
  numero: number;
  dateEcheance: string;
  montantCapital: number;
  montantInteret: number;
  montantTotal: number;
  montantPaye: number;
  datePaiement?: string;
  statut: 'a_payer' | 'payee' | 'en_retard';
}

export interface RemboursementCredit {
  id: string;
  creditId: string;
  echeanceId: string;
  montant: number;
  date: string;
  banqueId: string;
  reference?: string;
  notes?: string;
}

// Interface pour les modifications/révisions de crédit
export interface ModificationCredit {
  id: string;
  creditId: string;
  type: 'taux' | 'echeance' | 'report' | 'renegociation' | 'cloture_anticipee';
  dateModification: string;
  ancienneValeur: string;
  nouvelleValeur: string;
  motif: string;
  utilisateurId: string;
  documentRef?: string;
}

// Interface pour les prévisions d'investissement
export interface PrevisionInvestissement {
  id: string;
  titre: string;
  description: string;
  montantEstime: number;
  banqueEnvisagee?: string;
  tauxEstime?: number;
  dureeEstimee?: number;
  dateCreation: string;
  dateObjectif?: string;
  priorite: 'haute' | 'moyenne' | 'basse';
  statut: 'en_attente' | 'en_cours' | 'approuve' | 'refuse' | 'realise';
  notes?: string;
}

// Interface pour les documents versionnés
export interface DocumentCredit {
  id: string;
  creditId: string;
  type: 'contrat' | 'avenant' | 'courrier' | 'echeancier' | 'autre';
  nom: string;
  version: number;
  dateUpload: string;
  utilisateurId: string;
  taille?: string;
}

// Interface pour les alertes crédit
export interface AlerteCredit {
  id: string;
  creditId?: string;
  type: 'echeance' | 'retard' | 'modification' | 'document' | 'rappel';
  titre: string;
  message: string;
  dateCreation: string;
  dateLue?: string;
  priorite: 'haute' | 'moyenne' | 'basse';
  lu: boolean;
}

// Données de démonstration
export const clients: Client[] = [
  {
    id: "cli-001",
    nom: "SARL Transports Cameroun",
    email: "contact@transports-cmr.com",
    telephone: "+237 699 123 456",
    adresse: "123 Boulevard de la Liberté",
    ville: "Douala",
    rccm: "RC/DLA/2020/B/1234",
    nif: "M012345678901X",
    dateCreation: "2024-01-15",
    solde: 2500000
  },
  {
    id: "cli-002",
    nom: "Import Export Global SA",
    email: "info@ieg-sa.com",
    telephone: "+237 677 234 567",
    adresse: "45 Rue du Commerce",
    ville: "Yaoundé",
    rccm: "RC/YDE/2019/A/5678",
    nif: "M098765432109Y",
    dateCreation: "2023-06-20",
    solde: 0
  },
  {
    id: "cli-003",
    nom: "NGOMBA Industries",
    email: "direction@ngomba.cm",
    telephone: "+237 655 345 678",
    adresse: "Zone Industrielle Bassa",
    ville: "Douala",
    rccm: "RC/DLA/2018/B/9012",
    nif: "M567890123456Z",
    dateCreation: "2022-03-10",
    solde: 1750000
  },
  {
    id: "cli-004",
    nom: "Maison ATANGANA & Fils",
    email: "contact@atangana-fils.com",
    telephone: "+237 699 456 789",
    adresse: "78 Avenue Kennedy",
    ville: "Yaoundé",
    rccm: "RC/YDE/2021/C/3456",
    nif: "M234567890123W",
    dateCreation: "2024-02-28",
    solde: 500000
  },
  {
    id: "cli-005",
    nom: "Congo Shipping Lines",
    email: "operations@congoshipping.cd",
    telephone: "+243 81 234 5678",
    adresse: "Port de Matadi",
    ville: "Kinshasa",
    dateCreation: "2023-09-05",
    solde: 0
  },
  {
    id: "cli-006",
    nom: "MBARGA Trading Company",
    email: "mbarga.trading@gmail.com",
    telephone: "+237 677 567 890",
    adresse: "15 Rue de l'Aéroport",
    ville: "Douala",
    rccm: "RC/DLA/2022/A/7890",
    nif: "M890123456789V",
    dateCreation: "2023-11-12",
    solde: 3200000
  }
];

export const devis: Devis[] = [];

export const ordresTravail: OrdreTravail[] = [];

export const factures: Facture[] = [];

export const paiements: Paiement[] = [];

export const banques: Banque[] = [];

export const mouvementsCaisse: MouvementCaisse[] = [];

export const utilisateurs: Utilisateur[] = [];

export const roles: Role[] = [
  {
    id: '1',
    nom: 'Administrateur',
    description: 'Accès complet à toutes les fonctionnalités',
    permissions: [
      { module: 'clients', action: 'lecture', autorise: true },
      { module: 'clients', action: 'ecriture', autorise: true },
      { module: 'clients', action: 'suppression', autorise: true },
      { module: 'factures', action: 'lecture', autorise: true },
      { module: 'factures', action: 'ecriture', autorise: true },
      { module: 'factures', action: 'suppression', autorise: true },
      { module: 'caisse', action: 'lecture', autorise: true },
      { module: 'caisse', action: 'ecriture', autorise: true },
      { module: 'parametres', action: 'lecture', autorise: true },
      { module: 'parametres', action: 'ecriture', autorise: true }
    ]
  }
];

export const actionsAudit: ActionAudit[] = [];

export const annulations: Annulation[] = [];

// Données pour les crédits bancaires
export const creditsBancaires: CreditBancaire[] = [];

export const echeancesCredits: EcheanceCredit[] = [];

export const remboursementsCredits: RemboursementCredit[] = [];

// Modifications de crédit (historique des révisions)
export const modificationsCredits: ModificationCredit[] = [];

// Prévisions d'investissement / projets en attente
export const previsionsInvestissements: PrevisionInvestissement[] = [];

// Documents versionnés des crédits
export const documentsCredits: DocumentCredit[] = [];

// Alertes crédit
export const alertesCredits: AlerteCredit[] = [];

// Configuration des taux
export const TAUX_TVA = 0.18; // 18%
export const TAUX_CSS = 0.01; // 1%

// Configuration de la numérotation
export const configurationNumerotation = {
  prefixeDevis: 'DEV',
  prefixeOrdre: 'OT',
  prefixeFacture: 'FAC',
  prefixeAvoir: 'AV',
  formatAnnee: true,
  prochainNumeroDevis: 4,
  prochainNumeroOrdre: 5,
  prochainNumeroFacture: 6,
  prochainNumeroAvoir: 1
};

// Configuration des taxes
export const configurationTaxes = {
  tvaRate: 18,
  cssRate: 1,
  tva: { nom: 'TVA', taux: 18, actif: true },
  css: { nom: 'CSS', taux: 1, actif: true }
};

// Fonctions utilitaires
export const formatMontant = (montant: number): string => {
  return montant.toLocaleString('fr-FR') + ' FCFA';
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('fr-FR');
};

export const getStatutLabel = (statut: string): string => {
  const labels: Record<string, string> = {
    brouillon: 'Brouillon',
    envoye: 'Envoyé',
    accepte: 'Accepté',
    refuse: 'Refusé',
    expire: 'Expiré',
    en_cours: 'En cours',
    termine: 'Terminé',
    facture: 'Facturé',
    annule: 'Annulé',
    emise: 'Émise',
    payee: 'Payée',
    partielle: 'Partielle',
    impayee: 'Impayée',
    annulee: 'Annulée',
    actif: 'Actif',
    inactif: 'Inactif'
  };
  return labels[statut] || statut;
};
