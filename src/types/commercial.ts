import { Container, Package, Truck, Forklift, Warehouse, ArrowLeftRight, FileText, Receipt, ClipboardList } from "lucide-react";
import React from "react";

// ============ TYPES DE DOCUMENTS ============
export type TypeDocument = "devis" | "ordre" | "facture";

export const typesDocumentConfig: Record<TypeDocument, {
  label: string;
  labelPlural: string;
  icon: React.ReactNode;
  route: string;
  couleur: string;
}> = {
  devis: {
    label: "Devis",
    labelPlural: "Devis",
    icon: React.createElement(FileText, { className: "h-5 w-5" }),
    route: "/devis",
    couleur: "text-blue-600",
  },
  ordre: {
    label: "Ordre de travail",
    labelPlural: "Ordres de travail",
    icon: React.createElement(ClipboardList, { className: "h-5 w-5" }),
    route: "/ordres",
    couleur: "text-amber-600",
  },
  facture: {
    label: "Facture",
    labelPlural: "Factures",
    icon: React.createElement(Receipt, { className: "h-5 w-5" }),
    route: "/factures",
    couleur: "text-green-600",
  },
};

// ============ CATÉGORIES ============
export type CategorieDocument = "conteneurs" | "conventionnel" | "operations_independantes";

export const categoriesConfig: Record<CategorieDocument, {
  label: string;
  description: string;
  icon: React.ReactNode;
  className: string;
}> = {
  conteneurs: {
    label: "Conteneurs",
    description: "Import/Export conteneurs maritimes",
    icon: React.createElement(Container, { className: "h-6 w-6" }),
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  conventionnel: {
    label: "Conventionnel",
    description: "Marchandises en vrac ou lots",
    icon: React.createElement(Package, { className: "h-6 w-6" }),
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  operations_independantes: {
    label: "Opérations indépendantes",
    description: "Location, Transport, Manutention, Stockage",
    icon: React.createElement(Truck, { className: "h-6 w-6" }),
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
};

// ============ TYPES D'OPÉRATIONS ============
export type TypeOperation = "import" | "export";
export type TypeOperationIndep = "location" | "transport" | "manutention" | "double_relevage" | "stockage";
export type TypeOperationConteneur = "arrivee" | "stockage" | "depotage" | "double_relevage" | "sortie" | "transport" | "manutention";

export const typesOperationConteneur: Record<TypeOperationConteneur, { label: string; prixDefaut: number }> = {
  arrivee: { label: "Arrivée", prixDefaut: 50000 },
  stockage: { label: "Stockage", prixDefaut: 25000 },
  depotage: { label: "Dépotage", prixDefaut: 75000 },
  double_relevage: { label: "Double relevage", prixDefaut: 35000 },
  sortie: { label: "Sortie", prixDefaut: 40000 },
  transport: { label: "Transport", prixDefaut: 150000 },
  manutention: { label: "Manutention", prixDefaut: 30000 },
};

export const typesOperationIndep: Record<TypeOperationIndep, { label: string; icon: React.ReactNode }> = {
  location: { label: "Location véhicule/équipement", icon: React.createElement(Truck, { className: "h-6 w-6" }) },
  transport: { label: "Transport hors Libreville", icon: React.createElement(Truck, { className: "h-6 w-6" }) },
  manutention: { label: "Manutention", icon: React.createElement(Forklift, { className: "h-6 w-6" }) },
  double_relevage: { label: "Double relevage", icon: React.createElement(ArrowLeftRight, { className: "h-6 w-6" }) },
  stockage: { label: "Stockage", icon: React.createElement(Warehouse, { className: "h-6 w-6" }) },
};

// ============ INTERFACES DONNÉES ============
export interface OperationConteneur {
  id: string;
  type: TypeOperationConteneur;
  description: string;
  quantite: number;
  prixUnitaire: number;
  prixTotal: number;
}

export interface LigneConteneur {
  id: string;
  numero: string;
  taille: "20'" | "40'" | "";
  description: string;
  prixUnitaire: number;
  operations: OperationConteneur[];
}

export interface LigneLot {
  id: string;
  numeroLot: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  prixTotal: number;
}

export interface LignePrestation {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  montantHT: number;
  lieuDepart?: string;
  lieuArrivee?: string;
  dateDebut?: string;
  dateFin?: string;
}

// ============ DONNÉES FORMULAIRES PAR CATÉGORIE ============
export interface ConteneursFormData {
  typeOperation: TypeOperation | "";
  numeroBL: string;
  armateurId: string;
  transitaireId: string;
  representantId: string;
  primeTransitaire: number;
  primeRepresentant: number;
  conteneurs: LigneConteneur[];
  montantHT: number;
}

export interface ConventionnelFormData {
  numeroBL: string;
  lieuChargement: string;
  lieuDechargement: string;
  lots: LigneLot[];
  montantHT: number;
}

export interface IndependantFormData {
  typeOperationIndep: TypeOperationIndep | "";
  prestations: LignePrestation[];
  montantHT: number;
}

// ============ DOCUMENT COMMERCIAL (unifié) ============
export interface DocumentCommercial {
  id: string;
  numero: string;
  type: TypeDocument;
  categorie: CategorieDocument;
  clientId: string;
  clientNom?: string;
  date: string;
  dateEcheance?: string;
  dateValidite?: string;
  statut: string;
  montantHT: number;
  montantTVA: number;
  montantCSS: number;
  montantTTC: number;
  montantPaye: number;
  notes?: string;
  // Données spécifiques selon catégorie
  numeroBL?: string;
  armateurId?: string;
  transitaireId?: string;
  representantId?: string;
  conteneurs?: LigneConteneur[];
  lots?: LigneLot[];
  prestations?: LignePrestation[];
}

// ============ FONCTIONS UTILITAIRES ============
export const getInitialConteneur = (): LigneConteneur => ({
  id: String(Date.now()),
  numero: "",
  taille: "",
  description: "",
  prixUnitaire: 0,
  operations: [],
});

export const getInitialLot = (): LigneLot => ({
  id: String(Date.now()),
  numeroLot: "",
  description: "",
  quantite: 1,
  prixUnitaire: 0,
  prixTotal: 0,
});

export const getInitialPrestation = (): LignePrestation => ({
  id: String(Date.now()),
  description: "",
  quantite: 1,
  prixUnitaire: 0,
  montantHT: 0,
  lieuDepart: "",
  lieuArrivee: "",
  dateDebut: "",
  dateFin: "",
});

export const calculateTotalConteneurs = (conteneurs: LigneConteneur[]): number => {
  const totalConteneurs = conteneurs.reduce((sum, c) => sum + (c.prixUnitaire || 0), 0);
  const totalOperations = conteneurs.reduce(
    (sum, c) => sum + c.operations.reduce((opSum, op) => opSum + op.prixTotal, 0),
    0
  );
  return totalConteneurs + totalOperations;
};

export const calculateTotalLots = (lots: LigneLot[]): number => {
  return lots.reduce((sum, l) => sum + l.prixTotal, 0);
};

export const calculateTotalPrestations = (prestations: LignePrestation[]): number => {
  return prestations.reduce((sum, p) => sum + p.montantHT, 0);
};

export const calculateDaysBetween = (dateDebut: string, dateFin: string): number => {
  if (!dateDebut || !dateFin) return 1;
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  const diffTime = fin.getTime() - debut.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
};

export const formatMontant = (montant: number): string => {
  return new Intl.NumberFormat("fr-FR").format(montant) + " XAF";
};

export const formatDate = (date: string | Date | undefined): string => {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR");
};

// ============ STATUTS ============
export const getStatutLabel = (statut: string): string => {
  const labels: Record<string, string> = {
    brouillon: "Brouillon",
    en_cours: "En cours",
    termine: "Terminé",
    valide: "Validé",
    envoye: "Envoyé",
    accepte: "Accepté",
    refuse: "Refusé",
    expire: "Expiré",
    facture: "Facturé",
    payee: "Payée",
    partiellement_payee: "Partiel",
    impayee: "Impayée",
    annule: "Annulé",
    annulee: "Annulée",
  };
  return labels[statut] || statut;
};

export const getStatutVariant = (statut: string): "default" | "secondary" | "destructive" | "outline" => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    brouillon: "outline",
    en_cours: "outline",
    termine: "default",
    valide: "secondary",
    envoye: "secondary",
    accepte: "default",
    refuse: "destructive",
    expire: "destructive",
    facture: "default",
    payee: "default",
    partiellement_payee: "secondary",
    impayee: "destructive",
    annule: "destructive",
    annulee: "destructive",
  };
  return variants[statut] || "secondary";
};
