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
import { Truck } from "lucide-react";
import { formatMontant, formatDate } from "@/data/mockData";

interface Ligne {
  id: string | number;
  description?: string;
  type_operation?: string;
  lieu_depart?: string;
  lieu_arrivee?: string;
  date_debut?: string;
  date_fin?: string;
  quantite: number;
  prix_unitaire: number;
  montant_ht?: number;
}

interface OrdrePrestationsTableProps {
  lignes: Ligne[];
}

export function OrdrePrestationsTable({ lignes }: OrdrePrestationsTableProps) {
  if (!lignes || lignes.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
        <CardHeader className="bg-gradient-to-r from-green-500/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-green-600" />
            Prestations
            <Badge variant="secondary" className="ml-2">{lignes.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Description</TableHead>
                <TableHead>Trajet / Lieu</TableHead>
                <TableHead>Période</TableHead>
                <TableHead className="text-center">Qté</TableHead>
                <TableHead className="text-right">Prix unit.</TableHead>
                <TableHead className="text-right">Montant HT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lignes.map((ligne, index) => (
                <motion.tr
                  key={ligne.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b hover:bg-muted/50 transition-colors"
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{ligne.description || ligne.type_operation}</span>
                      {ligne.type_operation && ligne.description && (
                        <span className="text-xs text-muted-foreground capitalize">{ligne.type_operation}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(ligne.lieu_depart || ligne.lieu_arrivee) ? (
                      <div className="flex items-center gap-1 text-sm">
                        {ligne.lieu_depart && <span>{ligne.lieu_depart}</span>}
                        {ligne.lieu_depart && ligne.lieu_arrivee && <span className="text-muted-foreground">→</span>}
                        {ligne.lieu_arrivee && <span>{ligne.lieu_arrivee}</span>}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {(ligne.date_debut || ligne.date_fin) ? (
                      <div className="text-sm">
                        {ligne.date_debut && <span>{formatDate(ligne.date_debut)}</span>}
                        {ligne.date_debut && ligne.date_fin && <span className="text-muted-foreground"> → </span>}
                        {ligne.date_fin && <span>{formatDate(ligne.date_fin)}</span>}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{ligne.quantite}</TableCell>
                  <TableCell className="text-right">
                    {formatMontant(ligne.prix_unitaire)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-primary">
                    {formatMontant(ligne.montant_ht || ligne.quantite * ligne.prix_unitaire)}
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
