import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Eye, Edit, ArrowRight, FileText, Ban, Trash2, MessageCircle, Mail,
  FileCheck, Check, Container, Package, Wrench,
} from "lucide-react";
import { formatMontant, getStatutLabel } from "@/data/mockData";
import { TablePagination } from "@/components/TablePagination";
import { getOperationsIndepLabels, TypeOperationIndep } from "@/types/documents";
import { cn } from "@/lib/utils";

const getStatutBadge = (statut: string) => {
  const config: Record<string, { className: string }> = {
    brouillon: { className: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/30 dark:text-gray-200" },
    envoye: { className: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200" },
    accepte: { className: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200" },
    refuse: { className: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-200" },
    expire: { className: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200" },
    converti: { className: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-200" },
  };
  const style = config[statut] || config.brouillon;
  return (
    <Badge variant="outline" className={`${style.className} transition-all duration-200 hover:scale-105`}>
      {getStatutLabel(statut)}
    </Badge>
  );
};

const getCategorieBadge = (typeDocument: string) => {
  const config: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    Conteneur: { label: "Conteneurs", icon: <Container className="h-3 w-3" />, className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200" },
    Lot: { label: "Conventionnel", icon: <Package className="h-3 w-3" />, className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200" },
    Independant: { label: "Indépendant", icon: <Wrench className="h-3 w-3" />, className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200" },
  };
  const cat = config[typeDocument] || config.Conteneur;
  return (
    <Badge variant="outline" className={cn("flex items-center gap-1", cat.className)}>
      {cat.icon}
      {cat.label}
    </Badge>
  );
};

const getTypeOperationLabel = (typeDoc: string, typeOp?: string | null) => {
  if (typeDoc === 'Conteneur') return typeOp || '-';
  if (typeDoc === 'Independant' && typeOp) {
    const labels = getOperationsIndepLabels();
    return labels[typeOp as TypeOperationIndep]?.label || typeOp;
  }
  return '-';
};

interface DevisTableProps {
  filteredDevis: any[];
  tableRenderKey: string;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  onConfirmAction: (type: 'annuler' | 'supprimer' | 'convertir' | 'facturer' | 'valider', id: string, numero: string) => void;
  onWhatsApp: (d: any) => void;
  onEmail: (d: any) => void;
}

export function DevisTable({
  filteredDevis, tableRenderKey,
  currentPage, totalPages, pageSize, totalItems,
  onPageChange, onPageSizeChange,
  onConfirmAction, onWhatsApp, onEmail,
}: DevisTableProps) {
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Numéro</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Type d'opération</TableHead>
              <TableHead className="text-right">Montant TTC</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-48">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody key={tableRenderKey}>
            {filteredDevis.map((d, index) => (
              <TableRow key={d.id} className="hover:bg-muted/50 transition-all duration-200 animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                <TableCell className="font-medium text-primary hover:underline cursor-pointer" onClick={() => navigate(`/devis/${d.id}`)}>
                  {d.numero}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {d.client?.nom?.substring(0, 2)?.toUpperCase() || '??'}
                    </div>
                    <span className="truncate max-w-[150px]">{d.client?.nom}</span>
                  </div>
                </TableCell>
                <TableCell>{getCategorieBadge(d.type_document)}</TableCell>
                <TableCell>{getTypeOperationLabel(d.type_document, d.type_operation_indep ?? d.type_operation ?? d.lignes?.[0]?.type_operation)}</TableCell>
                <TableCell className="text-right font-semibold">{formatMontant(d.montant_ttc)}</TableCell>
                <TableCell>{getStatutBadge(d.statut)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" title="Voir" className="h-8 w-8 transition-all duration-200 hover:scale-110 hover:bg-primary/10" onClick={() => navigate(`/devis/${d.id}`)}><Eye className="h-4 w-4" /></Button>
                    {d.statut !== 'refuse' && d.statut !== 'expire' && d.statut !== 'accepte' && (
                      <Button variant="ghost" size="icon" title="Modifier" className="h-8 w-8 transition-all duration-200 hover:scale-110 hover:bg-blue-500/10" onClick={() => navigate(`/devis/${d.id}/modifier`)}><Edit className="h-4 w-4" /></Button>
                    )}
                    <Button variant="ghost" size="icon" title="PDF" className="h-8 w-8 transition-all duration-200 hover:scale-110 hover:bg-muted" onClick={() => window.open(`/devis/${d.id}/pdf`, '_blank')}><FileText className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Email" className="h-8 w-8 text-blue-600 transition-all duration-200 hover:scale-110 hover:bg-blue-500/10" onClick={() => onEmail(d)}><Mail className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="WhatsApp" className="h-8 w-8 text-emerald-600 transition-all duration-200 hover:scale-110 hover:bg-emerald-500/10" onClick={() => onWhatsApp(d)}><MessageCircle className="h-4 w-4" /></Button>
                    {(d.statut === 'brouillon' || d.statut === 'envoye') && (
                      <Button variant="ghost" size="icon" title="Valider" className="h-8 w-8 text-emerald-600 transition-all duration-200 hover:scale-110 hover:bg-emerald-500/10" onClick={() => onConfirmAction('valider', d.id, d.numero)}><Check className="h-4 w-4" /></Button>
                    )}
                    {d.statut === 'accepte' && (
                      <>
                        <Button variant="ghost" size="icon" title="Convertir en ordre" className="h-8 w-8 text-primary transition-all duration-200 hover:scale-110 hover:bg-primary/10" onClick={() => onConfirmAction('convertir', d.id, d.numero)}><ArrowRight className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Facturer directement" className="h-8 w-8 text-green-600 transition-all duration-200 hover:scale-110 hover:bg-green-500/10" onClick={() => onConfirmAction('facturer', d.id, d.numero)}><FileCheck className="h-4 w-4" /></Button>
                      </>
                    )}
                    {d.statut !== 'refuse' && d.statut !== 'expire' && d.statut !== 'accepte' && (
                      <Button variant="ghost" size="icon" title="Annuler" className="h-8 w-8 text-orange-600 transition-all duration-200 hover:scale-110 hover:bg-orange-500/10" onClick={() => onConfirmAction('annuler', d.id, d.numero)}><Ban className="h-4 w-4" /></Button>
                    )}
                    <Button variant="ghost" size="icon" title="Supprimer" className="h-8 w-8 text-destructive transition-all duration-200 hover:scale-110 hover:bg-red-500/10" onClick={() => onConfirmAction('supprimer', d.id, d.numero)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredDevis.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucun devis trouvé avec ces critères</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={totalItems} onPageChange={onPageChange} onPageSizeChange={(s) => { onPageSizeChange(s); }} />
      </CardContent>
    </Card>
  );
}
