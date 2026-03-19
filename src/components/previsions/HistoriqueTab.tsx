import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Historique } from "@/lib/api/previsions";

interface HistoriqueTabProps {
  historique: Historique | undefined;
  annee: number;
  mois: number;
  formatMontant: (montant: number) => string;
  formatMontantFull: (montant: number) => string;
}

export function HistoriqueTab({ historique, annee, mois, formatMontant, formatMontantFull }: HistoriqueTabProps) {
  const chartData = historique?.historique?.map(h => ({
    mois: h.mois_nom.substring(0, 3),
    recettes: h.recettes_realisees,
    depenses: h.depenses_realisees,
    benefice: h.benefice,
  })) || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Évolution mensuelle {annee}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mois" />
                <YAxis tickFormatter={(v) => formatMontant(v)} />
                <Tooltip formatter={(value: number) => formatMontantFull(value)} />
                <Legend />
                <Bar dataKey="recettes" name="Recettes" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="depenses" name="Dépenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Récapitulatif annuel</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mois</TableHead>
                <TableHead className="text-right">Recettes</TableHead>
                <TableHead className="text-right">Dépenses</TableHead>
                <TableHead className="text-right">Bénéfice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historique?.historique?.map((h) => (
                <TableRow key={h.mois} className={h.mois === mois ? 'bg-primary/5' : ''}>
                  <TableCell className="font-medium">{h.mois_nom}</TableCell>
                  <TableCell className="text-right text-success">{formatMontant(h.recettes_realisees)}</TableCell>
                  <TableCell className="text-right text-destructive">{formatMontant(h.depenses_realisees)}</TableCell>
                  <TableCell className={`text-right font-bold ${h.benefice >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {h.benefice >= 0 ? '+' : ''}{formatMontant(h.benefice)}
                  </TableCell>
                </TableRow>
              ))}
              {historique?.totaux && (
                <TableRow className="bg-muted font-bold">
                  <TableCell>TOTAL {annee}</TableCell>
                  <TableCell className="text-right text-success">{formatMontant(historique.totaux.recettes_realisees)}</TableCell>
                  <TableCell className="text-right text-destructive">{formatMontant(historique.totaux.depenses_realisees)}</TableCell>
                  <TableCell className={`text-right ${historique.totaux.benefice_total >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {historique.totaux.benefice_total >= 0 ? '+' : ''}{formatMontant(historique.totaux.benefice_total)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
