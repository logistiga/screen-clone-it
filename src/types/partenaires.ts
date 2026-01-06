// Types pour les partenaires (Transitaires, Représentants, Armateurs)

export interface Transitaire {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  dateCreation: string;
  actif: boolean;
}

export interface Representant {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  dateCreation: string;
  actif: boolean;
}

export interface Armateur {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  dateCreation: string;
  actif: boolean;
}

export interface PrimePartenaire {
  id: string;
  ordreId: string;
  ordreNumero: string;
  transitaireId?: string;
  representantId?: string;
  montant: number;
  statut: 'due' | 'payee';
  dateCreation: string;
  datePaiement?: string;
}

export interface PaiementPrime {
  id: string;
  primeIds: string[];
  transitaireId?: string;
  representantId?: string;
  montant: number;
  date: string;
  modePaiement: 'especes' | 'virement' | 'cheque';
  reference?: string;
  notes?: string;
}
