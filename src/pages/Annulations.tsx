import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Ban } from "lucide-react";
import { formatMontant, formatDate } from "@/data/mockData";

interface Annulation {
  id: string;
  numero: string;
  type: "devis" | "ordre" | "facture";
  documentNumero: string;
  client: string;
  montant: number;
  date: string;
  motif: string;
  avoirGenere: boolean;
}

export default function AnnulationsPage() {
  // Données en mémoire uniquement - perdues au refresh
  const [annulations] = useState<Annulation[]>([]);

  const totalAnnulations = annulations.reduce((sum, a) => sum + a.montant, 0);

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      devis: "bg-gray-100 text-gray-800",
      ordre: "bg-blue-100 text-blue-800",
      facture: "bg-purple-100 text-purple-800",
    };
    return <Badge className={colors[type]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Badge>;
  };

  // État vide
  if (annulations.length === 0) {
    return (
      <MainLayout title="Annulations & Avoirs">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Ban className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Aucune annulation</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Les annulations de devis, ordres et factures apparaîtront ici.
          </p>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle annulation
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Annulations & Avoirs">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Annulations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{annulations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Montant Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatMontant(totalAnnulations)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avoirs Générés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{annulations.filter(a => a.avoirGenere).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle annulation
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>N° Avoir</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Avoir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {annulations.map((annulation) => (
                  <TableRow key={annulation.id}>
                    <TableCell className="font-medium">{annulation.numero}</TableCell>
                    <TableCell>{getTypeBadge(annulation.type)}</TableCell>
                    <TableCell>{annulation.documentNumero}</TableCell>
                    <TableCell>{annulation.client}</TableCell>
                    <TableCell>{formatDate(annulation.date)}</TableCell>
                    <TableCell className="text-right text-destructive font-medium">
                      -{formatMontant(annulation.montant)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{annulation.motif}</TableCell>
                    <TableCell>
                      {annulation.avoirGenere ? (
                        <Badge variant="default">Généré</Badge>
                      ) : (
                        <Badge variant="outline">Non généré</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
