import { Fragment } from "react";
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

interface Operation {
  id?: string | number;
  type?: string;
  type_operation?: string;
  description?: string;
  quantite?: number;
  prix_unitaire?: number;
  prix_total?: number;
  montant_ht?: number;
}

interface Conteneur {
  id: string | number;
  numero: string;
  type?: string;
  taille?: string;
  description?: string;
  prix_unitaire?: number;
  montant_ht?: number;
  operations?: Operation[];
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
                <TableHead>Désignation</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Qté</TableHead>
                <TableHead className="text-right">Prix unit.</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conteneurs.map((conteneur, index) => {
                const ops = conteneur.operations || [];
                const baseHT = Number(conteneur.prix_unitaire ?? 0);
                return (
                  <Fragment key={conteneur.id}>
                    <TableRow key={`c-${conteneur.id}`} className="border-b bg-muted/20">
                      <TableCell className="font-mono font-medium">
                        {conteneur.numero}
                        {conteneur.taille && (
                          <Badge variant="outline" className="ml-2">{conteneur.taille}'</Badge>
                        )}
                        {conteneur.type && (
                          <Badge variant="secondary" className="ml-2">{conteneur.type}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{conteneur.description || '—'}</TableCell>
                      <TableCell className="text-center">1</TableCell>
                      <TableCell className="text-right">{formatMontant(baseHT)}</TableCell>
                      <TableCell className="text-right font-medium">{formatMontant(baseHT)}</TableCell>
                    </TableRow>
                    {ops.map((op, i) => {
                      const qte = Number(op.quantite ?? 1);
                      const pu = Number(op.prix_unitaire ?? 0);
                      const total = Number(op.prix_total ?? op.montant_ht ?? qte * pu);
                      return (
                        <TableRow key={op.id ?? `${conteneur.id}-op-${i}`} className="border-b hover:bg-muted/30">
                          <TableCell className="pl-8 text-sm text-muted-foreground">
                            ↳ {op.type_operation || op.type || 'Opération'}
                          </TableCell>
                          <TableCell className="text-sm">{op.description || '—'}</TableCell>
                          <TableCell className="text-center text-sm">{qte}</TableCell>
                          <TableCell className="text-right text-sm">{formatMontant(pu)}</TableCell>
                          <TableCell className="text-right text-sm font-medium">{formatMontant(total)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
