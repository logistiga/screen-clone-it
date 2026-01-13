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
import { Gift, Users } from "lucide-react";
import { formatMontant } from "@/data/mockData";

interface Prime {
  id: string | number;
  montant: number;
  montant_paye?: number;
  reste_a_payer?: number;
  transitaire_id?: string | number | null;
  transitaire?: { nom?: string } | null;
  representant?: { nom?: string; prenom?: string } | null;
}

interface OrdrePrimesTableProps {
  primes: Prime[];
}

export function OrdrePrimesTable({ primes }: OrdrePrimesTableProps) {
  if (!primes || primes.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
    >
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
        <CardHeader className="bg-gradient-to-r from-pink-500/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-pink-600" />
            Primes partenaires
            <Badge variant="secondary" className="ml-2">{primes.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Bénéficiaire</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-right">Payé</TableHead>
                <TableHead className="text-right">Reste</TableHead>
                <TableHead className="text-center">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {primes.map((prime, index) => {
                const montantPaye = prime.montant_paye || 0;
                const resteAPayer = prime.reste_a_payer ?? (prime.montant - montantPaye);
                const isPaid = resteAPayer <= 0;
                const beneficiaire = prime.transitaire?.nom || prime.representant?.nom || prime.representant?.prenom || 'N/A';
                const typePrime = prime.transitaire_id ? 'Transitaire' : 'Représentant';

                return (
                  <motion.tr
                    key={prime.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{beneficiaire}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={prime.transitaire_id ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}>
                        {typePrime}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMontant(prime.montant)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatMontant(montantPaye)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={resteAPayer > 0 ? 'text-amber-600 font-medium' : 'text-green-600'}>
                        {formatMontant(resteAPayer)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={isPaid
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                        }
                      >
                        {isPaid ? 'Payée' : 'En attente'}
                      </Badge>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
