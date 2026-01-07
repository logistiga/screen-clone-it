import { Container, Package, Truck, Forklift, Warehouse, ArrowLeftRight } from "lucide-react";
import React from "react";

// Types de catégories principales
export type CategorieDocument = "conteneurs" | "conventionnel" | "operations_independantes";

// Types d'opérations
export type TypeOperation = "import" | "export";
export type TypeOperationIndep = "location" | "transport" | "manutention" | "double_relevage" | "stockage";

// Types d'opérations disponibles pour conteneurs
export type TypeOperationConteneur = "arrivee" | "stockage" | "depotage" | "double_relevage" | "sortie" | "transport" | "manutention";

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
};

// Mock data pour armateurs, transitaires et représentants
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

// Labels pour les catégories (création dynamique avec les icônes)
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
    description: "Location, Transport, Manutention, Stockage",
    icon: React.createElement(Truck, { className: "h-6 w-6" }),
  },
});

// Labels pour les opérations indépendantes
export const getOperationsIndepLabels = (): Record<TypeOperationIndep, { label: string; icon: React.ReactNode }> => ({
  location: { label: "Location véhicule/équipement", icon: React.createElement(Truck, { className: "h-6 w-6" }) },
  transport: { label: "Transport hors Libreville", icon: React.createElement(Truck, { className: "h-6 w-6" }) },
  manutention: { label: "Manutention", icon: React.createElement(Forklift, { className: "h-6 w-6" }) },
  double_relevage: { label: "Double relevage", icon: React.createElement(ArrowLeftRight, { className: "h-6 w-6" }) },
  stockage: { label: "Stockage", icon: React.createElement(Warehouse, { className: "h-6 w-6" }) },
});

// Interface pour les prestations avec champs spécifiques
export interface LignePrestationEtendue extends LignePrestation {
  // Pour transport hors Libreville
  lieuDepart?: string;
  lieuArrivee?: string;
  // Pour location et stockage
  dateDebut?: string;
  dateFin?: string;
}

export const getInitialPrestationEtendue = (): LignePrestationEtendue => ({
  id: "1",
  description: "",
  quantite: 1,
  prixUnitaire: 0,
  montantHT: 0,
  lieuDepart: "",
  lieuArrivee: "",
  dateDebut: "",
  dateFin: "",
});

// Calcul du nombre de jours entre deux dates
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
  id: "1",
  numero: "",
  taille: "",
  description: "",
  prixUnitaire: 0,
  operations: []
});

export const getInitialLot = (): LigneLot => ({
  id: "1",
  numeroLot: "",
  description: "",
  quantite: 1,
  prixUnitaire: 0,
  prixTotal: 0
});

export const getInitialPrestation = (): LignePrestation => ({
  id: "1",
  description: "",
  quantite: 1,
  prixUnitaire: 0,
  montantHT: 0
});

// Fonctions de calcul partagées
export const calculateTotalConteneurs = (conteneurs: LigneConteneur[]): number => {
  const totalConteneurs = conteneurs.reduce((sum, c) => sum + (c.prixUnitaire || 0), 0);
  const totalOperations = conteneurs.reduce((sum, c) => 
    sum + c.operations.reduce((opSum, op) => opSum + op.prixTotal, 0), 0
  );
  return totalConteneurs + totalOperations;
};

export const calculateTotalLots = (lots: LigneLot[]): number => {
  return lots.reduce((sum, l) => sum + l.prixTotal, 0);
};

export const calculateTotalPrestations = (prestations: LignePrestation[]): number => {
  return prestations.reduce((sum, p) => sum + p.montantHT, 0);
};
