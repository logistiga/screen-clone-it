import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, CreditCard, Edit, Trash2 } from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { Banque } from "@/lib/api/commercial";

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

interface BanquesTableProps {
  banques: Banque[];
  onEdit: (b: Banque) => void;
  onDelete: (b: Banque) => void;
  onToggleActif: (b: Banque) => void;
  onClearSearch: () => void;
}

export function BanquesTable({ banques, onEdit, onDelete, onToggleActif, onClearSearch }: BanquesTableProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Liste des comptes bancaires
            <span className="ml-2 text-sm font-normal text-muted-foreground">({banques.length} {banques.length > 1 ? "comptes" : "compte"})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {banques.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Aucun compte ne correspond à votre recherche</p>
              <Button variant="outline" className="mt-4" onClick={onClearSearch}>Réinitialiser la recherche</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Banque</TableHead><TableHead>N° Compte</TableHead><TableHead>IBAN</TableHead>
                  <TableHead>SWIFT</TableHead><TableHead className="text-right">Solde</TableHead>
                  <TableHead className="text-center">Statut</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banques.map((banque) => (
                  <motion.tr key={banque.id} variants={itemVariants} className="border-b transition-colors hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${banque.actif ? 'bg-primary/10' : 'bg-muted'}`}>
                          <Building2 className={`h-4 w-4 ${banque.actif ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <p className="font-medium">{banque.nom}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{banque.numero_compte || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{banque.iban || '-'}</TableCell>
                    <TableCell className="font-mono">{banque.swift || '-'}</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-medium ${(banque.solde || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatMontant(banque.solde || 0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch checked={banque.actif} onCheckedChange={() => onToggleActif(banque)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(banque)} className="transition-all duration-200 hover:scale-110 hover:bg-primary/10"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive transition-all duration-200 hover:scale-110 hover:bg-destructive/10" onClick={() => onDelete(banque)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
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
