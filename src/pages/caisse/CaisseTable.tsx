import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, ArrowDownCircle, FileText, Receipt, ClipboardList } from "lucide-react";
import { MouvementCaisseActions } from "@/components/caisse/MouvementCaisseActions";
import { formatMontant, formatDate } from "@/data/mockData";

const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

interface CaisseTableProps {
  mouvements: any[];
  hasFilters: boolean;
  onClearFilters: () => void;
  onRefetch: () => void;
}

export function CaisseTable({ mouvements, hasFilters, onClearFilters, onRefetch }: CaisseTableProps) {
  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          Mouvements de caisse (Espèces)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/50">
                <TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Description</TableHead>
                <TableHead>N° Ordre</TableHead><TableHead>Client</TableHead>
                <TableHead className="text-right">Montant</TableHead><TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mouvements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="h-8 w-8 opacity-50" />
                      <p>Aucun mouvement trouvé</p>
                      {hasFilters && <Button variant="link" onClick={onClearFilters} className="text-primary">Réinitialiser les filtres</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                mouvements.map((mouvement: any, index: number) => (
                  <motion.tr key={mouvement.id} variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: index * 0.03 }} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="text-muted-foreground">{formatDate(mouvement.date || mouvement.date_mouvement)}</TableCell>
                    <TableCell>
                      {mouvement.type === 'entree' ? (
                        <Badge className="bg-success/20 text-success gap-1"><ArrowDownCircle className="h-3 w-3" />Entrée</Badge>
                      ) : (
                        <Badge className="bg-destructive/20 text-destructive gap-1"><ArrowUpCircle className="h-3 w-3" />Sortie</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{mouvement.description}</TableCell>
                    <TableCell>
                      {mouvement.document_numero ? (
                        <Badge variant="outline" className="gap-1">
                          {mouvement.document_type === 'ordre' ? <ClipboardList className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                          {mouvement.document_numero}
                        </Badge>
                      ) : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>{mouvement.client_nom || mouvement.beneficiaire || <span className="text-muted-foreground">-</span>}</TableCell>
                    <TableCell className={`text-right font-semibold ${mouvement.type === 'entree' ? 'text-success' : 'text-destructive'}`}>
                      {mouvement.type === 'entree' ? '+' : '-'}{formatMontant(mouvement.montant)}
                    </TableCell>
                    <TableCell><MouvementCaisseActions mouvement={mouvement} onSuccess={onRefetch} /></TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
