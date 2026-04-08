import React from "react";
import { Plus, Edit, Trash2, Eye, Shield, Download, Activity } from "lucide-react";

// Couleurs pour les graphiques
export const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
];

// Labels et icônes pour les actions
export const actionConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  create: { label: "Création", icon: <Plus className="h-3 w-3" />, color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  update: { label: "Modification", icon: <Edit className="h-3 w-3" />, color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  delete: { label: "Suppression", icon: <Trash2 className="h-3 w-3" />, color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  view: { label: "Consultation", icon: <Eye className="h-3 w-3" />, color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
  login: { label: "Connexion", icon: <Shield className="h-3 w-3" />, color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  logout: { label: "Déconnexion", icon: <Shield className="h-3 w-3" />, color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  export: { label: "Export", icon: <Download className="h-3 w-3" />, color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400" },
};

export const moduleLabels: Record<string, string> = {
  clients: "Clients", devis: "Devis", factures: "Factures",
  ordres: "Ordres de travail", paiements: "Paiements", banques: "Banques",
  caisse: "Caisse", users: "Utilisateurs", auth: "Authentification",
  configuration: "Configuration", reporting: "Reporting",
};

export const getActionConfig = (action: string) => {
  return actionConfig[action.toLowerCase()] || {
    label: action,
    icon: <Activity className="h-3 w-3" />,
    color: "bg-muted text-muted-foreground"
  };
};

export const getModuleLabel = (module: string) => {
  return moduleLabels[module?.toLowerCase()] || module || "Système";
};

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

export const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};
