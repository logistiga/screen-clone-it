import React from "react";
import { useNavigate } from "react-router-dom";
import { roundMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnimatedTableRow, AnimatedTableBody } from "@/components/ui/animated-table";
import { Eye, Wallet, Mail, Ban, Trash2, Edit, Download, RotateCcw, FileDown, Container, Package, Truck } from "lucide-react";
import { toast } from "sonner";
import { formatMontant, formatDate, getStatutLabel } from "@/data/mockData";
import { TablePagination } from "@/components/TablePagination";

const getStatutBadge = (statut: string) => {
  const configs: Record<string, { className: string }> = {
    brouillon: { className: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-200 dark:border-gray-700" },
    emise: { className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700" },
    validee: { className: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-700" },
    payee: { className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700" },
    partiellement_payee: { className: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700" },
    impayee: { className: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700" },
    annulee: { className: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700" },
  };
  const config = configs[statut] || { className: "bg-gray-100 text-gray-800" };
  return <Badge variant="outline" className={`${config.className} transition-all duration-200 hover:scale-105`}>{getStatutLabel(statut)}</Badge>;
};

const getCategorieBadge = (categorie?: string) => {
  const configs: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    conteneurs: { label: "Conteneurs", icon: <Container className="h-3 w-3" />, className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
    conventionnel: { label: "Conventionnel", icon: <Package className="h-3 w-3" />, className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
    operations_independantes: { label: "Indépendant", icon: <Truck className="h-3 w-3" />, className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  };
  const config = configs[categorie || ''] || { label: categorie || 'N/A', icon: null, className: "bg-gray-100 text-gray-800" };
  return <Badge className={`${config.className} flex items-center gap-1 transition-all duration-200 hover:scale-105`}>{config.icon}{config.label}</Badge>;
};

interface FacturesTableProps {
  facturesList: any[];
  tableRenderKey: string;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  onDelete: (item: { id: string; numero: string }) => void;
  onEmail: (f: any) => void;
  onPaiement: (p: any) => void;
  onAnnulation: (a: any) => void;
  onAnnulationPaiement: (a: { id: string; numero: string }) => void;
}

export function FacturesTable({
  facturesList, tableRenderKey,
  currentPage, totalPages, pageSize, totalItems,
  onPageChange, onPageSizeChange,
  onDelete, onEmail, onPaiement, onAnnulation, onAnnulationPaiement,
}: FacturesTableProps) {
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Numéro</TableHead><TableHead>Client</TableHead><TableHead>Date</TableHead>
              <TableHead>Catégorie</TableHead><TableHead>Ordre</TableHead>
              <TableHead className="text-right">Total TTC</TableHead><TableHead className="text-right">Payé</TableHead>
              <TableHead>Statut</TableHead><TableHead className="w-44">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <AnimatedTableBody key={tableRenderKey}>
            {facturesList.map((facture: any, index: number) => {
              const resteAPayer = roundMoney((facture.montant_ttc || 0) - (facture.montant_paye || 0));
              return (
                <AnimatedTableRow key={facture.id} index={index} className="cursor-pointer">
                  <TableCell className="font-medium text-primary hover:underline cursor-pointer" onClick={() => navigate(`/factures/${facture.id}`)}>{facture.numero}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">{facture.client?.nom?.substring(0, 2).toUpperCase() || '??'}</div>
                      <span className="truncate max-w-[150px]">{facture.client?.nom}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(facture.date_facture || facture.date || facture.created_at)}</TableCell>
                  <TableCell>{getCategorieBadge(facture.categorie)}</TableCell>
                  <TableCell>
                    {facture.ordre_travail?.numero ? (
                      <span className="text-sm font-medium text-primary hover:underline cursor-pointer" onClick={() => navigate(`/ordres/${facture.ordre_travail.id}`)}>{facture.ordre_travail.numero}</span>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatMontant(facture.montant_ttc)}</TableCell>
                  <TableCell className="text-right">
                    <span className={(facture.montant_paye || 0) > 0 ? "text-emerald-600 dark:text-emerald-400" : ""}>{formatMontant(facture.montant_paye)}</span>
                    {resteAPayer > 0 && facture.statut !== 'payee' && <div className="text-xs text-destructive">Reste: {formatMontant(resteAPayer)}</div>}
                  </TableCell>
                  <TableCell>{getStatutBadge(facture.statut)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" title="Voir" onClick={() => navigate(`/factures/${facture.id}`)} className="transition-all duration-200 hover:scale-110 hover:bg-primary/10"><Eye className="h-4 w-4" /></Button>
                      {facture.statut !== 'payee' && facture.statut !== 'annulee' && (
                        <Button variant="ghost" size="icon" title="Modifier" onClick={() => navigate(`/factures/${facture.id}/modifier`)} className="transition-all duration-200 hover:scale-110 hover:bg-blue-500/10"><Edit className="h-4 w-4" /></Button>
                      )}
                      {facture.statut !== 'payee' && facture.statut !== 'annulee' && resteAPayer > 0 && (
                        <Button variant="ghost" size="icon" title="Paiement" className="text-emerald-600 transition-all duration-200 hover:scale-110 hover:bg-emerald-500/10"
                          onClick={() => onPaiement({
                            id: facture.id, numero: facture.numero, montantRestant: resteAPayer,
                            clientId: facture.client?.id ? Number(facture.client.id) : undefined,
                            montantHT: facture.montant_ht || 0, montantDejaPaye: facture.montant_paye || 0,
                            exonereTva: facture.exonere_tva || false, exonereCss: facture.exonere_css || false,
                          })}><Wallet className="h-4 w-4" /></Button>
                      )}
                      {facture.statut !== 'annulee' && (facture.montant_paye || 0) > 0 && (
                        <Button variant="ghost" size="icon" title="Annuler le paiement" className="text-amber-600 transition-all duration-200 hover:scale-110 hover:bg-amber-500/10"
                          onClick={() => onAnnulationPaiement({ id: facture.id, numero: facture.numero })}><RotateCcw className="h-4 w-4" /></Button>
                      )}
                      <Button variant="ghost" size="icon" title="Email" className="text-blue-600 transition-all duration-200 hover:scale-110 hover:bg-blue-500/10" onClick={() => onEmail(facture)}><Mail className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title="Voir PDF" onClick={() => window.open(`/factures/${facture.id}/pdf`, '_blank')} className="transition-all duration-200 hover:scale-110 hover:bg-muted"><Eye className="h-4 w-4 text-indigo-600" /></Button>
                      <Button variant="ghost" size="icon" title="Télécharger PDF" className="transition-all duration-200 hover:scale-110 hover:bg-emerald-500/10"
                        onClick={() => { const link = document.createElement('a'); link.href = `/factures/${facture.id}/pdf`; link.setAttribute('download', `${facture.numero}.pdf`); link.target = '_blank'; document.body.appendChild(link); link.click(); document.body.removeChild(link); }}>
                        <Download className="h-4 w-4 text-emerald-600" />
                      </Button>
                      {facture.statut !== 'annulee' && (
                        <Button variant="ghost" size="icon" title="Annuler" className="text-orange-600 transition-all duration-200 hover:scale-110 hover:bg-orange-500/10"
                          onClick={() => onAnnulation({ id: facture.id, numero: facture.numero, montantTTC: facture.montant_ttc || 0, montantPaye: facture.montant_paye || 0, clientNom: facture.client?.nom || "" })}>
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                      {facture.statut !== 'annulee' && (
                        <Button variant="ghost" size="icon" title="Supprimer" className="text-destructive transition-all duration-200 hover:scale-110 hover:bg-red-500/10" onClick={() => onDelete({ id: facture.id, numero: facture.numero })}><Trash2 className="h-4 w-4" /></Button>
                      )}
                      {facture.statut === 'annulee' && (
                        <Button variant="ghost" size="icon" title="Télécharger l'avoir" className="text-destructive transition-all duration-200 hover:scale-110 hover:bg-destructive/10"
                          onClick={async () => {
                            if (facture.annulation?.id) { navigate(`/annulations/${facture.annulation.id}/avoir`); return; }
                            try {
                              const { ensureAvoirFacture } = await import("@/lib/api/annulations");
                              const result = await ensureAvoirFacture(Number(facture.id));
                              if (result.annulation?.id) navigate(`/annulations/${result.annulation.id}/avoir`);
                              else toast.error("Impossible de générer l'avoir");
                            } catch (err: any) { toast.error(err?.response?.data?.message || "Erreur lors de la génération de l'avoir"); }
                          }}><FileDown className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </TableCell>
                </AnimatedTableRow>
              );
            })}
            {facturesList.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Aucune facture trouvée avec ces critères</TableCell></TableRow>
            )}
          </AnimatedTableBody>
        </Table>
        <TablePagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={totalItems} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />
      </CardContent>
    </Card>
  );
}
