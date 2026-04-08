import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, ArrowDownCircle, Building2, Wallet, PieChart, FileText } from "lucide-react";
import { formatMontant, formatDate } from "@/data/mockData";

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

interface CaisseGlobaleTableProps {
  mouvements: any[];
  totalItems: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function CaisseGlobaleTable({ mouvements, totalItems, hasActiveFilters, onClearFilters }: CaisseGlobaleTableProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Tous les mouvements comptables
            <span className="ml-2 text-sm font-normal text-muted-foreground">({totalItems} {totalItems > 1 ? "mouvements" : "mouvement"})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {mouvements.length === 0 ? (
            <div className="py-12 text-center">
              <PieChart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Aucun mouvement pour cette période</p>
              {hasActiveFilters && <Button variant="outline" className="mt-4" onClick={onClearFilters}>Réinitialiser les filtres</Button>}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead><TableHead>Source</TableHead><TableHead>Type</TableHead>
                  <TableHead>Catégorie</TableHead><TableHead>Description</TableHead>
                  <TableHead>Client / Bénéficiaire</TableHead><TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mouvements.map((m: any) => (
                  <motion.tr key={m.id} variants={itemVariants} className="border-b transition-colors hover:bg-muted/50">
                    <TableCell>{formatDate(m.date_mouvement || m.date)}</TableCell>
                    <TableCell>
                      {m.source === 'caisse' ? (
                        <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"><Wallet className="h-3 w-3" />Caisse</Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"><Building2 className="h-3 w-3" />{m.banque?.nom || 'Banque'}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {m.type === 'entree' ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 gap-1"><ArrowDownCircle className="h-3 w-3" />Entrée</Badge>
                      ) : (
                        <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 gap-1"><ArrowUpCircle className="h-3 w-3" />Sortie</Badge>
                      )}
                    </TableCell>
                    <TableCell><span className="text-sm">{m.categorie || '-'}</span></TableCell>
                    <TableCell>{m.description}</TableCell>
                    <TableCell>{m.client_nom || m.beneficiaire || <span className="text-muted-foreground">-</span>}</TableCell>
                    <TableCell className={`text-right font-medium ${m.type === 'entree' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {m.type === 'entree' ? '+' : '-'}{formatMontant(m.montant)}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
