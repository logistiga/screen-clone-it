// Données de référence pour le module Opérations Indépendantes

export const POINT_DEPART_DEFAUT = "Libreville";

export const DESTINATIONS_TRANSPORT: string[] = [
  "Port-Gentil",
  "Franceville",
  "Oyem",
  "Mouila",
  "Lambaréné",
  "Tchibanga",
  "Makokou",
  "Koulamoutou",
  "Bitam",
  "Gamba",
  "Owendo",
  "Akanda",
  "Ntoum",
  "Kango",
  "Cocobeach",
  "Médouneu",
  "Mitzic",
  "Booué",
  "Lastoursville",
  "Moanda",
  "Mounana",
  "Ndjolé",
  "Bifoun",
  "Lopé",
];

export type TypeTransport = "conteneur" | "marchandise" | "engin" | "materiel";
export const TYPE_TRANSPORT_LABELS: Record<TypeTransport, string> = {
  conteneur: "Conteneur",
  marchandise: "Marchandise",
  engin: "Engin",
  materiel: "Matériel",
};

export type ModeTrajet = "aller_simple" | "retour_simple" | "aller_retour";
export const MODE_TRAJET_LABELS: Record<ModeTrajet, string> = {
  aller_simple: "Aller simple",
  retour_simple: "Retour simple",
  aller_retour: "Aller-retour",
};
