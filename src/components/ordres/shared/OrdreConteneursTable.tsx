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
import { Container } from "lucide-react";
import { formatMontant } from "@/data/mockData";

interface Conteneur {
  id: string | number;
  numero: string;
  type?: string;
  taille?: string;
  montant_ht?: number;
}

interface OrdreConteneursTableProps {
  conteneurs: Conteneur[];
}

export function OrdreConteneursTable({ conteneurs }: OrdreConteneursTableProps) {
  if (!conteneurs || conteneurs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Container className="h-5 w-5 text-blue-600" />
            Conteneurs
            <Badge variant="secondary" className="ml-2">{conteneurs.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Numéro</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Taille</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conteneurs.map((conteneur, index) => (
                <motion.tr
                  key={conteneur.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-mono font-medium">{conteneur.numero}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{conteneur.type}</Badge>
                  </TableCell>
                  <TableCell>{conteneur.taille}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMontant(conteneur.montant_ht || 0)}
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
