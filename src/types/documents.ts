import { Container, Package, Truck, Forklift, Warehouse, ArrowLeftRight } from "lucide-react";
import React from "react";

// Types de catégories principales
export type CategorieDocument = "conteneurs" | "conventionnel" | "operations_independantes";

// Types d'opérations
export type TypeOperation = "import" | "export";
// Types acceptés en BDD (rétrocompat lecture incluant les anciens)
export type TypeOperationIndep =
  | "transport"
  | "location"
  | "manutention"
  | "autre"
  | "double_relevage"
  | "stockage";
// Types proposés à la création (alignés OPS)
export type TypeOperationIndepCreation = "transport" | "location" | "manutention" | "autre";

// Type de marchandise (en-tête des opérations indépendantes)
export type TypeMarchandise = "conteneur" | "materiel" | "marchandise_generale" | "engin" | "autre";

export const getTypeMarchandiseLabels = (): Record<TypeMarchandise, string> => ({
  conteneur: "Conteneur",
  materiel: "Matériel",
  marchandise_generale: "Marchandise générale",
  engin: "Engin",
  autre: "Autre",
});

// Types d'opérations disponibles pour conteneurs
export type TypeOperationConteneur =
  | "arrivee" | "stockage" | "depotage" | "double_relevage"
  | "sortie" | "transport" | "manutention" | "escorte";

// Interfaces
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

export interface LignePrestation {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  montantHT: number;
}

export interface LigneLot {
  id: string;
  numeroLot: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  prixTotal: number;
}

// Configuration des types d'opérations conteneur
export const typesOperationConteneur: Record<TypeOperationConteneur, { label: string; prixDefaut: number }> = {
  arrivee: { label: "Arrivée", prixDefaut: 50000 },
  stockage: { label: "Stockage", prixDefaut: 25000 },
  depotage: { label: "Dépotage", prixDefaut: 75000 },
  double_relevage: { label: "Double relevage", prixDefaut: 35000 },
  sortie: { label: "Sortie", prixDefaut: 40000 },
  transport: { label: "Transport", prixDefaut: 150000 },
  manutention: { label: "Manutention", prixDefaut: 30000 },
  escorte: { label: "Escorte", prixDefaut: 50000 },
};

// Mocks (legacy)
export const armateurs = [
  { id: "arm1", nom: "MSC" },
  { id: "arm2", nom: "MAERSK" },
  { id: "arm3", nom: "CMA CGM" },
  { id: "arm4", nom: "HAPAG-LLOYD" },
];
export const transitaires = [
  { id: "trans1", nom: "Transit Express" },
  { id: "trans2", nom: "Global Transit" },
  { id: "trans3", nom: "Africa Logistics" },
];
export const representants = [
  { id: "rep1", nom: "Jean Dupont" },
  { id: "rep2", nom: "Marie Koumba" },
  { id: "rep3", nom: "Paul Mbongo" },
];

// Labels pour les catégories
export const getCategoriesLabels = (): Record<CategorieDocument, { label: string; description: string; icon: React.ReactNode }> => ({
  conteneurs: {
    label: "Conteneurs",
    description: "Import/Export conteneurs",
    icon: React.createElement(Container, { className: "h-6 w-6" }),
  },
  conventionnel: {
    label: "Conventionnel",
    description: "Marchandises en vrac",
    icon: React.createElement(Package, { className: "h-6 w-6" }),
  },
  operations_independantes: {
    label: "Opérations indépendantes",
    description: "Transport, Location, Manutention, Autre",
    icon: React.createElement(Truck, { className: "h-6 w-6" }),
  },
});

// Labels des 4 types de lignes proposés à la création
export const getOperationsIndepLabels = (): Record<TypeOperationIndepCreation, { label: string; icon: React.ReactNode }> => ({
  transport: { label: "Transport", icon: React.createElement(Truck, { className: "h-5 w-5" }) },
  location: { label: "Location", icon: React.createElement(Truck, { className: "h-5 w-5" }) },
  manutention: { label: "Manutention", icon: React.createElement(Forklift, { className: "h-5 w-5" }) },
  autre: { label: "Autre", icon: React.createElement(Package, { className: "h-5 w-5" }) },
});

// Labels pour lecture (inclut anciens types stockage / double_relevage)
export const getOperationsIndepLabelsAll = (): Record<TypeOperationIndep, string> => ({
  transport: "Transport",
  location: "Location",
  manutention: "Manutention",
  autre: "Autre",
  double_relevage: "Double relevage",
  stockage: "Stockage",
});

// Prestation enrichie (champs spécifiques par-ligne)
export interface LignePrestationEtendue extends LignePrestation {
  typeOperation?: TypeOperationIndep | "";
  // Transport
  pointDepart?: string;
  pointArrivee?: string;
  typeTransport?: "conteneur" | "marchandise" | "engin" | "materiel" | "";
  modeTrajet?: "aller_simple" | "aller_retour" | "";
  // Location & manutention
  materiel?: string;
  // Location (dates)
  dateDebut?: string;
  dateFin?: string;
  nombreJours?: number;
  // Compat héritée
  lieuDepart?: string;
  lieuArrivee?: string;
}

export const getInitialPrestationEtendue = (): LignePrestationEtendue => ({
  id: String(Date.now()),
  typeOperation: "",
  description: "",
  quantite: 1,
  prixUnitaire: 0,
  montantHT: 0,
  pointDepart: "Libreville",
  pointArrivee: "",
  typeTransport: "",
  modeTrajet: "",
  materiel: "",
  dateDebut: "",
  dateFin: "",
  nombreJours: 1,
  lieuDepart: "",
  lieuArrivee: "",
});

// Nombre de jours entre 2 dates
export const calculateDaysBetween = (dateDebut: string, dateFin: string): number => {
  if (!dateDebut || !dateFin) return 1;
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  const diffTime = fin.getTime() - debut.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
};

// États initiaux
export const getInitialConteneur = (): LigneConteneur => ({
  id: "1", numero: "", taille: "", description: "", prixUnitaire: 0, operations: [],
});
export const getInitialLot = (): LigneLot => ({
  id: "1", numeroLot: "", description: "", quantite: 1, prixUnitaire: 0, prixTotal: 0,
});
export const getInitialPrestation = (): LignePrestation => ({
  id: "1", description: "", quantite: 1, prixUnitaire: 0, montantHT: 0,
});

// Calculs
export const calculateTotalConteneurs = (conteneurs: LigneConteneur[]): number => {
  const totalConteneurs = conteneurs.reduce((sum, c) => sum + (c.prixUnitaire || 0), 0);
  const totalOperations = conteneurs.reduce(
    (sum, c) => sum + c.operations.reduce((s, op) => s + op.prixTotal, 0), 0
  );
  return totalConteneurs + totalOperations;
};
export const calculateTotalLots = (lots: LigneLot[]): number => lots.reduce((s, l) => s + l.prixTotal, 0);
export const calculateTotalPrestations = (prestations: LignePrestation[]): number =>
  prestations.reduce((s, p) => s + p.montantHT, 0);
