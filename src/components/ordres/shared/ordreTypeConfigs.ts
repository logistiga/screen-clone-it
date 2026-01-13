import {
  Truck,
  Package,
  Warehouse,
  Calendar,
  RotateCcw,
  ArrowDownToLine,
  ArrowUpFromLine,
  Container,
  Ship,
  Clock,
  FileText,
  Ban,
} from "lucide-react";
import { getStatutLabel } from "@/data/mockData";

export interface TypeConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
}

export interface StatutConfig {
  label: string;
  className: string;
  icon: React.ComponentType<{ className?: string }> | null;
}

// Configuration des types d'opérations indépendantes
export const typeIndepConfigs: Record<string, TypeConfig> = {
  transport: {
    label: "Transport",
    icon: Truck,
    className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-200 dark:border-green-700",
  },
  manutention: {
    label: "Manutention",
    icon: Package,
    className: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-700",
  },
  stockage: {
    label: "Stockage",
    icon: Warehouse,
    className: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-700",
  },
  location: {
    label: "Location",
    icon: Calendar,
    className: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-200 dark:border-teal-700",
  },
  double_relevage: {
    label: "Double Relevage",
    icon: RotateCcw,
    className: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/40 dark:text-pink-200 dark:border-pink-700",
  },
};

// Configuration des types de conteneurs (Import/Export)
export const typeConteneurConfigs: Record<string, TypeConfig> = {
  import: {
    label: "Import",
    icon: ArrowDownToLine,
    className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700",
  },
  export: {
    label: "Export",
    icon: ArrowUpFromLine,
    className: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-200 dark:border-cyan-700",
  },
};

// Configuration des statuts
export const getStatutConfig = (statut: string): StatutConfig => {
  const configs: Record<string, StatutConfig> = {
    en_cours: {
      label: getStatutLabel(statut),
      className: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700",
      icon: Clock,
    },
    termine: {
      label: getStatutLabel(statut),
      className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700",
      icon: null,
    },
    facture: {
      label: getStatutLabel(statut),
      className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700",
      icon: FileText,
    },
    annule: {
      label: getStatutLabel(statut),
      className: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700",
      icon: Ban,
    },
  };
  return configs[statut] || { label: getStatutLabel(statut), className: "bg-muted text-muted-foreground", icon: null };
};

// Helpers
export const getTypeFromLignes = (ordre: any): string => {
  if (ordre.lignes && ordre.lignes.length > 0) {
    const firstLigne = ordre.lignes[0];
    if (firstLigne.type_operation) {
      return firstLigne.type_operation.toLowerCase();
    }
  }
  return '';
};

export { Container, Ship, Truck };
