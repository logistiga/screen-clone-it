import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, ArrowUpCircle, CheckCircle2, Eye } from "lucide-react";
import { formatMontant } from "@/data/mockData";
import type { PaiementFournisseur } from "./usePaiementsFournisseursData";

interface PFTableProps {
  items: PaiementFournisseur[];
  onOpenDetail: (pf: PaiementFournisseur) => void;
  onOpenAvance: (pf: PaiementFournisseur) => void;
}

export function PFTable({ items, onOpenDetail, onOpenAvance }: PFTableProps) {
  return (
    <Card className="border-border/50 overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/50">
                <TableHead>Fournisseur</TableHead>
                <TableHead>Référence</TableHead>
                <TableHead>Montant total</TableHead>
                <TableHead>Payé</TableHead>
                <TableHead>Reste</TableHead>
                <TableHead>Progression</TableHead>
                <TableHead>Tranches</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Wallet className="h-8 w-8 opacity-50" />
                      <p>Aucune facture fournisseur trouvée</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-medium max-w-[180px] truncate">{item.fournisseur}</TableCell>
                    <TableCell className="font-mono text-sm">{item.reference}</TableCell>
                    <TableCell className="font-semibold">{formatMontant(item.montant_total)}</TableCell>
                    <TableCell className="text-success font-medium">{formatMontant(item.total_paye)}</TableCell>
                    <TableCell className={item.reste > 0 ? 'text-warning font-medium' : 'text-success'}>{formatMontant(item.reste)}</TableCell>
                    <TableCell className="min-w-[140px]">
                      <div className="space-y-1">
                        <Progress value={item.pourcentage} className="h-2" />
                        <span className="text-xs text-muted-foreground">{item.pourcentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{item.nombre_tranches}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => onOpenDetail(item)} className="gap-1">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!item.est_solde && (
                          <Button size="sm" onClick={() => onOpenAvance(item)} className="gap-1">
                            <ArrowUpCircle className="h-4 w-4" />Avancer
                          </Button>
                        )}
                        {item.est_solde && (
                          <Badge className="bg-success/20 text-success gap-1">
                            <CheckCircle2 className="h-3 w-3" />Soldée
                          </Badge>
                        )}
                      </div>
                    </TableCell>
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
