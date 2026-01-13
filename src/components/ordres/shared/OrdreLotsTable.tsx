import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package } from "lucide-react";
import { formatMontant } from "@/data/mockData";

interface Lot {
  id: string | number;
  designation?: string;
  quantite: number;
  prix_unitaire: number;
  montant_ht?: number;
}

interface OrdreLotsTableProps {
  lots: Lot[];
}

export function OrdreLotsTable({ lots }: OrdreLotsTableProps) {
  if (!lots || lots.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            Lots
            <Badge variant="secondary" className="ml-2">{lots.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Désignation</TableHead>
                <TableHead className="text-center">Quantité</TableHead>
                <TableHead className="text-right">Prix unitaire</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lots.map((lot, index) => (
                <motion.tr
                  key={lot.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b hover:bg-muted/50 transition-colors"
                >
                  <TableCell>{lot.designation}</TableCell>
                  <TableCell className="text-center">{lot.quantite}</TableCell>
                  <TableCell className="text-right">
                    {formatMontant(lot.prix_unitaire)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMontant(lot.montant_ht || lot.quantite * lot.prix_unitaire)}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
