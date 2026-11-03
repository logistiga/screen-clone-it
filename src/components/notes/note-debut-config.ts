import { Anchor, Container, Wrench, FileText, Receipt, PackageOpen } from "lucide-react";

export const typeConfig: Record<string, { label: string; icon: typeof Anchor; color: string }> = {
  ouverture_port: {
    label: "Ouverture de port",
    icon: Anchor,
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  "Ouverture Port": {
    label: "Ouverture de port",
    icon: Anchor,
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  detention: {
    label: "Détention",
    icon: Container,
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  Detention: {
    label: "Détention",
    icon: Container,
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  reparation: {
    label: "Réparation conteneur",
    icon: Wrench,
    color: "bg-green-100 text-green-700 border-green-200",
  },
  Reparation: {
    label: "Réparation conteneur",
    icon: Wrench,
    color: "bg-green-100 text-green-700 border-green-200",
  },
  relache: {
    label: "Relâche",
    icon: PackageOpen,
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  Relache: {
    label: "Relâche",
    icon: PackageOpen,
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  divers: { label: "Divers", icon: Receipt, color: "bg-primary/10 text-primary border-primary/20" },
  Divers: { label: "Divers", icon: Receipt, color: "bg-primary/10 text-primary border-primary/20" },
};

export const statusConfig: Record<string, { label: string; class: string }> = {
  brouillon: { label: "Brouillon", class: "bg-muted text-muted-foreground" },
  en_attente: { label: "En attente", class: "bg-warning/20 text-warning" },
  facturee: { label: "Facturée", class: "bg-primary/20 text-primary" },
  payee: { label: "Payée", class: "bg-success/20 text-success" },
  annulee: { label: "Annulée", class: "bg-muted text-muted-foreground" },
  partielle: { label: "Partielle", class: "bg-cyan-500/20 text-cyan-600" },
};

export const defaultTypeInfo = {
  label: "Note",
  icon: FileText,
  color: "bg-gray-100 text-gray-700 border-gray-200",
};

