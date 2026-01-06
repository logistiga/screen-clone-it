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
    description: 'Paiement ordre OT-2026-0002',
    paiementId: '3',
    source: 'caisse'
  },
  {
    id: '2',
    type: 'entree',
    montant: 1249500,
    date: '2026-01-05',
    description: 'Paiement facture FAC-2026-0001',
    paiementId: '1',
    source: 'banque',
    banqueId: '1'
  },
  {
    id: '3',
    type: 'entree',
    montant: 500000,
    date: '2026-01-06',
    description: 'Paiement partiel facture FAC-2026-0002',
    paiementId: '2',
    source: 'banque',
    banqueId: '2'
  },
  {
    id: '4',
    type: 'sortie',
    montant: 150000,
    date: '2026-01-05',
    description: 'Achat fournitures bureau',
    source: 'caisse'
  }
];

export const utilisateurs: Utilisateur[] = [
  {
    id: '1',
    nom: 'Jean-Pierre Moussavou',
    email: 'jp.moussavou@lojistiga.ga',
    telephone: '+241 077 00 00 01',
    roleId: '1',
    actif: true,
    dateCreation: '2024-01-01',
    derniereConnexion: '2026-01-06'
  },
  {
    id: '2',
    nom: 'Marie-Claire Obiang',
    email: 'mc.obiang@lojistiga.ga',
    telephone: '+241 077 00 00 02',
    roleId: '2',
    actif: true,
    dateCreation: '2024-02-15',
    derniereConnexion: '2026-01-06'
  },
  {
    id: '3',
    nom: 'Patrick Ndong',
    email: 'p.ndong@lojistiga.ga',
    telephone: '+241 077 00 00 03',
    roleId: '3',
    actif: true,
    dateCreation: '2024-03-20',
    derniereConnexion: '2026-01-05'
  },
  {
    id: '4',
    nom: 'Sandrine Ella',
    email: 's.ella@lojistiga.ga',
    telephone: '+241 077 00 00 04',
    roleId: '4',
    actif: false,
    dateCreation: '2024-05-10'
  }
];

export const roles: Role[] = [
  {
    id: '1',
    nom: 'Administrateur',
    description: 'Accès complet à toutes les fonctionnalités',
    permissions: [
      { module: 'clients', action: 'voir', autorise: true },
      { module: 'clients', action: 'creer', autorise: true },
      { module: 'clients', action: 'modifier', autorise: true },
      { module: 'clients', action: 'supprimer', autorise: true },
      { module: 'devis', action: 'voir', autorise: true },
      { module: 'devis', action: 'creer', autorise: true },
      { module: 'devis', action: 'modifier', autorise: true },
      { module: 'devis', action: 'convertir', autorise: true },
      { module: 'devis', action: 'annuler', autorise: true },
      { module: 'ordres', action: 'voir', autorise: true },
      { module: 'ordres', action: 'creer', autorise: true },
      { module: 'ordres', action: 'modifier', autorise: true },
      { module: 'ordres', action: 'valider', autorise: true },
      { module: 'ordres', action: 'annuler', autorise: true },
      { module: 'factures', action: 'voir', autorise: true },
      { module: 'factures', action: 'creer', autorise: true },
      { module: 'factures', action: 'paiement', autorise: true },
      { module: 'factures', action: 'annuler', autorise: true },
      { module: 'caisse', action: 'voir', autorise: true },
      { module: 'caisse', action: 'entree_sortie', autorise: true },
      { module: 'banque', action: 'voir', autorise: true },
      { module: 'banque', action: 'gerer', autorise: true },
      { module: 'reporting', action: 'voir', autorise: true },
      { module: 'reporting', action: 'exporter', autorise: true },
      { module: 'parametrage', action: 'acces_complet', autorise: true }
    ]
  },
  {
    id: '2',
    nom: 'Comptable',
    description: 'Gestion des factures et de la comptabilité',
    permissions: [
      { module: 'clients', action: 'voir', autorise: true },
      { module: 'clients', action: 'creer', autorise: false },
      { module: 'clients', action: 'modifier', autorise: false },
      { module: 'clients', action: 'supprimer', autorise: false },
      { module: 'devis', action: 'voir', autorise: true },
      { module: 'devis', action: 'creer', autorise: false },
      { module: 'factures', action: 'voir', autorise: true },
      { module: 'factures', action: 'creer', autorise: true },
      { module: 'factures', action: 'paiement', autorise: true },
      { module: 'caisse', action: 'voir', autorise: true },
      { module: 'caisse', action: 'entree_sortie', autorise: true },
      { module: 'banque', action: 'voir', autorise: true },
      { module: 'banque', action: 'gerer', autorise: true },
      { module: 'reporting', action: 'voir', autorise: true },
      { module: 'reporting', action: 'exporter', autorise: true }
    ]
  },
  {
    id: '3',
    nom: 'Commercial',
    description: 'Gestion des clients et des devis',
    permissions: [
      { module: 'clients', action: 'voir', autorise: true },
      { module: 'clients', action: 'creer', autorise: true },
      { module: 'clients', action: 'modifier', autorise: true },
      { module: 'devis', action: 'voir', autorise: true },
      { module: 'devis', action: 'creer', autorise: true },
      { module: 'devis', action: 'modifier', autorise: true },
      { module: 'devis', action: 'convertir', autorise: true },
      { module: 'ordres', action: 'voir', autorise: true },
      { module: 'ordres', action: 'creer', autorise: true },
      { module: 'factures', action: 'voir', autorise: true }
    ]
  },
  {
    id: '4',
    nom: 'Opérateur',
    description: 'Gestion des ordres de travail',
    permissions: [
      { module: 'clients', action: 'voir', autorise: true },
      { module: 'ordres', action: 'voir', autorise: true },
      { module: 'ordres', action: 'creer', autorise: true },
      { module: 'ordres', action: 'modifier', autorise: true }
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
    date: '2026-01-03T10:30:00'
  },
  {
    id: '2',
    utilisateurId: '2',
    action: 'paiement',
    module: 'factures',
    documentType: 'facture',
    documentId: '1',
    documentNumero: 'FAC-2026-0001',
    details: 'Enregistrement paiement de 1 249 500 XAF par virement',
    date: '2026-01-05T14:15:00'
  },
  {
    id: '3',
    utilisateurId: '3',
    action: 'creation',
    module: 'devis',
    documentType: 'devis',
    documentId: '3',
    documentNumero: 'DEV-2026-0003',
    details: 'Création du devis DEV-2026-0003 pour MAUREL & PROM',
    date: '2026-01-04T09:00:00'
  },
  {
    id: '4',
    utilisateurId: '1',
    action: 'modification',
    module: 'clients',
    documentType: 'client',
    documentId: '2',
    details: 'Mise à jour des informations de contact de COMILOG',
    date: '2026-01-05T11:45:00'
  },
  {
    id: '5',
    utilisateurId: '2',
    action: 'sortie',
    module: 'caisse',
    details: 'Sortie de caisse: 150 000 XAF - Achat fournitures bureau',
    date: '2026-01-05T16:30:00'
  }
];

// Configuration de numérotation
export interface ConfigurationNumerotation {
  prefixeDevis: string;
  prefixeOrdre: string;
  prefixeFacture: string;
  prefixeAvoir: string;
  formatAnnee: boolean;
  prochainNumeroDevis: number;
  prochainNumeroOrdre: number;
  prochainNumeroFacture: number;
  prochainNumeroAvoir: number;
}

export const configurationNumerotation: ConfigurationNumerotation = {
  prefixeDevis: 'DEV',
  prefixeOrdre: 'OT',
  prefixeFacture: 'FAC',
  prefixeAvoir: 'AV',
  formatAnnee: true,
  prochainNumeroDevis: 4,
  prochainNumeroOrdre: 5,
  prochainNumeroFacture: 4,
  prochainNumeroAvoir: 1
};

// Configuration des taxes
export interface ConfigurationTaxes {
  tvaRate: number;
  cssRate: number;
}

export const configurationTaxes: ConfigurationTaxes = {
  tvaRate: 18,
  cssRate: 1
};

// Helpers
export const formatMontant = (montant: number): string => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' XAF';
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('fr-FR');
};

export const getClientById = (id: string): Client | undefined => {
  return clients.find(c => c.id === id);
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
    annulee: 'Annulée'
  };
  return labels[statut] || statut;
};
