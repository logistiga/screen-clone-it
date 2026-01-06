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

// Données mock
export const clients: Client[] = [
  {
    id: '1',
    nom: 'TOTAL GABON',
    email: 'contact@total-gabon.ga',
    telephone: '+241 01 79 20 00',
    adresse: 'Boulevard du Bord de Mer',
    ville: 'Libreville',
    rccm: 'LBV-2020-B-12345',
    nif: '123456789',
    dateCreation: '2024-01-15',
    solde: 15750000
  },
  {
    id: '2',
    nom: 'COMILOG',
    email: 'logistique@comilog.ga',
    telephone: '+241 01 76 30 00',
    adresse: 'Zone Industrielle Oloumi',
    ville: 'Libreville',
    rccm: 'LBV-2019-B-54321',
    nif: '987654321',
    dateCreation: '2024-02-20',
    solde: 8250000
  },
  {
    id: '3',
    nom: 'OLAM GABON',
    email: 'operations@olam-gabon.com',
    telephone: '+241 01 44 50 00',
    adresse: 'Port d\'Owendo',
    ville: 'Owendo',
    rccm: 'LBV-2018-B-11111',
    nif: '111222333',
    dateCreation: '2024-03-10',
    solde: 0
  },
  {
    id: '4',
    nom: 'SETRAG',
    email: 'transport@setrag.ga',
    telephone: '+241 01 70 25 00',
    adresse: 'Gare de Owendo',
    ville: 'Owendo',
    rccm: 'LBV-2021-B-22222',
    nif: '444555666',
    dateCreation: '2024-04-05',
    solde: 3500000
  },
  {
    id: '5',
    nom: 'MAUREL & PROM',
    email: 'supply@maureletprom.ga',
    telephone: '+241 01 74 10 00',
    adresse: 'Immeuble Concorde',
    ville: 'Libreville',
    rccm: 'LBV-2020-B-33333',
    nif: '777888999',
    dateCreation: '2024-05-12',
    solde: 22000000
  },
  {
    id: '6',
    nom: 'ASSALA ENERGY',
    email: 'logistics@assala.ga',
    telephone: '+241 01 79 50 00',
    adresse: 'Centre Ville',
    ville: 'Port-Gentil',
    rccm: 'PG-2019-B-44444',
    nif: '101010101',
    dateCreation: '2024-06-18',
    solde: 5800000
  },
  {
    id: '7',
    nom: 'GSEZ',
    email: 'operations@gsez.ga',
    telephone: '+241 01 44 80 00',
    adresse: 'Zone Économique Spéciale',
    ville: 'Nkok',
    rccm: 'LBV-2017-B-55555',
    nif: '121212121',
    dateCreation: '2024-07-22',
    solde: 0
  },
  {
    id: '8',
    nom: 'PERENCO GABON',
    email: 'supply.chain@perenco.ga',
    telephone: '+241 01 55 20 00',
    adresse: 'Base Industrielle',
    ville: 'Port-Gentil',
    rccm: 'PG-2018-B-66666',
    nif: '131313131',
    dateCreation: '2024-08-30',
    solde: 18500000
  }
];

export const devis: Devis[] = [
  {
    id: '1',
    numero: 'DEV-2026-0001',
    clientId: '1',
    dateCreation: '2026-01-02',
    dateValidite: '2026-02-02',
    lignes: [
      { id: '1', description: 'Transport conteneur 40\' Libreville - Owendo', quantite: 2, prixUnitaire: 350000, montantHT: 700000 },
      { id: '2', description: 'Manutention portuaire', quantite: 2, prixUnitaire: 150000, montantHT: 300000 }
    ],
    montantHT: 1000000,
    tva: 180000,
    css: 10000,
    montantTTC: 1190000,
    statut: 'envoye'
  },
  {
    id: '2',
    numero: 'DEV-2026-0002',
    clientId: '2',
    dateCreation: '2026-01-03',
    dateValidite: '2026-02-03',
    lignes: [
      { id: '1', description: 'Stockage 30 jours - Entrepôt A', quantite: 1, prixUnitaire: 500000, montantHT: 500000 }
    ],
    montantHT: 500000,
    tva: 90000,
    css: 5000,
    montantTTC: 595000,
    statut: 'accepte'
  },
  {
    id: '3',
    numero: 'DEV-2026-0003',
    clientId: '5',
    dateCreation: '2026-01-04',
    dateValidite: '2026-02-04',
    lignes: [
      { id: '1', description: 'Location camion plateau - 7 jours', quantite: 7, prixUnitaire: 150000, montantHT: 1050000 },
      { id: '2', description: 'Chauffeur', quantite: 7, prixUnitaire: 50000, montantHT: 350000 }
    ],
    montantHT: 1400000,
    tva: 252000,
    css: 14000,
    montantTTC: 1666000,
    statut: 'brouillon'
  }
];

export const ordresTravail: OrdreTravail[] = [
  {
    id: '1',
    numero: 'OT-2026-0001',
    clientId: '1',
    dateCreation: '2026-01-02',
    typeOperation: 'conteneurs',
    lignes: [
      { id: '1', description: 'Transport conteneur 20\' Owendo - Libreville', quantite: 3, prixUnitaire: 250000, montantHT: 750000 },
      { id: '2', description: 'Déchargement', quantite: 3, prixUnitaire: 100000, montantHT: 300000 }
    ],
    montantHT: 1050000,
    tva: 189000,
    css: 10500,
    montantTTC: 1249500,
    montantPaye: 1249500,
    statut: 'facture'
  },
  {
    id: '2',
    numero: 'OT-2026-0002',
    clientId: '4',
    dateCreation: '2026-01-03',
    typeOperation: 'manutention',
    lignes: [
      { id: '1', description: 'Manutention marchandises diverses', quantite: 10, prixUnitaire: 75000, montantHT: 750000 }
    ],
    montantHT: 750000,
    tva: 135000,
    css: 7500,
    montantTTC: 892500,
    montantPaye: 500000,
    statut: 'en_cours'
  },
  {
    id: '3',
    numero: 'OT-2026-0003',
    clientId: '6',
    dateCreation: '2026-01-04',
    typeOperation: 'transport',
    lignes: [
      { id: '1', description: 'Transport équipements Port-Gentil - Libreville', quantite: 1, prixUnitaire: 2500000, montantHT: 2500000 }
    ],
    montantHT: 2500000,
    tva: 450000,
    css: 25000,
    montantTTC: 2975000,
    montantPaye: 0,
    statut: 'en_cours'
  },
  {
    id: '4',
    numero: 'OT-2026-0004',
    clientId: '8',
    dateCreation: '2026-01-05',
    typeOperation: 'stockage',
    lignes: [
      { id: '1', description: 'Stockage matériel - Entrepôt sécurisé', quantite: 30, prixUnitaire: 50000, montantHT: 1500000 }
    ],
    montantHT: 1500000,
    tva: 270000,
    css: 15000,
    montantTTC: 1785000,
    montantPaye: 1785000,
    statut: 'termine'
  }
];

export const factures: Facture[] = [
  {
    id: '1',
    numero: 'FAC-2026-0001',
    ordreId: '1',
    clientId: '1',
    dateCreation: '2026-01-03',
    dateEcheance: '2026-02-03',
    lignes: [
      { id: '1', description: 'Transport conteneur 20\' Owendo - Libreville', quantite: 3, prixUnitaire: 250000, montantHT: 750000 },
      { id: '2', description: 'Déchargement', quantite: 3, prixUnitaire: 100000, montantHT: 300000 }
    ],
    montantHT: 1050000,
    tva: 189000,
    css: 10500,
    montantTTC: 1249500,
    montantPaye: 1249500,
    statut: 'payee'
  },
  {
    id: '2',
    numero: 'FAC-2026-0002',
    clientId: '2',
    dateCreation: '2026-01-04',
    dateEcheance: '2026-02-04',
    lignes: [
      { id: '1', description: 'Stockage mensuel - Zone A', quantite: 1, prixUnitaire: 800000, montantHT: 800000 }
    ],
    montantHT: 800000,
    tva: 144000,
    css: 8000,
    montantTTC: 952000,
    montantPaye: 500000,
    statut: 'partielle'
  },
  {
    id: '3',
    numero: 'FAC-2026-0003',
    clientId: '5',
    dateCreation: '2026-01-05',
    dateEcheance: '2026-02-05',
    lignes: [
      { id: '1', description: 'Transport marchandises - Lot 1', quantite: 5, prixUnitaire: 400000, montantHT: 2000000 }
    ],
    montantHT: 2000000,
    tva: 360000,
    css: 20000,
    montantTTC: 2380000,
    montantPaye: 0,
    statut: 'impayee'
  }
];

export const paiements: Paiement[] = [
  {
    id: '1',
    factureId: '1',
    clientId: '1',
    montant: 1249500,
    date: '2026-01-05',
    modePaiement: 'virement',
    reference: 'VIR-2026-001',
    banqueId: '1'
  },
  {
    id: '2',
    factureId: '2',
    clientId: '2',
    montant: 500000,
    date: '2026-01-06',
    modePaiement: 'cheque',
    numeroCheque: 'CHQ-789456',
    banqueId: '2'
  },
  {
    id: '3',
    ordreId: '2',
    clientId: '4',
    montant: 500000,
    date: '2026-01-04',
    modePaiement: 'especes'
  }
];

export const banques: Banque[] = [
  {
    id: '1',
    nom: 'BGFI Bank',
    numeroCompte: '40001 00001 12345678901 23',
    rib: '40001000011234567890123',
    iban: 'GA21 4000 1000 0112 3456 7890 123',
    swift: 'BGFIGALX',
    solde: 45000000,
    actif: true
  },
  {
    id: '2',
    nom: 'UGB',
    numeroCompte: '30002 00001 98765432101 45',
    rib: '30002000019876543210145',
    iban: 'GA21 3000 2000 0198 7654 3210 145',
    swift: 'UGBGGALX',
    solde: 12500000,
    actif: true
  },
  {
    id: '3',
    nom: 'Orabank',
    numeroCompte: '50003 00001 11122233344 67',
    rib: '50003000011112223334467',
    iban: 'GA21 5000 3000 0111 2223 3344 67',
    swift: 'OABORGLX',
    solde: 8000000,
    actif: true
  }
];

export const mouvementsCaisse: MouvementCaisse[] = [
  {
    id: '1',
    type: 'entree',
    montant: 500000,
    date: '2026-01-04',
    description: 'Paiement espèces - SETRAG',
    paiementId: '3',
    source: 'caisse'
  },
  {
    id: '2',
    type: 'sortie',
    montant: 150000,
    date: '2026-01-04',
    description: 'Achat carburant',
    source: 'caisse'
  },
  {
    id: '3',
    type: 'entree',
    montant: 1249500,
    date: '2026-01-05',
    description: 'Virement - TOTAL GABON',
    paiementId: '1',
    source: 'banque',
    banqueId: '1'
  },
  {
    id: '4',
    type: 'entree',
    montant: 500000,
    date: '2026-01-06',
    description: 'Chèque - COMILOG',
    paiementId: '2',
    source: 'banque',
    banqueId: '2'
  },
  {
    id: '5',
    type: 'sortie',
    montant: 75000,
    date: '2026-01-05',
    description: 'Frais de fonctionnement',
    source: 'caisse'
  }
];

export const utilisateurs: Utilisateur[] = [
  {
    id: '1',
    nom: 'Jean-Pierre Mbongo',
    email: 'jp.mbongo@lojistiga.ga',
    telephone: '+241 77 12 34 56',
    roleId: '1',
    actif: true,
    dateCreation: '2024-01-01',
    derniereConnexion: '2026-01-06'
  },
  {
    id: '2',
    nom: 'Marie Ndong',
    email: 'm.ndong@lojistiga.ga',
    telephone: '+241 66 98 76 54',
    roleId: '2',
    actif: true,
    dateCreation: '2024-02-15',
    derniereConnexion: '2026-01-06'
  },
  {
    id: '3',
    nom: 'Paul Obame',
    email: 'p.obame@lojistiga.ga',
    telephone: '+241 77 45 67 89',
    roleId: '3',
    actif: true,
    dateCreation: '2024-03-20',
    derniereConnexion: '2026-01-05'
  },
  {
    id: '4',
    nom: 'Sophie Essono',
    email: 's.essono@lojistiga.ga',
    roleId: '2',
    actif: false,
    dateCreation: '2024-04-10'
  }
];

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
  },
  {
    id: '2',
    nom: 'Comptable',
    description: 'Gestion des factures et de la comptabilité',
    permissions: [
      { module: 'clients', action: 'lecture', autorise: true },
      { module: 'clients', action: 'ecriture', autorise: true },
      { module: 'clients', action: 'suppression', autorise: false },
      { module: 'factures', action: 'lecture', autorise: true },
      { module: 'factures', action: 'ecriture', autorise: true },
      { module: 'factures', action: 'suppression', autorise: false },
      { module: 'caisse', action: 'lecture', autorise: true },
      { module: 'caisse', action: 'ecriture', autorise: true },
      { module: 'parametres', action: 'lecture', autorise: false },
      { module: 'parametres', action: 'ecriture', autorise: false }
    ]
  },
  {
    id: '3',
    nom: 'Commercial',
    description: 'Gestion des clients et des devis',
    permissions: [
      { module: 'clients', action: 'lecture', autorise: true },
      { module: 'clients', action: 'ecriture', autorise: true },
      { module: 'clients', action: 'suppression', autorise: false },
      { module: 'factures', action: 'lecture', autorise: true },
      { module: 'factures', action: 'ecriture', autorise: false },
      { module: 'factures', action: 'suppression', autorise: false },
      { module: 'caisse', action: 'lecture', autorise: false },
      { module: 'caisse', action: 'ecriture', autorise: false },
      { module: 'parametres', action: 'lecture', autorise: false },
      { module: 'parametres', action: 'ecriture', autorise: false }
    ]
  }
];

export const actionsAudit: ActionAudit[] = [
  {
    id: '1',
    utilisateurId: '1',
    action: 'creation',
    module: 'factures',
    documentType: 'facture',
    documentId: '1',
    documentNumero: 'FAC-2026-0001',
    details: 'Création de la facture FAC-2026-0001 pour TOTAL GABON',
    date: '2026-01-03 09:15:00',
    ip: '192.168.1.100'
  },
  {
    id: '2',
    utilisateurId: '2',
    action: 'paiement',
    module: 'factures',
    documentType: 'facture',
    documentId: '1',
    documentNumero: 'FAC-2026-0001',
    details: 'Enregistrement du paiement de 1 249 500 FCFA par virement',
    date: '2026-01-05 14:30:00',
    ip: '192.168.1.101'
  },
  {
    id: '3',
    utilisateurId: '1',
    action: 'modification',
    module: 'clients',
    documentType: 'client',
    documentId: '2',
    details: 'Mise à jour des coordonnées de COMILOG',
    date: '2026-01-05 16:45:00',
    ip: '192.168.1.100'
  },
  {
    id: '4',
    utilisateurId: '3',
    action: 'creation',
    module: 'devis',
    documentType: 'devis',
    documentId: '3',
    documentNumero: 'DEV-2026-0003',
    details: 'Création du devis DEV-2026-0003 pour MAUREL & PROM',
    date: '2026-01-04 11:20:00',
    ip: '192.168.1.102'
  },
  {
    id: '5',
    utilisateurId: '2',
    action: 'sortie_caisse',
    module: 'caisse',
    details: 'Sortie de caisse de 150 000 FCFA pour achat carburant',
    date: '2026-01-04 10:00:00',
    ip: '192.168.1.101'
  }
];

export const annulations: Annulation[] = [
  {
    id: '1',
    numero: 'ANN-2026-0001',
    type: 'facture',
    documentId: '4',
    documentNumero: 'FAC-2025-0089',
    clientId: '3',
    montant: 750000,
    date: '2026-01-02',
    motif: 'Erreur de facturation - double saisie',
    avoirGenere: true
  }
];

// Données mock pour les crédits bancaires
export const creditsBancaires: CreditBancaire[] = [
  {
    id: '1',
    numero: 'CRED-2025-0001',
    banqueId: '1',
    montantEmprunte: 50000000,
    tauxInteret: 8.5,
    dureeEnMois: 36,
    dateDebut: '2025-03-01',
    dateFin: '2028-02-29',
    mensualite: 1577083,
    totalInterets: 6775000,
    montantRembourse: 15770830,
    statut: 'actif',
    objet: 'Acquisition véhicules de transport',
    notes: 'Crédit pour l\'achat de 3 camions plateau'
  },
  {
    id: '2',
    numero: 'CRED-2025-0002',
    banqueId: '2',
    montantEmprunte: 25000000,
    tauxInteret: 7.5,
    dureeEnMois: 24,
    dateDebut: '2025-06-01',
    dateFin: '2027-05-31',
    mensualite: 1126563,
    totalInterets: 2037500,
    montantRembourse: 7886941,
    statut: 'actif',
    objet: 'Équipement manutention',
    notes: 'Achat chariot élévateur et grue mobile'
  },
  {
    id: '3',
    numero: 'CRED-2024-0001',
    banqueId: '3',
    montantEmprunte: 15000000,
    tauxInteret: 9.0,
    dureeEnMois: 12,
    dateDebut: '2024-06-01',
    dateFin: '2025-05-31',
    mensualite: 1312500,
    totalInterets: 750000,
    montantRembourse: 15750000,
    statut: 'termine',
    objet: 'Fonds de roulement',
    notes: 'Crédit court terme pour trésorerie'
  }
];

export const echeancesCredits: EcheanceCredit[] = [
  // Échéances du crédit 1 (BGFI Bank - 50M)
  { id: 'ech-1-1', creditId: '1', numero: 1, dateEcheance: '2025-04-01', montantCapital: 1388889, montantInteret: 354167, montantTotal: 1743056, montantPaye: 1743056, datePaiement: '2025-04-01', statut: 'payee' },
  { id: 'ech-1-2', creditId: '1', numero: 2, dateEcheance: '2025-05-01', montantCapital: 1388889, montantInteret: 344271, montantTotal: 1733160, montantPaye: 1733160, datePaiement: '2025-05-02', statut: 'payee' },
  { id: 'ech-1-3', creditId: '1', numero: 3, dateEcheance: '2025-06-01', montantCapital: 1388889, montantInteret: 334375, montantTotal: 1723264, montantPaye: 1723264, datePaiement: '2025-06-01', statut: 'payee' },
  { id: 'ech-1-4', creditId: '1', numero: 4, dateEcheance: '2025-07-01', montantCapital: 1388889, montantInteret: 324479, montantTotal: 1713368, montantPaye: 1713368, datePaiement: '2025-07-01', statut: 'payee' },
  { id: 'ech-1-5', creditId: '1', numero: 5, dateEcheance: '2025-08-01', montantCapital: 1388889, montantInteret: 314583, montantTotal: 1703472, montantPaye: 1703472, datePaiement: '2025-08-01', statut: 'payee' },
  { id: 'ech-1-6', creditId: '1', numero: 6, dateEcheance: '2025-09-01', montantCapital: 1388889, montantInteret: 304688, montantTotal: 1693577, montantPaye: 1693577, datePaiement: '2025-09-02', statut: 'payee' },
  { id: 'ech-1-7', creditId: '1', numero: 7, dateEcheance: '2025-10-01', montantCapital: 1388889, montantInteret: 294792, montantTotal: 1683681, montantPaye: 1683681, datePaiement: '2025-10-01', statut: 'payee' },
  { id: 'ech-1-8', creditId: '1', numero: 8, dateEcheance: '2025-11-01', montantCapital: 1388889, montantInteret: 284896, montantTotal: 1673785, montantPaye: 1673785, datePaiement: '2025-11-01', statut: 'payee' },
  { id: 'ech-1-9', creditId: '1', numero: 9, dateEcheance: '2025-12-01', montantCapital: 1388889, montantInteret: 275000, montantTotal: 1663889, montantPaye: 1663889, datePaiement: '2025-12-01', statut: 'payee' },
  { id: 'ech-1-10', creditId: '1', numero: 10, dateEcheance: '2026-01-01', montantCapital: 1388889, montantInteret: 265104, montantTotal: 1653993, montantPaye: 1653993, datePaiement: '2026-01-02', statut: 'payee' },
  { id: 'ech-1-11', creditId: '1', numero: 11, dateEcheance: '2026-02-01', montantCapital: 1388889, montantInteret: 255208, montantTotal: 1644097, montantPaye: 0, statut: 'a_payer' },
  { id: 'ech-1-12', creditId: '1', numero: 12, dateEcheance: '2026-03-01', montantCapital: 1388889, montantInteret: 245313, montantTotal: 1634202, montantPaye: 0, statut: 'a_payer' },
  // Plus d'échéances futures...

  // Échéances du crédit 2 (UGB - 25M)
  { id: 'ech-2-1', creditId: '2', numero: 1, dateEcheance: '2025-07-01', montantCapital: 1041667, montantInteret: 156250, montantTotal: 1197917, montantPaye: 1197917, datePaiement: '2025-07-01', statut: 'payee' },
  { id: 'ech-2-2', creditId: '2', numero: 2, dateEcheance: '2025-08-01', montantCapital: 1041667, montantInteret: 149740, montantTotal: 1191407, montantPaye: 1191407, datePaiement: '2025-08-02', statut: 'payee' },
  { id: 'ech-2-3', creditId: '2', numero: 3, dateEcheance: '2025-09-01', montantCapital: 1041667, montantInteret: 143229, montantTotal: 1184896, montantPaye: 1184896, datePaiement: '2025-09-01', statut: 'payee' },
  { id: 'ech-2-4', creditId: '2', numero: 4, dateEcheance: '2025-10-01', montantCapital: 1041667, montantInteret: 136719, montantTotal: 1178386, montantPaye: 1178386, datePaiement: '2025-10-01', statut: 'payee' },
  { id: 'ech-2-5', creditId: '2', numero: 5, dateEcheance: '2025-11-01', montantCapital: 1041667, montantInteret: 130208, montantTotal: 1171875, montantPaye: 1171875, datePaiement: '2025-11-01', statut: 'payee' },
  { id: 'ech-2-6', creditId: '2', numero: 6, dateEcheance: '2025-12-01', montantCapital: 1041667, montantInteret: 123698, montantTotal: 1165365, montantPaye: 1165365, datePaiement: '2025-12-01', statut: 'payee' },
  { id: 'ech-2-7', creditId: '2', numero: 7, dateEcheance: '2026-01-01', montantCapital: 1041667, montantInteret: 117188, montantTotal: 1158855, montantPaye: 1158855, datePaiement: '2026-01-02', statut: 'payee' },
  { id: 'ech-2-8', creditId: '2', numero: 8, dateEcheance: '2026-02-01', montantCapital: 1041667, montantInteret: 110677, montantTotal: 1152344, montantPaye: 0, statut: 'a_payer' },
  { id: 'ech-2-9', creditId: '2', numero: 9, dateEcheance: '2026-03-01', montantCapital: 1041667, montantInteret: 104167, montantTotal: 1145834, montantPaye: 0, statut: 'a_payer' }
];

export const remboursementsCredits: RemboursementCredit[] = [
  { id: 'remb-1', creditId: '1', echeanceId: 'ech-1-1', montant: 1743056, date: '2025-04-01', banqueId: '1', reference: 'VIR-CRED-001' },
  { id: 'remb-2', creditId: '1', echeanceId: 'ech-1-2', montant: 1733160, date: '2025-05-02', banqueId: '1', reference: 'VIR-CRED-002' },
  { id: 'remb-3', creditId: '1', echeanceId: 'ech-1-3', montant: 1723264, date: '2025-06-01', banqueId: '1', reference: 'VIR-CRED-003' },
  { id: 'remb-4', creditId: '1', echeanceId: 'ech-1-4', montant: 1713368, date: '2025-07-01', banqueId: '1', reference: 'VIR-CRED-004' },
  { id: 'remb-5', creditId: '1', echeanceId: 'ech-1-5', montant: 1703472, date: '2025-08-01', banqueId: '1', reference: 'VIR-CRED-005' },
  { id: 'remb-6', creditId: '1', echeanceId: 'ech-1-6', montant: 1693577, date: '2025-09-02', banqueId: '1', reference: 'VIR-CRED-006' },
  { id: 'remb-7', creditId: '1', echeanceId: 'ech-1-7', montant: 1683681, date: '2025-10-01', banqueId: '1', reference: 'VIR-CRED-007' },
  { id: 'remb-8', creditId: '1', echeanceId: 'ech-1-8', montant: 1673785, date: '2025-11-01', banqueId: '1', reference: 'VIR-CRED-008' },
  { id: 'remb-9', creditId: '1', echeanceId: 'ech-1-9', montant: 1663889, date: '2025-12-01', banqueId: '1', reference: 'VIR-CRED-009' },
  { id: 'remb-10', creditId: '1', echeanceId: 'ech-1-10', montant: 1653993, date: '2026-01-02', banqueId: '1', reference: 'VIR-CRED-010' },
  { id: 'remb-11', creditId: '2', echeanceId: 'ech-2-1', montant: 1197917, date: '2025-07-01', banqueId: '2', reference: 'VIR-CRED-011' },
  { id: 'remb-12', creditId: '2', echeanceId: 'ech-2-2', montant: 1191407, date: '2025-08-02', banqueId: '2', reference: 'VIR-CRED-012' },
  { id: 'remb-13', creditId: '2', echeanceId: 'ech-2-3', montant: 1184896, date: '2025-09-01', banqueId: '2', reference: 'VIR-CRED-013' },
  { id: 'remb-14', creditId: '2', echeanceId: 'ech-2-4', montant: 1178386, date: '2025-10-01', banqueId: '2', reference: 'VIR-CRED-014' },
  { id: 'remb-15', creditId: '2', echeanceId: 'ech-2-5', montant: 1171875, date: '2025-11-01', banqueId: '2', reference: 'VIR-CRED-015' },
  { id: 'remb-16', creditId: '2', echeanceId: 'ech-2-6', montant: 1165365, date: '2025-12-01', banqueId: '2', reference: 'VIR-CRED-016' },
  { id: 'remb-17', creditId: '2', echeanceId: 'ech-2-7', montant: 1158855, date: '2026-01-02', banqueId: '2', reference: 'VIR-CRED-017' }
];
