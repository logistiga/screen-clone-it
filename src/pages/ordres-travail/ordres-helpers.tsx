import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Container, Package, Truck, Ship, ArrowUpFromLine, ArrowDownToLine,
  Clock, RotateCcw, Warehouse, Calendar, FileText, Ban,
} from "lucide-react";
import { getStatutLabel } from "@/data/mockData";

interface TypeConfig {
  label: string;
  icon: React.ReactNode;
  className: string;
}

const typeIndepConfigs: Record<string, TypeConfig> = {
  transport: { label: "Transport", icon: <Truck className="h-3 w-3" />, className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-200 dark:border-green-700" },
  manutention: { label: "Manutention", icon: <Package className="h-3 w-3" />, className: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-700" },
  stockage: { label: "Stockage", icon: <Warehouse className="h-3 w-3" />, className: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-700" },
  location: { label: "Location", icon: <Calendar className="h-3 w-3" />, className: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-200 dark:border-teal-700" },
  double_relevage: { label: "Double Relevage", icon: <RotateCcw className="h-3 w-3" />, className: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/40 dark:text-pink-200 dark:border-pink-700" },
};

const typeConteneurConfigs: Record<string, TypeConfig> = {
  import: { label: "Import", icon: <ArrowDownToLine className="h-3 w-3" />, className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700" },
  export: { label: "Export", icon: <ArrowUpFromLine className="h-3 w-3" />, className: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-200 dark:border-cyan-700" },
};

export const statutOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "en_cours", label: "En cours" },
  { value: "termine", label: "Terminé" },
  { value: "facture", label: "Facturé" },
  { value: "annule", label: "Annulé" },
];

export const categorieOptions = [
  { value: "all", label: "Toutes catégories" },
  { value: "conteneurs", label: "Conteneurs" },
  { value: "conventionnel", label: "Conventionnel" },
  { value: "operations_independantes", label: "Indépendant" },
];

const getTypeFromLignes = (ordre: any): string => {
  if (ordre.lignes && ordre.lignes.length > 0) {
    const firstLigne = ordre.lignes[0];
    if (firstLigne.type_operation) return firstLigne.type_operation.toLowerCase();
  }
  return "";
};

export function getStatutBadge(statut: string) {
  const configs: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    en_cours: { label: getStatutLabel(statut), className: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700", icon: <Clock className="h-3 w-3" /> },
    termine: { label: getStatutLabel(statut), className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700", icon: null },
    facture: { label: getStatutLabel(statut), className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700", icon: <FileText className="h-3 w-3" /> },
    annule: { label: getStatutLabel(statut), className: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700", icon: <Ban className="h-3 w-3" /> },
  };
  const config = configs[statut] || { label: getStatutLabel(statut), className: "bg-muted text-muted-foreground", icon: null };
  return (
    <Badge variant="outline" className={`${config.className} flex items-center gap-1 transition-all duration-200 hover:scale-105`}>
      {config.icon}
      {config.label}
    </Badge>
  );
}

export function getTypeBadge(ordre: any) {
  const { categorie, type_operation, type_operation_indep } = ordre;

  if (categorie === "conteneurs") {
    const typeOp = type_operation?.toLowerCase() || "";
    if (typeOp.includes("import") || typeOp === "import") {
      const config = typeConteneurConfigs.import;
      return <Badge className={`${config.className} flex items-center gap-1.5 transition-all duration-200 hover:scale-105 font-medium`}>{config.icon}<span>Conteneurs / Import</span></Badge>;
    }
    if (typeOp.includes("export") || typeOp === "export") {
      const config = typeConteneurConfigs.export;
      return <Badge className={`${config.className} flex items-center gap-1.5 transition-all duration-200 hover:scale-105 font-medium`}>{config.icon}<span>Conteneurs / Export</span></Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 flex items-center gap-1.5 transition-all duration-200 hover:scale-105 font-medium"><Container className="h-3 w-3" />Conteneurs</Badge>;
  }

  if (categorie === "operations_independantes") {
    let typeIndep = type_operation_indep?.toLowerCase() || type_operation?.toLowerCase() || "";
    if (!typeIndep || !typeIndepConfigs[typeIndep]) typeIndep = getTypeFromLignes(ordre);
    const config = typeIndepConfigs[typeIndep];
    if (config) {
      return <Badge className={`${config.className} flex items-center gap-1.5 transition-all duration-200 hover:scale-105 font-medium`}>{config.icon}<span>Indépendant / {config.label}</span></Badge>;
    }
    return <Badge className="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 flex items-center gap-1.5 transition-all duration-200 hover:scale-105 font-medium"><Truck className="h-3 w-3" />Indépendant</Badge>;
  }

  if (categorie === "conventionnel") {
    return <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-200 flex items-center gap-1.5 transition-all duration-200 hover:scale-105 font-medium"><Ship className="h-3 w-3" />Conventionnel</Badge>;
  }

  return <Badge className="bg-muted text-muted-foreground flex items-center gap-1.5">{categorie || "N/A"}</Badge>;
}
