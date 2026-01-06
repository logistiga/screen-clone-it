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
import { Plus } from "lucide-react";
import { formatMontant, formatDate } from "@/data/mockData";

// Données mock pour les annulations
const annulations = [
  {
    id: '1',
    numero: 'AV-2026-0001',
    type: 'facture',
    documentNumero: 'FAC-2025-0045',
    client: 'TOTAL GABON',
    montant: 1500000,
    date: '2026-01-02',
    motif: 'Erreur de facturation - doublon',
    avoirGenere: true,
  },
  {
    id: '2',
    numero: 'AV-2026-0002',
    type: 'ordre',
    documentNumero: 'OT-2025-0089',
    client: 'COMILOG',
    montant: 750000,
    date: '2026-01-04',
    motif: 'Service non effectué',
    avoirGenere: false,
  },
];

export default function AnnulationsPage() {
  const totalAnnulations = annulations.reduce((sum, a) => sum + a.montant, 0);

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      devis: "bg-gray-100 text-gray-800",
      ordre: "bg-blue-100 text-blue-800",
      facture: "bg-purple-100 text-purple-800",
    };
    return <Badge className={colors[type]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Badge>;
  };

  return (
    <MainLayout title="Annulations & Avoirs">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Annulations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{annulations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Montant Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatMontant(totalAnnulations)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avoirs Générés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {annulations.filter(a => a.avoirGenere).length}
              </div>
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
                {annulations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Aucune annulation
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
