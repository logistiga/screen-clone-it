import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, FileText, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getActionConfig, getModuleLabel } from "./constants";
import type { AuditEntry } from "@/services/auditService";

interface TracabiliteTableProps {
  audits: AuditEntry[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onViewDetail: (audit: AuditEntry) => void;
}

const formatDateShort = (dateStr: string) => { try { return format(new Date(dateStr), "dd/MM/yyyy", { locale: fr }); } catch { return dateStr; } };
const formatTimeShort = (dateStr: string) => { try { return format(new Date(dateStr), "HH:mm", { locale: fr }); } catch { return ""; } };

export function TracabiliteTable({ audits, isLoading, page, totalPages, onPageChange, onViewDetail }: TracabiliteTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-32" /><Skeleton className="h-10 w-24" /><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 w-10" />
              </div>
            ))}
          </div>
        ) : audits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted mb-4"><FileText className="h-8 w-8 text-muted-foreground" /></div>
            <h3 className="font-medium text-lg">Aucun log trouvé</h3>
            <p className="text-sm text-muted-foreground mt-1">Aucune action ne correspond aux critères de recherche</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[140px]">Date & Heure</TableHead>
                  <TableHead className="w-[150px]">Utilisateur</TableHead>
                  <TableHead className="w-[120px]">Action</TableHead>
                  <TableHead className="w-[120px]">Module</TableHead>
                  <TableHead className="w-[120px]">Document</TableHead>
                  <TableHead>Détails</TableHead>
                  <TableHead className="w-[100px]">IP</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {audits.map((audit, index) => {
                    const actionCfg = getActionConfig(audit.action);
                    return (
                      <motion.tr key={audit.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ delay: index * 0.02 }} className="group hover:bg-muted/30 transition-colors">
                        <TableCell className="font-mono text-xs">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1"><Clock className="h-3 w-3 text-muted-foreground" />{formatDateShort(audit.created_at)}</div>
                            <span className="text-muted-foreground pl-4">{formatTimeShort(audit.created_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                              {(audit.user?.name || audit.user?.nom)?.charAt(0).toUpperCase() || "S"}
                            </div>
                            <span className="truncate max-w-[100px]">{audit.user?.name || audit.user?.nom || "Système"}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge className={`${actionCfg.color} gap-1`}>{actionCfg.icon}{actionCfg.label}</Badge></TableCell>
                        <TableCell><Badge variant="outline" className="font-normal">{getModuleLabel(audit.module)}</Badge></TableCell>
                        <TableCell>
                          {audit.document_numero ? <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{audit.document_numero}</code> : <span className="text-muted-foreground text-xs">—</span>}
                        </TableCell>
                        <TableCell><p className="text-sm truncate max-w-[300px]" title={audit.details || ""}>{audit.details || "—"}</p></TableCell>
                        <TableCell><code className="text-xs text-muted-foreground">{audit.ip_address || "—"}</code></TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onViewDetail(audit)}><Eye className="h-4 w-4" /></Button>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">Page {page} sur {totalPages}</div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                if (pageNum > totalPages) return null;
                return <Button key={pageNum} variant={page === pageNum ? "default" : "outline"} size="sm" onClick={() => onPageChange(pageNum)}>{pageNum}</Button>;
              })}
              <Button variant="outline" size="sm" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
